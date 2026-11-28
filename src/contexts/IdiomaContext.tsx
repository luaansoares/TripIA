
    "use client";

    import {
        createContext,
        useContext,
        useEffect,
        useState,
        ReactNode,
    } from "react";

    import { traducoes, type Idioma } from "@/i18n";

    type Traducao = (typeof traducoes)[Idioma];

    type IdiomaContextType = {
        idioma: Idioma;
        alterarIdioma: (novoIdioma: Idioma) => void;
        traducao: Traducao;
    };

    const IdiomaContext = createContext<IdiomaContextType | undefined>(
        undefined
    );

    export function IdiomaProvider({ children }: { children: ReactNode }) {
        const [idioma, setIdioma] = useState<Idioma>("pt-BR");
        const [carregado, setCarregado] = useState(false);

        useEffect(() => {
            async function carregarIdioma() {
                try {
                    const resposta = await fetch("/api/configuracoes/idioma");
                    const dados = await resposta.json();

                    if (resposta.ok && dados.configuracoes?.idioma) {
                        const idiomaSalvo = dados.configuracoes.idioma;

                        if (idiomaSalvo in traducoes) {
                            setIdioma(idiomaSalvo as Idioma);
                        }
                    }
                } catch (error) {
                    console.error("Erro ao carregar idioma:", error);
                } finally {
                    setCarregado(true);
                }
            }

            carregarIdioma();
        }, []);

        function alterarIdioma(novoIdioma: Idioma) {
            setIdioma(novoIdioma);
        }

        useEffect(() => {
            document.documentElement.lang = idioma;
        }, [idioma]);

        return (
            <IdiomaContext.Provider
                value={{
                    idioma,
                    alterarIdioma,
                    traducao: traducoes[idioma],
                }}
            >
                {carregado ? children : null}
            </IdiomaContext.Provider>
        );
    }

    export function useIdioma() {
        const contexto = useContext(IdiomaContext);

        if (!contexto) {
            throw new Error(
                "useIdioma deve ser usado dentro de IdiomaProvider."
            );
        }

        return contexto;
    }
