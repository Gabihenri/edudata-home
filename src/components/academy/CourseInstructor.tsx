import { Course } from '@/types/course'

interface CourseInstructorProps {
  course: Course
}

export default function CourseInstructor({
  course,
}: CourseInstructorProps) {
  return (
    <section className="rounded-3xl bg-white p-10 shadow-sm">
      <h2 className="text-3xl font-bold text-[#0A3A5E]">
        Instrutor
      </h2>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-8">
        <p className="text-2xl font-bold text-slate-900">
          {course.instructor}
        </p>

        <p className="mt-5 leading-8 text-slate-600">
          O curso é desenvolvido pela equipe especializada da EduData IA,
          fundamentado no Framework EDI e apoiado pelo EDI Intelligence
          Engine, garantindo uma formação alinhada às melhores práticas em
          inovação, gestão educacional e desenvolvimento profissional.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {[
            'Framework EDI',
            'Inteligência Educacional',
            'Tecnologia',
            'Formação Continuada',
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#0A3A5E] px-4 py-2 text-sm font-semibold text-white"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}