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

export async function PATCH(request: NextRequest) {
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

        const dados = await request.json();

        const { id } = dados;

        if (typeof id !== "string" || !id.trim()) {
            return NextResponse.json(
                { erro: "ID da viagem inválido." },
                { status: 400 }
            );
        }

        // Buscar a viagem pertencente ao usuário
        const { data: viagemAtual, error: buscaErro } = await supabase
            .from("viagens")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (buscaErro) {
            console.error("Erro ao buscar viagem:", buscaErro);

            return NextResponse.json(
                { erro: "Não foi possível localizar a viagem." },
                { status: 500 }
            );
        }

        if (!viagemAtual) {
            return NextResponse.json(
                { erro: "Viagem não encontrada." },
                { status: 404 }
            );
        }

        // Montar atualização preservando os campos não enviados
        const atualizacao: Record<string, unknown> = {};

        if (dados.titulo !== undefined) {
            if (
                typeof dados.titulo !== "string" ||
                !dados.titulo.trim() ||
                dados.titulo.trim().length > 100
            ) {
                return NextResponse.json(
                    { erro: "Informe um nome válido de até 100 caracteres." },
                    { status: 400 }
                );
            }

            atualizacao.titulo = dados.titulo.trim();
        }

        if (dados.origem !== undefined) {
            if (
                typeof dados.origem !== "string" ||
                !dados.origem.trim()
            ) {
                return NextResponse.json(
                    { erro: "Informe uma origem válida." },
                    { status: 400 }
                );
            }

            atualizacao.origem = dados.origem.trim();
        }

        if (dados.destino !== undefined) {
            if (
                typeof dados.destino !== "string" ||
                !dados.destino.trim()
            ) {
                return NextResponse.json(
                    { erro: "Informe um destino válido." },
                    { status: 400 }
                );
            }

            atualizacao.destino = dados.destino.trim();
        }

        const dataIda =
            dados.data_ida !== undefined
                ? dados.data_ida
                : viagemAtual.data_ida;

        const dataVolta =
            dados.data_volta !== undefined
                ? dados.data_volta
                : viagemAtual.data_volta;

        if (
            typeof dataIda !== "string" ||
            typeof dataVolta !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dataIda) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dataVolta) ||
            new Date(`${dataVolta}T00:00:00`) <
                new Date(`${dataIda}T00:00:00`)
        ) {
            return NextResponse.json(
                { erro: "As datas da viagem são inválidas." },
                { status: 400 }
            );
        }

        if (dados.data_ida !== undefined) {
            atualizacao.data_ida = dataIda;
        }

        if (dados.data_volta !== undefined) {
            atualizacao.data_volta = dataVolta;
        }

        if (dados.viajantes !== undefined) {
            const viajantes = Number(dados.viajantes);

            if (
                !Number.isInteger(viajantes) ||
                viajantes < 1 ||
                viajantes > 8
            ) {
                return NextResponse.json(
                    { erro: "A quantidade de viajantes deve ser entre 1 e 8." },
                    { status: 400 }
                );
            }

            atualizacao.viajantes = viajantes;
        }

        if (dados.transporte !== undefined) {
            if (
                typeof dados.transporte !== "string" ||
                !dados.transporte.trim()
            ) {
                return NextResponse.json(
                    { erro: "Informe um transporte válido." },
                    { status: 400 }
                );
            }

            atualizacao.transporte = dados.transporte.trim();
        }

        if (dados.orcamento !== undefined) {
            if (dados.orcamento === null || dados.orcamento === "") {
                atualizacao.orcamento = null;
            } else {
                const orcamento = Number(dados.orcamento);

                if (!Number.isFinite(orcamento) || orcamento < 0) {
                    return NextResponse.json(
                        { erro: "Informe um orçamento válido." },
                        { status: 400 }
                    );
                }

                atualizacao.orcamento = orcamento;
            }
        }

        if (dados.preferencias !== undefined) {
            if (!Array.isArray(dados.preferencias)) {
                return NextResponse.json(
                    { erro: "As preferências devem ser uma lista." },
                    { status: 400 }
                );
            }

            atualizacao.preferencias = dados.preferencias;
        }

        if (dados.observacoes !== undefined) {
            if (
                dados.observacoes !== null &&
                typeof dados.observacoes !== "string"
            ) {
                return NextResponse.json(
                    { erro: "As observações devem ser um texto válido." },
                    { status: 400 }
                );
            }

            atualizacao.observacoes = dados.observacoes || null;
        }

        if (dados.status !== undefined) {
            const statusPermitidos = ["planejada", "em_andamento", "concluida"];
            if (
                typeof dados.status !== "string" ||
                !statusPermitidos.includes(dados.status)
            ) {
                return NextResponse.json(
                    { erro: "Informe um status válido para a viagem." },
                    { status: 400 }
                );
            }

            atualizacao.status = dados.status;
        }

        if (Object.keys(atualizacao).length === 0) {
            return NextResponse.json(
                { erro: "Nenhuma alteração foi enviada." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("viagens")
            .update(atualizacao)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar viagem:", error);

            return NextResponse.json(
                { erro: "Não foi possível atualizar a viagem." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            sucesso: true,
            mensagem: "Viagem atualizada com sucesso!",
            viagem: data,
        });
    } catch (error) {
        console.error("Erro na atualização da viagem:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao atualizar a viagem." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        const dados = await request.json().catch(() => null);
        const id = dados?.id;

        if (typeof id !== "string" || !id.trim()) {
            return NextResponse.json(
                { erro: "ID da viagem inválido." },
                { status: 400 }
            );
        }

        // Só apaga se a viagem pertencer ao usuário autenticado
        const { data, error } = await supabase
            .from("viagens")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
            .select("id");

        if (error) {
            console.error("Erro ao excluir viagem:", error);

            return NextResponse.json(
                { erro: "Não foi possível excluir a viagem." },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { erro: "Viagem não encontrada." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            sucesso: true,
            mensagem: "Viagem excluída com sucesso!",
        });
    } catch (error) {
        console.error("Erro ao excluir viagem:", error);

        return NextResponse.json(
            { erro: "Ocorreu um erro ao excluir a viagem." },
            { status: 500 }
        );
    }
}
