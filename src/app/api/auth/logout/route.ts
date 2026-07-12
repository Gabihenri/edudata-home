import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true,
  })

  response.cookies.set({
    name: 'sb-access-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set({
    name: 'sb-refresh-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}