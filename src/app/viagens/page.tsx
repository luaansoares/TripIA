"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/layout/Sidebar";
import {
    BriefcaseBusiness,
    CalendarDays,
    MapPin,
    Users,
    Car,
    Plane,
    Bus,
    Bike,
    LoaderCircle,
    Search,
    SlidersHorizontal,
    Wallet,
    Compass,
    Luggage,
    Pencil,
    Check,
    X,
    Eye,
    ChevronRight,
    Trash2,
    RefreshCw,
    Umbrella,
    Landmark,
    Utensils,
    Mountain,
    ShoppingBag,
    Moon,
    Camera,
    Sparkles,
} from "lucide-react";

type StatusViagem = "planejada" | "em_andamento" | "concluida";

type Viagem = {
    id: string;
    titulo: string;
    origem: string;
    destino: string;
    data_ida: string;
    data_volta: string;
    viajantes: number;
    transporte: string;
    orcamento: number | null;
    preferencias?: string[] | null;
    observacoes?: string | null;
    roteiro?: string | null;
    status: StatusViagem;
};

type FiltroStatus = "todas" | StatusViagem;

const filtros: { label: string; value: FiltroStatus }[] = [
    { label: "Todas", value: "todas" },
    { label: "Planejadas", value: "planejada" },
    { label: "Em andamento", value: "em_andamento" },
    { label: "Concluídas", value: "concluida" },
];

// Formato curto para a lista: 22/11/2026
function formatarDataCurta(data: string) {
    if (!data) return "Data não informada";
    const [ano, mes, dia] = data.slice(0, 10).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function calcularDuracao(ida: string, volta: string) {
    if (!ida || !volta) return 0;
    const inicio = new Date(`${ida}T12:00:00`);
    const fim = new Date(`${volta}T12:00:00`);
    return Math.max(
        1,
        Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1
    );
}

function obterIconeTransporte(transporte: string) {
    switch (transporte?.toLowerCase()) {
        case "moto":
            return Bike;
        case "ônibus":
        case "onibus":
            return Bus;
        case "avião":
        case "aviao":
            return Plane;
        default:
            return Car;
    }
}

function obterIconePreferencia(preferencia: string) {
    const texto = preferencia
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    if (texto.includes("praia") || texto.includes("natureza")) return Umbrella;
    if (texto.includes("histor") || texto.includes("cultur")) return Landmark;
    if (texto.includes("gastron")) return Utensils;
    if (texto.includes("aventura")) return Mountain;
    if (texto.includes("compra")) return ShoppingBag;
    if (texto.includes("noturn")) return Moon;
    if (texto.includes("passeio")) return Camera;
    return Sparkles;
}

function obterStatus(status: StatusViagem) {
    switch (status) {
        case "em_andamento":
            return {
                label: "Em andamento",
                classes: "bg-blue-50 text-blue-700 border-blue-100",
                ponto: "bg-blue-500",
            };
        case "concluida":
            return {
                label: "Concluída",
                classes: "bg-emerald-50 text-emerald-700 border-emerald-100",
                ponto: "bg-emerald-500",
            };
        default:
            return {
                label: "Planejada",
                classes: "bg-amber-50 text-amber-700 border-amber-100",
                ponto: "bg-amber-500",
            };
    }
}

// Estilo do roteiro salvo (markdown) exibido no modal.
const markdownRoteiro = {
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="mb-4 mt-2 text-xl font-extrabold text-titulo">
            {children}
        </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="mb-3 mt-6 text-lg font-bold text-titulo">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="mb-2 mt-5 flex items-center gap-2 text-base font-bold text-destaque">
            <span className="h-2 w-2 rounded-full bg-[#38BFC1]" />
            {children}
        </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-3 text-sm leading-7 text-muted">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-4 space-y-2">{children}</ul>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-sm leading-6 text-muted">
            {children}
        </li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-titulo">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
        <em className="text-muted">{children}</em>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="my-4 rounded-2xl border border-line bg-surface-alt px-5 py-4 text-sm text-titulo">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-6 border-line" />,
};

export default function ViagensPage() {
    const [viagens, setViagens] = useState<Viagem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [novoTitulo, setNovoTitulo] = useState("");
    const [salvandoTitulo, setSalvandoTitulo] = useState(false);
    const [erroEdicao, setErroEdicao] = useState("");
    const [editandoDadosId, setEditandoDadosId] = useState<string | null>(null);
    const [salvandoDados, setSalvandoDados] = useState(false);
    const [erroDados, setErroDados] = useState("");
    const [formDados, setFormDados] = useState({
        origem: "",
        destino: "",
        data_ida: "",
        data_volta: "",
        viajantes: "1",
        transporte: "Carro",
        orcamento: "",
        preferencias: "",
        observacoes: "",
    });
    const [roteiroAberto, setRoteiroAberto] = useState<Viagem | null>(null);
    const [viagemParaExcluir, setViagemParaExcluir] = useState<Viagem | null>(null);
    const [excluindo, setExcluindo] = useState(false);
    const [erroExclusao, setErroExclusao] = useState("");
    const [atualizandoStatusId, setAtualizandoStatusId] = useState<string | null>(null);
    const [erroStatus, setErroStatus] = useState("");

    useEffect(() => {
        async function carregarViagens() {
            try {
                const resposta = await fetch("/api/viagens");
                const dados = await resposta.json();
                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar as viagens."
                    );
                }
                setViagens(dados.viagens || []);
            } catch (error) {
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Ocorreu um erro inesperado."
                );
            } finally {
                setCarregando(false);
            }
        }
        carregarViagens();
    }, []);

    // Esc fecha os modais (a exclusão em andamento não pode ser cancelada).
    useEffect(() => {
        function aoPressionarTecla(evento: KeyboardEvent) {
            if (evento.key !== "Escape") return;
            if (viagemParaExcluir) {
                if (!excluindo) {
                    setViagemParaExcluir(null);
                    setErroExclusao("");
                }
                return;
            }
            if (roteiroAberto) setRoteiroAberto(null);
        }
        window.addEventListener("keydown", aoPressionarTecla);
        return () => window.removeEventListener("keydown", aoPressionarTecla);
    }, [roteiroAberto, viagemParaExcluir, excluindo]);

    const viagensFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return viagens.filter((viagem) => {
            const correspondeBusca =
                !termo ||
                viagem.titulo?.toLowerCase().includes(termo) ||
                viagem.origem?.toLowerCase().includes(termo) ||
                viagem.destino?.toLowerCase().includes(termo);
            const correspondeStatus =
                filtroStatus === "todas" || viagem.status === filtroStatus;
            return correspondeBusca && correspondeStatus;
        });
    }, [viagens, busca, filtroStatus]);

    const planejadas = viagens.filter(
        (viagem) => viagem.status === "planejada"
    ).length;

    const emAndamento = viagens.filter(
        (viagem) => viagem.status === "em_andamento"
    ).length;

    const concluidas = viagens.filter(
        (viagem) => viagem.status === "concluida"
    ).length;

    function iniciarEdicao(viagem: Viagem) {
        if (salvandoTitulo) return;
        setEditandoId(viagem.id);
        setNovoTitulo(viagem.titulo || "");
        setErroEdicao("");
    }

    function cancelarEdicao() {
        if (salvandoTitulo) return;
        setEditandoId(null);
        setNovoTitulo("");
        setErroEdicao("");
    }

    function iniciarEdicaoDados(viagem: Viagem) {
        setEditandoDadosId(viagem.id);
        setErroDados("");
        setFormDados({
            origem: viagem.origem || "",
            destino: viagem.destino || "",
            data_ida: viagem.data_ida || "",
            data_volta: viagem.data_volta || "",
            viajantes: String(viagem.viajantes || 1),
            transporte: viagem.transporte || "Carro",
            orcamento: viagem.orcamento == null ? "" : String(viagem.orcamento),
            preferencias: Array.isArray(viagem.preferencias) ? viagem.preferencias.join(", ") : "",
            observacoes: viagem.observacoes || "",
        });
    }

    function cancelarEdicaoDados() {
        if (salvandoDados) return;
        setEditandoDadosId(null);
        setErroDados("");
    }

    async function salvarDadosViagem(id: string) {
        if (!formDados.origem.trim() || !formDados.destino.trim()) {
            setErroDados("Preencha a origem e o destino.");
            return;
        }
        if (!formDados.data_ida || !formDados.data_volta) {
            setErroDados("Informe as datas de ida e volta.");
            return;
        }
        if (formDados.data_volta < formDados.data_ida) {
            setErroDados("A data de volta não pode ser anterior à data de ida.");
            return;
        }
        const viajantes = Number(formDados.viajantes);
        if (!Number.isInteger(viajantes) || viajantes < 1 || viajantes > 8) {
            setErroDados("A quantidade de viajantes deve ser entre 1 e 8.");
            return;
        }
        const orcamento = formDados.orcamento.trim() === "" ? null : Number(formDados.orcamento);
        if (orcamento !== null && (!Number.isFinite(orcamento) || orcamento < 0)) {
            setErroDados("Informe um orçamento válido.");
            return;
        }
        try {
            setSalvandoDados(true);
            setErroDados("");
            const resposta = await fetch("/api/viagens", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    origem: formDados.origem.trim(),
                    destino: formDados.destino.trim(),
                    data_ida: formDados.data_ida,
                    data_volta: formDados.data_volta,
                    viajantes,
                    transporte: formDados.transporte,
                    orcamento,
                    preferencias: formDados.preferencias.split(",").map((item) => item.trim()).filter(Boolean),
                    observacoes: formDados.observacoes.trim() || null,
                }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível atualizar a viagem.");
            if (!dados.viagem) throw new Error("A API não retornou a viagem atualizada.");
            setViagens((atuais) => atuais.map((viagem) => viagem.id === id ? { ...viagem, ...dados.viagem } : viagem));
            setEditandoDadosId(null);
        } catch (error) {
            setErroDados(error instanceof Error ? error.message : "Erro ao atualizar os dados da viagem.");
        } finally {
            setSalvandoDados(false);
        }
    }

    async function salvarTitulo(id: string) {
        const titulo = novoTitulo.trim();
        if (!titulo) {
            setErroEdicao("Informe um nome para a viagem.");
            return;
        }
        if (titulo.length > 100) {
            setErroEdicao("O nome deve ter no máximo 100 caracteres.");
            return;
        }
        try {
            setSalvandoTitulo(true);
            setErroEdicao("");
            const resposta = await fetch("/api/viagens", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id, titulo }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível atualizar o nome."
                );
            }
            if (!dados.viagem?.titulo) {
                throw new Error(
                    "A API não retornou o nome atualizado da viagem."
                );
            }
            setViagens((atuais) =>
                atuais.map((viagem) =>
                    viagem.id === id
                        ? { ...viagem, titulo: dados.viagem.titulo }
                        : viagem
                )
            );
            setEditandoId(null);
            setNovoTitulo("");
            setErroEdicao("");
        } catch (error) {
            setErroEdicao(
                error instanceof Error
                    ? error.message
                    : "Erro ao atualizar o nome da viagem."
            );
        } finally {
            setSalvandoTitulo(false);
        }
    }

    async function atualizarStatus(id: string, status: StatusViagem) {
        try {
            setAtualizandoStatusId(id);
            setErroStatus("");
            const resposta = await fetch("/api/viagens", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível atualizar o status.");
            }
            if (!dados.viagem) {
                throw new Error("A API não retornou a viagem atualizada.");
            }
            setViagens((atuais) =>
                atuais.map((viagem) =>
                    viagem.id === id
                        ? { ...viagem, status: dados.viagem.status }
                        : viagem
                )
            );
        } catch (error) {
            setErroStatus(
                error instanceof Error
                    ? error.message
                    : "Erro ao atualizar o status da viagem."
            );
        } finally {
            setAtualizandoStatusId(null);
        }
    }

    function pedirExclusao(viagem: Viagem) {
        setErroExclusao("");
        setViagemParaExcluir(viagem);
    }

    function cancelarExclusao() {
        if (excluindo) return;
        setViagemParaExcluir(null);
        setErroExclusao("");
    }

    async function confirmarExclusao() {
        if (!viagemParaExcluir || excluindo) return;
        const { id } = viagemParaExcluir;
        try {
            setExcluindo(true);
            setErroExclusao("");
            const resposta = await fetch("/api/viagens", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível excluir a viagem."
                );
            }
            setViagens((atuais) => atuais.filter((viagem) => viagem.id !== id));
            // Limpa qualquer edição aberta para a viagem removida.
            if (editandoId === id) {
                setEditandoId(null);
                setNovoTitulo("");
                setErroEdicao("");
            }
            if (editandoDadosId === id) {
                setEditandoDadosId(null);
                setErroDados("");
            }
            if (roteiroAberto?.id === id) setRoteiroAberto(null);
            setViagemParaExcluir(null);
        } catch (error) {
            setErroExclusao(
                error instanceof Error
                    ? error.message
                    : "Erro ao excluir a viagem."
            );
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-0 min-h-screen p-4 pt-20 md:p-6 lg:ml-[264px]">
                <div className="mx-auto max-w-7xl">
                    {/* BANNER PRINCIPAL E RESUMO */}
                    <section className="relative mb-8 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#102A43] via-[#12465D] to-[#167D8D] p-6 text-white shadow-xl shadow-[#102A43]/10 md:p-8">
                        {/* Elementos decorativos */}
                        <div className="pointer-events-none absolute -right-10 -top-28 h-72 w-72 rounded-full border border-white/10" />
                        <div className="pointer-events-none absolute -right-2 -top-20 h-56 w-56 rounded-full border border-white/10" />
                        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full border border-white/5" />
                        <div className="relative z-10">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface/10 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white backdrop-blur-sm">
                                <Compass size={15} className="text-[#65DCD5]" />
                                SEU ESPAÇO DE VIAGENS
                            </div>
                            <div className="mb-7 max-w-2xl">
                                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                                    Minhas viagens<span className="text-[#65DCD5]">.</span>
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-base">
                                    Todas as suas aventuras organizadas em um só lugar. Acompanhe seus planos e prepare-se para o próximo destino.
                                </p>
                            </div>
                            {!carregando && !erro && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/15 bg-surface/10 p-4 backdrop-blur-sm md:p-5">
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-surface/10 text-[#65DCD5]">
                                            <CalendarDays size={20} />
                                        </div>
                                        <p className="text-xs font-medium text-white/75">Planejadas</p>
                                        <p className="mt-1 text-2xl font-extrabold text-white md:text-3xl">{planejadas}</p>
                                        <p className="mt-1 text-xs text-white/65">Aguardando sua próxima aventura</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-surface/10 p-4 backdrop-blur-sm md:p-5">
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-surface/10 text-[#65DCD5]">
                                            <MapPin size={20} />
                                        </div>
                                        <p className="text-xs font-medium text-white/75">Em andamento</p>
                                        <p className="mt-1 text-2xl font-extrabold text-white md:text-3xl">{emAndamento}</p>
                                        <p className="mt-1 text-xs text-white/65">Aventuras acontecendo agora</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-surface/10 p-4 backdrop-blur-sm md:p-5">
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-surface/10 text-[#65DCD5]">
                                            <BriefcaseBusiness size={20} />
                                        </div>
                                        <p className="text-xs font-medium text-white/75">Concluídas</p>
                                        <p className="mt-1 text-2xl font-extrabold text-white md:text-3xl">{concluidas}</p>
                                        <p className="mt-1 text-xs text-white/65">Experiências que viraram memória</p>
                                    </div>
                                </div>
                            )}
                            {carregando && (
                                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-surface/10 p-5 text-sm text-white/80">
                                    <LoaderCircle size={19} className="animate-spin text-[#65DCD5]" />
                                    Carregando o resumo das suas viagens...
                                </div>
                            )}
                        </div>
                    </section>

                    {/* BUSCA E FILTROS */}
                    <section className="mb-6 rounded-2xl border border-line bg-surface p-4 shadow-sm md:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-md">
                                <Search
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                                />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar por viagem ou destino..."
                                    className="h-12 w-full rounded-xl border border-line bg-surface-alt pl-11 pr-4 text-sm text-titulo outline-none transition placeholder:text-muted focus:border-destaque focus:bg-surface focus:ring-2 focus:ring-destaque/20"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-1 flex items-center gap-2 text-xs font-semibold text-muted">
                                    <SlidersHorizontal size={15} />
                                    Filtrar:
                                </span>
                                {filtros.map((filtro) => (
                                    <button
                                        key={filtro.value}
                                        type="button"
                                        onClick={() => setFiltroStatus(filtro.value)}
                                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                            filtroStatus === filtro.value
                                                ? "bg-[#102A43] text-white shadow-sm"
                                                : "bg-surface-alt text-muted hover:bg-surface-alt"
                                        }`}
                                    >
                                        {filtro.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* LISTAGEM */}
                    <section>
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-titulo">
                                    Suas viagens
                                </h2>
                                <p className="mt-1 text-xs text-muted">
                                    {viagensFiltradas.length}{" "}
                                    {viagensFiltradas.length === 1
                                        ? "viagem encontrada"
                                        : "viagens encontradas"}
                                </p>
                            </div>
                        </div>

                        {carregando && (
                            <div className="flex items-center justify-center rounded-3xl border border-line bg-surface p-16">
                                <LoaderCircle
                                    className="animate-spin text-destaque"
                                    size={28}
                                />
                                <span className="ml-3 text-sm text-muted">
                                    Carregando suas viagens...
                                </span>
                            </div>
                        )}

                        {erro && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                                {erro}
                            </div>
                        )}

                        {!carregando && !erro && viagensFiltradas.length === 0 && (
                            <div className="rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-sm">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destaque-suave text-destaque">
                                    <Luggage size={30} />
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-titulo">
                                    {viagens.length === 0
                                        ? "Sua próxima aventura começa aqui!"
                                        : "Nenhuma viagem encontrada"}
                                </h3>
                                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                                    {viagens.length === 0
                                        ? "Quando você salvar um roteiro, ele aparecerá aqui para você acompanhar e organizar."
                                        : "Experimente alterar sua busca ou selecionar outro filtro."}
                                </p>
                                {(busca || filtroStatus !== "todas") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBusca("");
                                            setFiltroStatus("todas");
                                        }}
                                        className="mt-5 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-destaque"
                                    >
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                        )}

                        {!carregando && !erro && viagensFiltradas.length > 0 && (
                            <div className="space-y-4">
                                {viagensFiltradas.map((viagem) => {
                                    const status = obterStatus(viagem.status);
                                    const IconeTransporte = obterIconeTransporte(
                                        viagem.transporte
                                    );
                                    const estaEditando = editandoId === viagem.id;
                                    const estaEditandoDados = editandoDadosId === viagem.id;
                                    const preferencias = Array.isArray(viagem.preferencias)
                                        ? viagem.preferencias
                                        : [];
                                    const cidadeDestino =
                                        viagem.destino?.split(",")[0]?.trim() ||
                                        viagem.destino;
                                    return (
                                        <article
                                            key={viagem.id}
                                            className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition duration-300 hover:shadow-lg"
                                        >
                                            <div className="flex flex-col gap-5 p-4 md:flex-row md:p-5">
                                                {/* IMAGEM / DESTAQUE */}
                                                <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#102A43] via-[#167D8D] to-[#38BFC1] md:h-auto md:min-h-[190px] md:w-[280px]">
                                                    <div className="absolute -right-8 -top-14 h-56 w-56 rounded-full border-[28px] border-white/10" />
                                                    <div className="absolute -bottom-20 -left-6 h-48 w-48 rounded-full border-[22px] border-white/10" />
                                                    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface/90 px-3 py-1.5 text-[11px] font-bold text-titulo shadow-sm">
                                                        <span
                                                            className={`h-2 w-2 rounded-full ${status.ponto}`}
                                                        />
                                                        {status.label}
                                                    </span>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Compass
                                                            size={46}
                                                            strokeWidth={1.4}
                                                            className="text-white/80"
                                                        />
                                                    </div>
                                                    <p className="absolute inset-x-3 bottom-3 z-10 truncate text-sm font-extrabold text-white drop-shadow">
                                                        {cidadeDestino}
                                                    </p>
                                                </div>

                                                {/* INFORMAÇÕES */}
                                                <div className="min-w-0 flex-1">
                                                    {estaEditando ? (
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                                                NOME DA VIAGEM
                                                            </p>
                                                            <input
                                                                type="text"
                                                                value={novoTitulo}
                                                                onChange={(e) =>
                                                                    setNovoTitulo(e.target.value)
                                                                }
                                                                maxLength={100}
                                                                autoFocus
                                                                disabled={salvandoTitulo}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        void salvarTitulo(viagem.id);
                                                                    }
                                                                    if (e.key === "Escape") {
                                                                        cancelarEdicao();
                                                                    }
                                                                }}
                                                                placeholder="Ex.: Férias de meio de ano"
                                                                className="mt-2 h-11 w-full rounded-xl border border-destaque bg-surface px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-destaque/20"
                                                            />
                                                            <p className="mt-1 text-right text-[10px] text-muted">
                                                                {novoTitulo.length}/100 caracteres
                                                            </p>
                                                            {erroEdicao && (
                                                                <p className="mt-2 text-xs text-red-600">
                                                                    {erroEdicao}
                                                                </p>
                                                            )}
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void salvarTitulo(viagem.id)
                                                                    }
                                                                    disabled={salvandoTitulo}
                                                                    className="flex items-center gap-2 rounded-xl bg-destaque px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {salvandoTitulo ? (
                                                                        <LoaderCircle
                                                                            size={15}
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : (
                                                                        <Check size={15} />
                                                                    )}
                                                                    Salvar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelarEdicao}
                                                                    disabled={salvandoTitulo}
                                                                    className="flex items-center gap-2 rounded-xl bg-surface-alt px-4 py-2 text-xs font-semibold text-muted transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    <X size={15} />
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="break-words text-lg font-extrabold text-titulo">
                                                                {viagem.titulo}
                                                            </h3>
                                                            <button
                                                                type="button"
                                                                onClick={() => iniciarEdicao(viagem)}
                                                                disabled={salvandoTitulo}
                                                                title="Editar nome da viagem"
                                                                aria-label={`Editar nome da viagem ${viagem.titulo}`}
                                                                className="rounded-lg p-2 text-muted transition hover:bg-destaque-suave hover:text-destaque disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <ul className="mt-3 space-y-2 text-sm text-muted">
                                                        <li className="flex items-center gap-2.5">
                                                            <MapPin size={16} className="shrink-0 text-muted" />
                                                            <span className="min-w-0 break-words">
                                                                {viagem.origem} → {viagem.destino}
                                                            </span>
                                                        </li>
                                                        <li className="flex items-center gap-2.5">
                                                            <CalendarDays size={16} className="shrink-0 text-muted" />
                                                            <span>
                                                                {formatarDataCurta(viagem.data_ida)} até{" "}
                                                                {formatarDataCurta(viagem.data_volta)} (
                                                                {calcularDuracao(
                                                                    viagem.data_ida,
                                                                    viagem.data_volta
                                                                )}{" "}
                                                                dias)
                                                            </span>
                                                        </li>
                                                        <li className="flex items-center gap-2.5">
                                                            <Users size={16} className="shrink-0 text-muted" />
                                                            <span>
                                                                {viagem.viajantes}{" "}
                                                                {viagem.viajantes === 1
                                                                    ? "viajante"
                                                                    : "viajantes"}
                                                            </span>
                                                        </li>
                                                        <li className="flex items-center gap-2.5">
                                                            <IconeTransporte size={16} className="shrink-0 text-muted" />
                                                            <span>{viagem.transporte}</span>
                                                        </li>
                                                        {viagem.orcamento !== null &&
                                                            viagem.orcamento !== undefined && (
                                                                <li className="flex items-center gap-2.5">
                                                                    <Wallet size={16} className="shrink-0 text-muted" />
                                                                    <span>
                                                                        {Number(
                                                                            viagem.orcamento
                                                                        ).toLocaleString("pt-BR", {
                                                                            style: "currency",
                                                                            currency: "BRL",
                                                                        })}
                                                                    </span>
                                                                </li>
                                                            )}
                                                    </ul>

                                                    {preferencias.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {preferencias.map((preferencia) => {
                                                                const IconePreferencia =
                                                                    obterIconePreferencia(preferencia);
                                                                return (
                                                                    <span
                                                                        key={preferencia}
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-destaque-suave px-3 py-1.5 text-xs font-semibold text-destaque"
                                                                    >
                                                                        <IconePreferencia size={14} />
                                                                        {preferencia}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* AÇÕES */}
                                                <div className="flex w-full shrink-0 flex-col gap-2 border-t border-line pt-4 md:w-[190px] md:border-l md:border-t-0 md:pl-5 md:pt-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setRoteiroAberto(viagem)}
                                                        disabled={!viagem.roteiro}
                                                        title={
                                                            viagem.roteiro
                                                                ? "Ver roteiro salvo"
                                                                : "Esta viagem não tem roteiro salvo"
                                                        }
                                                        className="flex h-11 items-center justify-between rounded-xl bg-gradient-to-r from-[#167D8D] to-[#12687A] px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Eye size={17} />
                                                            Ver roteiro
                                                        </span>
                                                        <ChevronRight size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => iniciarEdicaoDados(viagem)}
                                                        disabled={estaEditandoDados}
                                                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-titulo transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <Pencil size={16} />
                                                        Editar
                                                    </button>

                                                    <label className="block">
                                                        <span className="relative block">
                                                            {atualizandoStatusId === viagem.id ? (
                                                                <LoaderCircle
                                                                    size={16}
                                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-destaque"
                                                                />
                                                            ) : (
                                                                <RefreshCw
                                                                    size={16}
                                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-destaque"
                                                                />
                                                            )}
                                                            <select
                                                                aria-label={`Alterar status da viagem ${viagem.titulo}`}
                                                                value={viagem.status}
                                                                onChange={(e) =>
                                                                    void atualizarStatus(
                                                                        viagem.id,
                                                                        e.target.value as StatusViagem
                                                                    )
                                                                }
                                                                disabled={atualizandoStatusId === viagem.id}
                                                                className="h-11 w-full appearance-none rounded-xl border border-line bg-surface pl-10 pr-8 text-sm font-semibold text-titulo outline-none transition hover:bg-surface-alt focus:border-destaque focus:ring-2 focus:ring-destaque/20 disabled:cursor-wait disabled:opacity-60"
                                                            >
                                                                <option value="planejada">Planejada</option>
                                                                <option value="em_andamento">Em andamento</option>
                                                                <option value="concluida">Concluída</option>
                                                            </select>
                                                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                                                                ▾
                                                            </span>
                                                        </span>
                                                        {erroStatus && atualizandoStatusId === null && (
                                                            <span className="mt-1 block text-[11px] text-red-600">
                                                                {erroStatus}
                                                            </span>
                                                        )}
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={() => pedirExclusao(viagem)}
                                                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <Trash2 size={16} />
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>

                                            {/* EDIÇÃO DOS DADOS DA VIAGEM */}
                                            {estaEditandoDados && (
                                                <div className="border-t border-line p-4 md:p-5">
                                                    <div className="rounded-2xl border border-line bg-surface-alt p-4">
                                                        <h4 className="mb-4 text-sm font-bold text-titulo">Editar dados da viagem</h4>
                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <label className="text-xs font-semibold text-muted">Origem<input value={formDados.origem} onChange={(e) => setFormDados({ ...formDados, origem: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted">Destino<input value={formDados.destino} onChange={(e) => setFormDados({ ...formDados, destino: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted">Data de ida<input type="date" value={formDados.data_ida} onChange={(e) => setFormDados({ ...formDados, data_ida: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted">Data de volta<input type="date" value={formDados.data_volta} min={formDados.data_ida || undefined} onChange={(e) => setFormDados({ ...formDados, data_volta: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted">Viajantes<input type="number" min="1" max="8" value={formDados.viajantes} onChange={(e) => setFormDados({ ...formDados, viajantes: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted">Transporte<select value={formDados.transporte} onChange={(e) => setFormDados({ ...formDados, transporte: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque"><option>Carro</option><option>Moto</option><option>Ônibus</option><option>Avião</option></select></label>
                                                            <label className="text-xs font-semibold text-muted sm:col-span-2">Orçamento (R$)<input type="number" min="0" step="0.01" value={formDados.orcamento} onChange={(e) => setFormDados({ ...formDados, orcamento: e.target.value })} placeholder="Ex.: 2500,00" className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted sm:col-span-2">Preferências <span className="font-normal text-muted">(separe por vírgulas)</span><input value={formDados.preferencias} onChange={(e) => setFormDados({ ...formDados, preferencias: e.target.value })} placeholder="Praias, gastronomia, passeios..." className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                            <label className="text-xs font-semibold text-muted sm:col-span-2">Observações<textarea rows={3} value={formDados.observacoes} onChange={(e) => setFormDados({ ...formDados, observacoes: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-destaque" /></label>
                                                        </div>
                                                        {erroDados && <p className="mt-3 text-xs text-red-600">{erroDados}</p>}
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <button type="button" onClick={() => void salvarDadosViagem(viagem.id)} disabled={salvandoDados} className="inline-flex items-center gap-2 rounded-xl bg-destaque px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">{salvandoDados ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Salvar alterações</button>
                                                            <button type="button" onClick={cancelarEdicaoDados} disabled={salvandoDados} className="inline-flex items-center gap-2 rounded-xl bg-surface-alt px-4 py-2.5 text-xs font-semibold text-muted hover:bg-surface-alt disabled:opacity-50"><X size={14} /> Cancelar</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* MODAL: VER ROTEIRO */}
            {roteiroAberto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setRoteiroAberto(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Roteiro de ${roteiroAberto.titulo}`}
                        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#102A43] via-[#12465D] to-[#167D8D] px-6 py-5 text-white">
                            <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border border-white/10" />
                            <div className="relative z-10 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#65DCD5]">
                                        Roteiro salvo
                                    </p>
                                    <h2 className="mt-1 break-words text-xl font-extrabold">
                                        {roteiroAberto.titulo}
                                    </h2>
                                    <p className="mt-1 text-xs text-white/75">
                                        {formatarDataCurta(roteiroAberto.data_ida)} até{" "}
                                        {formatarDataCurta(roteiroAberto.data_volta)} ·{" "}
                                        {roteiroAberto.viajantes}{" "}
                                        {roteiroAberto.viajantes === 1 ? "viajante" : "viajantes"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRoteiroAberto(null)}
                                    aria-label="Fechar roteiro"
                                    className="shrink-0 rounded-xl border border-white/20 bg-surface/10 p-2 text-white transition hover:bg-surface/20"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-6 md:p-8">
                            {roteiroAberto.roteiro ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={markdownRoteiro}
                                >
                                    {roteiroAberto.roteiro}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-sm text-muted">
                                    Esta viagem não tem roteiro salvo.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRMAR EXCLUSÃO */}
            {viagemParaExcluir && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={cancelarExclusao}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-label="Confirmar exclusão da viagem"
                        className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="mt-4 text-lg font-extrabold text-titulo">
                            Excluir esta viagem?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            A viagem{" "}
                            <strong className="text-titulo">
                                {viagemParaExcluir.titulo}
                            </strong>{" "}
                            e o roteiro salvo serão removidos. Essa ação não pode ser
                            desfeita.
                        </p>
                        {erroExclusao && (
                            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                {erroExclusao}
                            </p>
                        )}
                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={cancelarExclusao}
                                disabled={excluindo}
                                className="rounded-xl bg-surface-alt px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmarExclusao()}
                                disabled={excluindo}
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {excluindo ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                Excluir viagem
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}