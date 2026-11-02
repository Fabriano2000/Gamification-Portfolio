# Gamification Portfolio — Planet Walk

An interactive **HD-2D portfolio**. A silhouette walks on top of a tiny round world under a fantasy night sky. Walking turns the planet underneath you, so each part of the portfolio comes round in turn, and the loop never ends. Built with [three.js](https://threejs.org) and [postprocessing](https://github.com/pmndrs/postprocessing).

> Other concepts live on their own branches: `environments` has the side-scrolling street with 7 switchable environments.

## Run

```bash
npm install
npm run dev
```

## The planet

| Stop | Opens |
| --- | --- |
| Cottage | About |
| Sage (NPC) | Tips |
| Crystal shrine | Skills |
| 3 runestones | Projects (floating quest cards, then full details) |
| Lighthouse | Career |
| Campfire + mailbox | Contact |

The ring in the top-right is a minimap of the planet. The label at the top shows the current or next stop.

## Controls

| Key | Action |
| --- | --- |
| A / D or ← / → | Walk (turns the planet) |
| E / Enter / Space | Interact, advance dialog |
| Q | Quick View (plain portfolio) |
| Esc | Settings (graphics quality) |

Touch devices get on-screen buttons. Add `?q=low|medium|high` to force a quality tier.

## Editing content

All text lives in [`src/content.js`](src/content.js).

## Code map

| File | What it does |
| --- | --- |
| `src/main.js` | Game loop, camera, moonlight, input, planet rotation, HUD |
| `src/planet/planet.js` | The disc world, rim scenery and the 7 stops |
| `src/planet/sky.js` | Painted night sky, twinkling stars, aurora, shooting stars |
| `src/planet/backdrop.js` | Parallax fantasy landscape (mountains, castle, floating islands, glowing tree, mist) |
| `src/env/kit.js` | Shared scenery builders (roofs, trees, signs, lamps…) |
| `src/pixel.js` / `src/sprite.js` | Pixel art data and lit billboard sprites |
| `src/post.js` | Bloom, depth of field, vignette, grain, chromatic aberration |
| `src/ui.js` | HTML overlays: dialog, quest cards, section panels, ring minimap |
