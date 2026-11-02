# Gamification Portfolio

An interactive **HD-2D pixel RPG portfolio**: pixel-art sprites walking through a lit 3D cyberpunk city, with depth-of-field, bloom, wet reflections and rain. It's built with [three.js](https://threejs.org) and [postprocessing](https://github.com/pmndrs/postprocessing).

Design source: Figma file "Pixel RPG Portfolio — Cyberpunk" (pages `01 — 2D Design` and `02 — HD-2D Plan`).

## Run

```bash
npm install
npm run dev
```

Build for production with `npm run build`, which outputs to `dist/`.

## Environments

Pick one in **Settings** (title screen or Esc). The switch is live, with no reload:

| Environment | Stations | Mood |
| --- | --- | --- |
| Cyberpunk City | terminals | rainy neon night |
| Fantasy Town | notice boards | golden-hour medieval square |
| Fantasy World | runestones | daytime ruins, floating islands |
| Museum / Exhibition | pedestals | gallery with spotlights and marble |
| Modern City | info kiosks | sunny downtown plaza |
| Modern Japanese City | vending machines | evening shotengai, sakura |
| Office | workstations | high-rise floor with a window wall |

You can also force one with `?env=cyberpunk|fantasy-town|fantasy-world|museum|modern-city|japan-city|office`.

## Controls

| Key | Action |
| --- | --- |
| A / D or ← / → | Walk |
| E / Enter / Space | Interact, advance dialog |
| Q | Quick View (plain portfolio) |
| Esc | Menu (graphics quality) |

Touch devices get on-screen buttons. Add `?q=low|medium|high` to the URL to force a quality tier.

## Editing content

All text (name, projects, skills, career, contact) lives in [`src/content.js`](src/content.js).

## Code map

| File | What it does |
| --- | --- |
| `src/pixel.js` | Sprite and tile pixel data (same as Figma), turned into canvas textures |
| `src/sprite.js` | Billboard sprite: lit plane, sprite-sheet animation, cut-out shadows |
| `src/env/themes.js` | The 7 environment presets (atmosphere, lighting, UI colors, scenery) |
| `src/env/kit.js` | Shared scenery builders: sky, ground, facades, roofs, signs, trees, props |
| `src/world.js` | Builds a theme plus the stations, NPC, shards and particles; disposes on switch |
| `src/particles.js` | Rain, sakura petals, leaves, fireflies, pollen, dust |
| `src/player.js` | Movement and walk/idle animation |
| `src/post.js` | Bloom, tilt-shift DOF, chromatic aberration, vignette, grain, SMAA |
| `src/quality.js` | High/Medium/Low tiers with auto-detection |
| `src/ui.js` | HTML overlays: dialog, quest cards, project modal, Quick View |

## Status

This is a prototype of one zone (Zone 03, Quest Board). Zones 01, 02, 04 and 05 from the Figma world map are next.
