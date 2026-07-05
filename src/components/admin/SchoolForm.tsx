export default function SchoolForm() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-[#081C2E]">
        Cadastrar Escola
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        Use este cadastro quando a escola não estiver disponível na base oficial.
        O registro será marcado para validação posterior.
      </p>

      <form className="mt-6 space-y-4">
        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Nome da escola" />
        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Código INEP" />

        <div className="grid gap-4 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Rede" />
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Estado" />
        </div>

        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Cidade" />
        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Diretoria de Ensino" />
        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Diretor" />
        <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Coordenador" />

        <div className="grid gap-4 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Telefone" />
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Email" />
        </div>

        <textarea
          className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Observações"
        />

        <button
          type="button"
          className="w-full rounded-2xl bg-[#081C2E] px-5 py-4 font-semibold text-white"
        >
          Salvar Escola
        </button>
      </form>
    </div>
  )
}