import type { Metadata } from 'next'
import Link from 'next/link'

import AccessibilityBar from '@/components/layout/AccessibilityBar'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import ContactForm from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contato | EduData IA',
  description:
    'Entre em contato com a EduData IA para conhecer produtos, soluções institucionais e projetos especiais.',
}

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '')
const whatsappMessage = 'Ol%C3%A1%2C%20quero%20conhecer%20a%20EduData%20IA.'
const whatsappHref = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
  : `https://wa.me/?text=${whatsappMessage}`
const mailtoHref = 'mailto:sabinohc@gmail.com?subject=Contato%20EduData%20IA'

export default function ContatoPage() {
  return (
    <>
      <AccessibilityBar />
      <Header />

      <main className="min-h-screen bg-[#EEF3F7] text-[#071827]">
        <section className="bg-[#071827] text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Contato institucional
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Vamos conversar sobre a realidade da sua escola, equipe ou rede?
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Envie sua necessidade. A equipe EduData IA poderá orientar o melhor
              produto, formação ou solução institucional para o seu contexto.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-16">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <ContactForm />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#075F78]">
                WhatsApp
              </p>
              <h2 className="mt-2 text-xl font-bold">Prefere falar diretamente?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use o WhatsApp para iniciar uma conversa com a EduData IA.
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#102B3D] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Falar pelo WhatsApp
              </a>
              {!whatsappNumber ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  O canal direto será associado ao número institucional assim que
                  a variável NEXT_PUBLIC_WHATSAPP_NUMBER estiver configurada na Vercel.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                E-mail
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Se preferir, o contato por e-mail continua disponível como alternativa.
              </p>
              <a
                href={mailtoHref}
                className="mt-4 inline-flex text-sm font-bold text-[#075F78] hover:text-[#0B7491]"
              >
                Enviar e-mail →
              </a>
            </div>

            <Link
              href="/"
              className="inline-flex text-sm font-semibold text-[#075F78] hover:text-[#0B7491]"
            >
              ← Voltar para a Home
            </Link>
          </aside>
        </section>
      </main>

      <Footer />
    </>
  )
}
