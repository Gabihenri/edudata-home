import {
  ImageResponse,
} from 'next/og'

import type {
  NextRequest,
} from 'next/server'

export const runtime =
  'edge'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    size: string
  }
}

const SUPPORTED_SIZES =
  new Set([
    192,
    512,
  ])

function normalizeSize(
  value: string,
): number | null {
  const size =
    Number(value)

  if (
    !Number.isInteger(
      size,
    ) ||
    !SUPPORTED_SIZES.has(
      size,
    )
  ) {
    return null
  }

  return size
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const size =
    normalizeSize(
      context.params.size,
    )

  if (!size) {
    return new Response(
      'Tamanho de ícone inválido.',
      {
        status: 404,

        headers: {
          'Cache-Control':
            'no-store',
        },
      },
    )
  }

  const compact =
    size === 192

  return new ImageResponse(
    (
      <div
        style={{
          width:
            '100%',

          height:
            '100%',

          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          position:
            'relative',

          overflow:
            'hidden',

          background:
            'linear-gradient(145deg, #071827 0%, #0B3148 58%, #0B7491 100%)',

          color:
            '#FFFFFF',
        }}
      >
        <div
          style={{
            position:
              'absolute',

            width:
              compact
                ? 150
                : 398,

            height:
              compact
                ? 150
                : 398,

            border:
              compact
                ? '2px solid rgba(103, 232, 249, 0.28)'
                : '5px solid rgba(103, 232, 249, 0.28)',

            borderRadius:
              compact
                ? 34
                : 92,

            transform:
              'rotate(45deg)',
          }}
        />

        <div
          style={{
            position:
              'absolute',

            width:
              compact
                ? 104
                : 278,

            height:
              compact
                ? 104
                : 278,

            border:
              compact
                ? '2px solid rgba(255, 255, 255, 0.18)'
                : '5px solid rgba(255, 255, 255, 0.18)',

            borderRadius:
              compact
                ? 28
                : 74,

            transform:
              'rotate(45deg)',
          }}
        />

        <div
          style={{
            display:
              'flex',

            flexDirection:
              'column',

            alignItems:
              'center',

            justifyContent:
              'center',

            position:
              'relative',

            width:
              compact
                ? 132
                : 352,

            height:
              compact
                ? 132
                : 352,

            borderRadius:
              compact
                ? 34
                : 92,

            border:
              compact
                ? '2px solid rgba(255, 255, 255, 0.24)'
                : '5px solid rgba(255, 255, 255, 0.24)',

            background:
              'rgba(7, 24, 39, 0.82)',

            boxShadow:
              compact
                ? '0 18px 42px rgba(0, 0, 0, 0.34)'
                : '0 48px 112px rgba(0, 0, 0, 0.34)',
          }}
        >
          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              width:
                compact
                  ? 34
                  : 90,

              height:
                compact
                  ? 6
                  : 16,

              marginBottom:
                compact
                  ? 10
                  : 26,

              borderRadius:
                999,

              background:
                '#67E8F9',
            }}
          />

          <div
            style={{
              display:
                'flex',

              fontSize:
                compact
                  ? 48
                  : 128,

              fontWeight:
                800,

              letterSpacing:
                compact
                  ? '-3px'
                  : '-8px',

              lineHeight:
                1,

              color:
                '#FFFFFF',
            }}
          >
            EDI
          </div>

          <div
            style={{
              display:
                'flex',

              marginTop:
                compact
                  ? 7
                  : 18,

              fontSize:
                compact
                  ? 10
                  : 27,

              fontWeight:
                700,

              letterSpacing:
                compact
                  ? '2px'
                  : '6px',

              color:
                '#A5F3FC',
            }}
          >
            AGENDA
          </div>
        </div>
      </div>
    ),
    {
      width:
        size,

      height:
        size,

      headers: {
        'Cache-Control':
          'public, max-age=31536000, immutable',
      },
    },
  )
}