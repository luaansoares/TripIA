
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Recupera o termo pesquisado pelo usuário
        const { searchParams } = new URL(request.url);
        const destino = searchParams.get("destino");

        // Verifica se o usuário informou um destino
        if (!destino || destino.trim().length < 2) {
            return NextResponse.json(
                { erro: "Informe um destino válido." },
                { status: 400 }
            );
        }

        // Recupera a chave armazenada no ambiente
        const apiKey = process.env.OPENTRIPMAP_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { erro: "Chave da OpenTripMap não configurada." },
                { status: 500 }
            );
        }

        // 1. Localiza a cidade pesquisada
        const cidadeUrl = new URL(
            "https://api.opentripmap.com/0.1/en/places/geoname"
        );

        cidadeUrl.searchParams.set("name", destino.trim());
        cidadeUrl.searchParams.set("apikey", apiKey);

        const cidadeResponse = await fetch(cidadeUrl.toString());

        if (!cidadeResponse.ok) {
            throw new Error("Não foi possível localizar o destino.");
        }

        const cidade = await cidadeResponse.json();

        if (cidade.status !== "OK") {
            return NextResponse.json(
                { erro: "Destino não encontrado." },
                { status: 404 }
            );
        }

        // 2. Busca atrações próximas da cidade
        const atracoesUrl = new URL(
            "https://api.opentripmap.com/0.1/en/places/radius"
        );

        atracoesUrl.searchParams.set("radius", "5000");
        atracoesUrl.searchParams.set("lon", String(cidade.lon));
        atracoesUrl.searchParams.set("lat", String(cidade.lat));
        atracoesUrl.searchParams.set("limit", "20");
        atracoesUrl.searchParams.set("rate", "2");
        atracoesUrl.searchParams.set("format", "json");
        atracoesUrl.searchParams.set("apikey", apiKey);

        const atracoesResponse = await fetch(atracoesUrl.toString());

        if (!atracoesResponse.ok) {
            throw new Error("Não foi possível buscar as atrações.");
        }

        const atracoes = await atracoesResponse.json();

        // 3. Busca informações detalhadas das atrações
        const atracoesDetalhadas = await Promise.all(
            atracoes.map(async (atracao: { xid: string }) => {
                const detalhesUrl = new URL(
                    "https://api.opentripmap.com/0.1/en/places/xid/" + atracao.xid
                );

                detalhesUrl.searchParams.set("apikey", apiKey);

                const resposta = await fetch(detalhesUrl.toString());

                if (!resposta.ok) {
                    return atracao;
                }

                return {
                    ...atracao,
                    ...(await resposta.json()),
                };
            })
        );

        // 3. Retorna os resultados para o frontend
        return NextResponse.json({
            destino: {
                nome: cidade.name,
                pais: cidade.country,
                latitude: cidade.lat,
                longitude: cidade.lon,
            },
            total: atracoesDetalhadas.length,
            atracoes: atracoesDetalhadas,
        });

    } catch (error) {
        console.error("Erro na busca de destinos:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao buscar destinos." },
            { status: 500 }
        );
    }
}
