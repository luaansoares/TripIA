
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const padrao = {
    roteiros: true,
    viagens: true,
    novidades: false,
};

export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { erro: "Usuário não autenticado." },
                { status: 401 }
            );
        }

        const salvas = user.user_metadata?.notificacoes ?? {};

        return NextResponse.json({
            notificacoes: {
                roteiros:
                    typeof salvas.roteiros === "boolean"
                        ? salvas.roteiros
                        : padrao.roteiros,
                viagens:
                    typeof salvas.viagens === "boolean"
                        ? salvas.viagens
                        : padrao.viagens,
                novidades:
                    typeof salvas.novidades === "boolean"
                        ? salvas.novidades
                        : padrao.novidades,
            },
        });
    } catch (error) {
        console.error("Erro ao carregar notificações:", error);

        return NextResponse.json(
            { erro: "Não foi possível carregar as notificações." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { erro: "Usuário não autenticado." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const notificacoes = body.notificacoes;

        if (
            !notificacoes ||
            typeof notificacoes.roteiros !== "boolean" ||
            typeof notificacoes.viagens !== "boolean" ||
            typeof notificacoes.novidades !== "boolean"
        ) {
            return NextResponse.json(
                { erro: "Preferências de notificações inválidas." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.auth.updateUser({
            data: {
                ...user.user_metadata,
                notificacoes: {
                    roteiros: notificacoes.roteiros,
                    viagens: notificacoes.viagens,
                    novidades: notificacoes.novidades,
                },
            },
        });

        if (error) {
            console.error("Erro ao salvar notificações:", error);

            return NextResponse.json(
                { erro: "Não foi possível salvar as preferências." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            mensagem: "Preferências salvas com sucesso.",
            notificacoes: data.user.user_metadata?.notificacoes,
        });
    } catch (error) {
        console.error("Erro ao atualizar notificações:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao salvar as preferências." },
            { status: 500 }
        );
    }
}
