'use client'

import {
  useEffect,
  useState,
} from 'react'

const DEFAULT_FONT_SIZE = 16
const MINIMUM_FONT_SIZE = 14
const MAXIMUM_FONT_SIZE = 20

const FONT_SIZE_STORAGE_KEY =
  'edudata-accessibility-font-size'

const CONTRAST_STORAGE_KEY =
  'edudata-accessibility-contrast'

function normalizeFontSize(
  value: number,
): number {
  return Math.min(
    MAXIMUM_FONT_SIZE,
    Math.max(
      MINIMUM_FONT_SIZE,
      value,
    ),
  )
}

export default function AccessibilityBar() {
  const [
    initialized,
    setInitialized,
  ] = useState(false)

  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    fontSize,
    setFontSize,
  ] = useState(
    DEFAULT_FONT_SIZE,
  )

  const [
    highContrast,
    setHighContrast,
  ] = useState(false)

  const [
    speaking,
    setSpeaking,
  ] = useState(false)

  const [
    statusMessage,
    setStatusMessage,
  ] = useState('')

  useEffect(() => {
    const savedFontSize =
      window.localStorage.getItem(
        FONT_SIZE_STORAGE_KEY,
      )

    const savedContrast =
      window.localStorage.getItem(
        CONTRAST_STORAGE_KEY,
      )

    if (savedFontSize) {
      const parsedFontSize =
        Number(savedFontSize)

      if (
        Number.isFinite(
          parsedFontSize,
        )
      ) {
        setFontSize(
          normalizeFontSize(
            parsedFontSize,
          ),
        )
      }
    }

    setHighContrast(
      savedContrast === 'true',
    )

    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) {
      return
    }

    document.documentElement.style.fontSize =
      `${fontSize}px`

    window.localStorage.setItem(
      FONT_SIZE_STORAGE_KEY,
      String(fontSize),
    )
  }, [
    fontSize,
    initialized,
  ])

  useEffect(() => {
    if (!initialized) {
      return
    }

    document.documentElement.style.filter =
      highContrast
        ? 'contrast(1.18)'
        : ''

    window.localStorage.setItem(
      CONTRAST_STORAGE_KEY,
      String(highContrast),
    )
  }, [
    highContrast,
    initialized,
  ])

  useEffect(() => {
    return () => {
      if (
        typeof window !==
          'undefined' &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function increaseFontSize(): void {
    setFontSize(
      (current) =>
        normalizeFontSize(
          current + 1,
        ),
    )

    setStatusMessage(
      'Tamanho do texto aumentado.',
    )
  }

  function decreaseFontSize(): void {
    setFontSize(
      (current) =>
        normalizeFontSize(
          current - 1,
        ),
    )

    setStatusMessage(
      'Tamanho do texto reduzido.',
    )
  }

  function toggleContrast(): void {
    setHighContrast(
      (current) => {
        const nextValue =
          !current

        setStatusMessage(
          nextValue
            ? 'Contraste ampliado.'
            : 'Contraste padrão restaurado.',
        )

        return nextValue
      },
    )
  }

  function stopReading(): void {
    if (
      typeof window ===
        'undefined' ||
      !window.speechSynthesis
    ) {
      return
    }

    window.speechSynthesis.cancel()

    setSpeaking(false)

    setStatusMessage(
      'Leitura interrompida.',
    )
  }

  function readPage(): void {
    if (
      typeof window ===
        'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance ===
        'undefined'
    ) {
      setStatusMessage(
        'A leitura de página não está disponível neste navegador.',
      )

      return
    }

    if (speaking) {
      stopReading()
      return
    }

    const mainContent =
      document.querySelector(
        'main',
      )

    const readableText =
      (
        mainContent?.textContent ??
        document.body.textContent ??
        ''
      )
        .replace(
          /\s+/g,
          ' ',
        )
        .trim()
        .slice(
          0,
          15000,
        )

    if (!readableText) {
      setStatusMessage(
        'Não foi encontrado conteúdo para leitura.',
      )

      return
    }

    window.speechSynthesis.cancel()

    const utterance =
      new SpeechSynthesisUtterance(
        readableText,
      )

    utterance.lang = 'pt-BR'
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onstart = () => {
      setSpeaking(true)

      setStatusMessage(
        'Leitura da página iniciada.',
      )
    }

    utterance.onend = () => {
      setSpeaking(false)

      setStatusMessage(
        'Leitura da página concluída.',
      )
    }

    utterance.onerror = () => {
      setSpeaking(false)

      setStatusMessage(
        'Não foi possível concluir a leitura da página.',
      )
    }

    window.speechSynthesis.speak(
      utterance,
    )
  }

  function resetAccessibility(): void {
    if (
      typeof window !==
        'undefined' &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel()
    }

    setSpeaking(false)

    setFontSize(
      DEFAULT_FONT_SIZE,
    )

    setHighContrast(false)

    setStatusMessage(
      'Configurações de acessibilidade restauradas.',
    )
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] right-4 z-[80] sm:right-5 lg:right-6">
      {open ? (
        <section
          id="accessibility-panel"
          aria-label="Configurações de acessibilidade"
          className="absolute bottom-[60px] right-0 max-h-[min(70vh,560px)] w-[min(320px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#071827] px-4 py-4 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                EIOS
              </p>

              <h2 className="mt-1 text-base font-bold text-white">
                Acessibilidade
              </h2>
            </div>

            <button
              type="button"
              aria-label="Fechar recursos de acessibilidade"
              onClick={() =>
                setOpen(false)
              }
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Fechar
            </button>
          </header>

          <div className="divide-y divide-slate-200">
            <section className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-sm font-bold text-[#071827]">
                  Leitura da página
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Ouça o conteúdo principal.
                </p>
              </div>

              <button
                type="button"
                aria-pressed={speaking}
                onClick={readPage}
                className={`inline-flex h-10 min-w-20 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0B7491] ${
                  speaking
                    ? 'border-[#071827] bg-[#071827] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]'
                }`}
              >
                {speaking
                  ? 'Parar'
                  : 'Ouvir'}
              </button>
            </section>

            <section className="px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#071827]">
                    Tamanho do texto
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Ajuste entre 14 e 20 px.
                  </p>
                </div>

                <span className="font-mono text-sm font-bold text-[#0B7491]">
                  {fontSize}px
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-label="Reduzir tamanho do texto"
                  disabled={
                    fontSize <=
                    MINIMUM_FONT_SIZE
                  }
                  onClick={
                    decreaseFontSize
                  }
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] focus:outline-none focus:ring-2 focus:ring-[#0B7491] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  A−
                </button>

                <button
                  type="button"
                  aria-label="Aumentar tamanho do texto"
                  disabled={
                    fontSize >=
                    MAXIMUM_FONT_SIZE
                  }
                  onClick={
                    increaseFontSize
                  }
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] focus:outline-none focus:ring-2 focus:ring-[#0B7491] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  A+
                </button>
              </div>
            </section>

            <section className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-sm font-bold text-[#071827]">
                  Contraste
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Amplie a diferença visual.
                </p>
              </div>

              <button
                type="button"
                aria-pressed={
                  highContrast
                }
                onClick={
                  toggleContrast
                }
                className={`inline-flex h-10 min-w-20 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0B7491] ${
                  highContrast
                    ? 'border-[#071827] bg-[#071827] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]'
                }`}
              >
                {highContrast
                  ? 'Ativo'
                  : 'Ativar'}
              </button>
            </section>

            <section className="px-4 py-4">
              <button
                type="button"
                onClick={
                  resetAccessibility
                }
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-slate-50 px-4 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Restaurar configurações
              </button>

              <p
                aria-live="polite"
                className="mt-3 min-h-5 text-xs leading-5 text-slate-500"
              >
                {statusMessage}
              </p>
            </section>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        title="Acessibilidade"
        aria-label={
          open
            ? 'Fechar recursos de acessibilidade'
            : 'Abrir recursos de acessibilidade'
        }
        aria-expanded={open}
        aria-controls="accessibility-panel"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/40 bg-[#071827] text-sm font-bold text-cyan-200 shadow-xl transition hover:bg-[#0B2940] focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
      >
        <span aria-hidden="true">
          A
        </span>

        <span className="sr-only">
          Acessibilidade
        </span>
      </button>
    </div>
  )
}