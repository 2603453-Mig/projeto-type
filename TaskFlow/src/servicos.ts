
 // ---------- Serviços auxiliares ----------

// Transforma cada elemento de uma lista usando uma função de transformação.
// Recebe uma lista de elementos e uma regra, retornando uma nova lista.

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
