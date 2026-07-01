import { AcademyCourse, AcademyEnrollment, AcademyInstructor } from './schema'
import { academyCourses } from './academyCourses'

export const database = {
  courses: academyCourses as AcademyCourse[],

  enrollments: [] as AcademyEnrollment[],

  instructors: [] as AcademyInstructor[],
}

export function getCourses(): AcademyCourse[] {
  return database.courses
}

export function getFeaturedCourses(): AcademyCourse[] {
  return database.courses.filter((course) => course.featured)
}

export function getCourseBySlug(
  slug: string,
): AcademyCourse | undefined {
  return database.courses.find((course) => course.slug === slug)
}

export function createEnrollment(
  enrollment: AcademyEnrollment,
) {
  database.enrollments.push(enrollment)

  return enrollment
}

export function getEnrollments(): AcademyEnrollment[] {
  return database.enrollments
}

export function addInstructor(
  instructor: AcademyInstructor,
) {
  database.instructors.push(instructor)

  return instructor
}

export function getInstructors(): AcademyInstructor[] {
  return database.instructors
}