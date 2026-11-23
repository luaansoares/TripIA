
import type { LocalizacaoFinanceira } from "./localizacao";
import {
    ITENS_PRECO,
    criarEstimativaPreco,
    criarRespostaSemPrecos,
    type CategoriaPreco,
    type DadosPrecos,
    type UnidadePreco,
} from "./precos";

// Preços-base de referência em USD (premissas do TripIA, não dados oficiais).
const BASE_USD: {
    item: string;
    categoria: CategoriaPreco;
    unidade: UnidadePreco;
    usd: number;
}[] = [
    { item: ITENS_PRECO.uber, categoria: "transporte", unidade: "por corrida", usd: 15 },
    { item: ITENS_PRECO.onibus, categoria: "transporte", unidade: "por passagem", usd: 2.5 },
    { item: ITENS_PRECO.cafe, categoria: "alimentacao", unidade: "por refeição", usd: 8 },
    { item: ITENS_PRECO.almoco, categoria: "alimentacao", unidade: "por refeição", usd: 18 },
    { item: ITENS_PRECO.jantar, categoria: "alimentacao", unidade: "por refeição", usd: 28 },
    { item: ITENS_PRECO.hotel, categoria: "hospedagem", unidade: "por noite", usd: 110 },
];

const FATOR_MIN = 0.7;
const FATOR_MAX = 1.4;

// O nível de preços (EUA = 1) fica em torno de 0,2 a 1,6 na prática.
// Fora dessa faixa, trata-se como dado suspeito e não estima.
const NIVEL_MIN = 0.15;
const NIVEL_MAX = 2;

const arredondar = (v: number) => Math.round(v * 100) / 100;

type Indicador = { valor: number; ano: string };

async function ultimoValor(
    codigoPais: string,
    indicador: string
): Promise<Indicador | null> {
    try {
        const r = await fetch(
            `https://api.worldbank.org/v2/country/${codigoPais}/indicator/${indicador}?format=json&mrnev=1`,
            { next: { revalidate: 60 * 60 * 24 } }
        );

        if (!r.ok) return null;

        const json = await r.json();
        const registro = json?.[1]?.[0];
        const valor = registro?.value;

        if (
            typeof valor !== "number" ||
            !Number.isFinite(valor) ||
            valor <= 0
        ) {
            return null;
        }

        return {
            valor,
            ano: String(registro?.date ?? ""),
        };
    } catch (erro) {
        console.warn(
            "Falha ao consultar o Banco Mundial:",
            indicador,
            erro
        );
        return null;
    }
}

/**
 * Preço local estimado =
 * preço-base (USD) × nível de preços do país × câmbio oficial.
 *
 * - PA.NUS.GDP.PLI: índice de nível de preços do PIB.
 *   Os EUA são representados por 100. Dividimos por 100
 *   para obter a escala anterior (EUA = 1).
 *
 * - PA.NUS.FCRF: câmbio oficial (moeda local por USD).
 *   Converte o preço estimado para a moeda local.
 *
 * O nível de preços considera o PIB inteiro, não apenas turismo.
 * Portanto, é uma aproximação, não um preço turístico oficial.
 */
export async function criarDadosPrecosEstimados(
    localizacao: LocalizacaoFinanceira
): Promise<DadosPrecos> {
    const moeda = localizacao.moeda;
    const codigo = localizacao.codigoPais;

    if (!moeda || !codigo) {
        return criarRespostaSemPrecos(localizacao);
    }

    const eUS = codigo === "US";

    const [nivel, cambio] = await Promise.all([
        eUS
            ? Promise.resolve<Indicador>({ valor: 100, ano: "" })
            : ultimoValor(codigo, "PA.NUS.GDP.PLI"),

        eUS
            ? Promise.resolve<Indicador>({ valor: 1, ano: "" })
            : ultimoValor(codigo, "PA.NUS.FCRF"),
    ]);

    // Converte o índice (EUA = 100) para a escala (EUA = 1).
    const nivelAjustado = nivel
        ? { ...nivel, valor: nivel.valor / 100 }
        : null;

    console.log("[TRIPIA FINANCEIRO] Diagnóstico:", {
        pais: localizacao.pais,
        codigoPais: codigo,
        moeda,
        nivelOriginal: nivel,
        nivelAjustado,
        cambio,
    });

    // Sem os dois dados ou com nível fora da faixa, não estima.
    if (
        !nivelAjustado ||
        !cambio ||
        nivelAjustado.valor < NIVEL_MIN ||
        nivelAjustado.valor > NIVEL_MAX
    ) {
        return criarRespostaSemPrecos(localizacao);
    }

    const anoReferencia = nivelAjustado.ano
        ? ` (dado de ${nivelAjustado.ano})`
        : "";

    const fonte = {
        nome: `Banco Mundial (nível de preços e câmbio)${anoReferencia} + preços-base TripIA`,
        tipo: "estimado" as const,
        consultadoEm: new Date().toISOString().slice(0, 10),
    };

    const estimativas = BASE_USD.map((b) => {
        const medio =
            b.usd * nivelAjustado.valor * cambio.valor;

        return criarEstimativaPreco({
            categoria: b.categoria,
            item: b.item,
            unidade: b.unidade,
            valorMinimo: arredondar(medio * FATOR_MIN),
            valorMedio: arredondar(medio),
            valorMaximo: arredondar(medio * FATOR_MAX),
            moeda,
            fonte,
            confianca: "baixa",
        });
    });

    return {
        localizacao,
        estimativas,
        mensagem:
            "Estimativas calculadas por modelo (nível de preços do país), não são preços oficiais.",
    };
}
