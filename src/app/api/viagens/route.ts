

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: usuarioErro,
        } = await supabase.auth.getUser();

        if (usuarioErro || !user) {
            return NextResponse.json(
                { erro: "Você precisa estar autenticado." },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from("viagens")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar viagens:", error);

            return NextResponse.json(
                { erro: "Não foi possível carregar suas viagens." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            sucesso: true,
            viagens: data,
        });
    } catch (error) {
        console.error("Erro na consulta de viagens:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao consultar suas viagens." },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Identificar o usuário autenticado
        const {
            data: { user },
            error: usuarioErro,
        } = await supabase.auth.getUser();

        if (usuarioErro || !user) {
            return NextResponse.json(
                { erro: "Você precisa estar autenticado para salvar uma viagem." },
                { status: 401 }
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
            orcamento,
            preferencias,
            observacoes,
            roteiro,
            locais,
        } = dados;

        // Validar informações obrigatórias
        if (
            typeof origem !== "string" ||
            !origem.trim() ||
            typeof destino !== "string" ||
            !destino.trim() ||
            typeof ida !== "string" ||
            typeof volta !== "string" ||
            !roteiro ||
            typeof roteiro !== "string"
        ) {
            return NextResponse.json(
                { erro: "Os dados obrigatórios da viagem estão incompletos." },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(Number(viajantes)) ||
            Number(viajantes) < 1 ||
            Number(viajantes) > 8 ||
            new Date(`${volta}T00:00:00`) < new Date(`${ida}T00:00:00`) ||
            !transporte ||
            !Array.isArray(preferencias) ||
            !Array.isArray(locais)
        ) {
            return NextResponse.json(
                { erro: "Os dados da viagem são inválidos." },
                { status: 400 }
            );
        }

        const titulo = `${origem} → ${destino}`;

        // Salvar a viagem vinculada ao usuário autenticado
        const { data, error } = await supabase
            .from("viagens")
            .insert({
                user_id: user.id,
                titulo,
                origem: origem.trim(),
                destino: destino.trim(),
                data_ida: ida,
                data_volta: volta,
                viajantes: Number(viajantes),
                transporte,
                orcamento:
                    orcamento !== null && orcamento !== undefined
                        ? Number(orcamento)
                        : null,
                preferencias,
                observacoes: observacoes || null,
                roteiro,
                locais,
                status: "planejada",
            })
            .select()
            .single();

        if (error) {
            console.error("Erro ao salvar viagem:", error);

            return NextResponse.json(
                { erro: "Não foi possível salvar a viagem." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            sucesso: true,
            mensagem: "Viagem salva com sucesso!",
            viagem: data,
        });
    } catch (error) {
        console.error("Erro na API de viagens:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao processar o salvamento." },
            { status: 500 }
        );
    }
}
