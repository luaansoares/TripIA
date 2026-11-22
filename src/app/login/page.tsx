
"use client";

import { useState } from "react";
import { cadastrar, entrar } from "./actions";
import { Compass, Mail, Lock, ArrowRight, User } from "lucide-react";

export default function LoginPage() {
    const [modoCadastro, setModoCadastro] = useState(false);

    return (
        <main className="min-h-screen bg-[#F0F7FA] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl min-h-[600px] bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">

                {/* Painel de apresentação */}
                <section className="bg-[#102A43] text-white p-10 md:p-12 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-12">
                            <div className="bg-[#167D8D] p-3 rounded-xl">
                                <Compass size={30} />
                            </div>
                            <span className="text-2xl font-bold">TripIA</span>
                        </div>

                        <h1 className="text-4xl font-bold leading-tight mb-5">
                            Sua próxima aventura começa aqui.
                        </h1>

                        <p className="text-gray-300 text-lg leading-relaxed">
                            Planeje, explore e descubra novos destinos com
                            a inteligência artificial do TripIA.
                        </p>
                    </div>

                    <div className="mt-12">
                        <p className="text-[#38BFC1] font-semibold">
                            Planeje. Explore. Viaje.
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Sua jornada, com inteligência.
                        </p>
                    </div>
                </section>

                {/* Formulário */}
                <section className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-[#102A43]">
                            {modoCadastro ? "Crie sua conta" : "Bem-vindo de volta!"}
                        </h2>

                        <p className="text-gray-500 mt-2">
                            {modoCadastro
                                ? "Comece a planejar suas próximas viagens."
                                : "Entre na sua conta para continuar sua jornada."}
                        </p>
                    </div>

                    <form
                        action={modoCadastro ? cadastrar : entrar}
                        className="space-y-5"
                    >
                        {/* Nome de exibição: somente no cadastro */}
                        {modoCadastro && (
                            <div>
                                <label className="block text-sm font-semibold text-[#102A43] mb-2">
                                    Como você gostaria de ser chamado?
                                </label>

                                <div className="relative">
                                    <User
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={19}
                                    />

                                    <input
                                        type="text"
                                        name="nome"
                                        required
                                        minLength={2}
                                        maxLength={40}
                                        placeholder="Ex.: Luan"
                                        className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#167D8D] focus:ring-2 focus:ring-[#167D8D]/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* E-mail */}
                        <div>
                            <label className="block text-sm font-semibold text-[#102A43] mb-2">
                                E-mail
                            </label>

                            <div className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={19}
                                />

                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="seuemail@exemplo.com"
                                    className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#167D8D] focus:ring-2 focus:ring-[#167D8D]/20"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label className="block text-sm font-semibold text-[#102A43] mb-2">
                                Senha
                            </label>

                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={19}
                                />

                                <input
                                    type="password"
                                    name="senha"
                                    required
                                    minLength={modoCadastro ? 8 : 1}
                                    placeholder="Digite sua senha"
                                    className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#167D8D] focus:ring-2 focus:ring-[#167D8D]/20"
                                />
                            </div>

                            {modoCadastro && (
                                <p className="text-xs text-gray-400 mt-2">
                                    A senha deve ter pelo menos 8 caracteres.
                                </p>
                            )}
                        </div>

                        {/* Botão */}
                        <button
                            type="submit"
                            className="w-full bg-[#167D8D] hover:bg-[#126674] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            {modoCadastro ? "Criar minha conta" : "Entrar"}
                            <ArrowRight size={19} />
                        </button>
                    </form>

                    {/* Alternar entre login e cadastro */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            {modoCadastro
                                ? "Já possui uma conta?"
                                : "Ainda não possui uma conta?"}
                        </p>

                        <button
                            type="button"
                            onClick={() => setModoCadastro(!modoCadastro)}
                            className="text-[#167D8D] font-bold mt-2 hover:underline"
                        >
                            {modoCadastro ? "Fazer login" : "Criar uma conta"}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
