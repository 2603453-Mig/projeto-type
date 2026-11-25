
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Dados que serão armazenados dentro do token JWT.
interface DadosToken {
    id: number;
}

// Recupera a chave secreta definida no arquivo .env.
const CHAVE_JWT = process.env.JWT_SECRET;

if (!CHAVE_JWT) {
    throw new Error("A variável JWT_SECRET não foi definida no arquivo .env.");
}

// ---------- Autenticação ----------

// Verifica se o usuário está autenticado.
export function exigirLogin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const autorizacao = req.headers.authorization;

    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
        res.status(401).json({ erro: "Autenticação necessária." });
        return;
    }

    const token = autorizacao.slice(7);

    try {
        const dados = jwt.verify(token, CHAVE_JWT) as DadosToken;

        if (!Number.isInteger(dados.id) || dados.id <= 0) {
            res.status(401).json({ erro: "Token inválido." });
            return;
        }

        res.locals.usuarioId = dados.id;

        next();
    } catch {
        res.status(401).json({ erro: "Token inválido ou expirado." });
    }
}

// Recupera o ID do usuário autenticado.
export function usuarioDe(res: Response): number {
    const usuarioId = res.locals.usuarioId;

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new Error("Usuário não autenticado.");
    }

    return usuarioId;
}
