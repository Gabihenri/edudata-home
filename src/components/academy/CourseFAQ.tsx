export default function CourseFAQ() {
  const faqs = [
    {
      question: 'O curso emite certificado?',
      answer:
        'Sim. Os cursos da EduData IA Academy possuem certificado de participação conforme a carga horária informada.',
    },
    {
      question: 'O curso será online?',
      answer:
        'Nesta primeira fase, os cursos serão organizados em formato online, com estrutura preparada para futuras turmas híbridas ou presenciais.',
    },
    {
      question: 'Preciso ter conhecimento avançado?',
      answer:
        'Não. Os cursos iniciais foram pensados para professores e profissionais da educação em diferentes níveis de domínio tecnológico.',
    },
    {
      question: 'A inscrição já confirma minha vaga?',
      answer:
        'A inscrição registra seu interesse. A confirmação da vaga será enviada posteriormente pela equipe EduData IA.',
    },
  ]

  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Perguntas frequentes
      </h2>

      <div className="mt-8 space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-2xl border border-slate-200 p-6"
          >
            <h3 className="text-xl font-bold text-slate-950">
              {faq.question}
            </h3>

            <p className="mt-3 leading-7 text-slate-600">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}