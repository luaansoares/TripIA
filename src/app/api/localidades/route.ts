import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.GEOAPIFY_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { erro: "Chave da Geoapify não configurada." },
                { status: 500 }
            );
        }

        const busca = request.nextUrl.searchParams.get("busca")?.trim();

        if (!busca || busca.length < 2) {
            return NextResponse.json({ resultados: [] });
        }

        const parametros = new URLSearchParams({
            text: busca,
            type: "city",
            format: "json",
            limit: "8",
            lang: "pt",
            apiKey,
        });

        const resposta = await fetch(
            `https://api.geoapify.com/v1/geocode/autocomplete?${parametros.toString()}`,
            { cache: "no-store" }
        );

        if (!resposta.ok) {
            console.error("Erro Geoapify:", resposta.status);

            return NextResponse.json(
                { erro: "Não foi possível pesquisar localidades." },
                { status: resposta.status }
            );
        }

        const dados = await resposta.json();

        const resultados = (dados.results || [])
            .filter((item: any) =>
                item.place_id &&
                Number.isFinite(Number(item.lat)) &&
                Number.isFinite(Number(item.lon))
            )
            .map((item: any) => ({
                id: item.place_id,
                nome:
                    item.city ||
                    item.name ||
                    item.town ||
                    item.village ||
                    item.municipality ||
                    "",
                regiao:
                    item.state ||
                    item.county ||
                    item.region ||
                    "",
                pais: item.country || "",
                endereco: item.formatted || "",
                latitude: Number(item.lat),
                longitude: Number(item.lon),
                codigoPais: item.country_code || "",
            }))
            .filter((item: any) => item.nome && item.pais);

        return NextResponse.json({ resultados });
    } catch (error) {
        console.error("Erro na API de localidades:", error);

        return NextResponse.json(
            { erro: "Erro interno ao pesquisar localidades." },
            { status: 500 }
        );
    }
}