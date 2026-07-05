const schools = [
  {
    inep: '00000000',
    name: 'E.E. República do Suriname',
    network: 'Estadual',
    city: 'São Paulo',
    state: 'SP',
    director: 'Não informado',
    status: 'Ativa',
  },
]

export default function SchoolTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-[#081C2E]">
          Banco de Escolas
        </h2>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Pesquisar escola, INEP, cidade ou rede"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
          />

          <button className="rounded-2xl bg-cyan-700 px-6 py-3 font-semibold text-white">
            Pesquisar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4">INEP</th>
              <th className="px-6 py-4">Escola</th>
              <th className="px-6 py-4">Rede</th>
              <th className="px-6 py-4">Cidade</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Diretor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {schools.map((school) => (
              <tr key={school.inep} className="border-t border-slate-100">
                <td className="px-6 py-4">{school.inep}</td>
                <td className="px-6 py-4 font-semibold text-[#081C2E]">
                  {school.name}
                </td>
                <td className="px-6 py-4">{school.network}</td>
                <td className="px-6 py-4">{school.city}</td>
                <td className="px-6 py-4">{school.state}</td>
                <td className="px-6 py-4">{school.director}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {school.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="font-semibold text-cyan-700">Ver</button>
                    <button className="font-semibold text-[#081C2E]">Editar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
