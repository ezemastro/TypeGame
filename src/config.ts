export const GameConfig = Object.freeze({
  // Canvas
  canvas: {
    width: 800,
    height: 600,
    backgroundColor: '#0B0E2A',
  },

  // Player (Spaceship)
  player: {
    width: 50,
    height: 50,
    color: '#00E5FF',
    x: 400,       // starting X (center)
    y: 500,       // bottom area
    speed: 300,   // pixels per second
  },

  // Enemies
  enemies: {
    width: 60,
    height: 60,
    color: '#ff4444',
    baseSpeed: 80,       // pixels per second — base before difficulty scaling
    speedVariance: 0.2,  // ±20% random variance per enemy
    spawnInterval: 2000, // ms between spawns (base, before difficulty scaling)
    maxOnScreen: 8,
  },

  // Words
  words: {
    easy: ['A', 'E', 'I', 'O', 'U', 'LA', 'EL', 'UN', 'MI', 'TU', 'SOL', 'PAN', 'LUZ', 'MAR', 'PEZ'],
    medium: ['CASA', 'MESA', 'ROSA', 'LUNA', 'GATO', 'PERRO', 'ARBOL', 'FUEGO', 'NUBE', 'LLAVE'],
    hard: ['PLANTA', 'ESTRELLA', 'CAMINO', 'VENTANA', 'ESCUELA', 'CUADERNO', 'JIRAFA', 'MURCIELAGO'],
  },

  // Word display on enemies
  wordDisplay: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#ffffff',
  },

  // HUD typography
  hud: {
    fontFamily: '"Orbitron", monospace',
  },

  // Shooting / Combat
  shooting: {
    cooldown: 200,       // ms between shots
    projectileSpeed: 600,
    projectileColor: '#00E5FF',
    projectileWidth: 8,
    projectileHeight: 24,
  },

  // Heat Bar (Anti-spam)
  heatBar: {
    maxSegments: 5,
    overheatDuration: 2000, // ms
    cooldownPerSegment: 800, // ms to cool down one segment
    color: '#ff8800',
    overheatColor: '#ff0000',
  },

  // Scrolling
  world: {
    scrollSpeed: 80,         // px/s — base world scroll speed
  },

  // Difficulty scaling
  difficulty: {
    scaleInterval: 10000,    // ms between difficulty increases
    speedMultiplierPerTick: 0.05,  // +5% speed per tick
    spawnRateMultiplierPerTick: 0.03, // spawn 3% faster per tick
    wordComplexityRamp: [     // which word pools at which difficulty level
      { level: 0, pools: ['easy'] },
      { level: 5, pools: ['easy', 'medium'] },
      { level: 10, pools: ['medium', 'hard'] },
    ],
  },

  // Scoring
  scoring: {
    pointsPerLetter: 10,
    pointsPerWord: 50,       // bonus for finishing a whole word
    xpPerLetter: 1,
    xpPerWord: 5,
    xpToLevelUp: 100,        // base XP needed (scales per level)
    xpScaleFactor: 1.5,      // each level needs 1.5x more XP
  },

  // Power-ups
  powerUps: {
    choicesPerLevel: 3,
    options: ['EXPLOSIVE_IMPACT', 'PIERCING_SHOT', 'SLOW_AURA', 'QUICK_COOLING', 'SHARP_SIGHT', 'DUAL_SHOT', 'RICOCHET'],
    explosiveImpact: {
      pushRadius: 150,
      pushStrength: 100,
    },
    quickCooling: {
      cooldownMultiplier: 2,
    },
    sharpSight: {
      scoreMultiplier: 1.1,
    },
    slowingAura: {
      radius: 150,
      speedMultiplier: 0.5,
      color: '#4488ff',
      alpha: 0.15,
    },
    piercingShot: {
      enabled: true,
      basePierceDistance: 80,
      pierceStackMultiplier: 0.5,
    },
    ricochet: {
      bounceTravelMs: 500,
      bounceSearchRadius: 200,
    },
    dualShot: {
      maxTargets: 2,
    },
    shield: {
      cooldownMs: 30000,
      circleRadius: 36,
      radiusStep: 6,
      color: '#00BCD4',
      alpha: 0.3,
    },
    ally: {
      fireRateMs: 1500,
      horizontalOffset: 25,
      colorPalette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#A8E6CF'],
    },
    magneticField: {
      radius: 200,
      pullStrength: 0.3,
      ringColor: '#00BCD4',
      ringAlpha: 0.1,
    },
    burstFire: {
      spreadDegrees: 2.5,
    },
    lifeSteal: {
      heatReduction: 1,
    },
    freeze: {
      triggerRadius: 100,
      durationMs: 3000,
      cooldownMs: 18000,
      timeScale: 0.2,
    },
    piercingCannon: {
      baseWidth: 3,
      baseHeight: 14,
      widthPerStack: 1,
      heightPerStack: 6,
      color: '#00E5FF',
      alpha: 0.6,
      tipHeight: 6,
      tipWidth: 8,
    },
    dualCannon: {
      width: 3,
      height: 10,
      perStackSpacing: 10,
      color: '#00E5FF',
      alpha: 0.8,
    },
  },
});
