
const API_COMBUSTIVEL =
    "https://openvan.camp/api/fuel/prices?source=tripia";

const LITROS_POR_UNIDADE: Record<string, number> = {
    liter: 1,
    gallon: 3.785411784,
    imperial_gallon: 4.54609,
};

type RespostaCombustivel = {
    success: boolean;
    data?: Record<string, {
        country_code: string;
        country_name: string;
        currency?: string;
        local_currency?: string;
        unit?: string;
        units?: Record<string, string>;
        currencies?: Record<string, string>;
        prices?: Record<string, number | null>;
        fetched_at?: string;
        sources?: string[];
        sources_count?: number;
        is_excluded?: boolean;
    }>;
    meta?: {
        updated_at?: string;
        cache_ttl_hours?: number;
    };
};

export type PrecoCombustivel = {
    disponivel: boolean;
    pais: string;
    codigoPais: string;
    tipoCombustivel: string;
    precoPorLitro: number | null;
    moeda: string | null;
    unidadeOriginal: string | null;
    dataAtualizacao: string | null;
    fontes: string[];
    fonte: string;
    motivo?: string;
};

export async function buscarPrecoCombustivel(
    codigoPais: string
): Promise<PrecoCombustivel> {
    const codigo = codigoPais.trim().toUpperCase();

    const indisponivel = (
        motivo: string
    ): PrecoCombustivel => ({
        disponivel: false,
        pais: codigo,
        codigoPais: codigo,
        tipoCombustivel: "gasoline",
        precoPorLitro: null,
        moeda: null,
        unidadeOriginal: null,
        dataAtualizacao: null,
        fontes: [],
        fonte: "OpenVan.camp",
        motivo,
    });

    if (!/^[A-Z]{2}$/.test(codigo)) {
        return indisponivel("Código de país inválido.");
    }

    try {
        const resposta = await fetch(API_COMBUSTIVEL, {
            next: {
                revalidate: 21600,
            },
        });

        if (!resposta.ok) {
            return indisponivel(
                "Não foi possível consultar os preços de combustível."
            );
        }

        const dados: RespostaCombustivel = await resposta.json();

        if (!dados.success || !dados.data) {
            return indisponivel(
                "A API não retornou dados válidos."
            );
        }

        const pais = dados.data[codigo];

        if (!pais || !pais.prices) {
            return indisponivel(
                "Não há dados de combustível para este país."
            );
        }

        // Prioriza gasolina comum e utiliza a chave
        // genérica como alternativa quando necessário.
        const tipos = [
            "gasoline_regular",
            "gasoline",
        ];

        const tipoEncontrado = tipos.find(
            (tipo) => pais.prices?.[tipo] != null
        );

        if (!tipoEncontrado) {
            return indisponivel(
                "Preço de gasolina não disponível para este país."
            );
        }

        const precoOriginal = pais.prices[tipoEncontrado];

        if (
            typeof precoOriginal !== "number" ||
            !Number.isFinite(precoOriginal) ||
            precoOriginal <= 0
        ) {
            return indisponivel(
                "O preço retornado pela API é inválido."
            );
        }

        const unidade =
            pais.units?.[tipoEncontrado] ??
            pais.unit ??
            null;

        const moeda =
            pais.currencies?.[tipoEncontrado] ??
            pais.currency ??
            pais.local_currency ??
            null;

        if (!moeda) {
            return indisponivel(
                "A moeda do preço não foi informada."
            );
        }

        const unidadeNormalizada = unidade?.toLowerCase();

        const litrosPorUnidade = unidadeNormalizada
            ? LITROS_POR_UNIDADE[unidadeNormalizada]
            : undefined;

        if (litrosPorUnidade === undefined) {
            return indisponivel(
                "Unidade de combustível não reconhecida."
            );
        }

        const precoPorLitro = precoOriginal / litrosPorUnidade;

        return {
            disponivel: true,
            pais: pais.country_name,
            codigoPais: codigo,
            tipoCombustivel: tipoEncontrado,
            precoPorLitro,
            moeda,
            unidadeOriginal: unidade,
            dataAtualizacao:
                pais.fetched_at ??
                dados.meta?.updated_at ??
                null,
            fontes: pais.sources ?? [],
            fonte: "OpenVan.camp",
        };
    } catch (erro) {
        console.error(
            "Erro ao consultar preço de combustível:",
            erro
        );

        return indisponivel(
            "Falha na conexão com o serviço de combustível."
        );
    }
}
