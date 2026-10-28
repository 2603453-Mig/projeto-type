import type { NovaConsulta, Consulta } from "./tipos";
// Gera o próximo id a partir do maior id já existente
function gerarId(lista: Consulta[]): number {
    let maior = 0;
    for (const consulta of lista) {
        if (consulta.id > maior) {
            maior = consulta.id;
        }
    }
    return maior + 1;
}
// Cadastra uma consulta: o usuário informa só o essencial
export function adicionarConsulta(lista: Consulta[], dados: NovaConsulta): Consulta {
    if (dados.titulo.trim().length < 3) {
        throw new Error("O título precisa ter pelo menos 3 caracteres.");
    }
    const consulta: Consulta = {
        ...dados,
        id: gerarId(lista),
        status: "marcada",
        criadaEm: new Date(),
    };
    lista.push(consulta);
    return consulta;
}
// A SUA função de alta ordem: recebe uma lista e uma regra
export function transformar<T, R>(lista: T[], regra: (item: T) => R): R[] {
    const resultado: R[] = [];
    for (const item of lista) {
        resultado.push(regra(item));
    }
    return resultado;
}