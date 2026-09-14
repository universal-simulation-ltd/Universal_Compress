import { AdvancedMenu, MENU, type MenuTheme } from '@unisim/sdk'
// Generated — `npm run credits` after any dependency change. Never edit it by
// hand: it is read off the installed tree, so a hand-kept list drifts from the
// lockfile the first time anyone upgrades anything, and a credits list naming a
// package we removed is worse than no list at all.
import credits from '../../generated/credits.json'
import { useCompressStore } from '../../stores/compressStore'
import { useThemeStore, type ThemePref } from '../../stores/themeStore'

// The per-app actions that slot into <UniversalAppsNavBar />'s `actions` prop —
// ROWS ONLY, no trigger and no panel of its own. The SDK renders them inside the
// merged profile pill, so the bar carries one dropdown on the right rather than
// an Actions button on the left and an avatar on the right.
//
// Styling is inline rather than Tailwind to match the SDK dropdown's own rows
// (the same 8px/14px rhythm and 13px label the profile and language rows use) —
// these render inside SDK chrome, not ours.
//
// ⚠️ Inline styles cannot answer the `.dark` class, and the SDK does NOT theme
// an app's own `actions` rows — so the colours branch on the resolved theme
// here. The `light` column is exactly what these rows have always rendered; the
// `dark` column is the SDK's own dropdown palette, so the rows match the panel
// they sit in.
const ROW: Record<MenuTheme, {
  rest: string
  disabled: string
  hoverBg: string
  hoverText: string
  selectedBg: string
  selectedText: string
  label: string
}> = {
  light: {
    rest: '#374151',
    disabled: '#94a3b8',
    hoverBg: '#fff7ed',
    hoverText: '#c2410c',
    selectedBg: '#fff7ed',
    selectedText: '#c2410c',
    label: MENU.light.faint,
  },
  dark: {
    rest: MENU.dark.body,
    disabled: MENU.dark.faint,
    hoverBg: MENU.dark.rowHover,
    hoverText: MENU.dark.rowHoverText,
    selectedBg: MENU.dark.accentBg,
    selectedText: MENU.dark.accentText,
    label: MENU.dark.faint,
  },
}

const THEMES: { pref: ThemePref; label: string; icon: string }[] = [
  { pref: 'light', label: 'Light', icon: '☀️' },
  { pref: 'dark', label: 'Dark', icon: '🌙' },
  // 'system' is offered but is deliberately NOT the default — see themeStore.
  { pref: 'system', label: 'Match my device', icon: '🖥️' },
]

export default function AppMenu() {
  const items = useCompressStore((s) => s.items)
  const running = useCompressStore((s) => s.running)
  const clearQueue = useCompressStore((s) => s.clearQueue)
  const resetSettings = useCompressStore((s) => s.resetSettings)
  const pref = useThemeStore((s) => s.pref)
  const setPref = useThemeStore((s) => s.setPref)
  const theme = useThemeStore((s) => s.effective)

  return (
    <>
      <MenuRow theme={theme} icon="🧹" label="Clear the list" disabled={running || items.length === 0} onClick={clearQueue} />
      <MenuRow theme={theme} icon="↩️" label="Reset the settings" disabled={running} onClick={resetSettings} />

      <MenuLabel theme={theme}>Appearance</MenuLabel>
      {THEMES.map((t) => (
        <MenuRow
          key={t.pref}
          theme={theme}
          icon={t.icon}
          label={t.label}
          selected={pref === t.pref}
          disabled={false}
          onClick={() => setPref(t.pref)}
        />
      ))}

      {/* Advanced — the SDK's own category, so every app in the suite has one in
          the same place, and whatever goes in it next is one change rather than
          nineteen. "About this app" is always its last row.

          ⚠️ `theme` is required now there is a dark mode: the section is inline
          styles, and left on light it renders as a pale strip in a dark menu. */}
      <AdvancedMenu
        theme={theme}
        about={{
          repo:    'https://github.com/universal-simulation-ltd/Universal_Compress',
          proof:   'https://github.com/universal-simulation-ltd/Universal_Compress/blob/main/PRIVACY.md',
          subject: 'Your files',
          plural:  true,
          version: __APP_VERSION__,
          credits,
          noticesHref: 'https://github.com/universal-simulation-ltd/Universal_Compress/blob/main/THIRD-PARTY-NOTICES.md',
        }}
      />
    </>
  )
}

function MenuLabel({ theme, children }: { theme: MenuTheme; children: string }) {
  return (
    <div
      style={{
        padding: '8px 14px 4px',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: ROW[theme].label,
      }}
    >
      {children}
    </div>
  )
}

function MenuRow({
  theme,
  icon,
  label,
  disabled,
  selected = false,
  onClick,
}: {
  theme: MenuTheme
  icon: string
  label: string
  disabled: boolean
  selected?: boolean
  onClick: () => void
}) {
  const c = ROW[theme]
  const restBg = selected ? c.selectedBg : 'transparent'
  const restColor = disabled ? c.disabled : selected ? c.selectedText : c.rest
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        width:      '100%',
        padding:    '8px 14px',
        fontSize:   13,
        fontFamily: 'inherit',
        textAlign:  'left',
        border:     0,
        background: restBg,
        color:      restColor,
        cursor:     disabled ? 'default' : 'pointer',
        transition: 'background 120ms, color 120ms',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = c.hoverBg
        e.currentTarget.style.color = c.hoverText
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = restBg
        e.currentTarget.style.color = restColor
      }}
    >
      <span aria-hidden>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {selected && <span aria-hidden style={{ color: c.selectedText }}>✓</span>}
    </button>
  )
}
