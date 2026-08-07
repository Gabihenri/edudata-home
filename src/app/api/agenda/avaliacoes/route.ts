import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  createAssessment,
  createGradeEntry,
  getAssessmentCenterOverview,
  getAssessmentResults,
  getStudentGradebook,
  saveAssessmentResult,
  type CreateAssessmentInput,
  type CreateGradebookEntryInput,
  type SaveAssessmentResultInput,
} from '@/lib/agenda/assessment-center/assessment-center.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

function getAccessToken(request: NextRequest): string {
  const token =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!token) throw new Error('Usuário não autenticado.')
  return token
}

function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Variáveis públicas do Supabase não configuradas.')
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado')
    ? 401
    : normalized.includes('obrigatório')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível processar o Centro de Avaliações.'
          : message,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAuthenticatedClient(getAccessToken(request))
    const params = request.nextUrl.searchParams
    const view = params.get('view') ?? 'overview'

    if (view === 'results') {
      const assessmentId = params.get('assessmentId')
      if (!assessmentId?.trim()) {
        throw new Error('assessmentId é obrigatório.')
      }

      const result = await getAssessmentResults({
        client,
        userId: user.id,
        assessmentId,
      })

      return NextResponse.json(result, {
        status: 200,
        headers: NO_CACHE_HEADERS,
      })
    }

    if (view === 'gradebook') {
      const studentId = params.get('studentId')
      const classId = params.get('classId')
      const componentId = params.get('componentId')
      const academicPeriodId = params.get('academicPeriodId')

      if (!studentId?.trim()) throw new Error('studentId é obrigatório.')
      if (!classId?.trim()) throw new Error('classId é obrigatório.')
      if (!componentId?.trim()) throw new Error('componentId é obrigatório.')
      if (!academicPeriodId?.trim()) {
        throw new Error('academicPeriodId é obrigatório.')
      }

      const result = await getStudentGradebook({
        client,
        userId: user.id,
        studentId,
        classId,
        componentId,
        academicPeriodId,
      })

      return NextResponse.json(result, {
        status: 200,
        headers: NO_CACHE_HEADERS,
      })
    }

    const result = await getAssessmentCenterOverview({
      client,
      userId: user.id,
      classId: params.get('classId'),
      academicPeriodId: params.get('academicPeriodId'),
    })

    return NextResponse.json(result, {
      status: 200,
      headers: NO_CACHE_HEADERS,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAuthenticatedClient(getAccessToken(request))
    const body = await request.json() as {
      operation?: 'create_assessment' | 'save_result' | 'create_grade'
      assessment?: CreateAssessmentInput
      result?: SaveAssessmentResultInput
      grade?: CreateGradebookEntryInput
    }

    if (body.operation === 'create_assessment') {
      if (!body.assessment) throw new Error('assessment é obrigatório.')

      const result = await createAssessment({
        client,
        userId: user.id,
        input: body.assessment,
      })

      return NextResponse.json(result, {
        status: 201,
        headers: NO_CACHE_HEADERS,
      })
    }

    if (body.operation === 'save_result') {
      if (!body.result) throw new Error('result é obrigatório.')

      const result = await saveAssessmentResult({
        client,
        userId: user.id,
        input: body.result,
      })

      return NextResponse.json(result, {
        status: 200,
        headers: NO_CACHE_HEADERS,
      })
    }

    if (body.operation === 'create_grade') {
      if (!body.grade) throw new Error('grade é obrigatório.')

      const result = await createGradeEntry({
        client,
        userId: user.id,
        input: body.grade,
      })

      return NextResponse.json(result, {
        status: 201,
        headers: NO_CACHE_HEADERS,
      })
    }

    throw new Error('operation é obrigatório.')
  } catch (error) {
    return errorResponse(error)
  }
}
