# Design System (v0.1)

Tokens live in `src/styles/tokens.css` (colour, motion, gutters) and
`tailwind.config.ts` (type scale, spacing, breakpoints). Components consume
tokens only, so the system can evolve in one place.

## Palette

| Token       | RGB          | Hex     | Use                                  |
|-------------|--------------|---------|--------------------------------------|
| `obsidian`  | 7 9 8        | #070908 | Page background                      |
| `forest`    | 10 31 23     | #0a1f17 | Atmosphere, panels, image backing    |
| `emerald`   | 16 140 94    | #108c5e | Light, glow, gemstone                |
| `champagne` | 200 177 124  | #c8b17c | Accent: eyebrows, rules, primary CTA |
| `ivory`     | 242 236 221  | #f2ecdd | Text                                 |

Alpha works through Tailwind, e.g. `text-ivory/70`, `bg-obsidian/85`.

## Typography

- Display: Cormorant Garamond (high-contrast serif), light weight, italic for emphasis.
- Body / UI: Inter.
- Scale (Tailwind `text-*`): `display-xl` (fluid 44–100px), `display-lg`, `display-md`,
  `heading`, `body-lg`, `body`, `caption`, `eyebrow` (11px, 0.32em tracking, uppercase).

## Spacing and grid

- `px-gutter` = clamp(1.25rem, 4vw, 4rem); `py-section` = clamp(5rem, 12vw, 10rem).
- `.container-maison`: max 1680px, gutter padding.
- `.grid-maison`: 4 columns (mobile), 8 (tablet), 12 (laptop+).

## Breakpoints

`sm` 640 · `md` 768 (tablet) · `lg` 1024 (laptop, desktop nav) · `xl` 1280 · `2xl` 1600.

## Buttons

- Primary: hairline champagne frame, fills upward on hover/press, wrapped in `Magnetic` on fine pointers.
- Ghost: text with a rule that lengthens on hover/press.
- No glows. Touch gets `:active` feedback; hover styles apply only where hover exists.

## Navigation

Transparent over the hero; at 48px scroll becomes `obsidian/85` with blur and a hairline.
Links use a drawn underline (`.nav-link`). Below `lg` a full-screen menu opens with a
clip-path reveal and staggered serif links.

## Image treatment

`.image-maison`: forest backing, slightly desaturated and darkened, hairline ivory edge,
bottom gradient for caption legibility.

## Motion principles

1. Slow starts, long soft landings: `cubic-bezier(0.22, 1, 0.36, 1)` everywhere.
2. Never bouncy; no overshoot.
3. Content must never wait on JavaScript or WebGL: entrances are CSS.
4. Motion is reduced, not removed, for `prefers-reduced-motion`.
5. Movement follows light: drifting atmosphere and slow orbiting highlights, not decoration.

## Exhibit (Milestone 2)

- Each gemstone carries its own theme (glow, deep, accent, key/rim light) in
  `src/content/gemstones.ts`; the champagne UI accents stay constant across all four.
- Environment: near-black base, one radial atmosphere per stone, crossfaded over 1.6s.
- Specimen marks: the real cut of each stone drawn as a small plan-view glyph.
- Selection controls: hairline square arrows (nudge on hover, scale on press),
  tab labels in `eyebrow` style with a serif name.
- Discover panel: right-hand sheet on tablet/desktop, bottom sheet on phones.
