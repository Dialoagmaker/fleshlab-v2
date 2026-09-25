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
- `#F04435` — FLESHLAB red: recording light, stamp ink and calls to action
- `#C59B61` — restrained archive amber, only for occasional metadata emphasis

Red is a signal, not a page wash. Avoid luxury copper, brown gradients, glossy orange and SaaS-blue accents.

## Type

- Primary display/UI: bold condensed-feeling system sans (`Inter`, Arial fallback)
- Metadata: monospace (`Courier New` fallback)
- No serif, script or decorative fashion typography in public UI

Display type carries the brand mark and section titles. Monospace carries tape IDs, timecodes, labels and production notes.

## Spacing and structure

Use a compact archive rhythm built from 8/13/17/24/38/52/70/100px steps. The content maximum is 1540px. Full-bleed media can escape the content column; metadata and controls remain aligned.

## Media ratios

- Hero: full stage, `object-fit: cover`, one intentional focal position
- Tape/contact-sheet cards: 16:10 or 16:9
- Performer sheets: 4:5 portrait
- Series posters: 1.6:1, or a full-width 2.9:1 feature when only one public series exists

Never stretch media, leak private assets or expose storage references. Amateur source quality is acceptable; accidental cropping and broken alignment are not.

## Components

- `FleshNav` — archive terminology and public navigation
- `RawHero` — selected footage frame with REC/timecode annotations
- `TapeCard` — public video archive card
- `PerformerSheet` — casting/contact-sheet style performer card
- `SeriesPoster` — public collection/series treatment
- `FilmMetadata` — safe public tape metadata
- `BrandStatement` — restrained AMATEUR WINS. brand moment
- `EarnPoster` — creator recruitment poster linking to Earn
- `FleshFooter` — end-credit/archive footer

## Texture rules

Use grain, scan lines, imperfect borders and stamp labels only as low-opacity layers. Texture must never reduce contrast, obscure metadata or create unnecessary animation. Respect `prefers-reduced-motion`.

## Responsive behavior

Desktop uses contact sheets and aligned archive strips. Mobile becomes a swipeable tape archive with stacked dossier sheets, full-width frames and a compact menu. Text stays readable; no desktop composition is merely shrunk.

## Safety boundary

The public design consumes only the existing safe V3 public projections. It must not display creator records, identity documents, submission media, internal notes, audit data, raw storage paths or unpublished content.
