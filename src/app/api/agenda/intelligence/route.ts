type IntelligenceRole =
  | 'professor'
  | 'coordenador'
  | 'diretor'
  | 'gestor'
  | 'super_admin'

const ALLOWED_INTELLIGENCE_ROLES =
  new Set<IntelligenceRole>([
    'professor',
    'coordenador',
    'diretor',
    'gestor',
    'super_admin',
  ])

const ROLE_ALIASES:
  Record<string, IntelligenceRole> = {
    professor:
      'professor',

    teacher:
      'professor',

    docente:
      'professor',

    coordenador:
      'coordenador',

    coordinator:
      'coordenador',

    coordenador_pedagogico:
      'coordenador',

    diretor:
      'diretor',

    director:
      'diretor',

    gestor:
      'gestor',

    manager:
      'gestor',

    admin:
      'super_admin',

    administrador:
      'super_admin',

    superadmin:
      'super_admin',

    super_administrador:
      'super_admin',

    super_admin:
      'super_admin',
  }