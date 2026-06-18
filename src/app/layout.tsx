import './globals.css'

export const metadata = {
  title: 'EduData IA',
  description:
    'Ecossistema de desenvolvimento profissional docente baseado em Evidências, Inclusão e Inteligência.',
  icons: {
    icon: '/favicon-edudata-ia.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}