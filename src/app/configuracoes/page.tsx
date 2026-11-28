"use client";
import { useTema } from "@/contexts/ThemeContext";
import { useEffect, useRef, useState } from "react";
import { useIdioma } from "@/contexts/IdiomaContext";
import { traducoes, type Idioma } from "@/i18n";
import Sidebar from "@/components/layout/Sidebar";
import {
    UserRound,
    Bell,
    SlidersHorizontal,
    Globe,
    Moon,
    ShieldCheck,
    Info,
    Settings,
    Compass,
    Sparkles,
    LockKeyhole,
    CircleHelp,
    Save,
    Mail,
    Phone,
    MapPin,
    Trash2,
    Camera,
    TriangleAlert,
    Monitor,
    Sun,
    CalendarDays,
} from "lucide-react";

/* ───────────────────────── Tipos ───────────────────────── */

type SecaoConfiguracao =
    | "conta"
    | "notificacoes"
    | "preferencias"
    | "idioma"
    | "aparencia"
    | "privacidade"
    | "sobre";

type Mensagem = { tipo: "sucesso" | "erro"; texto: string } | null;

type DadosPrivacidade = {
    conta: {
        email: string | null;
        emailVerificado: boolean;
        dataCriacao: string | null;
        ultimoAcesso: string | null;
    };
};

type TemaAparencia = "claro" | "escuro" | "automatico";

type PreferenciasNotificacoes = {
    roteiros: boolean;
    viagens: boolean;
    novidades: boolean;
};

type ConfiguracoesIdioma = {
    idioma: string;
    moeda: string;
    regiao: string;
    formatoData: string;
};

type PreferenciasViagem = {
    transportes: string[];
    interesses: string[];
    orcamento: string;
};

/* ─────────────── Constantes (os valores NÃO mudam com o idioma) ───────────────
   Os textos exibidos vêm das traduções; o "valor" é o que fica salvo no banco. */

const secoes = [
    { id: "conta" as const, icone: UserRound },
    { id: "notificacoes" as const, icone: Bell },
    { id: "preferencias" as const, icone: SlidersHorizontal },
    { id: "idioma" as const, icone: Globe },
    { id: "aparencia" as const, icone: Moon },
    { id: "privacidade" as const, icone: ShieldCheck },
    { id: "sobre" as const, icone: Info },
];

const opcoesNotificacoes = [
    { id: "roteiros" as const, icone: Compass },
    { id: "viagens" as const, icone: Bell },
    { id: "novidades" as const, icone: Sparkles },
];

const opcoesTransporte = [
    { valor: "Carro", chave: "carro" as const },
    { valor: "Moto", chave: "moto" as const },
    { valor: "Ônibus", chave: "onibus" as const },
    { valor: "Transporte público", chave: "publico" as const },
];

const opcoesInteresses = [
    { valor: "Praias e natureza", chave: "praias" as const },
    { valor: "História e cultura", chave: "historia" as const },
    { valor: "Gastronomia", chave: "gastronomia" as const },
    { valor: "Aventura", chave: "aventura" as const },
    { valor: "Turismo e passeios", chave: "turismo" as const },
    { valor: "Compras e entretenimento", chave: "compras" as const },
];

const opcoesOrcamento = [
    { valor: "Economico", chave: "economico" as const },
    { valor: "Moderado", chave: "moderado" as const },
    { valor: "Confortavel", chave: "confortavel" as const },
    { valor: "Luxo", chave: "luxo" as const },
];

const opcoesFormatoData = [
    { valor: "DD/MM/AAAA", chave: "dma" as const },
    { valor: "MM/DD/AAAA", chave: "mda" as const },
];

const idiomasDisponiveis: Idioma[] = ["pt-BR", "en", "es"];

/* ───────────────────────── Componentes ───────────────────────── */

function CartaoInformativo({
    titulo,
    descricao,
    icone: Icon,
}: {
    titulo: string;
    descricao: string;
    icone: React.ElementType;
}) {
    return (
        <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                <Icon size={21} />
            </div>

            <div>
                <h3 className="font-bold text-titulo">{titulo}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                    {descricao}
                </p>
            </div>
        </div>
    );
}

function CabecalhoCartao({
    icone: Icon,
    titulo,
    descricao,
}: {
    icone: React.ElementType;
    titulo: string;
    descricao: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                <Icon size={22} />
            </div>

            <div>
                <h3 className="font-bold text-titulo">{titulo}</h3>
                <p className="text-sm text-muted">{descricao}</p>
            </div>
        </div>
    );
}

function Campo({
    label,
    icone: Icon,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled = false,
    maxLength,
}: {
    label: string;
    icone: React.ElementType;
    value: string;
    onChange?: (valor: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    maxLength?: number;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-titulo">
                {label}
            </span>

            <div
                className={`flex items-center gap-3 rounded-xl border px-4 transition focus-within:border-destaque focus-within:ring-2 focus-within:ring-destaque/20 ${disabled
                    ? "border-line bg-surface-alt"
                    : "border-line bg-surface"
                    }`}
            >
                <Icon size={18} className="shrink-0 text-muted" />

                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:text-muted"
                />
            </div>
        </label>
    );
}

function Seletor({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (valor: string) => void;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-titulo">
                {label}
            </span>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:border-destaque focus:ring-2 focus:ring-destaque/20"
            >
                {children}
            </select>
        </label>
    );
}

function Interruptor({
    ativo,
    onChange,
    rotulo,
}: {
    ativo: boolean;
    onChange: () => void;
    rotulo: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={ativo}
            aria-label={rotulo}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque/50 ${ativo ? "bg-destaque" : "bg-muted/40"
                }`}
        >
            <span
                className={`inline-block h-5 w-5 rounded-full bg-surface shadow transition-transform ${ativo ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}

function OpcaoSelecionavel({
    ativo,
    onClick,
    titulo,
    descricao,
}: {
    ativo: boolean;
    onClick: () => void;
    titulo: string;
    descricao?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={ativo}
            className={`rounded-xl border p-4 text-left transition ${ativo
                ? "border-destaque bg-destaque-suave"
                : "border-line bg-surface hover:border-destaque"
                }`}
        >
            <span className="flex items-center justify-between gap-2 text-sm font-bold text-titulo">
                {titulo}
                {ativo && <span className="text-destaque">✓</span>}
            </span>

            {descricao && (
                <p className="mt-1 text-sm font-normal text-muted">
                    {descricao}
                </p>
            )}
        </button>
    );
}

function BarraSalvar({
    mensagem,
    onSalvar,
    desabilitado,
    salvando,
    rotulo,
    rotuloSalvando,
    comLinha = true,
}: {
    mensagem: Mensagem;
    onSalvar: () => void;
    desabilitado: boolean;
    salvando: boolean;
    rotulo: string;
    rotuloSalvando: string;
    comLinha?: boolean;
}) {
    return (
        <div
            className={`mt-6 flex flex-wrap items-center justify-between gap-4 ${comLinha ? "border-t border-line pt-5" : ""
                }`}
        >
            <div className="min-w-0 flex-1">
                {mensagem && (
                    <div
                        role="status"
                        className={`rounded-xl border p-3 text-sm ${mensagem.tipo === "sucesso"
                            ? "border-destaque/20 bg-destaque-suave text-destaque"
                            : "border-red-200 bg-red-50 text-red-700"
                            }`}
                    >
                        {mensagem.texto}
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onSalvar}
                disabled={desabilitado || salvando}
                className="ml-auto flex items-center gap-2 rounded-xl bg-destaque px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Save size={18} />
                {salvando ? rotuloSalvando : rotulo}
            </button>
        </div>
    );
}

/* ───────────────────────── Utilitários ───────────────────────── */

function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 3) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 7)
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3)}`;

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(
        3,
        7
    )}-${numeros.slice(7)}`;
}

function obterIniciais(nome: string, email: string) {
    const partes = nome.trim().split(/\s+/).filter(Boolean);

    if (partes.length >= 2) {
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return (email[0] || "U").toUpperCase();
}

async function prepararImagem(arquivo: File): Promise<Blob> {
    const bitmap = await createImageBitmap(arquivo);
    const lado = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");

    // recorte quadrado centralizado
    ctx.drawImage(
        bitmap,
        (bitmap.width - lado) / 2,
        (bitmap.height - lado) / 2,
        lado,
        lado,
        0,
        0,
        512,
        512
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("blob"))),
            "image/jpeg",
            0.85
        );
    });
}

/* ───────────────────────── Página ───────────────────────── */

export default function ConfiguracoesPage() {
    const { alterarIdioma, traducao } = useIdioma();
    const { atualizarTema } = useTema();
    const t = traducao.configuracoes;

    const [secaoAtiva, setSecaoAtiva] =
        useState<SecaoConfiguracao>("conta");

    /* ---- Privacidade ---- */
    const [dadosPrivacidade, setDadosPrivacidade] =
        useState<DadosPrivacidade | null>(null);

    const [carregandoPrivacidade, setCarregandoPrivacidade] =
        useState(false);

    const [erroPrivacidade, setErroPrivacidade] = useState("");
    /* ---- Conta ---- */
    const [usuario, setUsuario] = useState({
        nome: "",
        email: "",
        telefone: "",
        cidade: "",
        avatarUrl: "",
    });
    const [form, setForm] = useState({ nome: "", telefone: "", cidade: "" });
    const [carregandoConta, setCarregandoConta] = useState(true);
    const [erroConta, setErroConta] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState<Mensagem>(null);
    const [enviandoFoto, setEnviandoFoto] = useState(false);
    const inputFotoRef = useRef<HTMLInputElement>(null);
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    /* ---- Notificações ---- */
    const [notificacoes, setNotificacoes] =
        useState<PreferenciasNotificacoes>({
            roteiros: true,
            viagens: true,
            novidades: false,
        });
    const [notificacoesSalvas, setNotificacoesSalvas] =
        useState<PreferenciasNotificacoes | null>(null);
    const [carregandoNotificacoes, setCarregandoNotificacoes] =
        useState(false);
    const [salvandoNotificacoes, setSalvandoNotificacoes] = useState(false);
    const [mensagemNotificacoes, setMensagemNotificacoes] =
        useState<Mensagem>(null);

    /* ---- Preferências de viagem ---- */
    const [preferencias, setPreferencias] = useState<PreferenciasViagem>({
        transportes: ["Carro"],
        interesses: [],
        orcamento: "Economico",
    });
    const [preferenciasSalvas, setPreferenciasSalvas] =
        useState<PreferenciasViagem | null>(null);
    const [carregandoPreferencias, setCarregandoPreferencias] =
        useState(false);
    const [salvandoPreferencias, setSalvandoPreferencias] = useState(false);
    const [mensagemPreferencias, setMensagemPreferencias] =
        useState<Mensagem>(null);

    /* ---- Idioma e região ---- */
    const [configuracoesIdioma, setConfiguracoesIdioma] =
        useState<ConfiguracoesIdioma>({
            idioma: "pt-BR",
            moeda: "BRL",
            regiao: "BR",
            formatoData: "DD/MM/AAAA",
        });
    const [configuracoesIdiomaSalvas, setConfiguracoesIdiomaSalvas] =
        useState<ConfiguracoesIdioma | null>(null);
    const [carregandoIdioma, setCarregandoIdioma] = useState(false);
    const [salvandoIdioma, setSalvandoIdioma] = useState(false);
    const [mensagemIdioma, setMensagemIdioma] = useState<Mensagem>(null);

    /* ---- Aparência ---- */
    const [tema, setTema] = useState<TemaAparencia>("claro");
    const [temaSalvo, setTemaSalvo] = useState<TemaAparencia | null>(null);
    const [carregandoAparencia, setCarregandoAparencia] = useState(false);
    const [salvandoAparencia, setSalvandoAparencia] = useState(false);
    const [mensagemAparencia, setMensagemAparencia] = useState<Mensagem>(null);

    /* ───────────── Carregamento dos dados ───────────── */

    useEffect(() => {
        async function carregarConta() {
            try {
                const resposta = await fetch("/api/configuracoes/conta");
                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(dados.erro || t.mensagens.erroCarregar);
                }

                const carregado = {
                    nome: dados.usuario.nome ?? "",
                    email: dados.usuario.email ?? "",
                    telefone: dados.usuario.telefone ?? "",
                    cidade: dados.usuario.cidade ?? "",
                    avatarUrl: dados.usuario.avatarUrl ?? "",
                };

                setUsuario(carregado);
                setForm({
                    nome: carregado.nome,
                    telefone: carregado.telefone,
                    cidade: carregado.cidade,
                });
            } catch (error) {
                setErroConta(
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroCarregar
                );
            } finally {
                setCarregandoConta(false);
            }
        }

        carregarConta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (secaoAtiva !== "notificacoes") return;

        async function carregarNotificacoes() {
            setCarregandoNotificacoes(true);
            setMensagemNotificacoes(null);

            try {
                const resposta = await fetch("/api/configuracoes/notificacoes");
                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(dados.erro || t.mensagens.erroCarregar);
                }

                setNotificacoes(dados.notificacoes);
                setNotificacoesSalvas(dados.notificacoes);
            } catch (error) {
                setMensagemNotificacoes({
                    tipo: "erro",
                    texto:
                        error instanceof Error
                            ? error.message
                            : t.mensagens.erroCarregar,
                });
            } finally {
                setCarregandoNotificacoes(false);
            }
        }

        carregarNotificacoes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secaoAtiva]);

    useEffect(() => {
        if (secaoAtiva !== "preferencias") return;

        async function carregarPreferencias() {
            setCarregandoPreferencias(true);
            setMensagemPreferencias(null);

            try {
                const resposta = await fetch("/api/configuracoes/preferencias");
                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(dados.erro || t.mensagens.erroCarregar);
                }

                setPreferencias(dados.preferencias);
                setPreferenciasSalvas(dados.preferencias);
            } catch (error) {
                setMensagemPreferencias({
                    tipo: "erro",
                    texto:
                        error instanceof Error
                            ? error.message
                            : t.mensagens.erroCarregar,
                });
            } finally {
                setCarregandoPreferencias(false);
            }
        }

        carregarPreferencias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secaoAtiva]);

    useEffect(() => {
        if (secaoAtiva !== "idioma") return;

        async function carregarIdioma() {
            setCarregandoIdioma(true);
            setMensagemIdioma(null);

            try {
                const resposta = await fetch("/api/configuracoes/idioma");
                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(dados.erro || t.mensagens.erroCarregar);
                }

                setConfiguracoesIdioma(dados.configuracoes);
                setConfiguracoesIdiomaSalvas(dados.configuracoes);
            } catch (error) {
                setMensagemIdioma({
                    tipo: "erro",
                    texto:
                        error instanceof Error
                            ? error.message
                            : t.mensagens.erroCarregar,
                });
            } finally {
                setCarregandoIdioma(false);
            }
        }

        carregarIdioma();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secaoAtiva]);

    useEffect(() => {
        if (secaoAtiva !== "aparencia") return;

        let ativo = true;

        async function carregarAparencia() {
            setCarregandoAparencia(true);
            setMensagemAparencia(null);

            try {
                const resposta = await fetch("/api/configuracoes/aparencia");
                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar a aparência."
                    );
                }

                const temaCarregado = dados.aparencia?.tema;

                const temaValido: TemaAparencia =
                    ["claro", "escuro", "automatico"].includes(temaCarregado)
                        ? temaCarregado
                        : "claro";

                if (ativo) {
                    setTema(temaValido);
                    setTemaSalvo(temaValido);
                }
            } catch (error) {
                if (ativo) {
                    setMensagemAparencia({
                        tipo: "erro",
                        texto:
                            error instanceof Error
                                ? error.message
                                : "Erro ao carregar a aparência.",
                    });
                }
            } finally {
                if (ativo) {
                    setCarregandoAparencia(false);
                }
            }
        }

        carregarAparencia();

        return () => {
            ativo = false;
        };
    }, [secaoAtiva]);


    /* ---- Carregamento da privacidade ---- */
    useEffect(() => {
        if (secaoAtiva !== "privacidade") return;

        let ativo = true;

        async function carregarPrivacidade() {
            setCarregandoPrivacidade(true);
            setErroPrivacidade("");

            try {
                const resposta = await fetch(
                    "/api/configuracoes/privacidade",
                    { cache: "no-store" }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível carregar os dados."
                    );
                }

                if (ativo) {
                    setDadosPrivacidade(dados);
                }
            } catch (error) {
                if (ativo) {
                    setErroPrivacidade(
                        error instanceof Error
                            ? error.message
                            : "Erro ao carregar informações."
                    );
                }
            } finally {
                if (ativo) setCarregandoPrivacidade(false);
            }
        }

        carregarPrivacidade();

        return () => {
            ativo = false;
        };
    }, [secaoAtiva]);

    /* ───────────── Detecção de alterações ───────────── */

    const houveAlteracao =
        form.nome !== usuario.nome ||
        form.telefone !== usuario.telefone ||
        form.cidade !== usuario.cidade;

    const houveAlteracaoNotificacoes =
        notificacoesSalvas !== null &&
        JSON.stringify(notificacoes) !== JSON.stringify(notificacoesSalvas);

    const houveAlteracaoPreferencias =
        preferenciasSalvas !== null &&
        JSON.stringify(preferencias) !== JSON.stringify(preferenciasSalvas);

    const houveAlteracaoIdioma =
        configuracoesIdiomaSalvas !== null &&
        JSON.stringify(configuracoesIdioma) !==
        JSON.stringify(configuracoesIdiomaSalvas);

    const houveAlteracaoAparencia =
        temaSalvo !== null && tema !== temaSalvo;

    /* ───────────── Ações ───────────── */

    async function salvarAlteracoes() {
        const nome = form.nome.trim();
        const cidade = form.cidade.trim();
        const telefone = form.telefone.trim();

        if (nome.length < 2 || nome.length > 40) {
            setMensagem({ tipo: "erro", texto: t.mensagens.nomeInvalido });
            return;
        }

        if (telefone && telefone.replace(/\D/g, "").length < 10) {
            setMensagem({ tipo: "erro", texto: t.mensagens.telefoneInvalido });
            return;
        }

        setSalvando(true);
        setMensagem(null);

        try {
            const resposta = await fetch("/api/configuracoes/conta", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, telefone, cidade }),
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroSalvar);
            }

            const atualizado = {
                nome: dados.usuario.nome ?? "",
                email: dados.usuario.email ?? "",
                telefone: dados.usuario.telefone ?? "",
                cidade: dados.usuario.cidade ?? "",
                avatarUrl: dados.usuario.avatarUrl ?? "",
            };

            setUsuario(atualizado);
            setForm({
                nome: atualizado.nome,
                telefone: atualizado.telefone,
                cidade: atualizado.cidade,
            });
            setMensagem({ tipo: "sucesso", texto: t.mensagens.contaSalva });
        } catch (error) {
            setMensagem({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroSalvar,
            });
        } finally {
            setSalvando(false);
        }
    }

    async function salvarNotificacoes() {
        setSalvandoNotificacoes(true);
        setMensagemNotificacoes(null);

        try {
            const resposta = await fetch("/api/configuracoes/notificacoes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificacoes }),
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroSalvar);
            }

            setNotificacoes(dados.notificacoes);
            setNotificacoesSalvas(dados.notificacoes);
            setMensagemNotificacoes({
                tipo: "sucesso",
                texto: t.mensagens.notificacoesSalvas,
            });
        } catch (error) {
            setMensagemNotificacoes({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroSalvar,
            });
        } finally {
            setSalvandoNotificacoes(false);
        }
    }

    function alternarItem(
        campo: "transportes" | "interesses",
        valor: string
    ) {
        setPreferencias((anterior) => {
            const selecionados = anterior[campo];

            return {
                ...anterior,
                [campo]: selecionados.includes(valor)
                    ? selecionados.filter((item) => item !== valor)
                    : [...selecionados, valor],
            };
        });
    }

    async function salvarPreferencias() {
        setSalvandoPreferencias(true);
        setMensagemPreferencias(null);

        try {
            const resposta = await fetch("/api/configuracoes/preferencias", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferencias }),
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroSalvar);
            }

            setPreferencias(dados.preferencias);
            setPreferenciasSalvas(dados.preferencias);
            setMensagemPreferencias({
                tipo: "sucesso",
                texto: t.mensagens.preferenciasSalvas,
            });
        } catch (error) {
            setMensagemPreferencias({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroSalvar,
            });
        } finally {
            setSalvandoPreferencias(false);
        }
    }

    async function salvarIdioma() {
        setSalvandoIdioma(true);
        setMensagemIdioma(null);

        try {
            const resposta = await fetch("/api/configuracoes/idioma", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(configuracoesIdioma),
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroSalvar);
            }

            setConfiguracoesIdioma(dados.configuracoes);
            setConfiguracoesIdiomaSalvas(dados.configuracoes);

            // Troca o idioma em todo o app (menu lateral e esta página)
            const novoIdioma = dados.configuracoes.idioma as Idioma;
            const idiomaValido = idiomasDisponiveis.includes(novoIdioma);

            if (idiomaValido) {
                alterarIdioma(novoIdioma);
            }

            // a mensagem já sai no idioma novo
            const textoSucesso = idiomaValido
                ? traducoes[novoIdioma].configuracoes.mensagens.idiomaSalvo
                : t.mensagens.idiomaSalvo;

            setMensagemIdioma({ tipo: "sucesso", texto: textoSucesso });
        } catch (error) {
            setMensagemIdioma({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroSalvar,
            });
        } finally {
            setSalvandoIdioma(false);
        }
    }

    async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = e.target.files?.[0];
        e.target.value = "";

        if (!arquivo) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
            setMensagem({ tipo: "erro", texto: t.mensagens.fotoTipo });
            return;
        }

        if (arquivo.size > 10 * 1024 * 1024) {
            setMensagem({ tipo: "erro", texto: t.mensagens.fotoTamanho });
            return;
        }

        setEnviandoFoto(true);
        setMensagem(null);

        try {
            let blob: Blob;

            try {
                blob = await prepararImagem(arquivo);
            } catch {
                throw new Error(t.mensagens.erroFoto);
            }

            const formData = new FormData();
            formData.append("foto", blob, "avatar.jpg");

            const resposta = await fetch("/api/configuracoes/foto", {
                method: "POST",
                body: formData,
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroFoto);
            }

            setUsuario((u) => ({ ...u, avatarUrl: dados.avatarUrl }));
            setMensagem({ tipo: "sucesso", texto: t.mensagens.fotoAtualizada });
        } catch (error) {
            setMensagem({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroFoto,
            });
        } finally {
            setEnviandoFoto(false);
        }
    }

    async function salvarAparencia() {
        setSalvandoAparencia(true);
        setMensagemAparencia(null);

        try {
            const resposta = await fetch("/api/configuracoes/aparencia", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tema }),
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível salvar a aparência."
                );
            }

            const temaAtualizado = dados.aparencia?.tema ?? tema;

            setTema(temaAtualizado);
            setTemaSalvo(temaAtualizado);
            atualizarTema(temaAtualizado);

            setMensagemAparencia({
                tipo: "sucesso",
                texto: "Aparência salva com sucesso!",
            });
        } catch (error) {
            setMensagemAparencia({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : "Erro ao salvar a aparência.",
            });
        } finally {
            setSalvandoAparencia(false);
        }
    }

    async function removerFoto() {
        setEnviandoFoto(true);
        setMensagem(null);

        try {
            const resposta = await fetch("/api/configuracoes/foto", {
                method: "DELETE",
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroFoto);
            }

            setUsuario((u) => ({ ...u, avatarUrl: "" }));
            setMensagem({ tipo: "sucesso", texto: t.mensagens.fotoRemovida });
        } catch (error) {
            setMensagem({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroFoto,
            });
        } finally {
            setEnviandoFoto(false);
        }
    }

    async function excluirConta() {
        setExcluindo(true);

        try {
            const resposta = await fetch("/api/configuracoes/conta", {
                method: "DELETE",
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || t.mensagens.erroExcluir);
            }

            window.location.href = "/";
        } catch (error) {
            setConfirmandoExclusao(false);
            setMensagem({
                tipo: "erro",
                texto:
                    error instanceof Error
                        ? error.message
                        : t.mensagens.erroExcluir,
            });
        } finally {
            setExcluindo(false);
        }
    }

    function trocarSecao(id: SecaoConfiguracao) {
        setSecaoAtiva(id);
        setMensagem(null);
        setMensagemNotificacoes(null);
        setMensagemPreferencias(null);
        setMensagemIdioma(null);
    }

    const secao = secoes.find((item) => item.id === secaoAtiva)!;
    const IconeSecao = secao.icone;
    const textoSecao = t.secoes[secaoAtiva];

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Sidebar />

            <main className="min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:ml-[264px] lg:px-8 lg:pt-6">
                <div className="mx-auto max-w-[1500px] space-y-5">

                    {/* CABEÇALHO */}
                    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F4A5C] via-[#126A7A] to-[#1B8A96] px-6 py-5 text-white shadow-md md:px-8">
                        <svg
                            aria-hidden
                            viewBox="0 0 600 120"
                            preserveAspectRatio="none"
                            className="pointer-events-none absolute inset-y-0 right-0 h-full w-2/3 opacity-30"
                        >
                            <path
                                d="M0 120 L90 50 L150 85 L240 20 L330 80 L410 40 L500 90 L600 30 L600 120 Z"
                                fill="#0B3140"
                            />
                            <path
                                d="M0 120 L110 80 L200 100 L300 60 L400 105 L520 70 L600 95 L600 120 Z"
                                fill="#06212C"
                            />
                        </svg>
                        <div className="pointer-events-none absolute -right-6 -top-10 h-40 w-40 rounded-full bg-[#F2B24C]/30 blur-3xl" />

                        <div className="relative z-10 flex items-center gap-4">
                            <Settings size={44} strokeWidth={1.6} />

                            <div>
                                <h1 className="text-2xl font-extrabold sm:text-3xl">
                                    {t.cabecalho.titulo}
                                </h1>

                                <p className="mt-1 text-sm text-blue-50/90">
                                    {t.cabecalho.subtitulo}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CONTEÚDO */}
                    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">


                        {/* MENU INTERNO */}
                        <aside className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
                            <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:gap-1 xl:overflow-visible xl:pb-0">
                                {secoes.map((item) => {
                                    const Icon = item.icone;
                                    const ativo = secaoAtiva === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => trocarSecao(item.id)}
                                            aria-current={ativo ? "page" : undefined}
                                            className={`flex min-w-max items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors xl:w-full ${ativo
                                                ? "bg-destaque-suave text-destaque"
                                                : "text-titulo hover:bg-surface-alt"
                                                }`}
                                        >
                                            <Icon
                                                size={21}
                                                strokeWidth={1.8}
                                                className="shrink-0"
                                            />

                                            <span className="text-[15px] font-medium">
                                                {t.secoes[item.id].titulo}
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </aside>


                        {/* PAINEL PRINCIPAL */}
                        <section className="min-w-0 space-y-4">

                            {/* TÍTULO DA SEÇÃO */}
                            <div className="flex items-center gap-3 px-1">
                                <IconeSecao
                                    size={34}
                                    strokeWidth={1.5}
                                    className="shrink-0 text-titulo"
                                />

                                <div>
                                    <h2 className="text-2xl font-extrabold text-titulo">
                                        {textoSecao.titulo}
                                    </h2>

                                    <p className="text-sm text-muted">
                                        {textoSecao.descricao}
                                    </p>
                                </div>
                            </div>

                            {/* ───────── MINHA CONTA ───────── */}
                            {secaoAtiva === "conta" && (
                                <>
                                    <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                        {erroConta ? (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                                {erroConta}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-wrap items-center gap-5">
                                                    <div className="relative shrink-0">
                                                        <div className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#167D8D] to-[#2AA9A6] text-3xl font-extrabold text-white">
                                                            {usuario.avatarUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={usuario.avatarUrl}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : carregandoConta ? (
                                                                ""
                                                            ) : (
                                                                obterIniciais(usuario.nome, usuario.email)
                                                            )}

                                                            {enviandoFoto && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold">
                                                                    ...
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => inputFotoRef.current?.click()}
                                                            disabled={enviandoFoto || carregandoConta}
                                                            aria-label={t.conta.alterarFoto}
                                                            title={t.conta.escolherFoto}
                                                            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-destaque text-white transition hover:bg-destaque disabled:opacity-60"
                                                        >
                                                            <Camera size={15} />
                                                        </button>

                                                        <input
                                                            ref={inputFotoRef}
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp"
                                                            onChange={escolherFoto}
                                                            className="hidden"
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-xl font-extrabold text-titulo">
                                                            {carregandoConta
                                                                ? t.conta.carregando
                                                                : usuario.nome ||
                                                                t.conta.usuarioPadrao}
                                                        </h3>

                                                        <p className="mt-0.5 break-all text-sm text-muted">
                                                            {usuario.email}
                                                        </p>

                                                        {usuario.avatarUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={removerFoto}
                                                                disabled={enviandoFoto}
                                                                className="mt-1 text-xs font-semibold text-muted transition hover:text-red-600 disabled:opacity-60"
                                                            >
                                                                {t.conta.removerFoto}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
                                                    <Campo
                                                        label={t.conta.nomeCompleto}
                                                        icone={UserRound}
                                                        value={form.nome}
                                                        maxLength={40}
                                                        disabled={carregandoConta}
                                                        onChange={(valor) =>
                                                            setForm((f) => ({ ...f, nome: valor }))
                                                        }
                                                    />

                                                    <Campo
                                                        label={t.conta.email}
                                                        icone={Mail}
                                                        type="email"
                                                        value={usuario.email}
                                                        disabled
                                                    />

                                                    <Campo
                                                        label={t.conta.telefone}
                                                        icone={Phone}
                                                        value={form.telefone}
                                                        placeholder="(86) 9 9999-9999"
                                                        disabled={carregandoConta}
                                                        onChange={(valor) =>
                                                            setForm((f) => ({
                                                                ...f,
                                                                telefone: formatarTelefone(valor),
                                                            }))
                                                        }
                                                    />

                                                    <Campo
                                                        label={t.conta.cidade}
                                                        icone={MapPin}
                                                        value={form.cidade}
                                                        placeholder={t.conta.cidadePlaceholder}
                                                        maxLength={60}
                                                        disabled={carregandoConta}
                                                        onChange={(valor) =>
                                                            setForm((f) => ({ ...f, cidade: valor }))
                                                        }
                                                    />
                                                </div>

                                                <BarraSalvar
                                                    comLinha={false}
                                                    mensagem={mensagem}
                                                    onSalvar={salvarAlteracoes}
                                                    desabilitado={carregandoConta || !houveAlteracao}
                                                    salvando={salvando}
                                                    rotulo={t.conta.salvar}
                                                    rotuloSalvando={t.conta.salvando}
                                                />
                                            </>
                                        )}
                                    </div>

                                    {/* GERENCIAR CONTA */}
                                    <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                                        <div className="flex items-start gap-3">
                                            <Trash2
                                                size={28}
                                                strokeWidth={1.6}
                                                className="mt-0.5 shrink-0 text-titulo"
                                            />

                                            <div>
                                                <h3 className="text-lg font-extrabold text-titulo">
                                                    {t.conta.gerenciarTitulo}
                                                </h3>
                                                <p className="text-sm text-muted">
                                                    {t.conta.gerenciarDescricao}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50/70 p-4">
                                            <div>
                                                <p className="font-bold text-red-600">
                                                    {t.conta.excluirTitulo}
                                                </p>
                                                <p className="mt-0.5 text-sm text-muted">
                                                    {t.conta.excluirDescricao}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setConfirmandoExclusao(true)}
                                                className="flex items-center gap-2 rounded-xl border border-red-300 bg-surface px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                <Trash2 size={17} />
                                                {t.conta.excluirBotao}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ───────── NOTIFICAÇÕES ───────── */}
                            {secaoAtiva === "notificacoes" && (
                                <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                    {carregandoNotificacoes ? (
                                        <p className="py-10 text-center text-sm text-muted">
                                            {t.notificacoes.carregando}
                                        </p>
                                    ) : (
                                        <>
                                            <div className="divide-y divide-line">
                                                {opcoesNotificacoes.map((item) => {
                                                    const Icone = item.icone;
                                                    const texto = t.notificacoes[item.id];

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                                                        >
                                                            <div className="flex min-w-0 items-center gap-4">
                                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                                    <Icone size={21} />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <h3 className="font-bold text-titulo">
                                                                        {texto.titulo}
                                                                    </h3>
                                                                    <p className="mt-0.5 text-sm leading-6 text-muted">
                                                                        {texto.descricao}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <Interruptor
                                                                rotulo={texto.titulo}
                                                                ativo={notificacoes[item.id]}
                                                                onChange={() =>
                                                                    setNotificacoes((anterior) => ({
                                                                        ...anterior,
                                                                        [item.id]: !anterior[item.id],
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <BarraSalvar
                                                mensagem={mensagemNotificacoes}
                                                onSalvar={salvarNotificacoes}
                                                desabilitado={!houveAlteracaoNotificacoes}
                                                salvando={salvandoNotificacoes}
                                                rotulo={t.notificacoes.salvar}
                                                rotuloSalvando={t.conta.salvando}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ───────── PREFERÊNCIAS DE VIAGEM ───────── */}
                            {secaoAtiva === "preferencias" && (
                                <div className="space-y-5">
                                    {carregandoPreferencias ? (
                                        <div className="rounded-3xl border border-line bg-surface p-10 text-center shadow-sm">
                                            <p className="text-sm text-muted">
                                                {t.preferencias.carregando}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Transporte */}
                                            <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                                <CabecalhoCartao
                                                    icone={Compass}
                                                    titulo={t.preferencias.transporte.titulo}
                                                    descricao={t.preferencias.transporte.descricao}
                                                />

                                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {opcoesTransporte.map((item) => (
                                                        <OpcaoSelecionavel
                                                            key={item.valor}
                                                            ativo={preferencias.transportes.includes(item.valor)}
                                                            onClick={() => alternarItem("transportes", item.valor)}
                                                            titulo={t.preferencias.transporte.opcoes[item.chave]}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Interesses */}
                                            <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                                <CabecalhoCartao
                                                    icone={Sparkles}
                                                    titulo={t.preferencias.interesses.titulo}
                                                    descricao={t.preferencias.interesses.descricao}
                                                />

                                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {opcoesInteresses.map((item) => (
                                                        <OpcaoSelecionavel
                                                            key={item.valor}
                                                            ativo={preferencias.interesses.includes(item.valor)}
                                                            onClick={() => alternarItem("interesses", item.valor)}
                                                            titulo={t.preferencias.interesses.opcoes[item.chave]}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Orçamento */}
                                            <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                                <CabecalhoCartao
                                                    icone={SlidersHorizontal}
                                                    titulo={t.preferencias.orcamento.titulo}
                                                    descricao={t.preferencias.orcamento.descricao}
                                                />

                                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    {opcoesOrcamento.map((item) => {
                                                        const texto = t.preferencias.orcamento.opcoes[item.chave];

                                                        return (
                                                            <OpcaoSelecionavel
                                                                key={item.valor}
                                                                ativo={preferencias.orcamento === item.valor}
                                                                onClick={() =>
                                                                    setPreferencias((anterior) => ({
                                                                        ...anterior,
                                                                        orcamento: item.valor,
                                                                    }))
                                                                }
                                                                titulo={texto.titulo}
                                                                descricao={texto.descricao}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="rounded-3xl border border-line bg-surface px-5 pb-5 shadow-sm sm:px-7">
                                                <BarraSalvar
                                                    comLinha={false}
                                                    mensagem={mensagemPreferencias}
                                                    onSalvar={salvarPreferencias}
                                                    desabilitado={!houveAlteracaoPreferencias}
                                                    salvando={salvandoPreferencias}
                                                    rotulo={t.preferencias.salvar}
                                                    rotuloSalvando={t.conta.salvando}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ───────── IDIOMA E REGIÃO ───────── */}
                            {secaoAtiva === "idioma" && (
                                <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                    {carregandoIdioma ? (
                                        <p className="py-10 text-center text-sm text-muted">
                                            {t.idioma.carregando}
                                        </p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                <Seletor
                                                    label={t.idioma.idioma}
                                                    value={configuracoesIdioma.idioma}
                                                    onChange={(valor) =>
                                                        setConfiguracoesIdioma((c) => ({ ...c, idioma: valor }))
                                                    }
                                                >
                                                    {/* nomes dos idiomas ficam no próprio idioma */}
                                                    <option value="pt-BR">Português (Brasil)</option>
                                                    <option value="en">English</option>
                                                    <option value="es">Español</option>
                                                </Seletor>

                                                <Seletor
                                                    label={t.idioma.moeda}
                                                    value={configuracoesIdioma.moeda}
                                                    onChange={(valor) =>
                                                        setConfiguracoesIdioma((c) => ({ ...c, moeda: valor }))
                                                    }
                                                >
                                                    <option value="BRL">{t.idioma.moedas.BRL}</option>
                                                    <option value="USD">{t.idioma.moedas.USD}</option>
                                                    <option value="EUR">{t.idioma.moedas.EUR}</option>
                                                </Seletor>

                                                <Seletor
                                                    label={t.idioma.regiao}
                                                    value={configuracoesIdioma.regiao}
                                                    onChange={(valor) =>
                                                        setConfiguracoesIdioma((c) => ({ ...c, regiao: valor }))
                                                    }
                                                >
                                                    <option value="BR">{t.idioma.regioes.BR}</option>
                                                    <option value="US">{t.idioma.regioes.US}</option>
                                                    <option value="PT">{t.idioma.regioes.PT}</option>
                                                    <option value="ES">{t.idioma.regioes.ES}</option>
                                                </Seletor>

                                                <Seletor
                                                    label={t.idioma.formatoData}
                                                    value={configuracoesIdioma.formatoData}
                                                    onChange={(valor) =>
                                                        setConfiguracoesIdioma((c) => ({ ...c, formatoData: valor }))
                                                    }
                                                >
                                                    {opcoesFormatoData.map((item) => (
                                                        <option key={item.valor} value={item.valor}>
                                                            {t.idioma.formatos[item.chave]}
                                                        </option>
                                                    ))}
                                                </Seletor>
                                            </div>

                                            <BarraSalvar
                                                mensagem={mensagemIdioma}
                                                onSalvar={salvarIdioma}
                                                desabilitado={!houveAlteracaoIdioma}
                                                salvando={salvandoIdioma}
                                                rotulo={t.idioma.salvar}
                                                rotuloSalvando={t.conta.salvando}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ───────── APARÊNCIA ───────── */}
                            {secaoAtiva === "aparencia" && (
                                <div className="space-y-5">
                                    <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7">
                                        <CabecalhoCartao
                                            icone={Moon}
                                            titulo="Tema da plataforma"
                                            descricao="Escolha como deseja visualizar o TripIA."
                                        />

                                        {carregandoAparencia ? (
                                            <p className="py-8 text-center text-sm text-muted">
                                                Carregando aparência...
                                            </p>
                                        ) : (
                                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <OpcaoSelecionavel
                                                    ativo={tema === "claro"}
                                                    onClick={() => setTema("claro")}
                                                    titulo="Claro"
                                                    descricao="Visualização clara e iluminada."
                                                />

                                                <OpcaoSelecionavel
                                                    ativo={tema === "escuro"}
                                                    onClick={() => setTema("escuro")}
                                                    titulo="Escuro"
                                                    descricao="Visualização com tons escuros."
                                                />

                                                <OpcaoSelecionavel
                                                    ativo={tema === "automatico"}
                                                    onClick={() => setTema("automatico")}
                                                    titulo="Automático"
                                                    descricao="Acompanha o tema do dispositivo."
                                                />
                                            </div>
                                        )}

                                        <BarraSalvar
                                            mensagem={mensagemAparencia}
                                            onSalvar={salvarAparencia}
                                            desabilitado={
                                                carregandoAparencia ||
                                                !houveAlteracaoAparencia
                                            }
                                            salvando={salvandoAparencia}
                                            rotulo="Salvar aparência"
                                            rotuloSalvando="Salvando..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ───────── PRIVACIDADE ───────── */}
                            {secaoAtiva === "privacidade" && (
                                <div className="space-y-4">

                                    {carregandoPrivacidade && (
                                        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
                                            Carregando informações de privacidade...
                                        </div>
                                    )}

                                    {erroPrivacidade && (
                                        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
                                            {erroPrivacidade}

                                            <button
                                                type="button"
                                                onClick={() => trocarSecao("privacidade")}
                                                className="ml-2 font-semibold underline"
                                            >
                                                Tentar novamente
                                            </button>
                                        </div>
                                    )}

                                    {!carregandoPrivacidade && dadosPrivacidade && (
                                        <>
                                            <div className="rounded-2xl border border-line bg-surface p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                        <LockKeyhole size={23} />
                                                    </div>

                                                    <div>
                                                        <h3 className="font-bold text-titulo">
                                                            Segurança da conta
                                                        </h3>
                                                        <p className="mt-1 text-sm text-muted">
                                                            Informações da sua conta autenticada.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 space-y-3">
                                                    <div className="rounded-xl bg-surface-alt p-4">
                                                        <p className="text-xs text-muted">E-mail cadastrado</p>
                                                        <p className="mt-1 break-all text-sm font-semibold text-titulo">
                                                            {dadosPrivacidade.conta.email || "Não informado"}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-surface-alt p-4">
                                                        <p className="text-xs text-muted">Verificação do e-mail</p>
                                                        <p className="mt-1 text-sm font-semibold text-titulo">
                                                            {dadosPrivacidade.conta.emailVerificado
                                                                ? "E-mail verificado"
                                                                : "E-mail não verificado"}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-surface-alt p-4">
                                                        <p className="text-xs text-muted">Criação da conta</p>
                                                        <p className="mt-1 text-sm font-semibold text-titulo">
                                                            {dadosPrivacidade.conta.dataCriacao
                                                                ? new Date(
                                                                    dadosPrivacidade.conta.dataCriacao
                                                                ).toLocaleDateString("pt-BR")
                                                                : "Não disponível"}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-surface-alt p-4">
                                                        <p className="text-xs text-muted">Último acesso</p>
                                                        <p className="mt-1 text-sm font-semibold text-titulo">
                                                            {dadosPrivacidade.conta.ultimoAcesso
                                                                ? new Date(
                                                                    dadosPrivacidade.conta.ultimoAcesso
                                                                ).toLocaleString("pt-BR")
                                                                : "Não disponível"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <CartaoInformativo
                                                titulo="Privacidade dos dados"
                                                descricao="As informações exibidas pertencem à sua conta autenticada. O TripIA utiliza autenticação para proteger o acesso aos seus dados."
                                                icone={ShieldCheck}
                                            />
                                        </>
                                    )}
                                </div>
                            )}



                            {/* ───────── SOBRE ───────── */}
                            {secaoAtiva === "sobre" && (
                                <div className="space-y-5">

                                    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
                                        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-destaque-suave blur-3xl opacity-70" />

                                        <div className="relative z-10">
                                            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#102A43] to-[#167D8D] text-white shadow-lg">
                                                    <Compass size={42} strokeWidth={1.5} />
                                                </div>

                                                <div>
                                                    <h3 className="text-3xl font-extrabold tracking-tight text-titulo">
                                                        TripIA
                                                    </h3>

                                                    <p className="mt-1 text-sm font-medium text-destaque">
                                                        {traducao.sidebar.slogan}
                                                    </p>

                                                    <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                                                        Uma plataforma inteligente para ajudar você a
                                                        descobrir destinos, organizar viagens e criar
                                                        roteiros personalizados com o apoio da inteligência
                                                        artificial.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                <Compass size={22} />
                                            </div>

                                            <p className="mt-4 text-sm text-muted">
                                                {t.sobre.plataforma}
                                            </p>

                                            <h4 className="mt-1 text-lg font-bold text-titulo">
                                                TripIA
                                            </h4>
                                        </div>

                                        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                <CalendarDays size={22} />
                                            </div>

                                            <p className="mt-4 text-sm text-muted">
                                                {t.sobre.ano}
                                            </p>

                                            <h4 className="mt-1 text-lg font-bold text-titulo">
                                                2026
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destaque-suave text-destaque">
                                                <Sparkles size={22} />
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-titulo">
                                                    Sobre o projeto
                                                </h4>
                                                <p className="text-sm text-muted">
                                                    Conheça a proposta do TripIA.
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm leading-7 text-muted">
                                            {t.sobre.projetoValor}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-alt p-4 text-xs text-muted">
                                        <ShieldCheck size={16} className="text-destaque" />
                                        TripIA © 2026 — {traducao.sidebar.slogan}
                                    </div>

                                </div>
                            )}


                            {/* RODAPÉ */}
                            <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted">
                                <CircleHelp size={15} />
                                <span>TripIA — {traducao.sidebar.slogan}</span>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            {confirmandoExclusao && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                >
                    <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <TriangleAlert size={24} />
                        </div>

                        <h3 className="mt-4 text-xl font-extrabold text-titulo">
                            {t.conta.modalTitulo}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-muted">
                            {t.conta.modalTexto}
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmandoExclusao(false)}
                                disabled={excluindo}
                                className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-muted hover:bg-surface-alt disabled:opacity-60"
                            >
                                {t.conta.cancelar}
                            </button>

                            <button
                                type="button"
                                onClick={excluirConta}
                                disabled={excluindo}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {excluindo ? t.conta.excluindo : t.conta.confirmarExclusao}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
