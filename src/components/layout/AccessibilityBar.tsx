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
  }, [])

  useEffect(() => {
    document.documentElement.style.fontSize =
      `${fontSize}px`

    window.localStorage.setItem(
      FONT_SIZE_STORAGE_KEY,
      String(fontSize),
    )
  }, [fontSize])

  useEffect(() => {
    document.documentElement.style.filter =
      highContrast
        ? 'contrast(1.18)'
        : ''

    window.localStorage.setItem(
      CONTRAST_STORAGE_KEY,
      String(highContrast),
    )
  }, [highContrast])

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

  function increaseFontSize():
    void {
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

  function decreaseFontSize():
    void {
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

  function toggleContrast():
    void {
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

  function stopReading():
    void {
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

  function readPage():
    void {
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

    utterance.lang =
      'pt-BR'

    utterance.rate =
      1

    utterance.pitch =
      1

    utterance.onstart =
      () => {
        setSpeaking(
          true,
        )

        setStatusMessage(
          'Leitura da página iniciada.',
        )
      }

    utterance.onend =
      () => {
        setSpeaking(
          false,
        )

        setStatusMessage(
          'Leitura da página concluída.',
        )
      }

    utterance.onerror =
      () => {
        setSpeaking(
          false,
        )

        setStatusMessage(
          'Não foi possível concluir a leitura da página.',
        )
      }

    window.speechSynthesis.speak(
      utterance,
    )
  }

  function resetAccessibility():
    void {
    if (
      typeof window !==
        'undefined' &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel()
    }

    setSpeaking(
      false,
    )

    setFontSize(
      DEFAULT_FONT_SIZE,
    )

    setHighContrast(
      false,
    )

    setStatusMessage(
      'Configurações de acessibilidade restauradas.',
    )
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[70] md:bottom-auto md:right-5 md:top-28">
      {open ? (
        <section
          id="accessibility-panel"
          aria-label="Configurações de acessibilidade"
          className="absolute bottom-14 right-0 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:bottom-auto md:top-14"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Acessibilidade
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#071827]">
                Recursos da página
              </h2>
            </div>

            <button
              type="button"
              aria-label="Fechar recursos de acessibilidade"
              onClick={() =>
                setOpen(false)
              }
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Fechar
            </button>
          </header>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={
                  speaking
                }
                onClick={
                  readPage
                }
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
              >
                {speaking
                  ? 'Parar leitura'
                  : 'Ouvir página'}
              </button>

              <button
                type="button"
                disabled={
                  fontSize >=
                  MAXIMUM_FONT_SIZE
                }
                onClick={
                  increaseFontSize
                }
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Aumentar texto
              </button>

              <button
                type="button"
                disabled={
                  fontSize <=
                  MINIMUM_FONT_SIZE
                }
                onClick={
                  decreaseFontSize
                }
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Reduzir texto
              </button>

              <button
                type="button"
                aria-pressed={
                  highContrast
                }
                onClick={
                  toggleContrast
                }
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  highContrast
                    ? 'border-[#071827] bg-[#071827] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]'
                }`}
              >
                {highContrast
                  ? 'Contraste ativo'
                  : 'Alto contraste'}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Texto
                </p>

                <p className="mt-1 text-sm font-semibold text-[#071827]">
                  {fontSize}px
                </p>
              </div>

              <button
                type="button"
                onClick={
                  resetAccessibility
                }
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Restaurar
              </button>
            </div>

            <p
              aria-live="polite"
              className="mt-3 min-h-5 text-xs leading-5 text-slate-500"
            >
              {
                statusMessage
              }
            </p>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        aria-expanded={
          open
        }
        aria-controls="accessibility-panel"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-300/30 bg-[#071827] px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-[#0B2940]"
      >
        Acessibilidade
      </button>
    </div>
  )
}