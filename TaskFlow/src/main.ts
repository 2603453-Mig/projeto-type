
import { campo, elemento, selecao } from "./dom";

import {
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

import type { Status, Consulta, Especialidade } from "./tipos";

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

// Começa vazia: quem preenche é a API.
let lista: Consulta[] = [];

function mostrarErro(erro: unknown): void {
    elemento("erro").textContent =
        erro instanceof Error ? erro.message : "Erro inesperado.";
}


// Uma ajudante para criar botões sem repetir código.
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


// Uma consulta vira um <li> pronto para a tela.
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


    // Cada procedimento vira uma etiqueta.
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


    // Botões de ações da consulta.
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


// A função que desenha a tela inteira a partir da lista.
function desenhar(): void {
    const itens = transformar(lista, criarItem);

    elemento("lista").replaceChildren(...itens);


    // Contagem das consultas por status.
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


    // Encontra a primeira consulta de prioridade alta.
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


// ---------- Parte 3: procedimentos do cadastro ----------

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


// ---------- Parte 4: formulário de cadastro ----------

elemento("formulario").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    elemento("erro").textContent = "";

    try {
        const nova = await cadastrarConsulta({
            titulo: campo("titulo").value.trim(),

            prioridade: selecao("prioridade").value as Consulta["prioridade"],

            especialidade: selecao("especialidade").value as Especialidade,

            procedimentos: [...procedimentosTemporarios],
        });

        // Acrescenta a nova consulta sem alterar a lista anterior.
        lista = [...lista, nova];

        // Limpa os campos do cadastro.
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


// ---------- Parte 5: alterar status ----------

// Altera o status de uma consulta.
async function mudarStatus(
    id: number,
    status: Status
): Promise<void> {
    try {
        elemento("erro").textContent = "";

        // Primeiro o banco confirma a alteração.
        await alterarStatus(id, status);

        // Depois atualizamos a lista na memória.
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


// ---------- Parte 6: remover consulta ----------

// Remove uma consulta.
async function remover(id: number): Promise<void> {
    try {
        elemento("erro").textContent = "";

        await removerConsulta(id);

        lista = lista.filter(
            (consulta) => consulta.id !== id
        );

        desenhar();

    } catch (erro) {
        mostrarErro(erro);
    }
}


// ---------- Parte 7: tela de entrada (Aula 5) ----------

function mostrarErroEntrada(erro: unknown): void {
    const mensagem = erro instanceof Error
        ? erro.message
        : "Erro inesperado.";

    elemento("erro-entrada").textContent = mensagem;
}


// Troca entre "Entrar" e "Criar conta".
function mostrarFormulario(criando: boolean): void {
    elemento("form-criar").hidden = !criando;

    elemento("form-entrar").hidden = criando;

    elemento("alternar-entrada").textContent = criando
        ? "Já tenho conta"
        : "Ainda não tenho conta";

    elemento("erro-entrada").textContent = "";
}


// Alterna entre login e criação de conta.
elemento("alternar-entrada").addEventListener("click", () => {
    mostrarFormulario(elemento("form-criar").hidden === true);
});


// ---------- Login ----------

elemento("form-entrar").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    try {
        guardarSessao(
            await entrar(
                campo("entrar-email").value,
                campo("entrar-senha").value
            )
        );

        campo("entrar-senha").value = "";

        await iniciar();

    } catch (erro) {
        mostrarErroEntrada(erro);
    }
});


// ---------- Criar conta ----------

elemento("form-criar").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = campo("criar-email").value;

    const senha = campo("criar-senha").value;

    try {
        await criarConta(
            campo("criar-nome").value,
            email,
            senha
        );

        // Criou a conta? Já entra automaticamente.
        guardarSessao(await entrar(email, senha));

        // Limpa os campos de cadastro.
        (elemento("form-criar") as HTMLFormElement).reset();

        await iniciar();

    } catch (erro) {
        mostrarErroEntrada(erro);
    }
});


// ---------- Encerrar sessão ----------

elemento("botao-sair").addEventListener("click", () => {
    encerrarSessao();

    // Limpa a lista de consultas.
    lista = [];

    // Limpa os procedimentos temporários.
    procedimentosTemporarios = [];

    // Limpa os formulários.
    (elemento("form-entrar") as HTMLFormElement).reset();

    (elemento("formulario") as HTMLFormElement).reset();

    (elemento("form-criar") as HTMLFormElement).reset();

    campo("procedimento").value = "";

    // Atualiza a lista de procedimentos.
    desenharProcedimentos();

    // Limpa mensagens de erro.
    elemento("erro").textContent = "";
    elemento("erro-entrada").textContent = "";
    elemento("erro-procedimentos").textContent = "";

    mostrarFormulario(false);

    // Volta para a tela de entrada.
    iniciar();
});


// ---------- Parte 8: inicialização do sistema ----------

// Com sessão, mostra o sistema.
// Sem sessão, mostra a tela de entrada.
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
        // Busca somente as consultas do usuário autenticado.
        lista = await listarConsultas();

        desenhar();

    } catch (erro) {
        mostrarErro(erro);
    }
}


// Inicia o programa.
iniciar();
