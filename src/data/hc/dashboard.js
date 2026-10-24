/* ============================================================================
 *  Dashboard médico (C3, spec §3 de la HCE y del documento HCD)
 *  - Alertas de condición sugeridas (§3.2): punto de partida; cada profesional
 *    marca las que correspondan o escribe la suya (las pautan los profesionales).
 *  - Prioridad visual por especialidad (§3.4): orden de los bloques del resumen.
 *    Definidas: Cardiología y Neumonología (spec §3.4), Clínica Médica,
 *    Clínica Médica (obesidad) y Endocrinología (bloque metabólico, C2/C3 21/10),
 *    Neurología y Reumatología (C2/C3 23/10, según su plantilla de C1), y
 *    Psicología y Traumatología (C2/C3 23/10). Psicología no tiene variables
 *    numéricas: su resumen es de sesiones (sin gráficos) y respeta la
 *    confidencialidad (las notas restringidas no aportan contenido).
 *    Infectología (§6.12) y Pediatría (§3.4 + §7.2; C2/C3 23/10): curvas de
 *    crecimiento por fecha con la edad de cada medición; los percentiles
 *    validados son Fase 2 de la spec.
 *    El resto usa el orden general hasta que sus profesionales pauten el propio.
 *  Bloques disponibles:
 *    alertas · diagnosticos · medicacion · vitales(vars) · estudios(tipos) ·
 *    tabaquismo · registro(campos) · edad · graficos(vars) · timeline · controles
 *  `registro`: datos estructurados de la plantilla (evolucion.datos) tomados de la
 *    última consulta de la especialidad que los tenga — p. ej. síntomas,
 *    articulaciones o laboratorio en texto, que no son series numéricas.
 *    Con `de: 'evolucion'` el campo es del core SOAP (motivo, subjetivo, plan).
 *    `formato(valor)` arma el texto (o varias líneas) de listas de filas.
 *  `vitales` con `conEdad`: muestra la edad del paciente en cada medición (Pediatría).
 * ========================================================================== */
import { esCardiologia } from './cardiologia'
import { esClinica, esClinicaObesidad } from './clinica'
import { esPsicologia, EVALUACION_PSI, CATEGORIAS_ESTUDIO_PSI } from './psicologia'
import { esNeumonologia } from './neumonologia'
import { esReumatologia, LAB_TEXTO } from './reumatologia'
import { esInfectologia, textoAtb } from './infectologia'
import { esNeurologia } from './neurologia'
import { esEndocrino } from './endocrino'
import { esTraumatologia, ESTUDIOS_TRAUMA } from './traumatologia'
import { esEcografia } from './ecografia'
import { esPediatria, DESARROLLO_PED, CATEGORIAS_ESTUDIO_PED } from './pediatria'
import { esCirugia } from './cirugia'
import { esNutricion, CONSUMOS, CATEGORIAS_ESTUDIO_NUTRI } from './nutricion'
import { esGinecologia, formulaObstetrica } from './ginecologia'
import { esKinesiologia } from './kinesiologia'
import { esPsiquiatria } from './psiquiatria'
import { esOftalmologia } from './oftalmologia'

export const ALERTAS_SUGERIDAS = [
  'Alergia', 'Anticoagulación', 'Diabetes', 'Embarazo', 'Marcapasos / CDI',
  'Insuficiencia cardíaca', 'Enfermedad renal', 'Antecedente de IAM / ACV', 'Medicación de alto riesgo',
  'Insulinoterapia', 'Cirugía bariátrica', 'Epilepsia', 'Inmunosupresión',
  'Prótesis / material de osteosíntesis',
]

const VITALES_GENERALES = ['ta_sistolica', 'ta_diastolica', 'fc', 'saturacion', 'temperatura', 'peso', 'imc']

export const PRIORIDAD = {
  // §3.4 Cardiología: Alertas CV → diagnósticos → medicación → TA/FC →
  // ECG/estudios recientes → gráficos CV → línea de tiempo.
  cardiologia: {
    nombre: 'Cardiología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'medicacion' },
      { tipo: 'vitales', titulo: 'TA y FC', vars: ['ta_sistolica', 'ta_diastolica', 'fc'] },
      { tipo: 'estudios', titulo: 'ECG y estudios recientes', tipos: ['ECG', 'Ecocardiograma', 'Holter', 'MAPA', 'Ecoestrés', 'Ergometría', 'SPECT', 'Angiografía', 'TAC coronaria', 'RNM cardíaca', 'Doppler vascular'] },
      { tipo: 'graficos', titulo: 'Gráficos cardiovasculares', vars: ['ta_sistolica', 'fc', 'peso', 'imc', 'ldl', 'colesterol_total'] },
      { tipo: 'timeline' },
    ],
  },
  // §3.4 Neumonología: Diagnóstico respiratorio → saturación →
  // tabaquismo/paquetes-año → espirometría/FEV1 → gráficos.
  neumonologia: {
    nombre: 'Neumonología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos', titulo: 'Diagnóstico respiratorio' },
      { tipo: 'vitales', titulo: 'Saturación', vars: ['saturacion', 'fr'] },
      { tipo: 'tabaquismo' },
      { tipo: 'vitales', titulo: 'Espirometría', vars: ['fev1', 'fev1_pct'] },
      { tipo: 'estudios', titulo: 'Estudios respiratorios', tipos: ['Espirometría', 'DLCO', 'Test de caminata', 'Oximetría', 'Polisomnografía', 'Radiografía', 'TAC de tórax'] },
      { tipo: 'graficos', titulo: 'Gráficos respiratorios', vars: ['saturacion', 'fev1', 'fev1_pct', 'fr'] },
      { tipo: 'medicacion' },
      { tipo: 'timeline' },
    ],
  },
  // Clínica Médica (§9): visión integral → problemas activos, medicación,
  // signos vitales completos y antropometría; luego estudios, controles y gráficos.
  clinica: {
    nombre: 'Clínica Médica',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'medicacion' },
      { tipo: 'vitales', titulo: 'Signos vitales', vars: ['ta_sistolica', 'ta_diastolica', 'fc', 'fr', 'temperatura', 'saturacion'] },
      { tipo: 'vitales', titulo: 'Antropometría', vars: ['peso', 'imc'] },
      { tipo: 'estudios', titulo: 'Últimos estudios' },
      { tipo: 'controles' },
      { tipo: 'graficos', titulo: 'Gráficos clínicos', vars: ['ta_sistolica', 'peso', 'imc', 'fc'] },
      { tipo: 'timeline' },
    ],
  },
  // Clínica Médica (obesidad): el seguimiento es la evolución del peso y el
  // riesgo cardiometabólico → antropometría y metabólico primero.
  obesidad: {
    nombre: 'Clínica Médica (obesidad)',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'vitales', titulo: 'Antropometría', vars: ['peso', 'imc', 'cintura'] },
      { tipo: 'vitales', titulo: 'Perfil metabólico', vars: ['glucemia', 'hba1c', 'colesterol_total', 'hdl', 'ldl', 'trigliceridos'] },
      { tipo: 'vitales', titulo: 'Presión arterial', vars: ['ta_sistolica', 'ta_diastolica'] },
      { tipo: 'graficos', titulo: 'Evolución del peso y metabólica', vars: ['peso', 'imc', 'cintura', 'glucemia', 'hba1c'] },
      { tipo: 'medicacion' },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Endocrinología / Diabetología / Ginecoendocrinología: control glucémico,
  // lípidos y tiroides; después antropometría, estudios y gráficos.
  endocrino: {
    nombre: 'Endocrinología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'medicacion' },
      { tipo: 'vitales', titulo: 'Control glucémico', vars: ['glucemia', 'hba1c'] },
      { tipo: 'vitales', titulo: 'Perfil lipídico', vars: ['colesterol_total', 'hdl', 'ldl', 'trigliceridos'] },
      { tipo: 'vitales', titulo: 'Tiroides', vars: ['tsh', 't4_libre'] },
      { tipo: 'vitales', titulo: 'Antropometría y presión arterial', vars: ['peso', 'imc', 'cintura', 'ta_sistolica', 'ta_diastolica'] },
      { tipo: 'estudios', titulo: 'Estudios endocrinológicos', tipos: ['Laboratorio', 'Perfil tiroideo', 'Densitometría ósea', 'Monitoreo glucémico', 'Ecografía'] },
      { tipo: 'graficos', titulo: 'Gráficos metabólicos', vars: ['hba1c', 'glucemia', 'peso', 'ldl', 'tsh', 'imc'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Neurología: escalas (Glasgow/NIHSS) y el cuadro neurológico primero; luego
  // signos vitales (riesgo vascular), medicación, neuroimágenes/estudios y gráficos.
  neurologia: {
    nombre: 'Neurología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos', titulo: 'Diagnóstico neurológico' },
      { tipo: 'vitales', titulo: 'Escalas neurológicas', vars: ['glasgow', 'nihss'] },
      { tipo: 'registro', titulo: 'Cuadro neurológico', campos: [
        { campo: 'sintomas', label: 'Síntomas' },
        { campo: 'antecedentes', label: 'Antecedentes' },
      ] },
      { tipo: 'vitales', titulo: 'Signos vitales', vars: ['ta_sistolica', 'ta_diastolica', 'fc', 'saturacion'] },
      { tipo: 'medicacion' },
      { tipo: 'estudios', titulo: 'Neuroimágenes y estudios', tipos: ['Tomografía', 'Resonancia', 'EEG', 'EMG', 'Potenciales evocados', 'Polisomnografía', 'Doppler vascular'] },
      { tipo: 'graficos', titulo: 'Gráficos neurológicos', vars: ['nihss', 'glasgow', 'ta_sistolica', 'fc'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Reumatología (§16): actividad de la enfermedad y compromiso articular →
  // dolor e inflamación (EVA, PCR, VSG) → laboratorio inmunológico → tratamiento.
  reumatologia: {
    nombre: 'Reumatología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'registro', titulo: 'Actividad y compromiso articular', campos: [
        { campo: 'actividad', label: 'Actividad de la enfermedad' },
        { campo: 'articulaciones', label: 'Articulaciones afectadas' },
        { campo: 'rigidezMatinal', label: 'Rigidez matinal', unidad: 'min' },
        { campo: 'sintomas', label: 'Síntomas' },
      ] },
      { tipo: 'vitales', titulo: 'Dolor e inflamación', vars: ['dolor_eva', 'pcr', 'vsg'] },
      { tipo: 'registro', titulo: 'Laboratorio inmunológico', campos: [
        { campo: 'laboratorio.resultados', etiquetas: Object.fromEntries(LAB_TEXTO) },
      ] },
      { tipo: 'medicacion' },
      { tipo: 'estudios', titulo: 'Estudios reumatológicos', tipos: ['Laboratorio', 'Radiografía', 'Ecografía', 'Resonancia', 'Densitometría ósea'] },
      { tipo: 'graficos', titulo: 'Actividad inflamatoria', vars: ['dolor_eva', 'pcr', 'vsg'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Psicología (§12): demanda y objetivos → evaluación → última sesión →
  // contexto → informes; próxima sesión e historial de sesiones. Sin gráficos
  // ni medicación (la plantilla no los registra).
  psicologia: {
    nombre: 'Psicología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'registro', titulo: 'Demanda y objetivos', campos: [
        { campo: 'motivo', de: 'evolucion', label: 'Demanda principal' },
        { campo: 'objetivos', label: 'Objetivos terapéuticos' },
      ] },
      { tipo: 'registro', titulo: 'Evaluación', campos: [
        { campo: 'evaluacion', etiquetas: Object.fromEntries(EVALUACION_PSI) },
      ] },
      { tipo: 'registro', titulo: 'Última sesión', campos: [
        { campo: 'subjetivo', de: 'evolucion', label: 'Evolución' },
        { campo: 'intervenciones', label: 'Intervenciones' },
        { campo: 'plan', de: 'evolucion', label: 'Plan' },
      ] },
      { tipo: 'registro', titulo: 'Contexto', campos: [
        { campo: 'contextoFamiliar', label: 'Familiar' },
        { campo: 'contextoLaboral', label: 'Laboral / escolar' },
        { campo: 'tratamientosPrevios', label: 'Tratamientos previos' },
        { campo: 'situacionesRelevantes', label: 'Situaciones relevantes' },
      ] },
      { tipo: 'estudios', titulo: 'Informes y evaluaciones', tipos: CATEGORIAS_ESTUDIO_PSI },
      { tipo: 'controles', titulo: 'Próxima sesión' },
      { tipo: 'timeline', titulo: 'Últimas sesiones' },
    ],
  },
  // Traumatología: lesión actual (mecanismo, zonas, síntomas) → dolor →
  // conducta e inmovilización → antecedentes → imágenes → evolución del dolor.
  traumatologia: {
    nombre: 'Traumatología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'registro', titulo: 'Lesión actual', campos: [
        { campo: 'mecanismo', label: 'Mecanismo', etiquetas: { tipo: 'Tipo', descripcion: 'Descripción', fecha: 'Fecha del evento' } },
        { campo: 'zonas', label: 'Zonas afectadas' },
        { campo: 'sintomas', label: 'Síntomas' },
      ] },
      { tipo: 'vitales', titulo: 'Dolor', vars: ['dolor_eva'] },
      { tipo: 'registro', titulo: 'Conducta', campos: [
        { campo: 'conducta', label: 'Conducta' },
        { campo: 'inmovilizacion', label: 'Inmovilización' },
      ] },
      { tipo: 'registro', titulo: 'Antecedentes', campos: [
        { campo: 'antecedentes', label: 'Antecedentes' },
      ] },
      { tipo: 'medicacion' },
      { tipo: 'estudios', titulo: 'Imágenes y estudios', tipos: ESTUDIOS_TRAUMA },
      { tipo: 'graficos', titulo: 'Evolución del dolor', vars: ['dolor_eva'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Infectología (§6.12): cuadro (fiebre, foco) → temperatura → microbiología →
  // antibióticos → epidemiología; luego estudios y curva térmica (§7.2).
  infectologia: {
    nombre: 'Infectología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos', titulo: 'Diagnóstico infeccioso' },
      { tipo: 'registro', titulo: 'Cuadro', campos: [
        { campo: 'subjetivo', de: 'evolucion', label: 'Síndrome' },
        { campo: 'fiebre', label: 'Fiebre', formato: (f) => (f.presente
          ? ['Sí', f.inicio && `inicio ${f.inicio}`, f.tempMax != null && `T máx. ${f.tempMax} °C`, f.patron].filter(Boolean).join(' · ')
          : 'No') },
        { campo: 'focos', label: 'Foco probable' },
      ] },
      { tipo: 'vitales', titulo: 'Temperatura', vars: ['temperatura'] },
      { tipo: 'registro', titulo: 'Microbiología', campos: [
        { campo: 'microbiologia', formato: (filas) => filas.map((m) => [
          m.muestra, m.fecha, m.microorganismo,
          m.sensibilidad && `Sensible: ${m.sensibilidad}`, m.resistencia && `Resistente: ${m.resistencia}`,
        ].filter(Boolean).join(' · ')) },
      ] },
      { tipo: 'registro', titulo: 'Antibióticos', campos: [
        { campo: 'antibioticos', formato: (filas) => filas.map((a) => [
          textoAtb(a), (a.inicio || a.fin) && `${a.inicio || '¿?'} → ${a.fin || 'en curso'}`, a.motivo,
        ].filter(Boolean).join(' · ')) },
        { campo: 'duracionPrevista', label: 'Duración prevista' },
      ] },
      { tipo: 'registro', titulo: 'Epidemiología', campos: [
        { campo: 'epidemiologia', label: 'Antecedentes' },
        { campo: 'epidemiologiaDesc', label: 'Detalle' },
      ] },
      { tipo: 'medicacion' },
      { tipo: 'estudios', titulo: 'Microbiología y estudios', tipos: ['Cultivo / antibiograma', 'Laboratorio', 'Radiografía', 'Tomografía', 'Ecografía'] },
      { tipo: 'graficos', titulo: 'Curva térmica', vars: ['temperatura'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // §3.4 Pediatría: Edad → antecedentes perinatales → vacunas → antropometría →
  // curvas de crecimiento → desarrollo. §7.2: peso/talla/IMC/PC según edad;
  // percentiles solo con tablas validadas (Fase 2): acá, la serie y la edad.
  pediatria: {
    nombre: 'Pediatría',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'edad' },
      { tipo: 'registro', titulo: 'Antecedentes perinatales', campos: [
        { campo: 'base.edadGestacional', label: 'Edad gestacional', unidad: 'semanas' },
        { campo: 'base.tipoParto', label: 'Parto' },
        { campo: 'base.pesoNacer', label: 'Peso al nacer', unidad: 'g' },
        { campo: 'base.tallaNacer', label: 'Talla al nacer', unidad: 'cm' },
        { campo: 'base.perinatales', label: 'Perinatales' },
        { campo: 'alimentacion', label: 'Alimentación' },
      ] },
      { tipo: 'registro', titulo: 'Vacunas', campos: [
        { campo: 'vacunacion.esquema', label: 'Esquema' },
        { campo: 'vacunacion.pendientes', label: 'Pendientes' },
      ] },
      { tipo: 'vitales', titulo: 'Antropometría', vars: ['peso', 'talla', 'imc', 'perimetro_cefalico'], conEdad: true },
      { tipo: 'graficos', titulo: 'Curvas de crecimiento', vars: ['peso', 'talla', 'imc', 'perimetro_cefalico'],
        nota: 'Evolución por fecha de control. Los percentiles requieren tablas validadas (Fase 2).' },
      { tipo: 'registro', titulo: 'Desarrollo', campos: [
        { campo: 'desarrollo', etiquetas: Object.fromEntries(DESARROLLO_PED) },
      ] },
      { tipo: 'diagnosticos' },
      { tipo: 'medicacion' },
      { tipo: 'estudios', titulo: 'Estudios y carnet de vacunación', tipos: [...CATEGORIAS_ESTUDIO_PED, 'Laboratorio', 'Radiografía', 'Ecografía'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Nutrición (§8, C2/C3 24/10): objetivos → antropometría y composición corporal
  // → historia alimentaria y actividad → estudios → evolución del peso/composición.
  // Comparte variables con Obesidad/Endocrino (una sola serie longitudinal, §23).
  nutricion: {
    nombre: 'Nutrición',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos', titulo: 'Evaluación nutricional' },
      { tipo: 'registro', titulo: 'Objetivos', campos: [
        { campo: 'objetivosPaciente', label: 'Del paciente' },
        { campo: 'objetivos', label: 'Del plan' },
      ] },
      { tipo: 'vitales', titulo: 'Antropometría', vars: ['peso', 'imc', 'cintura', 'cadera'] },
      { tipo: 'vitales', titulo: 'Composición corporal', vars: ['grasa_pct', 'masa_muscular', 'icc'] },
      { tipo: 'registro', titulo: 'Historia alimentaria y actividad', campos: [
        { campo: 'comidas', label: 'Comidas que realiza' },
        { campo: 'aguaLitros', label: 'Agua', unidad: 'L/día' },
        { campo: 'consumos', label: 'Consumos', etiquetas: Object.fromEntries(CONSUMOS) },
        { campo: 'actividadFisica', label: 'Actividad física', formato: (a) => (a
          ? [a.tipo, a.frecuencia != null && `${a.frecuencia}x/sem`, a.duracion != null && `${a.duracion} min`].filter(Boolean).join(' · ')
          : null) },
        { campo: 'indicaciones', label: 'Indicaciones' },
      ] },
      { tipo: 'estudios', titulo: 'Estudios nutricionales', tipos: [...CATEGORIAS_ESTUDIO_NUTRI, 'Laboratorio'] },
      { tipo: 'graficos', titulo: 'Evolución del peso y composición', vars: ['peso', 'imc', 'cintura', 'grasa_pct', 'masa_muscular'] },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Ginecología (§11, C2/C3 24/10): antecedentes gineco-obstétricos (fórmula
  // obstétrica) → ciclo menstrual → anticoncepción → antecedentes y examen →
  // estudios. Sin variables numéricas (la spec no pide graficar) → resumen de
  // registros, como Psicología.
  ginecologia: {
    nombre: 'Ginecología',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'registro', titulo: 'Antecedentes gineco-obstétricos', campos: [
        { campo: 'gestaciones', label: 'Fórmula obstétrica', formato: (g) => formulaObstetrica(g) },
        { campo: 'menstrual.menarca', label: 'Menarca', unidad: 'años' },
        { campo: 'inicioRelaciones', label: 'Inicio de relaciones', unidad: 'años' },
      ] },
      { tipo: 'registro', titulo: 'Ciclo menstrual', campos: [
        { campo: 'menstrual.fum', label: 'FUM' },
        { campo: 'menstrual.cicloDias', label: 'Ciclo', unidad: 'días' },
        { campo: 'menstrual.duracionDias', label: 'Duración', unidad: 'días' },
      ] },
      { tipo: 'registro', titulo: 'Anticoncepción', campos: [
        { campo: 'anticoncepcion.metodo', label: 'Método' },
      ] },
      { tipo: 'registro', titulo: 'Antecedentes y examen', campos: [
        { campo: 'antecedentes', label: 'Antecedentes' },
        { campo: 'antecedentesDesc', label: 'Detalle' },
        { campo: 'examen.mamario', label: 'Examen mamario' },
        { campo: 'examen.ginecologico', label: 'Examen ginecológico' },
      ] },
      { tipo: 'medicacion' },
      { tipo: 'estudios', titulo: 'Estudios ginecológicos' },
      { tipo: 'controles' },
      { tipo: 'timeline' },
    ],
  },
  // Orden general (§3.3): alertas → problemas/diagnósticos → medicación →
  // últimos signos vitales → últimos estudios → controles → gráficos.
  general: {
    nombre: 'General',
    bloques: [
      { tipo: 'alertas' },
      { tipo: 'diagnosticos' },
      { tipo: 'medicacion' },
      { tipo: 'vitales', titulo: 'Últimos signos vitales', vars: VITALES_GENERALES },
      { tipo: 'estudios', titulo: 'Últimos estudios' },
      { tipo: 'controles' },
      { tipo: 'graficos', titulo: 'Gráficos', vars: null },
    ],
  },
}

/** Clave de prioridad para una especialidad (por nombre, cualquier grafía). */
export const prioridadDe = (especialidad, familia) => {
  const f = familiaDe(especialidad, familia)
  return f && PRIORIDAD[f] ? f : 'general'
}

/* Familias de especialidad: agrupan las variantes del catálogo con los MISMOS
 * reconocedores que eligen la plantilla de C1 (ej. "Cardiología", "Cardiología
 * Clínica" y "Cardiología (imágenes…)" → Cardiología). El Resumen se arma por
 * familia: un neumonólogo ve lo de Neumonología del paciente, y así. */
export const FAMILIAS = [
  ['cardiologia', 'Cardiología', esCardiologia],
  // La variante obesidad va ANTES que Clínica: es su propia familia (otro
  // profesional, otro foco de seguimiento), aunque comparta la plantilla de C1.
  ['obesidad', 'Clínica Médica (obesidad)', esClinicaObesidad],
  ['clinica', 'Clínica Médica', esClinica],
  ['psicologia', 'Psicología', esPsicologia],
  ['neumonologia', 'Neumonología', esNeumonologia],
  ['reumatologia', 'Reumatología', esReumatologia],
  ['infectologia', 'Infectología', esInfectologia],
  ['neurologia', 'Neurología', esNeurologia],
  ['endocrino', 'Endocrinología', esEndocrino],
  ['traumatologia', 'Traumatología', esTraumatologia],
  ['ecografia', 'Ecografía', esEcografia],
  ['pediatria', 'Pediatría', esPediatria],
  ['cirugia', 'Cirugía', esCirugia],
  ['nutricion', 'Nutrición', esNutricion],
  ['ginecologia', 'Ginecología', esGinecologia],
  ['kinesiologia', 'Kinesiología', esKinesiologia],
  ['psiquiatria', 'Psiquiatría', esPsiquiatria],
  ['oftalmologia', 'Oftalmología', esOftalmologia],
]

/** Familia de HC de una especialidad.
 *  `familia` = el DATO que manda el servidor (columna especialidad.familia, se
 *  administra en Configuración → Especialidades): es la fuente de verdad.
 *   - string → esa familia;  null → sin plantilla propia (formulario general):
 *     agrupa por su propio nombre ("otra:hemodinamia").
 *   - undefined → el servidor aún no la envía (antes del deploy): RESPALDO por
 *     nombre con los reconocedores de las plantillas, para no romper la transición. */
export function familiaDe(especialidad, familia) {
  const n = String(especialidad || '').trim()
  if (familia !== undefined) return familia || (n ? `otra:${n.toLowerCase()}` : null)
  if (!n) return null
  const f = FAMILIAS.find(([, , es]) => es(n))
  return f ? f[0] : `otra:${n.toLowerCase()}`
}

/** Nombre legible de una familia (para "otra:…", el nombre original). */
export const nombreFamilia = (familia, especialidadOriginal) =>
  FAMILIAS.find(([k]) => k === familia)?.[1] || especialidadOriginal || familia

/** ¿Este rol pauta alertas sobre variables? Secretaría (asistente) solo las ve (spec §26). */
export const puedePautarAlertas = (rol) => rol === 'profesional' || rol === 'dios' || rol === 'administrador'
