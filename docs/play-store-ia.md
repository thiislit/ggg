# Origen del arte y contenido hecho con IA (Google Play)

Guía para la publicación (Etapa 4). Basada en la ayuda oficial de Play Console:
[Declaring AI-generated content in Play Console](https://support.google.com/googleplay/android-developer/answer/17262077?hl=en)
(consultada el 28-11-2026).

## Qué pide Google

- La declaración es **por cada imagen o vídeo que se sube a Play Console**: gráficos y capturas de la ficha
  de la tienda, contenido promocional y vídeos de YouTube.
- Se hace con una **casilla** dentro del flujo de subida de cada recurso (texto aproximado:
  *"Regulations require that AI-generated content be labeled under certain circumstances"*).
- Los recursos marcados aparecen en Google Play **con una etiqueta de IA**.
- Incluye contenido **generado o editado** con IA.
- **No** hay un cuestionario aparte en *Contenido de la app*, y la página no habla del arte dentro del juego.
  La política de *contenido generado por IA* de Google va dirigida a apps que **generan** contenido con IA
  mientras se usan (chatbots, generadores de imágenes). RPS Retro no lo hace: su arte es fijo.

## Inventario del arte del juego

Origen comprobado comparando el contenido exacto de los archivos (hash) con las carpetas originales del
creador (`Desktop/assets-generales` y `Desktop/generadores-pixel-art`), más lo que indicó el creador.

| Recursos (`www/assets/...`) | Origen | ¿IA? |
|---|---|---|
| `avatars/*`, `player_avatars/*` (aliens, navegantes, Zorg) | Generados con IA (indicado por el creador; `navegante-1` además lleva la marca *"Edited with Google AI"*) | **Sí** |
| `backgrounds/bg_new_1…6.png` | [Space Background Generator](https://deep-fold.itch.io/space-background-generator) de Deep-Fold | No (generador procedural) |
| `backgrounds/campaign_blackhole.png` | Carpeta `generadores-pixel-art` (probablemente [Pixel Planet Generator](https://deep-fold.itch.io/pixel-planet-generator) de Deep-Fold) | No |
| `backgrounds/background2-morado`, `background3-azul`, `bg_purple`, `bg_blue`, `bg_campaign_easy`, `bg_campaign_medium`, `campaign_galaxy_purple`, `campaign_star` | Carpetas `assets-generales/backgrounds` y `modohistoria-back-groundas`; el creador indica que los fondos salieron de generadores gratuitos | No (por confirmar) |
| `planets/*` (Marte, Kepler, Nebula, planeta de Zorg, Tierra…) | Generados con IA (indicado por el creador) | **Sí** |
| `story/galaxy_bg.png` (galaxia animada) | `assets-generales/historia/galaxia` | Por confirmar |
| `story/robert_*.png`, `images/story/princess_*.png`, `images/story/daughter.png` | Generados con IA (indicado por el creador) | **Sí** |
| Icono de la app (`icons/*`, `assets/icon.png`) | Generado con IA (indicado por el creador) | **Sí** |
| `bg_campaign_hard`, `bg_green`, `v2_space`, `v3_space` | Sin copia en las carpetas originales; fondos de generadores según el creador | No (por confirmar) |

**Licencias de los generadores de Deep-Fold:** código MIT. Las imágenes generadas se pueden usar en juegos,
incluso comerciales. El crédito *se agradece pero no es obligatorio*. Lo único prohibido es redistribuir las
imágenes sueltas o en un pack de assets, cosa que el juego no hace. El juego le da crédito en los créditos finales.

**Sonidos:** `story/*.mp3` vienen de `assets-generales/sonidosdela historia`. En `sounds/`, tres archivos conservan
los datos de sus autores: Mechanical Wave (librería *Glass*, 2021) y Rogue Waves. No se pudo confirmar la web
de descarga.

## Qué marcar al subir la ficha

| Recurso de la ficha | ¿Marcar la casilla de IA? |
|---|---|
| Icono de la app | **Sí** (generado con IA) |
| Gráfico destacado (feature graphic) | **Sí**, si usa el icono, avatares, personajes o planetas |
| Capturas de pantalla | **Sí** en todas: casi cualquier pantalla muestra avatares, personajes, planetas o el logo |
| Vídeo promocional | **Sí** |

Ante la duda, **marcar**. La etiqueta no penaliza la app, y Google funciona con autodeclaración:
declarar de menos es el riesgo.
