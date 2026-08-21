'use client'

import Consultorias from '@/components/home/Consultorias'

/**
 * Ponto de entrada para a página de consultorias.
 *
 * O componente legado mantém o conteúdo institucional completo. Este wrapper
 * intercepta exclusivamente os CTAs que ainda apontam para mailto e os leva
 * ao canal institucional centralizado.
 */
export default function ConsultoriasContato() {
  return (
    <div
      onClickCapture={(event) => {
        const target = event.target as HTMLElement
        const link = target.closest('a')

        if (!link) return

        const href = link.getAttribute('href') ?? ''

        if (!href.startsWith('mailto:')) return

        event.preventDefault()
        window.location.href = '/contato?context=consultoria'
      }}
    >
      <Consultorias />
    </div>
  )
}
