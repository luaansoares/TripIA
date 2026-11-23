
import {
    Wallet,
    Users,
    CalendarDays,
    MapPin,
    Car,
    Bus,
    Coffee,
    Utensils,
    BedDouble,
    Ticket,
    TrendingDown,
    Lightbulb,
    Plane,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

const despesas = [
    { nome: "Hospedagem", valor: 828, percentual: 42, cor: "#167D8D", icone: BedDouble },
    { nome: "Alimentação", valor: 572, percentual: 29, cor: "#38BFC1", icone: Utensils },
    { nome: "Transporte", valor: 296, percentual: 15, cor: "#F59E0B", icone: Car },
    { nome: "Passeios", valor: 272, percentual: 14, cor: "#8B5CF6", icone: Ticket },
];

const dias = [
    { dia: "Dia 01", descricao: "Chegada e passeio pela cidade", valor: 458 },
    { dia: "Dia 02", descricao: "Praias e passeios", valor: 510 },
    { dia: "Dia 03", descricao: "Cultura e lazer", valor: 496 },
    { dia: "Dia 04", descricao: "Compras e retorno", valor: 504 },
];

const dinheiro = (valor: number) =>
    valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

export default function CustosPage() {
    const total = 1968;

    return (
        <main className="min-h-screen bg-[#F0F7FA] p-4 md:p-7">
            <div className="mx-auto max-w-[1500px] space-y-6">

                {/* Cabeçalho */}
                <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-[#D8F3F0] p-3 text-[#167D8D]">
                                <Wallet size={30} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#102A43] md:text-3xl">
                                    Custos da viagem
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Planeje seus gastos e viaje com tranquilidade.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102A43]">
                            <MapPin size={18} className="text-[#167D8D]" />
                            Fortaleza, CE
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102A43]">
                            <CalendarDays size={18} className="text-[#167D8D]" />
                            4 dias
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102A43]">
                            <Users size={18} className="text-[#167D8D]" />
                            2 pessoas
                        </div>
                    </div>
                </header>

                {/* Indicadores principais */}
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#102A43] to-[#167D8D] p-6 text-white shadow-sm">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-sm text-white/80">
                                <Wallet size={19} />
                                Custo total estimado
                            </div>
                            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                                {dinheiro(total)}
                            </h2>
                            <p className="mt-2 text-sm text-white/75">
                                Para 2 pessoas durante 4 dias
                            </p>
                        </div>
                        <Plane className="absolute -bottom-4 -right-3 h-32 w-32 rotate-[-20deg] text-white/10" />
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users size={19} className="text-[#167D8D]" />
                            Custo por pessoa
                        </div>
                        <h2 className="mt-3 text-3xl font-bold text-[#102A43]">
                            {dinheiro(total / 2)}
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Divisão estimada da viagem
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays size={19} className="text-[#167D8D]" />
                            Média de gastos por dia
                        </div>
                        <h2 className="mt-3 text-3xl font-bold text-[#102A43]">
                            {dinheiro(total / 4)}
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Média diária para o grupo
                        </p>
                    </div>
                </section>

                {/* Transporte e alimentação */}
                <section className="grid gap-5 xl:grid-cols-2">

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-[#E0F2FE] p-2.5 text-[#167D8D]">
                                <Car size={23} />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#102A43]">
                                    Transporte na cidade
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Estimativas por deslocamento
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-slate-100 p-3 text-[#102A43]">
                                        <Car size={21} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#102A43]">Uber / App</p>
                                        <p className="text-xs text-slate-400">Corridas de 5 a 10 km</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#167D8D]">R$ 18 – 35</p>
                                    <p className="text-xs text-slate-400">Por corrida</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                        <Bus size={21} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#102A43]">Ônibus urbano</p>
                                        <p className="text-xs text-slate-400">Tarifa convencional</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#167D8D]">R$ 4,50</p>
                                    <p className="text-xs text-slate-400">Por passagem</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-500">
                                <Utensils size={23} />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#102A43]">
                                    Alimentação
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Estimativa por pessoa e refeição
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { nome: "Café da manhã", descricao: "Padaria ou cafeteria", valor: "R$ 15 – 25", Icone: Coffee },
                                { nome: "Almoço", descricao: "Restaurante ou self-service", valor: "R$ 35 – 60", Icone: Utensils },
                                { nome: "Jantar", descricao: "Restaurante ou gastronomia local", valor: "R$ 40 – 70", Icone: Utensils },
                            ].map((item) => (
                                <div key={item.nome} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-orange-50 p-2.5 text-orange-500">
                                            <item.Icone size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#102A43]">{item.nome}</p>
                                            <p className="text-xs text-slate-400">{item.descricao}</p>
                                        </div>
                                    </div>
                                    <p className="whitespace-nowrap rounded-lg bg-[#E0F5EE] px-3 py-2 text-sm font-bold text-[#167D8D]">
                                        {item.valor}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Distribuição e previsão diária */}
                <section className="grid gap-5 xl:grid-cols-2">

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h2 className="font-bold text-[#102A43]">
                            Distribuição dos gastos
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Participação de cada categoria no orçamento
                        </p>

                        <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row">
                            <div
                                className="flex h-48 w-48 shrink-0 items-center justify-center rounded-full"
                                style={{
                                    background: "conic-gradient(#167D8D 0% 42%, #38BFC1 42% 71%, #F59E0B 71% 86%, #8B5CF6 86% 100%)",
                                }}
                            >
                                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                                    <span className="text-xs text-slate-400">Total estimado</span>
                                    <strong className="text-lg text-[#102A43]">
                                        {dinheiro(total)}
                                    </strong>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                {despesas.map((item) => (
                                    <div key={item.nome} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.cor }} />
                                            <span className="text-sm text-slate-600">{item.nome}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#102A43]">{dinheiro(item.valor)}</p>
                                            <p className="text-xs text-slate-400">{item.percentual}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <CalendarDays className="text-[#167D8D]" size={23} />
                            <div>
                                <h2 className="font-bold text-[#102A43]">
                                    Estimativa diária
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Previsão de gastos para o grupo
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {dias.map((item) => (
                                <div key={item.dia}>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-[#102A43]">{item.dia}</p>
                                            <p className="text-xs text-slate-400">{item.descricao}</p>
                                        </div>
                                        <p className="whitespace-nowrap text-sm font-bold text-[#167D8D]">
                                            {dinheiro(item.valor)}
                                        </p>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#38BFC1]"
                                            style={{ width: `${(item.valor / 600) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Economia */}
                <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-2xl bg-gradient-to-br from-[#DDF8E9] to-[#E8F8F5] p-6">
                        <div className="flex items-center gap-3 text-emerald-700">
                            <TrendingDown size={27} />
                            <h2 className="font-bold">Controle financeiro</h2>
                        </div>
                        <p className="mt-4 text-sm text-slate-600">
                            Acompanhe os gastos da viagem e encontre oportunidades para economizar.
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                            <ArrowDownRight size={18} />
                            Planeje antes de gastar
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
                        <div className="mb-4 flex items-center gap-3 text-amber-700">
                            <Lightbulb size={25} />
                            <h2 className="font-bold">Dicas para economizar</h2>
                        </div>
                        <ul className="space-y-3 text-sm text-slate-700">
                            <li className="flex gap-2">
                                <ArrowUpRight size={17} className="shrink-0 text-emerald-600" />
                                Utilize ônibus em trajetos mais longos quando for conveniente.
                            </li>
                            <li className="flex gap-2">
                                <ArrowUpRight size={17} className="shrink-0 text-emerald-600" />
                                Divida corridas de aplicativo entre os viajantes.
                            </li>
                            <li className="flex gap-2">
                                <ArrowUpRight size={17} className="shrink-0 text-emerald-600" />
                                Compare restaurantes e opções de alimentação local.
                            </li>
                            <li className="flex gap-2">
                                <ArrowUpRight size={17} className="shrink-0 text-emerald-600" />
                                Reserve hospedagens e passeios com antecedência.
                            </li>
                        </ul>
                    </div>
                </section>

                <p className="pb-3 text-center text-xs text-slate-400">
                    TripIA • Valores ilustrativos para demonstração do painel financeiro.
                </p>
            </div>
        </main>
    );
}
