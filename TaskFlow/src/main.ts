import { campo, elemento, selecao } from "./dom";
import {
    buscarConsulta,
    listarConsultas,
    cadastrarConsulta,
    alterarStatus,
    removerConsulta,
    criarConta,
    encerrarSessao,
    entrar,
    guardarSessao,
    sessaoAtual
} from "./api";
import type { Prioridade, Status, Consulta, Especialidade } from "./tipos";
import { transformar } from "./servicos";

// ---------- Parte 1: tipos primitivos ----------
const nomeDoSistema: string = "Consultas";
const versao: string = "0.3.0";
const hoje: string = new Date().toLocaleDateString("pt-BR");
const autor = "Turma de quinta";

elemento("nome-do-sistema").textContent = nomeDoSistema;
elemento("versao").textContent = `v${versao}`;
elemento("data-de-hoje").textContent = hoje;

console.log(`${nomeDoSistema} iniciado. Autor: ${autor}`);

// ---------- Parte 2: dados da API ----------

// Começa vazia: quem preenche é a API
let lista: Consulta[] = [];

function mostrarErro(erro: unknown): void {
    elemento("erro").textContent =
        erro instanceof Error ? erro.message : "Erro inesperado.";
}

// Uma ajudante para criar botões sem repetir código
function botao(
    texto: string,
    extra: string,
    aoClicar: () => void
): HTMLButtonElement {
    const elementoBotao = document.createElement("button");

    elementoBotao.type = "button";
    elementoBotao.className = `botao botao--pequeno ${extra}`;
    elementoBotao.textContent = texto;
    elementoBotao.addEventListener("click", aoClicar);

    return elementoBotao;
}

// Uma consulta vira um <li> pronto para a tela
function criarItem(consulta: Consulta): HTMLLIElement {
    const item = document.createElement("li");
    item.className = `consulta consulta--${consulta.prioridade}`;

    const titulo = document.createElement("h3");
    titulo.className = "consulta__titulo";
    titulo.textContent = `#${consulta.id} ${consulta.titulo}`;

    const meta = document.createElement("div");
    meta.className = "consulta__meta";

    const etiqueta = document.createElement("span");
    etiqueta.className = `etiqueta etiqueta--${consulta.prioridade}`;
    etiqueta.textContent = consulta.prioridade;

    const situacao = document.createElement("span");
    situacao.className = `etiqueta etiqueta--${consulta.status}`;
    situacao.textContent = consulta.status;

    // Cada procedimento vira uma etiqueta
    const listaProcedimentos = consulta.procedimentos ?? [];

    const procedimentos = listaProcedimentos
        .slice(0, 2)
        .map((procedimento) => {
            const elementoProcedimento = document.createElement("span");

            elementoProcedimento.className = "procedimento";
            elementoProcedimento.textContent = procedimento;

            return elementoProcedimento;
        });

    // Se houver mais de dois procedimentos, adiciona "..."
    if (listaProcedimentos.length > 2) {
        const maisProcedimentos = document.createElement("span");

        maisProcedimentos.className = "procedimento procedimento--mais";
        maisProcedimentos.textContent = "...";

        maisProcedimentos.title = listaProcedimentos
            .slice(2)
            .join(", ");

        procedimentos.push(maisProcedimentos);
    }

    meta.append(etiqueta, situacao, ...procedimentos);
    item.append(titulo, meta);

    const acoes = document.createElement("div");
    acoes.className = "consulta__acoes";

    if (consulta.status === "marcada") {
        acoes.append(
            botao("Confirmar", "", () =>
                mudarStatus(consulta.id, "confirmada")
            ),
            botao("Cancelar", "botao--perigo", () =>
                mudarStatus(consulta.id, "cancelada")
            )
        );
    } else if (consulta.status === "confirmada") {
        acoes.append(
            botao("Realizada", "botao--sucesso", () =>
                mudarStatus(consulta.id, "realizada")
            ),
            botao("Cancelar", "botao--perigo", () =>
                mudarStatus(consulta.id, "cancelada")
            )
        );
    } else if (consulta.status === "cancelada") {
        acoes.append(
            botao("Reabrir", "", () =>
                mudarStatus(consulta.id, "marcada")
            )
        );
    }

    acoes.append(
        botao("Remover", "botao--perigo", () =>
            remover(consulta.id)
        )
    );

    item.append(titulo, meta, acoes);

    return item;
}

// A função que desenha a tela inteira a partir da lista
function desenhar(): void {
    const itens = transformar(lista, criarItem);
    elemento("lista").replaceChildren(...itens);

    // Contagem das consultas por status
    let marcada = 0;
    let confirmada = 0;
    let realizada = 0;
    let cancelada = 0;

    for (const consulta of lista) {
        if (consulta.status === "marcada") {
            marcada++;
        }

        if (consulta.status === "confirmada") {
            confirmada++;
        }

        if (consulta.status === "realizada") {
            realizada++;
        }

        if (consulta.status === "cancelada") {
            cancelada++;
        }
    }

    elemento("marcada").textContent = String(marcada);
    elemento("confirmada").textContent = String(confirmada);
    elemento("realizada").textContent = String(realizada);
    elemento("cancelada").textContent = String(cancelada);

    // Encontra a primeira consulta de prioridade alta
    const urgente = lista.find(
        (consulta) => consulta.prioridade === "alta"
    );

    if (urgente) {
        elemento("comece-por").textContent =
            `Comece por: #${urgente.id} ${urgente.titulo}`;

        elemento("comece-por").hidden = false;
    } else {
        elemento("comece-por").hidden = true;
    }
}


// ---------- Procedimentos do cadastro ----------

// Lista temporária dos procedimentos antes de cadastrar a consulta.
let procedimentosTemporarios: string[] = [];

// Desenha os procedimentos adicionados no formulário.
function desenharProcedimentos(): void {
    const listaProcedimentos = elemento("lista-procedimentos");
    const itens: HTMLLIElement[] = [];

    procedimentosTemporarios.forEach((procedimento, indice) => {
        const item = document.createElement("li");
        item.className = "procedimento__item";

        const nome = document.createElement("span");
        nome.textContent = procedimento;

        const removerBotao = document.createElement("button");
        removerBotao.type = "button";
        removerBotao.className = "procedimento__remover";
        removerBotao.textContent = "×";
        removerBotao.setAttribute(
            "aria-label",
            `Remover ${procedimento}`
        );

        removerBotao.addEventListener("click", () => {
            procedimentosTemporarios =
                procedimentosTemporarios.filter(
                    (_, i) => i !== indice
                );

            desenharProcedimentos();
        });

        item.append(nome, removerBotao);
        itens.push(item);
    });

    listaProcedimentos.replaceChildren(...itens);
}

// Adiciona um procedimento à lista temporária.
elemento("adicionar-procedimento").addEventListener("click", () => {
    const entrada = campo("procedimento");
    const procedimento = entrada.value.trim();

    elemento("erro-procedimentos").textContent = "";

    if (!procedimento) {
        elemento("erro-procedimentos").textContent =
            "Digite o nome de um procedimento.";

        entrada.focus();
        return;
    }

    procedimentosTemporarios.push(procedimento);

    entrada.value = "";
    entrada.focus();

    desenharProcedimentos();
});

// Também permite adicionar usando a tecla Enter.
campo("procedimento").addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        evento.preventDefault();

        elemento("adicionar-procedimento").click();
    }
});


// ---------- Parte 3: formulário ----------

elemento("formulario").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    elemento("erro").textContent = "";

    try {
        const nova = await cadastrarConsulta({
            titulo: campo("titulo").value.trim(),
            prioridade: selecao("prioridade").value as Prioridade,
            especialidade: selecao("especialidade").value as Especialidade,
            procedimentos: [...procedimentosTemporarios],
        });

        lista = [...lista, nova];

        campo("titulo").value = "";
        procedimentosTemporarios = [];
        campo("procedimento").value = "";
        elemento("erro-procedimentos").textContent = "";
        desenharProcedimentos();

        desenhar();

    } catch (erro) {
        mostrarErro(erro);
    }
});

// Altera o status de uma consulta
async function mudarStatus(
    id: number,
    status: Status
): Promise<void> {
    try {
        elemento("erro").textContent = "";

        await alterarStatus(id, status);

        lista = lista.map((consulta) =>
            consulta.id === id
                ? { ...consulta, status }
                : consulta
        );

        desenhar();

    } catch (erro) {
        mostrarErro(erro);
    }
}

// Remove uma consulta
async function remover(id: number): Promise<void> {
    try {
        elemento("erro").textContent = "";

        await removerConsulta(id);

        lista = lista.filter((consulta) => consulta.id !== id);

        desenhar();

    } catch (erro) {
        mostrarErro(erro);
    }
}

// ---------- A tela de entrada (Aula 5) ----------
function mostrarErroEntrada(erro: unknown): void {
    const mensagem = erro instanceof Error ? erro.message : "Erro inesperado.";
    elemento("erro-entrada").textContent = mensagem;
}
// Troca entre "Entrar" e "Criar conta"
function mostrarFormulario(criando: boolean): void {
    elemento("form-criar").hidden = !criando;
    elemento("form-entrar").hidden = criando;
    elemento("alternar-entrada").textContent = criando
        ? "Já tenho conta"
        : "Ainda não tenho conta";
    elemento("erro-entrada").textContent = "";
}
elemento("alternar-entrada").addEventListener("click", () => {
    mostrarFormulario(elemento("form-criar").hidden === true); // escondido? então mostra
});
elemento("form-entrar").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        guardarSessao(await entrar(campo("entrar-email").value, campo("entrar-senha").value));
        campo("entrar-senha").value = "";
        await iniciar();
    } catch (erro) {
        mostrarErroEntrada(erro);
    }
});
elemento("form-criar").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const email = campo("criar-email").value;
    const senha = campo("criar-senha").value;
    try {
        await criarConta(campo("criar-nome").value, email, senha);
        guardarSessao(await entrar(email, senha)); // criou? já entra direto
        (elemento("form-criar") as HTMLFormElement).reset(); // não deixa a senha no campo
        await iniciar();
    } catch (erro) {
        mostrarErroEntrada(erro);
    }
});
elemento("botao-sair").addEventListener("click", () => {
    encerrarSessao();
    lista = [];
    (elemento("form-entrar") as HTMLFormElement).reset();
    mostrarFormulario(false); // volta sempre para "Entrar"
    iniciar();
});
// ---------- O começo: com sessão, mostra o sistema; sem, a entrada ----------
async function iniciar(): Promise<void> {
    const sessao = sessaoAtual();
    elemento("tela-entrada").hidden = sessao !== undefined;
    elemento("tela-app").hidden = sessao === undefined;
    elemento("botao-sair").hidden = sessao === undefined;
    elemento("usuario-nome").textContent = sessao?.nome ?? "";
    if (!sessao) {
        return;
    }
    elemento("erro-entrada").textContent = "";
    try {
        lista = await listarConsultas();
        desenhar();
    } catch (erro) {
        mostrarErro(erro);
    }
}
iniciar();

/*

_______CODIGO SEM UTILIZAÇÃO DA API________

import { campo, elemento, selecao } from "./dom";
import { consultas } from "./dados";
import type { Prioridade, Consulta, Especialidade } from "./tipos";
import { adicionarConsulta, transformar } from "./servicos"

// ---------- Parte 1: tipos primitivos ----------
const nomeDoSistema: string = "Consultas";
const versao: string = "0.2.0";
const hoje: string = new Date().toLocaleDateString("pt-BR");
const autor = "Turma de quinta"; // inferência: o TypeScript deduz que é string

elemento("nome-do-sistema").textContent = nomeDoSistema;
elemento("versao").textContent = `v${versao}`;
elemento("data-de-hoje").textContent = hoje;
console.log(`TaskFlow iniciado. Autor: ${autor}`); // aparece no F12

// ---------- Parte 2----------

//LAÇO 1 — for com índice: contando as canceladas
let cancelada = 0;
for (let i = 0; i < consultas.length; i++) {
if (consultas[i].status === "cancelada") {
    if (!consultas[i].titulo.includes("(CANCELADA)")) {
        consultas[i].titulo = (consultas[i].titulo + " (CANCELADA)");
        console.log(consultas[i].titulo)
    }
    cancelada++;
}
}

elemento("cancelada").textContent = String(cancelada);

// LAÇO 2 — for com índice: contando as realizadas
let realizada = 0;
for (let i = 0; i < consultas.length; i++) {
if (consultas[i].status === "realizada") {
    if (!consultas[i].titulo.includes("(REALIZADA)")) {
        consultas[i].titulo = (consultas[i].titulo + " (REALIZADA)");
        console.log(consultas[i].titulo)
    }
    realizada++;
}
}

elemento("marcada").textContent = String(consultas.length);
elemento("realizada").textContent = String(realizada);

// O estado do programa: a lista que está valendo agora
const lista: Consulta[] = [...consultas];
// Uma consulta vira um <li> pronto para a tela
function criarItem(consulta: Consulta): HTMLLIElement {
const item = document.createElement("li");
item.className = `consulta consulta--${consulta.prioridade}`;
const titulo = document.createElement("h3");
titulo.className = "consulta__titulo";
titulo.textContent = `#${consulta.id} ${consulta.titulo}`;
const etiqueta = document.createElement("span");
etiqueta.className = `etiqueta etiqueta--${consulta.prioridade}`;
etiqueta.textContent = consulta.prioridade;
item.append(titulo, etiqueta);
return item;
}
// A função que desenha a tela inteira a partir da lista
function desenhar(): void {
const itens = transformar(lista, criarItem); // a SUA função de alta ordem
elemento("lista").replaceChildren(...itens);
let confirmada = 0;
for (const consulta of lista) {
    if (consulta.status === "confirmada") {
        confirmada++;
    }
}
elemento("marcada").textContent = String(lista.length);
elemento("confirmada").textContent = String(confirmada);
}
// O formulário: a função abaixo é um CALLBACK — quem a chama é o navegador
elemento("formulario").addEventListener("submit", (evento) => {
evento.preventDefault(); // sem isto, a página recarrega e tudo se perde
elemento("erro").textContent = "";
try {
    adicionarConsulta(lista, {
        titulo: campo("titulo").value.trim(),
        prioridade: selecao("prioridade").value as Prioridade,
        especialidade: selecao("especialidade").value as Especialidade,
        procedimentos: [],
    });
    campo("titulo").value = "";
    desenhar(); // mudou a lista? desenhe de novo
} catch (erro) {
    if (erro instanceof Error) {
        elemento("erro").textContent = erro.message;
    }
}
});

desenhar();

// LAÇO 5 — while: achar a primeira consulta de prioridade alta
// (não sabemos quantas voltas: o laço para assim que encontra)
let posicao = 0;

while (posicao < consultas.length && consultas[posicao].prioridade !== "alta") {
posicao++;
}

if (posicao < consultas.length) {
// achou: mostra o aviso na página
const urgente = consultas[posicao];
elemento("comece-por").textContent = `Comece por: #${urgente.id} ${urgente.titulo}`;
elemento("comece-por").hidden = false;
}
*/

//import { elemento } from "./dom";
//import type { Tarefa } from "./tipos";

////Criar as variaveis
//const nomeDoSistema: string = "TaskFlow";
//const versao: string = "0.1.0";
//const hoje: string = new Date().toLocaleDateString("pt-BR");
//const autor = "Turma de quinta"; // inferência: o TypeScript deduz que é string


////Renderiza np Html pelo elemento do arquivo do arquiv dom importado
//elemento("nome-do-sistema").textContent = nomeDoSistema;
//elemento("versao").textContent = `v${versao}`;
//elemento("data-de-hoje").textContent = hoje;
//console.log(`TaskFlow iniciado. Autor: ${autor}`); // aparece no F12