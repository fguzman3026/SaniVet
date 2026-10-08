# SaniVet — Plan de desarrollo (v1)

## Objetivo

Al terminar este plan, SaniVet es una app web desplegada que corre en celular y compu: se carga una mascota con nombre, especie, fecha de nacimiento y foto, se indican las fechas de inicio de vacunación y desparasitación, y la app muestra el cronograma completo de ambos planes calculado según especie y edad, con alerta visual de lo vencido y lo próximo. Cada dosis se marca como aplicada con su fecha real y el resto del cronograma se recalcula desde ahí. Todo persiste en el navegador entre sesiones.

El orden no es arbitrario: **el motor de cálculo se construye y se testea antes de escribir una sola pantalla.** Es la parte con lógica real y la única donde un bug es silencioso — una dosis mal proyectada no se ve, se descubre tarde. Con el motor cerrado y verde, las pantallas son armado.

---

## Fase 1 — Scaffold y fundaciones ✅

Un proyecto que arranca, con los tokens del design-system ya cargados. Sin features.

- [x] Crear el proyecto: `npm create vite@latest sanivet -- --template react-ts`
- [x] Instalar dependencias: `react-router-dom`, `date-fns`, `tailwindcss@4`, `@tailwindcss/vite`, `vitest`
- [x] Volcar los tokens de `sdd/design-system.md` en `src/index.css` con `@theme static` (colores light + dark, radios, escala tipográfica, sombras, avatares)
- [x] Cargar las fuentes Nunito y Nunito Sans desde `index.html`
- [x] Activar `strict` y `noUncheckedIndexedAccess` en `tsconfig.app.json` y configurar el alias `@/` → `src/`
- [x] Configurar Vitest (entorno `node`) y verificar que un test trivial corre
- [x] Armar el esqueleto de rutas en `App.tsx` con las 4 páginas vacías + catch-all 404
- [x] Verificar que `npm run dev` y `npm run build` funcionan

**Desvíos respecto del spec original, ya reflejados en el spec técnico:**

- Tailwind 4 en lugar de 3 (las deps de build de la 3 traían 7 vulnerabilidades). Sin `tailwind.config.ts`, sin `postcss`, sin `autoprefixer`.
- `@theme static` en lugar de `@theme`, para que los tokens que se leen desde JS no se descarten del bundle.
- Sin `baseUrl` en el tsconfig: TypeScript 6 lo deprecó y `paths` ya resuelve relativo al archivo.
- El scaffold trajo React 19, React Router 7, date-fns 4, Vite 8, TS 6 y Vitest 5. Todas compatibles con el diseño; el scaffold incluye `oxlint` como linter, que se deja.

---

## Fase 2 — Motor de cálculo ✅

Depende de la Fase 1 solo por el proyecto base. **Es TypeScript puro: se escribe y se valida con tests, sin tocar la UI.** El bloque más importante del plan.

- [x] `domain/tipos.ts` — `Especie`, `PlanId`, `FechaISO`, `Aplicacion`, `Plan`, `Mascota`, `SaniVetStore`, `EventoCronograma`, `PasoPlan`, `DefinicionPlan`, `Intervalo`
- [x] `lib/fechas.ts` — conversión `FechaISO` ↔ `Date` en hora local, `aplicarIntervalo`, `diffEnDias`, `edadEnTexto`, formateo en `es-AR` ("14 de abril", "en 6 días", "hace 3 días")
- [x] `domain/protocolo.ts` — las 4 definiciones: `vacunacionPerroCachorro`, `vacunacionPerroAdulto`, `vacunacionGato`, `desparasitacion`
- [x] `domain/protocolo.ts` — `definicionPara(mascota, plan, hoy)` con la bifurcación del perro evaluada contra la **fecha de inicio**, no contra hoy
- [x] `domain/cronograma.ts` — `derivarCronograma`: expansión de pasos repetidos con horizonte de 24 meses y tope duro de 200, recorrido con ancla, cálculo de `desde`/`hasta`
- [x] `domain/cronograma.ts` — `estadoDe` (umbral de 7 días), `proximaPendiente`, `agenda` (aplanado + orden + corte en 10)
- [x] `domain/mutaciones.ts` — `iniciarPlan`, `marcarAplicada`, `desmarcarUltima`, todas inmutables, con `ReglaDeNegocioError` en las precondiciones
- [x] `domain/validacion.ts` — reglas del formulario, separando errores bloqueantes de avisos (edad mínima es aviso, no bloqueo) y `fechaSugeridaInicio(mascota, plan, hoy)`

**Tests — la fase no está cerrada hasta que estén verdes:**

- [x] Perro cachorro: 5 dosis en el orden y los intervalos correctos (quíntuple ×2, séxtuple ×2, antirrábica) + refuerzo anual
- [x] Perro adulto: 3 dosis (séxtuple ×2, antirrábica) + refuerzo anual
- [x] Perro en el umbral: edad al inicio de exactamente 6 meses → rama adulto; un día menos → rama cachorro
- [x] Gato: 3 dosis con intervalo mensual + refuerzo anual
- [x] Desparasitación: tanda 1 de 3 días, tanda 2 a +15 del día 1, mantenimiento cada 6 meses, todas con `duracionDias: 3`
- [x] Recálculo: una dosis aplicada 10 días tarde corre todas las siguientes 10 días
- [x] Recálculo con adelanto: una dosis aplicada antes de lo estimado también corre el resto
- [x] Bordes de calendario: inicio el 31 de enero con intervalo mensual cae en 28/29 de febrero; año bisiesto; cruce de año
- [x] Estados: `vencida` / `proxima` (0 y 7 días) / `programada` (8 días) / `aplicada`, con un `hoy` fijo
- [x] Plan sin `fechaInicio` devuelve `[]`
- [x] `marcarAplicada` rechaza orden salteado, fecha futura y fecha anterior a la dosis previa
- [x] `desmarcarUltima` sobre un plan sin aplicaciones es un no-op
- [x] Horizonte: el cronograma corta a 24 meses pero siempre incluye la próxima pendiente

**Desvíos respecto del spec original:**

- `definicionPara` y `fechaSugeridaInicio` llevan un tercer parámetro `hoy: FechaISO` que el spec técnico no listaba. Es necesario para la regla 3 de la arquitectura ("`hoy` se inyecta, nunca se lee adentro del dominio"): ambas funciones necesitan "hoy" para resolver la fecha sugerida de inicio cuando el plan todavía no arrancó. Sin este parámetro, el dominio tendría que leer `new Date()` internamente, rompiendo el determinismo que el resto del motor sí respeta.
- `marcarAplicada` no llama a `derivarCronograma`/`proximaPendiente` para validar el orden: como las `aplicaciones` se guardan sin huecos, "la próxima pendiente" es simplemente `orden === aplicaciones.length`. Evita un import circular con `cronograma.ts` y es más simple sin perder la regla de negocio.
- El caso límite "el cronograma siempre incluye la próxima pendiente aunque esté más allá del horizonte" quedó implementado como red de seguridad, pero no es alcanzable hoy por la API pública: con los 4 protocolos reales (intervalos de repetición ≤ 1 año) y la validación que impide marcar aplicaciones futuras, siempre hay una dosis pendiente bien dentro de los 24 meses. El test de horizonte verifica que la lista queda acotada (no llega al tope de 200), no el caso imposible.

---

## Fase 3 — Persistencia y estado ✅

Depende de la Fase 2 (los tipos y las mutaciones). Conecta el dominio con React.

- [x] `storage/parseStore.ts` — validación de forma, respaldo en `sanivet:store:backup` ante dato inválido, retorno de store vacío sin borrar nada
- [x] `storage/store.ts` — `leerStore` / `escribirStore` con `try/catch` para `QuotaExceededError`
- [x] `state/HoyProvider.tsx` — expone `hoy` y lo refresca en `visibilitychange` y a la medianoche local
- [x] `state/PetsProvider.tsx` — `useReducer` sobre `Mascota[]`, acciones `agregar`/`editar`/`eliminar`/`iniciarPlan`/`marcarAplicada`/`desmarcarUltima` delegando al dominio
- [x] Persistencia con debounce de 300ms + reversión en memoria si la escritura falla por cuota
- [x] `state/hooks.ts` — `useMascotas`, `useMascota(id)`, `useAgenda()`, `useCronograma(id, plan)` con `useMemo` sobre `[mascotas, hoy]`
- [x] Verificar a mano el ciclo completo: cargar mascota → recargar la página → sigue ahí

**Cómo se verificó el ciclo completo:** como todavía no existe el formulario de alta (Fase 5), se agregó temporalmente un bloque de debug a `Inicio.tsx` (botón que llama a `agregar()` con una mascota fija) para poder ejercitar `PetsProvider` end-to-end desde el navegador real. Con el servidor de dev corriendo se confirmó: el conteo en pantalla sube al tocar el botón (UI optimista), `localStorage['sanivet:store']` queda con la mascota después del debounce, y tras recargar la página el conteo sigue en 1 (la lectura inicial de `leerStore()` funciona). El bloque de debug y los datos de prueba en `localStorage` se revirtieron antes de cerrar la fase — `Inicio.tsx` quedó igual que al terminar la Fase 1.

**Desvíos respecto del spec original:**

- `PetsProvider` expone las acciones de mutación (`agregar`, `editar`, `eliminar`, `iniciarPlan`, `marcarAplicada`, `desmarcarUltima`) como funciones de un hook `usePets()`, no como un `dispatch` crudo. El `useReducer` interno solo conoce operaciones estructurales sobre el array (`agregar`/`actualizar`/`eliminar`/`reemplazarTodo`); las funciones de mutación de dominio (`marcarAplicada`, que puede lanzar `ReglaDeNegocioError`) corren **antes** del `dispatch`, no dentro del reducer. Mantener al reducer libre de código que puede lanzar excepciones evita que un error de regla de negocio deje el estado de React en un lugar raro.

---

## Fase 4 — Librería de UI ✅

Depende de la Fase 1 (tokens). Se puede hacer en paralelo a la Fase 2 o 3 — no toca el dominio.

- [x] `components/ui/` — `Boton` (variantes primario/secundario/fantasma/destructivo, con estados pendiente/éxito/error), `Campo` (label + input + error + hint), `SelectorEspecie` (dos botones grandes), `Tarjeta`, `Badge`, `Modal`, `Skeleton`
- [x] `lib/colorDeNombre.ts` — hash del nombre → color estable de la paleta
- [x] `components/AvatarMascota.tsx` — foto o inicial sobre color derivado, tamaños sm/md/lg
- [x] `components/BadgeEstado.tsx` — los 4 estados con su color y etiqueta, legible sin depender solo del color (ícono + texto)
- [x] `lib/imagen.ts` — redimensionado a 400px, recorte cuadrado centrado, `toDataURL('image/jpeg', 0.7)`, liberación del `ObjectURL`

**Cómo se verificó:** como ninguna pantalla real todavía consume estos componentes (eso empieza en la Fase 5), se montó una vidriera temporal en `Inicio.tsx` con una instancia de cada componente/variante/estado y se recorrió en el navegador con el servidor de dev — botones (variantes y estados), `Campo` (hint/aviso/error), `SelectorEspecie`, badges (genérico y de estado), avatares (con hash de color, 3 tamaños), tarjetas, skeletons, y el modal completo (abrir, `Escape` cierra y devuelve el foco al botón que lo abrió, sin errores de consola). Se probó también en modo oscuro forzando `data-theme="dark"`. La vidriera y los datos de prueba se revirtieron antes de cerrar la fase.

**Desvíos y pendientes:**

- No se agregó ninguna librería de íconos: los pictogramas (`components/ui/iconos.tsx`) son SVG propios, mínimos, trazo único — consistente con mantener las dependencias al mínimo (ver la decisión de Tailwind 4 en el spec técnico).
- El design-system nota que el botón **destructivo** tiene dos variantes: fondo suave (`destructive-soft`) en uso general, y fondo sólido con texto blanco **específicamente dentro del modal de confirmación** de "Eliminar mascota". `Boton` hoy solo implementa la versión suave (la de uso general). La versión sólida se resuelve recién en la Fase 5, cuando se construya el diálogo real de confirmación de borrado — ahí se decide si es una variante nueva o un override puntual, con el caso de uso concreto delante en lugar de adivinarlo ahora.

---

## Fase 5 — Alta y edición de mascotas ✅

Depende de las Fases 3 y 4. Primera pantalla con la que se puede meter data real.

- [x] `pages/NuevaMascota.tsx` — formulario completo con nombre, especie, fecha de nacimiento, foto y las dos fechas de inicio
- [x] Edad calculada en vivo bajo la fecha de nacimiento
- [x] Fechas de inicio sugeridas según especie y edad mínima, precargadas pero editables
- [x] Selector de foto con previsualización, opción de quitar, y captura de cámara en celular (`capture="environment"`)
- [x] Conectar `domain/validacion.ts`: errores bloqueantes vs avisos no bloqueantes (edad mínima, nombre duplicado)
- [x] `pages/EditarMascota.tsx` — reusa el mismo formulario precargado
- [x] Confirmación al cambiar `fechaNacimiento` o `fechaInicio` con aplicaciones registradas, incluyendo el aviso de dosis descartadas al cambiar de rama
- [x] Eliminar mascota con confirmación que nombra a la mascota
- [x] Manejo del error de cuota: guardar la mascota sin foto y avisar

**Cómo se verificó:** con el servidor de dev y el navegador real. Alta completa de una mascota (sugerencias de fecha de inicio correctas, edad en vivo, navegación a la ficha al guardar, datos verificados en `localStorage`). Validación bloqueante (especie, fecha de nacimiento) y aviso no bloqueante (nombre duplicado) mostrados juntos al intentar guardar un formulario incompleto. El flujo completo de edición con recálculo: se armó una mascota con 5 dosis de vacunación ya aplicadas (rama cachorro) directamente en `localStorage`, se le editó la fecha de nacimiento desde el formulario para que cruzara el umbral de los 6 meses, y se confirmó la cadena completa — modal de confirmación → modal "Se quitaron 2 dosis que ya no corresponden al nuevo plan de Rex" → guardado — con el resultado exacto esperado por el spec (quedan las aplicaciones de `orden` 0, 1 y 2; se descartan 2). Eliminar mascota probado de punta a punta (confirmación que nombra a la mascota, botón sólido destructivo, navegación a Inicio, dato realmente borrado de `localStorage`). Sin errores de consola en ningún paso.

**No verificado con un archivo real:** la selección de foto (`lib/imagen.ts` + el flujo de `FormularioMascota`) no se probó subiendo una imagen real al navegador automatizado — queda validado por lectura de código (Canvas/Image API estándar) pero no por una corrida end-to-end. Vale la pena probarlo a mano la primera vez que se use la app de verdad.

**Desvíos respecto del spec original:**

- `domain/validacion.ts` cambió de forma respecto a como se dejó al cierre de la Fase 2: `fechaSugeridaInicio` y `validarFechaInicio` ahora reciben `especie`/`fechaNacimiento` sueltos en vez de una `Mascota` completa — el formulario de alta los necesita antes de que exista una mascota real armada. Y `validarMascota` (que mezclaba nombre y fecha de nacimiento en un solo resultado) se partió en `validarNombre` y `validarFechaNacimiento`, porque el formulario necesita mostrar cada error bajo su propio campo, no una lista plana.
- Nueva función de dominio no prevista en el spec técnico original: `domain/mutaciones.ts` → `ajustarPlanTrasEdicion`, que implementa literalmente la regla de "Edición de fechas base" (descarta aplicaciones con `orden >= pasos.length` del nuevo esquema). Documentado ahí mismo: si en el futuro una mascota llega a tener aplicaciones de refuerzo anual más allá del esquema inicial (`orden` por encima de `pasos.length`) y se edita su fecha de nacimiento cruzando el umbral de rama, esta función las descarta también — el spec solo describe el recorte de la cola del esquema inicial, no una reconciliación más fina de refuerzos ya aplicados. Caso de borde teórico, no cubierto por los tests.
- Se resolvió el pendiente de la Fase 4: `Boton` tiene ahora un prop `solido` para la variante `destructivo`, usado únicamente en el botón "Eliminar" del modal de confirmación de borrado — coincide con la nota del design-system ("pasa a fondo destructivo sólido con texto blanco solo en el modal de confirmación").
- El "Entendido" tras el aviso de dosis descartadas o el aviso de cuota se resuelve dentro del mismo formulario (no en la ficha de la mascota, que todavía no existe — llega en la Fase 6). Cuando la Fase 6 construya `FichaMascota`, vale la pena revisar si ese aviso se muestra mejor ahí en vez de en un modal final del formulario.

---

## Fase 6 — Ficha de la mascota ✅

Depende de la Fase 5 (tiene que haber mascotas que mirar). Es donde se ve el motor funcionando.

- [x] `pages/FichaMascota.tsx` — encabezado con foto grande, nombre, especie, edad, fecha de nacimiento, botón editar
- [x] `components/LineaDeTiempo.tsx` — cronograma vertical: aplicadas con check y fecha real arriba, pendientes con fecha estimada abajo
- [x] Rango de fechas en las tandas de desparasitación ("12 al 14 de marzo")
- [x] Próxima dosis destacada por plan, con estado y botón "Marcar aplicada"
- [x] `components/DialogoMarcarAplicada.tsx` — fecha real con hoy por defecto, validada
- [x] Desmarcar la última dosis aplicada, con reproyección del resto
- [x] `components/PlanNoIniciado.tsx` — fecha sugerida y botón para arrancar el plan
- [x] Nota de recálculo cuando la dosis anterior se aplicó en fecha distinta a la estimada
- [x] Ruta con `:id` inexistente → pantalla de "esa mascota no existe" con vuelta a Inicio

**Cómo se verificó:** con el servidor de dev y el navegador real, usando una mascota armada a mano en `localStorage` con un perro cachorro con 2 dosis aplicadas (la segunda, 10 días tarde) y el resto pendiente. Se vieron correctamente: el riel vertical con nodos (aplicada = check verde, próxima pendiente = nodo relleno más grande, resto = nodo hueco del color del estado), la nota "Recalculado: la dosis anterior se aplicó el 1 de septiembre", la tarjeta destacada de la próxima dosis con badge de estado y botón "Marcar aplicada", el rango de fechas de desparasitación ("8 al 10 de octubre", "23 al 25 de octubre", etc.) al iniciar ese plan desde la tarjeta "Plan no iniciado". Se probó el ciclo completo marcar aplicada → reproyección del resto → desmarcar última dosis → vuelta al estado anterior, todo con actualización optimista inmediata en pantalla. También la ruta con `:id` inexistente. Sin errores de consola en ningún paso.

**Desvíos respecto del spec original:**

- `BloquePlan` (el bloque de una sección de plan — tarjeta destacada + línea de tiempo + acciones) quedó como un componente no exportado dentro de `pages/FichaMascota.tsx` en vez de un archivo aparte en `components/`: el spec técnico no lo lista como archivo propio y solo lo usa esta página, dos veces.
- El aviso "se descartaron N dosis" de la Fase 5 se resuelve en un modal dentro del formulario, no acá en la ficha — se evaluó mover ese flujo a esta pantalla ahora que existe, pero el modal del formulario ya cumple la regla del spec ("la ficha lo dice") sin forzar al usuario a navegar primero para enterarse; se deja así salvo que en el uso real se sienta mejor en la ficha.

---

## Fase 7 — Inicio y agenda ✅

Depende de la Fase 6. Cierra el circuito: la pantalla que responde "¿a quién le toca?".

- [x] `pages/Inicio.tsx` con los dos bloques: Próximas aplicaciones y Mis mascotas
- [x] `components/FilaAgenda.tsx` — avatar, nombre, dosis, plan, fecha, días relativos, badge de estado
- [x] Orden de la agenda: vencidas primero (más atrasada arriba), después próximas y programadas
- [x] "Marcar aplicada" directo desde la fila, con reordenamiento inmediato de la lista
- [x] `components/TarjetaMascota.tsx` — foto, nombre, especie, edad y la próxima de cada plan con su color
- [x] Los tres estados vacíos: sin mascotas, sin planes iniciados, todo al día
- [x] Botón "Agregar mascota" siempre visible
- [x] Pie con el aviso de datos locales

**Cómo se verificó:** con el servidor de dev y el navegador real, cubriendo los tres estados vacíos (sin mascotas, sin planes iniciados con el enlace a la primera ficha, y "Todo al día. La próxima es la de Nina, el 1 de noviembre." con la fecha real de la próxima dosis) y una agenda con dos mascotas y tres dosis vencidas en distintos planes — el orden salió exactamente "más atrasada arriba" como pide el spec. Se marcó una dosis aplicada directo desde la fila: la lista se reordenó al instante (optimista, sin recargar) y la fila siguiente del mismo plan dejó de mostrar el botón de acción porque todavía no es la próxima pendiente — confirma que "marcable" se calcula por fila, no por mascota. Probado en modo oscuro también. Sin errores de consola en ningún paso.

**Bug encontrado y corregido en esta fase:** en `TarjetaMascota.tsx`, la clase `capitalize` de Tailwind estaba aplicada sobre un párrafo que mezclaba `especie` y el texto de edad (`{especie} · {edadEnTexto(...)}`) — `capitalize` pone mayúscula a la primera letra de **cada palabra**, así que el texto salía como "Gato · 2 Años Y 9 Meses Y 7 Días". Se separó `especie` en su propio `<span className="capitalize">`, dejando el resto del texto intacto. Se encontró navegando la pantalla real — ni el type-check ni los tests lo hubieran detectado.

**Desvíos respecto del spec original:**

- Los tres estados vacíos y el cálculo de "es la fila marcable de la agenda" quedaron como funciones/componentes internos de `pages/Inicio.tsx` (no archivos aparte): el spec técnico no los lista como componentes propios.

---

## Fase 8 — Pulido y deploy 🟡

Depende de todo lo anterior.

- [x] Pasada responsive a 375px, 768px y escritorio — ver nota abajo, no se pudo verificar visualmente a 375/768px
- [x] Modo oscuro verificado en las 4 pantallas
- [x] Transiciones y feedback de botones según el modelo de interacción del spec técnico
- [x] Accesibilidad mínima: labels asociados, foco visible, navegación por teclado en los modales, estado nunca comunicado solo por color
- [x] Favicon, `<title>` y meta tags
- [ ] Probar en Chrome y Safari de celular (la cámara y el `<input type="date">` son los puntos frágiles) — pendiente, requiere un dispositivo real
- [x] Revisar que no quedó ningún `console.log`
- [ ] Deploy estático en Vercel o Netlify, y verificar carga, persistencia y recarga en el dominio público — pendiente, requiere decisión del usuario (ver nota abajo)

**Cómo se verificó lo que sí se pudo verificar:**

- **Modo oscuro**: las 4 pantallas (Inicio, Nueva/Editar mascota comparten el mismo formulario, Ficha de la mascota) se revisaron con `data-theme="dark"` forzado — paleta cálida consistente, buen contraste en badges, tarjetas y nodos de la línea de tiempo.
- **Feedback de botones**: se implementó el patrón que pedía el spec ("Marcar aplicada" pasa a check verde con la fecha por un instante antes de salir de la agenda") en los cuatro puntos donde aplica — confirmar en `DialogoMarcarAplicada`, "Guardar" en el formulario, "Iniciar plan" en `PlanNoIniciado`, y "Eliminar" en el modal de borrado (este último con estado `pendiente`, no `exito`, porque un check verde no encaja tonalmente con una acción destructiva). Cada uno queda deshabilitado y muestra su estado durante ~450ms antes de completar la acción real, con el `setTimeout` limpiado correctamente si el componente se desmonta antes (cierre del modal a mitad de camino).
- **Accesibilidad**: confirmado con el navegador real — foco inicial en el diálogo al abrir un modal, `Tab`/`Shift+Tab` cicla correctamente entre los elementos interactivos del modal y nunca se escapa (probado explícitamente en `DialogoMarcarAplicada`: Cerrar → fecha → Cancelar → Confirmar → vuelve a Cerrar), el foco vuelve al botón que abrió el modal al cerrarlo, y la asociación `label for` / `input id` se verificó por DOM (`document.getElementById(label.htmlFor)` resuelve al input correcto). El estado de una dosis nunca depende solo del color (ícono + texto en `BadgeEstado`, ya cubierto desde la Fase 4).
- **Favicon / `<title>` / meta tags**: `<title>`, meta description y theme-color ya estaban bien desde el scaffold de la Fase 1. El favicon, en cambio, seguía siendo el placeholder genérico de Vite (un rayo violeta) — se reemplazó por una huella de pata simple en los colores de marca (`primary` sobre `background`).
- **`console.log`**: barrido con grep sobre todo `src/` — cero coincidencias de `console.*`.
- **Build de producción**: `npm run build` (bundle de 323KB / 100KB gzip) y `npm run preview` contra el build real (no el servidor de dev) — alta completa de una mascota, recarga de página con los datos persistidos, agenda y "Mis mascotas" calculados correctamente, cero errores de consola.

**Lo que no se pudo verificar y por qué:**

- **Responsive real a 375px/768px**: la herramienta de redimensionar ventana del navegador automatizado no tuvo efecto en esta sesión (el viewport se mantuvo en 1536px pese a pedir 375×700 y 400×800 — probablemente la ventana está gestionada/maximizada por el entorno y no se puede redimensionar por este medio). Se hizo en cambio una auditoría de código: sin anchos fijos en píxeles (`grep w-\[` no encontró nada), `flex-wrap` en todas las filas que podrían desbordar (agenda, tarjeta destacada del plan, línea de tiempo), grilla `grid-cols-1 sm:grid-cols-2` en "Mis mascotas", `Modal` con hoja pegada abajo en mobile (`items-end sm:items-center`) y padding de contenedor responsive (`px-4 sm:px-6` en `Pantalla.tsx`, ya de la Fase 1). Razonablemente confiable, pero sigue siendo pendiente la verificación visual real — vale la pena hacerla a mano (DevTools → responsive mode) antes de dar la v1 por cerrada.
- **Chrome/Safari de celular real**: esta sesión no tiene acceso a un dispositivo móvil real ni a Safari (herramienta de navegador limitada a Chrome de escritorio). Los dos puntos frágiles que señala el spec (`<input type="date">` y la cámara vía `capture="environment"`) no se probaron en el hardware real.
- **Deploy**: no se inició. El directorio todavía no es un repositorio git, y desplegar a Vercel/Netlify implica crear o conectar una cuenta externa — una acción que corresponde decidir al usuario, no autónoma. Pendiente de alinear con la usuaria antes de tocar nada de esto.

---

## Dependencias en una línea

```
Fase 1 ─┬─ Fase 2 ── Fase 3 ─┬─ Fase 5 ── Fase 6 ── Fase 7 ── Fase 8
        └─ Fase 4 ───────────┘
```

Las Fases 2 y 4 son independientes entre sí: una es dominio puro, la otra es presentación pura. Las Fases 5, 6, 7 y 8 son estrictamente secuenciales.

---

## Diferido a post-v1

- Notificaciones push en el navegador (Web Push + Service Worker)
- Integración con WhatsApp para que el aviso llegue al dueño — requiere backend y la WhatsApp Business API
- Backend con cuentas, sincronización entre dispositivos y multiusuario (el modelo SQL ya está definido en el spec técnico)
- Protocolo sanitario editable desde la app
- Más especies, y planes sanitarios por raza o tamaño
- Exportar el carnet sanitario a PDF, e importar/exportar los datos
- Vista para clientes de la veterinaria
- Historial clínico: peso, consultas, tratamientos, castración
- Mover las fotos a IndexedDB si la cuota de `localStorage` se vuelve un problema
