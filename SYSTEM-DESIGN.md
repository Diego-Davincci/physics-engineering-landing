# SYSTEM-DESIGN.md — Fósforo · Ingeniería Física

Design source of truth for the site. Referenced by `CLAUDE.md`.
Full reference (live previews, assets): Claude Design → "Fósforo · Ingeniería Física".
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

| Token             | Hex         | Use                                                                           |
| ----------------- | ----------- | ----------------------------------------------------------------------------- |
| `vacio`           | `#05070B`   | Page background                                                               |
| `carbon`          | `#0E131C`   | Raised surfaces: cards, panels, scrolled navbar                               |
| `grafito`         | `#1A2230`   | 1px borders, dividers, oscilloscope grid. Never behind small text             |
| `electrico`       | `#2F6BFF`   | Brand: primary buttons, active borders, strokes. **Never small text** (4.5:1) |
| `electrico-hover` | `#245BE6`   | Primary button hover/pressed                                                  |
| `on-electrico`    | `#FFFFFF`   | Text on an `electrico` fill                                                   |
| `fosforo`         | `#4FD6FF`   | The trace: data, course codes, interactive elements, focus, success           |
| `hielo`           | `#D6ECFF`   | Light accent, highlights                                                      |
| `texto`           | `#EEF3FA`   | Body text (≥14:1 on any surface)                                              |
| `muted`           | `#9DB0C8`   | Secondary text, idle nav links, notes                                         |
| `pergamino`       | `#E8DCC4`   | Single warm accent. **Use sparingly** (editorial details, loan "golden rule") |
| `exito`           | = `fosforo` | Success. **Always with a check icon. Never green**                            |
| `peligro`         | `#FF7A7A`   | Errors — _proposal, pending approval_                                         |

### Channels (career branches)

Like a 4-channel oscilloscope. Each channel has three tones:
`-fuerte` (borders, strokes) · `-suave` (text, labels) · `-profundo` (node backgrounds).
**The signal shape also identifies the branch** — never rely on color alone (color-blind users).

| Ch  | Branch            | fuerte      | suave     | profundo  | Signal      |
| --- | ----------------- | ----------- | --------- | --------- | ----------- |
| CH1 | Ciencia básica    | `electrico` | `fosforo` | `#0F2147` | Sine        |
| CH2 | Mecánica y diseño | `#8C99AB`   | `#C3CCD8` | `#262D38` | Trapezoid   |
| CH3 | Electrónica       | `#2BD47D`   | `#8FF0BE` | `#0B3A26` | Square      |
| CH4 | Física teórica    | `#7C6CFF`   | `#B9B0FF` | `#241F55` | Wave packet |

- **Green means electronics. Never use green for success.**
- `ch4-fuerte` and `electrico` are for strokes, not text.
- Branches are _our_ reading to guide students, not official categories
  (Acuerdo 0014 de 2025). The curriculum map has two views:
  **"Por agrupación"** (official) and **"Por ruta"** (channels).

---

## 3. Typography

Google Fonts: Instrument Serif (italic), Geist (400/500/600), Geist Mono (400/500).

| Family                    | Token          | Fallback            | Use                                                       |
| ------------------------- | -------------- | ------------------- | --------------------------------------------------------- |
| Instrument Serif _Italic_ | `--font-serif` | Georgia, serif      | Big titles, hero — the editorial gesture                  |
| Geist                     | `--font-sans`  | system-ui           | All UI                                                    |
| Geist Mono                | `--font-mono`  | ui-monospace, Menlo | Data, course codes (`3006875 · 5 cr`), uppercase eyebrows |

| Style     | Family       | Size / line-height | Notes                    |
| --------- | ------------ | ------------------ | ------------------------ |
| `hero`    | serif italic | 96 / 1             | −0.01em. Hero title only |
| `display` | serif italic | 56 / 1.05          | Section titles           |
| `title`   | serif italic | 32 / 1.15          | Block and card titles    |
| `heading` | sans 600     | 20 / 28            | Functional headings      |
| `body`    | sans 400     | 16 / 24            | Running text             |
| `small`   | sans 400     | 14 / 20            | Nav, buttons, notes      |
| `data`    | mono 400     | 13 / 20            | Codes, credits, figures  |
| `eyebrow` | mono 400     | 11 / 16            | Uppercase, +0.14em       |

---

## 4. Key patterns

**Hero (approved):** _Creation of Adam_ reimagined — the finger reaches the tip of an
oscilloscope probe. Duotone (`vacio` + `electrico`) arm from the left; the scope sits
where God would, on a blue mantle. An arc jumps across the gap and the trace
"lights up" as the cursor approaches. Title _Ingeniería Física_ (`hero`), eyebrow
"UNAL · SEDE MEDELLÍN · FACULTAD DE CIENCIAS", tagline "Donde la ciencia toca la
instrumentación". Main variant: Faraday with the oscilloscope. Cinemagraph-style;
**never animate faces**.

**Navbar:** IF monogram (left) · Malla · Materias · Laboratorio · ¿A quién acudo?
(center) · ⌘K course search + primary button **"Pedir casillero"** (right).
Transparent at top; on scroll → `carbon` with 1px `grafito` bottom border.

**Assets:** IF monogram, 4 signal glyphs (SVG), duotone Adam fresco.

---

## 5. Motion

- Motion should feel like a signal: quick, precise, purposeful.

---

## 6. Frame Prototypes

All protoypes designed live in this URL: https://claude.ai/artifact/MJVhMQEZQjrRFCj2v8R3UH#page-eb62782fa9b9
