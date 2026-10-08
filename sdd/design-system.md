# SaniVet — Design system

Documento vivo del proyecto. Generado en el primer scaffold y editable en cualquier momento.

## Vibe

Cálido y cercano, no clínico. Tonos tierra, esquinas bien redondeadas y la foto de la mascota siempre protagonista: SaniVet se siente más como el álbum de tu perro que como la ficha de un sistema de gestión. La información sanitaria es seria, pero la interfaz no tiene por qué serlo.

## Paleta

Los nombres son tokens, no colores: se declaran una sola vez en `src/index.css` dentro de `@theme static` (Tailwind 4 — no hay `tailwind.config.ts`). En el código se usa `bg-surface`, `text-muted`, `border-border` — nunca un hex suelto.

Una sola excepción de nomenclatura: el token `text-muted` se declara como `--color-muted`, para que la utilidad quede `text-muted` y no `text-text-muted`. El token `text` sí es `--color-text`, con utilidad `text-text`.

### Light (por defecto)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#FDF8F3` | Fondo de la app, crema cálido — nunca blanco puro |
| `surface` | `#FFFFFF` | Tarjetas, modales, inputs |
| `surface-muted` | `#F5EDE4` | Fondos secundarios, filas alternadas, estados vacíos |
| `border` | `#E8DBCC` | Bordes y divisores |
| `text` | `#2E2A26` | Texto principal, marrón muy oscuro — nunca negro puro |
| `text-muted` | `#7A6E63` | Texto secundario, labels, fechas relativas |
| `primary` | `#C96F4A` | Terracota. Acciones principales, enlaces, elemento activo |
| `primary-hover` | `#B45E3B` | Hover y active del primario |
| `primary-soft` | `#F6E4DA` | Fondo de badges y estados seleccionados en primario |
| `accent` | `#6B9080` | Verde salvia. Segundo acento: vacunación, íconos, detalles |
| `accent-soft` | `#E2EBE6` | Fondo suave del acento |

### Semánticos — los estados de una dosis

Este es el único lugar donde el color comunica información, así que los cuatro se eligieron para que se distingan también en escala de grises por luminosidad.

| Token | Hex (light) | Hex (dark) | Estado |
|---|---|---|---|
| `success` | `#5E8C61` | `#7FAE82` | Aplicada |
| `success-soft` | `#E4EDE4` | `#2C3A2E` | — |
| `warning` | `#C98A1F` | `#E8B85C` | Próxima (7 días o menos) |
| `warning-soft` | `#FBEFD6` | `#3D3220` | — |
| `destructive` | `#BC4E42` | `#E07A6E` | Vencida |
| `destructive-soft` | `#F8E2DF` | `#3E2724` | — |
| `neutral` | `#7A6E63` | `#A8998C` | Programada |
| `neutral-soft` | `#F0E8DF` | `#332C28` | — |

**Regla dura:** el estado nunca se comunica solo con color. Todo badge de estado lleva ícono y texto ("Vencida", "En 6 días"). Hay usuarios con daltonismo y el dato acá importa.

### Dark

No es una inversión: es la misma calidez en marrones profundos, no en grises azulados.

| Token | Hex |
|---|---|
| `background` | `#211D1A` |
| `surface` | `#2A2522` |
| `surface-muted` | `#332C28` |
| `border` | `#433A34` |
| `text` | `#F2EAE1` |
| `text-muted` | `#A8998C` |
| `primary` | `#E39170` |
| `primary-hover` | `#EDA183` |
| `primary-soft` | `#3D2A21` |
| `accent` | `#8FB3A3` |
| `accent-soft` | `#26332D` |

Se implementa con `@media (prefers-color-scheme: dark)` sobre `:root`, más un override por `[data-theme]` si se agrega un toggle manual. Nunca definir un color **únicamente** dentro del bloque dark.

### Colores de avatar

Para la mascota sin foto: la inicial sobre uno de seis fondos, elegido por hash estable del nombre (el mismo nombre da siempre el mismo color). Son pasteles tierra, todos con contraste suficiente para texto `#2E2A26` encima.

`#F0D9C4` · `#E3D5C8` · `#D9E2D5` · `#EDD9D9` · `#DCDFEA` · `#EFE6CE`

## Tipografía

| Rol | Familia | Pesos |
|---|---|---|
| Display / títulos | **Nunito** | 700, 800 |
| Cuerpo / UI | **Nunito Sans** | 400, 600, 700 |

La misma familia tipográfica en dos cortes: Nunito es redondeada y amable para los títulos, Nunito Sans es su hermana neutra y legible para texto corrido y datos. Ambas en Google Fonts.

Escala:

| Token | Tamaño / interlineado | Uso |
|---|---|---|
| `xs` | 12 / 16 | Metadata, fechas relativas |
| `sm` | 14 / 20 | Labels, texto secundario |
| `base` | 16 / 24 | Cuerpo. **Mínimo para inputs en móvil** — menos de 16px hace que iOS haga zoom al enfocar |
| `lg` | 18 / 26 | Nombre de la dosis, texto destacado |
| `xl` | 22 / 30 | Títulos de sección |
| `2xl` | 28 / 36 | Nombre de la mascota en la ficha |
| `3xl` | 36 / 44 | Título de pantalla |

Las fechas y los números van con `font-variant-numeric: tabular-nums` para que las columnas no bailen.

## Espaciado y forma

Base de 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Padding interno de tarjeta 16 en móvil, 24 en escritorio. Separación entre secciones 32.

| Token | Radio | Uso |
|---|---|---|
| `sm` | 8px | Badges, chips |
| `md` | 12px | Botones, inputs |
| `lg` | 16px | Tarjetas |
| `xl` | 24px | Modales, contenedores grandes |
| `full` | 9999px | Avatares, pills |

Densidad **cómoda**, no compacta: targets táctiles de 44px mínimo, aire generoso entre filas. Se usa desde el celular con una mano.

Sombras suaves y tintadas en marrón, nunca negras:

```css
--shadow-sm: 0 1px 2px rgba(80, 60, 45, 0.06);
--shadow-md: 0 4px 12px rgba(80, 60, 45, 0.08);
--shadow-lg: 0 12px 32px rgba(80, 60, 45, 0.12);
```

En dark las sombras casi no se ven: ahí la separación la da `surface` contra `background`, no la sombra.

## Componentes

**Botones** — radio `md`, altura 44px (48 en móvil para el principal), peso 600, sin `text-transform`. *Primario*: fondo `primary`, texto blanco. *Secundario*: fondo `surface`, borde `border`, texto `text`. *Fantasma*: sin fondo ni borde. *Destructivo*: fondo `destructive-soft`, texto `destructive`; pasa a fondo `destructive` sólido con texto blanco solo en el modal de confirmación. Siempre reflejan el estado de su acción (pendiente / éxito / error) — ver el modelo de interacción en el spec técnico.

**Inputs** — fondo `surface`, borde `border`, radio `md`, 16px de texto, padding 12/16. Foco: borde `primary` + anillo `primary-soft` de 3px. Error: borde `destructive` y mensaje abajo en `destructive` con ícono. El label va arriba, siempre visible — nunca solo placeholder.

**Selector de especie** — no es un `<select>`: son dos botones grandes lado a lado con ícono (perro / gato) y nombre. El seleccionado toma fondo `primary-soft` y borde `primary`.

**Tarjetas** — fondo `surface`, radio `lg`, `shadow-sm`, sin borde en light. Las clickeables elevan a `shadow-md` y suben 2px en hover.

**Avatares** — siempre circulares (`full`), siempre cuadrados de origen. Foto o inicial sobre color de hash.

**Badges de estado** — pill (`full`), fondo `*-soft`, texto y ícono `*`, tamaño `xs`, peso 700. Ícono + texto, nunca solo color.

**Línea de tiempo del cronograma** — columna vertical con un riel de 2px en `border` a la izquierda y un nodo circular por dosis. Aplicadas: nodo `success` con check, texto en `text-muted` y fecha real. Pendientes: nodo hueco con borde del color del estado. La próxima pendiente lleva el nodo relleno y un poco más grande.

**Modales** — centrados, radio `xl`, `shadow-lg`, con telón `rgba(46, 42, 38, 0.4)`. En móvil se pegan al fondo como hoja (sheet) con los radios superiores en `xl`. Cierran con Escape y con clic en el telón; el foco se atrapa adentro.

**Estados vacíos** — centrados, con ilustración simple o ícono grande en `primary-soft`, título en `lg` peso 700, una línea de apoyo en `text-muted`, y una sola acción primaria.

**Transiciones** — 150ms `ease-out` para hovers y cambios de color, 200ms para entradas. Nada más lento: la app es sincrónica y debe sentirse instantánea.

## Tono de voz

Español rioplatense, segunda persona, voseo. Cercano pero no bobo: la usuaria trabaja en una veterinaria, no hay que explicarle qué es una séxtuple.

- **Así**: "Le toca el 14 de abril" · "Cargá tu primera mascota" · "Venció hace 3 días" · "Listo, quedó registrada"
- **No así**: "Haga click aquí para registrar su mascota" · "¡Ups! Algo salió mal 🐾" · "Operación completada exitosamente"

Los errores dicen qué pasó y qué hacer, sin culpar al usuario: *"No pudimos guardar la foto: el navegador se quedó sin espacio. Probá con una imagen más liviana."* Los nombres de las vacunas se escriben como en la veterinaria: quíntuple, séxtuple, antirrábica, triple felina.

## Referencias

La dirección se eligió por descripción ("cálido y amigable, tonos tierra y pastel, fotos protagonistas"), sin referencias visuales concretas. Si aparecen después — capturas, pins de Pinterest, apps que te gusten — se agregan acá y esta paleta se ajusta con esa base.
