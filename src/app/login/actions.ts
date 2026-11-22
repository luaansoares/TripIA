
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cadastrar(formData: FormData) {
    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const senha = String(formData.get("senha") ?? "");

    if (!nome || !email || senha.length < 8) {
        redirect("/login?erro=dados_invalidos");
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
            data: {
                nome_exibicao: nome,
            },
        },
    });

    if (error) {
        redirect("/login?erro=cadastro");
    }

    redirect("/");
}

export async function entrar(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const senha = String(formData.get("senha") ?? "");

    if (!email || !senha) {
        redirect("/login?erro=dados_invalidos");
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
    });

    if (error) {
        redirect("/login?erro=login");
    }

    redirect("/");
}
