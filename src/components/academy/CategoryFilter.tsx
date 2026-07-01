'use client'

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="mb-12 flex flex-wrap gap-3">
      <button
        onClick={() => onSelectCategory('Todos')}
        className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
          selectedCategory === 'Todos'
            ? 'bg-[#0A3A5E] text-white'
            : 'border border-slate-300 bg-white text-slate-700 hover:border-[#0A3A5E]'
        }`}
      >
        Todos
      </button>

      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
            selectedCategory === category
              ? 'bg-[#0A3A5E] text-white'
              : 'border border-slate-300 bg-white text-slate-700 hover:border-[#0A3A5E]'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}