"use client";

import { useEffect, useMemo, useState } from "react";

import {

    MapContainer,

    TileLayer,

    Marker,

    Popup,

    Polyline,

    useMap,

} from "react-leaflet";

import { divIcon, type DivIcon } from "leaflet";

import "leaflet/dist/leaflet.css";

import { MapPin, Compass, Route, Clock } from "lucide-react";

type Local = {

    nome: string;

    endereco?: string;

    enderecoEncontrado?: string;

    latitude: number;

    longitude: number;

    tipo?: string;

    dia?: number;

    periodo?: string;

};

type ResultadoRota = {

    sucesso: boolean;

    locais: Local[];

    geometria: [number, number][];

    distancia: number;

    duracao: number;

};

type Props = {

    locais: Local[];

    transporte: string;

    diaSelecionado?: number;

    onDistanciaCalculada?: (distanciaKm: number | null) => void;

    onDistanciasPorDiaCalculadas?: (distancias: DistanciaDia[]) => void;

    locaisPorDia?: {

        dia: number;

        locais: Local[];

    }[];

};

type DistanciaDia = {

    dia: number;

    distanciaKm: number;

};

// Cache de ícones: evita recriar um divIcon novo a cada render.

const cacheIcones = new Map<number, DivIcon>();

function criarIcone(numero: number): DivIcon {

    const existente = cacheIcones.get(numero);

    if (existente) return existente;

    const icone = divIcon({

        className: "",

        html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#167D8D;color:white;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:14px;font-weight:800;">${numero}</div>`,

        iconSize: [36, 36],

        iconAnchor: [18, 18],

        popupAnchor: [0, -18],

    });

    cacheIcones.set(numero, icone);

    return icone;

}

// Aceita número, texto "-3.71" ou "-3,71". Vazio/nulo vira NaN (inválido).*

function paraNumero(valor: unknown): number {

    if (typeof valor === "number") return valor;

    if (typeof valor === "string" && valor.trim() !== "") {

        return Number(valor.trim().replace(",", "."));

    }

    return NaN;

}

function coordenadasValidas(local: Local) {

    return (

        local.latitude !== null &&

        local.longitude !== null &&

        Number.isFinite(Number(local.latitude)) &&

        Number.isFinite(Number(local.longitude))

    );

}

function AjustarMapa({ pontos }: { pontos: [number, number][] }) {

    const mapa = useMap();

    useEffect(() => {

        if (pontos.length === 0) return;

        let ativo = true;

        const frame = requestAnimationFrame(() => {

            // Não mexe no mapa se ele foi removido antes do frame rodar.

            if (!ativo || !mapa.getContainer()?.isConnected) return;

            try {

                mapa.invalidateSize({ pan: false, animate: false });

                if (pontos.length === 1) {

                    mapa.setView(pontos[0], 14, { animate: false });

                } else {

                    mapa.fitBounds(pontos, {

                        padding: [40, 40],

                        animate: false,

                    });

                }

            } catch {

                /* mapa já removido */

            }

        });

        return () => {

            ativo = false;

            cancelAnimationFrame(frame);

            // Interrompe qualquer animação em andamento antes de desmontar.

            try {

                mapa.stop();

            } catch {

                /* mapa já removido */

            }

        };

    }, [mapa, pontos]);

    return null;

}

function CabecalhoVazio({

    diaSelecionado,

    mensagem,

    detalhes,

}: {

    diaSelecionado?: number;

    mensagem: string;

    detalhes?: string[];

}) {

    return (

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7] text-[#167D8D]">

                    <MapPin size={23} />

                </div>

                <div>

                    <h2 className="text-xl font-extrabold text-[#102A43]">

                        {diaSelecionado === undefined

                            ? "Mapa do seu roteiro"

                            : `Mapa do Dia ${diaSelecionado}`}

                    </h2>

                    <p className="text-sm text-slate-500">

                        {diaSelecionado === undefined

                            ? "Locais e trajeto completo da viagem."

                            : "Somente os locais programados para este dia."}

                    </p>

                </div>

            </div>

            <div className="mt-6 rounded-2xl bg-[#F0F7FA] p-6 text-center">

                <p className="mt-3 font-medium text-[#102A43]">{mensagem}</p>

                {detalhes && detalhes.length > 0 && (

                    <ul className="mt-3 space-y-1 text-left text-xs text-slate-500">

                        {detalhes.map((linha, i) => (

                            <li key={i}>• {linha}</li>

                        ))}

                    </ul>

                )}

            </div>

        </section>

    );

}

export default function MapaRoteiro({

    locais,

    transporte,

    diaSelecionado,

    onDistanciaCalculada,

    onDistanciasPorDiaCalculadas,

    locaisPorDia,

}: Props) {

    // Sem diaSelecionado, o mapa representa a viagem inteira.*

    // Com diaSelecionado, representa exclusivamente aquele dia.

    const locaisNormalizados = useMemo(

        () =>

            locais.map((local) => ({

                ...local,

                latitude: paraNumero(local.latitude),

                longitude: paraNumero(local.longitude),

            })),

        [locais]

    );

    const locaisDoMapa = useMemo(

        () =>

            diaSelecionado === undefined

                ? locaisNormalizados

                : locaisNormalizados.filter(

                    (local) => Number(local.dia) === Number(diaSelecionado)

                ),

        [locaisNormalizados, diaSelecionado]

    );

    const locaisValidos = useMemo(

        () => locaisDoMapa.filter(coordenadasValidas),

        [locaisDoMapa]

    );

    // Só cria o mapa depois de montado no navegador. Evita que o Strict Mode.

    // (monta/desmonta/monta) crie dois mapas no mesmo container.

    const [montado, setMontado] = useState(false);

    useEffect(() => {

        setMontado(true);

        return () => setMontado(false);

    }, []);

    const [resultado, setResultado] = useState<ResultadoRota | null>(null);

    const [carregando, setCarregando] = useState(false);

    const [erro, setErro] = useState("");

    useEffect(() => {
        const distanciaKm =
            resultado?.sucesso && Number.isFinite(resultado.distancia)
                ? resultado.distancia / 1000
                : null;

        onDistanciaCalculada?.(distanciaKm);
    }, [resultado, onDistanciaCalculada]);

    useEffect(() => {
        let ativo = true;

        async function calcularDistanciasDiarias() {
            if (!locaisPorDia || locaisPorDia.length === 0) {
                onDistanciasPorDiaCalculadas?.([]);
                return;
            }

            try {
                const resultados = await Promise.all(
                    locaisPorDia.map(async (dia) => {
                        const locaisValidosDoDia = dia.locais
                            .map((local) => ({
                                ...local,
                                latitude: paraNumero(local.latitude),
                                longitude: paraNumero(local.longitude),
                            }))
                            .filter(coordenadasValidas);

                        if (locaisValidosDoDia.length < 2) {
                            return { dia: dia.dia, distanciaKm: 0 };
                        }

                        const resposta = await fetch("/api/rota", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                locais: locaisValidosDoDia,
                                transporte,
                            }),
                        });

                        const dados = await resposta.json();

                        if (
                            !resposta.ok ||
                            !dados.sucesso ||
                            !Number.isFinite(Number(dados.distancia))
                        ) {
                            throw new Error(
                                `Não foi possível calcular a rota do Dia ${dia.dia}.`
                            );
                        }

                        return {
                            dia: dia.dia,
                            distanciaKm: Number(dados.distancia) / 1000,
                        };
                    })
                );

                if (ativo) {
                    onDistanciasPorDiaCalculadas?.(
                        resultados.sort((a, b) => a.dia - b.dia)
                    );
                }
            } catch (error) {
                if (ativo) {
                    console.error("Erro ao calcular distâncias diárias:", error);
                    onDistanciasPorDiaCalculadas?.([]);
                }
            }
        }

        calcularDistanciasDiarias();

        return () => {
            ativo = false;
        };
    }, [locaisPorDia, transporte, onDistanciasPorDiaCalculadas]);

    useEffect(() => {
        let ativo = true;

        async function calcularRota() {
            setResultado(null);
            setErro("");

            if (locaisValidos.length < 2) {
                setCarregando(false);
                return;
            }

            setCarregando(true);

            try {
                const resposta = await fetch("/api/rota", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locais: locaisValidos, transporte }),
                });

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível calcular a rota."
                    );
                }

                if (ativo) setResultado(dados);
            } catch (error) {
                if (ativo) {
                    setErro(
                        error instanceof Error
                            ? error.message
                            : "Erro ao calcular a rota."
                    );
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        calcularRota();

        return () => {
            ativo = false;
        };
    }, [locaisValidos, transporte]);

    const pontosRota = useMemo<[number, number][]>(

        () =>

            (resultado?.geometria || [])

                .filter(

                    (ponto): ponto is [number, number] =>

                        Array.isArray(ponto) &&

                        ponto.length >= 2 &&

                        ponto[0] !== null &&

                        ponto[1] !== null &&

                        Number.isFinite(Number(ponto[0])) &&

                        Number.isFinite(Number(ponto[1]))

                )

                .map((ponto) => [Number(ponto[0]), Number(ponto[1])]),

        [resultado?.geometria]

    );

    const locaisExibidos = useMemo(

        () =>

            (resultado?.locais?.length ? resultado.locais : locaisValidos).filter(

                coordenadasValidas

            ),

        [resultado, locaisValidos]

    );

    const pontosAjuste = useMemo<[number, number][]>(

        () =>

            pontosRota.length > 1

                ? pontosRota

                : locaisValidos.map(

                    (local) =>

                        [Number(local.latitude), Number(local.longitude)] as [

                            number,

                            number

                        ]

                ),

        [pontosRota, locaisValidos]

    );

    // ---- Retornos antecipados (todos os hooks já foram chamados acima).

    if (locaisDoMapa.length === 0) {

        return (

            <CabecalhoVazio

                diaSelecionado={diaSelecionado}

                mensagem={

                    diaSelecionado === undefined

                        ? "Ainda não há locais para mostrar no mapa."

                        : `Não há locais cadastrados para o Dia ${diaSelecionado}.`

                }

            />

        );

    }

    if (locaisValidos.length === 0) {

        return (

            <CabecalhoVazio

                diaSelecionado={diaSelecionado}

                mensagem="Não há coordenadas válidas para exibir estes locais."

                detalhes={locaisDoMapa.map(

                    (l) =>

                        `${l.nome} (latitude: ${String(l.latitude)}, longitude: ${String(l.longitude)})`

                )}

            />

        );

    }

    const centro: [number, number] = [

        Number(locaisValidos[0].latitude),

        Number(locaisValidos[0].longitude),

    ];

    return (

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-4">

                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F7F7] text-[#167D8D]">

                        <MapPin size={23} />

                    </div>

                    <div className="min-w-0 flex-1">

                        <h2 className="text-lg font-extrabold text-[#102A43]">

                            {diaSelecionado === undefined

                                ? "Mapa da viagem"

                                : `Mapa do Dia ${diaSelecionado}`}

                        </h2>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">

                            {diaSelecionado === undefined

                                ? "Locais e trajeto completo da viagem."

                                : "Paradas programadas para este dia."}

                        </p>

                    </div>

                </div>

                <div className="mt-3">

                    <span className="inline-flex items-center gap-2 rounded-full bg-[#E6F7F7] px-3 py-1.5 text-xs font-bold text-[#167D8D]">

                        <Compass size={15} />

                        {transporte}

                    </span>

                </div>

                {carregando && (

                    <p className="mt-3 text-xs font-medium text-[#167D8D]">

                        Calculando a rota...

                    </p>

                )}

                {erro && (

                    <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-600">

                        {erro}

                    </p>

                )}

                {resultado && (

                    <div className="mt-3 grid grid-cols-2 gap-2">

                        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#F0F7FA] p-3">

                            <Route size={19} className="shrink-0 text-[#167D8D]" />

                            <div className="min-w-0">

                                <p className="text-[10px] text-slate-500">

                                    Distância

                                </p>

                                <p className="text-base font-extrabold text-[#102A43]">

                                    {(resultado.distancia / 1000).toFixed(1)} km

                                </p>

                            </div>

                        </div>

                        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#F0F7FA] p-3">

                            <Clock size={19} className="shrink-0 text-[#167D8D]" />

                            <div className="min-w-0">

                                <p className="text-[10px] text-slate-500">

                                    Tempo estimado

                                </p>

                                <p className="text-base font-extrabold text-[#102A43]">

                                    {Math.round(resultado.duracao / 60)} min

                                </p>

                            </div>

                        </div>

                    </div>

                )}

            </div>

            <div

                className="relative w-full"

                style={{ height: "360px", minHeight: "360px" }}

            >

                {montado ? (

                <MapContainer

                    key={`leaflet-${diaSelecionado ?? "todos"}`}

                    center={centro}

                    zoom={locaisValidos.length === 1 ? 14 : 12}

                    scrollWheelZoom

                    zoomAnimation={false}

                    fadeAnimation={false}

                    markerZoomAnimation={false}

                    className="h-full w-full"

                    style={{ height: "100%", width: "100%" }}

                >

                    <TileLayer

                        attribution="© OpenStreetMap"

                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                    />

                    {pontosRota.length > 1 && (

                        <Polyline

                            positions={pontosRota}

                            pathOptions={{

                                color: "#167D8D",

                                weight: 5,

                                opacity: 0.85,

                            }}

                        />

                    )}

                    <AjustarMapa pontos={pontosAjuste} />

                    {locaisExibidos.map((local, index) => (

                        <Marker

                            key={`${local.nome}-${index}`}

                            position={[

                                Number(local.latitude),

                                Number(local.longitude),

                            ]}

                            icon={criarIcone(index + 1)}

                        >

                            <Popup>

                                <strong>

                                    {index + 1}. {local.nome}

                                </strong>

                                <br />

                                {local.enderecoEncontrado ||

                                    local.endereco ||

                                    "Endereço não informado"}

                            </Popup>

                        </Marker>

                    ))}

                </MapContainer>

                ) : (

                    <div className="flex h-full w-full items-center justify-center bg-[#F0F7FA] text-sm text-slate-500">

                        A carregar mapa...

                    </div>

                )}

            </div>

            <div className="border-t border-slate-100 p-6 md:p-8">

                <h3 className="mb-4 font-bold text-[#102A43]">

                    Locais{" "}

                    {diaSelecionado === undefined

                        ? "da viagem"

                        : `do Dia ${diaSelecionado}`}

                </h3>

                <div className="space-y-3">

                    {locaisExibidos.map((local, index) => (

                        <div

                            key={`${local.nome}-${index}`}

                            className="flex items-start gap-3"

                        >

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6F7F7] text-sm font-bold text-[#167D8D]">

                                {index + 1}

                            </span>

                            <div className="min-w-0">

                                <p className="font-semibold text-[#102A43]">

                                    {local.nome}

                                </p>

                                <p className="text-sm text-slate-500">

                                    {local.enderecoEncontrado ||

                                        local.endereco ||

                                        "Endereço não informado"}

                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </section>

    );

}
