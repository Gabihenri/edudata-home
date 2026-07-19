import type {
  MetadataRoute,
} from 'next'

export default function manifest():
  MetadataRoute.Manifest {
  return {
    id: '/agenda',

    name:
      'Agenda Inteligente EDI',

    short_name:
      'Agenda EDI',

    description:
      'Camada operacional da EduData IA para planejamento, registros, turmas, tarefas, evidências e acompanhamento pedagógico.',

    start_url:
      '/agenda',

    scope:
      '/',

    display:
      'standalone',

    background_color:
      '#F4F8FB',

    theme_color:
      '#071827',

    orientation:
      'portrait-primary',

    lang:
      'pt-BR',

    categories: [
      'education',
      'productivity',
    ],

    icons: [
      {
        src:
          '/api/pwa/icon/192',

        sizes:
          '192x192',

        type:
          'image/png',

        purpose:
          'any',
      },

      {
        src:
          '/api/pwa/icon/192',

        sizes:
          '192x192',

        type:
          'image/png',

        purpose:
          'maskable',
      },

      {
        src:
          '/api/pwa/icon/512',

        sizes:
          '512x512',

        type:
          'image/png',

        purpose:
          'any',
      },

      {
        src:
          '/api/pwa/icon/512',

        sizes:
          '512x512',

        type:
          'image/png',

        purpose:
          'maskable',
      },
    ],
  }
}