import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function montarUsuario(user: {
    id?: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
}) {
    const meta = user.user_metadata ?? {};

    return {
        id: user.id,
        nome: (meta.nome_exibicao as string) || "",
        email: user.email || "",
        telefone: (meta.telefone as string) || "",
        cidade: (meta.cidade as string) || "",
        avatarUrl: (meta.avatar_url as string) || "",
    };
}

/* ───────────── GET: carregar dados da conta ───────────── */
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

        return NextResponse.json({ usuario: montarUsuario(user) });
    } catch (error) {
        console.error("Erro ao buscar conta:", error);

        return NextResponse.json(
            { erro: "Não foi possível carregar os dados da conta." },
            { status: 500 }
        );
    }
}

/* ───────────── PATCH: atualizar nome, telefone e cidade ───────────── */
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
        const nome = String(body.nome ?? "").trim();
        const telefone = String(body.telefone ?? "").trim();
        const cidade = String(body.cidade ?? "").trim();

        if (nome.length < 2 || nome.length > 40) {
            return NextResponse.json(
                { erro: "O nome deve ter entre 2 e 40 caracteres." },
                { status: 400 }
            );
        }

        const digitosTelefone = telefone.replace(/\D/g, "");

        if (
            telefone &&
            (digitosTelefone.length < 10 || digitosTelefone.length > 11)
        ) {
            return NextResponse.json(
                { erro: "Informe um telefone válido com DDD." },
                { status: 400 }
            );
        }

        if (cidade.length > 60) {
            return NextResponse.json(
                { erro: "A cidade deve ter no máximo 60 caracteres." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase.auth.updateUser({
            data: {
                nome_exibicao: nome,
                telefone,
                cidade,
            },
        });

        if (error) {
            return NextResponse.json(
                { erro: "Não foi possível atualizar os dados." },
                { status: 400 }
            );
        }

        return NextResponse.json({
            mensagem: "Dados atualizados com sucesso.",
            usuario: montarUsuario(data.user),
        });
    } catch (error) {
        console.error("Erro ao atualizar conta:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao atualizar os dados." },
            { status: 500 }
        );
    }
}

/* ───────────── DELETE: excluir a conta ───────────── */
export async function DELETE() {
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

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY não configurada.");

            return NextResponse.json(
                { erro: "Exclusão de conta indisponível no momento." },
                { status: 500 }
            );
        }

        // A chave service_role só pode existir no servidor (nunca com NEXT_PUBLIC_).
        const admin = createAdminClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { error } = await admin.auth.admin.deleteUser(user.id);

        if (error) {
            console.error("Erro ao excluir usuário:", error);

            return NextResponse.json(
                { erro: "Não foi possível excluir a conta." },
                { status: 400 }
            );
        }

        await supabase.auth.signOut();

        return NextResponse.json({ mensagem: "Conta excluída com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir conta:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao excluir a conta." },
            { status: 500 }
        );
    }
}