
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
        <aside className="w-64 min-h-screen bg-[#102A43] text-white p-6 flex flex-col">

            {/* Identidade visual */}
            <div className="mb-12">
                <h1 className="text-2xl font-bold tracking-wide">
                    TripIA
                </h1>

                <p className="text-sm text-blue-200 mt-1">
                    Planeje. Explore. Viaje.
                </p>
            </div>

            {/* Navegação */}
            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${isActive
                                    ? "bg-white/15 text-white"
                                    : "text-blue-100 hover:bg-white/10"
                                }`}
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Configurações */}
            <div className="mt-auto">
                <Link
                    href="/configuracoes"
                    className="flex items-center gap-3 rounded-lg p-3 text-blue-100 hover:bg-white/10 transition-colors"
                >
                    <Settings size={20} />
                    <span>Configurações</span>
                </Link>

                <p className="text-xs text-blue-200 mt-6">
                    Seu próximo destino começa aqui.
                </p>
            </div>

        </aside>
    );
}
