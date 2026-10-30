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
];

export function guidesFor(lang) {
  const locale = lang === 'es' ? 'es' : 'en';
  return guides.map(guide => ({
    slug: guide.slug,
    updated: guide.updated,
    ...guide[locale],
  }));
}
