# FLESHLAB Public Design System

## Direction

FLESHLAB is an independent media label built around **AMATEUR WINS.** The public experience is a digital archive and zine: raw source imagery is presented intentionally through contact sheets, tape labels, production metadata and dossier-like people files.

The system is deliberately anti-corporate while remaining accessible, responsive and production-safe.

## Color

- `#050505` — archive black and page background
- `#101010` — charcoal surfaces
- `#171717` — media panels
- `#EEECE6` — dirty-white paper and primary text
- `#AAA9A3` — metadata and supporting text
- `#FF342C` — FLESHLAB red: recording light, stamp ink and calls to action

Red is a signal, not a page wash. Avoid luxury copper, brown gradients, glossy orange and SaaS-blue accents.

## Type

- Primary display/UI: bold condensed-feeling system sans (`Inter`, Arial fallback)
- Metadata: monospace (`Courier New` fallback)
- No serif, script or decorative fashion typography in public UI

Display type carries the brand mark and section titles. Monospace carries tape IDs, timecodes, labels and production notes.

## Spacing and structure

Use the approved compact archive rhythm built from 8/12/20/28/48/72px steps. The content maximum is 1510px. Full-bleed hero media can escape the content column; metadata and controls remain aligned.

## Media ratios

- Hero: a left copy / right real-media split, `object-fit: cover`, one intentional focal position
- Tape/contact-sheet cards: consistent landscape archive frames
- Performer sheets: 4:5 portrait
- Series posters: 1.6:1, or a full-width 2.9:1 feature when only one public series exists

Never stretch media, leak private assets or expose storage references. Amateur source quality is acceptable; accidental cropping and broken alignment are not.

## Components

- `FleshNav` — archive terminology and public navigation
- `RawHero` — approved split hero with documentary copy, REC/timecode and a selected public frame
- `TapeCard` — public video archive card
- `PerformerSheet` — casting/contact-sheet style performer card
- `SeriesPoster` — public collection/series treatment
- `FilmMetadata` — safe public tape metadata
- `BrandStatement` — four-part AMATEUR WINS. manifesto/contact-sheet composition
- `EarnPoster` — production-call creator recruitment composition linking to Earn
- `FleshFooter` — end-credit/archive footer

## Texture rules

Use grain, scan lines, imperfect borders and stamp labels only as low-opacity layers. Texture must never reduce contrast, obscure metadata or create unnecessary animation. Respect `prefers-reduced-motion`.

## Responsive behavior

Desktop uses contact sheets and aligned archive strips. Mobile becomes a swipeable tape archive with stacked dossier sheets, full-width frames and a compact menu. Text stays readable; no desktop composition is merely shrunk.

## Safety boundary

The public design consumes only the existing safe V3 public projections. It must not display creator records, identity documents, submission media, internal notes, audit data, raw storage paths or unpublished content.
