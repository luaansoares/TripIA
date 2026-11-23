import type { LocalizacaoFinanceira } from "./localizacao";

export type CategoriaPreco = "transporte" | "alimentacao" | "hospedagem";

export type UnidadePreco =
    | "por pessoa"
    | "por corrida"
    | "por passagem"
    | "por refeição"
    | "por dia"
    | "por noite"
    | "por viagem";

export type FontePreco = {
    nome: string;
    tipo: "local" | "regional" | "nacional" | "estimado";
    consultadoEm: string;
};

export type EstimativaPreco = {
    categoria: CategoriaPreco;
    item: string;
    unidade: UnidadePreco;
    valorMinimo: number | null;
    valorMedio: number | null;
    valorMaximo: number | null;
    moeda: string;
    fonte: FontePreco | null;
    confianca: "alta" | "media" | "baixa" | "indisponivel";
};

export type DadosPrecos = {
    localizacao: LocalizacaoFinanceira;
    estimativas: EstimativaPreco[];
    mensagem: string;
};

type EntradaEstimativa = {
    categoria: CategoriaPreco;
    item: string;
    unidade: UnidadePreco;
    valorMinimo?: number | null;
    valorMedio?: number | null;
    valorMaximo?: number | null;
    moeda: string;
    fonte: FontePreco | null;
    confianca: "alta" | "media" | "baixa";
};

const valorOk = (v: number | null | undefined): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;

export function criarEstimativaPreco(dados: EntradaEstimativa): EstimativaPreco {
    const minimo = dados.valorMinimo ?? null;
    const medio = dados.valorMedio ?? null;
    const maximo = dados.valorMaximo ?? null;

    const presentes = [minimo, medio, maximo].filter((v) => v !== null);

    const valoresValidos =
        presentes.length > 0 &&
        presentes.every(valorOk) &&
        // mínimo <= médio <= máximo (ignora os que não existem)
        (minimo === null || medio === null || minimo <= medio) &&
        (medio === null || maximo === null || medio <= maximo) &&
        (minimo === null || maximo === null || minimo <= maximo);

    const fonteValida =
        dados.fonte !== null &&
        dados.fonte.nome.trim().length > 0 &&
        dados.fonte.consultadoEm.trim().length > 0;

    if (
        !valoresValidos ||
        !fonteValida ||
        !dados.moeda.trim() ||
        !dados.item.trim()
    ) {
        return {
            categoria: dados.categoria,
            item: dados.item,
            unidade: dados.unidade,
            valorMinimo: null,
            valorMedio: null,
            valorMaximo: null,
            moeda: dados.moeda,
            fonte: null,
            confianca: "indisponivel",
        };
    }

    return {
        categoria: dados.categoria,
        item: dados.item,
        unidade: dados.unidade,
        valorMinimo: minimo,
        valorMedio: medio,
        valorMaximo: maximo,
        moeda: dados.moeda,
        fonte: dados.fonte,
        confianca: dados.confianca,
    };
}

export function criarRespostaSemPrecos(
    localizacao: LocalizacaoFinanceira
): DadosPrecos {
    return {
        localizacao,
        estimativas: [],
        mensagem: "Ainda não há dados de preços verificados para este destino.",
    };
}

export const ITENS_PRECO = {
    uber: "Corrida de aplicativo",
    onibus: "Passagem de ônibus",
    cafe: "Café da manhã",
    almoco: "Almoço",
    jantar: "Jantar",
    hotel: "Hotel (diária média)",
} as const;