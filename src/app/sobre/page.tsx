import type { Metadata } from 'next'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import ManifestoEDI from '@/components/home/ManifestoEDI'
import SobreEduData from '@/components/home/SobreEduData'
import Participacao from '@/components/home/Participacao'

export const metadata: Metadata = {
  title: 'Sobre a EduData IA | EduData IA',
  description:
    'Conheça o posicionamento, os princípios e a visão institucional da EduData IA.',
}

export default function SobrePage() {
  return (
    <>
      <AccessibilityBar />
      <Header />
      <main>
        <ManifestoEDI />
        <SobreEduData />
        <Participacao />
      </main>
      <Footer />
    </>
  )
}
