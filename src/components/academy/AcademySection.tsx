'use client'

import { useMemo, useState } from 'react'

import AcademyHero from './AcademyHero'
import CategoryFilter from './CategoryFilter'
import CourseGrid from './CourseGrid'

import {
  academyCategories,
  featuredAcademyCourses,
} from '@/lib/data/academyCourses'

export default function AcademySection() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return featuredAcademyCourses
    }

    return featuredAcademyCourses.filter(
      (course) => course.category === selectedCategory,
    )
  }, [selectedCategory])

  return (
    <>
      <AcademyHero />

      <section
        id="courses"
        className="bg-white px-6 py-24 md:px-20"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-14">

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Cursos em Destaque
            </p>

            <h2 className="text-4xl font-bold text-[#0A3A5E] md:text-5xl">
              Comece sua jornada na EduData IA Academy
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Escolha uma das formações desenvolvidas a partir do
              Framework EDI e inicie seu desenvolvimento profissional
              no ecossistema EduData IA.
            </p>

          </div>

          <CategoryFilter
            categories={academyCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <CourseGrid
            courses={filteredCourses}
          />

          <div className="mt-16 flex justify-center">

            <a
              href="#participacao"
              className="rounded-full bg-[#0A3A5E] px-8 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Conheça a Academy
            </a>

          </div>

        </div>
      </section>
    </>
  )
}