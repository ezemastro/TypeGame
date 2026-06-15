# AstroType — Visual Design Document

## 🎯 Visual Philosophy

**Core principle**: "Geometric Space". Every asset is built from exactly 3 primitives — `<rect rx>`, `<circle>`, `<ellipse>`. No paths, no polygons, no lines. Like building spaceships with toy blocks. Appealing to 1st-2nd graders (6-8 years) with enough personality for any age.

**Signature element**: The "power core" — concentric circles with a white dot at the center — appears on every ship and the HUD cannon. It's the AstroType visual trademark.

**References**: Galaga, Asteroids, Among Us (simplicity), Monument Valley (geometric elegance).

---

## 🎨 Color Palette

### Ships & Projectiles
| Name | Hex | Usage |
|------|-----|-------|
| Player cyan | `#00E5FF` | Player ship, laser, HUD accents |
| Player dark | `#00B8D4` | Player wings, hull details |
| Player highlight | `#80F0FF` | Specular highlights |
| Enemy fighter | `#FF5252` | Fighter ship body |
| Fighter dark | `#D32F2F` | Fighter claws, eyes |
| Enemy scout | `#E040FB` | Scout ship body |
| Scout dark | `#AA00FF` | Scout wings, pupils |
| Laser core | `#FFFFFF` | Laser energy core |

### Collectibles & UI
| Name | Hex | Usage |
|------|-----|-------|
| Gold | `#FFD740` | Star collectible, level text |
| Gold light | `#FFE57F` | Star inner glow |
| HUD bg | `#1E1E3F` | Bar backgrounds, card fills |
| HUD text | `#FFFFFF` | UI text, enemy words |

### Environment
| Name | Hex | Usage |
|------|-----|-------|
| Deep space | `#0B0E2A` | Background, overlay |
| Planet body | `#7C4DFF` | Planet surface |
| Planet ring | `#B388FF` | Saturn-like ring |
| Planet shadow | `#5E35B1` | Dark crescent |
| Asteroid | `#757575` | Asteroid body |
| Asteroid light | `#9E9E9E` | Asteroid highlights |
| Asteroid dark | `#616161` | Asteroid craters |
| Debris | `#546E7A` | Space debris body |
| Debris light | `#78909C` | Debris highlights |
| Nebula | `#E040FB` | Nebula gas (low opacity) |
| Nebula accent | `#448AFF` | Cyan nebula accent |
| Nebula base | `#B388FF` | Lavender nebula base |
| Star white | `#FFFFFF` | Bright stars in tile |
| Star blue | `#90CAF9` | Blue stars in tile |
| Star dim | `#B0BEC5` | Dim background stars |
| Weapon barrel | `#78909C` | Cannon barrel |
| Weapon grip | `#607D8B` | Cannon grip |

### Heat / XP
| Name | Hex | Usage |
|------|-----|-------|
| Heat normal | `#FF9100` | Heat bar active |
| Heat overheat | `#FF3D00` | Heat bar full/overheat |
| XP bar fill | `#00E5FF` | Experience progress |

---

## 🚀 Ships

### Player Spaceship (`player-ship.svg`, 64×80)
Top-down view, facing up. Diamond-shaped hull with wings.

- **Hull**: Rounded rect 32×42, cyan `#00E5FF`, rx=6
- **Wings**: Two rounded rects at sides (12×22 each), darker cyan `#00B8D4`
- **Cockpit**: White circle r=6 with cyan pupil r=2, near top
- **Power core**: Dark cyan circle r=5 + white dot r=2, center-lower
- **Engine glow**: Cyan circle at rear, opacity 0.5
- **Hull panels**: Two thin horizontal rects across body, 0.4 opacity
- **Shadow**: Ellipse at base

### Enemy Fighter (`enemy-fighter.svg`, 48×48)
Top-down, facing down. Wider and squat — distinctly different silhouette from player.

- **Body**: Wide rect 40×32, crimson `#FF5252`, rx=5
- **Claws**: Two narrow rects at sides (8×16), dark red `#D32F2F`
- **Eyes**: White circles r=4.5 with red pupils offset down (menacing)
- **Power core**: Dark red circle r=4 + white dot r=1.5
- **Shadow**: Ellipse at base

### Enemy Scout (`enemy-scout.svg`, 56×48)
Top-down, facing down. Oval, organic — distinct from angular fighter.

- **Body**: Large ellipse rx=18 ry=15, magenta `#E040FB`
- **Wings**: Two translucent ellipses at sides (rx=8 ry=18), dark magenta 0.35 opacity
- **Eyes**: White circles r=5 with dark magenta pupils r=2
- **Wing dots**: Small circles on wing edges, 0.5 opacity
- **Shadow**: Ellipse at base

---

## ⚡ Weapons & Projectiles

### Laser Bolt (`laser.svg`, 12×24)
Capsule projectile, simple energy bolt.

- **Body**: Rounded rect 10×24, cyan `#00E5FF`, rx=5
- **Core**: White inner rect 5×16, opacity 0.8
- **Tip glow**: White circle at top r=2

### Ship Cannon HUD (`weapon-base.svg`, 80×40)
Displayed top-right in HUD. Static (no CSS animations — Phaser.CANVAS).

- **Grip**: Vertical rect at left, dark gray `#607D8B`
- **Barrel**: Long horizontal rect with rx=4, `#78909C`
- **Detail lines**: Two thin vertical rects on barrel
- **Muzzle**: Cyan glow circle r=8 opacity 0.2 + ring r=4.5 + white core r=2
- **Indicator**: Small cyan circle top of barrel

---

## ⭐ Collectibles

### Energy Star (`star.svg`, 32×32)
Golden 4-pointed cross star. Replaces the old gear collectible.

- **Spikes**: 4 rounded rects (4×8) in cardinal directions, gold `#FFD740`
- **Center**: Gold circle r=7
- **Glow**: Lighter gold circle r=4, `#FFE57F`
- **Highlight**: White circle offset top-left, opacity 0.5
- **No shadow** (floating collectible)

---

## 🌌 Environment

### Starfield Tile (`starfield.svg`, 128×128)
Seamless tiling background. Used as Phaser tileSprite.

- **Background**: Full rect, deep space `#0B0E2A`
- **Stars**: 20 circles r=1-3, scattered naturally across 128×128
  - 12 white stars (`#FFFFFF`, opacity 0.4-0.9)
  - 5 blue stars (`#90CAF9`, opacity 0.3-0.6)
  - 3 dim stars (`#B0BEC5`, opacity 0.2-0.4)
- **Nebula bands**: Two faint horizontal ellipses (purple + blue, opacity 0.04-0.06) for depth

### Nebula (`nebula.svg`, 120×60)
Soft diffuse gas clouds. Parallax background.

- **Base**: Large lavender ellipse, opacity 0.10
- **Core**: Pink-purple ellipse, opacity 0.12
- **Accent**: Cyan-blue ellipse, opacity 0.08
- **Highlight**: Bright center ellipse, opacity 0.15
- **Star flecks**: 3 tiny white circles within the cloud, opacity 0.15-0.25

### Ringed Planet (`planet.svg`, 80×110)
Saturn-like planet. Floating in space (no ground shadow).

- **Body**: Purple circle r=25, `#7C4DFF`
- **Crescent shadow**: Darker purple circle offset right, opacity 0.4
- **Ring**: Ellipse stroke (no fill), `#B388FF` width 4
- **Ring highlight**: Thin ellipse stroke, lighter purple, opacity 0.5
- **Core glow**: Small highlight circle, top-left
- **Moon**: Small gray circle with highlight, lower-left

### Asteroid (`asteroid.svg`, 72×56)
Individual floating asteroids. No longer a grounded cluster.

- **Rock 1** (large, left): Circle r=14, `#757575`, with 3 craters + highlight
- **Rock 2** (medium, lower-right): Circle r=11, `#9E9E9E`, with 2 craters + highlight
- **Rock 3** (small, top-right): Circle r=8, `#757575`, with 1 crater + highlight
- **No shadow** (floating in space)

### Meteorite (`meteorite.svg`, 64×48)
Angular space debris. Built from overlapping rounded rects.

- **Main chunk**: Rounded rect, `#546E7A`, rx=3
- **Left fragment**: Smaller darker rect, `#455A64`
- **Right fragment**: Lighter rect, `#546E7A`
- **Highlight**: Small light rect on top-right, `#78909C`, opacity 0.4
- **Shadow**: Ellipse at base (grounded look for meteorite)

---

## 🖥️ UI / HUD

### Typography
- **HUD titles/labels**: Orbitron (Google Font), geometric sci-fi
- **Enemy words**: Monospace (system), maximum readability for kids learning to type

### HUD Layout
- **Score**: `SCORE 150` in cyan `#00E5FF`, top-left, Orbitron 18px
- **Level**: `LV.3` in gold `#FFD740`, bottom-left, Orbitron 14px
- **XP Bar**: Thin line (4px) across screen top. Background `#1E1E3F`, fill cyan `#00E5FF`
- **Heat Bar**: 5 segments, bottom-right. Background `#1E1E3F` with cyan border strokes (0.3 opacity). Active: orange `#FF9100`, Overheat: red `#FF3D00`
- **Weapon HUD**: Cannon sprite top-right (see weapon-base.svg)

### Level Up Screen
- **Overlay**: Deep space `#0B0E2A` at 85% opacity
- **Title**: `LEVEL UP!` in cyan bold Orbitron 40px
- **Cards**: 3 choice rectangles `#1E1E3F` at 95% opacity, 2px cyan border (0.6 opacity). White Orbitron text
- **Selection**: Number keys [1] [2] [3]

### Game Over Screen
- **Panel**: `#0B0E2A` at 88% opacity, 2px cyan border
- **Brand**: `ASTROTYPE` in cyan Orbitron 18px
- **Title**: `GAME OVER` in red `#FF5252` bold Orbitron 34px
- **Score**: `SCORE  N` in gold `#FFD740` Orbitron 22px
- **Restart**: `[R]  RESTART` in white Orbitron 16px
- **Corners**: 4 cyan dot accents at panel corners

---

## 📐 ViewBox & Scale System

All viewBox sizes match the original assets for zero-config Phaser scaling.

| Asset | viewBox | Display size (game) |
|-------|---------|---------------------|
| Player ship | 64×80 | ~50×63 px |
| Enemy fighter | 48×48 | ~60×60 px |
| Enemy scout | 56×48 | ~60×52 px |
| Laser | 12×24 | ~4×12 px |
| Star collectible | 32×32 | 20×20 px |
| Starfield tile | 128×128 | 128×128 (tile) |
| Nebula | 120×60 | ~90×45 px |
| Planet | 80×110 | ~60×83 px |
| Asteroid | 72×56 | ~60×47 px |
| Meteorite | 64×48 | ~60×45 px |
| Ship cannon | 80×40 | 80×40 px |

---

## 🏗️ Construction Rules (mandatory)

1. **Only 3 primitives**: `<rect rx>`, `<circle>`, `<ellipse>`. Never `<path>`, `<polygon>`, `<line>`.
2. **All rects have rx ≥ 2**. No sharp corners.
3. **No strokes on filled shapes**. Depth from overlapping darker variants.
4. **Power core** on every ship: nested circles with white dot.
5. **Shadow ellipses** on grounded assets (ships, meteorite). NOT on floating assets (asteroid, planet, nebula, star, laser).
6. **Cockpit/eye pattern**: white circle + colored pupil.
7. **No CSS/SMIL animations**. Static SVGs only (Phaser.CANVAS mode).
8. **Light source**: Top-left. Highlights offset up-left 2-3px.
9. **Flat colors**. Maximum 1 gradient (none currently used).
10. **Includes `<title>` and `<desc>`** for accessibility.

---

## 🎨 Colorblind Safety

All critical distinctions use SHAPE first, color second:
- **Player** (cyan, rectangular, wings) vs **Fighter** (red, wide angular, claws) vs **Scout** (magenta, oval, translucent wings)
- **Laser** (narrow capsule) vs **Star** (cross shape) — shape difference
- **Heat bar** (bottom-right, orange) vs **XP bar** (top, cyan) — position difference
