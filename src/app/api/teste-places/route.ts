import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GEOAPIFY_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { erro: "GEOAPIFY_API_KEY não encontrada." },
                { status: 500 }
            );
        }

        const locais = [
            "Mercado dos Peixes, Fortaleza, Ceará, Brasil",
            "Catedral Metropolitana de Fortaleza, Ceará, Brasil",
            "Feira de Artesanato da Beira Mar, Fortaleza, Ceará, Brasil",
        ];

        const resultados = [];

        for (const nome of locais) {
            const parametros = new URLSearchParams({
                text: nome,
                filter: "countrycode:br",
                bias: "proximity:-38.5267,-3.7319",
                limit: "10",
                lang: "pt",
                format: "json",
                apiKey,
            });

            const resposta = await fetch(
                `https://api.geoapify.com/v1/geocode/search?${parametros.toString()}`,
                { cache: "no-store" }
            );

            const dados = await resposta.json();

            resultados.push({
                pesquisa: nome,
                encontrados: (dados.results || []).map((item: any) => ({
                    nome: item.name,
                    endereco: item.formatted,
                    latitude: item.lat,
                    longitude: item.lon,
                    tipo: item.result_type,
                    cidade: item.city,
                    bairro: item.suburb,
                })),
                erro: resposta.ok ? undefined : dados,
            });
        }

        return NextResponse.json({
            sucesso: true,
            totalPesquisas: locais.length,
            resultados,
        });

    } catch (error) {
        console.error("Erro no teste Geocoding:", error);

        return NextResponse.json(
            { erro: "Falha ao consultar Geoapify Geocoding." },
            { status: 500 }
        );
    }
}