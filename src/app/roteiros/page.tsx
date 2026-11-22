"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/layout/Sidebar";
import dynamic from "next/dynamic";

import BuscaLocalidade, {
    type Localidade,
} from "@/components/ui/BuscaLocalidade";

const MapaRoteiro = dynamic<{ locais: any[]; transporte: string }>(
    () => import("@/components/map/MapaRoteiro").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div>Carregando mapa...</div>,
    }
);

import {
    MapPin,
    Users,
    Car,
    Plane,
    Bus,
    Bike,
    Sparkles,
    Wallet,
    CalendarDays,
    Compass,
    Check,
    ArrowRight,
    Navigation,
    LoaderCircle,
    WandSparkles,
    Map,
    CloudSun,
    ClipboardList,
    Sun,
    Cloud,
    CloudRain,
    CloudDrizzle,
    CloudLightning,
    Droplets,
    Wind,
    Thermometer,
} from "lucide-react";

type ItemGastronomico = {
    titulo: string;
    descricao: string;
    icone: string;
};

function CartaoGastronomico({
    titulo,
    descricao,
    icone,
}: ItemGastronomico) {
    return (
        <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#38BFC1] hover:shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F7F7] text-2xl">
                    {icone}
                </div>

                <div>
                    <h3 className="mb-2 font-bold text-[#102A43]">
                        {titulo}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600">
                        {descricao}
                    </p>
                    <span className="mt-3 inline-block rounded-full bg-[#E6F7F7] px-3 py-1 text-xs font-semibold text-[#167D8D]">
                        Experiência gastronômica
                    </span>
                </div>
            </div>
        </article>
    );
}

function prepararRoteiro(texto: string) {
    const regexTitulo =
        /^#{1,2}\s*Sugestões gastronômicas\s*$/im;

    const resultado = regexTitulo.exec(texto);

    if (!resultado) {
        return {
            antes: texto,
            depois: "",
            itens: [] as ItemGastronomico[],
            encontrou: false,
        };
    }

    const inicio = resultado.index;
    const fimTitulo = inicio + resultado[0].length;
    const restante = texto.slice(fimTitulo);

    const proximaSecao = /^#{1,2}\s+.+$/m.exec(restante);

    const conteudoGastronomico = proximaSecao
        ? restante.slice(0, proximaSecao.index)
        : restante;

    const depois = proximaSecao
        ? restante.slice(proximaSecao.index)
        : "";

    const linhas = conteudoGastronomico
        .split("\n")
        .map((linha) => linha.trim())
        .filter((linha) => /^[-*]\s+/.test(linha));

    const itens: ItemGastronomico[] = linhas
        .map((linha) => {
            const conteudo = linha.replace(/^[-*]\s+/, "");

            const correspondencia = conteudo.match(
                /^(?:\*\*)?(.+?)(?:\*\*)?:\s*(.+)$/
            );

            if (!correspondencia) return null;

            const titulo = correspondencia[1]
                .replace(/\*\*/g, "")
                .trim();

            const descricao = correspondencia[2]
                .replace(/\*\*/g, "")
                .trim();

            if (!titulo || !descricao) return null;

            const nome = titulo.toLowerCase();
            let icone = "🍴";

            if (
                nome.includes("peixe") ||
                nome.includes("fruto do mar")
            ) {
                icone = "🐟";
            } else if (
                nome.includes("comida") ||
                nome.includes("típica") ||
                nome.includes("culinária")
            ) {
                icone = "🍲";
            } else if (
                nome.includes("bar") ||
                nome.includes("restaurante")
            ) {
                icone = "🍽️";
            } else if (
                nome.includes("doce") ||
                nome.includes("sobremesa")
            ) {
                icone = "🍰";
            } else if (
                nome.includes("café") ||
                nome.includes("cafeteria")
            ) {
                icone = "☕";
            }

            return { titulo, descricao, icone };
        })
        .filter(
            (item): item is ItemGastronomico => item !== null
        );

    return {
        antes: texto.slice(0, inicio).trim(),
        depois: depois.trim(),
        itens,
        encontrou: true,
    };
}

function obterCondicaoClima(codigo: number) {
    const condicoes: Record<
        number,
        { descricao: string; icone: "sun" | "cloud" | "drizzle" | "rain" | "storm" }
    > = {
        0: { descricao: "Céu limpo", icone: "sun" },
        1: { descricao: "Predominantemente limpo", icone: "sun" },
        2: { descricao: "Parcialmente nublado", icone: "cloud" },
        3: { descricao: "Nublado", icone: "cloud" },
        45: { descricao: "Nevoeiro", icone: "cloud" },
        48: { descricao: "Nevoeiro com geada", icone: "cloud" },
        51: { descricao: "Garoa leve", icone: "drizzle" },
        53: { descricao: "Garoa moderada", icone: "drizzle" },
        55: { descricao: "Garoa intensa", icone: "drizzle" },
        56: { descricao: "Garoa congelante leve", icone: "drizzle" },
        57: { descricao: "Garoa congelante intensa", icone: "drizzle" },
        61: { descricao: "Chuva leve", icone: "rain" },
        63: { descricao: "Chuva moderada", icone: "rain" },
        65: { descricao: "Chuva intensa", icone: "rain" },
        66: { descricao: "Chuva congelante leve", icone: "rain" },
        67: { descricao: "Chuva congelante intensa", icone: "rain" },
        80: { descricao: "Pancadas de chuva leves", icone: "rain" },
        81: { descricao: "Pancadas de chuva moderadas", icone: "rain" },
        82: { descricao: "Pancadas de chuva fortes", icone: "rain" },
        95: { descricao: "Trovoada", icone: "storm" },
        96: { descricao: "Trovoada com granizo leve", icone: "storm" },
        99: { descricao: "Trovoada com granizo forte", icone: "storm" },
    };

    return condicoes[codigo] || {
        descricao: "Condição variável",
        icone: "cloud" as const,
    };
}

export default function RoteirosPage() {
    const [origem, setOrigem] = useState("");
    const [destino, setDestino] = useState("");

    const [origemSelecionada, setOrigemSelecionada] =
        useState<Localidade | null>(null);

    const [destinoSelecionado, setDestinoSelecionado] =
        useState<Localidade | null>(null);
    const [ida, setIda] = useState("");
    const [volta, setVolta] = useState("");
    const [viajantes, setViajantes] = useState("1");
    const [transporte, setTransporte] = useState("Carro");

    const [preferencias, setPreferencias] = useState<string[]>([]);
    const [orcamento, setOrcamento] = useState("");
    const [observacoes, setObservacoes] = useState("");

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [roteiro, setRoteiro] = useState("");
    const [locais, setLocais] = useState<any[]>([]);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [viagemSalva, setViagemSalva] = useState(false);
    const [mensagemSalvamento, setMensagemSalvamento] = useState("");
    const [abaAtiva, setAbaAtiva] = useState<
        "formulario" | "itinerario" | "mapa" | "clima" | "custos"
    >("formulario");
    const [dataHoje, setDataHoje] = useState("");
    const [clima, setClima] = useState<any>(null);
    const [carregandoClima, setCarregandoClima] = useState(false);
    const [erroClima, setErroClima] = useState("");

    const duracaoViagem =
        ida && volta
            ? Math.max(
                1,
                Math.ceil(
                    (new Date(`${volta}T12:00:00`).getTime() -
                        new Date(`${ida}T12:00:00`).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            )
            : 0;

    useEffect(() => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        setDataHoje(`${ano}-${mes}-${dia}`);
    }, []);

    useEffect(() => {
        if (
            abaAtiva !== "clima" ||
            !destinoSelecionado ||
            !ida ||
            !volta
        ) {
            return;
        }

        async function buscarClima() {
            setCarregandoClima(true);
            setErroClima("");
            setClima(null);

            try {
                const parametros = new URLSearchParams({
                    latitude: String(destinoSelecionado!.latitude),
                    longitude: String(destinoSelecionado!.longitude),
                    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_mean,wind_speed_10m_max",
                    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
                    timezone: "auto",
                    start_date: ida,
                    end_date: volta,
                });

                const resposta = await fetch(
                    `https://api.open-meteo.com/v1/forecast?${parametros.toString()}`
                );

                if (!resposta.ok) {
                    throw new Error("Não foi possível consultar a previsão do clima.");
                }

                const dados = await resposta.json();
                setClima(dados);
            } catch (error) {
                setErroClima(
                    error instanceof Error
                        ? error.message
                        : "Ocorreu um erro ao consultar o clima."
                );
            } finally {
                setCarregandoClima(false);
            }
        }

        buscarClima();
    }, [abaAtiva, destinoSelecionado, ida, volta]);

    const transportes = [
        { nome: "Carro", icon: Car },
        { nome: "Moto", icon: Bike },
        { nome: "Ônibus", icon: Bus },
        { nome: "Avião", icon: Plane },
    ];

    const tiposViagem = [
        "Praias e natureza",
        "História e cultura",
        "Gastronomia",
        "Aventura",
        "Passeios econômicos",
        "Compras",
        "Vida noturna",
        "Passeios em família",
    ];

    function alternarPreferencia(tipo: string) {
        setPreferencias((atuais) =>
            atuais.includes(tipo)
                ? atuais.filter((item) => item !== tipo)
                : [...atuais, tipo]
        );
    }

    async function salvarViagem() {
        if (!roteiro || viagemSalva || salvando) return;

        setSalvando(true);
        setMensagemSalvamento("");

        try {
            const resposta = await fetch("/api/viagens", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    origem,
                    destino,
                    ida,
                    volta,
                    viajantes: Number(viajantes),
                    transporte,
                    orcamento: orcamento ? Number(orcamento) : null,
                    preferencias,
                    observacoes,
                    roteiro,
                    locais,
                }),
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível salvar sua viagem."
                );
            }

            setViagemSalva(true);
            setMensagemSalvamento("Sua viagem foi salva em Minhas Viagens!");
        } catch (error) {
            console.error("Erro ao salvar viagem:", error);

            setMensagemSalvamento(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao salvar sua viagem."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function gerarRoteiro() {
        const controlador = new AbortController();

        const tempoLimite = setTimeout(() => {
            controlador.abort();
        }, 60000);

        setCarregando(true);
        setErro("");
        setRoteiro("");
        setMostrarConfirmacao(false);
        setViagemSalva(false);
        setMensagemSalvamento("");

        try {
            const resposta = await fetch("/api/roteiros", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controlador.signal,
                body: JSON.stringify({
                    origem,
                    destino,
                    ida,
                    volta,
                    viajantes: Number(viajantes),
                    transporte,
                    preferencias,
                    orcamento: orcamento ? Number(orcamento) : null,
                    observacoes,
                }),
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível gerar o roteiro."
                );
            }

            if (!dados.roteiro) {
                throw new Error(
                    "A IA não retornou um roteiro válido."
                );
            }

            setRoteiro(dados.roteiro);
            setAbaAtiva("itinerario");
            setMostrarConfirmacao(true);
            setLocais(dados.locais || []);
        } catch (error) {
            console.error("Erro ao gerar roteiro:", error);

            if (error instanceof Error && error.name === "AbortError") {
                setErro(
                    "A geração demorou mais que o esperado. Tente novamente em alguns instantes."
                );
            } else {
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Ocorreu um erro inesperado."
                );
            }
        } finally {
            clearTimeout(tempoLimite);
            setCarregando(false);
        }
    }

    const formularioInvalido =
        !origemSelecionada ||
        !destinoSelecionado ||
        !ida ||
        !volta ||
        !dataHoje ||
        ida < dataHoje ||
        volta < ida;

    const roteiroPreparado = prepararRoteiro(roteiro);

    const markdownComponents = {
        h1: ({ children }: { children?: React.ReactNode }) => (
            <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-[#102A43] md:text-3xl">
                {children}
            </h1>
        ),

        h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 className="my-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-[#F0F7FA] px-5 py-4 text-lg font-bold text-[#102A43] shadow-sm md:text-xl">
                <span className="h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#38BFC1] to-[#167D8D]" />
                {children}
            </h2>
        ),

        h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 className="mb-3 mt-7 flex items-center gap-2 text-base font-bold text-[#167D8D] md:text-lg">
                <span className="h-2 w-2 rounded-full bg-[#38BFC1]" />
                {children}
            </h3>
        ),

        p: ({ children }: { children?: React.ReactNode }) => (
            <p className="mb-4 max-w-4xl text-[15px] leading-8 text-slate-600">
                {children}
            </p>
        ),

        ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="my-5 space-y-3">{children}</ul>
        ),

        ol: ({ children }: { children?: React.ReactNode }) => (
            <ol className="my-5 list-decimal space-y-3 pl-6 marker:font-bold marker:text-[#167D8D]">
                {children}
            </ol>
        ),

        li: ({ children }: { children?: React.ReactNode }) => (
            <li className="rounded-xl border border-slate-100 bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-slate-600 shadow-sm">
                {children}
            </li>
        ),

        strong: ({ children }: { children?: React.ReactNode }) => (
            <strong className="font-bold text-[#102A43]">
                {children}
            </strong>
        ),

        em: ({ children }: { children?: React.ReactNode }) => (
            <em className="font-semibold text-[#167D8D] not-italic">
                {children}
            </em>
        ),

        hr: () => <hr className="my-8 border-slate-200" />,

        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="my-6 rounded-2xl border border-[#BCE8E7] bg-gradient-to-r from-[#E6F7F7] to-[#F4FBFB] px-6 py-5 text-[#102A43] shadow-sm">
                {children}
            </blockquote>
        ),

        table: ({ children }: { children?: React.ReactNode }) => (
            <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full border-collapse text-sm">
                    {children}
                </table>
            </div>
        ),

        th: ({ children }: { children?: React.ReactNode }) => (
            <th className="bg-[#102A43] p-4 text-left font-semibold text-white">
                {children}
            </th>
        ),

        td: ({ children }: { children?: React.ReactNode }) => (
            <td className="border-t border-slate-100 p-4 text-slate-600">
                {children}
            </td>
        ),
    };

    function formatarMarkdown(texto: string) {
        return texto
            .replace(
                /^[-*]\s*(\*?TOTAL ESTIMADO:.*\*?)$/im,
                "> $1"
            )
            .replace(
                /(?<!\*)R\$\s*[\d.]+,\d{2}(?!\*)/g,
                (valor) => `**${valor}**`
            );
    }

    const duracao =
        ida && volta
            ? Math.ceil(
                (new Date(`${volta}T00:00:00`).getTime() -
                    new Date(`${ida}T00:00:00`).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
            : 0;

    const classeCampo =
        "mt-0.5 flex items-center rounded-md border border-slate-200 bg-[#F8FAFC] px-2 transition-all focus-within:border-[#167D8D] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#167D8D]/10";

    const classeInput =
        "w-full min-w-0 bg-transparent px-1.5 py-1.5 text-xs text-[#102A43] outline-none placeholder:text-slate-400";

    const classeLabel =
        "text-[10px] font-semibold uppercase tracking-wide text-slate-500";

    return (
        <div className="min-h-screen bg-[#F4F7FA]">
            <Sidebar />

            <main className="ml-0 min-h-screen min-w-0 p-3 pt-20 md:p-5 lg:ml-[264px] lg:pt-5">
                <div className="mx-auto max-w-7xl">
                    {/* CABEÇALHO + CONTEÚDO PRINCIPAL + COLUNA DIREITA */}
                    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                        {/* COLUNA ESQUERDA */}
                        <div className="flex min-w-0 flex-col gap-4">
                            {/* HERO / CABEÇALHO */}
                            <header className="relative flex flex-col justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#102A43] via-[#123B56] to-[#167D8D] px-4 py-5 text-white shadow-xl sm:px-5">
                                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
                                <div className="pointer-events-none absolute -right-4 -top-12 h-44 w-44 rounded-full border border-white/10" />

                                <div className="relative z-10">
                                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                                        <Sparkles size={12} className="text-[#65E0D9]" />
                                        <span className="text-[10px] font-semibold tracking-[0.15em] text-white/90">
                                            PLANEJAMENTO INTELIGENTE
                                        </span>
                                    </div>

                                    <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                                        Sua próxima viagem começa aqui
                                        <span className="text-[#65E0D9]">.</span>
                                    </h1>

                                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">
                                        Personalize sua experiência e deixe a IA do TripIA transformar seus planos em uma viagem inesquecível.
                                    </p>
                                </div>

                                <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-sm">
                                        <CalendarDays size={20} className="mb-3 text-[#65E0D9]" />
                                        <p className="text-[11px] text-slate-200">Duração</p>
                                        <p className="mt-1 text-lg font-bold">
                                            {duracaoViagem > 0 ? `${duracaoViagem} dias` : "--"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                        <Users size={20} className="mb-3 text-[#65E0D9]" />
                                        <p className="text-[11px] text-slate-200">Viajantes</p>
                                        <p className="mt-1 text-lg font-bold">
                                            {viajantes} {Number(viajantes) === 1 ? "pessoa" : "pessoas"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                        <Compass size={20} className="mb-3 text-[#65E0D9]" />
                                        <p className="text-[11px] text-slate-200">Transporte</p>
                                        <p className="mt-1 text-lg font-bold">
                                            {transporte}
                                        </p>
                                    </div>
                                </div>

                                <div className="relative z-10 flex flex-wrap items-center gap-3 text-xs text-white/80">
                                    <span className="flex items-center gap-1.5">
                                        <Check size={13} className="text-[#65E0D9]" />
                                        Roteiros personalizados
                                    </span>

                                    <span className="flex items-center gap-1.5">
                                        <Check size={13} className="text-[#65E0D9]" />
                                        Sugestões inteligentes
                                    </span>
                                </div>

                                <div className="pointer-events-none absolute bottom-4 right-4 hidden h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 md:flex">
                                    <Compass size={34} strokeWidth={1.2} className="text-[#65E0D9]" />
                                </div>
                            </header>

                            {/* NAVEGAÇÃO DE ABAS */}
                            <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                                <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                    <button
                                        type="button"
                                        onClick={() => setAbaAtiva("formulario")}
                                        className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-3 text-xs font-semibold transition sm:px-3 sm:text-sm ${abaAtiva === "formulario"
                                            ? "bg-[#102A43] text-white shadow-md"
                                            : "text-slate-500 hover:bg-[#F0F7FA] hover:text-[#167D8D]"
                                            }`}
                                    >
                                        <ClipboardList size={17} />
                                        Formulário
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAbaAtiva("itinerario")}
                                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${abaAtiva === "itinerario"
                                            ? "bg-[#102A43] text-white shadow-md"
                                            : "text-slate-500 hover:bg-[#F0F7FA] hover:text-[#167D8D]"
                                            }`}
                                    >
                                        <CalendarDays size={17} />
                                        Itinerário
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAbaAtiva("mapa")}
                                        className={`col-span-2 flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-3 text-xs font-semibold transition sm:col-span-1 sm:px-3 sm:text-sm ${abaAtiva === "mapa"
                                            ? "bg-[#102A43] text-white shadow-md"
                                            : "text-slate-500 hover:bg-[#F0F7FA] hover:text-[#167D8D]"
                                            }`}
                                    >
                                        Mapa da Viagem
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAbaAtiva("clima")}
                                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${abaAtiva === "clima"
                                            ? "bg-[#102A43] text-white shadow-md"
                                            : "text-slate-500 hover:bg-[#F0F7FA] hover:text-[#167D8D]"
                                            }`}
                                    >
                                        <CloudSun size={17} />
                                        Clima
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAbaAtiva("custos")}
                                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${abaAtiva === "custos"
                                            ? "bg-[#102A43] text-white shadow-md"
                                            : "text-slate-500 hover:bg-[#F0F7FA] hover:text-[#167D8D]"
                                            }`}
                                    >
                                        <Wallet size={17} />
                                        Custos
                                    </button>
                                </nav>
                            </div>

                            {/* FORMULÁRIO */}
                            {abaAtiva === "formulario" && (
                                <section className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_40px_rgba(16,42,67,0.06)]">
                                    <div className="mb-2 flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F7F7]">
                                            <Compass className="text-[#167D8D]" size={15} />
                                        </div>
                                        <h2 className="text-sm font-bold text-[#102A43]">
                                            Informações da viagem
                                        </h2>
                                    </div>

                                    <div className="space-y-1.5">
                                        {/* Origem e destino */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <BuscaLocalidade
                                                label="Cidade de origem"
                                                placeholder="Cidade de origem..."
                                                selecionada={origemSelecionada}
                                                onSelecionar={(local) => {
                                                    setOrigemSelecionada(local);
                                                    setOrigem(local?.endereco || "");
                                                }}
                                            />

                                            <BuscaLocalidade
                                                label="Destino"
                                                placeholder="Para onde deseja viajar?"
                                                selecionada={destinoSelecionado}
                                                onSelecionar={(local) => {
                                                    setDestinoSelecionado(local);
                                                    setDestino(local?.endereco || "");
                                                }}
                                            />
                                        </div>

                                        {/* Datas, viajantes e orçamento */}
                                        <div className="grid grid-cols-2 gap-3 sm:gap-2">
                                            <div>
                                                <label className={classeLabel}>Ida</label>
                                                <div className={classeCampo}>
                                                    <CalendarDays size={14} className="shrink-0 text-slate-400" />
                                                    <input
                                                        type="date"
                                                        value={ida}
                                                        min={dataHoje || undefined}
                                                        onChange={(e) => {
                                                            setIda(e.target.value);
                                                            if (volta && e.target.value > volta) {
                                                                setVolta("");
                                                            }
                                                        }}
                                                        className={classeInput}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className={classeLabel}>Volta</label>
                                                <div className={classeCampo}>
                                                    <CalendarDays size={14} className="shrink-0 text-slate-400" />
                                                    <input
                                                        type="date"
                                                        value={volta}
                                                        min={ida || dataHoje || undefined}
                                                        onChange={(e) => setVolta(e.target.value)}
                                                        className={classeInput}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className={classeLabel}>Viajantes</label>
                                                <div className={classeCampo}>
                                                    <Users size={14} className="shrink-0 text-slate-400" />
                                                    <select
                                                        value={viajantes}
                                                        onChange={(e) => setViajantes(e.target.value)}
                                                        className={classeInput}
                                                    >
                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                            <option key={n} value={n}>
                                                                {n} {n === 1 ? "viajante" : "viajantes"}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={classeLabel}>Orçamento</label>
                                                <div className={classeCampo}>
                                                    <Wallet size={14} className="shrink-0 text-slate-400" />
                                                    <span className="ml-1 text-xs font-semibold text-slate-500">R$</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={orcamento}
                                                        onChange={(e) => setOrcamento(e.target.value)}
                                                        placeholder="3000"
                                                        className={classeInput}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transporte */}
                                        <div>
                                            <h3 className={classeLabel}>Transporte</h3>

                                            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {transportes.map((item) => {
                                                    const Icon = item.icon;
                                                    const ativo = transporte === item.nome;

                                                    return (
                                                        <button
                                                            key={item.nome}
                                                            type="button"
                                                            onClick={() => setTransporte(item.nome)}
                                                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${ativo
                                                                ? "border-[#167D8D] bg-[#E6F7F7] text-[#167D8D]"
                                                                : "border-slate-200 bg-white text-slate-600 hover:border-[#38BFC1]"
                                                                }`}
                                                        >
                                                            <Icon size={16} />
                                                            {item.nome}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Preferências */}
                                        <div>
                                            <h3 className={classeLabel}>Estilo da viagem</h3>

                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {tiposViagem.map((tipo) => {
                                                    const selecionado = preferencias.includes(tipo);

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={tipo}
                                                            onClick={() => alternarPreferencia(tipo)}
                                                            className={`rounded-full border px-3 py-1.5 text-xs transition-all ${selecionado
                                                                ? "border-[#167D8D] bg-[#E6F7F7] font-semibold text-[#102A43]"
                                                                : "border-slate-200 bg-white text-slate-600 hover:border-[#38BFC1]"
                                                                }`}
                                                        >
                                                            {tipo}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Observações */}
                                        <div>
                                            <label className={classeLabel}>O que você precisa na viagem?</label>
                                            <textarea
                                                value={observacoes}
                                                onChange={(e) => setObservacoes(e.target.value)}
                                                placeholder="Conte tudo o que quiser para a IA: lugares que quer visitar, comidas que quer provar, ritmo da viagem, o que evitar..."
                                                rows={3}
                                                className="mt-1 h-[76px] min-h-[76px] w-full resize-none overflow-y-auto rounded-md border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm leading-6 text-[#102A43] outline-none transition-all placeholder:text-slate-400 focus:border-[#167D8D] focus:bg-white focus:ring-2 focus:ring-[#167D8D]/10"
                                            />
                                        </div>

                                        {/* Botão */}
                                        <button
                                            type="button"
                                            disabled={formularioInvalido || carregando}
                                            onClick={gerarRoteiro}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#102A43] to-[#167D8D] py-2.5 text-sm font-bold text-white shadow-md shadow-[#167D8D]/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                        >
                                            {carregando ? (
                                                <>
                                                    <LoaderCircle size={16} className="animate-spin" />
                                                    Preparando sua viagem...
                                                </>
                                            ) : (
                                                <>
                                                    <WandSparkles size={16} />
                                                    Criar meu roteiro com IA
                                                    <ArrowRight size={14} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </section>
                            )}

                            {/* ROTEIRO GERADO */}
                            {roteiro && abaAtiva === "itinerario" && (
                                <section className="mt-4 space-y-6">
                                    {/* BANNER DO ROTEIRO */}
                                    <div className="relative overflow-hidden rounded-[28px] bg-[#102A43] p-7 text-white shadow-xl md:p-10">
                                        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
                                        <div className="absolute -right-5 -top-10 h-52 w-52 rounded-full border border-white/10" />

                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-2 rounded-full border border-[#65E0D9]/30 bg-[#65E0D9]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#65E0D9]">
                                                <Sparkles size={15} />
                                                Roteiro inteligente TripIA
                                            </span>

                                            <h2 className="mt-6 text-2xl font-extrabold leading-tight sm:text-3xl md:text-5xl">
                                                {origem}
                                                <ArrowRight className="mx-3 inline text-[#65E0D9]" size={30} />
                                                {destino}
                                            </h2>

                                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                                                Sua viagem foi planejada com inteligência artificial,
                                                considerando suas preferências e informações fornecidas.
                                            </p>

                                            <div className="mt-7 flex flex-wrap gap-3">
                                                <span className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                                                    <CalendarDays size={17} className="text-[#65E0D9]" />
                                                    {duracao} dias
                                                </span>

                                                <span className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                                                    <Users size={17} className="text-[#65E0D9]" />
                                                    {viajantes} viajantes
                                                </span>

                                                <span className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                                                    <Compass size={17} className="text-[#65E0D9]" />
                                                    {transporte}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DECISÃO SOBRE O ROTEIRO */}
                                    {mostrarConfirmacao && (
                                        <div className="rounded-3xl border border-[#BCE8E7] bg-gradient-to-r from-white to-[#E6F7F7] p-6 shadow-sm md:p-8">
                                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="mb-2 flex items-center gap-2 text-[#167D8D]">
                                                        <Sparkles size={19} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">
                                                            Sua sugestão está pronta
                                                        </span>
                                                    </div>

                                                    <h3 className="text-xl font-extrabold text-[#102A43]">
                                                        O que deseja fazer agora?
                                                    </h3>

                                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                                        Gostou deste roteiro? Você pode guardá-lo em Minhas
                                                        Viagens ou pedir à inteligência artificial uma nova sugestão.
                                                    </p>
                                                </div>

                                                <div className="flex w-full flex-col gap-3 md:w-60">
                                                    <button
                                                        type="button"
                                                        onClick={salvarViagem}
                                                        disabled={salvando || viagemSalva}
                                                        className="flex items-center justify-center gap-2 rounded-xl bg-[#167D8D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#102A43] disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {salvando ? (
                                                            <>
                                                                <LoaderCircle size={17} className="animate-spin" />
                                                                Salvando...
                                                            </>
                                                        ) : viagemSalva ? (
                                                            <>
                                                                <Check size={17} />
                                                                Viagem salva
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check size={17} />
                                                                Salvar viagem
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={gerarRoteiro}
                                                        disabled={carregando}
                                                        className="flex items-center justify-center gap-2 rounded-xl border border-[#167D8D] bg-white px-5 py-3 text-sm font-bold text-[#167D8D] transition hover:bg-[#E6F7F7] disabled:opacity-50"
                                                    >
                                                        <WandSparkles size={17} />
                                                        Refazer sugestão
                                                    </button>
                                                </div>
                                            </div>

                                            {mensagemSalvamento && (
                                                <p
                                                    className={`mt-4 text-sm font-semibold ${viagemSalva ? "text-[#167D8D]" : "text-red-600"
                                                        }`}
                                                >
                                                    {mensagemSalvamento}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* ITINERÁRIO */}
                                    <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                        <div className="border-b border-slate-100 p-6 md:p-8">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7] text-[#167D8D]">
                                                    <CalendarDays size={23} />
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-extrabold text-[#102A43]">
                                                        Seu itinerário
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        Programação personalizada da sua viagem
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 md:p-8">
                                            {roteiroPreparado.antes && (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={markdownComponents}
                                                >
                                                    {formatarMarkdown(roteiroPreparado.antes)}
                                                </ReactMarkdown>
                                            )}

                                            {roteiroPreparado.encontrou && (
                                                <section className="my-10 border-t border-slate-100 pt-8">
                                                    <div className="mb-6 flex items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7] text-2xl">
                                                            🍽️
                                                        </div>

                                                        <div>
                                                            <h3 className="text-xl font-extrabold text-[#102A43]">
                                                                Experiências gastronômicas
                                                            </h3>
                                                            <p className="text-sm text-slate-500">
                                                                Sabores para descobrir durante a viagem.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {roteiroPreparado.itens.length > 0 ? (
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            {roteiroPreparado.itens.map((item, index) => (
                                                                <CartaoGastronomico
                                                                    key={`${item.titulo}-${index}`}
                                                                    titulo={item.titulo}
                                                                    descricao={item.descricao}
                                                                    icone={item.icone}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                                            Confira as sugestões gastronômicas na resposta completa da IA.
                                                        </p>
                                                    )}
                                                </section>
                                            )}

                                            {roteiroPreparado.depois && (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={markdownComponents}
                                                >
                                                    {formatarMarkdown(roteiroPreparado.depois)}
                                                </ReactMarkdown>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-5 text-center">
                                            <p className="text-xs font-medium text-slate-500">
                                                <Sparkles size={14} className="mr-1 inline text-[#167D8D]" />
                                                Planejado com inteligência artificial pelo TripIA.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* ERRO */}
                            {erro && (
                                <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                                    {erro}
                                </div>
                            )}

                            {/* CARREGAMENTO */}
                            {carregando && (
                                <div className="mt-4 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F7F7]">
                                        <Sparkles size={30} className="animate-pulse text-[#167D8D]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#102A43]">
                                        Criando sua próxima aventura
                                    </h2>
                                    <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                                        Nossa inteligência artificial está organizando destinos, experiências e sugestões para sua viagem.
                                    </p>
                                </div>
                            )}

                            {/* ABA CLIMA */}
                            {abaAtiva === "clima" && (
                                <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7] text-[#167D8D]">
                                            <CloudSun size={25} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-[#102A43]">
                                                Clima da viagem
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                Consulte as condições climáticas do seu destino.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-6">
                                        {carregandoClima && (
                                            <div className="rounded-2xl bg-[#F0F7FA] p-8 text-center">
                                                <CloudSun size={38} className="mx-auto animate-pulse text-[#167D8D]" />
                                                <p className="mt-3 font-medium text-[#102A43]">
                                                    Consultando previsão do clima...
                                                </p>
                                            </div>
                                        )}

                                        {erroClima && (
                                            <div className="rounded-2xl bg-red-50 p-5 text-center text-sm text-red-600">
                                                {erroClima}
                                            </div>
                                        )}

                                        {!carregandoClima && !erroClima && clima && (
                                            <>
                                                {(() => {
                                                    const condicaoAtual = obterCondicaoClima(clima.current.weather_code);

                                                    const icones = {
                                                        sun: Sun,
                                                        cloud: Cloud,
                                                        drizzle: CloudDrizzle,
                                                        rain: CloudRain,
                                                        storm: CloudLightning,
                                                    };

                                                    const IconeAtual = icones[condicaoAtual.icone];

                                                    return (
                                                        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#102A43] via-[#167D8D] to-[#38BFC1] p-6 text-white shadow-xl md:p-8">
                                                            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
                                                            <div className="absolute -right-5 -top-5 h-44 w-44 rounded-full border border-white/10" />

                                                            <div className="relative z-10">
                                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                                    <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider">
                                                                        <CloudSun size={15} className="mr-2 inline" />
                                                                        Previsão do destino
                                                                    </span>

                                                                    <span className="text-xs text-white/80">
                                                                        {ida && volta
                                                                            ? `${new Date(`${ida}T12:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${volta}T12:00:00`).toLocaleDateString("pt-BR")}`
                                                                            : "Período da viagem"}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
                                                                    <div>
                                                                        <p className="flex items-center gap-2 text-sm text-white/80">
                                                                            <MapPin size={17} />
                                                                            {destino || "Seu destino"}
                                                                        </p>

                                                                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                                                                            Olá, viajante!
                                                                        </h2>

                                                                        <p className="mt-2 text-sm text-white/80">
                                                                            Confira as condições climáticas do seu destino.
                                                                        </p>

                                                                        <div className="mt-7 flex items-center gap-5">
                                                                            <IconeAtual size={76} strokeWidth={1.4} />

                                                                            <div>
                                                                                <p className="text-6xl font-bold tracking-tight">
                                                                                    {Math.round(clima.current.temperature_2m)}°
                                                                                </p>
                                                                                <p className="mt-1 text-sm font-medium">
                                                                                    {condicaoAtual.descricao}
                                                                                </p>
                                                                                <p className="mt-1 text-xs text-white/75">
                                                                                    Sensação de {Math.round(clima.current.apparent_temperature)}°C
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                                                            <Droplets size={23} className="text-[#A5F3FC]" />
                                                                            <p className="mt-4 text-xs text-white/75">Umidade</p>
                                                                            <p className="mt-1 text-2xl font-bold">
                                                                                {clima.current.relative_humidity_2m}%
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                                                            <Wind size={23} className="text-[#A5F3FC]" />
                                                                            <p className="mt-4 text-xs text-white/75">Vento</p>
                                                                            <p className="mt-1 text-2xl font-bold">
                                                                                {clima.current.wind_speed_10m} km/h
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                                                            <CloudRain size={23} className="text-[#A5F3FC]" />
                                                                            <p className="mt-4 text-xs text-white/75">Precipitação</p>
                                                                            <p className="mt-1 text-2xl font-bold">
                                                                                {clima.current.precipitation} mm
                                                                            </p>
                                                                        </div>

                                                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                                                            <Thermometer size={23} className="text-[#A5F3FC]" />
                                                                            <p className="mt-4 text-xs text-white/75">Sensação térmica</p>
                                                                            <p className="mt-1 text-2xl font-bold">
                                                                                {Math.round(clima.current.apparent_temperature)}°C
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                <div>
                                                    <h3 className="mb-4 text-lg font-bold text-[#102A43]">
                                                        Previsão durante a viagem
                                                    </h3>

                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                                        {clima.daily.time.map((data: string, index: number) => {
                                                            const condicao = obterCondicaoClima(
                                                                clima.daily.weather_code[index]
                                                            );

                                                            const icones = {
                                                                sun: Sun,
                                                                cloud: Cloud,
                                                                drizzle: CloudDrizzle,
                                                                rain: CloudRain,
                                                                storm: CloudLightning,
                                                            };

                                                            const IconeClima = icones[condicao.icone];

                                                            return (
                                                                <article
                                                                    key={data}
                                                                    className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                                                >
                                                                    <div className="bg-gradient-to-br from-[#E6F7F7] to-[#F0F7FA] p-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <p className="text-xs font-semibold uppercase tracking-wider text-[#167D8D]">
                                                                                    {index === 0 ? "Primeiro dia" : `Dia ${index + 1}`}
                                                                                </p>

                                                                                <h4 className="mt-1 text-lg font-bold capitalize text-[#102A43]">
                                                                                    {new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
                                                                                        weekday: "long",
                                                                                    })}
                                                                                </h4>

                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    {new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
                                                                                        day: "2-digit",
                                                                                        month: "long",
                                                                                    })}
                                                                                </p>
                                                                            </div>

                                                                            <IconeClima
                                                                                size={38}
                                                                                strokeWidth={1.5}
                                                                                className="text-[#167D8D] transition-transform group-hover:scale-110"
                                                                            />
                                                                        </div>

                                                                        <p className="mt-5 text-sm font-semibold text-[#167D8D]">
                                                                            {condicao.descricao}
                                                                        </p>

                                                                        <div className="mt-3 flex items-end gap-3">
                                                                            <span className="text-4xl font-extrabold text-[#102A43]">
                                                                                {Math.round(clima.daily.temperature_2m_max[index])}°
                                                                            </span>

                                                                            <span className="mb-1 text-lg font-semibold text-slate-400">
                                                                                {Math.round(clima.daily.temperature_2m_min[index])}°
                                                                            </span>

                                                                            <span className="mb-1 text-xs text-slate-500">
                                                                                Máx. / Mín.
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-3 divide-x divide-slate-100 p-3">
                                                                        <div className="px-2 text-center">
                                                                            <Droplets size={19} className="mx-auto text-[#167D8D]" />
                                                                            <p className="mt-2 text-[10px] text-slate-400">
                                                                                Chuva
                                                                            </p>
                                                                            <p className="mt-1 text-sm font-bold text-[#102A43]">
                                                                                {clima.daily.precipitation_probability_max[index] ?? "—"}%
                                                                            </p>
                                                                        </div>

                                                                        <div className="px-2 text-center">
                                                                            <CloudRain size={19} className="mx-auto text-[#167D8D]" />
                                                                            <p className="mt-2 text-[10px] text-slate-400">
                                                                                Umidade
                                                                            </p>
                                                                            <p className="mt-1 text-sm font-bold text-[#102A43]">
                                                                                {clima.daily.relative_humidity_2m_mean[index] ?? "—"}%
                                                                            </p>
                                                                        </div>

                                                                        <div className="px-2 text-center">
                                                                            <Wind size={19} className="mx-auto text-[#167D8D]" />
                                                                            <p className="mt-2 text-[10px] text-slate-400">
                                                                                Vento
                                                                            </p>
                                                                            <p className="mt-1 text-sm font-bold text-[#102A43]">
                                                                                {clima.daily.wind_speed_10m_max[index] ?? "—"}
                                                                            </p>
                                                                            <p className="text-[9px] text-slate-400">km/h</p>
                                                                        </div>
                                                                    </div>
                                                                </article>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="mt-6 rounded-2xl border border-[#38BFC1]/30 bg-[#F0F7FA] p-5">
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <Sparkles className="h-5 w-5 text-[#167D8D]" />
                                                            <h3 className="font-bold text-[#102A43]">
                                                                Dicas inteligentes do TripIA
                                                            </h3>
                                                        </div>

                                                        <div className="space-y-2 text-sm text-slate-700">
                                                            {clima.daily.precipitation_probability_max.some(
                                                                (chance: number) => chance >= 60
                                                            ) && (
                                                                    <p>
                                                                        <strong>Leve uma capa de chuva:</strong> há possibilidade
                                                                        de chuva durante alguns dias da sua viagem.
                                                                    </p>
                                                                )}

                                                            {clima.daily.temperature_2m_max.some(
                                                                (temperatura: number) => temperatura >= 32
                                                            ) && (
                                                                    <p>
                                                                        <strong>Cuide da hidratação:</strong> as temperaturas
                                                                        podem ficar elevadas. Beba bastante água.
                                                                    </p>
                                                                )}

                                                            {clima.daily.temperature_2m_min.some(
                                                                (temperatura: number) => temperatura <= 15
                                                            ) && (
                                                                    <p>
                                                                        <strong>Prepare roupas quentes:</strong> alguns dias
                                                                        podem apresentar temperaturas mais baixas.
                                                                    </p>
                                                                )}

                                                            {!clima.daily.precipitation_probability_max.some(
                                                                (chance: number) => chance >= 60
                                                            ) &&
                                                                !clima.daily.temperature_2m_max.some(
                                                                    (temperatura: number) => temperatura >= 32
                                                                ) &&
                                                                !clima.daily.temperature_2m_min.some(
                                                                    (temperatura: number) => temperatura <= 15
                                                                ) && (
                                                                    <p>
                                                                        <strong>Condições favoráveis:</strong> não foram
                                                                        identificados alertas importantes para o período.
                                                                        Aproveite sua viagem!
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {!carregandoClima && !erroClima && !clima && (
                                            <div className="rounded-2xl bg-[#F0F7FA] p-6 text-center">
                                                <CloudSun size={38} className="mx-auto text-[#167D8D]" />
                                                <p className="mt-3 font-medium text-[#102A43]">
                                                    Selecione o destino e as datas da viagem para consultar o clima.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* ABA CUSTOS */}
                            {abaAtiva === "custos" && (
                                <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7] text-[#167D8D]">
                                            <Wallet size={25} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-[#102A43]">
                                                Custos da viagem
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                Acompanhe os gastos previstos para seu planejamento.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-2xl bg-[#F0F7FA] p-6 text-center">
                                        <Wallet size={38} className="mx-auto text-[#167D8D]" />
                                        <h3 className="mt-3 font-bold text-[#102A43]">
                                            Controle de custos em breve
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Estamos preparando esta área para organizar e acompanhar os gastos da sua viagem.
                                        </p>
                                    </div>
                                </section>
                            )}

                            {/* MAPA DO ROTEIRO */}
                            {abaAtiva === "mapa" && (
                                <div className="mt-4">
                                    <MapaRoteiro locais={locais} transporte={transporte} />
                                </div>
                            )}
                        </div>

                        {/* COLUNA DIREITA */}
                        <aside className="min-w-0 space-y-5">
                            {abaAtiva === "formulario" && (
                                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                            <Compass size={20} />
                                        </div>

                                        <div>
                                            <h2 className="font-bold text-[#102A43]">
                                                Visão geral
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Resumo do seu planejamento
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-400">Origem</p>
                                            <p className="font-semibold text-[#102A43]">
                                                {origem || "Não definida"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Destino</p>
                                            <p className="font-semibold text-[#102A43]">
                                                {destino || "Não definido"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Período</p>
                                            <p className="font-semibold text-[#102A43]">
                                                {ida && volta
                                                    ? `${new Date(`${ida}T00:00:00`).toLocaleDateString("pt-BR")} até ${new Date(`${volta}T00:00:00`).toLocaleDateString("pt-BR")}`
                                                    : "Datas não definidas"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Viajantes</p>
                                            <p className="font-semibold text-[#102A43]">
                                                {viajantes} {Number(viajantes) === 1 ? "pessoa" : "pessoas"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Transporte</p>
                                            <p className="font-semibold text-[#102A43]">
                                                {transporte}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* PAINÉIS DAS ABAS ITINERÁRIO E MAPA */}
                            {(abaAtiva === "itinerario" || abaAtiva === "mapa") && (
                                <>
                                    {/* EXPERIÊNCIAS GASTRONÔMICAS */}
                                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-xl">
                                                🍽️
                                            </div>

                                            <div>
                                                <h2 className="font-bold text-[#102A43]">
                                                    Gastronomia
                                                </h2>
                                                <p className="text-xs text-slate-500">
                                                    Sabores para descobrir
                                                </p>
                                            </div>
                                        </div>

                                        {roteiroPreparado.itens.length > 0 ? (
                                            <div className="space-y-3">
                                                {roteiroPreparado.itens.slice(0, 3).map((item, index) => (
                                                    <div
                                                        key={`${item.titulo}-${index}`}
                                                        className="rounded-xl bg-[#F0F7FA] p-3"
                                                    >
                                                        <p className="text-sm font-bold text-[#102A43]">
                                                            {item.icone} {item.titulo}
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-slate-600">
                                                            {item.descricao}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl bg-[#F0F7FA] p-4 text-center">
                                                <p className="text-sm font-semibold text-[#102A43]">
                                                    Descubra os sabores do destino!
                                                </p>
                                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                                    Gere seu roteiro com IA para receber sugestões gastronômicas personalizadas.
                                                </p>
                                            </div>
                                        )}
                                    </section>

                                    {/* CLIMA DO DESTINO */}
                                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                                <CloudSun size={22} />
                                            </div>

                                            <div>
                                                <h2 className="font-bold text-[#102A43]">
                                                    Clima do destino
                                                </h2>
                                                <p className="text-xs text-slate-500">
                                                    Condições meteorológicas
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-[#F0F7FA] p-4 text-center">
                                            <CloudSun size={30} className="mx-auto text-[#167D8D]" />

                                            <p className="mt-3 text-sm font-semibold text-[#102A43]">
                                                {destino || "Escolha seu destino"}
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {destino
                                                    ? "A previsão meteorológica estará disponível em breve."
                                                    : "Informe um destino para acompanhar as condições climáticas."}
                                            </p>
                                        </div>
                                    </section>

                                    {/* SERVIÇOS PRÓXIMOS */}
                                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                                <MapPin size={21} />
                                            </div>

                                            <div>
                                                <h2 className="font-bold text-[#102A43]">
                                                    Serviços próximos
                                                </h2>
                                                <p className="text-xs text-slate-500">
                                                    Facilidades no seu destino
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {[
                                                { nome: "Hospitais e farmácias", icone: "🏥" },
                                                { nome: "Postos de combustível", icone: "⛽" },
                                                { nome: "Restaurantes", icone: "🍽️" },
                                                { nome: "Hotéis e hospedagens", icone: "🏨" },
                                            ].map((servico) => (
                                                <div
                                                    key={servico.nome}
                                                    className="flex items-center gap-3 rounded-xl bg-[#F0F7FA] p-3"
                                                >
                                                    <span className="text-xl">{servico.icone}</span>

                                                    <span className="text-sm font-medium text-[#102A43]">
                                                        {servico.nome}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="mt-4 text-xs leading-5 text-slate-500">
                                            A localização de estabelecimentos reais será integrada em uma próxima etapa.
                                        </p>
                                    </section>

                                    {/* MAPA DA VIAGEM */}
                                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                                        <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-[#102A43] via-[#167D8D] to-[#38BFC1]">
                                            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/20" />
                                            <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full border border-white/20" />

                                            <div className="relative text-center text-white">
                                                <MapPin size={32} className="mx-auto" />
                                                <p className="mt-2 text-sm font-bold">
                                                    Mapa da sua viagem
                                                </p>
                                                <p className="mt-1 text-xs text-white/75">
                                                    Explore seu próximo destino
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="mb-4">
                                                <p className="text-xs text-slate-400">Seu trajeto</p>
                                                <p className="mt-1 font-semibold text-[#102A43]">
                                                    {origem || "Origem"} → {destino || "Destino"}
                                                </p>
                                            </div>

                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}&travelmode=${transporte === "Avião" ? "transit" : transporte === "A pé" ? "walking" : "driving"}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    if (!origem || !destino) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${origem && destino
                                                    ? "bg-[#102A43] text-white hover:bg-[#167D8D]"
                                                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                                                    }`}
                                            >
                                                <Navigation size={17} />
                                                Abrir Google Maps
                                                <ArrowRight size={16} />
                                            </a>
                                        </div>
                                    </section>
                                </>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}