
export type Prioridade = "baixa" | "media" | "alta";

export type Status = "marcada" | "confirmada" | "realizada" | "cancelada";

export type Especialidade =
    | "cardiologia"
    | "gastroenterologia"
    | "geriatria"
    | "endocrinologia";

// Valores permitidos para cada campo.
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

// Dados recebidos pela API ao cadastrar ou atualizar uma consulta.
export interface DadosConsulta {
    titulo: string;
    descricao?: string | null;
    prioridade?: Prioridade;
    especialidade: Especialidade;
    procedimentos?: string[];
    prazo?: string | null;
}
