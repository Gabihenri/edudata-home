import type { Metadata } from 'next'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import ConsultoriasContato from '@/components/home/ConsultoriasContato'

export const metadata: Metadata = {
  title: 'Consultorias | EduData IA',
  description:
    'Consultorias e projetos especiais da EduData IA para escolas, redes e instituições educacionais.',
}

export default function ConsultoriasPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />
      <main>
        <ConsultoriasContato />
      </main>
      <Footer />
    </>
  )
}
