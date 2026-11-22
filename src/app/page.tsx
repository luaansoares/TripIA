
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import {
  ArrowRight,
  Compass,
  Sparkles,
  Route,
  Globe2,
  CalendarDays,
  Search,
  ShieldCheck,
  ChevronRight,
  LoaderCircle,
  MapPin,
  X,
} from "lucide-react";

interface Atracao {
  xid: string;
  name: string;
  dist: number;
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

const destinos = [
  {
    nome: "Rio de Janeiro",
    pais: "Brasil",
    categoria: "Praias e natureza",
    imagem:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=900",
  },
  {
    nome: "Paris",
    pais: "França",
    categoria: "História e cultura",
    imagem:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900",
  },
  {
    nome: "Fernando de Noronha",
    pais: "Brasil",
    categoria: "Paraísos naturais",
    imagem:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=900",
  },
];

const atalhos = [
  {
    titulo: "Explorar destinos",
    descricao: "Descubra lugares incríveis",
    icon: Globe2,
    href: "/explorar",
    cor: "bg-cyan-50 text-cyan-700",
  },
  {
    titulo: "Planejar viagem",
    descricao: "Crie seu roteiro com IA",
    icon: Route,
    href: "/roteiros",
    cor: "bg-violet-50 text-violet-700",
  },
  {
    titulo: "Inspiração",
    descricao: "Encontre sua próxima aventura",
    icon: Compass,
    href: "/explorar",
    cor: "bg-amber-50 text-amber-700",
  },
];

export default function Home() {
  const [pesquisa, setPesquisa] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("viajante");
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function buscarUsuario() {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const nome = user.user_metadata?.nome_exibicao;

            if (nome) {
                setNomeUsuario(nome);
            }
        }
    }

    buscarUsuario();
}, []);

  async function buscarDestino(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const termo = pesquisa.trim();

    if (!termo) {
      setErro("Digite o nome de uma cidade ou destino.");
      return;
    }

    setCarregando(true);
    setErro("");
    setResultado(null);

    try {
      const resposta = await fetch(
        `/api/destinos?destino=${encodeURIComponent(termo)}`
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || dados.error || "Não foi possível encontrar esse destino."
        );
      }

      if (!dados.atracoes || dados.atracoes.length === 0) {
        throw new Error("Nenhuma atração encontrada para esse destino.");
      }

      setResultado(dados);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao pesquisar o destino."
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarDistancia(distancia: number) {
    if (distancia >= 1000) {
      return `${(distancia / 1000).toFixed(1)} km`;
    }

    return `${Math.round(distancia)} m`;
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
    <Sidebar />

      <main className="relative z-0 ml-0 min-h-screen min-w-0 p-4 pt-20 md:p-8 lg:ml-[264px] lg:pt-8">
    <div className="mx-auto w-full max-w-[1500px]">

          {/* CABEÇALHO */}
          <header className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#167D8D]">
                BEM-VINDO AO TRIPIA
              </p>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102A43] md:text-3xl">
                Olá, {nomeUsuario}! Sua próxima aventura começa aqui.
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Explore o mundo. Planeje experiências. Viaje melhor.
              </p>
            </div>

            <Link
              href="/roteiros"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#102A43] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
            >
              <CalendarDays size={17} />
              Planejar viagem
            </Link>
          </header>

          {/* BUSCA DE DESTINOS */}
          <section className="mb-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#167D8D]">
                EXPLORE O MUNDO
              </p>

              <h2 className="mt-2 text-xl font-extrabold text-[#102A43]">
                Para onde deseja ir?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pesquise uma cidade e descubra atrações para conhecer.
              </p>
            </div>

            <form
              onSubmit={buscarDestino}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <MapPin
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#167D8D]"
                />

                <input
                  type="text"
                  value={pesquisa}
                  onChange={(event) => setPesquisa(event.target.value)}
                  placeholder="Ex.: Paris, Rio de Janeiro, Fortaleza..."
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-[#102A43] outline-none transition placeholder:text-slate-400 focus:border-[#38BFC1] focus:bg-white focus:ring-2 focus:ring-[#38BFC1]/20 sm:py-4"
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#167D8D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Pesquisando...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Pesquisar
                  </>
                )}
              </button>
            </form>

            {erro && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <X size={18} className="mt-0.5 shrink-0" />
                {erro}
              </div>
            )}

            {resultado && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#167D8D]">
                      RESULTADO DA PESQUISA
                    </p>

                    <h3 className="mt-1 text-xl font-extrabold text-[#102A43]">
                      {resultado.destino.nome}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {resultado.destino.pais} · {resultado.total} atrações encontradas
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResultado(null);
                      setPesquisa("");
                      setErro("");
                    }}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#102A43]"
                  >
                    Limpar pesquisa
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {resultado.atracoes.map((atracao) => {
                    const imagem =
                      atracao.imagemAlternativa?.url ||
                      atracao.preview?.source;

                    return (
                      <article
                        key={atracao.xid}
                        className="overflow-hidden rounded-xl border border-slate-100 bg-white"
                      >
                        {imagem ? (
                          <img
                            src={imagem}
                            alt={atracao.name}
                            className="h-40 w-full object-cover sm:h-44"
                          />
                        ) : (
                          <div className="relative flex h-44 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#102A43] via-[#167D8D] to-[#38BFC1]">
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
                            <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full border border-white/10" />

                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                              <MapPin size={30} />
                            </div>

                            <p className="relative mt-3 text-xs font-semibold tracking-wide text-white/90">
                              TRIPIA · DESTINO
                            </p>
                            <span className="relative mt-1 text-[10px] text-white/60">
                              Imagem indisponível
                            </span>
                          </div>
                        )}

                        <div className="p-4">
                          <h4 className="font-bold text-[#102A43]">
                            {atracao.name}
                          </h4>

                          <p className="mt-2 text-xs text-slate-500">
                            Distância: {formatarDistancia(atracao.dist)}
                          </p>

                          {atracao.imagemAlternativa?.autor && (
                            <p className="mt-2 text-[10px] text-slate-400">
                              Foto: {atracao.imagemAlternativa.autor}
                            </p>
                          )}

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${atracao.point.lat},${atracao.point.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#167D8D] hover:text-[#102A43]"
                          >
                            Ver localização
                            <ArrowRight size={14} />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* BANNER PRINCIPAL */}
          <section className="relative isolate overflow-hidden rounded-[28px] bg-[#102A43] shadow-xl">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1800')",
              }}
            />

            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102A43]/95 via-[#102A43]/75 to-[#102A43]/20" />

            <div className="relative flex min-h-[340px] flex-col justify-center px-5 py-8 sm:min-h-[360px] sm:px-7 sm:py-10 md:min-h-[410px] md:px-12">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                <Sparkles size={15} className="text-[#65E0D9]" />
                SUA VIAGEM, COM INTELIGÊNCIA ARTIFICIAL
              </div>

              <h2 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-5xl">
                O mundo é grande.
                <br />
                <span className="text-[#65E0D9]">
                  Sua aventura também pode ser.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">
                Descubra destinos, encontre experiências e crie roteiros
                personalizados com a inteligência artificial do TripIA.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/roteiros"
                  className="flex items-center gap-3 rounded-xl bg-[#38BFC1] px-6 py-4 text-sm font-bold text-[#102A43] shadow-lg transition hover:-translate-y-1 hover:bg-[#65E0D9]"
                >
                  <Sparkles size={18} />
                  Criar roteiro com IA
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/explorar"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Explorar destinos
                </Link>
              </div>
            </div>
          </section>

          {/* ATALHOS */}
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-[#102A43]">
                O que deseja fazer?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Comece a organizar sua próxima experiência.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
              {atalhos.map((atalho) => {
                const Icon = atalho.icon;

                return (
                  <Link
                    key={atalho.titulo}
                    href={atalho.href}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#BCE8E7] hover:shadow-lg sm:gap-4 sm:p-5"
                  >
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${atalho.cor}`}
                    >
                      <Icon size={25} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#102A43]">
                        {atalho.titulo}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {atalho.descricao}
                      </p>
                    </div>

                    <ChevronRight
                      size={19}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#167D8D]"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          
{/* DESTINOS EM DESTAQUE */}
<section className="mt-12">
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#167D8D]">
        DESCUBRA O MUNDO
      </p>

      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102A43]">
        Destinos para se inspirar
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Lugares que podem transformar sua próxima viagem.
      </p>
    </div>

    <Link
      href="/explorar"
      className="group flex items-center gap-2 rounded-xl border border-[#BCE8E7] bg-white px-4 py-3 text-sm font-bold text-[#167D8D] transition hover:border-[#167D8D] hover:bg-[#E6F7F7]"
    >
      Explorar todos
      <ArrowRight
        size={17}
        className="transition group-hover:translate-x-1"
      />
    </Link>
  </div>

  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-3">
    {destinos.map((destino, index) => (
      <Link
        href="/explorar"
        key={destino.nome}
        aria-label={`Explorar ${destino.nome}`}
        className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative h-52 overflow-hidden sm:h-64">
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url('${destino.imagem}')`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/90 via-[#102A43]/20 to-transparent" />

          <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-[#102A43]/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            DESTINO EM DESTAQUE
          </span>

          <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition group-hover:bg-[#38BFC1] group-hover:text-[#102A43]">
            <ArrowRight size={19} />
          </span>

          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/80">
              <MapPin size={14} />
              {destino.pais}
            </div>

            <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {destino.nome}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs font-semibold text-[#167D8D]">
              {destino.categoria}
            </p>

            <p className="mt-1 text-sm font-bold text-[#102A43]">
              Descubra este destino
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D] transition group-hover:bg-[#102A43] group-hover:text-white">
            <ArrowRight size={18} />
          </div>
        </div>
      </Link>
    ))}
  </div>
</section>


          
{/* ÁREA DE INTELIGÊNCIA ARTIFICIAL */}
<section className="relative mb-8 mt-12 overflow-hidden rounded-[28px] bg-[#102A43] shadow-xl">

  {/* Elementos decorativos */}
  <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
  <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border border-white/10" />
  <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#167D8D]/20 blur-3xl" />

  <div className="relative flex flex-col justify-between gap-6 p-5 sm:gap-8 sm:p-7 md:flex-row md:items-center md:p-10">

    <div className="max-w-2xl">

      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#65E0D9]/30 bg-[#65E0D9]/10 px-4 py-2">
        <Sparkles size={15} className="text-[#65E0D9]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#65E0D9]">
          INTELIGÊNCIA ARTIFICIAL TRIPIA
        </span>
      </div>

      <h2 className="text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
        Sua próxima viagem merece um planejamento extraordinário.
      </h2>

      <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">
        Conte com a inteligência artificial para organizar suas ideias,
        descobrir experiências e criar roteiros personalizados para sua
        próxima aventura.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/80">
          ✦ Roteiros personalizados
        </span>

        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/80">
          ✦ Planejamento inteligente
        </span>

        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/80">
          ✦ Suas preferências
        </span>
      </div>
    </div>

    <div className="flex shrink-0 flex-col gap-3 md:items-end">

      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#65E0D9]/30 bg-[#167D8D]/30 shadow-lg">
        <Sparkles size={38} className="text-[#65E0D9]" />
      </div>

      <Link
        href="/roteiros"
        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#38BFC1] px-5 py-4 text-sm font-extrabold text-[#102A43] shadow-lg transition hover:-translate-y-1 hover:bg-[#65E0D9] sm:w-auto"
      >
        Criar meu roteiro com IA
        <ArrowRight
          size={18}
          className="transition group-hover:translate-x-1"
        />
      </Link>

      <p className="text-center text-xs text-white/50">
        Seu próximo destino começa com uma ideia.
      </p>
    </div>
  </div>
</section>

          {/* RODAPÉ */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-400">
            <p>TripIA © 2026 — Planeje. Explore. Viaje.</p>

            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#167D8D]" />
              Sua próxima aventura começa aqui.
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
