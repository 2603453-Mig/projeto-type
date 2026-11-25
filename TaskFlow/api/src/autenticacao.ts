
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const SEGREDO = process.env.JWT_SECRET ?? "troque-este-segredo";

// Middleware: verifica se o usuário possui um token válido.
export function exigirLogin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const cabecalho = req.headers.authorization;
    const token = cabecalho?.startsWith("Bearer ")
        ? cabecalho.slice(7)
        : undefined;

    if (!token) {
        res.status(401).json({
            erro: "Faça login para continuar."
        });
        return;
    }

    try {
        const dados = jwt.verify(token, SEGREDO) as { id: number };

        if (!Number.isInteger(dados.id) || dados.id <= 0) {
            res.status(401).json({
                erro: "Token inválido."
            });
            return;
        }

        res.locals.usuarioId = dados.id;
        next();
    } catch {
        res.status(401).json({
            erro: "Sua sessão expirou. Entre de novo."
        });
    }
}

// Recupera o ID do usuário autenticado.
export function usuarioDe(res: Response): number {
    return res.locals.usuarioId as number;
}
