
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

import { divIcon } from "leaflet";

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
};



function AjustarMapa({
    pontos,
}: {
    pontos: [number, number][];
}) {
    const mapa = useMap();

    useEffect(() => {
        if (pontos.length < 2) return;

        const frame = requestAnimationFrame(() => {
            mapa.invalidateSize({ pan: false });

            mapa.fitBounds(pontos, {
                padding: [40, 40],
            });
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [mapa, pontos]);

    return null;
}


export default function MapaRoteiro({ locais, transporte }: Props) {
    const [resultado, setResultado] = useState<ResultadoRota | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;

        async function calcularRota() {
            const validos = locais.filter(
                (local) =>
                    Number.isFinite(Number(local.latitude)) &&
                    Number.isFinite(Number(local.longitude))
            );

            setResultado(null);
            setErro("");

            if (validos.length < 2) {
                setCarregando(false);
                return;
            }

            setCarregando(true);

            try {
                const resposta = await fetch("/api/rota", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        locais: validos,
                        transporte,
                    }),
                });

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível calcular a rota."
                    );
                }

                if (ativo) {
                    setResultado(dados);
                }
            } catch (error) {
                if (ativo) {
                    setErro(
                        error instanceof Error
                            ? error.message
                            : "Erro ao calcular a rota."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        calcularRota();

        return () => {
            ativo = false;
        };
    }, [locais, transporte]);

    
    const locaisValidos = locais.filter(
        (local) =>
            Number.isFinite(Number(local.latitude)) &&
            Number.isFinite(Number(local.longitude))
    );

    const pontosRota = useMemo<[number, number][]>(
        () => {
            return (resultado?.geometria || [])
                .filter(
                    (ponto): ponto is [number, number] =>
                        Array.isArray(ponto) &&
                        ponto.length >= 2 &&
                        ponto[0] !== null &&
                        ponto[1] !== null &&
                        Number.isFinite(Number(ponto[0])) &&
                        Number.isFinite(Number(ponto[1]))
                )
                .map((ponto) => [
                    Number(ponto[0]),
                    Number(ponto[1]),
                ]);
        },
        [resultado?.geometria]
    );

    if (locais.length < 2) return null;

    if (locaisValidos.length < 2) {
        return (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-[#102A43]">
                    Mapa do roteiro
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Não há coordenadas suficientes para desenhar a rota.
                </p>
            </section>
        );
    }

    const locaisExibidos = resultado?.locais || locaisValidos;

    const centro: [number, number] = [
        locaisValidos[0].latitude,
        locaisValidos[0].longitude,
    ];


    return (
        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-extrabold text-[#102A43]">
                            Mapa do seu roteiro
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Visualize os locais e o trajeto da viagem.
                        </p>
                    </div>

                    <span className="rounded-full bg-[#E6F7F7] px-4 py-2 text-sm font-semibold text-[#167D8D]">
                        {transporte}
                    </span>
                </div>

                {carregando && (
                    <p className="mt-4 text-sm text-[#167D8D]">
                        Calculando a melhor ordem dos locais...
                    </p>
                )}

                {erro && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                        {erro}
                    </p>
                )}

                {resultado && (
                    <div className="mt-5 flex flex-wrap gap-3">
                        <div className="rounded-xl bg-[#F0F7FA] px-4 py-3">
                            <p className="text-xs text-slate-500">
                                Distância aproximada
                            </p>
                            <p className="font-bold text-[#102A43]">
                                {(resultado.distancia / 1000).toFixed(1)} km
                            </p>
                        </div>

                        <div className="rounded-xl bg-[#F0F7FA] px-4 py-3">
                            <p className="text-xs text-slate-500">
                                Tempo estimado
                            </p>
                            <p className="font-bold text-[#102A43]">
                                {Math.round(resultado.duracao / 60)} minutos
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div
    className="relative w-full"
    style={{ height: "450px", minHeight: "450px" }}
>
                <MapContainer
                    center={centro}
                    zoom={12}
                    scrollWheelZoom
                    className="h-full w-full"
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {pontosRota.length > 1 && (
                        <>
                            <Polyline
                                positions={pontosRota}
                                pathOptions={{
                                    color: "#167D8D",
                                    weight: 5,
                                    opacity: 0.85,
                                }}
                            />
                            <AjustarMapa pontos={pontosRota} />
                        </>
                    )}

                    
{locaisExibidos.map((local, index) => (
    <Marker
        key={`${local.nome}-${index}`}
        position={[
            local.latitude,
            local.longitude,
        ]}
        icon={divIcon({
            className: "",
            html: `
                <div style="
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #167D8D;
                    color: white;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                    font-size: 14px;
                    font-weight: 800;
                ">
                    ${index + 1}
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18],
        })}
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
            </div>

            <div className="border-t border-slate-100 p-5">
                <h3 className="mb-3 font-bold text-[#102A43]">
                    Locais do roteiro
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

                            <div>
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
