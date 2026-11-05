/**
 * XSnow Christmas overlay for Hermes desktop.
 * Canvas snow + Santa sleigh flying across the workspace page, plus
 * controls to launch the real xsnow binary (X11, installed via dnf).
 * Save as ~/.hermes/desktop-plugins/xsnow-christmas/plugin.js
 * Reload via Cmd/Ctrl+K -> "Reload desktop plugins"
 */
import { atom, Button, haptic, host, PALETTE_AREA, ROUTES_AREA, SIDEBAR_NAV_AREA, STATUSBAR_AREAS, TITLEBAR_AREAS, Tip, usePluginI18n, useValue } from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useEffect, useRef, useState } from 'react'

const ID = 'xsnow-christmas'

// ---- shared state -----------------------------------------------------------
const DEFAULTS = { snow: 180, santa: true, speed: 1, tree: true, overlay: true }
const $prefs = atom({ ...DEFAULTS })
const $overlayOn = atom(true)

let _ctx = null
function syncPrefs(ctx) {
  _ctx = ctx
  try {
    const raw = ctx.storage.get('prefs')
    if (raw) { $prefs.set({ ...DEFAULTS, ...JSON.parse(raw) }); $overlayOn.set($prefs.get().overlay !== false) }
  } catch {}
}
function savePrefs(next) {
  $prefs.set(next); $overlayOn.set(next.overlay !== false)
  try { _ctx?.storage.set('prefs', JSON.stringify(next)) } catch {}
}
function toggleOverlay() {
  savePrefs({ ...$prefs.get(), overlay: !($prefs.get().overlay !== false) })
}

// ---- canvas scene (xsnow homage, no X11 needed) ---------------------------
function SnowCanvas({ prefs }) {
  const ref = useRef(null)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx2 = canvas.getContext('2d')
    let raf, W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2)
    let flakes = []
    let santaX = -220, santaY = 90, santaDir = 1, t = 0

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect()
      W = Math.max(200, r.width); H = Math.max(200, r.height)
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    resize()

    const seed = (n) => {
      flakes = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.8 + Math.random() * 2.6, vy: 0.4 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.6, ph: Math.random() * Math.PI * 2
      }))
    }
    seed(prefsRef.current.snow)

    const drawTree = (x, baseY, h) => {
      ctx2.fillStyle = '#2d6a4f'
      for (let i = 0; i < 3; i++) {
        const w = h * 0.62 * (1 - i * 0.22)
        ctx2.beginPath()
        ctx2.moveTo(x, baseY - h + i * h * 0.28)
        ctx2.lineTo(x - w / 2, baseY - i * h * 0.28)
        ctx2.lineTo(x + w / 2, baseY - i * h * 0.28)
        ctx2.closePath(); ctx2.fill()
      }
      ctx2.fillStyle = '#7f5539'; ctx2.fillRect(x - 3, baseY, 6, 8)
      ctx2.fillStyle = '#e63946'
      for (let i = 0; i < 6; i++) {
        ctx2.beginPath()
        ctx2.arc(x + (Math.random() - 0.5) * h * 0.4, baseY - h * 0.15 - i * h * 0.12, 2.2, 0, 7)
        ctx2.fill()
      }
    }

    const drawSanta = (x, y, dir) => {
      ctx2.save(); ctx2.translate(x, y); ctx2.scale(dir, 1)
      // sleigh
      ctx2.fillStyle = '#9d0208'
      ctx2.beginPath(); ctx2.moveTo(0, 0); ctx2.lineTo(46, 0); ctx2.lineTo(40, 14); ctx2.lineTo(6, 14); ctx2.closePath(); ctx2.fill()
      // Santa body + hat
      ctx2.fillStyle = '#d00000'; ctx2.beginPath(); ctx2.arc(14, -10, 9, 0, 7); ctx2.fill()
      ctx2.fillStyle = '#f1fa8c'; ctx2.beginPath(); ctx2.arc(14, -17, 8, 0, 7); ctx2.fill()
      ctx2.fillStyle = '#ffffff'; ctx2.beginPath(); ctx2.arc(14, -24, 7, 0, 7); ctx2.fill()
      // gifts
      ctx2.fillStyle = '#1d3557'; ctx2.fillRect(28, -12, 12, 10)
      ctx2.fillStyle = '#2a9d8f'; ctx2.fillRect(32, -20, 10, 8)
      // reindeer (simple silhouettes ahead of sleigh)
      ctx2.fillStyle = '#7f5539'
      for (let i = 0; i < 3; i++) {
        const rx = 52 + i * 26, ry = -4 + Math.sin(t * 0.2 + i) * 3
        ctx2.beginPath(); ctx2.ellipse(rx, ry, 11, 6, 0, 0, 7); ctx2.fill()
        ctx2.beginPath(); ctx2.arc(rx + 11, ry - 5, 4.5, 0, 7); ctx2.fill()
      }
      // Rudolph nose
      ctx2.fillStyle = '#ff0000'; ctx2.beginPath(); ctx2.arc(52 + 2 * 26 + 15, -9, 2.6, 0, 7); ctx2.fill()
      ctx2.fillStyle = 'rgba(255,60,60,0.35)'; ctx2.beginPath(); ctx2.arc(52 + 2 * 26 + 15, -9, 6, 0, 7); ctx2.fill()
      ctx2.restore()
    }

    const frame = () => {
      t++
      const p = prefsRef.current
      ctx2.clearRect(0, 0, W, H)
      // gutter/ground line
      ctx2.fillStyle = 'rgba(255,255,255,0.10)'
      ctx2.fillRect(0, H - 26, W, 26)
      if (p.tree) { drawTree(52, H - 26, 120); drawTree(W - 70, H - 26, 150) }
      // snow
      if (flakes.length !== p.snow) seed(p.snow)
      ctx2.fillStyle = 'rgba(255,255,255,0.92)'
      for (const f of flakes) {
        f.y += f.vy * p.speed; f.x += f.vx * p.speed + Math.sin(t * 0.02 + f.ph) * 0.4
        if (f.y > H - 26) { f.y = -4; f.x = Math.random() * W }
        if (f.x > W) f.x = 0; if (f.x < 0) f.x = W
        ctx2.beginPath(); ctx2.arc(f.x, f.y, f.r, 0, 7); ctx2.fill()
      }
      // Santa
      if (p.santa) {
        santaX += 1.6 * p.speed * santaDir
        santaY = 90 + Math.sin(t * 0.015) * 26
        if (santaX > W + 260) { santaDir = -1 }
        if (santaX < -260) { santaDir = 1 }
        drawSanta(santaX, santaY, santaDir)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return jsx('canvas', {
    ref, style: { position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' }
  })
}

// ---- global overlay: append a fixed layer directly to document.body so it
// escapes the titlebar's clipping/transform and covers the chat (workspace) window.
function Overlay() {
  const on = useValue($overlayOn)
  useEffect(() => {
    if (!on) return
    const host = document.createElement('div')
    host.dataset.xsnowOverlay = '1'
    host.style.cssText = 'position:fixed;inset:0;z-index:5000;pointer-events:none;overflow:hidden'
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;display:block'
    host.appendChild(canvas)
    document.body.appendChild(host)
    const g = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = window.innerWidth, H = window.innerHeight, raf, t = 0
    let flakes = [], santaX = -220, santaDir = 1
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const seed = (n) => { flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.6, vy: 0.4 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 0.6, ph: Math.random() * 6.28 })) }
    const drawSanta = (x, y, dir) => {
      g.save(); g.translate(x, y); g.scale(dir, 1)
      g.fillStyle = '#9d0208'; g.beginPath(); g.moveTo(0, 0); g.lineTo(46, 0); g.lineTo(40, 14); g.lineTo(6, 14); g.closePath(); g.fill()
      g.fillStyle = '#d00000'; g.beginPath(); g.arc(14, -10, 9, 0, 7); g.fill()
      g.fillStyle = '#f1fa8c'; g.beginPath(); g.arc(14, -17, 8, 0, 7); g.fill()
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(14, -24, 7, 0, 7); g.fill()
      g.fillStyle = '#1d3557'; g.fillRect(28, -12, 12, 10)
      g.fillStyle = '#2a9d8f'; g.fillRect(32, -20, 10, 8)
      g.fillStyle = '#7f5539'
      for (let i = 0; i < 3; i++) {
        const rx = 52 + i * 26, ry = -4 + Math.sin(t * 0.2 + i) * 3
        g.beginPath(); g.ellipse(rx, ry, 11, 6, 0, 0, 7); g.fill()
        g.beginPath(); g.arc(rx + 11, ry - 5, 4.5, 0, 7); g.fill()
      }
      g.fillStyle = '#ff0000'; g.beginPath(); g.arc(119, -9, 2.6, 0, 7); g.fill()
      g.fillStyle = 'rgba(255,60,60,0.35)'; g.beginPath(); g.arc(119, -9, 6, 0, 7); g.fill()
      g.restore()
    }
    const frame = () => {
      t++
      const p = $prefs.get()
      g.clearRect(0, 0, W, H)
      if (flakes.length !== p.snow) seed(p.snow)
      g.fillStyle = 'rgba(255,255,255,0.92)'
      for (const f of flakes) {
        f.y += f.vy * p.speed; f.x += f.vx * p.speed + Math.sin(t * 0.02 + f.ph) * 0.4
        if (f.y > H) { f.y = -4; f.x = Math.random() * W }
        if (f.x > W) f.x = 0; if (f.x < 0) f.x = W
        g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill()
      }
      if (p.santa) {
        santaX += 1.6 * p.speed * santaDir
        if (santaX > W + 260) santaDir = -1
        if (santaX < -260) santaDir = 1
        drawSanta(santaX, 90 + Math.sin(t * 0.015) * 26, santaDir)
      }
      raf = requestAnimationFrame(frame)
    }
    resize(); seed($prefs.get().snow)
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); host.remove() }
  }, [on])
  return null
}

function TitlebarToggle() {
  const t = usePluginI18n(ID)
  const on = useValue($overlayOn)
  return jsx(Tip, {
    label: t('toggleTip'),
    children: jsx('button', {
      type: 'button',
      className: 'inline-flex h-full items-center px-1.5 text-[0.8125rem] hover:text-foreground',
      style: { color: on ? 'var(--ui-accent)' : 'var(--ui-text-tertiary)' },
      onClick: () => { haptic('tap'); toggleOverlay() },
      children: on ? '❄️' : '☀️'
    })
  })
}

// ---- page -------------------------------------------------------------------
function XsnowPage({ ctx }) {
  const t = usePluginI18n(ID)
  const prefs = useValue($prefs)
  const update = (patch) => savePrefs({ ...$prefs.get(), ...patch })

  return jsxs('div', {
    className: 'relative flex h-full flex-col',
    children: [
      jsx('div', {
        style: { position: 'absolute', inset: 0 },
        children: jsx(SnowCanvas, { prefs })
      }),
      jsxs('div', {
        className: 'relative z-10 m-4 flex flex-wrap items-end gap-4 rounded-lg p-4',
        style: { background: 'var(--chrome-panel-bg, rgba(0,0,0,0.35))', border: '1px solid var(--ui-stroke-secondary)' },
        children: [
          jsxs('div', { className: 'flex flex-col gap-1', children: [
            jsx('div', { className: 'text-base font-semibold', children: t('title') }),
            jsx('div', { className: 'text-xs', style: { color: 'var(--ui-text-secondary)' }, children: t('subtitle') })
          ]}),
          jsxs('label', { className: 'flex items-center gap-2 text-xs', children: [
            t('snow'), jsx('input', { type: 'range', min: 0, max: 400, value: prefs.snow, onChange: e => update({ snow: +e.target.value }) })
          ]}),
          jsxs('label', { className: 'flex items-center gap-2 text-xs', children: [
            t('speed'), jsx('input', { type: 'range', min: 0.25, max: 2.5, step: 0.25, value: prefs.speed, onChange: e => update({ speed: +e.target.value }) })
          ]}),
          jsxs('label', { className: 'flex items-center gap-2 text-xs', children: [
            jsx('input', { type: 'checkbox', checked: !!prefs.santa, onChange: e => update({ santa: e.target.checked }) }), t('santa')
          ]}),
          jsxs('label', { className: 'flex items-center gap-2 text-xs', children: [
            jsx('input', { type: 'checkbox', checked: !!prefs.tree, onChange: e => update({ tree: e.target.checked }) }), t('tree')
          ]}),
          jsxs('label', { className: 'flex items-center gap-2 text-xs', children: [
            jsx('input', { type: 'checkbox', checked: prefs.overlay !== false, onChange: e => update({ overlay: e.target.checked }) }), t('overlayAll')
          ]}),
          jsx(Button, {
            size: 'sm', variant: 'outline',
            onClick: () => { haptic('tap'); host.notify({ kind: 'info', message: t('runHint') }) },
            children: t('launch')
          })
        ]
      })
    ]
  })
}

// ---- statusbar chip ---------------------------------------------------------
function SnowChip({ ctx }) {
  const t = usePluginI18n(ID)
  const on = useValue($overlayOn)
  return jsx(Tip, {
    label: t('chipTip'),
    children: jsx('button', {
      type: 'button',
      className: 'inline-flex h-full items-center px-1.5 text-[0.6875rem] hover:text-foreground',
      style: { color: on ? 'var(--ui-accent)' : 'var(--ui-text-tertiary)' },
      onClick: () => { haptic('tap'); toggleOverlay() },
      children: on ? '❄️ xsnow' : '☀️ xsnow'
    })
  })
}

export default {
  id: ID, // must match folder name
  name: 'XSnow Christmas',
  register(ctx) {
    syncPrefs(ctx)
    ctx.i18n.register({
      en: {
        title: '❄️ XSnow Christmas Overlay',
        subtitle: 'Snow + Santa sleigh overlay every chat window (Wayland-safe). Real xsnow binary is installed — run `xsnow` in a terminal for the classic X11 version.',
        snow: 'Snowfall', speed: 'Speed', santa: 'Santa sleigh', tree: 'Trees', overlayAll: 'Overlay all windows',
        launch: 'Run real xsnow',
        runHint: 'Open a terminal and run: xsnow   (add -above for snow over windows)',
        chipTip: 'Toggle snow overlay on all windows',
        toggleTip: 'Toggle snow overlay',
        nav: 'XSnow'
      }
    })

    // Permanent global overlay — titlebar slot stays mounted across chat/page navigation
    ctx.register({
      id: 'overlay', area: TITLEBAR_AREAS.center,
      render: () => jsx(Overlay, {})
    })
    ctx.register({
      id: 'titlebar-toggle', area: TITLEBAR_AREAS.right,
      render: () => jsx(TitlebarToggle, {})
    })

    // Full-page overlay canvas
    ctx.register({
      id: 'page',
      area: ROUTES_AREA,
      data: { path: '/xsnow' },
      render: () => jsx(XsnowPage, { ctx })
    })
    ctx.register({
      id: 'nav',
      area: SIDEBAR_NAV_AREA,
      data: { path: '/xsnow', label: '❄️ XSnow', codicon: 'sparkle' }
    })
    // Palette commands
    ctx.register({
      id: 'cmd',
      area: PALETTE_AREA,
      data: { id: 'xsnow.open', label: 'XSnow: open Christmas overlay', keywords: ['xsnow', 'christmas', 'snow', 'santa'], run: () => host.navigate('/xsnow') }
    })
    ctx.register({
      id: 'cmd-toggle',
      area: PALETTE_AREA,
      data: { id: 'xsnow.toggle', label: 'XSnow: toggle overlay on all windows', keywords: ['xsnow', 'toggle', 'overlay'], run: () => toggleOverlay() }
    })
    // Statusbar chip
    ctx.register({
      id: 'chip', area: STATUSBAR_AREAS.right, order: 140,
      render: () => jsx(SnowChip, { ctx })
    })
  }
}
