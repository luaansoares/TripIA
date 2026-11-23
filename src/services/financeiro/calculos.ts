export type ResumoFinanceiro = {
    moeda: string;
    totalTransporte: number;
    totalAlimentacao: number;
    totalHospedagem: number;
    totalDiario: number;
    totalViagem: number;
    totalPorPessoa: number;
};

const arredondar = (v: number) => Math.round(v * 100) / 100;
const valido = (v: number) => Number.isFinite(v) && v >= 0;

export function calcularResumoFinanceiro(dados: {
    transporteDiario: number;            // total do grupo por dia
    alimentacaoDiariaPorPessoa: number;  // café + almoço + jantar
    hospedagemPorNoite?: number;         // total do grupo por noite (opcional)
    quantidadeDias: number;
    quantidadePessoas: number;
    moeda: string;
}): ResumoFinanceiro | null {
    const dias = Math.floor(dados.quantidadeDias);
    const pessoas = Math.floor(dados.quantidadePessoas);
    const hospedagem = dados.hospedagemPorNoite ?? 0;

    if (
        !valido(dados.transporteDiario) ||
        !valido(dados.alimentacaoDiariaPorPessoa) ||
        !valido(hospedagem) ||
        !Number.isFinite(dias) ||
        !Number.isFinite(pessoas) ||
        dias < 1 ||
        pessoas < 1 ||
        !dados.moeda.trim()
    ) {
        return null;
    }

    const noites = Math.max(0, dias - 1);

    const totalTransporte = dados.transporteDiario * dias;
    const totalAlimentacao = dados.alimentacaoDiariaPorPessoa * dias * pessoas;
    const totalHospedagem = hospedagem * noites;
    const totalDiario = dados.transporteDiario + dados.alimentacaoDiariaPorPessoa * pessoas;
    const totalViagem = totalTransporte + totalAlimentacao + totalHospedagem;

    return {
        moeda: dados.moeda,
        totalTransporte: arredondar(totalTransporte),
        totalAlimentacao: arredondar(totalAlimentacao),
        totalHospedagem: arredondar(totalHospedagem),
        totalDiario: arredondar(totalDiario),
        totalViagem: arredondar(totalViagem),
        totalPorPessoa: arredondar(totalViagem / pessoas),
    };
}