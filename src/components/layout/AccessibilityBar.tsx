export default function AccessibilityBar() {
  return (
    <div className="fixed right-4 top-20 z-50 flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
      <button aria-label="Ouvir página" className="text-sm font-semibold">
        Ouvir
      </button>

      <button aria-label="Aumentar fonte" className="text-sm font-semibold">
        A+
      </button>

      <button aria-label="Diminuir fonte" className="text-sm font-semibold">
        A-
      </button>

      <button aria-label="Ativar alto contraste" className="text-sm font-semibold">
        Contraste
      </button>
    </div>
  )
}
