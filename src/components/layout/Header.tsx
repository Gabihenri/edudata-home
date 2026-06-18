import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <Image
            src="/logo-edudata-ia-header.png"
            alt="EduData IA"
            width={180}
            height={60}
            priority
          />
        </div>

        <button className="rounded-full bg-[#0A3A5E] px-8 py-3 text-white font-semibold">
          Participar
        </button>

      </div>
    </header>
  )
}