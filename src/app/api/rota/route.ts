
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEOAPIFY_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { erro: "Chave Geoapify não configurada." },
                { status: 500 }
            );
        }

        const { locais, transporte } = await request.json();

        if (!Array.isArray(locais)) {
            return NextResponse.json(
                { erro: "Lista de locais inválida." },
                { status: 400 }
            );
        }

        const locaisValidos = locais.filter(
            (local: any) =>
                Number.isFinite(Number(local.latitude)) &&
                Number.isFinite(Number(local.longitude)) &&
                Number(local.latitude) >= -90 &&
                Number(local.latitude) <= 90 &&
                Number(local.longitude) >= -180 &&
                Number(local.longitude) <= 180
        );

        if (locaisValidos.length < 2) {
            return NextResponse.json(
                {
                    erro: "São necessários pelo menos dois locais com coordenadas válidas.",
                },
                { status: 400 }
            );
        }

        // Monta os pontos na ordem latitude, longitude.
        const waypoints = locaisValidos
            .map(
                (local: any) =>
                    `${Number(local.latitude)},${Number(local.longitude)}`
            )
            .join("|");

        // Define o meio de transporte.
        const modos: Record<string, string> = {
            Carro: "drive",
            Moto: "motorcycle",
            Ônibus: "bus",
            Bicicleta: "bicycle",
            "A pé": "walk",
        };

        const parametros = new URLSearchParams({
            waypoints,
            mode: modos[transporte] || "drive",
            optimize_stops: "true",
            type: "balanced",
            format: "json",
            lang: "pt-BR",
            apiKey,
        });

        // Consulta a API de rotas da Geoapify.
        const resposta = await fetch(
            `https://api.geoapify.com/v1/routing?${parametros.toString()}`,
            { cache: "no-store" }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error("Erro Geoapify:", dados);

            return NextResponse.json(
                {
                    erro: "Não foi possível calcular a rota.",
                    detalhes: dados,
                },
                { status: resposta.status }
            );
        }

        const rota = dados.results?.[0];

        if (
            !rota ||
            !Array.isArray(rota.geometry) ||
            !Array.isArray(rota.waypoints)
        ) {
            console.error("Resposta inesperada da Geoapify:", dados);

            return NextResponse.json(
                {
                    erro: "A Geoapify não retornou uma rota válida.",
                },
                { status: 502 }
            );
        }

        // Recupera os locais na ordem otimizada pela Geoapify.
        const locaisOrdenados = rota.waypoints.map(
            (ponto: any) =>
                locaisValidos[ponto.original_index]
        );

        if (
            locaisOrdenados.length !== locaisValidos.length ||
            locaisOrdenados.some((local: any) => !local)
        ) {
            console.error(
                "Não foi possível recuperar a ordem dos locais:",
                rota.waypoints
            );

            return NextResponse.json(
                {
                    erro: "Não foi possível identificar a ordem otimizada dos locais.",
                },
                { status: 502 }
            );
        }

        // A geometria JSON da Geoapify contém trechos
        // com pontos no formato { lon, lat }.
        // O Leaflet utiliza [latitude, longitude].
        const pontosGeometria = rota.geometry.flat();

        const geometria: [number, number][] = pontosGeometria
            .filter(
                (ponto: any) =>
                    ponto &&
                    Number.isFinite(Number(ponto.lat)) &&
                    Number.isFinite(Number(ponto.lon))
            )
            .map((ponto: any) => [
                Number(ponto.lat),
                Number(ponto.lon),
            ]);

        if (geometria.length < 2) {
            console.error(
                "Geometria sem pontos suficientes:",
                rota.geometry
            );

            return NextResponse.json(
                {
                    erro: "A rota não possui coordenadas suficientes para desenhar.",
                },
                { status: 502 }
            );
        }

        // Retorna a rota e os locais organizados.
        return NextResponse.json({
            sucesso: true,
            locais: locaisOrdenados,
            geometria,
            distancia: rota.distance,
            duracao: rota.time,
        });

    } catch (error) {
        console.error("Erro ao calcular rota:", error);

        return NextResponse.json(
            {
                erro: "Não foi possível calcular a rota.",
            },
            { status: 500 }
        );
    }
}
