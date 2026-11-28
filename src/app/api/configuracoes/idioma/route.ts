
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const configuracaoPadrao = {
    idioma: "pt-BR",
    moeda: "BRL",
    regiao: "BR",
    formatoData: "DD/MM/AAAA",
};

const idiomas = ["pt-BR", "en", "es"];
const moedas = ["BRL", "USD", "EUR"];
const regioes = ["BR", "US", "PT", "ES"];
const formatosData = ["DD/MM/AAAA", "MM/DD/AAAA"];

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { erro: "Usuário não autenticado." },
                { status: 401 }
            );
        }

        const configuracoes =
            user.user_metadata?.idioma_regiao ?? configuracaoPadrao;

        return NextResponse.json({ configuracoes });
    } catch {
        return NextResponse.json(
            { erro: "Erro ao carregar idioma e região." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { erro: "Usuário não autenticado." },
                { status: 401 }
            );
        }

        const dados = await request.json();
        const { idioma, moeda, regiao, formatoData } = dados;

        if (
            !idiomas.includes(idioma) ||
            !moedas.includes(moeda) ||
            !regioes.includes(regiao) ||
            !formatosData.includes(formatoData)
        ) {
            return NextResponse.json(
                { erro: "Configurações inválidas." },
                { status: 400 }
            );
        }

        const configuracoes = {
            idioma,
            moeda,
            regiao,
            formatoData,
        };

        const { error: erroAtualizacao } =
            await supabase.auth.updateUser({
                data: {
                    ...user.user_metadata,
                    idioma_regiao: configuracoes,
                },
            });

        if (erroAtualizacao) {
            return NextResponse.json(
                { erro: "Não foi possível salvar as configurações." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            mensagem: "Configurações salvas com sucesso!",
            configuracoes,
        });
    } catch {
        return NextResponse.json(
            { erro: "Erro ao salvar idioma e região." },
            { status: 500 }
        );
    }
}
