'use client'

export default function Error() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
      <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#081C2E]">
          Não foi possível carregar o Professor Digital.
        </h1>

        <p className="mt-4 text-slate-600">
          Tente atualizar a página em alguns instantes.
        </p>
      </div>
    </main>
  )
}