import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

import CoursePage from '@/components/academy/CoursePage'

interface Props {
  params: {
    slug: string
  }
}

export default function AcademyCourse({ params }: Props) {
  return (
    <>
      <AccessibilityBar />

      <Header />

      <CoursePage />

      <Footer />
    </>
  )
}