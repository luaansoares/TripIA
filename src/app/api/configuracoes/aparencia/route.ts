
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const temaPadrao = {
    tema: "claro",
};

const temasPermitidos = ["claro", "escuro", "automatico"];

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

        const aparencia =
            user.user_metadata?.aparencia ?? temaPadrao;

        return NextResponse.json({ aparencia });
    } catch {
        return NextResponse.json(
            { erro: "Erro ao carregar as configurações de aparência." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
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

        const dados = await request.json();
        const { tema } = dados;

        if (
            typeof tema !== "string" ||
            !temasPermitidos.includes(tema)
        ) {
            return NextResponse.json(
                { erro: "Tema selecionado inválido." },
                { status: 400 }
            );
        }

        const aparencia = { tema };

        const { error: erroAtualizacao } =
            await supabase.auth.updateUser({
                data: {
                    ...user.user_metadata,
                    aparencia,
                },
            });

        if (erroAtualizacao) {
            return NextResponse.json(
                { erro: "Não foi possível salvar a aparência." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            mensagem: "Aparência salva com sucesso!",
            aparencia,
        });
    } catch {
        return NextResponse.json(
            { erro: "Erro ao salvar as configurações de aparência." },
            { status: 500 }
        );
    }
}
