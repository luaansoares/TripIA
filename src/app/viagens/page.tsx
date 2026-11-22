
"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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
    status: "planejada" | "em_andamento" | "concluida";
};

export default function ViagensPage() {
    const [viagens, setViagens] = useState<Viagem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

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

    return (
        <div className="min-h-screen bg-[#F4F7FA]">
            <Sidebar />

            <main className="ml-0 min-h-screen p-4 pt-20 md:p-6 lg:ml-[264px]">
                <div className="mx-auto max-w-7xl">

                    <header className="mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F7] text-[#167D8D]">
                                <BriefcaseBusiness size={25} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-extrabold text-[#102A43] md:text-3xl">
                                    Minhas Viagens
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Organize e acompanhe suas aventuras.
                                </p>
                            </div>
                        </div>
                    </header>

                    {carregando && (
                        <div className="flex items-center justify-center rounded-3xl bg-white p-12">
                            <LoaderCircle className="animate-spin text-[#167D8D]" size={28} />
                            <span className="ml-3 text-sm text-slate-500">
                                Carregando suas viagens...
                            </span>
                        </div>
                    )}

                    {erro && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                            {erro}
                        </div>
                    )}

                    {!carregando && !erro && (
                        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                            <h2 className="text-lg font-bold text-[#102A43]">
                                Suas viagens salvas
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Você tem {viagens.length}{" "}
                                {viagens.length === 1 ? "viagem salva" : "viagens salvas"}.
                            </p>

                            {viagens.length === 0 ? (
                                <p className="mt-6 text-sm text-slate-500">
                                    Você ainda não salvou nenhuma viagem.
                                </p>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    {viagens.map((viagem) => (
                                        <article
                                            key={viagem.id}
                                            className="rounded-2xl border border-slate-200 p-5"
                                        >
                                            <h3 className="font-bold text-[#102A43]">
                                                {viagem.titulo}
                                            </h3>

                                            <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                                                <p className="flex items-center gap-2">
                                                    <MapPin size={16} />
                                                    {viagem.origem} → {viagem.destino}
                                                </p>

                                                <p className="flex items-center gap-2">
                                                    <CalendarDays size={16} />
                                                    {new Date(`${viagem.data_ida}T12:00:00`).toLocaleDateString("pt-BR")}
                                                    {" até "}
                                                    {new Date(`${viagem.data_volta}T12:00:00`).toLocaleDateString("pt-BR")}
                                                </p>

                                                <p className="flex items-center gap-2">
                                                    <Users size={16} />
                                                    {viagem.viajantes} viajantes
                                                </p>

                                                <p className="flex items-center gap-2">
                                                    {viagem.transporte === "Moto" ? (
                                                        <Bike size={16} />
                                                    ) : viagem.transporte === "Ônibus" ? (
                                                        <Bus size={16} />
                                                    ) : viagem.transporte === "Avião" ? (
                                                        <Plane size={16} />
                                                    ) : (
                                                        <Car size={16} />
                                                    )}
                                                    {viagem.transporte}
                                                </p>
                                            </div>

                                            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#167D8D]">
                                                {viagem.status.replace("_", " ")}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
}
