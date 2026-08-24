import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getContactSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Serviço de contato indisponível.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Honeypot: bots que preencherem este campo recebem sucesso neutro sem persistência.
    if (clean(body.website)) {
      return NextResponse.json({ ok: true })
    }

    const name = clean(body.name)
    const institution = clean(body.institution)
    const municipality = clean(body.municipality)
    const state = clean(body.state).toUpperCase()
    const need = clean(body.need)
    const phone = clean(body.phone)
    const email = clean(body.email).toLowerCase()

    if (
      name.length < 2 ||
      name.length > 120 ||
      institution.length < 2 ||
      institution.length > 180 ||
      municipality.length < 2 ||
      municipality.length > 120 ||
      !/^[A-Z]{2}$/.test(state) ||
      need.length < 10 ||
      need.length > 2000 ||
      phone.length < 8 ||
      phone.length > 40
    ) {
      return NextResponse.json(
        { error: 'Revise os campos obrigatórios do formulário.' },
        { status: 400 },
      )
    }

    if (email && (email.length > 180 || !emailPattern.test(email))) {
      return NextResponse.json(
        { error: 'Informe um e-mail válido.' },
        { status: 400 },
      )
    }

    const { error } = await getContactSupabase().from('contact_requests').insert({
      name,
      institution,
      municipality,
      state,
      need,
      phone,
      email: email || null,
    })

    if (error) {
      console.error('contact_request_insert_failed', error.message)
      return NextResponse.json(
        { error: 'Não foi possível registrar sua mensagem. Tente novamente.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('contact_request_failed', error)
    return NextResponse.json(
      { error: 'Não foi possível processar sua mensagem.' },
      { status: 500 },
    )
  }
}
