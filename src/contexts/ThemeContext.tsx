
"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

type Tema = "claro" | "escuro" | "automatico";
type TemaEfetivo = "claro" | "escuro";

type ThemeContextType = {
    tema: Tema;
    temaEfetivo: TemaEfetivo;
    atualizarTema: (novoTema: Tema) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
    undefined
);

function calcularTemaEfetivo(tema: Tema): TemaEfetivo {
    if (tema === "automatico") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "escuro"
            : "claro";
    }

    return tema;
}

function aplicarTema(tema: Tema): TemaEfetivo {
    const efetivo = calcularTemaEfetivo(tema);

    document.documentElement.setAttribute("data-theme", efetivo);

    return efetivo;
}

export function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [tema, setTema] = useState<Tema>("claro");

    const [temaEfetivo, setTemaEfetivo] =
        useState<TemaEfetivo>("claro");

    // Carrega a preferência salva no Supabase.
    useEffect(() => {
        let ativo = true;

        async function carregarTema() {
            try {
                const resposta = await fetch(
                    "/api/configuracoes/aparencia",
                    { cache: "no-store" }
                );

                if (!resposta.ok) {
                    const dadosErro = await resposta.json().catch(() => null);

                    console.warn("Falha ao carregar aparência:", {
                        status: resposta.status,
                        mensagem: dadosErro?.erro,
                    });

                    return;
                }

                const dados = await resposta.json();
                const temaSalvo = dados.aparencia?.tema;

                const temaValido: Tema = [
                    "claro",
                    "escuro",
                    "automatico",
                ].includes(temaSalvo)
                    ? temaSalvo
                    : "claro";

                if (ativo) {
                    setTema(temaValido);
                }
            } catch (error) {
                console.error("Erro ao carregar tema:", error);
            }
        }

        carregarTema();

        return () => {
            ativo = false;
        };
    }, []);

    // Aplica o tema sempre que a preferência mudar.
    useEffect(() => {
        function atualizarTemaVisual() {
            const efetivo = aplicarTema(tema);
            setTemaEfetivo(efetivo);
        }

        atualizarTemaVisual();

        const media = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

        media.addEventListener("change", atualizarTemaVisual);

        return () => {
            media.removeEventListener("change", atualizarTemaVisual);
        };
    }, [tema]);

    // Atualiza imediatamente o tema escolhido.
    function atualizarTema(novoTema: Tema) {
        const efetivo = aplicarTema(novoTema);

        setTema(novoTema);
        setTemaEfetivo(efetivo);
    }

    return (
        <ThemeContext.Provider
            value={{
                tema,
                temaEfetivo,
                atualizarTema,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTema() {
    const contexto = useContext(ThemeContext);

    if (!contexto) {
        throw new Error(
            "useTema deve ser utilizado dentro de ThemeProvider."
        );
    }

    return contexto;
}
