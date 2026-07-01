import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'
import AcademySection from '@/components/academy/AcademySection'

export default function AcademyPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main>
        <AcademySection />
      </main>

      <Footer />
    </>
  )
}