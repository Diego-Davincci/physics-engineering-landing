# SYSTEM-DESIGN.md — Fósforo · Ingeniería Física

Design source of truth for the site. Referenced by `CLAUDE.md`.
Full reference (live previews, assets): Claude Design → "Fósforo · Ingeniería Física".
Tokens live in `src/styles/global.css`; this file explains them.
If a value you need is not here, ask — don't invent one.

---

## 1. Personality

**Concept: an oscilloscope screen.** Deep black background, electric-blue brand,
phosphor-cyan "trace" for data. One warm accent — parchment — borrowed from
Michelangelo's _Creation of Adam_, the base of the hero.

The site feels like **a precise instrument with an editorial soul**: technical,
calm and exact in the UI; expressive and human in the headlines.

- **Useful before flashy.** Every section answers one concrete student question.
- **Verifiable.** Data comes from an official document and is cited with its date.
- **Instant.** No "Cargando…" screens — content ships in the static HTML.
- **One data source.** Curriculum, people and agreements live in the repo (JSON/YAML).
- **Student-made.** This is a student initiative, not an official university site.
  The footer always says so.

**Voice (UI copy, Spanish – Colombia):** clear and direct, _tuteo_. Short sentences,
verb first ("Pedir casillero", "Ver la malla"). No empty superlatives. Numbers
always carry their source.

---

## 2. Color — dark theme only (for now)

**Rule 80/20:** 80% of the UI is black + blue. Channel colors are accents only.
Every token is a Tailwind color: `bg-void`, `text-muted`, `stroke-phosphor`, `border-graphite/50`…

| Token            | Hex          | Use                                                                           |
| ---------------- | ------------ | ----------------------------------------------------------------------------- |
| `void`           | `#05070B`    | Page background                                                               |
| `carbon`         | `#0E131C`    | Raised surfaces: cards, panels, navbar island                                 |
| `graphite`       | `#1A2230`    | 1px borders, dividers, oscilloscope grid. Never behind small text             |
| `electric`       | `#2F6BFF`    | Brand: primary buttons, active borders, strokes. **Never small text** (4.5:1) |
| `electric-hover` | `#245BE6`    | Primary button hover/pressed                                                  |
| `on-electric`    | `#FFFFFF`    | Text on an `electric` fill                                                    |
| `phosphor`       | `#4FD6FF`    | The trace: data, course codes, interactive elements, focus                    |
| `ice`            | `#D6ECFF`    | Light accent, highlights, the spark                                           |
| `foreground`     | `#EEF3FA`    | Body text (≥14:1 on any surface)                                              |
| `muted`          | `#9DB0C8`    | Secondary text, idle nav links, notes                                         |
| `subtle`         | `#6F7F96`    | Footer and fine print (4.9:1 on `void`). Not for body text                    |
| `parchment`      | `#E8DCC4`    | Single warm accent. **Use sparingly** (editorial details, loan "golden rule") |
| `success`        | = `phosphor` | Success. **Always with a check icon. Never green**                            |
| `danger`         | `#FF7A7A`    | Errors — _proposal, pending approval_                                         |

**Warm light (hero only):** the glow at the finger–probe contact uses Tailwind's built-in
`amber-100…500` at low opacity, like an early electric lamp. It is light, not a UI
color — never use amber for text, borders or states.

### Channels (career branches)

Like a 4-channel oscilloscope. Each channel has three tones:
`-strong` (borders, strokes) · `-soft` (text, labels) · `-deep` (node backgrounds).
Classes: `stroke-ch3-strong`, `text-ch3-soft`, `bg-ch3-deep`…
**The signal shape also identifies the branch** — never rely on color alone (color-blind users).

| Ch  | Branch            | strong     | soft       | deep      | Signal      |
| --- | ----------------- | ---------- | ---------- | --------- | ----------- |
| CH1 | Ciencia básica    | `electric` | `phosphor` | `#0F2147` | Sine        |
| CH2 | Mecánica y diseño | `#8C99AB`  | `#C3CCD8`  | `#262D38` | Trapezoid   |
| CH3 | Electrónica       | `#2BD47D`  | `#8FF0BE`  | `#0B3A26` | Square      |
| CH4 | Física teórica    | `#7C6CFF`  | `#B9B0FF`  | `#241F55` | Wave packet |

- **Green means electronics. Never use green for success.**
- `ch4-strong` and `electric` are for strokes, not text.
- Branches are _our_ reading to guide students, not official categories
  (Acuerdo 0014 de 2025). The curriculum map has two views:
  **"Por agrupación"** (official) and **"Por ruta"** (channels).

---

## 3. Typography

Google Fonts via Astro's Fonts API (`astro.config.mjs`): Instrument Serif (400 italic),
Bricolage Grotesque (400/500/600). No monospace font: figures use tabular numbers.

| Family                    | Token          | Fallback              | Use                                      |
| ------------------------- | -------------- | --------------------- | ---------------------------------------- |
| Instrument Serif _Italic_ | `--font-serif` | serif                 | Big titles, hero — the editorial gesture |
| Bricolage Grotesque       | `--font-sans`  | system-ui, sans-serif | All UI, data and eyebrows                |

One class = one complete style (family, weight, size, line-height). Sizes step up at `md` (768px).

| Class          | Family       | Size / line-height    | Notes                             |
| -------------- | ------------ | --------------------- | --------------------------------- |
| `type-hero`    | serif italic | 56 → 96 / 1           | −0.01em. Hero title only          |
| `type-display` | serif italic | 40 → 56 / 1.05        | Section titles                    |
| `type-title`   | serif italic | 28 → 32 / 1.15        | Block and card titles             |
| `type-lead`    | sans 400     | 18/26 → 20/28         | Taglines, intro paragraphs        |
| `type-heading` | sans 600     | 20 / 28               | Functional headings               |
| `type-nav`     | sans 500     | 15 / 20               | Navbar links                      |
| `type-body`    | sans 400     | 16 / 24               | Running text (body default)       |
| `type-small`   | sans 400     | 14 / 20               | Buttons, notes, footer credit     |
| `type-data`    | sans 400     | 13 / 20               | Codes, credits, figures. Tabular  |
| `type-eyebrow` | sans 600     | 12 / 16               | Uppercase, +0.14em                |

---

## 4. Layout & shape

- **Page width:** `max-w-page` (1280px) + `mx-auto` for all content — navbar, hero text, footer,
  sections — on every screen size. Backgrounds and the hero's light may run full-bleed.
- **Gutters:** `px-4` on phones, `md:px-10` from 768px.
- `rounded-control` (6px): inputs, the IF monogram.
- `rounded-full`: buttons, the navbar island, pills.

---

## 5. Key patterns

**Hero (approved · "Faraday en pose de fresco"):** _Creation of Adam_ reimagined — Faraday
reclines on the left and reaches for the tip of an oscilloscope probe; the scope sits where
God would, on a blue mantle. Title _Ingeniería Física_ (`type-hero`), eyebrow
"UNAL · Sede Medellín · Facultad de Ciencias", tagline "Donde la ciencia toca la
instrumentación." (`type-lead`).

- Always exactly one screen tall (`h-svh`), never scrolls.
- Faraday and the scope share one drawing "stage", so the probe always meets the finger.
- **The spark is always lit** (ice with a phosphor glow), with a warm amber halo around the
  contact that switches on once at load.
- The scope screen shows the four channel signals (§2).
- **Faraday's ground** (Adam's hillside): a lab bench in the scope's line style, a parchment
  cloth shaped to his underside, his books under the elbow, and a Leyden jar (flares with each
  discharge) + iron induction ring at the far end. Bench legs fade out below the stage.
- Cinemagraph-style; **never animate faces**.
- **From lg** text + art are one block centered vertically on screen; the art sits right under
  the tagline, keeps its proportions and grows up to the 1280px page width.
- **Below lg** the art is wider than the screen and framed on the contact — the fresco's crop
  of the two hands: Faraday's hand enters from the left, the oscilloscope from the right.
  Tablet shows more of both.

**Navbar ("Isla flotante con traza"):** fixed, floating 12–20px from the top.
IF monogram + "Ing. Física · UNAL" (left) · island with the section links (center) ·
"Pedir casillero" primary button (right). The island is `carbon` at 72% with a `graphite`
border, soft shadow and blur. Hover/focus on a link: its channel-colored dot lights up and a
small wave runs under it.

Below `lg`, the links move to a menu:
- The menu button is a classic hamburger (always recognizable); open, its bars morph into an ✕.
- The panel opens like the scope powering on (a bright line that unfolds), then each link
  arrives in turn, lighting its dot and sweeping its trace once.
- A dim backdrop covers the page. Closes with Esc (focus returns to the button), the backdrop,
  a link, or resizing to `lg`. The page doesn't scroll behind it.

**Footer ("logo + créditos"):** a quiet strip with a `graphite` top border. UNAL shield +
"Universidad Nacional de Colombia · Sede Medellín" (`type-eyebrow`, `subtle`) on the left;
"Made with ❤️ to IF" (`type-small`, `subtle`) linking to the author's GitHub on the right.

**Assets:** IF monogram, UNAL shield, Faraday cutout (`src/assets/hero/faraday.png`).

---

## 6. Motion

- Motion should feel like a signal: quick, precise, purposeful.
- **Hero loop (3.2s):** the arc crackles → a pulse runs down the probe cable → CH1 lights and
  the screen flash → the beam redraws the traces left to right, leaving an afterglow.
  Once at load: the screen powers on and the warm light switches on.
- Animations are written as raw Tailwind classes (`animate-[name_…]`) with their
  `@keyframes` in the component's `<style>`. `global.css` holds only the system.
- **Reduced motion:** everything static (global rule in `global.css`). Pages must still read
  complete: spark lit, traces drawn, glow on.

---

## 7. Frame Prototypes

All prototypes are designed live at: https://claude.ai/artifact/MJVhMQEZQjrRFCj2v8R3UH#page-eb62782fa9b9
