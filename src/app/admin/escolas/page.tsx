import SchoolForm from '@/components/admin/SchoolForm'
import SchoolTable from '@/components/admin/SchoolTable'

export default function AdminEscolasPage() {
  return (
    <main>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">
            BackOffice EIOS
          </p>

          <h1 className="mt-3 text-4xl font-bold text-[#081C2E]">
            Escolas
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            Gerencie a base institucional de escolas da EduData IA, incluindo
            busca, cadastro manual, importação futura e validação dos dados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#081C2E]">
            Importar Base
          </button>

          <button className="rounded-full bg-[#081C2E] px-5 py-3 text-sm font-semibold text-white">
            Cadastrar Escola
          </button>
        </div>
      </div>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_420px]">
        <SchoolTable />
        <SchoolForm />
      </section>
    </main>
  )
}