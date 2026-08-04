import { NextResponse } from 'next/server'

import { createTeacherProfileFromEducationalContext } from '@/lib/eios/profile/teacher-profile.service'
import { buildEducationalContext } from '@/lib/eios/context/educational-context.service'
import type { CreateEducationalContextInput } from '@/lib/eios/context/educational-context.contract'

export async function GET() {
  try {
    /*
     * Nesta primeira versão utilizamos a mesma origem de dados
     * do Context Engine. Posteriormente este objeto será
     * preenchido pelo repositório do usuário autenticado.
     */
    const input: CreateEducationalContextInput = {
      planning: [],
      objectives: [],
      lessons: [],
      evidences: [],
      tasks: [],
      calendar: [],
      professionalDevelopment: [],
      observations: [],
      referenceDate: new Date().toISOString(),
    }

    const contextResult =
      buildEducationalContext(input)

    if (
      !contextResult.success ||
      !contextResult.context
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: contextResult.errors,
          warnings: contextResult.warnings,
        },
        {
          status: 500,
        },
      )
    }

    const profileResult =
      createTeacherProfileFromEducationalContext(
        contextResult.context,
      )

    return NextResponse.json(profileResult)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Erro interno ao gerar o Perfil Docente EDI.',
        ],
      },
      {
        status: 500,
      },
    )
  }
}