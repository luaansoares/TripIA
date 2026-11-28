import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "avatars";
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB (a tela já reduz para 512x512)

/* ───────────── POST: enviar foto de perfil ───────────── */
export async function POST(request: Request) {
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

        const formData = await request.formData();
        const arquivo = formData.get("foto");

        if (!(arquivo instanceof File)) {
            return NextResponse.json(
                { erro: "Nenhuma imagem foi enviada." },
                { status: 400 }
            );
        }

        if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
            return NextResponse.json(
                { erro: "Use uma imagem JPG, PNG ou WebP." },
                { status: 400 }
            );
        }

        if (arquivo.size > TAMANHO_MAXIMO) {
            return NextResponse.json(
                { erro: "A imagem deve ter no máximo 2 MB." },
                { status: 400 }
            );
        }

        // um único arquivo por usuário, sempre sobrescrito
        const caminho = `${user.id}/avatar`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(caminho, arquivo, {
                contentType: arquivo.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Erro no upload do avatar:", uploadError);

            return NextResponse.json(
                { erro: "Não foi possível enviar a foto." },
                { status: 400 }
            );
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(caminho);

        // ?v= evita que o navegador mostre a foto antiga em cache
        const avatarUrl = `${publicUrl}?v=${Date.now()}`;

        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl },
        });

        if (updateError) {
            return NextResponse.json(
                { erro: "A foto foi enviada, mas não foi possível salvá-la no perfil." },
                { status: 400 }
            );
        }

        return NextResponse.json({ avatarUrl });
    } catch (error) {
        console.error("Erro ao salvar foto:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao enviar a foto." },
            { status: 500 }
        );
    }
}

/* ───────────── DELETE: remover foto de perfil ───────────── */
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

        await supabase.storage.from(BUCKET).remove([`${user.id}/avatar`]);

        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: "" },
        });

        if (error) {
            return NextResponse.json(
                { erro: "Não foi possível remover a foto." },
                { status: 400 }
            );
        }

        return NextResponse.json({ mensagem: "Foto removida." });
    } catch (error) {
        console.error("Erro ao remover foto:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao remover a foto." },
            { status: 500 }
        );
    }
}