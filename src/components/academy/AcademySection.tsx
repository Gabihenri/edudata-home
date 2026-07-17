'use client'

import {
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import AcademyHero from './AcademyHero'
import CategoryFilter from './CategoryFilter'
import CourseGrid from './CourseGrid'

import {
  academyCategories,
  featuredAcademyCourses,
} from '@/lib/data/academyCourses'

const learningJourney = [
  {
    code: '01',
    title: 'Conhecer',
    description:
      'Acesse fundamentos, conceitos e tecnologias relacionados ao contexto educacional.',
  },
  {
    code: '02',
    title: 'Aplicar',
    description:
      'Transforme conhecimento em planejamento, práticas e soluções para situações reais.',
  },
  {
    code: '03',
    title: 'Evidenciar',
    description:
      'Registre produções, resultados e experiências construídas durante a formação.',
  },
  {
    code: '04',
    title: 'Evoluir',
    description:
      'Utilize a aprendizagem para fortalecer seu desenvolvimento profissional contínuo.',
  },
]

function normalizeSearchTerm(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase(
      'pt-BR',
    )
}

export default function AcademySection() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('Todos')

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const normalizedSearchTerm =
    normalizeSearchTerm(
      searchTerm,
    )

  const filteredCourses =
    useMemo(() => {
      return featuredAcademyCourses.filter(
        (course) => {
          const matchesCategory =
            selectedCategory ===
              'Todos' ||
            course.category ===
              selectedCategory

          if (
            !normalizedSearchTerm
          ) {
            return matchesCategory
          }

          const searchableContent = [
            course.title,
            course.subtitle,
            course.description,
            course.category,
            course.level,
            course.mode,
            course.instructor,
            ...course.tags,
          ]
            .join(' ')
            .toLocaleLowerCase(
              'pt-BR',
            )

          return (
            matchesCategory &&
            searchableContent.includes(
              normalizedSearchTerm,
            )
          )
        },
      )
    }, [
      normalizedSearchTerm,
      selectedCategory,
    ])

  const summary =
    useMemo(() => {
      const openEnrollments =
        featuredAcademyCourses.filter(
          (course) =>
            course.status
              .toLocaleLowerCase(
                'pt-BR',
              )
              .includes(
                'aberta',
              ),
        ).length

      const certificateCourses =
        featuredAcademyCourses.filter(
          (course) =>
            course.certificate,
        ).length

      return {
        total:
          featuredAcademyCourses.length,

        categories:
          academyCategories.length,

        openEnrollments,

        certificateCourses,
      }
    }, [])

  const hasActiveFilters =
    selectedCategory !==
      'Todos' ||
    searchTerm.trim().length >
      0

  function clearFilters():
    void {
    setSelectedCategory(
      'Todos',
    )

    setSearchTerm(
      '',
    )
  }

  return (
    <>
      <AcademyHero />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl sm:grid-cols-2 xl:grid-cols-4">
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Formações
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {summary.total}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cursos em destaque
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Áreas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {summary.categories}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Categorias formativas
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Inscrições
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.openEnrollments
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Formações abertas
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Certificação
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.certificateCourses
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cursos certificados
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#EEF3F7] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
                Jornada formativa
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                Formação conectada à prática profissional.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                A Academy organiza a aprendizagem como um processo
                contínuo, no qual conhecimento, aplicação e evidências
                fortalecem o desenvolvimento profissional.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-[#071827] p-5 text-white sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                  Integração EIOS
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  As formações se relacionam ao Framework EDI, aos
                  produtos especializados e aos desafios reais das
                  pessoas e instituições educacionais.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
              {learningJourney.map(
                (
                  step,
                  index,
                ) => (
                  <article
                    key={step.code}
                    className={`grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7 ${
                      index <
                      learningJourney.length -
                        1
                        ? 'border-b border-slate-200'
                        : ''
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {step.code}
                    </span>

                    <div>
                      <h3 className="text-lg font-bold text-[#071827]">
                        {step.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {
                          step.description
                        }
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="courses"
        className="scroll-mt-24 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <header className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Formações disponíveis
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Escolha uma formação para iniciar sua jornada.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Consulte os cursos desenvolvidos a partir do Framework
              EDI e das tecnologias aplicadas ao ecossistema EduData IA.
            </p>
          </header>

          <section
            aria-label="Busca e filtros de formações"
            className="mt-9 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
          >
            <div className="border-b border-slate-200 p-5 sm:p-7">
              <label
                htmlFor="academy-course-search"
                className="block text-sm font-bold text-[#071827]"
              >
                Buscar formação
              </label>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Pesquise por curso, tecnologia, área, nível ou tema.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  id="academy-course-search"
                  type="search"
                  value={
                    searchTerm
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchTerm(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ex.: inteligência artificial, dados ou Framework EDI"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100"
                />

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
                  >
                    Limpar filtros
                  </button>
                ) : null}
              </div>
            </div>

            <div className="px-5 pt-5 sm:px-7 sm:pt-6">
              <CategoryFilter
                categories={
                  academyCategories
                }
                selectedCategory={
                  selectedCategory
                }
                onSelectCategory={
                  setSelectedCategory
                }
              />
            </div>
          </section>

          <div className="mt-7 flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#071827]">
                {
                  filteredCourses.length
                }{' '}
                {filteredCourses.length ===
                1
                  ? 'formação encontrada'
                  : 'formações encontradas'}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Categoria:{' '}
                {
                  selectedCategory
                }
              </p>
            </div>

            {searchTerm.trim() ? (
              <p className="text-sm text-slate-500">
                Busca: “
                {searchTerm.trim()}
                ”
              </p>
            ) : null}
          </div>

          <div className="mt-7">
            <CourseGrid
              courses={
                filteredCourses
              }
            />
          </div>

          <section className="mt-12 overflow-hidden rounded-[1.75rem] bg-[#071827] text-white">
            <div className="flex flex-col gap-6 px-5 py-7 sm:px-7 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Inscrição
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  Encontre a formação adequada ao seu desenvolvimento.
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  A página de inscrição permite selecionar o curso e
                  registrar seu interesse na EduData Academy.
                </p>
              </div>

              <Link
                href="/academy/inscricao"
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
              >
                Realizar inscrição
              </Link>
            </div>
          </section>
        </div>
      </section>
    </>
  )
}