"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, LoaderCircle, X } from "lucide-react";

export interface Localidade {
    id: string;
    nome: string;
    regiao: string;
    pais: string;
    endereco: string;
    latitude: number;
    longitude: number;
    codigoPais: string;
}

interface BuscaLocalidadeProps {
    label: string;
    placeholder: string;
    selecionada: Localidade | null;
    onSelecionar: (local: Localidade | null) => void;
}

export default function BuscaLocalidade({
    label,
    placeholder,
    selecionada,
    onSelecionar,
}: BuscaLocalidadeProps) {
    const [busca, setBusca] = useState("");
    const [resultados, setResultados] = useState<Localidade[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [aberto, setAberto] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (selecionada) {
            setBusca(selecionada.endereco);
        }
    }, [selecionada]);

    useEffect(() => {
        if (busca.trim().length < 2 || selecionada?.endereco === busca) {
            setResultados([]);
            setCarregando(false);
            return;
        }

        const controlador = new AbortController();

        const tempo = setTimeout(async () => {
            setCarregando(true);
            setErro("");

            try {
                const resposta = await fetch(
                    `/api/localidades?busca=${encodeURIComponent(busca)}`,
                    { signal: controlador.signal }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Erro ao pesquisar localidades."
                    );
                }

                const locais: Localidade[] = (dados.resultados || []).map(
                    (item: any) => ({
                        ...item,
                        regiao: item.regiao || item["região"] || "",
                    })
                );

                setResultados(locais);
                setAberto(true);
            } catch (error) {
                if (error instanceof Error && error.name !== "AbortError") {
                    setErro(error.message);
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCarregando(false);
                }
            }
        }, 350);

        return () => {
            clearTimeout(tempo);
            controlador.abort();
        };
    }, [busca, selecionada]);

    function selecionarLocal(local: Localidade) {
        onSelecionar(local);
        setBusca(local.endereco);
        setResultados([]);
        setAberto(false);
        setErro("");
    }

    function limparBusca() {
        setBusca("");
        setResultados([]);
        onSelecionar(null);
        setAberto(false);
    }

    return (
        <div className="relative min-w-0">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </label>

            <div className="mt-0.5 flex items-center gap-1 rounded-md border border-slate-200 bg-[#F8FAFC] px-2 transition-all focus-within:border-[#167D8D] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#167D8D]/10">
                {carregando ? (
                    <LoaderCircle
                        size={14}
                        className="shrink-0 animate-spin text-[#167D8D]"
                    />
                ) : (
                    <Search size={14} className="shrink-0 text-slate-400" />
                )}

                <input
                    value={busca}
                    onChange={(e) => {
                        setBusca(e.target.value);
                        onSelecionar(null);
                        setAberto(true);
                    }}
                    onFocus={() => setAberto(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-xs text-[#102A43] outline-none placeholder:text-slate-400"
                />

                {busca && (
                    <button
                        type="button"
                        onClick={limparBusca}
                        className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                        aria-label="Limpar pesquisa"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {aberto && busca.trim().length >= 2 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {carregando && (
                        <p className="p-4 text-center text-sm text-slate-500">
                            Pesquisando localidades...
                        </p>
                    )}

                    {!carregando && resultados.length === 0 && !erro && (
                        <p className="p-4 text-center text-sm text-slate-500">
                            Nenhuma localidade encontrada.
                        </p>
                    )}

                    {erro && (
                        <p className="p-4 text-sm text-red-600">{erro}</p>
                    )}

                    {resultados.map((local) => (
                        <button
                            type="button"
                            key={local.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selecionarLocal(local)}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[#E6F7F7]"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                <MapPin size={21} />
                            </div>

                            <div className="min-w-0">
                                <p className="font-semibold text-[#102A43]">
                                    {local.nome}
                                </p>

                                <p className="truncate text-xs text-slate-500">
                                    {[local.regiao, local.pais]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}