# SaniVet — Spec técnico (v1)

## Stack

Proyecto nuevo, todo son filas nuevas.

| Capa | Elección | Por qué |
|---|---|---|
| Build / dev server | Vite 8 | Arranque instantáneo, cero config, build estático |
| UI | React 19 | Componentes y estado, el modelo mental que se quiere practicar |
| Lenguaje | TypeScript 6 (`strict` + `noUncheckedIndexedAccess`) | El motor de cálculo se apoya en tipos: una `Dosis` mal formada se cae en compilación, no en producción |
| Estilos | Tailwind CSS 4 (`@tailwindcss/vite`) | Los tokens del design-system se declaran una sola vez en CSS con `@theme static`. Sin `tailwind.config.ts` |
| Ruteo | React Router 7 (modo declarativo) | 4 rutas, cliente puro |
| Fechas | `date-fns` 4 | Aritmética de calendario (`addDays`, `addMonths`, `addYears`, `differenceInMonths`) sin los bugs de hacerlo a mano. Locale `es` para formateo |
| IDs | `crypto.randomUUID()` | Nativo del navegador, sin dependencia |
| Persistencia | `localStorage` | Requisito de la v1: sin servidor |
| Tests | Vitest 5 (entorno `node`) | El dominio es TS puro y no toca el DOM |
| Deploy | Estático (Vercel o Netlify) | `vite build` → carpeta `dist/`, nada más |

Sin librería de estado global: un `PetsProvider` con `useReducer` + Context alcanza y sobra para un árbol de este tamaño.

## Modelo de datos

### La forma real: TypeScript sobre `localStorage`

Lo que se persiste es **solo lo que el usuario ingresó**. El cronograma **nunca se guarda**: se deriva en cada render a partir de la mascota y la definición del plan. Eso elimina de raíz el problema de datos derivados desactualizados.

```ts
type Especie = 'perro' | 'gato';
type PlanId = 'vacunacion' | 'desparasitacion';

/** Fecha como 'YYYY-MM-DD' en hora local. Nunca Date ni ISO con zona:
 *  un timestamp UTC corre las fechas un día según el huso. */
type FechaISO = string;

interface Aplicacion {
  orden: number;      // posición en el plan, base 0
  fechaReal: FechaISO;
}

interface Plan {
  fechaInicio: FechaISO | null;   // null = plan no iniciado
  aplicaciones: Aplicacion[];     // ordenado por `orden`, sin huecos
}

interface Mascota {
  id: string;                     // crypto.randomUUID()
  nombre: string;
  especie: Especie;
  fechaNacimiento: FechaISO;
  foto: string | null;            // data URL (JPEG base64), ya redimensionada
  planes: Record<PlanId, Plan>;
  creadaEn: string;               // ISO completo, para ordenar
  actualizadaEn: string;
}

interface SaniVetStore {
  version: 1;
  mascotas: Mascota[];
}
```

Clave de `localStorage`: `sanivet:store`. Un único blob JSON, escrito completo en cada mutación (son decenas de registros, no miles — no vale la pena particionar).

### Equivalente SQL

No se usa en la v1, pero el roadmap es backend + WhatsApp, así que el modelo se define desde ahora para que migrar sea un `INSERT`, no un rediseño. Postgres:

```sql
CREATE TYPE especie AS ENUM ('perro', 'gato');
CREATE TYPE plan_id AS ENUM ('vacunacion', 'desparasitacion');

CREATE TABLE mascotas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre           TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 2 AND 40),
    especie          especie NOT NULL,
    fecha_nacimiento DATE NOT NULL CHECK (fecha_nacimiento <= CURRENT_DATE),
    foto_url         TEXT,
    creada_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mascota_id    UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    plan          plan_id NOT NULL,
    fecha_inicio  DATE,
    UNIQUE (mascota_id, plan),
    CHECK (fecha_inicio IS NULL OR fecha_inicio >= (
        SELECT fecha_nacimiento FROM mascotas WHERE mascotas.id = mascota_id
    ))
);

CREATE TABLE aplicaciones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID NOT NULL REFERENCES planes(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL CHECK (orden >= 0),
    fecha_real  DATE NOT NULL CHECK (fecha_real <= CURRENT_DATE),
    UNIQUE (plan_id, orden)
);

CREATE INDEX idx_planes_mascota ON planes(mascota_id);
CREATE INDEX idx_aplicaciones_plan ON aplicaciones(plan_id, orden);
```

## El motor de cálculo

La pieza con toda la lógica del dominio. Vive en `src/domain/`, es **TypeScript puro sin React**, y se testea sola.

### Definición declarativa del protocolo

El protocolo no se escribe como `if`s esparcidos: es data. Cada plan es una lista de pasos más una regla de repetición.

```ts
type Vacuna =
  | 'quintuple' | 'sextuple' | 'antirrabica'
  | 'triple_felina' | 'refuerzo_anual';

type Intervalo =
  | { tipo: 'dias';  cantidad: number }
  | { tipo: 'meses'; cantidad: number }
  | { tipo: 'anios'; cantidad: number };

interface PasoPlan {
  etiqueta: string;         // 'Quíntuple (2ª dosis)'
  vacunas: Vacuna[];        // vacío para desparasitación
  desdeAnterior: Intervalo | null;  // null solo en el paso 0 (= fecha de inicio)
  duracionDias: number;     // 1 para una dosis, 3 para una tanda
}

interface DefinicionPlan {
  pasos: PasoPlan[];                   // el plan inicial, finito
  repeticion: {                        // qué pasa después del último paso
    paso: PasoPlan;
    cada: Intervalo;
  } | null;
  edadMinimaDias: number;
}
```

Las definiciones concretas quedan en `src/domain/protocolo.ts`:

- `vacunacionPerroCachorro` — 5 pasos a `{dias: 21}`; repetición `refuerzo_anual` cada `{anios: 1}`; edad mínima 45.
- `vacunacionPerroAdulto` — 3 pasos a `{dias: 21}`; misma repetición; edad mínima 45.
- `vacunacionGato` — 3 pasos a `{meses: 1}`; repetición `refuerzo_anual` cada `{anios: 1}`; edad mínima 60.
- `desparasitacion` — paso 1 (`duracionDias: 3`), paso 2 a `{dias: 15}` (`duracionDias: 3`); repetición cada `{meses: 6}` (`duracionDias: 3`); edad mínima 30.

Selector de rama:

```ts
function definicionPara(m: Mascota, plan: PlanId): DefinicionPlan
```

Para `vacunacion` + `perro` decide por `differenceInMonths(fechaInicio, fechaNacimiento) >= 6`. **La rama se evalúa con la fecha de inicio del plan, no con hoy**: un perro que empezó de cachorro sigue el esquema de 5 dosis aunque hoy sea adulto. Si el plan no está iniciado, se evalúa contra la fecha sugerida de inicio.

### Derivación del cronograma

```ts
interface EventoCronograma {
  orden: number;
  etiqueta: string;
  desde: FechaISO;                  // día 1
  hasta: FechaISO;                  // día 1 + duracionDias - 1
  estado: 'aplicada' | 'vencida' | 'proxima' | 'programada';
  fechaReal: FechaISO | null;
  esProyeccionRecalculada: boolean; // la anterior se aplicó en fecha distinta a la estimada
}

function derivarCronograma(
  m: Mascota,
  plan: PlanId,
  hoy: FechaISO,
): EventoCronograma[]
```

Algoritmo:

1. Si `fechaInicio` es `null`, devolver `[]`.
2. Expandir `DefinicionPlan` en una lista de pasos: los `pasos` iniciales, y después `repeticion.paso` tantas veces como haga falta para llegar a `addMonths(hoy, 24)` — con un tope duro de 200 pasos como red de seguridad contra un bucle infinito por datos corruptos.
3. Recorrer en orden manteniendo un *ancla*. Para el paso `i`:
   - Si existe `aplicaciones[orden === i]` → `desde = fechaReal`, estado `aplicada`, y el ancla pasa a ser `fechaReal`.
   - Si no → `desde = aplicarIntervalo(ancla, paso.desdeAnterior)`, el ancla pasa a ser ese `desde`, y el estado sale de comparar `desde` con `hoy`.
   - El paso 0 usa `fechaInicio` como `desde` cuando no está aplicado.
4. `hasta = addDays(desde, duracionDias - 1)`.
5. Cortar la lista en el primer evento cuyo `desde` supere `addMonths(hoy, 24)`, siempre devolviendo al menos el próximo pendiente (si la próxima dosis cae a 30 meses, se muestra igual).

`aplicarIntervalo` usa `addDays` / `addMonths` / `addYears` de `date-fns`. `addMonths` ya resuelve el caso del 31: 31 de enero + 1 mes = 28/29 de febrero.

### Estado y agenda

```ts
function estadoDe(desde: FechaISO, hoy: FechaISO): Estado
// vencida si desde < hoy; proxima si 0 <= diffDays <= 7; programada si no

function proximaPendiente(c: EventoCronograma[]): EventoCronograma | null
// el primero sin fechaReal

function agenda(mascotas: Mascota[], hoy: FechaISO): ItemAgenda[]
// aplana los 2 planes de todas las mascotas, filtra aplicadas,
// ordena por `desde` ascendente, corta en 10
```

### Mutaciones

```ts
function marcarAplicada(m: Mascota, plan: PlanId, orden: number, fechaReal: FechaISO): Mascota
function desmarcarUltima(m: Mascota, plan: PlanId): Mascota
function iniciarPlan(m: Mascota, plan: PlanId, fechaInicio: FechaISO): Mascota
```

`marcarAplicada` rechaza (lanza `ReglaDeNegocioError`) si `orden` no es el de la próxima pendiente, si `fechaReal` es futura, o si es anterior a la `fechaReal` de `orden - 1`. Todas devuelven una `Mascota` nueva — nunca mutan.

### Edición de fechas base

Cambiar `fechaNacimiento` o `fechaInicio` de un plan con aplicaciones ya registradas pide confirmación: *"Esto va a recalcular las dosis pendientes de {nombre}. Las que ya marcaste como aplicadas no se tocan."* Las `aplicaciones` se preservan por `orden`.

**Caso borde conocido**: si el cambio de `fechaNacimiento` cruza el umbral de 6 meses en un perro, la rama cambia de 5 pasos a 3 y una aplicación con `orden: 4` queda fuera del plan. Al confirmar, las aplicaciones con `orden >= pasos.length` se descartan y se avisa cuántas: *"Se quitaron 2 dosis que ya no corresponden al plan de un perro adulto."*

## Arquitectura

```
localStorage ('sanivet:store')
      │  leer al montar / escribir en cada mutación (debounce 300ms)
      ▼
PetsProvider  —  useReducer(estado: Mascota[])
      │  acciones: agregar, editar, eliminar, iniciarPlan,
      │            marcarAplicada, desmarcarUltima
      │  el reducer llama al dominio y devuelve el estado nuevo
      ▼
Hooks de lectura  —  useMascotas(), useMascota(id), useAgenda(), useCronograma(id, plan)
      │  derivan con useMemo; dependen de [mascotas, hoy]
      ▼
Componentes de pantalla  —  presentación, cero lógica de fechas
```

Tres reglas que sostienen el diseño:

1. **El dominio no conoce React.** `src/domain/` no importa nada de `react`. Se puede testear con Vitest sin DOM.
2. **El cronograma es derivado, no almacenado.** Única fuente de verdad: `Mascota`. Nada que invalidar.
3. **`hoy` se inyecta, nunca se lee adentro del dominio.** Un `HoyProvider` lo expone y lo refresca al volver la pestaña al foco (`visibilitychange`) y a la medianoche local. Esto hace el motor determinístico y testeable, y evita la app que muestra "vence hoy" tres días seguidos porque quedó abierta.

### Fotos

`localStorage` tiene ~5MB por origen y guarda strings: una foto de celular en base64 lo llena con tres mascotas. Antes de guardar, toda imagen pasa por `src/lib/imagen.ts`:

1. Cargar en un `Image` desde un `ObjectURL`.
2. Dibujar en un `<canvas>` escalada a **máximo 400px en el lado mayor**, recortada al cuadrado desde el centro (todos los avatares son cuadrados).
3. `canvas.toDataURL('image/jpeg', 0.7)` → ~25-45KB por foto.
4. Liberar el `ObjectURL`.

Toda escritura a `localStorage` va envuelta en `try/catch` para capturar `QuotaExceededError`: si falla, la mutación se revierte en memoria y el formulario muestra el error de cuota del spec funcional.

### Versionado del store

`version: 1` en el blob. El loader valida con un parser propio (`parseStore`) y, ante JSON inválido, versión desconocida o forma inesperada, **no borra nada**: deja el valor crudo copiado en `sanivet:store:backup`, arranca con store vacío y muestra un aviso. Perder los datos de la usuaria por un bug de parseo no es aceptable.

## Variables de entorno

Ninguna. La v1 no habla con ningún servicio externo, no tiene claves ni endpoints. Cuando llegue la integración con WhatsApp aparecerán acá.

## Estructura de carpetas

```
sanivet/
├─ index.html
├─ vite.config.ts                  # react + tailwind + alias @/ + config de vitest
├─ tsconfig.app.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                      # rutas
│  ├─ index.css                    # @import 'tailwindcss' + @theme static con los tokens
│  ├─ domain/                      # TS puro, sin React
│  │  ├─ tipos.ts
│  │  ├─ protocolo.ts              # las 4 DefinicionPlan
│  │  ├─ cronograma.ts             # derivarCronograma, estadoDe, agenda
│  │  ├─ mutaciones.ts             # marcarAplicada, desmarcarUltima, iniciarPlan
│  │  ├─ validacion.ts             # reglas del formulario
│  │  └─ __tests__/
│  │     ├─ cronograma.test.ts
│  │     └─ protocolo.test.ts
│  ├─ storage/
│  │  ├─ store.ts                  # leer / escribir localStorage
│  │  └─ parseStore.ts             # validación y migraciones
│  ├─ state/
│  │  ├─ PetsProvider.tsx
│  │  ├─ HoyProvider.tsx
│  │  └─ hooks.ts                  # useMascotas, useAgenda, useCronograma
│  ├─ lib/
│  │  ├─ fechas.ts                 # formateo en es-AR, "en 6 días", edad legible
│  │  ├─ imagen.ts                 # redimensionado a data URL
│  │  └─ colorDeNombre.ts          # avatar por defecto
│  ├─ components/
│  │  ├─ ui/                       # Boton, Campo, Tarjeta, Badge, Modal, Skeleton
│  │  ├─ AvatarMascota.tsx
│  │  ├─ BadgeEstado.tsx
│  │  ├─ FilaAgenda.tsx
│  │  ├─ TarjetaMascota.tsx
│  │  ├─ LineaDeTiempo.tsx
│  │  ├─ PlanNoIniciado.tsx
│  │  └─ DialogoMarcarAplicada.tsx
│  └─ pages/
│     ├─ Inicio.tsx                # /
│     ├─ NuevaMascota.tsx          # /mascotas/nueva
│     ├─ FichaMascota.tsx          # /mascotas/:id
│     └─ EditarMascota.tsx         # /mascotas/:id/editar
└─ public/
```

## Modelo de interacción de UI

No negociable, para toda feature de esta app:

- **UI optimista.** Toda mutación actualiza el estado en memoria de inmediato y recién después persiste en `localStorage` (con debounce). La UI nunca espera a la escritura. Si la escritura falla por cuota, se revierte y se avisa — nunca se bloquea la interacción esperando.
- **Navegación instantánea.** Los links y cambios de ruta disparan sin esperar datos. Toda la data está en memoria: ninguna ruta hace fetch.
- **Skeleton loaders.** No hay Next.js, así que el equivalente de `loading.tsx` es un componente `<Skeleton>` por pantalla con la misma forma que el contenido real. Se usan en la lectura inicial de `localStorage` al montar la app y en las fotos mientras decodifican. Nunca un spinner centrado de página.
- **Feedback en botones.** Cada botón refleja el estado de su acción: pendiente (spinner o cambio de label), éxito (check o cambio de color), error (estilo destructivo). "Marcar aplicada" pasa a check verde con la fecha por un instante antes de que la fila salga de la agenda. Ningún botón queda con cara de inactivo mientras su acción corre.
- **Cliente primero.** Las acciones se disparan en el cliente y el trabajo pesado (redimensionar la foto, serializar el store) se cierra en segundo plano con `startTransition`. El usuario nunca espera para interactuar con el elemento siguiente.

## Decisiones

**Tailwind 4, no 3.** El spec original decía Tailwind 3. Al instalarlo aparecieron 7 vulnerabilidades (2 moderadas, 5 altas) en sus dependencias de build — `braces`, `micromatch`, `fast-glob`, `postcss-selector-parser` — todas de herramientas que corren en la máquina de desarrollo, nunca en el navegador. El único arreglo disponible era subir a 4. Se subió, y además resultó mejor para este proyecto: los tokens se declaran una sola vez en CSS con `@theme` en lugar de duplicarse entre `src/index.css` y `tailwind.config.ts`. Se usa `@tailwindcss/vite` y ya no hay `postcss`, `autoprefixer` ni `tailwind.config.ts`.

**`@theme static`, no `@theme`.** Tailwind 4 descarta de `:root` los tokens que ninguna utilidad usa. Eso rompe dos cosas de este design-system: los `--color-avatar-*` se leen desde JS (`colorDeNombre`) y no desde una clase, así que desaparecerían del bundle; y los overrides de dark son CSS plano que nunca se descarta, por lo que un token no usado quedaría definido solo en dark. `static` emite todos los tokens siempre — cuesta ~1KB de CSS y elimina la clase entera de bug.

**Vite SPA, no Next.js.** La v1 no tiene servidor ni datos remotos: SSR, route handlers y Server Components no aportan nada y sí agregan conceptos. Cuando entre el backend para WhatsApp, migrar un SPA de React a Next es mecánico; el dominio (`src/domain/`) se reusa tal cual porque no depende del framework.

**`localStorage`, no IndexedDB.** Es el requisito de la v1 y su API sincrónica mantiene todo simple. El riesgo real es el límite de 5MB con fotos, y se mitiga con el redimensionado a 400px. Si la cuota empieza a molestar, la salida es mover **solo las fotos** a IndexedDB dejando el resto del store intacto — por eso `foto` es un campo aislado.

**El cronograma se deriva, no se guarda.** La alternativa (persistir la lista de dosis calculadas) obliga a invalidar y regenerar con cada edición y cada día que pasa, y es la fuente clásica de datos inconsistentes. Derivar en cada render cuesta microsegundos con decenas de mascotas.

**Protocolo como data, no como `if`s.** Las cuatro ramas son objetos `DefinicionPlan`. Agregar una especie o corregir un intervalo es editar un objeto, no tocar el algoritmo. También deja el camino abierto al protocolo editable por el usuario (fuera de la v1) sin reescribir nada.

**Recálculo desde la fecha real, no desde la teórica.** Decisión de la usuaria y regla del dominio. El costo es el marcado secuencial: solo se puede marcar la próxima pendiente, porque marcar la 4ª sin la 3ª dejaría el ancla indefinido. Se acepta — refleja el orden real de aplicación.

**Fechas como `'YYYY-MM-DD'`, no `Date` ni ISO con zona.** Un plan sanitario son días de calendario, no instantes. Guardar `2026-03-14T00:00:00Z` y leerlo en Argentina (UTC-3) da el 13 de marzo. Se trabaja con strings de fecha local y se convierte a `Date` solo dentro de `lib/fechas.ts`.

**`hoy` inyectado, no `new Date()` suelto.** Hace el motor determinístico y los tests triviales: se le pasa un `hoy` fijo y se verifican los estados sin mockear el reloj.

**Context + `useReducer`, no Zustand/Redux.** Un árbol con cuatro pantallas y una sola entidad no justifica una librería de estado. Si el árbol crece, Zustand entra sin romper nada.

**Tanda de desparasitación como un evento de 3 días.** Decisión de la usuaria: `duracionDias: 3` en un solo paso, con una sola `fechaReal` (el día 1). Lo descartado: tres pasos separados, que triplicaría las entradas del cronograma y los tildes por cada tanda.

**Sin tests de UI en la v1.** El esfuerzo de testing va entero al dominio: ahí está toda la lógica no obvia (ramas por edad, recálculo, bordes de calendario) y es donde un bug es invisible hasta que llega tarde una vacuna. Los componentes son presentación y se verifican a ojo.
