import type { Metadata } from 'next'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import SolucoesEscolas from '@/components/home/SolucoesEscolas'

export const metadata: Metadata = {
  title: 'Soluções para Escolas e Redes | EduData IA',
  description:
    'Soluções institucionais da EduData IA para organização pedagógica, formação, evidências, indicadores e transformação escolar.',
}

export default function SolucoesEscolasPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />
      <main>
        <SolucoesEscolas />
      </main>
      <Footer />
    </>
  )
}
