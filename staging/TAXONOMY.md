# Política de admisión y ubicación de géneros

Este documento gobierna cómo entra un género nuevo en `public/data/pulseroots.genres.json`.
El árbol publicado no se toca hasta que una ficha supera las dos puertas.

## Principio

Colocar mal un género es más caro que no añadirlo. La URL de cada página se construye
desde su ruta (`/genres/<familia>/<estilo>/<subestilo>/`), así que mover un nodo después
rompe enlaces, redirecciones y señales SEO. La decisión se toma una vez.

El estado por defecto de un candidato es **no publicado**. No hay prisa: el staging existe
precisamente para pensar antes de tocar el árbol.

## Puerta 1: admisión

Seis comprobaciones. Las dos primeras son obligatorias.

| Criterio | Pregunta | Obligatorio |
|---|---|---|
| Nombre | ¿La escena lo usa y está documentado? | Sí |
| Linaje | ¿Tiene un padre evidente en el árbol actual? | Sí |
| Historia | ¿Origen, fecha y precursores identificables? | No |
| Sonido | ¿Se distingue por algo más que el tempo o el marketing? | No |
| Escena | ¿Al menos 3 artistas propios y un sello, compilado o evento? | No |
| Cobertura | ¿Ya lo cuenta un nodo existente? | No |

Si ya está cubierto por un nodo existente, **no se crea nodo**: se añade como alias o
mención en la descripción del género que lo contiene.

## Niveles

No todo género nuevo es una familia. El veredicto debe ser uno de estos:

| Veredicto | Qué implica |
|---|---|
| `alias` | No se crea nodo. Se menciona en el género existente. |
| `substyle` | Opción por defecto. Cuelga de un estilo ya existente. |
| `style` | Nodo propio bajo una familia. Exige escena y nombre consolidados. |
| `family` | Raíz nueva. Solo si es un linaje con varios hijos y no tiene hogar. |
| `defer` | Aplazado. Se conserva la ficha con la razón. |

`family` es el cambio más caro: afecta al recuento de familias, a la home y al copy de
`public/data/i18n/*.json`. Exige justificación explícita.

## Puerta 2: ubicación

- El padre debe ser el **más cercano correcto**, no el más prestigioso.
- Si hay dos padres plausibles, se anotan como alternativas y se escribe por qué se elige uno.
- No se duplica una rama si el sonido ya vive en otra. Las duplicaciones históricas
  existentes (`Acid House` en Techno y en House) no se replican sin motivo.
- Una escena no es un género. Etiquetas de marketing o microtendencias van a `defer`.
- Un nodo nuevo entra al final de los hijos de su padre. El orden del árbol es curado,
  no alfabético.

## Evidencia mínima

Para pasar a `ready`:

- Nombre y padre definidos.
- Justificación escrita (2-3 líneas).
- Al menos una fuente; se recomiendan dos.
- Una pista representativa y tres artistas con ID de Spotify.
- Un ejemplo en formato `Artista - Tema`.

Las descripciones EN/ES pueden quedar vacías en el panel: se escriben antes de publicar.

## Publicación

`Publicar` solo procesa fichas en estado `ready` con veredicto `substyle`, `style` o
`family`. Antes de escribir:

1. Resuelve la ruta del padre en el árbol EN y comprueba que el ES tiene la misma ruta.
2. Rechaza duplicados entre hermanos (nombre normalizado y slug).
3. Inserta el nodo en EN y ES.
4. Marca la ficha como `published` con fecha y URL.

Cada publicación deja rastro en `staging/published.log`.

## Deuda heredada

Las decisiones estructurales actuales (`Hardstyle` bajo Techno, `Grime` bajo Garage House,
`Acid House` repetido) **no se reabren en este flujo**. Añadir géneros no debe convertirse
en una refactorización del árbol. Si se corrige algo, será en una revisión aparte, con sus
redirecciones y su propia justificación.
