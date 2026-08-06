import { useState, type ReactNode } from 'react'

// The settings vocabulary, shared by all four panels so a PDF and an MP4 are the
// same instrument with different strings. Lifted deliberately from Universal
// Converter's PanelParts — two suite apps that both ask "how hard should I
// squeeze?" should not answer with two different-looking controls.

export function Panel({
  title,
  count,
  children,
}: {
  title: string
  count: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3">
        <span className="text-[12.5px] font-bold text-slate-900">{title}</span>
        <span className="ml-auto font-mono text-[11px] text-slate-400">{count}</span>
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-slate-600">{label}</span>
      {children}
    </div>
  )
}

export function Divider() {
  return <div className="h-px bg-slate-200" />
}

// A disclosure for the knobs most people never touch. `summary` keeps the panel
// honest while it's shut: whatever is folded away is still readable at a glance,
// so a 720p cap or a mono downmix can't apply invisibly.
export function Collapsible({
  label,
  summary,
  defaultOpen = false,
  children,
}: {
  label: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600"
      >
        <span className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-slate-600">{label}</span>
        {!open && summary && (
          <span className="min-w-0 flex-1 truncate text-[10.5px] text-slate-400">{summary}</span>
        )}
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`ml-auto h-3 w-3 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="flex flex-col gap-4">{children}</div>}
    </div>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  disabled: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 text-[11.5px] font-semibold transition-colors disabled:opacity-50 ${
            value === o.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * The strength control. Bigger and warmer than `Segmented` because it is the one
 * control most people will ever touch — the rest of the panel exists to be
 * ignored.
 */
export function LevelPicker<T extends string>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  disabled: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-2 py-2 text-[12px] font-bold transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600 disabled:opacity-50 ${
            value === o.value
              ? 'bg-gradient-to-br from-[#FE8C01] to-[#E05504] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Select<T extends string | number>({
  options,
  value,
  disabled,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  disabled: boolean
  onChange: (value: T) => void
}) {
  return (
    <select
      value={String(value)}
      disabled={disabled}
      onChange={(e) => {
        const picked = options.find((o) => String(o.value) === e.target.value)
        if (picked) onChange(picked.value)
      }}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] tabular-nums text-slate-900 focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600 disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({
  label,
  hint,
  on,
  disabled,
  onChange,
}: {
  label: string
  hint: string
  on: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-orange-600 disabled:opacity-50"
    >
      <span>
        <span className="block text-[12px] font-semibold text-slate-900">{label}</span>
        <span className="block text-[10.5px] text-slate-400">{hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? 'bg-gradient-to-br from-[#FE8C01] to-[#E05504]' : 'bg-slate-300'
        }`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] ${on ? 'left-4.5' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

/** The one-line explanation under the strength control. */
export function Blurb({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-slate-500">{children}</p>
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[10.5px] leading-relaxed text-slate-400">{children}</p>
}
