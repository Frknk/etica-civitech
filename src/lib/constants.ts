import type { CategoryId, ReportStatus } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  description: string;
}

/** Categorías de incidentes éticos definidas en el plan CivicTech. */
export const CATEGORIES: Category[] = [
  {
    id: "plagio",
    label: "Plagio",
    short: "Apropiación de trabajo ajeno",
    description:
      "Presentar como propio el trabajo, las ideas o los datos de otra persona sin reconocerlo.",
  },
  {
    id: "conflicto",
    label: "Conflicto de interés",
    short: "Interés personal sobre el deber",
    description:
      "Situaciones donde un interés personal puede influir de forma indebida en una decisión profesional.",
  },
  {
    id: "mala-praxis",
    label: "Mala praxis",
    short: "Ejercicio negligente o indebido",
    description:
      "Actuación profesional negligente o contraria a las buenas prácticas de la disciplina.",
  },
  {
    id: "uso-indebido",
    label: "Uso indebido de información",
    short: "Datos usados sin autorización",
    description:
      "Manejo, divulgación o aprovechamiento de información o datos sin la debida autorización.",
  },
  {
    id: "deontologia",
    label: "Incumplimiento deontológico",
    short: "Falta al código profesional",
    description:
      "Incumplimiento de los códigos deontológicos o normas del ejercicio profesional.",
  },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

/** Flujo de atención que ve el reportante. Nunca es punitivo. */
export const STATUS_FLOW: ReportStatus[] = [
  "recibido",
  "clasificado",
  "derivado",
  "atendido",
];

export const STATUS_META: Record<
  ReportStatus,
  { label: string; help: string }
> = {
  recibido: {
    label: "Recibido",
    help: "Tu reporte llegó de forma segura y está registrado.",
  },
  clasificado: {
    label: "Clasificado",
    help: "El comité revisó y categorizó el reporte.",
  },
  derivado: {
    label: "Derivado",
    help: "Se envió al área competente para su atención.",
  },
  atendido: {
    label: "Atendido",
    help: "El caso recibió una respuesta o cierre formativo.",
  },
};

/* ----------------------- Módulos formativos ----------------------- */

export interface LearnModule {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  points: number;
  /** Pregunta de comprobación; reconocemos la formación, no la denuncia. */
  question: string;
  options: string[];
  answer: number;
}

export const LEARN_MODULES: LearnModule[] = [
  {
    id: "integridad",
    title: "¿Qué es la integridad profesional?",
    minutes: 4,
    summary:
      "La integridad es la coherencia entre lo que sabemos correcto y lo que hacemos, incluso cuando nadie observa.",
    points: 20,
    question:
      "Un compañero te pide firmar un informe que no revisaste. ¿Qué responde mejor a la integridad?",
    options: [
      "Firmar para evitar conflictos.",
      "Revisar el informe antes de asumir responsabilidad por él.",
      "Firmar y avisar después si algo sale mal.",
    ],
    answer: 1,
  },
  {
    id: "reporte-responsable",
    title: "Reportar con responsabilidad, no denunciar",
    minutes: 5,
    summary:
      "El reporte responsable busca corregir y prevenir, no castigar personas. Se describe el hecho, no se acusa sin evidencia.",
    points: 25,
    question: "Un buen reporte responsable se caracteriza por…",
    options: [
      "Acusar directamente a una persona por sospecha.",
      "Describir el hecho con claridad y, si existe, aportar evidencia.",
      "Difundir el caso en redes sociales.",
    ],
    answer: 1,
  },
  {
    id: "confidencialidad",
    title: "Confidencialidad y datos",
    minutes: 4,
    summary:
      "Proteger la identidad y los datos de las personas es parte del trato ético de la información.",
    points: 20,
    question: "Manejar información de un caso de forma ética implica…",
    options: [
      "Compartirla con quien pregunte.",
      "Limitar el acceso solo a quien debe atender el caso.",
      "Guardarla en cualquier dispositivo sin control.",
    ],
    answer: 1,
  },
  {
    id: "conflicto-interes",
    title: "Reconocer conflictos de interés",
    minutes: 5,
    summary:
      "Declarar a tiempo un conflicto de interés protege la confianza y evita decisiones cuestionables.",
    points: 25,
    question: "Ante un posible conflicto de interés, lo correcto es…",
    options: [
      "Ocultarlo si nadie lo nota.",
      "Declararlo y apartarse de la decisión si corresponde.",
      "Continuar porque seguramente no influye.",
    ],
    answer: 1,
  },
];

/* --------------------------- Insignias --------------------------- */

export interface Badge {
  id: string;
  label: string;
  description: string;
  /** Cómo se obtiene: SIEMPRE por formación e integridad, nunca por nº de reportes. */
  rule: (p: { points: number; completed: string[] }) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "primer-paso",
    label: "Primer paso",
    description: "Completaste tu primer módulo formativo.",
    rule: (p) => p.completed.length >= 1,
  },
  {
    id: "integridad-viva",
    label: "Integridad viva",
    description: "Completaste tres módulos de formación ética.",
    rule: (p) => p.completed.length >= 3,
  },
  {
    id: "cultivo-pleno",
    label: "Cultivo pleno",
    description: "Completaste toda la ruta formativa disponible.",
    rule: (p) => p.completed.length >= LEARN_MODULES.length,
  },
  {
    id: "guardian-confianza",
    label: "Guardián de la confianza",
    description: "Alcanzaste 60 puntos de formación e integridad.",
    rule: (p) => p.points >= 60,
  },
];

/* ----------------------------- Niveles ---------------------------- */

export interface Level {
  name: string;
  min: number;
}

/** Niveles como etapas de cultivo, no como ranking de denuncias. */
export const LEVELS: Level[] = [
  { name: "Semilla", min: 0 },
  { name: "Brote", min: 25 },
  { name: "Planta", min: 55 },
  { name: "Árbol", min: 90 },
];

export function levelFor(points: number): { current: Level; next?: Level } {
  let current = LEVELS[0];
  let next: Level | undefined = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1];
    }
  }
  return { current, next };
}

/* Mensajes de conciencia ética para notificaciones. */
export const ETHICS_MESSAGES: string[] = [
  "La ética no se impone: se cultiva con decisiones pequeñas y constantes.",
  "Reportar con responsabilidad protege a una comunidad, no señala a una persona.",
  "La confianza crece cuando cada reporte recibe una respuesta visible.",
  "La integridad es lo que haces cuando nadie te observa.",
];
