'use client'

import {
  useEffect,
  useState,
} from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

const DISMISS_KEY =
  'agenda-pwa-install-dismissed-v2'

function isStandaloneMode() {
  if (
    typeof window ===
      'undefined'
  ) {
    return false
  }

  const navigatorWithStandalone =
    window.navigator as Navigator & {
      standalone?: boolean
    }

  return (
    window.matchMedia(
      '(display-mode: standalone)',
    ).matches ||
    navigatorWithStandalone.standalone ===
      true
  )
}

function isIosDevice() {
  if (
    typeof window ===
      'undefined'
  ) {
    return false
  }

  const userAgent =
    window.navigator.userAgent

  const classicIos =
    /iphone|ipad|ipod/i.test(
      userAgent,
    )

  const modernIpadOs =
    window.navigator.platform ===
      'MacIntel' &&
    window.navigator.maxTouchPoints > 1

  return (
    classicIos ||
    modernIpadOs
  )
}

function openIosReportVersion() {
  const report = document.querySelector(
    'main article.mx-auto',
  ) as HTMLElement | null

  if (!report) {
    return false
  }

  const reportWindow = window.open(
    '',
    '_blank',
  )

  if (!reportWindow) {
    return false
  }

  const title =
    report.querySelector('h2')?.textContent ||
    'Relatório Agenda Inteligente EDI'

  const styles = `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #f8fafc; color: #0f172a; font-family: Arial, Helvetica, sans-serif; }
    body { padding: 20px; }
    article { width: 100%; max-width: 210mm; margin: 0 auto; background: #ffffff; padding: 14mm; }
    header { border-bottom: 2px solid #071827; padding-bottom: 18px; }
    h1, h2, h3, p { margin-top: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; vertical-align: top; }
    th { background: #f8fafc; text-align: left; }
    img { max-width: 100%; height: auto; }
    @media print {
      @page { size: A4; margin: 12mm; }
      html, body { background: #ffffff; }
      body { padding: 0; }
      article { max-width: none; padding: 0; }
    }
  `

  reportWindow.document.open()
  reportWindow.document.write(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${styles}</style></head><body>${report.outerHTML}</body></html>`,
  )
  reportWindow.document.close()

  return true
}

export default function AgendaPwaInstallPrompt() {
  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null,
    )

  const [
    showIosInstructions,
    setShowIosInstructions,
  ] =
    useState(false)

  const [
    visible,
    setVisible,
  ] =
    useState(false)

  useEffect(() => {
    if (!isIosDevice()) {
      return
    }

    const handleReportPrint = (
      event: MouseEvent,
    ) => {
      const target =
        event.target instanceof Element
          ? event.target.closest('button')
          : null

      if (!target) {
        return
      }

      const label =
        target.textContent?.trim()

      if (
        label !==
        'Imprimir / Salvar em PDF'
      ) {
        return
      }

      const opened =
        openIosReportVersion()

      if (opened) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener(
      'click',
      handleReportPrint,
      true,
    )

    return () => {
      window.removeEventListener(
        'click',
        handleReportPrint,
        true,
      )
    }
  }, [])

  useEffect(() => {
    if (
      isStandaloneMode() ||
      window.localStorage.getItem(
        DISMISS_KEY,
      ) === '1'
    ) {
      return
    }

    if (isIosDevice()) {
      setShowIosInstructions(true)
      setVisible(true)
    }

    const handleBeforeInstallPrompt =
      (event: Event) => {
        event.preventDefault()

        setDeferredPrompt(
          event as BeforeInstallPromptEvent,
        )

        setVisible(true)
      }

    const handleAppInstalled =
      () => {
        setVisible(false)
        setDeferredPrompt(null)
      }

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt,
    )

    window.addEventListener(
      'appinstalled',
      handleAppInstalled,
    )

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )

      window.removeEventListener(
        'appinstalled',
        handleAppInstalled,
      )
    }
  }, [])

  function dismiss() {
    window.localStorage.setItem(
      DISMISS_KEY,
      '1',
    )

    setVisible(false)
  }

  async function install() {
    if (!deferredPrompt) {
      return
    }

    await deferredPrompt.prompt()

    const choice =
      await deferredPrompt.userChoice

    if (
      choice.outcome ===
        'accepted'
    ) {
      setVisible(false)
    }

    setDeferredPrompt(null)
  }

  if (!visible) {
    return null
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl lg:bottom-5"
      aria-label="Instalar Agenda Inteligente EDI"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
            Agenda Inteligente EDI
          </p>

          <h2 className="mt-1 text-base font-bold text-[#071827]">
            Instale a Agenda no seu celular
          </h2>

          {showIosInstructions &&
          !deferredPrompt ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use a Agenda como aplicativo, com acesso direto pela tela inicial.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 min-w-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-500"
          aria-label="Fechar aviso de instalação"
        >
          Fechar
        </button>
      </div>

      {deferredPrompt ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-4 min-h-12 w-full rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B2940]"
        >
          Instalar Agenda
        </button>
      ) : null}
    </aside>
  )
}
