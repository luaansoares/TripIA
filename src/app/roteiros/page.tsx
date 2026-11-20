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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E6F7F7] flex items-center justify-center text-2xl shrink-0">
                    {icone}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#102A43] mb-2">
                        {titulo}
                    </h3>

                    <p className="text-slate-600 leading-7">
                        {descricao}
                    </p>

                    <span className="inline-block mt-3 text-xs font-semibold text-[#167D8D] bg-[#E6F7F7] px-3 py-1 rounded-full">
                        Experiência gastronômica
                    </span>
                </div>
            </div>
        </div>
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

            if (!correspondencia) {
                return null;
            }

            const titulo = correspondencia[1]
                .replace(/\*\*/g, "")
                .trim();

            const descricao = correspondencia[2]
                .replace(/\*\*/g, "")
                .trim();

            if (!titulo || !descricao) {
                return null;
            }

            const nome = titulo.toLowerCase();

            let icone = "🍴";

            if (nome.includes("peixe") || nome.includes("fruto do mar")) {
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

            return {
                titulo,
                descricao,
                icone,
            };
        })
        .filter((item): item is ItemGastronomico => item !== null);

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
                throw new Error("A IA não retornou um roteiro válido.");
            }

            setRoteiro(dados.roteiro);
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
            <h1 className="text-3xl font-bold text-[#102A43] mb-5">
                {children}
            </h1>
        ),

        h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 className="text-xl md:text-2xl font-bold text-[#102A43] mt-8 mb-5 px-5 py-4 bg-[#F0F7FA] border-l-4 border-[#38BFC1] rounded-r-xl shadow-sm">
                {children}
            </h2>
        ),

        h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 className="text-lg font-bold text-[#167D8D] mt-6 mb-3">
                {children}
            </h3>
        ),

        p: ({ children }: { children?: React.ReactNode }) => (
            <p className="text-slate-700 leading-7 mb-3">
                {children}
            </p>
        ),

        ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="list-disc pl-6 space-y-2 my-4">
                {children}
            </ul>
        ),

        ol: ({ children }: { children?: React.ReactNode }) => (
            <ol className="list-decimal pl-6 space-y-2 my-4">
                {children}
            </ol>
        ),

        li: ({ children }: { children?: React.ReactNode }) => (
            <li className="pl-1 text-slate-700 leading-7">
                {children}
            </li>
        ),

        strong: ({ children }: { children?: React.ReactNode }) => (
            <strong className="inline-block font-bold text-[#167D8D] bg-[#E6F7F7] px-2 py-1 rounded-md">
                {children}
            </strong>
        ),

        em: ({ children }: { children?: React.ReactNode }) => (
            <em className="text-[#167D8D] font-semibold not-italic bg-[#E6F7F7] px-2 py-1 rounded-md">
                {children}
            </em>
        ),

        hr: () => <hr className="my-6 border-slate-200" />,

        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="border-l-4 border-[#38BFC1] px-6 py-5 my-6 bg-[#102A43] text-white rounded-xl shadow-md">
                <div className="text-white [&_strong]:text-[#38BFC1] [&_strong]:text-xl [&_p]:text-white">
                    {children}
                </div>
            </blockquote>
        ),

        table: ({ children }: { children?: React.ReactNode }) => (
            <div className="overflow-x-auto my-5">
                <table className="w-full border-collapse text-sm">
                    {children}
                </table>
            </div>
        ),

        th: ({ children }: { children?: React.ReactNode }) => (
            <th className="bg-[#102A43] text-white p-3 text-left border border-slate-200">
                {children}
            </th>
        ),

        td: ({ children }: { children?: React.ReactNode }) => (
            <td className="p-3 border border-slate-200">
                {children}
            </td>
        ),
    };

    function formatarMarkdown(texto: string) {
        return texto
            .replace(
                /^[-*]\s*(.*TOTAL ESTIMADO:.*)$/im,
                "> $1"
            )
            .replace(
                /(?<!\*)R\$\s*\d[\d.]*,\d{2}(?!\*)/g,
                (valor) => `**${valor}**`
            );
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex">
            <Sidebar />

            <main className="flex-1 p-6 md:p-8">
                <header className="mb-8">
                    <p className="text-sm text-slate-500">
                        SUA PRÓXIMA AVENTURA
                    </p>

                    <h1 className="text-3xl font-bold text-[#102A43] mt-2">
                        Planeje sua viagem
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Organize sua viagem e deixe a IA ajudar você.
                    </p>
                </header>

                <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-5xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <Compass className="text-blue-600" size={22} />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-[#102A43]">
                                Informações da viagem
                            </h2>

                            <p className="text-sm text-slate-500">
                                Informe os detalhes do seu destino.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-sm font-medium text-slate-600">
                                Cidade de origem
                            </label>

                            <div className="flex items-center border border-slate-200 rounded-xl px-3 mt-2 focus-within:border-blue-500">
                                <MapPin size={18} className="text-slate-400" />

                                <input
                                    value={origem}
                                    onChange={(e) => setOrigem(e.target.value)}
                                    placeholder="De onde você vai sair?"
                                    className="w-full p-3 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-600">
                                Destino
                            </label>

                            <div className="flex items-center border border-slate-200 rounded-xl px-3 mt-2 focus-within:border-blue-500">
                                <MapPin size={18} className="text-blue-600" />

                                <input
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    placeholder="Para onde deseja ir?"
                                    className="w-full p-3 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-600">
                                Data de ida
                            </label>

                            <div className="flex items-center border border-slate-200 rounded-xl px-3 mt-2">
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
                                    className="w-full p-3 outline-none bg-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-600">
                                Data de volta
                            </label>

                            <div className="flex items-center border border-slate-200 rounded-xl px-3 mt-2">
                                <CalendarDays size={18} className="text-slate-400" />

                                <input
                                    type="date"
                                    value={volta}
                                    min={ida || dataHoje || undefined}
                                    onChange={(e) => setVolta(e.target.value)}
                                    className="w-full p-3 outline-none bg-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="text-sm font-medium text-slate-600">
                            Quantidade de viajantes
                        </label>

                        <div className="flex items-center gap-3 mt-2">
                            <Users size={20} className="text-slate-400" />

                            <select
                                value={viajantes}
                                onChange={(e) => setViajantes(e.target.value)}
                                className="border border-slate-200 rounded-xl p-3 w-full outline-none"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                    <option key={n} value={n}>
                                        {n} {n === 1 ? "viajante" : "viajantes"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="text-sm font-medium text-slate-600">
                            Meio de transporte
                        </label>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {transportes.map((item) => {
                                const Icon = item.icon;
                                const ativo = transporte === item.nome;

                                return (
                                    <button
                                        type="button"
                                        key={item.nome}
                                        onClick={() => setTransporte(item.nome)}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${
                                            ativo
                                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                                : "border-slate-200 text-slate-500 hover:border-blue-300"
                                        }`}
                                    >
                                        <Icon size={24} />
                                        {item.nome}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-10">
                        <h3 className="text-lg font-semibold text-[#102A43]">
                            O que você gosta de fazer?
                        </h3>

                        <p className="text-sm text-slate-500 mt-1 mb-4">
                            Selecione os estilos de passeio que combinam com você.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {tiposViagem.map((tipo) => {
                                const selecionado = preferencias.includes(tipo);

                                return (
                                    <button
                                        type="button"
                                        key={tipo}
                                        onClick={() => alternarPreferencia(tipo)}
                                        className={`p-3 rounded-xl border text-sm transition flex items-center justify-center gap-2 ${
                                            selecionado
                                                ? "bg-blue-50 border-blue-600 text-blue-700 font-medium"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                                        }`}
                                    >
                                        {selecionado && <Check size={16} />}
                                        {tipo}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8">
                        <label className="text-sm font-medium text-slate-600">
                            Orçamento estimado da viagem
                        </label>

                        <div className="flex items-center border border-slate-200 rounded-xl px-4 mt-2 focus-within:border-blue-500">
                            <Wallet size={19} className="text-slate-400" />

                            <span className="text-slate-500 font-medium ml-3">
                                R$
                            </span>

                            <input
                                type="number"
                                min="0"
                                value={orcamento}
                                onChange={(e) => setOrcamento(e.target.value)}
                                placeholder="Ex.: 3000"
                                className="w-full p-3 outline-none bg-transparent"
                            />
                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                            Informe quanto pretende gastar no total.
                        </p>
                    </div>

                    <div className="mt-8">
                        <label className="text-sm font-medium text-slate-600">
                            Conte um pouco mais sobre sua viagem
                        </label>

                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Ex.: Quero conhecer lugares históricos, experimentar comidas típicas e evitar passeios muito caros..."
                            rows={4}
                            className="w-full border border-slate-200 rounded-xl p-4 mt-2 outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    <button
                        type="button"
                        disabled={formularioInvalido || carregando}
                        onClick={gerarRoteiro}
                        className="w-full mt-8 bg-[#2563EB] text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Sparkles size={20} />

                        {carregando
                            ? "Gerando seu roteiro..."
                            : "Gerar roteiro com IA"}
                    </button>
                </section>

                {/* BANNER PRINCIPAL DA VIAGEM */}

                {destino && (
                    <section
                        className="max-w-5xl mt-8 rounded-2xl overflow-hidden shadow-lg relative"
                        style={{
                            backgroundImage: `
                                linear-gradient(90deg, rgba(16,42,67,0.96), rgba(16,42,67,0.55)),
                                url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600')
                            `,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div className="p-8 md:p-10 min-h-[210px] flex flex-col justify-center">
                            <div className="mb-4">
                                <span className="bg-[#38BFC1] text-[#102A43] text-sm font-semibold px-4 py-2 rounded-full">
                                    ✨ Roteiro planejado com IA
                                </span>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                {origem} → {destino}
                            </h2>

                            <div className="flex items-center gap-2 text-white">
                                <CalendarDays size={21} />

                                <span className="text-sm md:text-base">
                                    {ida &&
                                        new Date(`${ida}T00:00:00`).toLocaleDateString("pt-BR")}
                                    {" até "}
                                    {volta &&
                                        new Date(`${volta}T00:00:00`).toLocaleDateString("pt-BR")}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-white">
                                <span>
                                    👥 {viajantes}{" "}
                                    {Number(viajantes) === 1 ? "viajante" : "viajantes"}
                                </span>

                                <span>
                                    {transporte === "Carro"
                                        ? "🚗"
                                        : transporte === "Moto"
                                          ? "🏍️"
                                          : transporte === "Ônibus"
                                            ? "🚌"
                                            : "✈️"}{" "}
                                    {transporte}
                                </span>
                            </div>
                        </div>
                    </section>
                )}

                {/* CARTÕES DE RESUMO DA VIAGEM */}

                {destino && (
                    <section className="max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="text-2xl mb-2">📅</div>
                            <p className="text-sm text-gray-500">Duração</p>

                            <h3 className="text-2xl font-bold text-[#102A43]">
                                {ida && volta
                                    ? Math.ceil(
                                          (new Date(`${volta}T00:00:00`).getTime() -
                                              new Date(`${ida}T00:00:00`).getTime()) /
                                              (1000 * 60 * 60 * 24)
                                      ) + 1
                                    : 0}{" "}
                                dias
                            </h3>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="text-2xl mb-2">👥</div>
                            <p className="text-sm text-gray-500">Viajantes</p>

                            <h3 className="text-2xl font-bold text-[#102A43]">
                                {viajantes}{" "}
                                {Number(viajantes) === 1 ? "pessoa" : "pessoas"}
                            </h3>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="text-2xl mb-2">
                                {transporte === "Carro"
                                    ? "🚗"
                                    : transporte === "Moto"
                                      ? "🏍️"
                                      : transporte === "Ônibus"
                                        ? "🚌"
                                        : "✈️"}
                            </div>

                            <p className="text-sm text-gray-500">Transporte</p>

                            <h3 className="text-2xl font-bold text-[#102A43]">
                                {transporte}
                            </h3>
                        </div>
                    </section>
                )}

                {/* MENSAGEM DE ERRO */}

                {erro && (
                    <div className="max-w-5xl mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                        {erro}
                    </div>
                )}

                {/* ROTEIRO GERADO PELA IA */}

                {roteiro && (
                    <section className="max-w-5xl mt-8 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-50 p-3 rounded-xl">
                                <Sparkles className="text-blue-600" size={22} />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-[#102A43]">
                                    Seu roteiro de viagem
                                </h2>

                                <p className="text-sm text-slate-500">
                                    Planejado com inteligência artificial.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5 text-slate-700 leading-7">
                            {roteiroPreparado.antes && (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={markdownComponents}
                                >
                                    {formatarMarkdown(roteiroPreparado.antes)}
                                </ReactMarkdown>
                            )}

                            {roteiroPreparado.encontrou && (
                                <section className="my-8">
                                    <h2 className="text-xl md:text-2xl font-bold text-[#102A43] mb-5 px-5 py-4 bg-[#F0F7FA] border-l-4 border-[#38BFC1] rounded-r-xl shadow-sm">
                                        Sugestões gastronômicas
                                    </h2>

                                    {roteiroPreparado.itens.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <p className="text-slate-600">
                                            Não foi possível organizar automaticamente
                                            essas sugestões em cartões. Confira as
                                            informações na resposta da IA.
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
                    </section>
                )}
            </main>
        </div>
    );
}