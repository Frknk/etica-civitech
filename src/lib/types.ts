export type ReportStatus =
  | "recibido"
  | "clasificado"
  | "derivado"
  | "atendido";

export type CategoryId =
  | "plagio"
  | "conflicto"
  | "mala-praxis"
  | "uso-indebido"
  | "deontologia";

export interface ReportEvidence {
  name: string;
  size: number;
}

export interface ReportNote {
  at: number;
  status: ReportStatus;
  message: string;
  /** Quién dejó la nota: comité o sistema. Nunca identifica al reportante. */
  by: "comité" | "sistema";
}

export interface Report {
  /** Código de seguimiento confidencial que conserva el reportante. */
  code: string;
  category: CategoryId;
  title: string;
  description: string;
  context: string;
  anonymous: boolean;
  /** Solo se guarda si el reportante decide NO ser anónimo. */
  contactAlias?: string;
  evidence: ReportEvidence[];
  status: ReportStatus;
  createdAt: number;
  notes: ReportNote[];
}

export interface LearnProgress {
  /** ids de módulos formativos completados */
  completed: string[];
  points: number;
  /** ids de insignias obtenidas */
  badges: string[];
}
