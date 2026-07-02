import { Course } from '@/types/course'

interface CourseFAQProps {
  course: Course
}

export default function CourseFAQ({ course }: CourseFAQProps) {
  const faqs = [
    {
      question: 'O curso emite certificado?',
      answer: course.certificate
        ? `Sim. O curso ${course.title} possui certificado conforme a carga horária informada.`
        : 'Este curso não possui certificado nesta versão.',
    },
    {
      question: 'Qual é a modalidade do curso?',
      answer: `A modalidade prevista para este curso é ${course.mode}.`,
    },
    {
      question: 'Preciso ter conhecimento avançado?',
      answer: `O nível indicado para este curso é ${course.level}.`,
    },
    {
      question: 'Como funciona a inscrição?',
      answer:
        'A inscrição registra seu interesse. A confirmação será enviada posteriormente pela equipe EduData IA.',
    },
  ]

  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Perguntas Frequentes
      </h2>

      <div className="mt-8 space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6"
          >
            <h3 className="text-xl font-bold text-slate-900">
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