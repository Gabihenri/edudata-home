export default function AccessibilityBar() {
  return (
    <div className="fixed right-4 top-20 z-50 flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
      <button
        type="button"
        aria-label="Ouvir página"
        className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        Ouvir
      </button>

      <button
        type="button"
        aria-label="Aumentar fonte"
        className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        A+
      </button>

      <button
        type="button"
        aria-label="Diminuir fonte"
        className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        A-
      </button>

      <button
        type="button"
        aria-label="Ativar alto contraste"
        className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        Contraste
      </button>
    </div>
  )
}
