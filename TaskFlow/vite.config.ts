import { defineConfig } from "vite";
export default defineConfig({
    server: {
        // tudo que começa com /api vai para a API, que roda na porta 3000
        proxy: { "/api": "http://localhost:3000" },
    },
});