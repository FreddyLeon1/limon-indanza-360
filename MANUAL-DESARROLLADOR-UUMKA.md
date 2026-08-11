# Manual de Desarrollador — Uumka

> Plataforma de turismo para lugares poco conocidos de Limón Indanza (y a futuro, Ecuador). Combina contenido inmersivo (360°, video, foto) con rutas hacia lugares donde Google Maps no llega, y canaliza todo hacia contacto por WhatsApp. Filosofía: "mostramos lo oculto, pero lo cuidamos".

Última actualización: agosto 2026. Este documento se arma con base en el estado real del código a esta fecha — si algo cambia, actualízalo.

---

## 1. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React + Vite | SPA, React Router para navegación |
| Mapas | MapLibre GL JS | Librería gratuita y open source, sin límite de uso |
| Tiles del mapa | OpenFreeMap | Gratis para siempre, sin API key, apto para uso comercial |
| Ruteo (cómo llegar) | OpenRouteService (principal) + GraphHopper (respaldo automático) | Ver sección 9 |
| Visor 360°/video | Photo Sphere Viewer (`@photo-sphere-viewer/core` + plugins: `virtual-tour-plugin`, `markers-plugin`, `video-plugin`, `equirectangular-video-adapter`) | Open source |
| Gráficos (Dashboard) | Recharts | Open source |
| Íconos | Lucide React | Trazo de línea, un solo color por servicio — nunca emojis de la base de datos |
| Backend / DB / Auth / Storage | Supabase (Postgres) | Plan gratuito — ver límites en sección 10 |
| Hosting | Netlify | Plan gratuito, sí permite uso comercial (a diferencia de Vercel Hobby) |
| Vista previa de WhatsApp | Netlify Edge Function (`netlify/edge-functions/lugar-og.js`) | Genera meta-tags Open Graph dinámicos por lugar |
| Mantenimiento automático | GitHub Actions (`.github/workflows/mantener-vivo.yml`) | Ping cada 3 días para evitar que Supabase pause el proyecto por inactividad |

**Versiones (`package.json`):** React 19.2.6 · React Router 7.16.0 · MapLibre GL 5.24.0 · Supabase JS 2.107.0 · Recharts 3.10.0 · Lucide React 1.28.0 · Photo Sphere Viewer 5.14.3 (todos sus plugins) · Vite 8.0.12 · `vite-plugin-pwa` 1.3.0 (PWA activo — explica el "Service Worker registrado" que aparece en consola).

**Nota:** `leaflet` y `react-leaflet` están en las dependencias pero no se usan en ningún archivo revisado — el mapa actual es 100% MapLibre GL. Posible remanente de una versión anterior del mapa (antes de migrar a MapLibre); se puede quitar del `package.json` si se confirma que no se usa en ningún lado, para aligerar el build.

---

## 2. Cómo correr el proyecto en local

```bash
cd C:\Users\HP\limon-indanza-360
npm install
npm run dev
```

Abre `http://localhost:5173`

**Supabase:**
- Panel: supabase.com → proyecto `limon-indanza-360`
- URL del proyecto: `https://ntiyaqjwhwqcjfcurxmf.supabase.co`
- Repositorio: `https://github.com/FreddyLeon1/limon-indanza-360`

**Panel Admin (local):** `http://localhost:5173/admin`
⚠️ La contraseña por defecto (`admin123`) es débil — se recomendó cambiarla por algo más seguro (ver sección 12, pendientes).

**Dashboard de métricas:** `http://localhost:5173/admin/metricas` (protegido, requiere sesión de admin vía `ProtegerAdmin.jsx`)

---

## 3. Mapa de rutas (routing)

| Ruta | Componente | Público / Protegida |
|---|---|---|
| `/` | `Home.jsx` | Pública |
| `/portal360` | `Recorridos.jsx` | Pública — listado de lugares con fotos/video/360° |
| `/lugar/:id` | `DetalleLugar.jsx` | Pública — ficha de un lugar con sus recursos |
| `/rutasmaps` | `MapPage3D.jsx` | Pública — mapa interactivo con ruteo |
| `/admin` | `Admin.jsx` | Login + CRUD de lugares y medios |
| `/admin/metricas` | `Dashboard.jsx` | Protegida por `ProtegerAdmin.jsx` |

Nota histórica: las rutas antes eran `/mapa` y `/recorridos` — se renombraron a `/rutasmaps` y `/portal360` para que la URL confirme al usuario dónde está. Cualquier link viejo con esas rutas ya no funciona (no se dejó redirect porque el cambio se hizo antes de publicar en producción).

**Pendiente:** ~~no tengo el código de `ProtegerAdmin.jsx`~~ — confirmado: verifica sesión activa de Supabase Auth (`supabase.auth.getSession()`) y que ese `user_id` exista en `usuarios_admin`. Si no hay sesión o no es admin, muestra una pantalla de "Acceso restringido" con botón a `/admin` para iniciar sesión — no redirige automáticamente, deja que el usuario decida.

---

## 4. Componentes reutilizables

| Componente | Uso |
|---|---|
| `BotonContacto.jsx` | Botón flotante de WhatsApp (verde, esquina inferior derecha). Presente en Home, Portal 360° (`DetalleLugar`) y Mapa (cuando no se está navegando ni con una ficha abierta). Dispara evento `clic_contacto`. |
| `Visor360Panel.jsx` | Recorrido virtual 360° con hotspots de navegación entre fotos (flechas con perspectiva de piso), usando GPS + corrección de norte por foto. |
| `VideoPanel360.jsx` | Reproductor de video 360°, un solo video por lugar. |

---

## 5. Sistema de diseño / marca

**Colores corporativos:**
| Nombre | Hex | Uso |
|---|---|---|
| Negro Sendero | `#121D24` | Fondos oscuros, texto principal |
| Dorado Luz | `#D89D34` | Acentos, botones de acción principal (admin, login) |
| Crema Arena | `#F4F1E8` | Fondos claros |
| Terracota (Rutas Maps) | `#C85A32` | Todo lo relacionado al mapa/rutas |
| Azul niebla (Portal 360°) | `#4A6B82` | Todo lo relacionado a fotos/video/360° |

**Tipografías:** `Outfit` (branding, títulos), `Inter` (UI general)

**Regla de oro establecida en el diseño:** los colores se asignan **por servicio, no por tipo de contenido** — no existe "un color para ciudad y otro para naturaleza"; la forma del ícono distingue eso (`Building2` vs `Leaf`), el color siempre es el de la sección donde estás parado.

**Regla de íconos:** nunca usar el campo `categorias.icono` (emoji guardado en la base de datos) para UI — siempre Lucide React, trazo de línea, color sólido.

---

## 6. Base de datos (Supabase / Postgres)

Esquema real, verificado por dos fuentes (SQL exportado + diagrama del panel de Supabase — coinciden). Notas de discrepancias con lo que usa el código, señaladas donde aplica.

**`categorias`**
`id (PK), nombre, icono, color, tipo CHECK ('naturaleza'|'ciudad')`
⚠️ Esta tabla tiene su propio campo `tipo` — hoy el código no lo usa para nada (usa `lugares.tipo`, no `categorias.tipo`). Posible remanente o campo pensado para otro uso; confirmar si se necesita.

**`lugares`**
`id (PK), nombre, descripcion, categoria_id (FK → categorias), tipo CHECK ('naturaleza'|'ciudad'), coordenadas_lat, coordenadas_lng, parking_lat, parking_lng, dificultad CHECK ('Fácil'|'Media'|'Difícil'), tiempo_visita, costo, horario, telefono, foto_principal, foto_360, video, activo, creado_en, likes_count`
⚠️ Las columnas `foto_principal`, `foto_360` y `video` existen en la tabla pero **no se usan en el código actual** — toda la app maneja fotos/videos/360° a través de la tabla `fotos` (con `es_portada` para la portada). Son columnas huérfanas de un diseño anterior; se pueden ignorar o limpiar, pero no borrar sin confirmar que de verdad no las lee nada.

**`fotos`**
`id (PK), lugar_id (FK → lugares), url, tipo CHECK ('imagen'|'imagen_360'|'video'|'video_360'), orden, creado_en, es_360, categoria_foto, es_portada, hotspots (jsonb), lat, lng, north_offset (numeric), grupo_recorrido, nombre_escena`

**`eventos`** (analítica)
`id (PK), tipo, lugar_id (FK → lugares), valor, fecha, detalle, session_id (uuid), utm_source, utm_campaign, referrer`
⚠️ La columna `valor` existe pero `registrarEvento()` en `supabase.js` nunca la llena — siempre queda null. No es un error, solo un campo disponible sin usar todavía.

**`likes`**
`id (PK), lugar_id (bigint, FK → lugares), session_id (text), creado_en` — sin constraint `UNIQUE` visible en este esquema entre `lugar_id` + `session_id`. Si no se agregó por fuera, revisar que exista — es lo que impide los likes duplicados del mismo dispositivo. Un trigger (`actualizar_likes_count`, con `security definer`) mantiene `lugares.likes_count` sincronizado en cada insert/delete.

**`usuarios_admin`**
`id (uuid, PK), user_id (FK → auth.users), nombre, rol (default 'admin'), creado_at`

**Tablas que existen en la base de datos pero no aparecen usadas en ningún archivo revisado hasta ahora** — posibles funciones planeadas a futuro o de una versión anterior del proyecto. Confirmar cuál es el caso antes de construir algo sobre ellas o de borrarlas:
- **`resenas`** — `lugar_id, nombre_visitante, calificacion (1-5), comentario, aprobado, creado_en`. Estructura lista para un sistema de reseñas de visitantes (con moderación vía `aprobado`), pero no hay ningún formulario ni vista que la use todavía.
- **`visitas`** — `lugar_id, fecha, hora, duracion_segundos, dispositivo, pais, ciudad`. Se parece a un sistema de analítica más simple/antiguo, probablemente el antecesor de la tabla `eventos` actual (que es más completa). Revisar si sigue en uso por algo, o es seguro dejarla de lado.
- **`rutas_marcadas`** — `origen_lat, origen_lng, destino_id, tipo_ruta ('auto'|'pie'), distancia_km, duracion_min, fecha`. Parece pensada para guardar un historial de rutas calculadas, pero `calcularRuta()` en `MapPage3D.jsx` no inserta nada aquí — solo guarda la última ruta en `localStorage`, no en la base de datos.

---

## 7. Sistema de eventos y analítica

Todo evento se registra vía `registrarEvento(tipo, lugarId, detalle)` en `supabase.js`. Tiene deduplicación automática (2 segundos) para evitar dobles-clics, y captura `utm_source`/`utm_campaign`/`referrer` solo la primera vez que entra cada sesión (guardado en `localStorage`).

**Tipos de evento actuales:**

| Evento | Dónde se dispara |
|---|---|
| `sesion_iniciada` | Al cargar la app (una vez por sesión de navegador) |
| `clic_ir_mapa` | Home → tarjeta "Rutas Maps" |
| `clic_ir_galeria` | Home → tarjeta "Portal 360°" |
| `ver_ficha_lugar` | Mapa → clic en un marcador (abre la ficha completa directo) |
| `vista_lugar` | Portal 360° → al entrar a `/lugar/:id` |
| `like_lugar` | Botón de corazón en `DetalleLugar.jsx` |
| `clic_como_llegar` | Botón "Cómo llegar" (mapa o ficha del lugar) |
| `iniciar_navegacion` | Botón "Navegar" en el mapa |
| `clic_contacto` | `BotonContacto` (el WhatsApp real de consultas) |
| `clic_whatsapp` | Botón "Compartir" de un lugar (comparte a un amigo, NO es contacto) |
| `compartir_ruta` | Botón "Compartir ruta" en el mapa (comparte la ruta trazada, no el lugar) |
| `agregar_itinerario` | Sistema de favoritos/itinerario — **desactivado hoy** (`MOSTRAR_ITINERARIO = false` en `MapPage3D.jsx`), pendiente para cuando implementen paquetes turísticos |

**Embudo de conversión** (`Dashboard.jsx`, `PASOS_EMBUDO`): fusiona los pasos que representan la misma intención sin importar la puerta de entrada (mapa vs. portal), para no romper el embudo con las dos rutas posibles de navegación:
1. Entró a la app
2. Exploró mapa o portal 360° (`clic_ir_mapa` + `clic_ir_galeria`)
3. Vio un lugar (`ver_ficha_lugar` + `vista_lugar`)
4. Le gustó el lugar
5. Pidió cómo llegar
6. Inició navegación
7. Contactó por WhatsApp

El Dashboard también tiene una tarjeta aparte de **"¿Por dónde entran primero?"** que compara mapa vs. portal 360° como primera puerta de cada sesión, y su tasa de conversión a contacto — para eso sí importa cuál fue la puerta, por eso vive separado del embudo.

---

## 8. Sistema de "me gusta" (likes)

- Sin login — el control anti-abuso usa el mismo `session_id` persistente que ya usa la analítica (generado una vez con `crypto.randomUUID()`, guardado en `localStorage`).
- El constraint `UNIQUE(lugar_id, session_id)` en la tabla `likes` es lo que impide que un mismo dispositivo dé like infinitas veces.
- El contador público (`lugares.likes_count`) se mantiene con un trigger de Postgres, no se recalcula contando filas cada vez.
- Es **por lugar**, no por foto/video/recorrido individual — decisión deliberada para no diluir la señal de qué lugar le interesa más a la gente.
- Funciones en `supabase.js`: `darLike()`, `quitarLike()`, `yaDioLike()`.

---

## 9. Ruteo (cómo llegar) — Edge Function `quick-function`

Ubicación: Supabase → Edge Functions → `quick-function` (aparece también como "calcular-ruta" en el panel).

Lógica: intenta **OpenRouteService** primero (`ORS_API_KEY`); si falla (caída del servicio o sin resultados), cae automáticamente a **GraphHopper** (`GRAPHHOPPER_API_KEY`) como respaldo, sin que el usuario note el cambio.

**Por qué este orden:** el plan gratuito de GraphHopper es solo para uso no comercial (Uumka sí lo es), mientras que ORS sí admite fases iniciales de aplicaciones comerciales dentro de su cuota gratuita (2,500 solicitudes/día). GraphHopper se dejó como respaldo porque ORS (servicio comunitario, sin SLA) sí tiene caídas ocasionales documentadas.

Variables de entorno (Supabase → Edge Functions → Secrets): `ORS_API_KEY`, `GRAPHHOPPER_API_KEY`.

**Corrección de norte en fotos 360°:** cada foto en `imagen_360` necesita `north_offset` (grados 0-359) — el ángulo real hacia donde apuntaba la cámara al tomar la foto, medido con brújula. Sin este dato, las flechas de conexión a otras fotos se posicionan mal. Pendiente construir un "modo calibración" en el panel admin para fijar este valor visualmente en vez de a ciegas.

---

## 10. Límites de los servicios gratuitos — auditoría

| Servicio | ¿Gratis para uso comercial? | Riesgo a vigilar |
|---|---|---|
| Supabase (free tier) | Sí | Proyecto se pausa tras 7 días sin actividad → mitigado con GitHub Action |
| Netlify (free tier) | Sí | Ninguno relevante a esta escala |
| OpenFreeMap | Sí, ilimitado | Ninguno |
| OpenRouteService (free) | Sí, para fases iniciales | 2,500 solicitudes/día — vigilar si el tráfico crece mucho |
| GraphHopper (free) | No — solo uso no comercial | Se usa solo como respaldo automático, exposición mínima |
| Vercel Hobby | ❌ No (se dejó de usar) | — |
| CARTO basemaps | ❌ No para comercial (se dejó de usar, reemplazado por OpenFreeMap) | — |

---

## 11. Vista previa de WhatsApp (Open Graph)

Como la app es una SPA, el robot de WhatsApp no ejecuta JavaScript — necesita HTML con meta-tags ya armado. Solución: `netlify/edge-functions/lugar-og.js` detecta el user-agent del robot (WhatsApp, Facebook, Twitter, etc.) y le sirve una página con `og:title`, `og:description` y `og:image` (la foto de portada real del lugar) antes de redirigir. Los usuarios reales nunca ven esta página — siguen directo a la SPA normal. Configurado en `netlify.toml`.

Para forzar que WhatsApp actualice una vista previa ya cacheada: usar el [depurador de Facebook](https://developers.facebook.com/tools/debug/) con la URL del lugar y darle "Scrape Again".

Requiere que exista `public/uumka-preview-default.jpg` como imagen de respaldo para lugares sin portada.

---

## 12. Pendientes conocidos (backlog)

- [ ] Cambiar la contraseña del panel admin (`admin123` es débil)
- [ ] Guardar credenciales en un gestor de contraseñas en vez de notas de texto plano
- [ ] Migrar la cuenta de Supabase a un correo de Uumka (hoy es personal)
- [ ] Traducción completa del sitio a inglés (patrón `textos = {es, en}` ya existe en `Home.jsx`, falta extenderlo a Portal 360° y Mapa)
- [ ] Traducción a shuar (relevante por identidad de marca — "Uumka" es palabra shuar)
- [ ] Modo calibración de `north_offset` en el panel admin (ver sección 9)
- [ ] Versión liviana del visor 360° para conexión lenta (relevante si algún día se usa en el sendero, no solo desde casa)
- [ ] Decisión de negocio: múltiples números de WhatsApp por colaborador/zona cuando crezcan más allá de un solo punto de contacto
- [ ] Reactivar sistema de itinerario/favoritos (`MOSTRAR_ITINERARIO`) cuando implementen paquetes turísticos — renombrar el evento `agregar_itinerario` para no chocar semánticamente con `like_lugar`
- [ ] Confirmar esquema SQL real de las tablas (sección 6 es una reconstrucción desde el código)

---

## 13. Decisiones de diseño ya tomadas (para no repetir la discusión)

- Sin login para el usuario final — todo el control (likes, favoritos) se basa en `session_id`/`localStorage`.
- Like es por lugar, no por recurso individual.
- Colores por servicio, nunca por tipo de contenido.
- Nunca usar `categorias.icono` (emoji de base de datos) en la interfaz.
- El mapa solo resuelve logística (cómo llegar, ver recursos, compartir la ruta trazada) — la reacción al contenido (like, compartir el lugar) vive en Portal 360°.
- "Limón Indanza" se usa solo como referencia geográfica real; "Uumka" es el nombre de marca — no son intercambiables.

---

## 14. Animaciones y utilidades CSS (archivos sueltos)

Todo el estilo principal de la app va inline (por componente); estos `.css` sueltos solo traen animaciones puntuales y una clase de accesibilidad — no hay sistema de estilos global aparte del inline.

| Archivo | Qué trae |
|---|---|
| `App.css` | Reset básico (`* { margin/padding: 0 }`) y que `html/body/#root` ocupen 100% de alto/ancho con la fuente base. |
| `index.css` | `@keyframes pulse` — anillo naranja pulsante genérico (reutilizable). |
| `Home.css` | `kenBurns` (zoom lento infinito del fondo del hero), `compassSway` (la brújula se balancea al hacer hover sobre la tarjeta de Rutas Maps), `ringSpin` (anillo punteado que gira al hacer hover sobre la tarjeta de Portal 360°), `.sr-only` (clase de accesibilidad para texto solo-lector-de-pantalla, visualmente oculto), `.uumka-overlay-hover` (oscurece la portada de una tarjeta al pasar el mouse). |
| `BotonContacto.css` | `whatsappPulse` — el "ping" verde alrededor del botón flotante de WhatsApp, se repite 3 veces al aparecer (no infinito). |

