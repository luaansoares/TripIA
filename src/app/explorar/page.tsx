
"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import {
    Search,
    MapPin,
    Star,
    Compass,
    Mountain,
    Waves,
    Landmark,
    Utensils,
    ArrowRight,
    Sparkles,
    LoaderCircle,
    Map,
    Globe2,
} from "lucide-react";

interface Atracao {
    xid: string;
    name: string;
    dist: number;
    rate: number;
    kinds: string;
    preview?: {
        source: string;
    };
    imagemAlternativa?: {
        url: string;
        titulo: string;
        autor: string;
        licenca: string;
        linkOriginal: string;
        autorUrl: string;
    } | null;
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

const destinosPopulares = [
    {
        nome: "Paris",
        pais: "França",
        categoria: "Cultura",
        imagem:
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    },
    {
        nome: "Rio de Janeiro",
        pais: "Brasil",
        categoria: "Praias",
        imagem:
            "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800",
    },
    {
        nome: "Roma",
        pais: "Itália",
        categoria: "História",
        imagem:
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    },
];

const categorias = [
    { nome: "Praias", icon: Waves, pesquisa: "praias" },
    { nome: "Natureza", icon: Mountain, pesquisa: "natureza" },
    { nome: "Cultura", icon: Landmark, pesquisa: "museus" },
    { nome: "Gastronomia", icon: Utensils, pesquisa: "restaurantes" },
];

function normalizarImagem(url?: string): string {
    if (!url) return "";

    return url.replace(
        /\/\d+px-/,
        "/500px-"
    );
}

function formatarDistancia(distancia: number) {
    if (distancia >= 1000) {
        return `${(distancia / 1000).toFixed(1)} km`;
    }

    return `${Math.round(distancia)} m`;
}

export default function ExplorarPage() {
    const [destino, setDestino] = useState("");
    const [resultado, setResultado] =
        useState<ResultadoBusca | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    async function buscarDestino(termo = destino) {
        const pesquisa = termo.trim();

        if (pesquisa.length < 2) {
            setErro("Digite pelo menos duas letras para pesquisar.");
            return;
        }

        setDestino(pesquisa);
        setCarregando(true);
        setErro("");
        setResultado(null);

        try {
            const resposta = await fetch(
                `/api/destinos?destino=${encodeURIComponent(pesquisa)}`
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível buscar esse destino."
                );
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
        <div className="flex min-h-screen bg-[#F0F7FA]">
            <Sidebar />

            <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">

                {/* Cabeçalho */}
                <header className="mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167D8D]">
                                DESCUBRA NOVOS LUGARES
                            </p>

                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102A43]">
                                Explore destinos
                            </h1>

                            <p className="mt-2 text-sm text-slate-500 md:text-base">
                                Encontre lugares incríveis para sua próxima viagem.
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 rounded-full border border-[#DCE9EF] bg-white px-4 py-2 text-sm text-[#167D8D] md:flex">
                            <Globe2 size={17} />
                            Explore o mundo
                        </div>
                    </div>
                </header>

                {/* Banner */}
                <section
                    className="relative mb-8 overflow-hidden rounded-3xl bg-[#102A43] bg-cover bg-center p-7 shadow-lg md:p-10"
                    style={{
                        backgroundImage:
                            "linear-gradient(90deg, rgba(16,42,67,0.94), rgba(16,42,67,0.55)), url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600')",
                    }}
                >
                    <div className="relative z-10 max-w-xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-sm">
                            <Sparkles size={15} className="text-[#38BFC1]" />
                            Descubra experiências extraordinárias
                        </div>

                        <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
                            Seu próximo destino está esperando.
                        </h2>

                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-blue-100 md:text-base">
                            Explore atrações, conheça novos lugares e encontre
                            inspiração para sua próxima aventura.
                        </p>
                    </div>
                </section>

                {/* Pesquisa */}
                <section className="mb-10">
                    <div className="mb-3">
                        <h2 className="text-lg font-bold text-[#102A43]">
                            Onde você quer explorar?
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Pesquise uma cidade, país ou destino turístico.
                        </p>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            buscarDestino();
                        }}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
                    >
                        <Search
                            size={22}
                            className="ml-2 hidden shrink-0 text-slate-400 sm:block"
                        />

                        <input
                            id="campo-pesquisa"
                            type="text"
                            value={destino}
                            onChange={(event) => setDestino(event.target.value)}
                            placeholder="Ex.: Paris, Rio de Janeiro, Teresina..."
                            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[#102A43] outline-none placeholder:text-slate-400"
                        />

                        <button
                            type="submit"
                            disabled={carregando}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#167D8D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#102A43] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {carregando ? (
                                <>
                                    <LoaderCircle size={18} className="animate-spin" />
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    Pesquisar
                                    <Search size={17} />
                                </>
                            )}
                        </button>
                    </form>

                    {erro && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {erro}
                        </div>
                    )}
                </section>

                {/* Categorias */}
                <section className="mb-10">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-[#102A43]">
                            Explore por categoria
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Escolha o tipo de experiência que combina com você.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {categorias.map((categoria) => {
                            const Icon = categoria.icon;

                            return (
                                <button
                                    key={categoria.nome}
                                    onClick={() => {
                                        setDestino(categoria.pesquisa);
                                        document.getElementById("campo-pesquisa")?.focus();
                                    }}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-[#38BFC1] hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                        <Icon size={21} />
                                    </div>

                                    <span className="text-sm font-semibold text-[#102A43]">
                                        {categoria.nome}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Resultados da API */}
                {resultado && (
                    <section className="mb-12">
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#167D8D]">
                                    RESULTADOS DA PESQUISA
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-[#102A43]">
                                    {resultado.destino.nome}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {resultado.destino.pais} · {resultado.total} atrações encontradas
                                </p>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-[#167D8D] shadow-sm">
                                <Map size={17} />
                                Pontos turísticos
                            </div>
                        </div>

                        {resultado.atracoes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {resultado.atracoes.map((atracao) => (
                                    <article
                                        key={atracao.xid}
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >


                                        
{/* Imagem ou espaço reservado */}
<div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#102A43] via-[#167D8D] to-[#38BFC1]">

    {/* Fundo padrão do TripIA */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <Compass size={42} strokeWidth={1.4} />

        <span className="mt-3 text-sm font-medium">
            Atração turística
        </span>

        <span className="mt-1 text-xs text-white/70">
            {resultado.destino.nome}
        </span>
    </div>

    {/* Fotografia do Unsplash ou OpenTripMap */}
{(atracao.imagemAlternativa?.url || atracao.preview?.source) && (
    <>
        <img
            src={
                atracao.imagemAlternativa?.url ||
                normalizarImagem(atracao.preview?.source)
            }
            alt={
                atracao.imagemAlternativa?.titulo ||
                atracao.name ||
                "Atração turística"
            }
            loading="lazy"
            className="absolute inset-0 z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
                event.currentTarget.style.display = "none";
            }}
        />

        {atracao.imagemAlternativa && (
            <a
                href={atracao.imagemAlternativa.linkOriginal}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute left-3 top-3 z-20 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm hover:bg-black/70"
            >
                Foto: {atracao.imagemAlternativa.autor}
            </a>
        )}
    </>
)}

    {/* Distância */}
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#102A43]/80 to-transparent p-4 pt-10">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <MapPin size={13} />
            {formatarDistancia(atracao.dist)}
        </span>
    </div>

</div>


                                        {/* Informações da atração */}
                                        <div className="p-5">
                                            <h3 className="line-clamp-2 text-lg font-bold text-[#102A43]">
                                                {atracao.name || "Atração sem nome"}
                                                
                                            </h3>

                                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                                <Star size={16} className="text-amber-500" />
                                                Classificação: {atracao.rate || "Não informada"}/7
                                            </div>

                                            <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-slate-400">
                                                {atracao.kinds
                                                    ?.replaceAll("_", " ")
                                                    .replaceAll(",", " · ")}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                                <Compass size={38} className="mx-auto text-[#167D8D]" />

                                <h3 className="mt-4 font-semibold text-[#102A43]">
                                    Nenhuma atração encontrada
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    Tente pesquisar outro destino.
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* Destinos populares */}
                {!resultado && (
                    <section className="mb-10">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-[#102A43]">
                                    Destinos populares
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Inspire-se com algumas sugestões para sua próxima viagem.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {destinosPopulares.map((item) => (
                                <button
                                    key={item.nome}
                                    onClick={() => buscarDestino(item.nome)}
                                    disabled={carregando}
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg disabled:opacity-60"
                                >
                                    <div className="relative h-52 overflow-hidden">
                                        <img
                                            src={item.imagem}
                                            alt={item.nome}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/70 to-transparent" />

                                        <span className="absolute bottom-4 left-4 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                                            {item.categoria}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-5">
                                        <div>
                                            <h3 className="font-bold text-[#102A43] group-hover:text-[#167D8D]">
                                                {item.nome}
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.pais}
                                            </p>
                                        </div>

                                        <ArrowRight
                                            size={19}
                                            className="text-[#167D8D] transition group-hover:translate-x-1"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Rodapé */}
                <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#CDE9E9] bg-gradient-to-r from-[#E5F7F7] to-white p-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#167D8D] text-white">
                            <Sparkles size={23} />
                        </div>

                        <div>
                            <h3 className="font-bold text-[#102A43]">
                                Encontrou seu próximo destino?
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Crie um roteiro personalizado com a inteligência do TripIA.
                            </p>
                        </div>
                    </div>

                    <a
                        href="/roteiros"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#167D8D]"
                    >
                        Planejar viagem
                        <ArrowRight size={17} />
                    </a>
                </section>

                <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
                    TripIA — Planeje. Explore. Viaje.
                </footer>

            </main>
        </div>
    );
}
