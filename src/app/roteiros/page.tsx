"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/layout/Sidebar";
import dynamic from "next/dynamic";
import { formatarMoeda } from "@/services/financeiro/localizacao";
import { ITENS_PRECO } from "@/services/financeiro/precos";
import { calcularResumoFinanceiro } from "@/services/financeiro/calculos";
import BuscaLocalidade, {
    type Localidade,
} from "@/components/ui/BuscaLocalidade";

const MapaRoteiro = dynamic<{
    locais: any[];
    transporte: string;
    diaSelecionado?: number;
    onDistanciaCalculada?: (distanciaKm: number | null) => void;
    onDistanciasPorDiaCalculadas?: (
        distancias: { dia: number; distanciaKm: number }[]
    ) => void;
    locaisPorDia?: {
        dia: number;
        locais: any[];
    }[];
}>(
    () => import("@/components/map/MapaRoteiro").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div>A carregar mapa...</div>,
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
    LoaderCircle,
    WandSparkles,
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
                /^(.*?)(?:\s+[—–]\s+|:\s*)(.+)$/
            );

            if (!correspondencia) return null;

            let titulo = correspondencia[1]
                .replace(/\*\*/g, "")
                .trim();

            let descricao = correspondencia[2]
                .replace(/\*\*/g, "")
                .trim();

            const localMatch = titulo.match(/\(([^)]+)\)\s*$/);

            if (localMatch) {
                titulo = titulo
                    .replace(/\s*\([^)]+\)\s*$/, "")
                    .trim();

                descricao += ` Local: ${localMatch[1]}.`;
            }

            if (!titulo || !descricao) return null;

            const nome = titulo.toLowerCase();
            let icone = "🍴";

            if (
                nome.includes("peixe") ||
                nome.includes("fruto do mar") ||
                nome.includes("peixada")
            ) {
                icone = "🐟";
            } else if (
                nome.includes("comida") ||
                nome.includes("típica") ||
                nome.includes("culinária") ||
                nome.includes("baião") ||
                nome.includes("carne de sol")
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
        51: { descricao: "Chuvisco fraco", icone: "drizzle" },
        53: { descricao: "Chuvisco moderado", icone: "drizzle" },
        55: { descricao: "Chuvisco forte", icone: "drizzle" },
        56: { descricao: "Chuvisco gelado fraco", icone: "drizzle" },
        57: { descricao: "Chuvisco gelado forte", icone: "drizzle" },
        61: { descricao: "Chuva fraca", icone: "rain" },
        63: { descricao: "Chuva moderada", icone: "rain" },
        65: { descricao: "Chuva forte", icone: "rain" },
        66: { descricao: "Chuva gelada fraca", icone: "rain" },
        67: { descricao: "Chuva gelada forte", icone: "rain" },
        80: { descricao: "Aguaceiros fracos", icone: "rain" },
        81: { descricao: "Aguaceiros moderados", icone: "rain" },
        82: { descricao: "Aguaceiros fortes", icone: "rain" },
        95: { descricao: "Trovoada", icone: "storm" },
        96: { descricao: "Trovoada com granizo fraco", icone: "storm" },
        99: { descricao: "Trovoada com granizo forte", icone: "storm" },
    };

    return condicoes[codigo] || {
        descricao: "Condição variável",
        icone: "cloud" as const,
    };
}

type CartaoEstadoVazio = {
    icone: string;
    titulo: string;
    descricao: string;
};

// Estado vazio padrão (banner + cartões) usado em todas as abas.
function EstadoVazio({
    icone,
    etiqueta,
    titulo,
    descricao,
    tituloCartoes,
    cartoes,
}: {
    icone: React.ReactNode;
    etiqueta: string;
    titulo: string;
    descricao: string;
    tituloCartoes: string;
    cartoes: CartaoEstadoVazio[];
}) {
    return (
        <section className="min-w-0 rounded-3xl border border-line bg-surface p-8 shadow-sm">
            {/* BANNER */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102A43] to-[#167D8D] px-5 py-8 text-center text-white md:px-10 md:py-10">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-white/10" />
                <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                        {icone}
                    </div>
                    <span className="mb-3 rounded-full border border-[#65E0D9]/30 bg-[#65E0D9]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#65E0D9]">
                        {etiqueta}
                    </span>
                    <h2 className="text-2xl font-extrabold md:text-3xl">{titulo}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 md:text-base">
                        {descricao}
                    </p>
                </div>
            </div>

            {/* CARTÕES */}
            <div className="mt-6">
                <h3 className="mb-4 text-center text-lg font-bold text-titulo">
                    {tituloCartoes}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cartoes.map((cartao) => (
                        <div
                            key={cartao.titulo}
                            className="flex items-start gap-3 rounded-2xl border border-line bg-surface-alt p-4"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destaque-suave text-xl">
                                {cartao.icone}
                            </span>
                            <div>
                                <h4 className="font-bold text-titulo">{cartao.titulo}</h4>
                                <p className="mt-1 text-xs leading-5 text-muted">
                                    {cartao.descricao}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-5 text-center text-xs text-muted">
                Planeje. Explore. Viaje. — TripIA
            </p>
        </section>
    );
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
    const [distanciaMapaKm, setDistanciaMapaKm] = useState<number | null>(null);
    const [distanciasPorDia, setDistanciasPorDia] = useState<
        { dia: number; distanciaKm: number }[]
    >([]);

    const atualizarDistanciaMapa = useCallback((distanciaKm: number | null) => {
        setDistanciaMapaKm(distanciaKm);
    }, []);

    const atualizarDistanciasPorDia = useCallback(
        (distancias: { dia: number; distanciaKm: number }[]) => {
            setDistanciasPorDia(distancias);
        },
        []
    );

    const [preferencias, setPreferencias] = useState<string[]>([]);
    const [orcamento, setOrcamento] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [preferenciasCarregadas, setPreferenciasCarregadas] =
        useState(false);
    const [carregandoPreferenciasUsuario, setCarregandoPreferenciasUsuario] =
        useState(true);
    const [carregando, setCarregando] = useState(false);
    const controladorGeracaoRef = useRef<AbortController | null>(null);
    const canceladoPeloUsuarioRef = useRef(false);
    const [erro, setErro] = useState("");
    const [roteiro, setRoteiro] = useState("");
    const [locais, setLocais] = useState<any[]>([]);
    const [dias, setDias] = useState<any[]>([]);
    const [localizacaoFinanceira, setLocalizacaoFinanceira] =
        useState<any>(null);
    const [dadosPrecos, setDadosPrecos] =
        useState<any>(null);
    const [dadosCombustivel, setDadosCombustivel] =
        useState<any>(null);
    const [diaSelecionado, setDiaSelecionado] = useState<number | "todos">("todos");
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
    const [climaDia, setClimaDia] = useState<any>(null);
    const [carregandoClimaDia, setCarregandoClimaDia] = useState(false);
    const [erroClimaDia, setErroClimaDia] = useState("");

    // Conta o dia de ida e o dia de volta (ex.: 22/11 a 28/11 = 7 dias).
    const duracaoViagem =
        ida && volta
            ? Math.max(
                1,
                Math.round(
                    (new Date(`${volta}T12:00:00`).getTime() -
                        new Date(`${ida}T12:00:00`).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1
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
        let ativo = true;

        async function carregarPreferenciasUsuario() {
            try {
                const resposta = await fetch(
                    "/api/configuracoes/preferencias"
                );
                const dados = await resposta.json();
                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar suas preferências."
                    );
                }
                if (!ativo) return;
                const salvas = dados.preferencias;
                setPreferencias(
                    Array.isArray(salvas.interesses)
                        ? salvas.interesses.filter((item: string) =>
                            tiposViagem.includes(item)
                        )
                        : []
                );
                const transporteDisponivel = [
                    "Carro",
                    "Moto",
                    "Ônibus",
                ];
                const transporteSalvo = Array.isArray(salvas.transportes)
                    ? salvas.transportes.find((item: string) =>
                        transporteDisponivel.includes(item)
                    )
                    : null;
                if (transporteSalvo) {
                    setTransporte(transporteSalvo);
                }
                setPreferenciasCarregadas(true);
            } catch (error) {
                console.error("Erro ao carregar preferências:", error);
            } finally {
                if (ativo) {
                    setCarregandoPreferenciasUsuario(false);
                }
            }
        }

        carregarPreferenciasUsuario();

        return () => {
            ativo = false;
        };
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
                    throw new Error("Não foi possível consultar a previsão meteorológica.");
                }
                const dados = await resposta.json();
                setClima(dados);
            } catch (error) {
                setErroClima(
                    error instanceof Error
                        ? error.message
                        : "Ocorreu um erro ao consultar o tempo."
                );
            } finally {
                setCarregandoClima(false);
            }
        }

        buscarClima();
    }, [abaAtiva, destinoSelecionado, ida, volta]);

    useEffect(() => {
        let ativo = true;

        async function buscarClimaDoDia() {
            const dataSelecionada = String(
                dias.find((dia: any) => Number(dia.dia) === Number(diaSelecionado))?.data || ""
            ).slice(0, 10);
            setClimaDia(null);
            setErroClimaDia("");
            if (!dataSelecionada || !destinoSelecionado) {
                setCarregandoClimaDia(false);
                return;
            }
            setCarregandoClimaDia(true);
            try {
                const parametros = new URLSearchParams({
                    latitude: String(destinoSelecionado.latitude),
                    longitude: String(destinoSelecionado.longitude),
                    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
                    timezone: "auto",
                    start_date: dataSelecionada,
                    end_date: dataSelecionada,
                });
                const resposta = await fetch(
                    `https://api.open-meteo.com/v1/forecast?${parametros.toString()}`
                );
                if (!resposta.ok) {
                    throw new Error(
                        "A previsão para esta data ainda não está disponível. A previsão meteorológica costuma abranger até 16 dias."
                    );
                }
                const dados = await resposta.json();
                if (!dados.daily?.time?.length) {
                    throw new Error("Não foi possível encontrar a previsão para este dia.");
                }
                if (ativo) {
                    setClimaDia({
                        data: dados.daily.time[0],
                        codigo: dados.daily.weather_code?.[0],
                        temperaturaMaxima: dados.daily.temperature_2m_max?.[0],
                        temperaturaMinima: dados.daily.temperature_2m_min?.[0],
                        chanceChuva: dados.daily.precipitation_probability_max?.[0],
                        vento: dados.daily.wind_speed_10m_max?.[0],
                    });
                }
            } catch (error) {
                if (ativo) {
                    setErroClimaDia(
                        error instanceof Error
                            ? error.message
                            : "Não foi possível consultar o tempo deste dia."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregandoClimaDia(false);
                }
            }
        }

        buscarClimaDoDia();

        return () => {
            ativo = false;
        };
    }, [dias, diaSelecionado, destinoSelecionado]);

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
        "Passeios económicos",
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
                    dados.erro || "Não foi possível guardar a sua viagem."
                );
            }
            setViagemSalva(true);
            setMensagemSalvamento("A sua viagem foi guardada em As Minhas Viagens!");
        } catch (error) {
            console.error("Erro ao guardar viagem:", error);
            setMensagemSalvamento(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao guardar a sua viagem."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function gerarRoteiro() {
        // Evita iniciar duas gerações simultaneamente.
        if (controladorGeracaoRef.current) return;
        const controlador = new AbortController();
        controladorGeracaoRef.current = controlador;
        canceladoPeloUsuarioRef.current = false;
        let tempoEsgotado = false;
        const tempoLimite = setTimeout(() => {
            tempoEsgotado = true;
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
                throw new Error("A IA não devolveu um roteiro válido.");
            }
            setRoteiro(dados.roteiro);
            setDias(dados.dias || []);
            setDiaSelecionado("todos");
            setAbaAtiva("itinerario");
            setMostrarConfirmacao(true);
            setLocais(dados.locais || []);
            setLocalizacaoFinanceira(dados.localizacaoFinanceira ?? null);
            setDadosPrecos(dados.dadosPrecos ?? null);
            setDadosCombustivel(dados.dadosCombustivel ?? null);
            console.log("DADOS DE COMBUSTÍVEL:", dados.dadosCombustivel);
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                if (canceladoPeloUsuarioRef.current) {
                    setErro("Geração cancelada. Você pode ajustar os dados e tentar novamente.");
                } else if (tempoEsgotado) {
                    setErro("A geração ultrapassou o limite de 60 segundos. Tente novamente.");
                }
            } else {
                console.error("Erro ao gerar roteiro:", error);
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Ocorreu um erro inesperado."
                );
            }
        } finally {
            clearTimeout(tempoLimite);
            if (controladorGeracaoRef.current === controlador) {
                controladorGeracaoRef.current = null;
            }
            setCarregando(false);
        }
    }

    function cancelarGeracao() {
        if (!controladorGeracaoRef.current) return;
        canceladoPeloUsuarioRef.current = true;
        controladorGeracaoRef.current.abort();
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
    const diasOrdenados = [...dias].sort((a, b) => a.dia - b.dia);
    const diasVisiveis =
        diaSelecionado === "todos"
            ? diasOrdenados
            : diasOrdenados.filter((dia) => Number(dia.dia) === Number(diaSelecionado));
    const diaAtual =
        diaSelecionado === "todos"
            ? null
            : diasOrdenados.find((dia) => Number(dia.dia) === Number(diaSelecionado));
    const gastronomiaVisivel = diasVisiveis.flatMap((dia: any) =>
        (Array.isArray(dia.gastronomia) ? dia.gastronomia : []).map((item: any) => ({
            titulo: item.titulo,
            descricao: item.descricao,
            icone: item.icone || "🍽️",
            dia: dia.dia,
            periodo: item.periodo || "",
        }))
    );

    const condicaoClimaDia = climaDia
        ? obterCondicaoClima(Number(climaDia.codigo))
        : null;

    const IconeClimaDia = condicaoClimaDia
        ? ({
            sun: Sun,
            cloud: Cloud,
            drizzle: CloudDrizzle,
            rain: CloudRain,
            storm: CloudLightning,
        }[condicaoClimaDia.icone])
        : CloudSun;

    // Memoizado: mantém a mesma referência entre renders, evitando que o
    // MapaRoteiro recalcule a rota e remonte o mapa sem necessidade.
    const locaisDoDiaMapa = useMemo(() => {
        if (diaSelecionado === "todos") return locais;
        const doDia = locais.filter(
            (local: any) => Number(local.dia) === Number(diaSelecionado)
        );
        if (doDia.length > 0) return doDia;
        const dia = dias.find(
            (d: any) => Number(d.dia) === Number(diaSelecionado)
        );
        if (!dia) return [];
        const normalizar = (valor: unknown) =>
            String(valor || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        const ordemPeriodo = (periodo: string) => {
            const p = periodo.toLowerCase();
            if (p.includes("manh") || p.includes("caf")) return 1;
            if (p.includes("alm")) return 2;
            if (p.includes("tarde")) return 3;
            if (p.includes("noite") || p.includes("jant")) return 4;
            return 5;
        };
        const pontos = [
            ...(Array.isArray(dia.atividades) ? dia.atividades : []),
            ...(Array.isArray(dia.gastronomia) ? dia.gastronomia : []),
        ]
            .map((item: any, indice: number) => {
                const periodo = String(item.periodo || "").trim();
                return {
                    nome: String(item.local || item.titulo || "").trim(),
                    periodo,
                    ordem: ordemPeriodo(periodo),
                    indice,
                };
            })
            .filter((p) => p.nome)
            .sort((a, b) => a.ordem - b.ordem || a.indice - b.indice)
            .filter(
                (p, i, lista) =>
                    lista.findIndex(
                        (o) => o.nome.toLowerCase() === p.nome.toLowerCase()
                    ) === i
            );
        return pontos
            .map((ponto) => {
                const nomePonto = normalizar(ponto.nome);
                const correspondente = locais.find((local: any) => {
                    const nomeLocal = normalizar(local.nome);
                    return (
                        nomeLocal &&
                        (nomeLocal === nomePonto ||
                            nomeLocal.includes(nomePonto) ||
                            nomePonto.includes(nomeLocal))
                    );
                });
                return correspondente
                    ? {
                        ...correspondente,
                        dia: diaSelecionado,
                        periodo: ponto.periodo || correspondente.periodo,
                    }
                    : null;
            })
            .filter((local: any) => local !== null);
    }, [locais, dias, diaSelecionado]);

    const locaisPorDia = useMemo(() => {
        const normalizar = (valor: unknown) =>
            String(valor || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();
        const ordemPeriodo = (periodo: string) => {
            const p = periodo.toLowerCase();
            if (p.includes("manh") || p.includes("caf")) return 1;
            if (p.includes("alm")) return 2;
            if (p.includes("tarde")) return 3;
            if (p.includes("noite") || p.includes("jant")) return 4;
            return 5;
        };
        const diasOrdenadosParaMapa = [...dias].sort(
            (a: any, b: any) => Number(a.dia) - Number(b.dia)
        );
        return diasOrdenadosParaMapa.map((dia: any) => {
            const numeroDia = Number(dia.dia);
            // Prioriza os locais que já possuem o número do dia.
            const locaisAssociados = locais.filter(
                (local: any) => Number(local.dia) === numeroDia
            );
            if (locaisAssociados.length > 0) {
                return {
                    dia: numeroDia,
                    locais: locaisAssociados,
                };
            }
            // Se os locais não tiverem o campo "dia", recupera-os
            // pelas atividades e sugestões gastronômicas do itinerário.
            const pontos = [
                ...(Array.isArray(dia.atividades) ? dia.atividades : []),
                ...(Array.isArray(dia.gastronomia) ? dia.gastronomia : []),
            ]
                .map((item: any, indice: number) => {
                    const periodo = String(item.periodo || "").trim();
                    return {
                        nome: String(item.local || item.titulo || "").trim(),
                        periodo,
                        ordem: ordemPeriodo(periodo),
                        indice,
                    };
                })
                .filter((p: any) => p.nome)
                .sort(
                    (a: any, b: any) =>
                        a.ordem - b.ordem || a.indice - b.indice
                )
                .filter(
                    (p: any, indice: number, lista: any[]) =>
                        lista.findIndex(
                            (outro: any) =>
                                outro.nome.toLowerCase() === p.nome.toLowerCase()
                        ) === indice
                );
            const locaisDoDia = pontos
                .map((ponto: any) => {
                    const nomePonto = normalizar(ponto.nome);
                    const correspondente = locais.find((local: any) => {
                        const nomeLocal = normalizar(local.nome);
                        return (
                            nomeLocal &&
                            (nomeLocal === nomePonto ||
                                nomeLocal.includes(nomePonto) ||
                                nomePonto.includes(nomeLocal))
                        );
                    });
                    return correspondente
                        ? {
                            ...correspondente,
                            dia: numeroDia,
                            periodo: ponto.periodo || correspondente.periodo,
                        }
                        : null;
                })
                .filter((local: any) => local !== null);
            return {
                dia: numeroDia,
                locais: locaisDoDia,
            };
        });
    }, [dias, locais]);

    const markdownComponents = {
        h1: ({ children }: { children?: React.ReactNode }) => (
            <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-titulo md:text-3xl">
                {children}
            </h1>
        ),
        h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 className="my-8 flex items-center gap-3 rounded-2xl border border-line bg-gradient-to-r from-surface to-surface-alt px-5 py-4 text-lg font-bold text-titulo shadow-sm md:text-xl">
                <span className="h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#38BFC1] to-[#167D8D]" />
                {children}
            </h2>
        ),
        h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 className="mb-3 mt-7 flex items-center gap-2 text-base font-bold text-destaque md:text-lg">
                <span className="h-2 w-2 rounded-full bg-[#38BFC1]" />
                {children}
            </h3>
        ),
        p: ({ children }: { children?: React.ReactNode }) => (
            <p className="mb-4 max-w-4xl text-[15px] leading-8 text-muted">
                {children}
            </p>
        ),
        ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="my-5 space-y-3">{children}</ul>
        ),
        ol: ({ children }: { children?: React.ReactNode }) => (
            <ol className="my-5 list-decimal space-y-3 pl-6 marker:font-bold marker:text-destaque">
                {children}
            </ol>
        ),
        li: ({ children }: { children?: React.ReactNode }) => (
            <li className="rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm leading-7 text-muted shadow-sm">
                {children}
            </li>
        ),
        strong: ({ children }: { children?: React.ReactNode }) => (
            <strong className="font-bold text-titulo">
                {children}
            </strong>
        ),
        em: ({ children }: { children?: React.ReactNode }) => (
            <em className="font-semibold text-destaque not-italic">
                {children}
            </em>
        ),
        hr: () => <hr className="my-8 border-line" />,
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote className="my-6 rounded-2xl border border-destaque/30 bg-gradient-to-r from-destaque-suave to-surface-alt px-6 py-5 text-titulo shadow-sm">
                {children}
            </blockquote>
        ),
        table: ({ children }: { children?: React.ReactNode }) => (
            <div className="my-6 overflow-x-auto rounded-2xl border border-line shadow-sm">
                <table className="w-full border-collapse text-sm">
                    {children}
                </table>
            </div>
        ),
        th: ({ children }: { children?: React.ReactNode }) => (
            <th className="bg-destaque p-4 text-left font-semibold text-white">
                {children}
            </th>
        ),
        td: ({ children }: { children?: React.ReactNode }) => (
            <td className="border-t border-line p-4 text-muted">
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

    const duracao = duracaoViagem;

    // ------------------------------------------------------
    // CUSTOS (estimativas por país vindas do backend)
    // ------------------------------------------------------
    const moedaFinanceira = localizacaoFinanceira?.moeda ?? null;

    const estimativasVerificadas = (
        Array.isArray(dadosPrecos?.estimativas) ? dadosPrecos.estimativas : []
    ).filter(
        (e: any) =>
            e.fonte?.nome &&
            e.fonte?.consultadoEm &&
            e.moeda === moedaFinanceira &&
            e.confianca !== "indisponivel" &&
            typeof e.valorMedio === "number"
    );

    const precoDe = (item: string): number | null =>
        estimativasVerificadas.find((e: any) => e.item === item)?.valorMedio ?? null;

    const precoUber = precoDe(ITENS_PRECO.uber);
    const precoOnibus = precoDe(ITENS_PRECO.onibus);
    const precoCafe = precoDe(ITENS_PRECO.cafe);
    const precoAlmoco = precoDe(ITENS_PRECO.almoco);
    const precoJantar = precoDe(ITENS_PRECO.jantar);

    const temPrecos = [
        precoUber,
        precoOnibus,
        precoCafe,
        precoAlmoco,
        precoJantar,
    ].every((v) => v !== null);

    const temPrecosAlimentacao =
        precoCafe !== null &&
        precoAlmoco !== null &&
        precoJantar !== null;

    const pessoasCustos = Math.max(1, Number(viajantes) || 1);
    const diasCustos = Math.max(1, duracaoViagem || dias.length || 1);

    const distanciaTotalViagemKm = distanciasPorDia.reduce(
        (total, item) => {
            const distancia = Number(item.distanciaKm);
            return total + (
                Number.isFinite(distancia) && distancia > 0
                    ? distancia
                    : 0
            );
        },
        0
    );

    const distanciaDiaSelecionadoKm =
        diaSelecionado === "todos"
            ? distanciaTotalViagemKm
            : distanciasPorDia.find(
                (item) => item.dia === Number(diaSelecionado)
            )?.distanciaKm ?? 0;

    // Consumo médio estimado por modalidade
    const CONSUMO_MEDIO = {
        Carro: 10,
        Moto: 30,
    };

    // ------------------------------------------------------
    // COMBUSTÍVEL — estimativa baseada nas rotas do mapa
    // ------------------------------------------------------
    const precoCombustivel =
        dadosCombustivel?.disponivel === true &&
            typeof dadosCombustivel.precoPorLitro === "number" &&
            dadosCombustivel.precoPorLitro > 0
            ? dadosCombustivel.precoPorLitro
            : null;

    const consumoMedioVeiculo =
        transporte === "Carro"
            ? CONSUMO_MEDIO.Carro
            : transporte === "Moto"
                ? CONSUMO_MEDIO.Moto
                : null;

    const usaCombustivel =
        (transporte === "Carro" || transporte === "Moto") &&
        precoCombustivel !== null &&
        consumoMedioVeiculo !== null;

    const custoCombustivelTotal =
        usaCombustivel
            ? (distanciaTotalViagemKm / consumoMedioVeiculo) *
            precoCombustivel
            : null;

    const custoCombustivelDiaSelecionado =
        usaCombustivel
            ? (distanciaDiaSelecionadoKm / consumoMedioVeiculo!) *
            precoCombustivel
            : null;

    const litrosCombustivelTotal =
        usaCombustivel
            ? distanciaTotalViagemKm / consumoMedioVeiculo!
            : null;

    console.log("DISTÂNCIAS DO ROTEIRO:", distanciasPorDia);
    console.log("DISTÂNCIA TOTAL:", distanciaTotalViagemKm);
    console.log("DISTÂNCIA SELECIONADA:", distanciaDiaSelecionadoKm);

    const custosDiarios = {
        uber: (precoUber ?? 0) * 2,
        onibus: (precoOnibus ?? 0) * 2 * pessoasCustos,
        cafe: (precoCafe ?? 0) * pessoasCustos,
        almoco: (precoAlmoco ?? 0) * pessoasCustos,
        jantar: (precoJantar ?? 0) * pessoasCustos,
    };

    const transporteDiarioSelecionado =
        transporte === "Carro" || transporte === "Moto"
            ? custoCombustivelTotal !== null
                ? custoCombustivelTotal / diasCustos
                : null
            : transporte === "Ônibus"
                ? precoOnibus !== null
                    ? custosDiarios.onibus
                    : null
                : null;

    const alimentacaoPorPessoaDia =
        (precoCafe ?? 0) + (precoAlmoco ?? 0) + (precoJantar ?? 0);

    const resumo =
        temPrecosAlimentacao &&
            transporteDiarioSelecionado !== null &&
            moedaFinanceira
            ? calcularResumoFinanceiro({
                transporteDiario: transporteDiarioSelecionado,
                alimentacaoDiariaPorPessoa: alimentacaoPorPessoaDia,
                quantidadeDias: diasCustos,
                quantidadePessoas: pessoasCustos,
                moeda: moedaFinanceira,
            })
            : null;

    const totalDiarioGrupo = resumo?.totalDiario ?? 0;
    const totalViagemEstimado = resumo?.totalViagem ?? 0;
    const custoPorPessoa = resumo?.totalPorPessoa ?? 0;

    // Formata no idioma do utilizador; só a moeda muda.
    const formatarDinheiro = (valor: number | null | undefined) =>
        valor == null || !moedaFinanceira
            ? "Preço indisponível"
            : formatarMoeda(valor, moedaFinanceira, "pt-BR");

    const categoriasCustos = [
        // CARRO OU MOTO: combustível calculado pela distância do mapa
        ...(usaCombustivel && custoCombustivelTotal !== null
            ? [{
                nome: `Combustível (${transporte})`,
                valor: custoCombustivelTotal,
                cor: "#167D8D",
                detalhe: `${distanciaTotalViagemKm.toFixed(1)} km percorridos · ${litrosCombustivelTotal!.toFixed(2)} litros estimados`,
            }]
            : []),
        // ÔNIBUS: passagens para todos os viajantes
        ...(transporte === "Ônibus" && precoOnibus !== null
            ? [{
                nome: "Ônibus urbano",
                valor: custosDiarios.onibus * diasCustos,
                cor: "#3B82F6",
                detalhe: "2 passagens por pessoa/dia",
            }]
            : []),
        // ALIMENTAÇÃO
        {
            nome: "Café da manhã",
            valor: custosDiarios.cafe * diasCustos,
            cor: "#F59E0B",
            detalhe: `Média de ${formatarDinheiro(precoCafe)} por pessoa`,
        },
        {
            nome: "Almoço",
            valor: custosDiarios.almoco * diasCustos,
            cor: "#F97316",
            detalhe: `Média de ${formatarDinheiro(precoAlmoco)} por pessoa`,
        },
        {
            nome: "Jantar",
            valor: custosDiarios.jantar * diasCustos,
            cor: "#8B5CF6",
            detalhe: `Média de ${formatarDinheiro(precoJantar)} por pessoa`,
        },
    ];

    const diasCustosVisiveis = Array.from({ length: diasCustos }, (_, indice) => {
        const diaReal = diasOrdenados.find((item: any) => Number(item.dia) === indice + 1);
        return {
            numero: indice + 1,
            data: diaReal?.data || (ida
                ? (() => {
                    const data = new Date(`${ida}T12:00:00`);
                    data.setDate(data.getDate() + indice);
                    return data.toISOString().slice(0, 10);
                })()
                : ""),
        };
    }).filter((item) =>
        diaSelecionado === "todos" || item.numero === Number(diaSelecionado)
    );

    const classeCampo =
        "mt-0.5 flex items-center rounded-md border border-line bg-surface-alt px-2 transition-all focus-within:border-[#167D8D] focus-within:bg-surface focus-within:ring-2 focus-within:ring-[#167D8D]/10";

    const classeInput =
        "w-full min-w-0 bg-transparent px-1.5 py-1.5 text-xs text-titulo outline-none placeholder:text-muted";

    const classeLabel =
        "text-[10px] font-semibold uppercase tracking-wide text-muted";

    function renderSeletorDias() {
        return (
            <section className="w-full min-w-0 rounded-2xl border border-line bg-surface p-3 shadow-sm">
                <div className="mb-3 flex items-center gap-2 px-1">
                    <CalendarDays size={18} className="shrink-0 text-destaque" />
                    <div>
                        <h3 className="text-sm font-bold text-titulo">Programação da viagem</h3>
                        <p className="text-xs text-muted">Escolha visualizar todos os dias ou um dia específico</p>
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => setDiaSelecionado("todos")}
                        className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-bold transition ${diaSelecionado === "todos"
                            ? "border-[#167D8D] bg-destaque text-white shadow-md"
                            : "border-line bg-surface-alt text-titulo hover:border-destaque"
                            }`}
                    >
                        Ver tudo
                    </button>
                    {diasOrdenados.map((dia) => {
                        const selecionado = diaSelecionado === Number(dia.dia);
                        return (
                            <button
                                key={dia.dia}
                                type="button"
                                onClick={() => setDiaSelecionado(Number(dia.dia))}
                                className={`shrink-0 rounded-xl border px-4 py-3 text-left transition ${selecionado
                                    ? "border-[#167D8D] bg-destaque text-white shadow-md"
                                    : "border-line bg-surface-alt text-titulo hover:border-destaque"
                                    }`}
                            >
                                <span className="block text-sm font-bold">Dia {dia.dia}</span>
                                {dia.data && (
                                    <span className={`mt-1 block text-[11px] ${selecionado ? "text-white/70" : "text-muted"}`}>
                                        {new Date(`${dia.data}T12:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-0 min-h-screen min-w-0 p-3 pt-20 md:p-5 lg:ml-[264px] lg:pt-5">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-5">
                        {/* HERO / CABEÇALHO EM LARGURA TOTAL */}
                        <header className="relative flex flex-col justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#102A43] via-[#123B56] to-[#167D8D] px-4 py-5 text-white shadow-xl sm:px-5">
                            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
                            <div className="pointer-events-none absolute -right-4 -top-12 h-44 w-44 rounded-full border border-white/10" />
                            <div className="relative z-10">
                                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
                                    <Sparkles size={12} className="text-[#65E0D9]" />
                                    <span className="text-[10px] font-semibold tracking-[0.15em] text-white/90">
                                        PLANEAMENTO INTELIGENTE
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                                    A sua próxima viagem começa aqui
                                    <span className="text-[#65E0D9]">.</span>
                                </h1>
                                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">
                                    Personalize a sua experiência e deixe a IA do TripIA transformar os seus planos numa viagem inesquecível.
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

                        {/* NAVEGAÇÃO DE SEPARADORES */}
                        <div className="mt-2 rounded-2xl border border-line bg-surface p-2 shadow-sm">
                            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                <button
                                    type="button"
                                    onClick={() => setAbaAtiva("formulario")}
                                    className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-3 text-xs font-semibold transition sm:px-3 sm:text-sm ${abaAtiva === "formulario"
                                        ? "bg-destaque text-white shadow-md"
                                        : "text-muted hover:bg-surface-alt-alt hover:text-destaque"
                                        }`}
                                >
                                    <ClipboardList size={17} />
                                    Formulário
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAbaAtiva("itinerario")}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${abaAtiva === "itinerario"
                                        ? "bg-destaque text-white shadow-md"
                                        : "text-muted hover:bg-surface-alt-alt hover:text-destaque"
                                        }`}
                                >
                                    <CalendarDays size={17} />
                                    Itinerário
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAbaAtiva("mapa")}
                                    className={`col-span-2 flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2 py-3 text-xs font-semibold transition sm:col-span-1 sm:px-3 sm:text-sm ${abaAtiva === "mapa"
                                        ? "bg-destaque text-white shadow-md"
                                        : "text-muted hover:bg-surface-alt-alt hover:text-destaque"
                                        }`}
                                >
                                    Mapa da Viagem
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAbaAtiva("clima")}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${abaAtiva === "clima"
                                        ? "bg-destaque text-white shadow-md"
                                        : "text-muted hover:bg-surface-alt-alt hover:text-destaque"
                                        }`}
                                >
                                    <CloudSun size={17} />
                                    Tempo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAbaAtiva("custos")}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${abaAtiva === "custos"
                                        ? "bg-destaque text-white shadow-md"
                                        : "text-muted hover:bg-surface-alt-alt hover:text-destaque"
                                        }`}
                                >
                                    <Wallet size={17} />
                                    Custos
                                </button>
                            </nav>
                        </div>

                        {roteiro && abaAtiva !== "formulario" && (
                            <div className="mt-1">
                                {renderSeletorDias()}
                            </div>
                        )}

                        {/* CONTEÚDO DOS SEPARADORES + COLUNA DIREITA */}
                        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                            {/* CONTEÚDO PRINCIPAL */}
                            <div className="flex min-w-0 flex-col gap-4">
                                {/* FORMULÁRIO */}
                                {abaAtiva === "formulario" && (
                                    <section className="rounded-3xl border border-line bg-surface p-3 shadow-[0_12px_40px_rgba(16,42,67,0.06)]">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destaque-suave">
                                                <Compass className="text-destaque" size={15} />
                                            </div>
                                            <h2 className="text-sm font-bold text-titulo">
                                                Informações da viagem
                                            </h2>
                                        </div>

                                        <div className="space-y-1.5">
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
                                                    placeholder="Para onde pretende viajar?"
                                                    selecionada={destinoSelecionado}
                                                    onSelecionar={(local) => {
                                                        setDestinoSelecionado(local);
                                                        setDestino(local?.endereco || "");
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-2">
                                                <div>
                                                    <label className={classeLabel}>Ida</label>
                                                    <div className={classeCampo}>
                                                        <CalendarDays size={14} className="shrink-0 text-muted" />
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
                                                        <CalendarDays size={14} className="shrink-0 text-muted" />
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
                                                        <Users size={14} className="shrink-0 text-muted" />
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
                                                        <Wallet size={14} className="shrink-0 text-muted" />
                                                        <span className="ml-1 text-xs font-semibold text-muted">R$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={orcamento}
                                                            onChange={(e) => setOrcamento(e.target.value)}
                                                            placeholder="1000"
                                                            className={classeInput}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

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
                                                                    ? "border-[#167D8D] bg-destaque-suave text-destaque"
                                                                    : "border-line bg-surface text-muted hover:border-destaque"
                                                                    }`}
                                                            >
                                                                <Icon size={16} />
                                                                {item.nome}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

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
                                                                    ? "border-[#167D8D] bg-destaque-suave font-semibold text-titulo"
                                                                    : "border-line bg-surface text-muted hover:border-destaque"
                                                                    }`}
                                                            >
                                                                {tipo}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <label className={classeLabel}>O que precisa na viagem?</label>
                                                <textarea
                                                    value={observacoes}
                                                    onChange={(e) => setObservacoes(e.target.value)}
                                                    placeholder="Conte tudo o que quiser para a IA: locais que quer visitar, comidas que quer provar, ritmo da viagem, o que evitar..."
                                                    rows={3}
                                                    className="mt-1 h-[76px] min-h-[76px] w-full resize-none overflow-y-auto rounded-md border border-line bg-surface-alt px-3 py-2 text-sm leading-6 text-titulo outline-none transition-all placeholder:text-muted focus:border-destaque focus:bg-surface focus:ring-2 focus:ring-destaque/20"
                                                />
                                            </div>

                                            <div className="flex w-full items-stretch gap-2">
                                                {/* Botão de gerar roteiro */}
                                                <button
                                                    type="button"
                                                    disabled={formularioInvalido || carregando}
                                                    onClick={gerarRoteiro}
                                                    className="flex-[3] flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#102A43] to-[#167D8D] py-2.5 text-sm font-bold text-white shadow-md shadow-[#167D8D]/20 transition-all hover:-translate-y-0.5 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                                >
                                                    {carregando ? (
                                                        <>
                                                            <LoaderCircle size={16} className="animate-spin" />
                                                            A preparar a sua viagem...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <WandSparkles size={16} />
                                                            Criar o meu roteiro com IA
                                                            <ArrowRight size={14} />
                                                        </>
                                                    )}
                                                </button>

                                                {/* Botão cancelar */}
                                                <button
                                                    type="button"
                                                    disabled={!carregando}
                                                    onClick={cancelarGeracao}
                                                    title={!carregando ? "Cancelamento indisponível" : "Cancelar geração"}
                                                    className={`flex-1 min-w-[125px] flex items-center justify-center rounded-lg border border-[#102A43]/15 bg-surface-alt px-3 py-2.5 text-sm font-bold text-titulo transition-all hover:bg-surface-alt-alt ${carregando
                                                        ? "cursor-pointer"
                                                        : "cursor-not-allowed opacity-50"
                                                        }`}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* ESTADO VAZIO DO ITINERÁRIO */}
                                {!roteiro && abaAtiva === "itinerario" && (
                                    <EstadoVazio
                                        icone={
                                            carregando ? (
                                                <LoaderCircle size={32} className="animate-spin text-[#65E0D9]" />
                                            ) : (
                                                <Compass size={32} className="text-[#65E0D9]" />
                                            )
                                        }
                                        etiqueta={carregando ? "Criando sua experiência" : "Seu próximo destino"}
                                        titulo={
                                            carregando
                                                ? "Estamos preparando sua viagem!"
                                                : "Sua próxima aventura começa aqui!"
                                        }
                                        descricao={
                                            carregando
                                                ? "Nossa inteligência artificial está organizando os melhores passeios, trajetos e experiências para você."
                                                : "Seu roteiro personalizado aparecerá aqui. Preencha o formulário e deixe a inteligência artificial planejar sua próxima aventura."
                                        }
                                        tituloCartoes="O que você encontrará no seu itinerário?"
                                        cartoes={[
                                            { icone: "📅", titulo: "Programação por dia", descricao: "Passeios e atividades organizados para cada dia." },
                                            { icone: "🗺️", titulo: "Mapa interativo", descricao: "Locais visitados e trajetos da sua viagem." },
                                            { icone: "🍽️", titulo: "Gastronomia", descricao: "Restaurantes e experiências locais." },
                                            { icone: "💰", titulo: "Estimativa de custos", descricao: "Uma previsão dos gastos da sua viagem." },
                                        ]}
                                    />
                                )}

                                {/* ROTEIRO GERADO */}
                                {roteiro && abaAtiva === "itinerario" && (
                                    <section className="mt-0 space-y-6">
                                        {/* BANNER ÚNICO: título + resumo + guardar/refazer */}
                                        <div className="relative w-full overflow-hidden rounded-2xl bg-destaque p-3 text-white shadow-lg md:p-4">
                                            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
                                            <div className="absolute -right-5 -top-10 h-52 w-52 rounded-full border border-white/10" />
                                            <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-[#65E0D9]/30 bg-[#65E0D9]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#65E0D9]">
                                                        <Sparkles size={15} />
                                                        Roteiro inteligente TripIA
                                                    </span>
                                                    <h2 className="mt-2 text-lg font-extrabold leading-snug sm:text-xl md:text-3xl">
                                                        {origem}
                                                        <ArrowRight className="mx-3 inline text-[#65E0D9]" size={30} />
                                                        {destino}
                                                    </h2>
                                                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                                                        A sua viagem foi planeada com inteligência artificial,
                                                        considerando as suas preferências e informações fornecidas.
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                                                            <CalendarDays size={17} className="text-[#65E0D9]" />
                                                            {duracao} dias
                                                        </span>
                                                        <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs">
                                                            <Users size={17} className="text-[#65E0D9]" />
                                                            {viajantes} viajantes
                                                        </span>
                                                        <span className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                                                            <Compass size={17} className="text-[#65E0D9]" />
                                                            {transporte}
                                                        </span>
                                                    </div>
                                                </div>

                                                {mostrarConfirmacao && (
                                                    <div className="flex w-full shrink-0 flex-row items-center gap-2 lg:absolute lg:bottom-0 lg:right-5 lg:w-auto">
                                                        <button
                                                            type="button"
                                                            onClick={salvarViagem}
                                                            disabled={salvando || viagemSalva}
                                                            className="flex w-40 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#38BFC1] px-2 py-2 text-xs font-bold text-titulo transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {salvando ? (
                                                                <>
                                                                    <LoaderCircle size={17} className="animate-spin" />
                                                                    A guardar...
                                                                </>
                                                            ) : viagemSalva ? (
                                                                <>
                                                                    <Check size={17} />
                                                                    Viagem guardada
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check size={17} />
                                                                    Guardar viagem
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={gerarRoteiro}
                                                            disabled={carregando}
                                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#102A43] to-[#167D8D] py-2.5 text-sm font-bold text-white shadow-md shadow-[#167D8D]/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                                        >
                                                            <WandSparkles size={17} />
                                                            Refazer sugestão
                                                        </button>

                                                        {mensagemSalvamento && (
                                                            <p
                                                                className={`text-sm font-semibold ${viagemSalva ? "text-[#65E0D9]" : "text-red-300"}`}
                                                            >
                                                                {mensagemSalvamento}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
                                                <div className="border-b border-line p-6 md:p-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destaque-suave text-destaque">
                                                            <CalendarDays size={23} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-extrabold text-titulo">
                                                                O seu itinerário
                                                            </h3>
                                                            <p className="text-sm text-muted">
                                                                Programação personalizada da sua viagem
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 md:p-8">
                                                    {(() => {
                                                        const introducao = roteiroPreparado.antes
                                                            .split(/^#{1,3}\s*Dia\s+\d+.*$/im)[0]
                                                            .trim();
                                                        return introducao ? (
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={markdownComponents}
                                                            >
                                                                {formatarMarkdown(introducao)}
                                                            </ReactMarkdown>
                                                        ) : null;
                                                    })()}

                                                    <div className="space-y-5">
                                                        {diasVisiveis.map((dia: any) => (
                                                            <section key={dia.dia} className="overflow-hidden rounded-2xl border border-line">
                                                                <div className="bg-destaque px-5 py-4 text-white">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <h4 className="text-lg font-bold">Dia {dia.dia}</h4>
                                                                        {dia.data && (
                                                                            <span className="text-sm text-white/75">
                                                                                {new Date(`${dia.data}T12:00:00`).toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {dia.resumo && <p className="mt-2 text-sm text-white/80">{dia.resumo}</p>}
                                                                </div>
                                                                <div className="space-y-3 p-5">
                                                                    {(Array.isArray(dia.atividades) ? dia.atividades : []).map((atividade: any, index: number) => (
                                                                        <article key={`atividade-${dia.dia}-${index}`} className="rounded-xl border border-line bg-surface-alt p-4">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <span className="rounded-full bg-destaque-suave px-3 py-1 text-xs font-bold text-destaque">{atividade.periodo || "Atividade"}</span>
                                                                                <h5 className="font-bold text-titulo">{atividade.titulo}</h5>
                                                                            </div>
                                                                            {atividade.descricao && <p className="mt-2 text-sm leading-6 text-muted">{atividade.descricao}</p>}
                                                                            {atividade.local && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-destaque"><MapPin size={13} />{atividade.local}</p>}
                                                                        </article>
                                                                    ))}
                                                                    {(!dia.atividades || dia.atividades.length === 0) && (
                                                                        <p className="text-sm text-muted">Não há atividades detalhadas para este dia.</p>
                                                                    )}
                                                                </div>
                                                            </section>
                                                        ))}
                                                    </div>
                                                    {diasVisiveis.length === 0 && (
                                                        <p className="rounded-xl bg-surface-alt p-5 text-sm text-muted">Não há programação disponível para este dia.</p>
                                                    )}
                                                </div>

                                                <div className="border-t border-line bg-surface-alt px-6 py-5 text-center">
                                                    <p className="text-xs font-medium text-muted">
                                                        <Sparkles size={14} className="mr-1 inline text-destaque" />
                                                        Planeado com inteligência artificial pelo TripIA.
                                                    </p>
                                                </div>
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

                                {/* SEPARADOR TEMPO — ESTADO VAZIO */}
                                {abaAtiva === "clima" && !carregandoClima && !erroClima && !clima && (
                                    <EstadoVazio
                                        icone={<CloudSun size={32} className="text-[#65E0D9]" />}
                                        etiqueta="Previsão meteorológica"
                                        titulo="Como estará o tempo na sua viagem?"
                                        descricao="Descubra as condições climáticas do destino e prepare-se para aproveitar cada momento da sua viagem."
                                        tituloCartoes="O que você encontrará na previsão do tempo?"
                                        cartoes={[
                                            { icone: "☀️", titulo: "Temperatura", descricao: "Temperaturas máximas e mínimas da viagem." },
                                            { icone: "🌧️", titulo: "Precipitação", descricao: "Acompanhe a probabilidade de chuva no destino." },
                                            { icone: "💨", titulo: "Velocidade do vento", descricao: "Verifique as condições e a intensidade dos ventos." },
                                            { icone: "💧", titulo: "Umidade do ar", descricao: "Níveis de umidade durante a viagem." },
                                        ]}
                                    />
                                )}

                                {/* SEPARADOR TEMPO */}
                                {abaAtiva === "clima" && (carregandoClima || !!erroClima || !!clima) && (
                                    <div className="min-w-0">
                                        <section className="min-w-0 rounded-3xl border border-line bg-surface p-8 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destaque-suave text-destaque">
                                                    <CloudSun size={25} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-extrabold text-titulo">
                                                        Tempo da viagem
                                                    </h2>
                                                    <p className="text-sm text-muted">
                                                        Consulte as condições meteorológicas do seu destino.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-6 space-y-6">
                                                {carregandoClima && (
                                                    <div className="rounded-2xl bg-surface-alt p-8 text-center">
                                                        <CloudSun size={38} className="mx-auto animate-pulse text-destaque" />
                                                        <p className="mt-3 font-medium text-titulo">
                                                            A consultar a previsão meteorológica...
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
                                                                                    ? `${new Date(`${ida}T12:00:00`).toLocaleDateString("pt-PT")} a ${new Date(`${volta}T12:00:00`).toLocaleDateString("pt-PT")}`
                                                                                    : "Período da viagem"}
                                                                            </span>
                                                                        </div>

                                                                        <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
                                                                            <div>
                                                                                <p className="flex items-center gap-2 text-sm text-white/80">
                                                                                    <MapPin size={17} />
                                                                                    {destino || "O seu destino"}
                                                                                </p>
                                                                                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                                                                                    Olá, viajante!
                                                                                </h2>
                                                                                <p className="mt-2 text-sm text-white/80">
                                                                                    Consulte as condições meteorológicas do seu destino.
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
                                                                                            Sensação térmica de {Math.round(clima.current.apparent_temperature)}°C
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                                                                                    <Droplets size={23} className="text-[#A5F3FC]" />
                                                                                    <p className="mt-4 text-xs text-white/75">Humidade</p>
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
                                                            <h3 className="mb-4 text-lg font-bold text-titulo">
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
                                                                            className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                                                        >
                                                                            <div className="bg-gradient-to-br from-destaque-suave to-surface-alt p-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div>
                                                                                        <p className="text-xs font-semibold uppercase tracking-wider text-destaque">
                                                                                            {index === 0 ? "Primeiro dia" : `Dia ${index + 1}`}
                                                                                        </p>
                                                                                        <h4 className="mt-1 text-lg font-bold capitalize text-titulo">
                                                                                            {new Date(`${data}T12:00:00`).toLocaleDateString("pt-PT", {
                                                                                                weekday: "long",
                                                                                            })}
                                                                                        </h4>
                                                                                        <p className="mt-1 text-xs text-muted">
                                                                                            {new Date(`${data}T12:00:00`).toLocaleDateString("pt-PT", {
                                                                                                day: "2-digit",
                                                                                                month: "long",
                                                                                            })}
                                                                                        </p>
                                                                                    </div>
                                                                                    <IconeClima
                                                                                        size={38}
                                                                                        strokeWidth={1.5}
                                                                                        className="text-destaque transition-transform group-hover:scale-110"
                                                                                    />
                                                                                </div>

                                                                                <p className="mt-5 text-sm font-semibold text-destaque">
                                                                                    {condicao.descricao}
                                                                                </p>

                                                                                <div className="mt-3 flex items-end gap-3">
                                                                                    <span className="text-4xl font-extrabold text-titulo">
                                                                                        {Math.round(clima.daily.temperature_2m_max[index])}°
                                                                                    </span>
                                                                                    <span className="mb-1 text-lg font-semibold text-muted">
                                                                                        {Math.round(clima.daily.temperature_2m_min[index])}°
                                                                                    </span>
                                                                                    <span className="mb-1 text-xs text-muted">
                                                                                        Máx. / Mín.
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-3 divide-x divide-line p-3">
                                                                                <div className="px-2 text-center">
                                                                                    <Droplets size={19} className="mx-auto text-destaque" />
                                                                                    <p className="mt-2 text-[10px] text-muted">
                                                                                        Chuva
                                                                                    </p>
                                                                                    <p className="mt-1 text-sm font-bold text-titulo">
                                                                                        {clima.daily.precipitation_probability_max[index] ?? "—"}%
                                                                                    </p>
                                                                                </div>
                                                                                <div className="px-2 text-center">
                                                                                    <CloudRain size={19} className="mx-auto text-destaque" />
                                                                                    <p className="mt-2 text-[10px] text-muted">
                                                                                        Humidade
                                                                                    </p>
                                                                                    <p className="mt-1 text-sm font-bold text-titulo">
                                                                                        {clima.daily.relative_humidity_2m_mean[index] ?? "—"}%
                                                                                    </p>
                                                                                </div>
                                                                                <div className="px-2 text-center">
                                                                                    <Wind size={19} className="mx-auto text-destaque" />
                                                                                    <p className="mt-2 text-[10px] text-muted">
                                                                                        Vento
                                                                                    </p>
                                                                                    <p className="mt-1 text-sm font-bold text-titulo">
                                                                                        {clima.daily.wind_speed_10m_max[index] ?? "—"}
                                                                                    </p>
                                                                                    <p className="text-[9px] text-muted">km/h</p>
                                                                                </div>
                                                                            </div>
                                                                        </article>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="mt-6 rounded-2xl border border-[#38BFC1]/30 bg-surface-alt p-5">
                                                                <div className="mb-3 flex items-center gap-2">
                                                                    <Sparkles className="h-5 w-5 text-destaque" />
                                                                    <h3 className="font-bold text-titulo">
                                                                        Dicas inteligentes do TripIA
                                                                    </h3>
                                                                </div>
                                                                <div className="space-y-2 text-sm text-foreground">
                                                                    {clima.daily.precipitation_probability_max.some(
                                                                        (chance: number) => chance >= 60
                                                                    ) && (
                                                                            <p>
                                                                                <strong>Leve um impermeável ou guarda-chuva:</strong> há possibilidade
                                                                                de chuva durante alguns dias da sua viagem.
                                                                            </p>
                                                                        )}
                                                                    {clima.daily.temperature_2m_max.some(
                                                                        (temperatura: number) => temperatura >= 32
                                                                    ) && (
                                                                            <p>
                                                                                <strong>Reforce a hidratação:</strong> as temperaturas
                                                                                podem ser elevadas. Beba bastante água.
                                                                            </p>
                                                                        )}
                                                                    {clima.daily.temperature_2m_min.some(
                                                                        (temperatura: number) => temperatura <= 15
                                                                    ) && (
                                                                            <p>
                                                                                <strong>Prepare roupa mais quente:</strong> alguns dias
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
                                                                                identificados alertas relevantes para o período.
                                                                                Aproveite a sua viagem!
                                                                            </p>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* PAINEL FINANCEIRO — ESTADO VAZIO */}
                                {abaAtiva === "custos" && !temPrecos && (
                                    <EstadoVazio
                                        icone={<Wallet size={32} className="text-[#65E0D9]" />}
                                        etiqueta="Planejamento financeiro"
                                        titulo="Quanto custará sua próxima aventura?"
                                        descricao={
                                            roteiro
                                                ? "Ainda não há estimativas de preços para este destino."
                                                : "Gere seu roteiro com inteligência artificial para visualizar uma estimativa dos gastos e organizar melhor seu orçamento."
                                        }
                                        tituloCartoes="O que você encontrará nos custos da viagem?"
                                        cartoes={[
                                            { icone: "🚗", titulo: "Transporte", descricao: "Combustível, deslocamentos e passagens." },
                                            { icone: "🍽️", titulo: "Alimentação", descricao: "Estimativas para restaurantes e refeições." },
                                            { icone: "🏨", titulo: "Hospedagem", descricao: "Planejamento de estadia e acomodações." },
                                            { icone: "💰", titulo: "Orçamento total", descricao: "Visualize os gastos estimados da sua viagem." },
                                        ]}
                                    />
                                )}

                                {abaAtiva === "custos" && temPrecos && (
                                    <div className="min-w-0 space-y-5">
                                        <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm md:p-6">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destaque-suave text-destaque">
                                                        <Wallet size={25} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-extrabold text-titulo">Custos da viagem</h2>
                                                        <p className="text-sm text-muted">Estimativa de despesas durante a sua estadia</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="rounded-xl border border-line bg-surface-alt px-3 py-2 font-semibold text-titulo">
                                                        <MapPin size={14} className="mr-1 inline text-destaque" />{destino || "Destino"}
                                                    </span>
                                                    <span className="rounded-xl border border-line bg-surface-alt px-3 py-2 font-semibold text-titulo">
                                                        <CalendarDays size={14} className="mr-1 inline text-destaque" />{diasCustos} {diasCustos === 1 ? "dia" : "dias"}
                                                    </span>
                                                    <span className="rounded-xl border border-line bg-surface-alt px-3 py-2 font-semibold text-titulo">
                                                        <Users size={14} className="mr-1 inline text-destaque" />{pessoasCustos} {pessoasCustos === 1 ? "pessoa" : "pessoas"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102A43] to-[#167D8D] p-5 text-white">
                                                    <Plane size={64} className="absolute -bottom-3 -right-2 opacity-10" />
                                                    <p className="text-sm text-white/80"><Wallet size={16} className="mr-2 inline" />Custo total estimado</p>
                                                    <p className="mt-2 text-3xl font-extrabold">{formatarDinheiro(totalViagemEstimado)}</p>
                                                    <p className="mt-2 text-xs text-white/75">Grupo completo durante {diasCustos} {diasCustos === 1 ? "dia" : "dias"}</p>
                                                </div>
                                                <div className="rounded-2xl border border-line bg-surface p-5">
                                                    <p className="text-sm text-muted"><Users size={16} className="mr-2 inline text-destaque" />Custo por pessoa</p>
                                                    <p className="mt-2 text-3xl font-extrabold text-titulo">{formatarDinheiro(custoPorPessoa)}</p>
                                                    <p className="mt-2 text-xs text-muted">Divisão estimada da viagem</p>
                                                </div>
                                                <div className="rounded-2xl border border-line bg-surface p-5">
                                                    <p className="text-sm text-muted"><CalendarDays size={16} className="mr-2 inline text-destaque" />Média de gastos por dia</p>
                                                    <p className="mt-2 text-3xl font-extrabold text-titulo">{formatarDinheiro(totalDiarioGrupo)}</p>
                                                    <p className="mt-2 text-xs text-muted">Média diária para o grupo</p>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="grid gap-5 lg:grid-cols-2">
                                            <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destaque-suave text-destaque">
                                                        <Car size={22} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-titulo">
                                                            Transporte na cidade
                                                        </h3>
                                                        <p className="text-xs text-muted">
                                                            Estimativa conforme o transporte selecionado
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="divide-y divide-line">
                                                    {/* UBER — FIXO */}
                                                    <div className="flex items-center justify-between gap-3 py-4">
                                                        <div>
                                                            <p className="font-semibold text-titulo">
                                                                Uber / Aplicativo
                                                            </p>
                                                            <p className="text-xs text-muted">
                                                                {formatarDinheiro(precoUber)} por corrida · 2 por dia
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-destaque">
                                                                {formatarDinheiro(custosDiarios.uber)}
                                                            </p>
                                                            <p className="text-xs text-muted">Por dia, grupo</p>
                                                            <p className="text-xs text-muted">
                                                                Total: {formatarDinheiro(custosDiarios.uber * diasCustos)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* ÔNIBUS — FIXO */}
                                                    <div className="flex items-center justify-between gap-3 py-4">
                                                        <div>
                                                            <p className="font-semibold text-titulo">
                                                                Ônibus urbano
                                                            </p>
                                                            <p className="text-xs text-muted">
                                                                {formatarDinheiro(precoOnibus)} por bilhete · 2 por pessoa/dia
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-destaque">
                                                                {formatarDinheiro(custosDiarios.onibus)}
                                                            </p>
                                                            <p className="text-xs text-muted">Por dia, grupo</p>
                                                            <p className="text-xs text-muted">
                                                                Total: {formatarDinheiro(custosDiarios.onibus * diasCustos)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* TRANSPORTE SELECIONADO — DINÂMICO */}
                                                    {(transporte === "Carro" || transporte === "Moto") && (
                                                        <div className="py-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="font-semibold text-titulo">
                                                                        Combustível ({transporte})
                                                                    </p>
                                                                    <p className="text-xs text-muted">
                                                                        {distanciaTotalViagemKm.toFixed(1).replace(".", ",")} km no roteiro · {consumoMedioVeiculo} km/L
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-destaque">
                                                                        {formatarDinheiro(custoCombustivelTotal)}
                                                                    </p>
                                                                    <p className="text-xs text-muted">
                                                                        Total da viagem
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 rounded-xl bg-surface-alt p-3 text-xs text-muted">
                                                                {precoCombustivel !== null ? (
                                                                    <>
                                                                        Preço estimado por litro:{" "}
                                                                        <strong className="text-titulo">
                                                                            {formatarDinheiro(precoCombustivel)}
                                                                        </strong>
                                                                        <br />
                                                                        Consumo previsto:{" "}
                                                                        <strong className="text-titulo">
                                                                            {litrosCombustivelTotal?.toFixed(2).replace(".", ",")} litros
                                                                        </strong>
                                                                        <br />
                                                                        Custo médio diário:{" "}
                                                                        <strong className="text-titulo">
                                                                            {formatarDinheiro(
                                                                                diasCustos > 0 && custoCombustivelTotal !== null
                                                                                    ? custoCombustivelTotal / diasCustos
                                                                                    : null
                                                                            )}
                                                                        </strong>
                                                                    </>
                                                                ) : (
                                                                    "Preço do combustível indisponível para este destino."
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {transporte === "Avião" && (
                                                        <div className="py-4">
                                                            <p className="font-semibold text-titulo">
                                                                Transporte aéreo
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted">
                                                                Passagens aéreas não estão incluídas nesta estimativa.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destaque-suave text-destaque"><span className="text-xl">🍽️</span></div>
                                                    <div>
                                                        <h3 className="font-bold text-titulo">Alimentação</h3>
                                                        <p className="text-xs text-muted">Estimativa por pessoa e refeição</p>
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-line">
                                                    {[
                                                        { nome: "Pequeno-almoço", descricao: "Padaria ou cafetaria", valor: precoCafe ?? 0, icone: "☕", cor: "bg-amber-50" },
                                                        { nome: "Almoço", descricao: "Restaurante ou self-service", valor: precoAlmoco ?? 0, icone: "🍛", cor: "bg-destaque-suave" },
                                                        { nome: "Jantar", descricao: "Restaurante ou gastronomia local", valor: precoJantar ?? 0, icone: "🍽️", cor: "bg-destaque-suave" },
                                                    ].map((refeicao) => (
                                                        <div key={refeicao.nome} className="flex items-center justify-between gap-3 py-3">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${refeicao.cor} text-lg`}>{refeicao.icone}</span>
                                                                <div>
                                                                    <p className="font-semibold text-titulo">{refeicao.nome}</p>
                                                                    <p className="text-xs text-muted">{refeicao.descricao}</p>
                                                                </div>
                                                            </div>
                                                            <span className="shrink-0 rounded-lg bg-destaque-suave px-3 py-2 text-sm font-bold text-destaque">{formatarDinheiro(refeicao.valor)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="mt-3 rounded-xl bg-surface-alt p-3 text-xs text-muted">
                                                    Alimentação estimada por pessoa: <strong className="text-titulo">{formatarDinheiro(alimentacaoPorPessoaDia)} por dia</strong>.
                                                </p>
                                            </section>
                                        </div>

                                        <div className="grid gap-5 lg:grid-cols-2">
                                            <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                                <h3 className="font-bold text-titulo">Distribuição dos gastos</h3>
                                                <p className="mb-5 mt-1 text-xs text-muted">Participação de cada categoria no orçamento estimado</p>
                                                <div className="space-y-4">
                                                    {categoriasCustos.map((categoria) => {
                                                        const percentual = totalViagemEstimado > 0 ? (categoria.valor / totalViagemEstimado) * 100 : 0;
                                                        return (
                                                            <div key={categoria.nome}>
                                                                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                                                    <span className="font-medium text-muted">{categoria.nome}</span>
                                                                    <strong className="text-titulo">{formatarDinheiro(categoria.valor)}</strong>
                                                                </div>
                                                                <div className="h-2.5 overflow-hidden rounded-full bg-surface-alt">
                                                                    <div className="h-full rounded-full" style={{ width: `${percentual}%`, backgroundColor: categoria.cor }} />
                                                                </div>
                                                                <p className="mt-1 text-[11px] text-muted">{percentual.toFixed(1).replace(".", ",")}% do total · {categoria.detalhe}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>

                                            <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <CalendarDays size={20} className="text-destaque" />
                                                    <div>
                                                        <h3 className="font-bold text-titulo">Estimativa diária</h3>
                                                        <p className="text-xs text-muted">Previsão de gastos para o grupo</p>
                                                    </div>
                                                </div>
                                                <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">
                                                    {diasCustosVisiveis.map((dia) => (
                                                        <div key={dia.numero} className="flex items-center justify-between gap-3 rounded-xl bg-surface-alt p-3">
                                                            <div>
                                                                <p className="text-sm font-bold text-titulo">Dia {String(dia.numero).padStart(2, "0")}</p>
                                                                <p className="text-xs text-muted">{dia.data ? new Date(`${String(dia.data).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "long" }) : "Despesas previstas do dia"}</p>
                                                            </div>
                                                            <strong className="text-sm text-destaque">{formatarDinheiro(totalDiarioGrupo)}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                                                    <span className="text-sm font-semibold text-muted">Total do período</span>
                                                    <strong className="text-lg text-titulo">{formatarDinheiro(totalViagemEstimado)}</strong>
                                                </div>
                                            </section>
                                        </div>

                                        <section className="rounded-2xl border border-destaque/30 bg-destaque-suave p-4">
                                            <div className="flex items-start gap-3">
                                                <Sparkles size={20} className="mt-0.5 shrink-0 text-destaque" />
                                                <div>
                                                    <h3 className="font-bold text-titulo">Como calculamos esta estimativa?</h3>
                                                    <p className="mt-1 text-xs leading-6 text-muted">
                                                        Estimativa por modelo: preços-base de referência ajustados pelo nível de preços do país (Banco Mundial). Não são preços oficiais; o valor real varia conforme a cidade, o horário e as suas escolhas. Hospedagem, passagens até ao destino e ingressos não estão incluídos.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* MAPA DO ROTEIRO — ESTADO VAZIO */}
                                {abaAtiva === "mapa" && !roteiro && (
                                    <EstadoVazio
                                        icone={<Compass size={32} className="text-[#65E0D9]" />}
                                        etiqueta="Explore novos destinos"
                                        titulo="Sua próxima aventura começa aqui!"
                                        descricao="Descubra novos lugares, explore pontos turísticos e visualize os trajetos da sua viagem em um mapa interativo."
                                        tituloCartoes="O que você encontrará no mapa?"
                                        cartoes={[
                                            { icone: "📍", titulo: "Destinos", descricao: "Visualize os lugares da sua viagem." },
                                            { icone: "🏛️", titulo: "Pontos turísticos", descricao: "Descubra atrações e locais de interesse." },
                                            { icone: "🗺️", titulo: "Trajetos", descricao: "Acompanhe os percursos entre os locais." },
                                            { icone: "📏", titulo: "Distâncias", descricao: "Consulte as distâncias de cada percurso." },
                                        ]}
                                    />
                                )}

                                {/* MAPA DO ROTEIRO */}
                                {abaAtiva === "mapa" && roteiro && (
                                    <div className="min-w-0">
                                        <MapaRoteiro
                                            key={`mapa-principal-${diaSelecionado}`}
                                            locais={locaisDoDiaMapa}
                                            transporte={transporte}
                                            diaSelecionado={diaSelecionado === "todos" ? undefined : diaSelecionado}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* COLUNA DIREITA */}
                            <aside className="min-w-0 space-y-5">
                                {abaAtiva !== "formulario" && (
                                    diasOrdenados.length > 0 ? (
                                        <MapaRoteiro
                                            key={`mapa-lateral-${diaSelecionado}`}
                                            locais={locaisDoDiaMapa}
                                            transporte={transporte}
                                            diaSelecionado={diaSelecionado === "todos" ? undefined : diaSelecionado}
                                            onDistanciaCalculada={atualizarDistanciaMapa}
                                            onDistanciasPorDiaCalculadas={atualizarDistanciasPorDia}
                                            locaisPorDia={locaisPorDia}
                                        />
                                    ) : (
                                        <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                            <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-surface-alt p-5 text-center text-sm text-muted">
                                                Gere o seu roteiro para visualizar o mapa de cada dia.
                                            </div>
                                        </section>
                                    )
                                )}

                                {abaAtiva !== "formulario" && (
                                    <section className="overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                <CloudSun size={23} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="font-bold text-titulo">
                                                    {diaSelecionado === "todos"
                                                        ? "Tempo da viagem"
                                                        : `Tempo do Dia ${diaSelecionado}`}
                                                </h2>
                                                <p className="mt-0.5 text-xs text-muted">
                                                    {diaAtual?.data
                                                        ? new Date(`${String(diaAtual.data).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-PT")
                                                        : "Data não definida"}
                                                </p>
                                            </div>
                                        </div>

                                        {carregandoClimaDia && (
                                            <div className="mt-4 rounded-2xl bg-surface-alt p-5 text-center">
                                                <CloudSun size={30} className="mx-auto animate-pulse text-destaque" />
                                                <p className="mt-2 text-sm font-medium text-titulo">
                                                    A consultar a previsão...
                                                </p>
                                            </div>
                                        )}

                                        {!carregandoClimaDia && erroClimaDia && (
                                            <div className="mt-4 rounded-2xl bg-surface-alt p-4 text-xs leading-5 text-muted">
                                                {erroClimaDia}
                                            </div>
                                        )}

                                        {!carregandoClimaDia && !erroClimaDia && climaDia && condicaoClimaDia && (
                                            <div className="mt-4">
                                                <div className="flex items-center gap-3 rounded-2xl bg-surface-alt p-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-destaque">
                                                        <IconeClimaDia size={28} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-titulo">
                                                            {condicaoClimaDia.descricao}
                                                        </p>
                                                        <p className="text-xs text-muted">
                                                            {destino || "Destino da viagem"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-2 grid grid-cols-2 gap-2">
                                                    <div className="rounded-xl bg-surface-alt p-3">
                                                        <div className="flex items-center gap-2 text-muted">
                                                            <Thermometer size={16} className="text-destaque" />
                                                            <span className="text-[11px]">Temperatura</span>
                                                        </div>
                                                        <p className="mt-1 text-sm font-extrabold text-titulo">
                                                            {climaDia.temperaturaMinima ?? "—"}° / {climaDia.temperaturaMaxima ?? "—"}°C
                                                        </p>
                                                        <p className="text-[10px] text-muted">Mínima / máxima</p>
                                                    </div>

                                                    <div className="rounded-xl bg-surface-alt p-3">
                                                        <div className="flex items-center gap-2 text-muted">
                                                            <Droplets size={16} className="text-destaque" />
                                                            <span className="text-[11px]">Prob. de chuva</span>
                                                        </div>
                                                        <p className="mt-1 text-sm font-extrabold text-titulo">
                                                            {climaDia.chanceChuva ?? "—"}%
                                                        </p>
                                                        <p className="text-[10px] text-muted">Precipitação</p>
                                                    </div>
                                                </div>

                                                {climaDia.vento != null && (
                                                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface-alt p-3">
                                                        <Wind size={17} className="text-destaque" />
                                                        <p className="text-xs text-muted">
                                                            Vento máximo: <strong className="text-titulo">{Math.round(climaDia.vento)} km/h</strong>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(!diaAtual?.data || !destinoSelecionado) && !carregandoClimaDia && (
                                            <p className="mt-4 rounded-xl bg-surface-alt p-4 text-xs leading-5 text-muted">
                                                {diaSelecionado === "todos"
                                                    ? "Escolha um dia para ver a previsão."
                                                    : !diaAtual?.data
                                                        ? "Indique a data da viagem para consultar a previsão do dia selecionado."
                                                        : "Selecione um destino para consultar a previsão meteorológica."}
                                            </p>
                                        )}
                                    </section>
                                )}

                                {abaAtiva === "formulario" && (
                                    <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                        <div className="mb-5 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                <Compass size={20} />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-titulo">
                                                    Visão geral
                                                </h2>
                                                <p className="text-xs text-muted">
                                                    Resumo do seu planeamento
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-muted">Origem</p>
                                                <p className="font-semibold text-titulo">
                                                    {origem || "Não definida"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Destino</p>
                                                <p className="font-semibold text-titulo">
                                                    {destino || "Não definido"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Período</p>
                                                <p className="font-semibold text-titulo">
                                                    {ida && volta
                                                        ? `${new Date(`${ida}T00:00:00`).toLocaleDateString("pt-PT")} até ${new Date(`${volta}T00:00:00`).toLocaleDateString("pt-PT")}`
                                                        : "Datas não definidas"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Viajantes</p>
                                                <p className="font-semibold text-titulo">
                                                    {viajantes} {Number(viajantes) === 1 ? "pessoa" : "pessoas"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Transporte</p>
                                                <p className="font-semibold text-titulo">
                                                    {transporte}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {(abaAtiva === "itinerario" || abaAtiva === "mapa" || abaAtiva === "clima" || abaAtiva === "custos") && (
                                    <>
                                        <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destaque-suave text-xl">
                                                    🍽️
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-titulo">
                                                        Gastronomia
                                                    </h2>
                                                    <p className="text-xs text-muted">
                                                        Sabores para descobrir
                                                    </p>
                                                </div>
                                            </div>

                                            {gastronomiaVisivel.length > 0 ? (
                                                <div className="space-y-3">
                                                    {gastronomiaVisivel.slice(0, diaSelecionado === "todos" ? 12 : 6).map((item: any, index: number) => (
                                                        <div
                                                            key={`${item.titulo}-${index}`}
                                                            className="rounded-xl bg-surface-alt p-3"
                                                        >
                                                            <p className="text-sm font-bold text-titulo">
                                                                {item.icone} {item.titulo}
                                                            </p>
                                                            <p className="mt-1 text-[10px] font-semibold uppercase text-destaque">
                                                                Dia {item.dia}{item.periodo ? ` · ${item.periodo}` : ""}
                                                            </p>
                                                            <p className="mt-1 text-xs leading-5 text-muted">
                                                                {item.descricao}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl bg-surface-alt p-4 text-center">
                                                    <p className="text-sm font-semibold text-titulo">
                                                        Descubra os sabores do destino!
                                                    </p>
                                                    <p className="mt-2 text-xs leading-5 text-muted">
                                                        Gere o seu roteiro com IA para receber sugestões gastronómicas personalizadas.
                                                    </p>
                                                </div>
                                            )}
                                        </section>

                                        {abaAtiva === "mapa" && (
                                            <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                        <MapPin size={21} />
                                                    </div>
                                                    <div>
                                                        <h2 className="font-bold text-titulo">
                                                            Serviços próximos
                                                        </h2>
                                                        <p className="text-xs text-muted">
                                                            Facilidades no seu destino
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {[
                                                        { nome: "Hospitais e farmácias", icone: "🏥" },
                                                        { nome: "Postos de combustível", icone: "⛽" },
                                                        { nome: "Restaurantes", icone: "🍽️" },
                                                        { nome: "Hotéis e alojamentos", icone: "🏨" },
                                                    ].map((servico) => (
                                                        <div
                                                            key={servico.nome}
                                                            className="flex items-center gap-3 rounded-xl bg-surface-alt p-3"
                                                        >
                                                            <span className="text-xl">{servico.icone}</span>
                                                            <span className="text-sm font-medium text-titulo">
                                                                {servico.nome}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <p className="mt-4 text-xs leading-5 text-muted">
                                                    A localização de estabelecimentos reais será integrada numa próxima etapa.
                                                </p>
                                            </section>
                                        )}
                                    </>
                                )}
                            </aside>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}