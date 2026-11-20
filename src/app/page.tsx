
import Sidebar from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">

      <Sidebar />

      <main className="flex-1 p-8">
        <header className="mb-10">
          <p className="text-sm text-slate-500">
            BEM-VINDO AO TRIPIA
          </p>

          <h2 className="text-3xl font-bold text-[#102A43] mt-2">
            Sua próxima viagem começa aqui.
          </h2>

          <p className="text-slate-500 mt-2">
            Descubra destinos e planeje experiências incríveis com IA.
          </p>
        </header>

        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-semibold text-[#102A43]">
            Para onde vamos viajar?
          </h3>

          <p className="text-slate-500 mt-2">
            Em breve, você poderá planejar sua próxima aventura
            com a ajuda da inteligência artificial.
          </p>
        </section>
      </main>

    </div>
  );
}
