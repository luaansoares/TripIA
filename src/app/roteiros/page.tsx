
"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/layout/Sidebar";

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
    Clock,
    ArrowRight,
    Navigation,
    LoaderCircle,
    WandSparkles,
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

export default function RoteirosPage() {
    const [origem, setOrigem] = useState("");
    const [destino, setDestino] = useState("");
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
    const [dataHoje, setDataHoje] = useState("");

    useEffect(() => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        setDataHoje(`${ano}-${mes}-${dia}`);
    }, []);

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

    async function gerarRoteiro() {
        const controlador = new AbortController();

        const tempoLimite = setTimeout(() => {
            controlador.abort();
        }, 60000);

        setCarregando(true);
        setErro("");
        setRoteiro("");

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
                    orcamento: orcamento
                        ? Number(orcamento)
                        : null,
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
        } catch (error) {
            console.error("Erro ao gerar roteiro:", error);

            if (
                error instanceof Error &&
                error.name === "AbortError"
            ) {
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
        !origem.trim() ||
        !destino.trim() ||
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
        "mt-2 flex items-center rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 transition-all duration-200 focus-within:border-[#167D8D] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#167D8D]/10";

    const classeInput =
        "w-full bg-transparent px-3 py-4 text-sm text-[#102A43] outline-none placeholder:text-slate-400";

    return (
        <div className="flex min-h-screen bg-[#F4F7FA]">
            <Sidebar />

            <main className="min-w-0 flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-7xl">

                    {/* CABEÇALHO */}
                    <header className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#102A43] via-[#123B56] to-[#167D8D] px-7 py-9 text-white shadow-xl md:px-10 md:py-11">
                        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
                        <div className="pointer-events-none absolute -right-4 -top-12 h-52 w-52 rounded-full border border-white/10" />
                        <div className="pointer-events-none absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-[#38BFC1]/10 blur-2xl" />

                        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                            <div className="max-w-2xl">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                                    <Sparkles size={15} className="text-[#65E0D9]" />
                                    <span className="text-xs font-semibold tracking-[0.15em] text-white/90">
                                        PLANEJAMENTO INTELIGENTE
                                    </span>
                                </div>

                                <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                                    Sua próxima viagem começa aqui
                                    <span className="text-[#65E0D9]">.</span>
                                </h1>

                                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 md:text-base">
                                    Personalize sua experiência e deixe a inteligência artificial do TripIA transformar seus planos em uma viagem inesquecível.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/80">
                                    <span className="flex items-center gap-2">
                                        <Check size={16} className="text-[#65E0D9]" />
                                        Roteiros personalizados
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Check size={16} className="text-[#65E0D9]" />
                                        Sugestões inteligentes
                                    </span>
                                </div>
                            </div>

                            <div className="hidden shrink-0 md:flex">
                                <div className="flex h-36 w-36 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
                                    <Compass size={76} strokeWidth={1.2} className="text-[#65E0D9]" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* FORMULÁRIO */}
                    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(16,42,67,0.06)] md:p-9">
                        <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7]">
                                <Compass className="text-[#167D8D]" size={23} />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-[#102A43]">
                                    Informações da viagem
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Conte ao TripIA como será sua próxima aventura.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">
                                    Cidade de origem
                                </label>
                                <div className={classeCampo}>
                                    <MapPin size={18} className="text-slate-400" />
                                    <input
                                        value={origem}
                                        onChange={(e) => setOrigem(e.target.value)}
                                        placeholder="De onde você vai sair?"
                                        className={classeInput}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">
                                    Destino
                                </label>
                                <div className={classeCampo}>
                                    <Navigation size={18} className="text-[#167D8D]" />
                                    <input
                                        value={destino}
                                        onChange={(e) => setDestino(e.target.value)}
                                        placeholder="Para onde deseja ir?"
                                        className={classeInput}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">
                                    Data de ida
                                </label>
                                <div className={classeCampo}>
                                    <CalendarDays size={18} className="text-slate-400" />
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
                                <label className="text-sm font-semibold text-slate-700">
                                    Data de volta
                                </label>
                                <div className={classeCampo}>
                                    <CalendarDays size={18} className="text-slate-400" />
                                    <input
                                        type="date"
                                        value={volta}
                                        min={ida || dataHoje || undefined}
                                        onChange={(e) => setVolta(e.target.value)}
                                        className={classeInput}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-7">
                            <label className="text-sm font-semibold text-slate-700">
                                Quantidade de viajantes
                            </label>
                            <div className={classeCampo}>
                                <Users size={20} className="text-slate-400" />
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

                        {/* TRANSPORTE */}
                        <div className="mt-9">
                            <h3 className="text-sm font-semibold text-slate-700">
                                Como você pretende viajar?
                            </h3>

                            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {transportes.map((item) => {
                                    const Icon = item.icon;
                                    const ativo = transporte === item.nome;

                                    return (
                                        <button
                                            type="button"
                                            key={item.nome}
                                            onClick={() => setTransporte(item.nome)}
                                            className={`group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 ${
                                                ativo
                                                    ? "border-[#167D8D] bg-[#E6F7F7] text-[#102A43] shadow-md ring-2 ring-[#167D8D]/10"
                                                    : "border-slate-200 bg-white text-slate-500 hover:border-[#38BFC1] hover:bg-[#F8FCFC]"
                                            }`}
                                        >
                                            <Icon size={27} />
                                            <span className="text-sm font-semibold">
                                                {item.nome}
                                            </span>
                                            {ativo && (
                                                <Check size={16} className="text-[#167D8D]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* PREFERÊNCIAS */}
                        <div className="mt-9">
                            <h3 className="text-lg font-bold text-[#102A43]">
                                Qual é o estilo da sua viagem?
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Escolha as experiências que mais combinam com você.
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {tiposViagem.map((tipo) => {
                                    const selecionado = preferencias.includes(tipo);

                                    return (
                                        <button
                                            type="button"
                                            key={tipo}
                                            onClick={() => alternarPreferencia(tipo)}
                                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-4 text-sm transition-all ${
                                                selecionado
                                                    ? "border-[#167D8D] bg-[#E6F7F7] font-semibold text-[#102A43] shadow-sm"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-[#38BFC1] hover:bg-[#F8FCFC]"
                                            }`}
                                        >
                                            {selecionado && (
                                                <Check size={15} className="text-[#167D8D]" />
                                            )}
                                            {tipo}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ORÇAMENTO */}
                        <div className="mt-9">
                            <label className="text-sm font-semibold text-slate-700">
                                Orçamento estimado
                            </label>
                            <div className={classeCampo}>
                                <Wallet size={19} className="text-slate-400" />
                                <span className="ml-2 font-semibold text-slate-500">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={orcamento}
                                    onChange={(e) => setOrcamento(e.target.value)}
                                    placeholder="Ex.: 3000"
                                    className={classeInput}
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                Informe quanto pretende gastar no total.
                            </p>
                        </div>

                        {/* OBSERVAÇÕES */}
                        <div className="mt-8">
                            <label className="text-sm font-semibold text-slate-700">
                                Conte um pouco mais sobre sua viagem
                            </label>
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Ex.: Quero conhecer lugares históricos, experimentar comidas típicas e evitar passeios muito caros..."
                                rows={4}
                                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm leading-7 text-[#102A43] outline-none transition-all placeholder:text-slate-400 focus:border-[#167D8D] focus:bg-white focus:ring-4 focus:ring-[#167D8D]/10"
                            />
                        </div>

                        {/* BOTÃO */}
                        <button
                            type="button"
                            disabled={formularioInvalido || carregando}
                            onClick={gerarRoteiro}
                            className="mt-9 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#102A43] to-[#167D8D] p-4 font-bold text-white shadow-lg shadow-[#167D8D]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {carregando ? (
                                <>
                                    <LoaderCircle size={21} className="animate-spin" />
                                    Preparando sua viagem...
                                </>
                            ) : (
                                <>
                                    <WandSparkles size={21} />
                                    Criar meu roteiro com IA
                                    <ArrowRight size={19} />
                                </>
                            )}
                        </button>
                    </section>

                    {/* BANNER DA VIAGEM */}
                    {destino && (
                        <section
                            className="relative mt-8 max-w-6xl overflow-hidden rounded-3xl shadow-xl"
                            style={{
                                backgroundImage: `
                                    linear-gradient(90deg, rgba(16,42,67,0.96), rgba(16,42,67,0.48)),
                                    url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600')
                                `,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <div className="flex min-h-[240px] flex-col justify-center p-8 md:p-10">
                                <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#38BFC1] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#102A43]">
                                    <Sparkles size={15} />
                                    Sua próxima aventura
                                </span>

                                <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
                                    {origem} <ArrowRight className="inline" /> {destino}
                                </h2>

                                <div className="flex flex-wrap gap-5 text-sm text-white/90">
                                    <span className="flex items-center gap-2">
                                        <CalendarDays size={17} />
                                        {ida && new Date(`${ida}T00:00:00`).toLocaleDateString("pt-BR")}
                                        {" até "}
                                        {volta && new Date(`${volta}T00:00:00`).toLocaleDateString("pt-BR")}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Users size={17} />
                                        {viajantes} {Number(viajantes) === 1 ? "viajante" : "viajantes"}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Compass size={17} />
                                        {transporte}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* RESUMO DA VIAGEM */}
                    {destino && (
                        <section className="mt-6 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">
                            {[
                                {
                                    titulo: "Duração",
                                    valor: `${duracao} dias`,
                                    icone: CalendarDays,
                                },
                                {
                                    titulo: "Viajantes",
                                    valor: `${viajantes} ${Number(viajantes) === 1 ? "pessoa" : "pessoas"}`,
                                    icone: Users,
                                },
                                {
                                    titulo: "Transporte",
                                    valor: transporte,
                                    icone: Compass,
                                },
                            ].map((item) => {
                                const Icon = item.icone;

                                return (
                                    <article
                                        key={item.titulo}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                            <Icon size={22} />
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {item.titulo}
                                        </p>
                                        <h3 className="mt-1 text-2xl font-extrabold text-[#102A43]">
                                            {item.valor}
                                        </h3>
                                    </article>
                                );
                            })}
                        </section>
                    )}

                    {/* ERRO */}
                    {erro && (
                        <div className="mt-6 max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                            {erro}
                        </div>
                    )}

                    {/* CARREGAMENTO */}
                    {carregando && (
                        <div className="mt-8 flex max-w-6xl flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
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

                    {/* ROTEIRO GERADO */}
                    {roteiro && (
                        <section className="mt-8 max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(16,42,67,0.07)]">
                            <div className="relative overflow-hidden bg-gradient-to-r from-[#102A43] to-[#167D8D] px-6 py-7 text-white md:px-9">
                                <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10" />

                                <div className="relative flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                                        <Sparkles size={27} className="text-[#65E0D9]" />
                                    </div>

                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#65E0D9]">
                                            TripIA • Inteligência artificial
                                        </span>
                                        <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">
                                            Seu roteiro de viagem
                                        </h2>
                                        <p className="mt-1 text-sm text-white/75">
                                            Uma experiência planejada para você.
                                        </p>
                                    </div>
                                </div>

                                <div className="relative mt-6 flex flex-wrap gap-3 text-xs font-medium text-white/90">
                                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                                        <MapPin size={13} className="mr-1 inline" />
                                        {origem} → {destino}
                                    </span>
                                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                                        <CalendarDays size={13} className="mr-1 inline" />
                                        {duracao} dias
                                    </span>
                                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2">
                                        <Users size={13} className="mr-1 inline" />
                                        {viajantes} viajantes
                                    </span>
                                </div>
                            </div>

                            <div className="px-6 py-7 md:px-9 md:py-9">
                                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#102A43]">
                                            Sua experiência começa agora
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Confira os detalhes do seu planejamento.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5 text-slate-700">
                                    {roteiroPreparado.antes && (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={markdownComponents}
                                        >
                                            {formatarMarkdown(roteiroPreparado.antes)}
                                        </ReactMarkdown>
                                    )}

                                    {roteiroPreparado.encontrou && (
                                        <section className="my-9">
                                            <div className="mb-5 flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6F7F7] text-2xl">
                                                    🍽️
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-extrabold text-[#102A43]">
                                                        Experiências gastronômicas
                                                    </h2>
                                                    <p className="text-sm text-slate-500">
                                                        Sabores para descobrir durante a viagem.
                                                    </p>
                                                </div>
                                            </div>

                                            {roteiroPreparado.itens.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    {roteiroPreparado.itens.map(
                                                        (item, index) => (
                                                            <CartaoGastronomico
                                                                key={`${item.titulo}-${index}`}
                                                                titulo={item.titulo}
                                                                descricao={item.descricao}
                                                                icone={item.icone}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                                    Não foi possível organizar automaticamente essas sugestões em cartões. Confira as informações na resposta da IA.
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
                            </div>

                            <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-4 text-center md:px-9">
                                <p className="text-xs font-medium text-slate-500">
                                    <Sparkles size={13} className="mr-1 inline text-[#167D8D]" />
                                    Planejado com inteligência artificial pelo TripIA.
                                </p>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
