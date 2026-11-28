
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useIdioma } from "@/contexts/IdiomaContext";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import {
    House,
    Compass,
    Map,
    MapPin,
    Settings,
    Sparkles,
    Navigation,
    Menu,
    X,
    BriefcaseBusiness,
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [saindo, setSaindo] = useState(false);

    async function sairDaConta() {
    if (saindo) return;

    setSaindo(true);

    try {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.href = "/login";
    } catch (error) {
        console.error("Erro ao sair da conta:", error);
        setSaindo(false);
    }
}
    const [menuAberto, setMenuAberto] = useState(false);

    const { traducao } = useIdioma();

    const menuItems = [
        {
            name: traducao.navigation.home,
            href: "/",
            icon: House,
        },
        {
            name: traducao.navigation.explore,
            href: "/explorar",
            icon: Compass,
        },
        {
            name: traducao.navigation.plan,
            href: "/roteiros",
            icon: Map,
        },
        {
            name: traducao.navigation.map,
            href: "/mapa",
            icon: MapPin,
        },
        {
            name: traducao.navigation.trips,
            href: "/viagens",
            icon: BriefcaseBusiness,
        },



    ];

    return (
        <>
            {/* Botão do menu mobile */}
            <button
                type="button"
                onClick={() => setMenuAberto(!menuAberto)}
                aria-label={
                    menuAberto
                        ? traducao.navigation.closeMenu
                        : traducao.navigation.openMenu
                }
                className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-[#102A43] text-white shadow-lg lg:hidden"
            >
                {menuAberto ? (
                    <X size={24} />
                ) : (
                    <Menu size={24} />
                )}
            </button>

            {/* Fundo escuro do menu mobile */}
            {menuAberto && (
                <button
                    type="button"
                    aria-label={traducao.navigation.closeMenu}
                    onClick={() => setMenuAberto(false)}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-[264px] shrink-0 flex-col overflow-y-auto bg-[#102A43] px-5 py-4 text-white transition-transform duration-300 lg:translate-x-0 ${menuAberto
                    ? "translate-x-0"
                    : "-translate-x-full"
                    }`}
            >
                {/* Identidade visual */}
                <Link
                    href="/"
                    onClick={() => setMenuAberto(false)}
                    className="mb-5 flex items-center gap-3 px-2"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#167D8D] shadow-lg shadow-black/20">
                        <Compass
                            size={29}
                            strokeWidth={1.8}
                            className="text-white"
                        />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Trip<span className="text-[#38BFC1]">IA</span>
                        </h1>

                        <p className="mt-1 text-xs text-blue-200">
                            {traducao.sidebar.slogan}
                        </p>
                    </div>
                </Link>

                

                {/* Navegação */}
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300/60">
                    {traducao.navigation.mainMenu}
                </div>

                <nav className="flex flex-col gap-0.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/" &&
                                pathname.startsWith(`${item.href}/`));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuAberto(false)}
                                className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-[#167D8D] to-[#1C9AA5] text-white shadow-lg shadow-black/10"
                                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon
                                    size={20}
                                    strokeWidth={1.8}
                                    className={`transition-transform duration-200 ${isActive
                                        ? "text-white"
                                        : "text-blue-200 group-hover:scale-110 group-hover:text-[#38BFC1]"
                                        }`}
                                />

                                <span>{item.name}</span>

                                {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                    
                {/* Rodapé */}
                <div className="mt-auto space-y-2">

                    {/* Cartão de exploração */}
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#167D8D]/40 to-[#102A43] p-3">

                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                            <Sparkles
                                size={19}
                                className="text-[#38BFC1]"
                            />
                        </div>

                        <h3 className="text-sm font-semibold leading-snug">
                            {traducao.sidebar.adventure}
                        </h3>

                        <p className="mt-2 text-xs leading-relaxed text-blue-200">
                            {traducao.sidebar.description}
                        </p>

                        <Link
                            href="/explorar"
                            onClick={() => setMenuAberto(false)}
                            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#38BFC1] px-3 py-2.5 text-xs font-semibold text-[#102A43] transition-colors hover:bg-[#65D5D4]"
                        >
                            {traducao.sidebar.exploreButton}
                            <Navigation size={14} />
                        </Link>
                    </div>

                    {/* Configurações */}
                    <Link
                        href="/configuracoes"
                        onClick={() => setMenuAberto(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${pathname === "/configuracoes"
                            ? "bg-white/15 text-white"
                            : "text-blue-100 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <Settings size={20} strokeWidth={1.8} />

                        <span>
                            {traducao.navigation.settings}
                        </span>
                    </Link>

                    <button
                    type="button"
                    onClick={sairDaConta}
                    disabled={saindo}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <LogOut size={20} strokeWidth={1.8} />

                    <span>
                        {saindo ? "Saindo..." : "Sair da conta"}
                    </span>
                </button>

                    {/* Rodapé institucional */}
                    <div className="border-t border-white/10 pt-4">
                        <p className="text-center text-[11px] text-blue-300/70">
                            TripIA © 2026
                        </p>

                        <p className="mt-1 text-center text-[10px] text-blue-300/50">
                            {traducao.sidebar.slogan}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
