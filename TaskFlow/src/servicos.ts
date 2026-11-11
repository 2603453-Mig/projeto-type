import type { NovaConsulta, Consulta } from "./tipos";

// gerarId e adicionarConsulta foram removidas:
// agora quem cria o ID e cadastra as consultas é o banco.

export function transformar<T, R>(
    lista: T[],
    regra: (item: T) => R
): R[] {
    const resultado: R[] = [];

    for (const item of lista) {
        resultado.push(regra(item));
    }

    return resultado;
}
