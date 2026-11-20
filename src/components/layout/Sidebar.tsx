
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    House,
    Compass,
    Map,
    MapPin,
    Heart,
    Settings,
    Sparkles,
    Navigation,
} from "lucide-react";

const menuItems = [
    { name: "Início", href: "/", icon: House },
    { name: "Explorar destinos", href: "/explorar", icon: Compass },
    { name: "Planejar viagens", href: "/roteiros", icon: Map },
    { name: "Meu mapa", href: "/mapa", icon: MapPin },
    { name: "Favoritos", href: "/favoritos", icon: Heart },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex min-h-screen w-[264px] shrink-0 flex-col bg-[#102A43] px-5 py-7 text-white">

            {/* Identidade visual */}
            <Link href="/" className="mb-12 flex items-center gap-3 px-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#167D8D] shadow-lg shadow-black/20">
                    <Compass size={29} strokeWidth={1.8} className="text-white" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Trip<span className="text-[#38BFC1]">IA</span>
                    </h1>
                    <p className="mt-1 text-xs text-blue-200">
                        Planeje. Explore. Viaje.
                    </p>
                </div>
            </Link>

            {/* Navegação */}
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300/60">
                Menu principal
            </div>

            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${isActive
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
            <div className="mt-auto space-y-5">

                {/* Cartão de exploração */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#167D8D]/40 to-[#102A43] p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Sparkles size={19} className="text-[#38BFC1]" />
                    </div>

                    <h3 className="text-sm font-semibold leading-snug">
                        Sua próxima aventura começa aqui.
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-blue-200">
                        Descubra novos lugares com a inteligência do TripIA.
                    </p>

                    <Link
                        href="/explorar"
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#38BFC1] px-3 py-2.5 text-xs font-semibold text-[#102A43] transition-colors hover:bg-[#65D5D4]"
                    >
                        Explorar destinos
                        <Navigation size={14} />
                    </Link>
                </div>

                {/* Configurações */}
                <Link
                    href="/configuracoes"
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${pathname === "/configuracoes"
                            ? "bg-white/15 text-white"
                            : "text-blue-100 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    <Settings size={20} strokeWidth={1.8} />
                    <span>Configurações</span>
                </Link>

                <div className="border-t border-white/10 pt-4">
                    <p className="text-center text-[11px] text-blue-300/70">
                        TripIA © 2026
                    </p>
                    <p className="mt-1 text-center text-[10px] text-blue-300/50">
                        Planeje. Explore. Viaje.
                    </p>
                </div>
            </div>
        </aside>
    );
}
