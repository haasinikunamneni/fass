# MAISON [BRAND NAME] — Milestones 1 & 2

An immersive gemstone jewellery house website.

- **Milestone 1:** global design system, navigation, cinematic emerald hero.
- **Milestone 2:** "The World of Gemstones", an interactive exhibition of four
  distinct 3D stones (see below).

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 ·
React Three Fiber + Three.js + drei · GSAP + ScrollTrigger · Framer Motion · Lenis

## Requirements

- Windows 10/11 (also works on macOS / Linux)
- Node.js 18.18 or newer (Node 20 or 22 LTS recommended) — https://nodejs.org

## Run locally (PowerShell)

```powershell
node -v
npm -v

# Go to the extracted project folder (adjust the path)
cd $HOME\Downloads\maison

npm install
npm run dev
```

Open http://localhost:3000

## Production build

```powershell
npm run build
npm run start
```

## Type check only

```powershell
npm run typecheck
```

## Set the brand name

The brand name is a configurable placeholder. To change it:

```powershell
Copy-Item .env.example .env.local
notepad .env.local      # set NEXT_PUBLIC_BRAND_NAME=Your Name
npm run dev             # restart the dev server
```

## Troubleshooting (Windows)

PowerShell says "running scripts is disabled on this system":

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Port 3000 is busy:

```powershell
npm run dev -- -p 3001
```

The gem does not appear: the page shows a static SVG emerald when WebGL is
unavailable. Enable hardware acceleration in your browser to see the 3D stone.

Fonts (Cormorant Garamond, Inter) load from Google Fonts. Offline, the site
falls back to Georgia and system fonts.

## Milestone 1 contents

- **Navigation** — transparent over the hero, turns into a blurred dark bar on
  scroll; drawn-underline hover states; search overlay; bag button with count;
  animated full-screen mobile menu (focus trap, Escape to close, focus returns
  to the opener, scroll lock, skip link, `aria-*` labelling).
- **Hero** — a 3D emerald-cut stone (physically based transmission material,
  procedural studio lighting, floating motion, damped mouse / touch-drag
  rotation, slowly orbiting accent lights), CSS atmospheric light, film grain,
  CSS-only headline entrance, magnetic primary CTA, animated scroll indicator,
  scroll-linked exit via GSAP ScrollTrigger.
- **Art direction** — desktop: stone right of centre, copy bottom-left. Phone:
  stone upper centre, copy and stacked CTAs below.
- **Performance** — the 3D bundle loads lazily after first paint and idle; the
  headline and nav never wait on it. Render loop pauses off-screen. Phones and
  low-core devices use fewer samples, lower resolution and no backside pass.
  Reduced-motion users get static composition, no smooth scroll, no particles.
- **Fallbacks** — no WebGL, lost context, or a scene error → the static SVG
  emerald stays; the page is unaffected.

## Milestone 2: The World of Gemstones

A private-exhibition style section directly below the hero (`#gemstones`, also
linked from the navigation).

- **Four different stones, not one model recoloured.** Each has its own cut
  geometry built procedurally in `src/lib/gemShapes.ts`:
  emerald (rectangular step cut), ruby (elongated oval), sapphire (pear),
  diamond (round brilliant with star and kite facets). Each also has its own
  optical material (refractive index, absorption colour, dispersion, inner glow).
- **Own lighting environment per stone.** The key, rim and cursor lights ease to
  each stone's colours; the section atmosphere crossfades to match.
- **Selection.** Specimen tabs (click, arrow keys, Home/End), previous / next
  buttons, a 01 / 04 counter, and a "Discover More" panel with the stone's story
  and facts. Mobile: swipe left/right anywhere on the stage; nothing needs hover.
- **Interaction.** Stones float, follow the cursor, and can be dragged to rotate
  with a mouse. Switching spins the old stone out while the new one spins in.
- **Motion.** Framer Motion for text reveals, tabs and panel; GSAP ScrollTrigger
  for scroll entrances and a subtle parallax. The four texts share one grid cell,
  so changing stone never shifts the layout.
- **Performance.** The exhibit's 3D bundle only loads when the section is within
  600px of the viewport. The render loop runs only while it is on screen, hidden
  stones skip rendering entirely, and phones / low-core devices use fewer
  samples, lower resolution and no backside pass.
- **Fallbacks.** No WebGL, a lost context, or a scene error leaves the SVG imagery
  (the real cut of each stone, drawn from the same data) in place, with the same
  crossfade. `prefers-reduced-motion` removes idle motion, parallax and sparkles.

### Editing the content

All copy, facts and colours are in **`src/content/gemstones.ts`**: intro lines,
longer stories, fact tables, cut names, section title, and each stone's theme
colours. Components contain no hardcoded gemstone copy.

## Structure

```
src/
  app/               layout and page
  components/
    layout/          Navbar, MobileMenu, SearchOverlay
    sections/        Hero, GemstoneExhibit (page sections)
    exhibit/         GemStage, GemTabs, GemGlyph, DiscoverPanel
    three/           EmeraldScene, HeroGem (hero); GemstoneScene, gemGeometry (exhibit)
    ui/              Button, Magnetic, Wordmark, Icons, ErrorBoundary
    providers/       SmoothScroll (Lenis + GSAP ticker)
  config/            brand (placeholder name), navigation
  content/           gemstones (editable exhibit copy and themes)
  hooks/             useMediaQuery, useWebGLSupport, useFocusTrap
  lib/               animation, gsap, shared hero/exhibit state, gem shapes, colour helper
  styles/            tokens.css (palette, motion), globals.css
docs/DESIGN_SYSTEM.md
```

See `docs/DESIGN_SYSTEM.md` for the palette, type scale, spacing, grid, buttons,
motion principles and breakpoints.


## Cinematic loader (coal to diamond)

Code: `src/components/loader/` · Assets: `public/brand/loader/` · Mounted once in
`src/app/layout.tsx` (plus a tiny gate script in `<head>` and 6 lines in
`globals.css`). No existing component was modified.

> **Status: implemented, NOT yet run.** It was written in an environment with no
> network, so `npm install`, the production build, visual checks and mobile tests
> have not been done. Treat everything below as untested until you run it.
> Only the pure geometry (`diamondGeometry.ts`) was executed and verified.

### Run and test (PowerShell)

```powershell
cd $HOME\Downloads\maison
npm install
npm run typecheck
npm run dev
```

Open http://localhost:3000. The sequence plays once per browser session.

| URL | Behaviour |
| --- | --- |
| `/?loader=1` | Force the full sequence (use this for testing) |
| `/?loader=0` | Skip it |
| `Esc` or the "Skip intro" button (Tab to it) | Skip while playing |

Then `npm run build` and `npm run start`. Optional geometry self-test (Node 22+):

```powershell
node --experimental-strip-types scripts/verify-diamond-geometry.ts
```

### Replacing the temporary logos (no animation code changes)

The two SVGs in `public/brand/loader/` are **temporary placeholders, not approved
brand logos.** Overwrite them with the final artwork (or change `LOGOS` in
`loader/config.ts`). Contract:

- `viewBox` is required; any size or aspect ratio.
- Each `<path>` is one stroke, drawn in document order. Multiple paths are fine.
- Optional per-path attributes: `data-order="n"`, `data-stroke-width="n"`, `data-guide` (skip).
- Path direction is the writing direction; nothing is reversed or redrawn.
  `ordering: "rtl" | "ltr"` in config sorts by position only when no `data-order` exists.
- Only `<path>` elements are read. Convert other shapes to paths. Outlined (filled)
  artwork is traced along its outline; single-stroke centrelines look best.
- Particle density, step size and default stroke width are in `config.ts`.

### Architecture

| File | Role |
| --- | --- |
| `config.ts` | Timings, colours, quality tiers, logo sources |
| `choreography.ts` | One GSAP timeline tweening plain state objects |
| `state.ts` | Shared mutable animation state (no React re-renders) |
| `LogoStage.tsx` + `logo/*` | Logo-agnostic 2D stroke writing, particle transfer A to B |
| `diamond/diamondGeometry.ts` | Brilliant cut, 73 planar facets (verified) |
| `diamond/shaders.ts` | Crayon coal, rough crystal, ray-traced cut diamond |
| `diamond/LoaderScene.tsx` | R3F scene, flight path and camera rig |
| `FassLoader.tsx` | Gate, asset loading, timeouts, handoff, accessibility |

Behaviour: pure `#000000` isolated overlay; plays once per session; skipped for
reduced motion; 45 s hard ceiling; holds the final scene if assets are slow;
falls back to the 2D signature without WebGL; goes straight to the site on any
shader, context or logo-loading failure. The site background (`#070908`) is only
revealed by the final overlay fade (no white flash).

### Known limits

- Visual quality (crayon look, morph, optics, camera framing) is unreviewed.
  Expect tuning. Most knobs are in `config.ts` and `choreography.ts`.
- Coal to rough to cut is a vertex-shader morph of one mesh plus a debris
  particle layer, not a true topology change.
- The cut diamond uses analytic ray tracing against its facet planes with a
  procedural studio; it is not a path tracer. Heavy per pixel, so resolution is
  lowered during macro close-ups.
- Sound is not implemented.
- The hero's own entrance animation runs underneath the loader.

## FASS loader (visual prototype)

Plays once per browser session. Add `?loader=1` to replay it, `?loader=0` to skip it; press Esc or use the hidden "Skip intro" button to leave early.

**Artwork is separate from animation.** The two SVGs in `public/brand/loader/` are **temporary, hand-drawn approximations**, not approved brand artwork:

- `arabic-placeholder.svg` - the word فص (initial fa with its dot, joined to final sad). Built from the correct Arabic letter structure rather than traced from the reference raster, but still a rough single-line sketch.
- `english-placeholder.svg` - "Fass" with a sweeping capital F, opening flourish and exit tail. An approximation of the reference board, not finished calligraphy.

To replace them, overwrite the files (or change `LOGOS` in `src/components/loader/config.ts`). Each `<path>` is one stroke, drawn in document order; optional `data-stroke-width`. No animation code changes are needed.

Pacing lives in `config.ts` (`TIMING`) and `choreography.ts`; rendering in `diamond/` (WebGL) and `LogoStage.tsx` (particle signature).
