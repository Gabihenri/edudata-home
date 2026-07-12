'use client'

import { useRouter } from 'next/navigation'

type UserMenuProps = {
  name?: string
  email?: string
}

export function UserMenu({
  name = 'Usuário',
  email,
}: UserMenuProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    })

    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-semibold text-slate-900">
          {name}
        </p>

        {email && (
          <p className="text-sm text-slate-500">
            {email}
          </p>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="rounded-full bg-[#081C2E] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0A3A5E]"
      >
        Sair
      </button>
    </div>
  )
}