
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Verifica a autenticação do usuário
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

        // Retorna informações da própria conta
        const dadosPrivacidade = {
            conta: {
                email: user.email ?? null,
                emailVerificado: Boolean(user.email_confirmed_at),
                dataCriacao: user.created_at ?? null,
                ultimoAcesso: user.last_sign_in_at ?? null,
            },
        };

        return NextResponse.json(dadosPrivacidade, {
            status: 200,
        });
    } catch (error) {
        console.error("Erro ao consultar dados de privacidade:", error);

        return NextResponse.json(
            { erro: "Não foi possível consultar os dados da conta." },
            { status: 500 }
        );
    }
}
