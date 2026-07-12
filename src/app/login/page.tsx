import { Suspense } from 'react'
import LoginContent from './LoginContent'

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#081c2e] px-6">
      <p className="text-sm text-slate-300">
        Carregando acesso...
      </p>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  )
}