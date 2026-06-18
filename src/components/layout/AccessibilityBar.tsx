
export default function AccessibilityBar() {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur md:bottom-auto md:right-4 md:top-24 md:left-auto md:translate-x-0">
      <button type="button" className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        Ouvir
      </button>

      <button type="button" className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        A+
      </button>

      <button type="button" className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        A-
      </button>

      <button type="button" className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        Contraste
      </button>
    </div>
  )
}