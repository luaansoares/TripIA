export type LocalizacaoFinanceira = {
    municipio: string;
    estado: string | null;
    pais: string;
    codigoPais: string;
    moeda: string | null;
    simboloMoeda: string | null;
    idioma: string;
};

type DadosMoeda = {
    moeda: string;
    simbolo: string;
    idioma: string;
};

// Países com moeda e idioma definidos explicitamente.
const MOEDAS_POR_PAIS: Record<string, DadosMoeda> = {
    BR: { moeda: "BRL", simbolo: "R$", idioma: "pt-BR" },
    US: { moeda: "USD", simbolo: "US$", idioma: "en-US" },
    FR: { moeda: "EUR", simbolo: "€", idioma: "fr-FR" },
    PT: { moeda: "EUR", simbolo: "€", idioma: "pt-PT" },
    ES: { moeda: "EUR", simbolo: "€", idioma: "es-ES" },
    IT: { moeda: "EUR", simbolo: "€", idioma: "it-IT" },
    DE: { moeda: "EUR", simbolo: "€", idioma: "de-DE" },
    AR: { moeda: "ARS", simbolo: "$", idioma: "es-AR" },
    CL: { moeda: "CLP", simbolo: "$", idioma: "es-CL" },
    UY: { moeda: "UYU", simbolo: "$U", idioma: "es-UY" },
    MX: { moeda: "MXN", simbolo: "$", idioma: "es-MX" },
    GB: { moeda: "GBP", simbolo: "£", idioma: "en-GB" },
    JP: { moeda: "JPY", simbolo: "¥", idioma: "ja-JP" },
    CA: { moeda: "CAD", simbolo: "CA$", idioma: "en-CA" },
    CH: { moeda: "CHF", simbolo: "CHF", idioma: "de-CH" },
    AU: { moeda: "AUD", simbolo: "A$", idioma: "en-AU" },
    NZ: { moeda: "NZD", simbolo: "NZ$", idioma: "en-NZ" },
    CO: { moeda: "COP", simbolo: "$", idioma: "es-CO" },
    PE: { moeda: "PEN", simbolo: "S/", idioma: "es-PE" },
    PY: { moeda: "PYG", simbolo: "₲", idioma: "es-PY" },
    BO: { moeda: "BOB", simbolo: "Bs.", idioma: "es-BO" },
    IN: { moeda: "INR", simbolo: "₹", idioma: "en-IN" },
    CN: { moeda: "CNY", simbolo: "¥", idioma: "zh-CN" },
    KR: { moeda: "KRW", simbolo: "₩", idioma: "ko-KR" },
    ZA: { moeda: "ZAR", simbolo: "R", idioma: "en-ZA" },
    EG: { moeda: "EGP", simbolo: "E£", idioma: "ar-EG" },
    TR: { moeda: "TRY", simbolo: "₺", idioma: "tr-TR" },
    TH: { moeda: "THB", simbolo: "฿", idioma: "th-TH" },
    ID: { moeda: "IDR", simbolo: "Rp", idioma: "id-ID" },
    SG: { moeda: "SGD", simbolo: "S$", idioma: "en-SG" },
    AE: { moeda: "AED", simbolo: "د.إ", idioma: "ar-AE" },
    SA: { moeda: "SAR", simbolo: "ر.س", idioma: "ar-SA" },
    NL: { moeda: "EUR", simbolo: "€", idioma: "nl-NL" },
    BE: { moeda: "EUR", simbolo: "€", idioma: "nl-BE" },
    AT: { moeda: "EUR", simbolo: "€", idioma: "de-AT" },
    IE: { moeda: "EUR", simbolo: "€", idioma: "en-IE" },
    GR: { moeda: "EUR", simbolo: "€", idioma: "el-GR" },
    // Acrescentados:
    HR: { moeda: "EUR", simbolo: "€", idioma: "hr-HR" },
    FI: { moeda: "EUR", simbolo: "€", idioma: "fi-FI" },
    BG: { moeda: "EUR", simbolo: "€", idioma: "bg-BG" },
    PL: { moeda: "PLN", simbolo: "zł", idioma: "pl-PL" },
    SE: { moeda: "SEK", simbolo: "kr", idioma: "sv-SE" },
    NO: { moeda: "NOK", simbolo: "kr", idioma: "nb-NO" },
    DK: { moeda: "DKK", simbolo: "kr.", idioma: "da-DK" },
    CZ: { moeda: "CZK", simbolo: "Kč", idioma: "cs-CZ" },
    VN: { moeda: "VND", simbolo: "₫", idioma: "vi-VN" },
    PH: { moeda: "PHP", simbolo: "₱", idioma: "en-PH" },
    MA: { moeda: "MAD", simbolo: "DH", idioma: "ar-MA" },
    CR: { moeda: "CRC", simbolo: "₡", idioma: "es-CR" },
};

const cacheMoedas = new Map<string, DadosMoeda | null>();

export function obterMoedaPorPais(codigoPais: string | null | undefined) {
    const codigo = (codigoPais ?? "").trim().toUpperCase();
    return MOEDAS_POR_PAIS[codigo] ?? cacheMoedas.get(codigo) ?? null;
}

// Fallback para países fora do mapa (REST Countries, gratuita e sem chave).
export async function resolverMoedaPorPais(
    codigoPais: string | null | undefined
): Promise<DadosMoeda | null> {
    const codigo = (codigoPais ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(codigo)) return null;

    const conhecida = obterMoedaPorPais(codigo);
    if (conhecida) return conhecida;
    if (cacheMoedas.has(codigo)) return cacheMoedas.get(codigo) ?? null;

    try {
        const r = await fetch(
            `https://restcountries.com/v3.1/alpha/${codigo}?fields=currencies`,
            { cache: "force-cache" }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const dados = await r.json();
        const moedas = (Array.isArray(dados) ? dados[0] : dados)?.currencies ?? {};
        const [sigla, info]: [string, any] = Object.entries(moedas)[0] ?? ["", null];

        const resultado = sigla
            ? { moeda: sigla, simbolo: info?.symbol ?? sigla, idioma: "en-US" }
            : null;

        cacheMoedas.set(codigo, resultado);
        return resultado;
    } catch (erro) {
        console.warn("Falha ao resolver moeda do país:", codigo, erro);
        return null; // não guarda a falha no cache, para tentar de novo depois
    }
}

export function formatarMoeda(
    valor: number,
    moeda: string,
    idioma: string
): string {
    if (!Number.isFinite(valor)) {
        return "Valor indisponível";
    }

    try {
        return new Intl.NumberFormat(idioma, {
            style: "currency",
            currency: moeda,
            maximumFractionDigits: 2,
        }).format(valor);
    } catch {
        return `${valor.toFixed(2)} ${moeda}`;
    }
}

type EntradaLocalizacao = {
    municipio: string;
    estado?: string | null;
    pais: string;
    codigoPais: string;
};

function montarLocalizacao(
    dados: EntradaLocalizacao,
    moeda: DadosMoeda | null
): LocalizacaoFinanceira {
    return {
        municipio: dados.municipio,
        estado: dados.estado || null,
        pais: dados.pais,
        codigoPais: (dados.codigoPais ?? "").trim().toUpperCase(),
        moeda: moeda?.moeda ?? null,
        simboloMoeda: moeda?.simbolo ?? null,
        idioma: moeda?.idioma ?? "en-US",
    };
}

// Versão síncrona (só usa o mapa local).
export function criarLocalizacaoFinanceira(
    dados: EntradaLocalizacao
): LocalizacaoFinanceira {
    return montarLocalizacao(dados, obterMoedaPorPais(dados.codigoPais));
}

// Versão com fallback para qualquer país.
export async function criarLocalizacaoFinanceiraUniversal(
    dados: EntradaLocalizacao
): Promise<LocalizacaoFinanceira> {
    return montarLocalizacao(dados, await resolverMoedaPorPais(dados.codigoPais));
}