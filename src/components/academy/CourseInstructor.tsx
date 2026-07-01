export default function CourseInstructor() {
  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Professor responsável
      </h2>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-[#F5F6F8] p-6">
        <p className="text-2xl font-bold text-slate-950">
          Equipe EduData IA
        </p>

        <p className="mt-4 leading-8 text-slate-600">
          Formação conduzida por especialistas da EduData IA, com foco em
          Evidências, Inclusão, Inteligência, tecnologia educacional e aplicação
          prática na realidade escolar.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {['Framework EDI', 'IA na Educação', 'Dados Educacionais'].map(
            (item) => (
              <span
                key={item}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A3A5E]"
              >
                {item}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  )
}