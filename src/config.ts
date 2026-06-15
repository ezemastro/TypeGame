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
    options: ['EXPLOSIVE_IMPACT', 'PIERCING_SHOT', 'SLOW_AURA', 'QUICK_COOLING', 'SHARP_SIGHT', 'DUAL_SHOT'],
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
    },
    dualShot: {
      maxTargets: 2,
    },
  },
});
