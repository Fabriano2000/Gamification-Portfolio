# Gamification Portfolio — Planet Walk

An interactive **HD-2D portfolio**. A silhouette walks on top of a tiny round world under a fantasy night sky. Walking turns the planet underneath you, so each part of the portfolio comes round in turn, and the loop never ends. Built with [three.js](https://threejs.org) and [postprocessing](https://github.com/pmndrs/postprocessing).

> Other concepts live on their own branches: `environments` has the side-scrolling street with 7 switchable environments.

## Run

```bash
npm install
npm run dev
```

## Day / night cycle

One lap around the planet is one day. You start at **dawn** (05:00) at home, and the day passes as you walk: morning at the crystal shrine, noon to sunset across the runestones, and night at the lighthouse and campfire. Night fades back into dawn just before you get home. The cycle changes:

- Sky gradient, sun and two moons rising and setting, clouds by day, stars, milky way, aurora and shooting stars by night
- Sun/moon light direction and color (always rim-lighting from behind), sky fill, fog
- Backdrop colors (aerial perspective), village and castle windows lighting up at night
- Glowing windows, crystals, runestones, campfire and the lighthouse beam, which get stronger at night
- Pollen by day, fireflies by night, and stronger glow at night

The HUD shows the time of day. All keyframes live in [`src/planet/timeofday.js`](src/planet/timeofday.js).

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
| `src/planet/timeofday.js` | Day/night keyframes (colors, light, glow) sampled from walking distance |
| `src/planet/sky.js` | Pixel sky gradient, sun, moons, clouds, stars, aurora, shooting stars |
| `src/planet/backdrop.js` | Parallax fantasy landscape (mountains, castle, floating islands, glowing tree, mist) |
| `src/env/kit.js` | Shared scenery builders (roofs, trees, signs, lamps…) |
| `src/pixel.js` / `src/sprite.js` | Pixel art data and lit billboard sprites |
| `src/post.js` | Bloom, depth of field, vignette, grain, chromatic aberration |
| `src/ui.js` | HTML overlays: dialog, quest cards, section panels, ring minimap |
