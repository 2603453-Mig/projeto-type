import type { Consulta } from "./tipos";
export const consultas: Consulta[] = [
    { id: 1, titulo: "Check-up geral", prioridade: "baixa", status: "confirmada", especialidade: "geriatria",
        procedimentos: ["hemograma completo", "parasitrológico"], criadaEm: new Date() },
    { id: 2, titulo: "Eletrocardiograma", prioridade: "alta", status: "realizada", especialidade: "cardiologia",
        procedimentos: ["eletrocardiograma"], criadaEm: new Date() },
    { id: 3, titulo: "Arritmia", descricao: "Batimentos irregurales", prioridade: "alta",
        status: "realizada", especialidade: "cardiologia", procedimentos: ["cardioversão elétrica"], criadaEm: new Date() },
    { id: 4, titulo: "Gastrite", prioridade: "media", status: "confirmada", especialidade: "gastroenterologia",
        procedimentos: ["antibióticos", "inibidores"], criadaEm: new Date() },
    { id: 5, titulo: "Desconforto intestinal", prioridade: "baixa", status: "cancelada", especialidade: "gastroenterologia",
        procedimentos: ["consulta cancelada"], criadaEm: new Date() },
    { id: 6, titulo: "Tireoide", prioridade: "media", status: "marcada", especialidade: "endocrinologia",
        procedimentos: ["iodoterapia"], criadaEm: new Date() },
];