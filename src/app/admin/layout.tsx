import AdminHeader from '@/components/admin/AdminHeader'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: 'BackOffice EIOS | EduData IA',
  description: 'Painel administrativo da Plataforma EduData IA.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminSidebar />

      <div className="lg:pl-72">
        <AdminHeader />

        <main className="px-6 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
