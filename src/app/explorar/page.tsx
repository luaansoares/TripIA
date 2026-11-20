
"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Search, MapPin, Star } from "lucide-react";

interface Atracao {
    xid: string;
    name: string;
    dist: number;
    rate: number;
    kinds: string;
    preview?: {
        source: string;
    };
    point: {
        lon: number;
        lat: number;
    };
}

interface ResultadoBusca {
    destino: {
        nome: string;
        pais: string;
        latitude: number;
        longitude: number;
    };
    total: number;
    atracoes: Atracao[];
}


function normalizarImagem(url: string) {
    try {
        const imagem = new URL(url);

        if (imagem.hostname === "upload.wikimedia.org") {
            imagem.pathname = imagem.pathname.replace(
                /\/\d+px-/,
                "/500px-"
            );
        }

        return imagem.toString();
    } catch {
        return url;
    }
}


export default function ExplorarPage() {
    const [destino, setDestino] = useState("");
    const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    async function buscarDestino() {
        if (destino.trim().length < 2) {
            setErro("Digite pelo menos duas letras.");
            return;
        }

        setCarregando(true);
        setErro("");
        setResultado(null);

        try {
            const resposta = await fetch(
                `/api/destinos?destino=${encodeURIComponent(destino.trim())}`
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível buscar o destino.");
            }

            setResultado(dados);
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro na pesquisa."
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex">
            <Sidebar />

            <main className="flex-1 p-8">
                <header className="mb-10">
                    <p className="text-sm text-slate-500">
                        DESCUBRA NOVOS LUGARES
                    </p>

                    <h1 className="text-3xl font-bold text-[#102A43] mt-2">
                        Explore destinos
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Encontre lugares incríveis para sua próxima viagem.
                    </p>
                </header>

                <section className="mb-10">
                    <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
                        <Search className="text-slate-400" size={22} />

                        <input
                            type="text"
                            value={destino}
                            onChange={(e) => setDestino(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") buscarDestino();
                            }}
                            placeholder="Pesquise por cidade, país ou destino..."
                            className="flex-1 outline-none text-slate-700 bg-transparent"
                        />

                        <button
                            onClick={buscarDestino}
                            disabled={carregando}
                            className="bg-[#2563EB] text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {carregando ? "Buscando..." : "Pesquisar"}
                        </button>
                    </div>
                </section>

                {erro && (
                    <p className="mb-6 text-red-600 bg-red-50 p-4 rounded-xl">
                        {erro}
                    </p>
                )}

                {resultado && (
                    <section>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-[#102A43]">
                                {resultado.destino.nome}
                            </h2>

                            <p className="text-slate-500 mt-1">
                                País: {resultado.destino.pais} · {resultado.total} atrações encontradas
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {resultado.atracoes.map((atracao) => (
                                <article
                                    key={atracao.xid}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                                >
                                    {atracao.preview?.source && (
                                        <img
                                            src={normalizarImagem(atracao.preview.source)}
                                            alt={atracao.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-48 object-cover rounded-xl mb-4"
                                        />
                                    )}
                                    <h3 className="text-lg font-semibold text-[#102A43]">
                                        {atracao.name || "Atração sem nome"}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-3">
                                        <MapPin size={16} />
                                        {Math.round(atracao.dist)} metros do centro pesquisado
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                        <Star size={16} />
                                        Classificação: {atracao.rate}/7
                                    </div>

                                    <p className="text-xs text-slate-400 mt-4">
                                        {atracao.kinds?.replaceAll("_", " ").replaceAll(",", " · ")}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
