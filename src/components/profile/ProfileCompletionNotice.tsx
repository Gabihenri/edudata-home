import Link from 'next/link'

interface ProfileCompletionNoticeProps {
  returnTo?: string
}

function createProfileHref(
  returnTo: string,
): string {
  const params =
    new URLSearchParams({
      returnTo,
    })

  return `/perfil?${params.toString()}`
}

export default function ProfileCompletionNotice({
  returnTo = '/portal',
}: ProfileCompletionNoticeProps) {
  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
      <div className="h-1 w-16 bg-amber-500" />

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
        Configuração da conta
      </p>

      <h2 className="mt-2 text-xl font-bold">
        Cadastro incompleto
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6">
        Conclua as informações do seu perfil
        para utilizar todos os recursos
        liberados para sua conta.
      </p>

      <Link
        href={createProfileHref(
          returnTo,
        )}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-amber-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 sm:w-auto"
      >
        Completar meu perfil
      </Link>
    </section>
  )
}