import { NextResponse } from 'next/server'

import {
  createEnrollment,
  getEnrollments,
} from '@/lib/data/database'

export async function GET() {
  return NextResponse.json({
    success: true,
    total: getEnrollments().length,
    data: getEnrollments(),
  })
}

export async function POST(request: Request) {
  const body = await request.json()

  const enrollment = createEnrollment({
    id: crypto.randomUUID(),

    courseId: body.courseId,

    fullName: body.fullName,

    email: body.email,

    whatsapp: body.whatsapp,

    school: body.school,

    city: body.city,

    state: body.state,

    role: body.role,

    lgpd: body.lgpd,

    status: 'Pendente',

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    data: enrollment,
  })
}