import { Suspense } from 'react'
import LoginContent from './LoginContent'

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="text-center text-sm text-slate-300">
        Carregando acesso...
      </div>
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