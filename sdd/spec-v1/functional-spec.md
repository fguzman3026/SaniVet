# SaniVet — Spec funcional (v1)

## El problema

En la veterinaria el sistema de gestión ya registra las fechas de vacunación, pero no está conectado a WhatsApp: cada recordatorio se manda a mano. Y del otro lado, los dueños no revisan por su cuenta el calendario sanitario de su mascota. SaniVet ataca la parte calculable del problema: a partir de la fecha de nacimiento y la fecha de inicio de cada plan, deriva el cronograma completo de vacunación y desparasitación, y muestra de un vistazo qué dosis está próxima o vencida.

## Alcance

**Entra en la v1**

- Aplicación web, mobile-first, usable desde celular o compu.
- Alta, edición y baja de mascotas (nombre, especie, fecha de nacimiento, foto opcional).
- Cálculo automático del cronograma de vacunación según especie y edad al inicio del plan.
- Cálculo automático del cronograma de desparasitación (igual para perro y gato).
- Marcar una dosis como aplicada con su fecha real, y recálculo del resto del cronograma desde esa fecha.
- Agenda unificada de próximas aplicaciones de todas las mascotas, con alerta visual por estado.
- Persistencia en `localStorage` del navegador. Sin cuentas, sin login, sin servidor.

**Queda explícitamente afuera**

- Notificaciones push y envío de avisos por WhatsApp (es el objetivo a futuro, no de esta versión).
- Backend, base de datos remota, cuentas de usuario y sincronización entre dispositivos.
- Historial clínico, peso, tratamientos, consultas, castración.
- Especies distintas de perro y gato.
- Protocolo editable por el usuario: el plan sanitario viene fijo en el código.
- Exportar/importar datos, imprimir el carnet.
- Multiusuario o vista para clientes de la veterinaria.

## El plan sanitario

Este es el corazón de la app. Las dos reglas transversales:

1. **Cada dosis siguiente se proyecta desde la fecha real en que se aplicó la anterior**, no desde una fecha teórica fija. Mientras la anterior no esté aplicada, se proyecta desde su fecha estimada.
2. **Las dosis se marcan en orden.** Solo se puede marcar como aplicada la próxima dosis pendiente del plan; eso evita que el cronograma quede anclado a fechas contradictorias.

### Vacunación — Perro

La rama se decide por la **edad que tiene el perro en la fecha de inicio de vacunación**.

**Cachorro (menos de 6 meses al inicio)** — 5 dosis, cada una a 21 días de la anterior:

| # | Dosis | Cuándo |
|---|---|---|
| 1 | Quíntuple | Fecha de inicio |
| 2 | Quíntuple | +21 días de la 1 |
| 3 | Séxtuple | +21 días de la 2 |
| 4 | Séxtuple | +21 días de la 3 |
| 5 | Antirrábica | +21 días de la 4 |

**Adulto (6 meses o más al inicio)** — 3 dosis, cada una a 21 días de la anterior:

| # | Dosis | Cuándo |
|---|---|---|
| 1 | Séxtuple | Fecha de inicio |
| 2 | Séxtuple | +21 días de la 1 |
| 3 | Antirrábica | +21 días de la 2 |

**Refuerzo anual** (ambas ramas): séxtuple + antirrábica, a 1 año de la última dosis del plan inicial, y después cada 1 año.

Edad mínima para iniciar: 45 días.

### Vacunación — Gato

Un solo esquema, sin bifurcación por edad — 3 dosis, una por mes:

| # | Dosis | Cuándo |
|---|---|---|
| 1 | Triple felina | Fecha de inicio |
| 2 | Triple felina | +1 mes de la 1 |
| 3 | Antirrábica | +1 mes de la 2 |

**Refuerzo anual**: triple felina + antirrábica, a 1 año de la antirrábica, y después cada 1 año.

Edad mínima para iniciar: 2 meses.

### Desparasitación (perro y gato, idéntico)

Cada aplicación es una **tanda de 3 días consecutivos**: se muestra con fecha de inicio y de fin, y se marca como aplicada una sola vez (la fecha real que se registra es la del día 1).

| # | Tanda | Cuándo |
|---|---|---|
| 1 | Tanda inicial (3 días) | Fecha de inicio |
| 2 | Refuerzo (3 días) | +15 días del inicio de la tanda 1 |
| 3+ | Mantenimiento (3 días) | Cada 6 meses desde el inicio de la tanda anterior |

Edad mínima para iniciar: 30 días.

### Horizonte de proyección

Los refuerzos anuales y las tandas semestrales son infinitos. La app genera el plan inicial completo más los refuerzos que caigan **hasta 24 meses adelante de hoy**, y lo vuelve a generar cada vez que se abre. Nunca se muestra una lista infinita.

### Plan no iniciado

La fecha de inicio de cada plan es **opcional e independiente**: se puede tener la vacunación arrancada y la desparasitación no, o ninguna de las dos.

Si un plan no tiene fecha de inicio, no se genera cronograma. En su lugar la ficha muestra una tarjeta *"Plan no iniciado"* con la **fecha sugerida de inicio**, que es la mayor entre hoy y la fecha en que la mascota alcanza la edad mínima del plan. Un botón arranca el plan con esa fecha, y también se puede cargar otra a mano.

## Estados de una dosis

El estado se calcula contra la fecha de hoy y define el color de la alerta visual:

| Estado | Condición | Lectura |
|---|---|---|
| **Aplicada** | Tiene fecha real registrada | Ya está, sale de la agenda |
| **Vencida** | Fecha estimada anterior a hoy, sin aplicar | Rojo — hay que ponerla ya |
| **Próxima** | Faltan 7 días o menos | Ámbar — coordinar el turno |
| **Programada** | Falta más de 7 días | Neutro |

Para las tandas de desparasitación la fecha que se evalúa es la del día 1 de la tanda.

## Pantallas

### 1. Inicio — agenda

La pantalla de entrada. Dos bloques, en este orden:

**Próximas aplicaciones.** Lista unificada de todas las mascotas, ordenada por fecha ascendente: primero las vencidas (de la más atrasada a la más reciente), después las próximas y programadas. Cada fila muestra foto y nombre de la mascota, qué dosis es, de qué plan, la fecha, cuántos días faltan o hace cuántos venció, y el color del estado. Se listan como máximo las próximas 10; el resto se ve en la ficha de cada mascota.

Cada fila tiene acción directa **"Marcar aplicada"** si es la próxima dosis pendiente de ese plan. Al marcarla se pide la fecha real (por defecto hoy) y la agenda se reordena en el acto.

**Mis mascotas.** Grilla de tarjetas: foto, nombre, especie, edad calculada, y la próxima aplicación de cada plan con su color. La tarjeta entera lleva a la ficha.

Arriba, un botón **"Agregar mascota"** siempre visible.

### 2. Nueva mascota / Editar mascota

Formulario único para alta y edición:

- **Nombre** — texto, requerido.
- **Especie** — perro o gato, requerido, se elige con dos botones grandes (no un select).
- **Fecha de nacimiento** — requerida. Debajo se muestra la edad calculada en vivo ("4 meses y 12 días").
- **Foto** — opcional. Se elige del dispositivo o se saca con la cámara en celular. Previsualización con opción de quitarla.
- **Inicio de vacunación** — opcional. Muestra la fecha sugerida según la edad mínima de la especie.
- **Inicio de desparasitación** — opcional, con su propia fecha sugerida.

Al guardar, se va a la ficha de la mascota.

En modo edición hay además un botón **"Eliminar mascota"**, en estilo destructivo y al final del formulario, con confirmación explícita que nombra a la mascota.

### 3. Ficha de la mascota

Encabezado con foto grande, nombre, especie, edad y fecha de nacimiento. Botón para editar.

Debajo, los dos planes como secciones separadas — **Vacunación** y **Desparasitación** — cada una con:

- La próxima dosis destacada arriba, con su estado y color, y el botón "Marcar aplicada".
- El cronograma completo como línea de tiempo vertical: dosis aplicadas arriba (con su fecha real y un check), pendientes abajo (con su fecha estimada). Las tandas de desparasitación muestran el rango "12 al 14 de marzo".
- Si el plan no está iniciado, la tarjeta de "Plan no iniciado" con la fecha sugerida y el botón para arrancarlo.

La última dosis aplicada se puede **desmarcar** (deshacer), y eso vuelve a proyectar el resto desde la anterior.

## Validaciones y mensajes

**Nombre** — requerido, entre 2 y 40 caracteres. Se recortan espacios al guardar. Si ya existe otra mascota con el mismo nombre se guarda igual, pero se avisa: *"Ya tenés una mascota con ese nombre"*.

**Fecha de nacimiento** — requerida. No puede ser futura. No puede ser de más de 30 años atrás.

**Fechas de inicio** — no pueden ser futuras más allá de hoy... salvo que la mascota todavía no alcance la edad mínima, caso en que sí se permite agendar el inicio a futuro. No pueden ser anteriores a la fecha de nacimiento (bloqueante).

**Edad mínima** — si la fecha de inicio cae antes de que la mascota cumpla la edad mínima del plan (45 días perro / 2 meses gato / 30 días desparasitación), **se avisa pero no se bloquea**: *"Según el plan, la vacunación arranca a los 45 días. Revisá la fecha si fue un error."* Los datos reales de una veterinaria no siempre siguen el protocolo, y la app no debería impedir registrarlos.

**Fecha real de aplicación** — no puede ser futura ni anterior a la fecha real de la dosis previa.

**Foto** — se aceptan JPG, PNG y WEBP. Si el archivo no es una imagen válida: *"Ese archivo no es una imagen"*. Si el navegador se queda sin espacio al guardar: *"No pudimos guardar la foto: el navegador se quedó sin espacio. Probá con una imagen más liviana o eliminá fotos de otras mascotas."* — y la mascota se guarda igual, sin foto.

## Estados vacíos

**Sin mascotas** (primer uso) — ilustración simple, título *"Todavía no cargaste ninguna mascota"*, una línea explicando que con la fecha de nacimiento y las de inicio la app arma el calendario completo, y el botón *"Agregar mascota"* como única acción.

**Sin próximas aplicaciones** — hay mascotas pero ningún plan iniciado: *"Ninguna mascota tiene planes iniciados todavía"* con enlace a la primera ficha.

**Todo al día** — hay planes iniciados y nada vencido ni próximo en los siguientes 7 días: *"Todo al día. La próxima es la de Pepa, el 14 de abril."*

**Mascota sin foto** — avatar por defecto con la inicial del nombre sobre un fondo de color derivado del nombre (el mismo nombre da siempre el mismo color).

## Notas de UX

- **Mobile-first.** Se diseña primero para 375px de ancho y se expande; en celular la agenda es una columna y la grilla de mascotas una o dos columnas.
- **Sin spinners de carga de datos.** Todo sale de `localStorage`, es sincrónico. Lo único que puede tardar es decodificar las fotos.
- **Las fechas se escriben en claro.** "14 de abril" o "en 6 días", no `14/04/2026`. La fecha completa queda en el `title`/tooltip.
- **El cálculo nunca se oculta.** Si una dosis se movió porque la anterior se aplicó tarde, la ficha lo dice: *"Recalculado: la dosis anterior se aplicó el 2 de marzo"*.
- **Avisar que los datos son locales.** Un texto discreto en el pie: *"Tus datos se guardan solo en este navegador"*. Es una limitación real de la v1 y el usuario tiene que saberla antes de cargar diez mascotas.
- **Un camino, no un menú.** Toda acción importante se alcanza desde Inicio en un toque.

## Supuestos a confirmar

Tres cosas se definieron por criterio al escribir este spec. Si alguna no coincide con el protocolo de la veterinaria, se corrige acá antes de codear:

1. **Gato adulto**: se asume que un gato que arranca con más de 6 meses sigue el mismo esquema de 3 dosis que el cachorro (no se mencionó una rama distinta, a diferencia del perro).
2. **Tanda 2 de desparasitación**: los 15 días se cuentan desde el **día 1** de la tanda anterior, no desde el día 3.
3. **Refuerzo anual**: séxtuple y antirrábica se muestran como un único evento combinado en la misma fecha, porque se aplican juntas. Si conviene tildarlas por separado, se parten en dos.
