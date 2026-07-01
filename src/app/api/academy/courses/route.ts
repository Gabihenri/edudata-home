import { NextResponse } from 'next/server'

import { getCourses } from '@/lib/data/database'

export async function GET() {
  return NextResponse.json({
    success: true,
    total: getCourses().length,
    data: getCourses(),
  })
}