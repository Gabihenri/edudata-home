import CourseHero from './CourseHero'
import CourseContent from './CourseContent'
import CourseModules from './CourseModules'
import CourseInstructor from './CourseInstructor'
import CourseFAQ from './CourseFAQ'
import CourseRelated from './CourseRelated'
import CourseSidebar from './CourseSidebar'
import EnrollmentForm from './EnrollmentForm'

export default function CoursePage() {
  return (
    <main className="bg-[#F8FAFC] py-20">
      <div className="mx-auto max-w-7xl px-6">

        <CourseHero />

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_360px]">

          <div className="space-y-10">

            <CourseContent />

            <CourseModules />

            <CourseInstructor />

            <CourseFAQ />

            <CourseRelated />

          </div>

          <div className="space-y-8 lg:sticky lg:top-28 h-fit">

            <CourseSidebar />

            <div id="inscricao">
              <EnrollmentForm />
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}