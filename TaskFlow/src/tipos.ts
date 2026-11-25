
// ---------- Tipos básicos ----------

export type Prioridade = "baixa" | "media" | "alta";

export type Status = "marcada" | "confirmada" | "realizada" | "cancelada";

export type Especialidade =
    | "cardiologia"
    | "gastroenterologia"
    | "geriatria"
    | "endocrinologia";

// ---------- Valores permitidos ----------

export const PRIORIDADES: Prioridade[] = [
    "baixa",
    "media",
    "alta"
];

export const STATUS: Status[] = [
    "marcada",
    "confirmada",
    "realizada",
    "cancelada"
];

export const ESPECIALIDADES: Especialidade[] = [
    "cardiologia",
    "gastroenterologia",
    "geriatria",
    "endocrinologia"
];

// ---------- Consultas ----------

export interface Consulta {
    readonly id: number;
    titulo: string;
    descricao?: string | null;
    prioridade: Prioridade;
    status: Status;
    especialidade: Especialidade;
    procedimentos: string[];
    prazo?: string | null;
    criadaEm: Date;
}

// Dados necessários para cadastrar uma consulta.
export type NovaConsulta = Omit<
    Consulta,
    "id" | "status" | "criadaEm"
>;

// Dados recebidos pela API ao cadastrar ou atualizar uma consulta.
export interface DadosConsulta {
    titulo: string;
    descricao?: string | null;
    prioridade?: Prioridade;
    especialidade: Especialidade;
    procedimentos?: string[];
    prazo?: string | null;
}

// ---------- Usuários ----------

// Dados da sessão retornada pela API após o login.
export interface Sessao {
    token: string;
    nome: string;
}
