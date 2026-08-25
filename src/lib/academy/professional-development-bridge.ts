import type { EiosPossibility } from '@/lib/eios/professor-digital'

export type AcademyConnection = {
  title: string
  description: string
  tags: string[]
  actionLabel: string
  href: string
}

/**
 * Primeira ponte EIOS → EduData Academy.
 * Não prescreve formação: apresenta uma possibilidade contextual e deixa a
 * decisão para o profissional. O catálogo real poderá substituir esta camada
 * sem alterar a interface do Professor Digital.
 */
export function buildAcademyConnections(
  possibilities: EiosPossibility[],
): AcademyConnection[] {
  return possibilities.slice(0, 3).map(possibility => ({
    title: possibility.title,
    description: `Você pode explorar experiências formativas relacionadas a esta possibilidade. A conexão foi construída a partir dos temas que você autorizou o Professor Digital a considerar.`,
    tags: possibility.academyTags.length > 0 ? possibility.academyTags : ['Desenvolvimento profissional'],
    actionLabel: 'Explorar possibilidades na Academy',
    href: '/academy/inscricao',
  }))
}
