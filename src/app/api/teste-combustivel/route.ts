
import { NextResponse } from "next/server";
import { buscarPrecoCombustivel } from "@/services/financeiro/combustivel";

export async function GET() {
    const resultado = await buscarPrecoCombustivel("BR");

    return NextResponse.json(resultado);
}
