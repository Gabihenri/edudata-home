import { notFound } from 'next/navigation'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AccessibilityBar from '@/components/layout/AccessibilityBar'

import CoursePage from '@/components/academy/CoursePage'

import {
  academyCourses,
  getAcademyCourseBySlug,
} from '@/lib/data/academyCourses'

interface Props {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return academyCourses.map((course) => ({
    slug: course.slug,
  }))
}

export default function AcademyCourse({ params }: Props) {
  const course = getAcademyCourseBySlug(params.slug)

  if (!course) {
    notFound()
  }

  return (
    <>
      <AccessibilityBar />

      <Header />

      <CoursePage course={course} />

      <Footer />
    </>
  )
}
