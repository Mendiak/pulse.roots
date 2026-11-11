/**
 * Long-form editorial guides.
 *
 * Both locales live side by side in the same object so a translation can never
 * silently drift out of sync with its original. Paragraphs are trusted HTML
 * strings: they may contain inline links to genre pages, which are validated by
 * scripts/verify-seo.mjs at build time.
 *
 * Each act carries a `from`/`to` year range. The article template renders the
 * matching facts from public/data/music_history.json underneath the prose, so
 * the sourced chronology is part of the static HTML instead of being fetched by
 * the timeline island at runtime.
 */

export const guidesIndex = {
  en: {
    title: 'Guides to Electronic Music Genres | PulseRoots',
    description:
      'Long-form, sourced guides to electronic music: how the genres appeared, how they relate to each other, and where each style sits in the family tree.',
    h1: 'Guides',
    lead:
      'Longer reads for the questions a genre tree cannot answer on its own: where a sound came from, why it split, and what the hardware had to do with it.',
    readLabel: 'Read the guide',
    moreHeading: 'Looking for a specific style?',
    moreText:
      'The <a href="/pulse.roots/genres/">genre families</a> cover every branch of the tree, and the <a href="/pulse.roots/sitemap/">full sitemap</a> lists all 300+ styles alphabetically.',
  },
  es: {
    title: 'Guías de música electrónica | PulseRoots',
    description:
      'Guías extensas y documentadas sobre música electrónica: cómo nacieron los géneros, cómo se relacionan entre sí y dónde se sitúa cada estilo en el árbol.',
    h1: 'Guías',
    lead:
      'Lecturas largas para las preguntas que un árbol de géneros no puede responder solo: de dónde viene un sonido, por qué se dividió y qué tuvo que ver el hardware.',
    readLabel: 'Leer la guía',
    moreHeading: '¿Buscas un estilo concreto?',
    moreText:
      'Las <a href="/pulse.roots/es/genres/">familias de géneros</a> cubren todas las ramas del árbol, y el <a href="/pulse.roots/es/sitemap/">mapa del sitio</a> lista los más de 300 estilos por orden alfabético.',
  },
};

export const guides = [
  {
    slug: 'electronic-music-history',
    updated: '2026-10-30',
    en: {
      title: 'Electronic Music History: 1897 to Today | PulseRoots',
      description:
        'From the Telharmonium to hyperpop: how electronic music moved from laboratories to clubs, and which genres were born along the way.',
      h1: 'Electronic music history: from the Telharmonium to the club',
      lead:
        'Electronic music is usually told as a story about machines. It is really a story about access: every time a tool became cheaper or simpler, a new group of people could make a sound nobody had made before. This is how that happened, in five acts.',
      updatedLabel: 'Last updated',
      timelineHeading: 'What happened',
      familiesIntro:
        'The history above is a timeline. The site itself is a tree: each family below is an entry point into the styles and substyles that share an origin, an era or a sound.',
      faqHeading: 'Frequently asked questions',
      ctaHeading: 'Follow a branch instead of a decade',
      ctaText:
        'A timeline tells you when something happened. It does not tell you what descended from what. The interactive tree does: every genre sits under its parent style, with key artists and an example track you can play.',
      ctaLabel: 'Open the interactive genre tree',
      acts: [
        {
          id: 'pioneers',
          heading: 'Before the beat (1897–1949)',
          standfirst:
            'Electronic music begins as an engineering problem: how do you produce a pitch without a string, a reed or a column of air?',
          from: 1897,
          to: 1949,
          paragraphs: [
            'In 1897 Thaddeus Cahill patented the Telharmonium, an instrument that generated sound with rotating tone wheels and sent it down telephone lines. It weighed around 200 tonnes, it was barely audible, and it ruined its investors. It also proved the central idea of the next century: sound could be generated electrically and transmitted like a signal.',
            'What followed was smaller and stranger. Léon Theremin’s theremin (1920) was played by moving your hands through an electromagnetic field, with no contact at all. Maurice Martenot’s Ondes Martenot (1928) added a keyboard and a ring controller and reached the concert hall. Laurens Hammond’s organ (1935) and the Novachord (1939) brought something less romantic but more important: instruments that stayed in tune and could be manufactured.',
            'None of this was pop music. It was an avant-garde project, and it is the direct root of the <a href="/pulse.roots/genres/experimental/">experimental</a> branch of the tree — you can still hear its logic in <a href="/pulse.roots/genres/experimental/neoclassical/">neoclassical</a> and in <a href="/pulse.roots/genres/experimental/musique-concrete/">musique concrète</a>.',
          ],
        },
        {
          id: 'tape',
          heading: 'Tape and voltage (1950–1969)',
          standfirst:
            'Two schools, one question: is the material of music a sound you recorded, or a waveform you invented from nothing?',
          from: 1950,
          to: 1969,
          paragraphs: [
            'Pierre Schaeffer’s musique concrète reversed the problem. Instead of building a tone from oscillators, you recorded the world — trains, footsteps, voices — and cut the tape. The studio became the instrument and editing became composition. In Germany, Karlheinz Stockhausen pushed the opposite way: purely synthetic sound, organised with serialist rules. The WDR studio in Cologne produced tape pieces with no acoustic source at all, which is electronic music in the strictest sense.',
            'The hardware then left the university. The RCA Mark II (1957) was the first programmable synthesizer, a room-sized machine that read punched paper. Don Buchla’s modular systems (1963) replaced the keyboard with touch-sensitive plates on purpose, to stop people playing them like pianos. Robert Moog commercialised his modular synth in 1964, and four years later Wendy Carlos’s <em>Switched-On Bach</em> sold hundreds of thousands of copies of Bach played entirely on a Moog. The Mellotron (1963) did something different again: it played tape loops of real instruments from a keyboard, which is a sampler wearing an orchestra’s clothes.',
            'This is where the tree forks. One path leads to <a href="/pulse.roots/genres/experimental/tape-music/">tape music</a>, <a href="/pulse.roots/genres/experimental/noise-distortion/">noise and distortion</a> and the academic avant-garde. The other leads, through <a href="/pulse.roots/genres/ambient/">ambient</a>, to the idea that a machine can make a room feel different.',
          ],
        },
        {
          id: 'body',
          heading: 'The body (1970–1979)',
          standfirst:
            'Electronic music discovers rhythm, and stops being a laboratory curiosity. Two German bands and one Italian producer do most of the work.',
          from: 1970,
          to: 1979,
          paragraphs: [
            'Kraftwerk, formed in Düsseldorf in 1970, is the hinge of this entire history. <em>Autobahn</em> (1974) was a hit built out of synthetic pulses, and it made an argument that would hold for the next fifty years: electronic music could be pop, and pop could be machine-made. Their influence runs through <a href="/pulse.roots/genres/pop-and-rock-fusion/electronic-rock/krautrock/">krautrock</a>, <a href="/pulse.roots/genres/electro/">electro</a> and <a href="/pulse.roots/genres/techno/">techno</a> in a way that is almost impossible to overstate.',
            'In parallel, two other things happened. Brian Eno, working with tape loops and generative processes, built the grammar of <a href="/pulse.roots/genres/ambient/">ambient</a> music: music as a system rather than a performance. And in Munich, Giorgio Moroder produced Donna Summer’s “I Feel Love” (1977), a disco record with a fully synthesised backing track. Disco gave electronic music a dancefloor, and <a href="/pulse.roots/genres/disco/electro-disco/">electro-disco</a> and <a href="/pulse.roots/genres/disco/space-disco/">space disco</a> are its direct descendants.',
            'The hardware accelerated all of it. Roland set up its instrument division in 1975, the CR-78 (1978) was the first drum machine with a microprocessor, and the Fairlight CMI (1979) was the first commercially available digital sampler. Gary Numan took synthesizers to the top of the UK charts with <em>The Pleasure Principle</em> (1979), and Yellow Magic Orchestra, formed in Tokyo in 1978, made electronic pop that still sounds like the future.',
          ],
        },
        {
          id: 'machine',
          heading: 'The machine (1980–1989)',
          standfirst:
            'Two drum machines and one bass synthesizer, sold cheaply and used wrongly, produce most of the genres this site documents.',
          from: 1980,
          to: 1989,
          paragraphs: [
            'The Roland TR-808 (1980) made its kick drum out of a tuned sine wave, which is why it sounds like nothing acoustic. The TR-909 (1983) combined analogue and digital. The TB-303 (1981) was a failure as a bass guitar emulator and became, in the wrong hands, the sound of acid. Add MIDI (1983), which let machines talk to each other, and the Akai MPC60 (1988), which put a sampler, pads and a sequencer in one box, and the studio stopped being a room.',
            'Chicago: Frankie Knuckles took a residency at The Warehouse in 1982, and <a href="/pulse.roots/genres/house/">house music</a> took its name from the room. Jesse Saunders’s “On &amp; On” (1984) is usually named as the first house record, Phuture’s “Acid Tracks” (1987) defined <a href="/pulse.roots/genres/house/chicago-house/acid-house/">acid house</a>, and the Second Summer of Love (1988) put it in front of tens of thousands of people across the UK.',
            'Detroit: Juan Atkins, Derrick May and Kevin Saunderson built <a href="/pulse.roots/genres/techno/detroit-techno/">techno</a> out of Kraftwerk, funk and a futurist reading of a collapsing city. The compilation <em>Techno! The New Dance Sound of Detroit</em> (1988) gave the genre its international name. In the Bronx, Afrika Bambaataa’s “Planet Rock” (1982) had already fused hip hop with Kraftwerk to define <a href="/pulse.roots/genres/electro/">electro</a>. And in Germany, the fall of the Berlin Wall (1989) turned a marginal scene into a national export.',
            'By the end of the decade the barriers had collapsed from both sides: the Yamaha DX7 (1983) made digital synthesis affordable, E-mu’s Emulator II (1985) expanded the sonic palette of pop, and Warp Records (1989) began building a home for what would soon be called <a href="/pulse.roots/genres/experimental/idm-intelligent-dance-music/">IDM</a>.',
          ],
        },
        {
          id: 'fragmentation',
          heading: 'Fragmentation (1990–today)',
          standfirst:
            'Once publishing a genre costs nothing, you get hundreds of them. The tree you are looking at is the result.',
          from: 1990,
          to: 2026,
          paragraphs: [
            'The 1990s turned local scenes into global genres within a couple of years. <a href="/pulse.roots/genres/trance/">Trance</a> emerged from European clubs — “The Age of Love” (1990) is the usual starting point — and split into progressive, uplifting, hard and <a href="/pulse.roots/genres/trance/goa-trance/">goa</a> branches. Jungle appeared in the UK in 1993 and hardened into <a href="/pulse.roots/genres/bass-music/drum-and-bass/">drum and bass</a> by 1995. <a href="/pulse.roots/genres/chill-out/trip-hop/">Trip-hop</a> came out of Bristol, and IDM came out of Warp’s <em>Artificial Intelligence</em> compilation (1992) and Aphex Twin’s early records.',
            'The tools kept lowering the price of entry. Cubase VST (1996) moved the studio into the computer. Ableton Live (2001) made the laptop a live instrument. Kontakt (2002) turned sampling into a software problem. Napster (1999) and then Spotify (2008) rewrote distribution, and Boiler Room (2010) changed what a performance was supposed to look like.',
            'The result is the tree you are looking at. <a href="/pulse.roots/genres/bass-music/dubstep/">Dubstep</a> left South London in 2002 and split into <a href="/pulse.roots/genres/bass-music/dubstep/brostep/">brostep</a>, riddim, deep and melodic branches within a decade. <a href="/pulse.roots/genres/bass-music/juke/footwork/">Footwork</a> arrived from Chicago. <a href="/pulse.roots/genres/pop-and-rock-fusion/hyperpop/">Hyperpop</a> was named by PC Music around 2013 and broke through with SOPHIE and 100 gecs, while <a href="/pulse.roots/genres/experimental/experimental-club-avant-club/deconstructed-club/">deconstructed club</a>, <a href="/pulse.roots/genres/bass-music/phonk/">phonk</a>, <a href="/pulse.roots/genres/house/kwaito/amapiano/">amapiano</a> and <a href="/pulse.roots/genres/bass-music/wave/hardwave/">hardwave</a> followed. The last fifteen years have produced more named micro-genres than the previous fifty, mostly because the cost of publishing one is now close to zero.',
            'That is also why the names stop meaning much on their own. Two producers can use the same label for sounds that share nothing but a tempo range, and a scene can be named before anybody agrees on what it sounds like. The useful question is no longer “what genre is this?” but “what did it come out of?” — which is the question a tree answers and a list does not.',
          ],
        },
      ],
      faq: [
        {
          q: 'When did electronic music start?',
          a: 'The first electronic instruments appear at the end of the 19th century — the Telharmonium was patented in 1897 — but electronic music as a compositional practice starts with musique concrète and the Cologne studio in the 1950s. As a popular form it begins with Kraftwerk, disco and the first drum machines in the 1970s.',
        },
        {
          q: 'What was the first electronic music genre?',
          a: 'If you mean a named genre that people used while making records, house and techno are the usual answers, both emerging in the United States in the early 1980s. If you mean the first body of work made entirely with electronic means, it is musique concrète and the German tape music of the 1950s.',
        },
        {
          q: 'How many electronic music genres are there?',
          a: 'There is no official number, because the boundaries are argued over and new scenes appear every year. PulseRoots documents more than 300 styles and substyles across 15 families, from early tape music to hyperpop, phonk and amapiano.',
        },
        {
          q: 'Why are there so many subgenres of electronic music?',
          a: 'Because the cost of making and releasing a record collapsed twice: first with cheap drum machines and samplers in the 1980s, then with software in the 2000s. Every time the barrier drops, local scenes multiply and each one names itself.',
        },
      ],
    },
    es: {
      title: 'Historia de la música electrónica: de 1897 a hoy | PulseRoots',
      description:
        'Del Telharmonium al hyperpop: cómo la música electrónica pasó del laboratorio al club y qué géneros nacieron por el camino.',
      h1: 'Historia de la música electrónica: del Telharmonium al club',
      lead:
        'La música electrónica suele contarse como una historia de máquinas. En realidad es una historia de acceso: cada vez que una herramienta se volvió más barata o más sencilla, un grupo nuevo de personas pudo hacer un sonido que nadie había hecho antes. Así es como ocurrió, en cinco actos.',
      updatedLabel: 'Última actualización',
      timelineHeading: 'Qué pasó',
      familiesIntro:
        'La historia de arriba es una línea de tiempo. El sitio en sí es un árbol: cada familia de abajo es una puerta de entrada a los estilos y subestilos que comparten origen, época o sonido.',
      faqHeading: 'Preguntas frecuentes',
      ctaHeading: 'Sigue una rama en vez de una década',
      ctaText:
        'Una línea de tiempo te dice cuándo pasó algo. No te dice de qué desciende. El árbol interactivo sí: cada género cuelga de su estilo padre, con artistas clave y una pista de ejemplo para escucharlo.',
      ctaLabel: 'Abrir el árbol interactivo de géneros',
      acts: [
        {
          id: 'pioneros',
          heading: 'Antes del ritmo (1897–1949)',
          standfirst:
            'La música electrónica empieza como un problema de ingeniería: cómo producir una altura sin una cuerda, una lengüeta ni una columna de aire.',
          from: 1897,
          to: 1949,
          paragraphs: [
            'En 1897 Thaddeus Cahill patentó el Telharmonium, un instrumento que generaba sonido con ruedas fónicas giratorias y lo enviaba por líneas telefónicas. Pesaba unas 200 toneladas, apenas se oía y arruinó a sus inversores. También demostró la idea central del siglo siguiente: el sonido se podía generar eléctricamente y transmitir como una señal.',
            'Lo que vino después fue más pequeño y más raro. El theremin de Léon Theremin (1920) se tocaba moviendo las manos por un campo electromagnético, sin contacto alguno. El Ondes Martenot de Maurice Martenot (1928) añadió teclado y anillo controlador y llegó a la sala de conciertos. El órgano de Laurens Hammond (1935) y el Novachord (1939) trajeron algo menos romántico pero más importante: instrumentos que se mantenían afinados y se podían fabricar en serie.',
            'Nada de esto era música pop. Era un proyecto de vanguardia, y es la raíz directa de la rama <a href="/pulse.roots/es/genres/experimental/">experimental</a> del árbol: su lógica se sigue oyendo en lo <a href="/pulse.roots/es/genres/experimental/neoclassical/">neoclásico</a> y en la <a href="/pulse.roots/es/genres/experimental/musique-concrete/">música concreta</a>.',
          ],
        },
        {
          id: 'cinta',
          heading: 'Cinta y voltaje (1950–1969)',
          standfirst:
            'Dos escuelas, una sola pregunta: ¿la materia de la música es un sonido que grabaste o una onda que inventaste de la nada?',
          from: 1950,
          to: 1969,
          paragraphs: [
            'La música concreta de Pierre Schaeffer invirtió el problema. En vez de construir un tono con osciladores, grababas el mundo — trenes, pasos, voces — y cortabas la cinta. El estudio se convirtió en el instrumento y el montaje en composición. En Alemania, Karlheinz Stockhausen empujó en la dirección contraria: sonido puramente sintético, organizado con reglas seriales. El estudio de la WDR en Colonia produjo piezas de cinta sin ninguna fuente acústica, que es música electrónica en el sentido más estricto.',
            'Después el hardware salió de la universidad. El RCA Mark II (1957) fue el primer sintetizador programable, una máquina del tamaño de una habitación que leía papel perforado. Los sistemas modulares de Don Buchla (1963) sustituyeron el teclado por placas táctiles a propósito, para que nadie los tocara como un piano. Robert Moog comercializó su sintetizador modular en 1964 y, cuatro años más tarde, el <em>Switched-On Bach</em> de Wendy Carlos vendió cientos de miles de copias de Bach tocado entero con un Moog. El Mellotron (1963) hizo algo distinto: reproducía bucles de cinta con instrumentos reales desde un teclado, o sea un sampler vestido de orquesta.',
            'Aquí se bifurca el árbol. Un camino lleva a la <a href="/pulse.roots/es/genres/experimental/tape-music/">música de cinta</a>, al <a href="/pulse.roots/es/genres/experimental/noise-distortion/">ruido y la distorsión</a> y a la vanguardia académica. El otro lleva, a través del <a href="/pulse.roots/es/genres/ambient/">ambient</a>, a la idea de que una máquina puede cambiar cómo se siente una habitación.',
          ],
        },
        {
          id: 'cuerpo',
          heading: 'El cuerpo (1970–1979)',
          standfirst:
            'La música electrónica descubre el ritmo y deja de ser una curiosidad de laboratorio. Dos grupos alemanes y un productor italiano hacen casi todo el trabajo.',
          from: 1970,
          to: 1979,
          paragraphs: [
            'Kraftwerk, formado en Düsseldorf en 1970, es el gozne de toda esta historia. <em>Autobahn</em> (1974) fue un éxito construido con pulsos sintéticos y planteó un argumento que aguantaría los cincuenta años siguientes: la música electrónica podía ser pop, y el pop podía estar hecho por máquinas. Su influencia atraviesa el <a href="/pulse.roots/es/genres/pop-and-rock-fusion/electronic-rock/krautrock/">krautrock</a>, el <a href="/pulse.roots/es/genres/electro/">electro</a> y el <a href="/pulse.roots/es/genres/techno/">techno</a> de una forma difícil de exagerar.',
            'En paralelo pasaron otras dos cosas. Brian Eno, trabajando con bucles de cinta y procesos generativos, construyó la gramática del <a href="/pulse.roots/es/genres/ambient/">ambient</a>: música como sistema y no como interpretación. Y en Múnich, Giorgio Moroder produjo “I Feel Love” de Donna Summer (1977), un disco de disco con la base completamente sintetizada. El disco le dio a la música electrónica una pista de baile, y el <a href="/pulse.roots/es/genres/disco/electro-disco/">electro-disco</a> y el <a href="/pulse.roots/es/genres/disco/space-disco/">space disco</a> son sus descendientes directos.',
            'El hardware lo aceleró todo. Roland creó su división de instrumentos en 1975, la CR-78 (1978) fue la primera caja de ritmos con microprocesador y el Fairlight CMI (1979) fue el primer sampler digital disponible comercialmente. Gary Numan llevó los sintetizadores a lo más alto de las listas británicas con <em>The Pleasure Principle</em> (1979), y Yellow Magic Orchestra, formada en Tokio en 1978, hizo pop electrónico que todavía suena a futuro.',
          ],
        },
        {
          id: 'maquina',
          heading: 'La máquina (1980–1989)',
          standfirst:
            'Dos cajas de ritmos y un sintetizador de bajos, vendidos baratos y usados mal, producen la mayoría de los géneros que documenta este sitio.',
          from: 1980,
          to: 1989,
          paragraphs: [
            'La Roland TR-808 (1980) construía su bombo con una onda senoidal afinada, y por eso no suena a nada acústico. La TR-909 (1983) mezcló analógico y digital. La TB-303 (1981) fue un fracaso como emulador de bajo y se convirtió, en las manos equivocadas, en el sonido del acid. Súmale el MIDI (1983), que dejó que las máquinas se hablaran entre ellas, y la Akai MPC60 (1988), que metió sampler, pads y secuenciador en una sola caja, y el estudio dejó de ser una habitación.',
            'Chicago: Frankie Knuckles se hizo residente en The Warehouse en 1982, y la <a href="/pulse.roots/es/genres/house/">música house</a> tomó el nombre de esa sala. “On &amp; On” de Jesse Saunders (1984) suele citarse como el primer disco de house, “Acid Tracks” de Phuture (1987) definió el <a href="/pulse.roots/es/genres/house/chicago-house/acid-house/">acid house</a>, y el Segundo Verano del Amor (1988) lo puso delante de decenas de miles de personas en el Reino Unido.',
            'Detroit: Juan Atkins, Derrick May y Kevin Saunderson construyeron el <a href="/pulse.roots/es/genres/techno/detroit-techno/">techno</a> a partir de Kraftwerk, el funk y una lectura futurista de una ciudad en decadencia. El recopilatorio <em>Techno! The New Dance Sound of Detroit</em> (1988) le dio al género su nombre internacional. En el Bronx, “Planet Rock” de Afrika Bambaataa (1982) ya había fusionado hip hop y Kraftwerk para definir el <a href="/pulse.roots/es/genres/electro/">electro</a>. Y en Alemania, la caída del Muro de Berlín (1989) convirtió una escena marginal en un producto de exportación nacional.',
            'A finales de la década las barreras habían caído por los dos lados: el Yamaha DX7 (1983) hizo asequible la síntesis digital, el Emulator II de E-mu (1985) amplió la paleta sonora del pop y Warp Records (1989) empezó a construir una casa para lo que pronto se llamaría <a href="/pulse.roots/es/genres/experimental/idm-intelligent-dance-music/">IDM</a>.',
          ],
        },
        {
          id: 'fragmentacion',
          heading: 'Fragmentación (1990–hoy)',
          standfirst:
            'Cuando publicar un género no cuesta nada, aparecen cientos. El árbol que estás mirando es el resultado.',
          from: 1990,
          to: 2026,
          paragraphs: [
            'Los años noventa convirtieron escenas locales en géneros globales en un par de años. El <a href="/pulse.roots/es/genres/trance/">trance</a> salió de los clubs europeos —“The Age of Love” (1990) es el punto de partida habitual— y se dividió en ramas progresivas, uplifting, duras y <a href="/pulse.roots/es/genres/trance/goa-trance/">goa</a>. El jungle apareció en el Reino Unido en 1993 y se endureció hasta el <a href="/pulse.roots/es/genres/bass-music/drum-and-bass/">drum and bass</a> en 1995. El <a href="/pulse.roots/es/genres/chill-out/trip-hop/">trip-hop</a> salió de Bristol, y el IDM del recopilatorio <em>Artificial Intelligence</em> de Warp (1992) y de los primeros discos de Aphex Twin.',
            'Las herramientas siguieron bajando el precio de entrada. Cubase VST (1996) metió el estudio en el ordenador. Ableton Live (2001) convirtió el portátil en un instrumento en directo. Kontakt (2002) transformó el sampleo en un problema de software. Napster (1999) y después Spotify (2008) reescribieron la distribución, y Boiler Room (2010) cambió el aspecto que se supone que tiene una actuación.',
            'El resultado es el árbol que estás mirando. El <a href="/pulse.roots/es/genres/bass-music/dubstep/">dubstep</a> salió del sur de Londres en 2002 y se dividió en <a href="/pulse.roots/es/genres/bass-music/dubstep/brostep/">brostep</a>, riddim, deep y melodic en una década. El <a href="/pulse.roots/es/genres/bass-music/juke/footwork/">footwork</a> llegó desde Chicago. El <a href="/pulse.roots/es/genres/pop-and-rock-fusion/hyperpop/">hyperpop</a> lo nombró PC Music hacia 2013 y estalló con SOPHIE y 100 gecs, mientras llegaban el <a href="/pulse.roots/es/genres/experimental/experimental-club-avant-club/deconstructed-club/">deconstructed club</a>, el <a href="/pulse.roots/es/genres/bass-music/phonk/">phonk</a>, el <a href="/pulse.roots/es/genres/house/kwaito/amapiano/">amapiano</a> y el <a href="/pulse.roots/es/genres/bass-music/wave/hardwave/">hardwave</a>. Los últimos quince años han producido más microgéneros con nombre que los cincuenta anteriores, sobre todo porque el coste de publicar uno está hoy cerca de cero.',
            'Eso es también la razón de que los nombres dejen de significar mucho por sí solos. Dos productores pueden usar la misma etiqueta para sonidos que no comparten nada salvo un rango de tempo, y una escena puede tener nombre antes de que nadie se ponga de acuerdo sobre cómo suena. La pregunta útil ya no es “¿qué género es esto?” sino “¿de qué ha salido?”, que es justo la pregunta que responde un árbol y no una lista.',
          ],
        },
      ],
      faq: [
        {
          q: '¿Cuándo empezó la música electrónica?',
          a: 'Los primeros instrumentos electrónicos aparecen a finales del siglo XIX —el Telharmonium se patentó en 1897—, pero la música electrónica como práctica compositiva arranca con la música concreta y el estudio de Colonia en los años cincuenta. Como forma popular empieza con Kraftwerk, el disco y las primeras cajas de ritmos en los setenta.',
        },
        {
          q: '¿Cuál fue el primer género de música electrónica?',
          a: 'Si te refieres a un género con nombre que la gente usara al hacer discos, las respuestas habituales son house y techno, ambos surgidos en Estados Unidos a principios de los ochenta. Si te refieres al primer conjunto de obras hechas enteramente con medios electrónicos, es la música concreta y la música de cinta alemana de los cincuenta.',
        },
        {
          q: '¿Cuántos tipos de música electrónica hay?',
          a: 'No hay una cifra oficial, porque los límites se discuten y cada año aparecen escenas nuevas. PulseRoots documenta más de 300 estilos y subestilos repartidos en 15 familias, desde la música de cinta temprana hasta el hyperpop, el phonk o el amapiano.',
        },
        {
          q: '¿Por qué hay tantos subgéneros de música electrónica?',
          a: 'Porque el coste de hacer y publicar un disco se derrumbó dos veces: primero con cajas de ritmos y samplers baratos en los ochenta, después con el software en los 2000. Cada vez que baja la barrera, las escenas locales se multiplican y cada una se pone nombre.',
        },
      ],
    },
  },
  {
    slug: 'types-of-electronic-music',
    updated: '2026-11-11',
    en: {
      title: 'Types of Electronic Music: A Guide to 14 Families | PulseRoots',
      description:
        'What types of electronic music exist and how they relate: the 14 families of the genre tree, from techno and house to ambient, bass music and global club.',
      h1: 'Types of electronic music: how the 14 families are organised',
      lead:
        'There is no official count of electronic music genres, and any list you find will disagree with the next one. What can be done is to group styles by what they actually share: an origin, a tempo range, a set of machines and a scene. These are the 14 families PulseRoots uses, and why each one holds together.',
      updatedLabel: 'Last updated',
      timelineHeading: 'What happened',
      familiesIntro:
        'The families below are the top level of the tree. Each card opens a family page with its styles and substyles, their key artists and an example track.',
      faqHeading: 'Frequently asked questions',
      ctaHeading: 'Pick a branch and follow it',
      ctaText:
        'A list tells you that a genre exists. A tree tells you what it came out of. Every page links to its parent style, its substyles and the styles that share its key artists, so you can move from techno to Detroit techno to ghettotech in two clicks.',
      ctaLabel: 'Open the interactive genre tree',
      acts: [
        {
          id: 'no-official-list',
          heading: 'Why there is no fixed list',
          standfirst:
            'Genre names are social agreements, not scientific categories. They change when the scene, the tools or the audience change.',
          from: 0,
          to: 0,
          paragraphs: [
            'A genre is named by the people making it, selling it or dancing to it, and those groups rarely agree. Two records can share a tempo and a drum machine and still end up under different labels because they came from different cities. That is why Beatport, Spotify and a record shop in Berlin will give you three different answers to the same question.',
            'The other reason is hardware. Every time production became cheaper - the TB-303 and TR-808 in the early 1980s, the sampler and MIDI later in the decade, the laptop in the 2000s - a new group of people could release music, and each group named what it made. The last fifteen years have produced more named micro-genres than the previous fifty for exactly that reason.',
            'So the useful question is not "how many types are there" but "what did this come out of". That is what a family tree answers and an alphabetical list cannot. If you want the chronology instead, the <a href="/pulse.roots/guides/electronic-music-history/">history of electronic music</a> covers it from the Telharmonium to hyperpop.',
          ],
        },
        {
          id: 'the-14-families',
          heading: 'The 14 families, in four groups',
          standfirst:
            'PulseRoots groups 300+ styles into 14 families. They are easier to remember in four blocks: dancefloor, bass, listening and fusion.',
          from: 0,
          to: 0,
          paragraphs: [
            '<strong>Dancefloor.</strong> <a href="/pulse.roots/genres/techno/">Techno</a> and <a href="/pulse.roots/genres/house/">house</a> are the two structural pillars, both born in the United States in the early 1980s. <a href="/pulse.roots/genres/trance/">Trance</a> grew out of European clubs in the early 1990s, <a href="/pulse.roots/genres/electro/">electro</a> comes from the Bronx meeting Kraftwerk, and <a href="/pulse.roots/genres/disco/">disco</a> is the 1970s root that gave electronic music a dancefloor in the first place.',
            '<strong>Bass.</strong> <a href="/pulse.roots/genres/bass-music/">Bass music</a> is the UK continuum: jungle turning into <a href="/pulse.roots/genres/bass-music/drum-and-bass/">drum and bass</a>, <a href="/pulse.roots/genres/bass-music/dubstep/">dubstep</a> splitting into a dozen branches, plus <a href="/pulse.roots/genres/bass-music/phonk/">phonk</a> and <a href="/pulse.roots/genres/bass-music/future-bass/">future bass</a>. <a href="/pulse.roots/genres/breakbeat/">Breakbeat</a> covers the styles built on a broken drum pattern rather than a four-to-the-floor kick.',
            '<strong>Listening.</strong> <a href="/pulse.roots/genres/ambient/">Ambient</a> treats music as a room rather than a song. <a href="/pulse.roots/genres/chill-out/">Chill-out</a> collects downtempo and trip-hop. <a href="/pulse.roots/genres/experimental/">Experimental</a> is the academic and avant-garde branch, from tape music to noise and <a href="/pulse.roots/genres/experimental/idm-intelligent-dance-music/">IDM</a>.',
            '<strong>Fusion.</strong> <a href="/pulse.roots/genres/pop-and-rock-fusion/">Pop and rock fusion</a> covers electronic pop, <a href="/pulse.roots/genres/pop-and-rock-fusion/hyperpop/">hyperpop</a> and industrial rock. <a href="/pulse.roots/genres/funk-and-soul-fusion/">Funk and soul fusion</a> connects house and hip hop to jazz and soul. <a href="/pulse.roots/genres/global-club/">Global club</a> gathers the regional scenes - <a href="/pulse.roots/genres/house/kwaito/amapiano/">amapiano</a>, reggaeton, baile funk, Afrobeats - that now circulate globally. <a href="/pulse.roots/genres/industrial-and-post-industrial/">Industrial and post-industrial</a> is the darkest branch, from Throbbing Gristle to witch house.',
          ],
        },
        {
          id: 'family-vs-style',
          heading: 'Family, style and subgenre',
          standfirst:
            'A family is a broad branch. A style is a named scene inside it. A subgenre is a variation of that scene. The same word can sit at different levels depending on who is using it.',
          from: 0,
          to: 0,
          paragraphs: [
            'Take techno. It is a family with 32 documented styles. <a href="/pulse.roots/genres/techno/detroit-techno/">Detroit techno</a> is a style inside it, and ghettotech is a subgenre of Detroit techno. Nothing about the words "style" and "subgenre" forces that hierarchy; it is a way of organising the tree so you can walk it in both directions.',
            'The distinction matters when you search. Someone looking for "techno" wants the family. Someone looking for <a href="/pulse.roots/genres/techno/minimal-techno/">minimal techno</a> or <a href="/pulse.roots/genres/techno/acid-techno/">acid techno</a> already knows the scene and wants a precise page. That is why every genre page carries a parent link, a list of substyles and a set of neighbours.',
          ],
        },
        {
          id: 'common-confusions',
          heading: 'The confusions that come up most',
          standfirst:
            'Four pairs account for most of the search confusion: EDM against electronic music, house against techno, electro against electro house, and trance against techno.',
          from: 0,
          to: 0,
          paragraphs: [
            '<strong>EDM is not the same as electronic music.</strong> EDM became a marketing umbrella in the United States around 2010 for festival-facing dance music, mostly big room and electro house. Electronic music is a century-old field that includes ambient, experimental and industrial. Every EDM track is electronic; most electronic music is not EDM. In the tree, the EDM styles live under <a href="/pulse.roots/genres/house/electro-house/">electro house</a>, big room and <a href="/pulse.roots/genres/bass-music/trap-edm/">trap</a>, not in a family of their own.',
            '<strong>House and techno are siblings, not synonyms.</strong> Both started in the United States in the early 1980s. House came from Chicago, with swung drums, soul and disco samples and a tempo around 110-128 BPM. Techno came from Detroit, with a colder, mechanical pulse, futurist imagery and a wider range, roughly 120-140 BPM. <a href="/pulse.roots/genres/house/tech-house/">Tech house</a> is the deliberate hybrid.',
            '<strong>Electro is not electro house.</strong> <a href="/pulse.roots/genres/electro/">Electro</a> is the early-1980s Bronx sound built on drum machines, vocoders and Kraftwerk. <a href="/pulse.roots/genres/house/electro-house/">Electro house</a> is a 2000s club genre with a distorted bass and a four-to-the-floor kick. They share a word and very little else.',
            '<strong>Trance is a genre, not a technique.</strong> <a href="/pulse.roots/genres/trance/">Trance</a> is the melodic, 130-145 BPM European style that split into progressive, uplifting, hard and <a href="/pulse.roots/genres/trance/goa-trance/psytrance/">psytrance</a>. A techno track can be hypnotic without being trance; the label describes a scene and a structure, not just an effect.',
          ],
        },
        {
          id: 'how-to-choose',
          heading: 'How to find the type you are after',
          standfirst:
            'Four routes work better than scrolling a list: by function, by tempo, by era, or by the artist you already like.',
          from: 0,
          to: 0,
          paragraphs: [
            'By function: do you want to dance, focus or disappear into sound? Dancefloor points to techno, house, trance and disco. Focus points to ambient, drone and minimal. Disappearing points to experimental and noise. The family cards above are ordered by that logic as much as by history.',
            'By tempo: downtempo sits under 100 BPM, house around 110-128, techno and trance above 125, drum and bass around 170. Tempo is the fastest way to narrow a search, but it is not a definition - two genres at 130 BPM can share nothing else.',
            'By artist: open the page of a producer you like; the "styles that share key artists" block links to the scenes around them. By era: the <a href="/pulse.roots/guides/electronic-music-history/">history guide</a> puts every decade in order, and each genre page shows its position in the tree.',
          ],
        },
      ],
      faq: [
        {
          q: 'How many types of electronic music are there?',
          a: 'There is no official number. PulseRoots documents 307 styles and substyles across 14 families, from early tape and experimental music to hyperpop, phonk and amapiano. Other catalogues count differently because the boundaries are argued over and new scenes appear every year.',
        },
        {
          q: 'What are the main types of electronic music?',
          a: 'The broad families are techno, house, trance, ambient, bass music, breakbeat, electro, disco, chill-out, experimental, industrial and post-industrial, pop and rock fusion, funk and soul fusion, and global club. Each one branches into styles and substyles with their own artists and example tracks.',
        },
        {
          q: 'Is EDM a type of electronic music?',
          a: 'EDM is an umbrella term popularised in the United States around 2010 for festival dance music, mostly big room and electro house. It is a subset of electronic music, not a separate family, and it does not cover ambient, experimental, industrial or most of the bass continuum.',
        },
        {
          q: 'What is the difference between house and techno?',
          a: 'House came from Chicago in the early 1980s: swung drums, soul and disco samples, roughly 110-128 BPM. Techno came from Detroit at the same time: a colder mechanical pulse, futurist imagery, roughly 120-140 BPM. Tech house is the deliberate hybrid between the two.',
        },
        {
          q: 'What is the difference between a genre and a subgenre?',
          a: 'A genre is a broad family defined by a scene, a sound and a period. A subgenre keeps the core traits of its parent but changes tempo, texture or audience. Detroit techno is a style inside techno, and ghettotech is a subgenre of Detroit techno.',
        },
      ],
    },
    es: {
      title: 'Tipos de música electrónica: guía de las 14 familias | PulseRoots',
      description:
        'Qué tipos de música electrónica existen y cómo se relacionan: las 14 familias del árbol, del techno y el house al ambient, el bass o el global club.',
      h1: 'Tipos de música electrónica: cómo se organizan las 14 familias',
      lead:
        'No hay una cifra oficial de géneros de música electrónica, y cualquier lista que encuentres contradirá a la siguiente. Lo que sí se puede hacer es agrupar los estilos por lo que comparten de verdad: un origen, un rango de tempo, unas máquinas y una escena. Estas son las 14 familias que usa PulseRoots y por qué cada una se sostiene.',
      updatedLabel: 'Última actualización',
      timelineHeading: 'Qué pasó',
      familiesIntro:
        'Las familias de abajo son el primer nivel del árbol. Cada tarjeta abre una página de familia con sus estilos y subestilos, sus artistas clave y una pista de ejemplo.',
      faqHeading: 'Preguntas frecuentes',
      ctaHeading: 'Elige una rama y síguela',
      ctaText:
        'Una lista te dice que un género existe. Un árbol te dice de qué ha salido. Cada página enlaza con su estilo padre, sus subestilos y los estilos que comparten artistas clave, así que puedes pasar del techno al Detroit techno y al ghettotech en dos clics.',
      ctaLabel: 'Abrir el árbol interactivo de géneros',
      acts: [
        {
          id: 'sin-lista-fija',
          heading: 'Por qué no hay una lista cerrada',
          standfirst:
            'Los nombres de los géneros son acuerdos sociales, no categorías científicas. Cambian cuando cambian la escena, las herramientas o el público.',
          from: 0,
          to: 0,
          paragraphs: [
            'Un género lo nombran quienes lo hacen, lo venden o lo bailan, y esos grupos rara vez se ponen de acuerdo. Dos discos pueden compartir tempo y caja de ritmos y acabar bajo etiquetas distintas porque salieron de ciudades distintas. Por eso Beatport, Spotify y una tienda de discos de Berlín te darán tres respuestas diferentes a la misma pregunta.',
            'La otra razón es el hardware. Cada vez que producir se volvió más barato -la TB-303 y la TR-808 a principios de los ochenta, el sampler y el MIDI más tarde, el portátil en los 2000-, un grupo nuevo de personas pudo publicar música, y cada grupo nombró lo que hacía. Los últimos quince años han producido más microgéneros con nombre que los cincuenta anteriores justo por eso.',
            'Así que la pregunta útil no es "¿cuántos tipos hay?" sino "¿de qué ha salido esto?". Eso es lo que responde un árbol y no una lista alfabética. Si prefieres la cronología, la <a href="/pulse.roots/es/guides/electronic-music-history/">historia de la música electrónica</a> la cubre desde el Telharmonium hasta el hyperpop.',
          ],
        },
        {
          id: 'las-14-familias',
          heading: 'Las 14 familias, en cuatro bloques',
          standfirst:
            'PulseRoots agrupa más de 300 estilos en 14 familias. Se recuerdan mejor en cuatro bloques: pista de baile, bass, escucha y fusión.',
          from: 0,
          to: 0,
          paragraphs: [
            '<strong>Pista de baile.</strong> El <a href="/pulse.roots/es/genres/techno/">techno</a> y el <a href="/pulse.roots/es/genres/house/">house</a> son los dos pilares estructurales, ambos nacidos en Estados Unidos a principios de los ochenta. El <a href="/pulse.roots/es/genres/trance/">trance</a> salió de los clubs europeos a principios de los noventa, el <a href="/pulse.roots/es/genres/electro/">electro</a> viene del Bronx cruzado con Kraftwerk, y el <a href="/pulse.roots/es/genres/disco/">disco</a> es la raíz de los setenta que le dio a la música electrónica una pista de baile.',
            '<strong>Bass.</strong> El <a href="/pulse.roots/es/genres/bass-music/">bass music</a> es el continuum británico: el jungle convertido en <a href="/pulse.roots/es/genres/bass-music/drum-and-bass/">drum and bass</a>, el <a href="/pulse.roots/es/genres/bass-music/dubstep/">dubstep</a> dividido en una docena de ramas, más el <a href="/pulse.roots/es/genres/bass-music/phonk/">phonk</a> y el <a href="/pulse.roots/es/genres/bass-music/future-bass/">future bass</a>. El <a href="/pulse.roots/es/genres/breakbeat/">breakbeat</a> reúne los estilos construidos sobre un patrón de batería roto en vez de un bombo a cuatro tiempos.',
            '<strong>Escucha.</strong> El <a href="/pulse.roots/es/genres/ambient/">ambient</a> trata la música como una habitación y no como una canción. El <a href="/pulse.roots/es/genres/chill-out/">chill-out</a> recoge el downtempo y el trip-hop. Lo <a href="/pulse.roots/es/genres/experimental/">experimental</a> es la rama académica y de vanguardia, de la música de cinta al ruido y al <a href="/pulse.roots/es/genres/experimental/idm-intelligent-dance-music/">IDM</a>.',
            '<strong>Fusión.</strong> <a href="/pulse.roots/es/genres/pop-and-rock-fusion/">Pop and rock fusion</a> cubre el pop electrónico, el <a href="/pulse.roots/es/genres/pop-and-rock-fusion/hyperpop/">hyperpop</a> y el rock industrial. <a href="/pulse.roots/es/genres/funk-and-soul-fusion/">Funk and soul fusion</a> conecta el house y el hip hop con el jazz y el soul. <a href="/pulse.roots/es/genres/global-club/">Global club</a> reúne las escenas regionales -el <a href="/pulse.roots/es/genres/house/kwaito/amapiano/">amapiano</a>, el reggaeton, el baile funk, el afrobeats- que hoy circulan globalmente. <a href="/pulse.roots/es/genres/industrial-and-post-industrial/">Industrial and post-industrial</a> es la rama más oscura, de Throbbing Gristle al witch house.',
          ],
        },
        {
          id: 'familia-estilo-subgenero',
          heading: 'Familia, estilo y subgénero',
          standfirst:
            'Una familia es una rama amplia. Un estilo es una escena con nombre dentro de ella. Un subgénero es una variación de esa escena. La misma palabra puede estar en niveles distintos según quién la use.',
          from: 0,
          to: 0,
          paragraphs: [
            'Piensa en el techno. Es una familia con 32 estilos documentados. El <a href="/pulse.roots/es/genres/techno/detroit-techno/">Detroit techno</a> es un estilo dentro de ella, y el ghettotech es un subgénero del Detroit techno. Nada en las palabras "estilo" y "subgénero" obliga a esa jerarquía; es una forma de organizar el árbol para poder recorrerlo en ambos sentidos.',
            'La distinción importa al buscar. Quien busca "techno" quiere la familia. Quien busca <a href="/pulse.roots/es/genres/techno/minimal-techno/">minimal techno</a> o <a href="/pulse.roots/es/genres/techno/acid-techno/">acid techno</a> ya conoce la escena y quiere una página precisa. Por eso cada página de género lleva enlace al padre, lista de subestilos y un conjunto de vecinos.',
          ],
        },
        {
          id: 'confusiones',
          heading: 'Las confusiones que más se repiten',
          standfirst:
            'Cuatro parejas explican casi toda la confusión: EDM frente a música electrónica, house frente a techno, electro frente a electro house, y trance frente a techno.',
          from: 0,
          to: 0,
          paragraphs: [
            '<strong>EDM no es lo mismo que música electrónica.</strong> EDM se convirtió en un paraguas comercial en Estados Unidos hacia 2010 para la música de festival, sobre todo big room y electro house. La música electrónica es un campo de un siglo que incluye ambient, experimental e industrial. Todo tema de EDM es electrónico; la mayor parte de la música electrónica no es EDM. En el árbol, los estilos EDM viven bajo <a href="/pulse.roots/es/genres/house/electro-house/">electro house</a>, big room y <a href="/pulse.roots/es/genres/bass-music/trap-edm/">trap</a>, no en una familia propia.',
            '<strong>House y techno son hermanos, no sinónimos.</strong> Los dos empezaron en Estados Unidos a principios de los ochenta. El house viene de Chicago, con batería con swing, soul y samples de disco, y un tempo de unos 110-128 BPM. El techno viene de Detroit, con un pulso más frío y mecánico, imaginería futurista y un rango más amplio, en torno a 120-140 BPM. El <a href="/pulse.roots/es/genres/house/tech-house/">tech house</a> es el híbrido deliberado.',
            '<strong>Electro no es electro house.</strong> El <a href="/pulse.roots/es/genres/electro/">electro</a> es el sonido del Bronx de principios de los ochenta, construido con cajas de ritmos, vocoders y Kraftwerk. El <a href="/pulse.roots/es/genres/house/electro-house/">electro house</a> es un género de club de los 2000 con un bajo distorsionado y bombo a cuatro tiempos. Comparten una palabra y muy poco más.',
            '<strong>El trance es un género, no una técnica.</strong> El <a href="/pulse.roots/es/genres/trance/">trance</a> es el estilo europeo melódico de 130-145 BPM que se dividió en progresivo, uplifting, hard y <a href="/pulse.roots/es/genres/trance/goa-trance/psytrance/">psytrance</a>. Una pista de techno puede ser hipnótica sin ser trance; la etiqueta describe una escena y una estructura, no solo un efecto.',
          ],
        },
        {
          id: 'como-elegir',
          heading: 'Cómo encontrar el tipo que buscas',
          standfirst:
            'Hay cuatro rutas mejores que recorrer una lista: por función, por tempo, por época o por el artista que ya te gusta.',
          from: 0,
          to: 0,
          paragraphs: [
            'Por función: ¿quieres bailar, concentrarte o desaparecer en el sonido? La pista de baile apunta al techno, el house, el trance y el disco. La concentración apunta al ambient, el drone y lo minimal. Desaparecer apunta a lo experimental y al ruido. Las tarjetas de familia de arriba están ordenadas tanto por esa lógica como por la historia.',
            'Por tempo: el downtempo se queda por debajo de 100 BPM, el house ronda los 110-128, el techno y el trance pasan de 125, el drum and bass va por 170. El tempo es la forma más rápida de acotar una búsqueda, pero no es una definición: dos géneros a 130 BPM pueden no compartir nada más.',
            'Por artista: abre la página de un productor que te guste; el bloque "estilos que comparten artistas clave" enlaza con las escenas de alrededor. Por época: la <a href="/pulse.roots/es/guides/electronic-music-history/">guía de historia</a> ordena cada década, y cada página de género muestra su posición en el árbol.',
          ],
        },
      ],
      faq: [
        {
          q: '¿Cuántos tipos de música electrónica hay?',
          a: 'No hay una cifra oficial. PulseRoots documenta 307 estilos y subestilos en 14 familias, desde la música de cinta y lo experimental hasta el hyperpop, el phonk o el amapiano. Otros catálogos cuentan distinto porque los límites se discuten y cada año aparecen escenas nuevas.',
        },
        {
          q: '¿Cuáles son los principales tipos de música electrónica?',
          a: 'Las familias amplias son techno, house, trance, ambient, bass music, breakbeat, electro, disco, chill-out, experimental, industrial y post-industrial, pop and rock fusion, funk and soul fusion y global club. Cada una se ramifica en estilos y subestilos con sus artistas y pistas de ejemplo.',
        },
        {
          q: '¿El EDM es un tipo de música electrónica?',
          a: 'EDM es un término paraguas popularizado en Estados Unidos hacia 2010 para la música de festival, sobre todo big room y electro house. Es un subconjunto de la música electrónica, no una familia aparte, y no cubre el ambient, lo experimental, lo industrial ni la mayor parte del continuum bass.',
        },
        {
          q: '¿Cuál es la diferencia entre house y techno?',
          a: 'El house viene de Chicago a principios de los ochenta: batería con swing, soul y samples de disco, unos 110-128 BPM. El techno viene de Detroit en la misma época: pulso más frío y mecánico, imaginería futurista, unos 120-140 BPM. El tech house es el híbrido deliberado entre los dos.',
        },
        {
          q: '¿Qué diferencia hay entre un género y un subgénero?',
          a: 'Un género es una familia amplia definida por una escena, un sonido y una época. Un subgénero mantiene los rasgos centrales de su padre pero cambia tempo, textura o público. El Detroit techno es un estilo dentro del techno, y el ghettotech es un subgénero del Detroit techno.',
        },
      ],
    },
  },
];

export function guidesFor(lang) {
  const locale = lang === 'es' ? 'es' : 'en';
  return guides.map(guide => ({
    slug: guide.slug,
    updated: guide.updated,
    ...guide[locale],
  }));
}
