import Link from 'next/link'

const items = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Escolas', href: '/admin/escolas' },
  { label: 'Professores', href: '/admin/professores' },
  { label: 'Academy', href: '/admin/academy' },
  { label: 'Professor Digital', href: '/admin/professor-digital' },
  { label: 'Agenda Inteligente EDI', href: '/admin/agenda' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'CRM', href: '/admin/crm' },
  { label: 'Produtos', href: '/admin/produtos' },
  { label: 'Experience Manager', href: '/admin/experience-manager' },
  { label: 'Usuários', href: '/admin/usuarios' },
  { label: 'Configurações', href: '/admin/configuracoes' },
]

export default function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-white/10 bg-[#050816] text-white lg:block">
      <div className="flex h-24 items-center px-8">
        <a href="/" aria-label="EduData IA">
          <img
            src="/logo-edudata-ia-header.png"
            alt="EduData IA"
            className="h-16 w-auto object-contain"
          />
        </a>
      </div>

      <nav className="px-5 pb-8">
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}
