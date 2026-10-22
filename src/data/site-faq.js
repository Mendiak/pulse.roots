/**
 * Shared copy for the editorial block on the home page and the FAQPage
 * structured data, so visible text and JSON-LD cannot drift apart.
 */

export const siteFaq = {
  en: [
    {
      q: 'What is PulseRoots?',
      a: 'PulseRoots is a free, interactive map of electronic music. It organises more than 300 styles into families, showing how each genre descends from another, with a short description, key artists and an example track for every entry.',
    },
    {
      q: 'How many electronic music genres are there?',
      a: 'There is no official number, because genres overlap and new scenes appear every year. PulseRoots documents more than 300 styles and substyles, from early experimental and tape music to contemporary hyperpop, phonk and amapiano.',
    },
    {
      q: 'What is the difference between house and techno?',
      a: 'House grew out of Chicago in the early 1980s with a four-on-the-floor beat around 120 BPM, soulful vocals and piano riffs. Techno emerged in Detroit a few years later with a colder, more mechanical sound, faster tempos and a focus on synthesis and rhythm rather than vocals. Both are families in the tree, and each branches into dozens of substyles.',
    },
    {
      q: 'Can I listen to an example of each genre?',
      a: 'Yes. Every genre page includes an example track linked to Spotify, so you can hear the sound being described. A Spotify account may be required for full playback; previews are available to everyone.',
    },
  ],
  es: [
    {
      q: '¿Qué es PulseRoots?',
      a: 'PulseRoots es un mapa interactivo y gratuito de la música electrónica. Organiza más de 300 estilos en familias y muestra de qué género desciende cada uno, con una descripción breve, artistas clave y una pista de ejemplo en cada ficha.',
    },
    {
      q: '¿Cuántos géneros de música electrónica existen?',
      a: 'No hay una cifra oficial, porque los géneros se solapan y cada año aparecen escenas nuevas. PulseRoots documenta más de 300 estilos y subestilos, desde la música experimental y de cinta hasta el hyperpop, el phonk o el amapiano contemporáneos.',
    },
    {
      q: '¿Cuál es la diferencia entre house y techno?',
      a: 'El house nació en Chicago a principios de los ochenta con un pulso de cuatro tiempos a unos 120 BPM, voces con alma y riffs de piano. El techno surgió en Detroit pocos años después con un sonido más frío y mecánico, tempos más rápidos y más peso de la síntesis y el ritmo que de la voz. Ambas son familias del árbol y cada una se ramifica en decenas de subestilos.',
    },
    {
      q: '¿Puedo escuchar un ejemplo de cada género?',
      a: 'Sí. Cada página de género incluye una pista de ejemplo enlazada a Spotify para que escuches el sonido descrito. Puede que necesites una cuenta de Spotify para la reproducción completa; las vistas previas están disponibles para todo el mundo.',
    },
  ],
};

export const siteExplainer = {
  en: {
    heading: 'What this electronic music map shows',
    paragraphs: [
      'PulseRoots is a genre tree, not an alphabetical list. Every style is placed where it came from: Detroit Techno under Techno, Acid House under Chicago House, Dungeon Synth under Dark Ambient. Following a branch shows how a sound travelled from one scene to another and which styles share the same roots.',
      'Each genre page adds context to the tree: a description of the sound and its history, the key artists who shaped it, an example track you can play, its parent style, its substyles and the styles that share artists with it. Pages are linked in both directions, so you can move from a broad family down to a micro-genre and back.',
      'The site is curated by hand and reviewed periodically. Descriptions use encyclopaedic sources as a starting point, while artist lists and tracks are chosen to represent the style rather than to rank popularity.',
    ],
    faqHeading: 'Frequently asked questions',
  },
  es: {
    heading: 'Qué muestra este mapa de música electrónica',
    paragraphs: [
      'PulseRoots es un árbol de géneros, no una lista alfabética. Cada estilo se coloca donde nació: el Detroit Techno dentro del Techno, el Acid House dentro del Chicago House o el Dungeon Synth dentro del Dark Ambient. Seguir una rama muestra cómo un sonido viajó de una escena a otra y qué estilos comparten raíces.',
      'Cada página de género añade contexto al árbol: una descripción del sonido y su historia, los artistas clave que lo definieron, una pista de ejemplo para escucharlo, su estilo padre, sus subestilos y los estilos que comparten artistas. Las páginas se enlazan en ambos sentidos, así que puedes bajar de una familia amplia a un microgénero y volver.',
      'El sitio se cura a mano y se revisa periódicamente. Las descripciones parten de fuentes enciclopédicas, mientras que los artistas y las pistas se eligen para representar el estilo, no para ordenar popularidad.',
    ],
    faqHeading: 'Preguntas frecuentes',
  },
};
