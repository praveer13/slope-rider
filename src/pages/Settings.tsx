import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { TopBar, NeonButton, BottomSheet, Toast } from '@gridverse/kit/ui'
import { DEFAULT_KIT_SETTINGS } from '@gridverse/kit/lib'
import type { ColorblindMode, SnapStrength } from '@gridverse/kit/lib'
import { useGameStore } from '../store.ts'

export default function Settings() {
  const navigate = useNavigate()
  const settings = useGameStore((s) => s.settings)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const resetAll = useGameStore((s) => s.resetAll)
  const [confirm, setConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const toggle = (key: keyof typeof settings) =>
    updateSettings({ [key]: !settings[key] })

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Settings" />
      <main className="flex flex-1 flex-col gap-3 px-4 pb-24 pt-4">
        <Section title="Audio & feel">
          <Row label="SFX" checked={settings.sfxOn} onChange={() => toggle('sfxOn')} />
          <Row label="Music" checked={settings.musicOn} onChange={() => toggle('musicOn')} />
          <Row label="Haptics" checked={settings.hapticsOn} onChange={() => toggle('hapticsOn')} />
        </Section>
        <Section title="Display">
          <Row label="Ghost hints" checked={settings.ghostHints} onChange={() => toggle('ghostHints')} />
          <Row label="Reduce motion" checked={settings.reduceMotion} onChange={() => toggle('reduceMotion')} />
          <SelectRow
            label="Colorblind"
            value={settings.colorblind}
            options={[
              ['off', 'Off'],
              ['protan', 'Protan'],
              ['deutan', 'Deutan'],
              ['tritan', 'Tritan'],
            ]}
            onChange={(v) => updateSettings({ colorblind: v as ColorblindMode })}
          />
          <SelectRow
            label="Snap"
            value={settings.snapStrength}
            options={[
              ['gentle', 'Gentle'],
              ['normal', 'Normal'],
              ['sticky', 'Sticky'],
            ]}
            onChange={(v) => updateSettings({ snapStrength: v as SnapStrength })}
          />
        </Section>
        <NeonButton
          variant="ghost"
          onClick={() => setConfirm(true)}
          className="mt-4 text-danger"
        >
          Reset all progress
        </NeonButton>
      </main>
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} ariaLabel="Confirm reset">
        <h3 className="font-display text-xl text-hi">Reset everything?</h3>
        <p className="mt-2 text-body text-mid">This cannot be undone.</p>
        <div className="mt-4 flex gap-3">
          <NeonButton variant="secondary" onClick={() => setConfirm(false)} className="flex-1">
            Cancel
          </NeonButton>
          <NeonButton
            onClick={() => {
              resetAll()
              updateSettings({ ...DEFAULT_KIT_SETTINGS })
              setConfirm(false)
              setToast('Progress reset')
              navigate('/')
            }}
            className="flex-1"
          >
            Reset
          </NeonButton>
        </div>
      </BottomSheet>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-night-2">
      <h2 className="px-4 pt-3 text-caption font-extrabold uppercase text-low">{title}</h2>
      <div className="flex flex-col divide-y divide-line/60">{children}</div>
    </section>
  )
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between px-4 py-3">
      <span className="text-title font-bold text-hi">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full border transition-colors ${
          checked ? 'border-mint bg-mint' : 'border-line bg-night-3'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-hi transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between px-4 py-3">
      <span className="text-title font-bold text-hi">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-night-3 px-2 py-1 text-body text-hi"
      >
        {options.map(([k, display]) => (
          <option key={k} value={k}>
            {display}
          </option>
        ))}
      </select>
    </label>
  )
}
