# TypeBot — Visual Design Document

## 🎯 Filosofía visual

**Principio rector**: "Geometría amigable". Figuras simples (círculos, rectángulos redondeados, triángulos) componen personajes y objetos. Como un juguete de bloques. Atractivo para niños de 6-8 años pero con suficiente personalidad para cualquier edad.

**Referencias**: Duolingo characters, Monument Valley, Crossy Road.

---

## 🎨 Paleta de colores

### Primarios
| Nombre | Hex | Uso |
|--------|-----|-----|
| Verde robot | `#00E676` | Robot principal, balas, acentos |
| Rojo enemigo | `#FF5252` | Enemigos tipo robot |
| Naranja bug | `#FF7043` | Enemigos tipo bug |

### Secundarios
| Nombre | Hex | Uso |
|--------|-----|-----|
| Dorado | `#FFD740` | Tuercas, XP bar, estrellas |
| Azul aura | `#448AFF` | Aura ralentizadora, poder |
| Violeta | `#B388FF` | Piercing shot, magia |
| Blanco | `#FFFFFF` | Ojos, brillos, texto |
| Gris oscuro | `#263238` | Sombras, bordes |

### Entorno
| Nombre | Hex | Uso |
|--------|-----|-----|
| Verde pasto claro | `#7CB342` | Piso principal |
| Verde pasto oscuro | `#558B2F` | Detalles pasto |
| Marrón camino | `#A1887F` | Camino/senda |
| Celeste cielo | `#81D4FA` | Fondo cielo |
| Blanco nube | `#ECEFF1` | Nubes decorativas |

### UI / HUD
| Nombre | Hex | Uso |
|--------|-----|-----|
| Fondo HUD | `#1a1a2e` | Fondo de barras |
| Rojo calor | `#FF3D00` | Barra de calor llena |
| Naranja calor | `#FF9100` | Barra de calor parcial |
| Amarillo XP | `#FFD740` | Barra de experiencia |

---

## 👾 Personajes

### 🤖 Robot principal (TypeBot)
Visto desde arriba en ángulo 3/4 (~45°). Mirando hacia arriba.

**Composición geométrica**:
- **Cuerpo**: Rectángulo redondeado vertical (32×40, rx=8), verde `#00E676`
- **Cabeza**: Círculo (r=16) sobre el cuerpo, mismo verde, ligeramente más claro
- **Antena**: Línea vertical delgada (h=10) + círculo pequeño (r=3) en la punta
- **Ojos**: Dos círculos blancos (r=4) con pupilas negras (r=2)
- **Brazos**: Dos rectángulos redondeados finos (8×16) a los costados
- **Piernas**: Dos rectángulos redondeados (10×14) abajo
- **Detalle pecho**: Círculo pequeño blanco en el centro (luz/indicador)

**Animación de caminata** (CSS/SMIL):
- Piernas: rotación alternada ±15° con `animation: walk 0.4s ease-in-out infinite alternate`
- Brazos: balanceo opuesto a piernas
- Cuerpo: leve rebote vertical (translateY ±2px)
- Antena: oscilación sutil
- Ojos: parpadeo cada 3 segundos

**Tamaño**: 64×80 viewBox

### 🔴 Enemigo Robot
Visto desde arriba en ángulo 3/4. Mirando hacia abajo (hacia el jugador).

**Composición**:
- **Cuerpo**: Cuadrado redondeado (36×36, rx=6), rojo `#FF5252`
- **Pinzas**: Dos triángulos a los costados apuntando hacia abajo
- **Ojos**: Dos círculos rojos brillantes (r=3) con brillo blanco
- **Boca**: Línea horizontal dentada (serrucho)
- **Patas**: Dos pequeños rectángulos abajo

**Animación**:
- Pinzas: apertura/cierre alternado
- Cuerpo: leve rotación ±3°
- Ojos: brillo pulsante

**Tamaño**: 48×48 viewBox

### 🟠 Enemigo Bug
Visto desde arriba.

**Composición**:
- **Cuerpo**: Óvalo (40×28), naranja `#FF7043`
- **Ojos**: Dos círculos grandes blancos (r=6) con pupilas, sobre la cabeza
- **Antenas**: Dos líneas curvas hacia arriba con bolitas
- **Patas**: 6 líneas finas (3 por lado)
- **Alas**: Dos semicírculos translúcidos sobre el cuerpo

**Animación**:
- Patas: movimiento ondulatorio
- Alas: leve aleteo
- Antenas: oscilación

**Tamaño**: 56×48 viewBox

---

## 🔫 Armas (HUD top-right)

El arma se muestra fija arriba a la derecha como indicador de power-ups activos.

### Arma base (sin mejoras)
- Cañón simple: rectángulo horizontal (40×12, rx=4), gris metálico `#78909C`
- Boquilla: círculo verde `#00E676` en la punta

### Mejoras visuales (se apilan)
| Power-up | Cambio visual |
|----------|---------------|
| Explosive Impact | Anillos naranjas `#FF7043` alrededor del cañón |
| Piercing Shot | Punta azul `#448AFF` + estela |
| Dual Shot | Segundo cañón paralelo debajo |
| Slowing Aura | Anillo azul `#448AFF` pulsante alrededor |
| Quick Cooling | Aletas de refrigeración grises |
| Sharp Sight | Lente/mira circular `#B388FF` en la punta |

**Animación**: El arma idle tiene un leve brillo pulsante. Al disparar, retroceso breve.

---

## ⚙️ Coleccionables

### Tuerca / Engranaje
- Círculo dorado `#FFD740` (r=12) con hueco central (r=4)
- 6 dientes (pequeños rectángulos radiales)
- Brillo interno (círculo más claro)

**Animación**: Rotación continua + leve rebote al aparecer. Al colectarse: escala a 0 + fade out.

---

## 🎯 Proyectiles

### Bala normal
- Cápsula vertical: rectángulo redondeado (6×18, rx=3)
- Color: verde `#00E676` con núcleo blanco
- Pequeño rastro/estela de 3 círculos decrecientes

### Bala perforante (con power-up)
- Igual pero con punta azul `#448AFF`
- Estela más larga (5 círculos)

**Animación**: La bala viaja sin animación propia (se mueve por código). La estela se actualiza por frame.

---

## 🌳 Entorno

### Piso (tile de pasto + camino)
- Rectángulo 128×128, seamless tile horizontal y vertical
- Fondo: verde pasto `#7CB342`
- Camino: franja diagonal marrón `#A1887F` (ancho ~40px) que cruza de izquierda a derecha
- Detalles: pequeños puntos/rectángulos verde oscuro `#558B2F` simulando textura de pasto

### Árbol (parallax)
- Tronco: rectángulo marrón `#795548` (12×40)
- Copa: círculo grande `#66BB6A` (r=30) + círculo más pequeño superpuesto
- Sombra en el piso: elipse oscura semitransparente

### Nubes (fondo cielo)
- 3-4 círculos blancos `#ECEFF1` solapados formando forma de nube
- Opacidad: 0.6
- Movimiento parallax lento horizontal

---

## 🖥️ Interfaz (UI)

### HUD inferior
- Fondo: barra oscura semitransparente `#1a1a2e` con 80% opacidad
- Score: número grande blanco, fuente monospace
- XP bar: barra horizontal amarilla `#FFD740`, fondo `#37474F`
- Heat bar: 5 segmentos, `#FF9100` a `#FF3D00`
- Level: "Lv. N" pequeño abajo a la izquierda

### Pantalla de Level Up
- Overlay oscuro semitransparente (mismo tono que fondo HUD, 85% opacity)
- Título "LEVEL UP!" grande, dorado, con animación de escala pulsante
- 3 tarjetas de elección: rectángulos `#37474F` con borde `#00E676`
- Número [1] [2] [3] a la izquierda, nombre y descripción del power-up

### Pantalla de Game Over
- Overlay similar
- "GAME OVER" en rojo `#FF5252`
- Score final grande
- "Press R to restart" abajo

---

## 📐 Sistema de tamaños

Todos los SVGs usan viewBox cuadrados para facilitar posicionamiento en Phaser:

| Asset | viewBox | Tamaño real en juego |
|-------|---------|---------------------|
| Robot | 64×80 | ~50×63 px |
| Enemigo robot | 48×48 | ~60×60 px |
| Enemigo bug | 56×48 | ~60×52 px |
| Arma | 80×40 | ~80×40 px |
| Tuerca | 32×32 | ~24×24 px |
| Bala | 12×24 | ~4×12 px |
| Tile piso | 128×128 | 128×128 px (tile) |
| Árbol | 80×100 | ~60×75 px |
| Nube | 120×60 | ~90×45 px |

---

## 🎬 Animaciones requeridas por asset

| Asset | Animación | Tipo |
|-------|-----------|------|
| Robot | Caminata (piernas, brazos, rebote) | CSS animation loop |
| Robot | Parpadeo | CSS animation |
| Robot | Disparo (flash boca cañón) | CSS animation trigger |
| Enemigo robot | Movimiento pinzas | CSS animation loop |
| Enemigo bug | Patas + alas | CSS animation loop |
| Tuerca | Rotación continua | CSS animation loop |
| Tuerca | Colectada (escala a 0) | CSS animation trigger |
| Arma | Brillo idle | CSS animation loop |
| Arma | Retroceso disparo | CSS animation trigger |
| Level Up title | Escala pulsante | CSS animation loop |
| Nube | Desplazamiento | Via Phaser tween |

---

## 🔗 Integración con Phaser

Los SVGs se cargan como texturas:
1. Phaser carga el SVG inline o como archivo
2. Se crea `this.add.image(x, y, 'robot')` 
3. Las animaciones CSS dentro del SVG se ejecutan automáticamente

Las animaciones de movimiento (posición de balas, enemigos) se manejan con Phaser tweens.
Las animaciones de personaje (caminata, parpadeo) son CSS dentro del SVG.
