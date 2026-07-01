import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'
import AcademySection from '@/components/academy/AcademySection'

export const metadata = {
  title: 'EduData IA Academy',
  description:
    'Cursos, formações e certificações da EduData IA baseados no Framework EDI.',
}

export default function AcademyPage() {
  return (
    <>
      <AccessibilityBar />

      <Header />

      <main className="min-h-screen bg-white">
        <AcademySection />
      </main>

      <Footer />
    </>
  )
}
