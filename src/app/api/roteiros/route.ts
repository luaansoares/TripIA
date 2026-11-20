
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { erro: "Chave do Gemini não configurada no .env.local." },
                { status: 500 }
            );
        }

        const dados = await request.json();

        const {
            origem,
            destino,
            ida,
            volta,
            viajantes,
            transporte,
            preferencias,
            orcamento,
            observacoes,
        } = dados;

        // Validar informações obrigatórias
        if (
            typeof origem !== "string" ||
            !origem.trim() ||
            typeof destino !== "string" ||
            !destino.trim() ||
            !ida ||
            !volta
        ) {
            return NextResponse.json(
                { erro: "Preencha origem, destino e datas da viagem." },
                { status: 400 }
            );
        }

        // Validar demais informações
        if (
            !Array.isArray(preferencias) ||
            !Number.isInteger(Number(viajantes)) ||
            Number(viajantes) < 1 ||
            Number(viajantes) > 8 ||
            (orcamento !== null &&
                orcamento !== undefined &&
                (!Number.isFinite(Number(orcamento)) ||
                    Number(orcamento) < 0))
        ) {
            return NextResponse.json(
                { erro: "Algumas informações da viagem são inválidas." },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({
            apiKey,
        });

        const prompt = `
Você é o assistente de viagens oficial do TripIA.

Crie um roteiro de viagem personalizado, detalhado e realista.

DADOS DA VIAGEM:

Origem: ${origem}
Destino: ${destino}
Data de ida: ${ida}
Data de volta: ${volta}
Quantidade de viajantes: ${viajantes}
Transporte: ${transporte}
Preferências: ${preferencias.join(", ") || "Não informadas"}
Orçamento: ${orcamento ? `R$ ${orcamento}` : "Não informado"}
Observações: ${observacoes || "Nenhuma"}

INSTRUÇÕES:

1. Organize o roteiro por dia.
2. Sugira atrações turísticas relevantes.
3. Considere as preferências dos viajantes.
4. Agrupe passeios próximos geograficamente.
5. Sugira restaurantes e experiências gastronômicas.
6. Apresente estimativas de gastos quando possível.
7. Considere o orçamento informado.
8. Inclua dicas úteis de viagem.
9. Não invente preços atuais, horários de funcionamento ou disponibilidade.
10. Identifique claramente informações estimadas.
11. Considere o período entre a ida e a volta.
12. Apresente sugestões adequadas à quantidade de viajantes.

FORMATO DA RESPOSTA:

# Apresentação da viagem
# Resumo do destino
# Roteiro separado por dia
# Atrações e atividades sugeridas
# Sugestões gastronômicas

# Estimativa de gastos

- Apresente cada categoria de gasto com seu respectivo valor em negrito usando Markdown (**R$ 0,00**).
- Destaque obrigatoriamente o TOTAL ESTIMADO em negrito.
- Organize os gastos em uma lista clara, separando transporte, hospedagem, alimentação e passeios.
- Informe o custo total e, quando possível, o custo por pessoa.
- Não invente valores exatos; apresente estimativas coerentes com o destino, duração, transporte e quantidade de viajantes.
# Dicas importantes

Escreva em português brasileiro, utilizando Markdown.
Organize os dias com títulos e atividades separadas por manhã, tarde e noite.
Seja claro, agradável e objetivo.
`;

        const resposta = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
        });

        const texto = resposta.text;

        if (!texto) {
            throw new Error("O Gemini não retornou um roteiro.");
        }

        return NextResponse.json({
            sucesso: true,
            roteiro: texto,
        });

    } catch (error) {
        console.error("Erro ao gerar roteiro com Gemini:", error);

        const mensagem =
            error instanceof Error ? error.message : "";

        // Erro 503: serviço temporariamente indisponível
        if (
            mensagem.includes("503") ||
            mensagem.includes("UNAVAILABLE")
        ) {
            return NextResponse.json(
                {
                    erro: "O Gemini está temporariamente sobrecarregado. Aguarde alguns instantes e tente novamente.",
                },
                { status: 503 }
            );
        }

        // Erro 429: limite de requisições atingido
        if (
            mensagem.includes("429") ||
            mensagem.includes("RESOURCE_EXHAUSTED")
        ) {
            return NextResponse.json(
                {
                    erro: "O limite de requisições do Gemini foi atingido. Tente novamente mais tarde.",
                },
                { status: 429 }
            );
        }

        // Erro de autenticação
        if (
            mensagem.includes("API_KEY_INVALID") ||
            mensagem.includes("API key not valid") ||
            mensagem.includes("PERMISSION_DENIED")
        ) {
            return NextResponse.json(
                {
                    erro: "A chave do Gemini é inválida ou não possui permissão para acessar a API.",
                },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                erro: "Não foi possível gerar o roteiro com o Gemini. Verifique o terminal para mais detalhes.",
            },
            { status: 500 }
        );
    }
}
