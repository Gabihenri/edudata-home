import { redirect } from 'next/navigation'

import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { requireSuperAdmin } from '@/lib/auth/guard'

export const metadata = {
  title: 'BackOffice EIOS | EduData IA',
  description: 'Painel administrativo da Plataforma EduData IA.',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireSuperAdmin()
  } catch {
    redirect('/portal?error=admin_access_denied')
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="min-w-0 max-w-full overflow-x-hidden lg:pl-72">
        <AdminHeader />

        <main className="min-w-0 w-full max-w-full overflow-x-hidden px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}