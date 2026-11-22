
import { NextResponse } from "next/server";

export async function GET() {
    const locais = [
    "Ponte dos Ingleses, Fortaleza, Ceará, Brasil",
    "Ponte dos Ingleses, Praia de Iracema, Fortaleza, Brasil",
    "English Bridge, Fortaleza, Brazil",
];

    const resultados = [];

    for (const consulta of locais) {
        try {
            const parametros = new URLSearchParams({
                q: consulta,
                format: "jsonv2",
                limit: "5",
                addressdetails: "1",
            });

            const resposta = await fetch(
                `https://nominatim.openstreetmap.org/search?${parametros}`,
                {
                    headers: {
                        "User-Agent": "TripIA/1.0",
                    },
                    cache: "no-store",
                }
            );

            if (!resposta.ok) {
                resultados.push({
                    consulta,
                    erro: `Erro HTTP ${resposta.status}`,
                });

                if (resposta.status === 403 || resposta.status === 429) {
                    break;
                }

                continue;
            }

            const dados = await resposta.json();

            resultados.push({
                consulta,
                encontrados: dados.map((item: any) => ({
                    nome: item.name,
                    endereco: item.display_name,
                    latitude: Number(item.lat),
                    longitude: Number(item.lon),
                    tipo: item.type,
                    categoria: item.category,
                })),
            });

        } catch (error) {
            resultados.push({
                consulta,
                erro: error instanceof Error
                    ? error.message
                    : "Erro desconhecido",
            });
        }

        // Respeitar o limite público do Nominatim.
        if (consulta !== locais[locais.length - 1]) {
            await new Promise((resolve) => setTimeout(resolve, 1100));
        }
    }

    return NextResponse.json(resultados);
}

