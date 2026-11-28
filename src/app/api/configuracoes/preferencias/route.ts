
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const padrao = {
    transportes: ["Carro"],
    interesses: [],
    orcamento: "Economico",
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

        const salvas = user.user_metadata?.preferencias_viagem ?? {};

        return NextResponse.json({
            preferencias: {
                transportes: Array.isArray(salvas.transportes)
                    ? salvas.transportes
                    : padrao.transportes,

                interesses: Array.isArray(salvas.interesses)
                    ? salvas.interesses
                    : padrao.interesses,

                orcamento:
                    typeof salvas.orcamento === "string"
                        ? salvas.orcamento
                        : padrao.orcamento,
            },
        });
    } catch (error) {
        console.error("Erro ao carregar preferências:", error);

        return NextResponse.json(
            { erro: "Não foi possível carregar as preferências." },
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
        const preferencias = body.preferencias;

        const transportesValidos = [
            "Carro",
            "Moto",
            "Ônibus",
            "Transporte público",
        ];

        const interessesValidos = [
            "Praias e natureza",
            "História e cultura",
            "Gastronomia",
            "Aventura",
            "Turismo e passeios",
            "Compras e entretenimento",
        ];

        const orcamentosValidos = [
            "Economico",
            "Moderado",
            "Confortavel",
            "Luxo",
        ];

        if (
            !preferencias ||
            !Array.isArray(preferencias.transportes) ||
            !Array.isArray(preferencias.interesses) ||
            typeof preferencias.orcamento !== "string" ||
            !preferencias.transportes.every((item: string) =>
                transportesValidos.includes(item)
            ) ||
            !preferencias.interesses.every((item: string) =>
                interessesValidos.includes(item)
            ) ||
            !orcamentosValidos.includes(preferencias.orcamento)
        ) {
            return NextResponse.json(
                { erro: "Preferências inválidas." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.auth.updateUser({
            data: {
                ...user.user_metadata,
                preferencias_viagem: {
                    transportes: preferencias.transportes,
                    interesses: preferencias.interesses,
                    orcamento: preferencias.orcamento,
                },
            },
        });

        if (error) {
            console.error("Erro ao salvar preferências:", error);

            return NextResponse.json(
                { erro: "Não foi possível salvar as preferências." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            mensagem: "Preferências salvas com sucesso.",
            preferencias: data.user.user_metadata?.preferencias_viagem,
        });
    } catch (error) {
        console.error("Erro ao atualizar preferências:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao salvar as preferências." },
            { status: 500 }
        );
    }
}
