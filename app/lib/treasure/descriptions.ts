/**
 * Descripciones of the objects of a tesoro (see ADR-0002): short texts of our
 * own, in Spanish and in 5e rules, keyed by the name the tables print. An
 * object whose name has no text yet has no description.
 */
export type Descriptions = Readonly<Partial<Record<string, string>>>;

/** Joins the lines that have a text; with none, there is no description. */
export function joinDescription(
  lines: readonly (string | undefined)[],
): string | undefined {
  const present = lines.filter((line) => line !== undefined);
  return present.length > 0 ? present.join("\n") : undefined;
}

/** Tables 3-6 and 3-7: what each gem and art object looks like. */
export const VALUABLE_DESCRIPTIONS: Descriptions = {
  // Gems
  "Ágata listada": "Piedra opaca con bandas paralelas de pardo, blanco y rojo.",
  "Ágata musgosa": "Piedra translúcida con vetas verdes que parecen musgo atrapado.",
  "Ágata aojada": "Piedra opaca con anillos concéntricos grises y blancos, como un ojo.",
  "Azurita": "Piedra opaca de un azul profundo con motas más oscuras.",
  "Cuarzo azul": "Cristal transparente de un azul pálido.",
  "Hematites": "Piedra gris negruzca de brillo metálico, pesada para su tamaño.",
  "Lapislázuli": "Piedra opaca azul intenso salpicada de motas doradas.",
  "Malaquita": "Piedra opaca con bandas de verdes claros y oscuros.",
  "Obsidiana": "Vidrio volcánico negro y brillante, de bordes afilados.",
  "Rodocrosita": "Piedra opaca rosa claro con bandas blanquecinas.",
  "Ojo de tigre": "Piedra pardo dorada con un reflejo sedoso que se mueve con la luz.",
  "Perla de agua dulce (con irregularidades)": "Perla pequeña y deforme de brillo apagado.",
  "Heliotropo (piedra de sangre)": "Piedra verde oscuro moteada de puntos rojos como gotas de sangre.",
  "Cornalina": "Piedra translúcida de rojo anaranjado.",
  "Calcedonia": "Piedra lechosa de un blanco azulado.",
  "Crisoprasa": "Piedra translúcida de verde manzana.",
  "Iolita": "Cristal violeta azulado que cambia de tono según desde dónde se mire.",
  "Jaspe": "Piedra opaca rojiza, parda o verde, de grano muy fino.",
  "Adularia (piedra de luna)": "Piedra blanca translúcida con un brillo azulado que flota en su interior.",
  "Ónice": "Piedra opaca con bandas negras y blancas.",
  "Peridoto": "Cristal transparente verde oliva.",
  "Cristal de roca (cuarzo transparente)": "Cuarzo incoloro y transparente como el agua.",
  "Sarda": "Piedra translúcida de pardo rojizo.",
  "Sardónice": "Piedra con bandas alternas rojas y blancas.",
  "Cuarzo citrino": "Cristal transparente amarillo dorado.",
  "Cuarzo rosado estrella": "Cuarzo rosado con una estrella de luz blanca en el centro.",
  "Cuarzo ahumado": "Cristal transparente gris pardo, como velado por humo.",
  "Cuarzo rosado": "Cristal translúcido rosa pálido.",
  "Circón": "Cristal transparente de un azul verdoso pálido y mucho brillo.",
  "Ámbar": "Resina fósil dorada y cálida al tacto; a veces guarda un insecto dentro.",
  "Amatista": "Cristal transparente violeta.",
  "Crisoberilo": "Cristal transparente amarillo verdoso.",
  "Coral": "Rama marina pulida de rojo carmesí.",
  "Granate rojo": "Cristal transparente rojo oscuro.",
  "Granate amarillo verdoso": "Cristal transparente de verde amarillento.",
  "Jade": "Piedra translúcida verde, suave y fría al tacto.",
  "Azabache": "Piedra negra muy ligera que se pule hasta brillar como un espejo.",
  "Perla blanca": "Perla redonda de lustre blanco y uniforme.",
  "Perla dorada": "Perla redonda de reflejos dorados.",
  "Perla rosada": "Perla redonda de un rosa suave.",
  "Perla argéntea": "Perla redonda de brillo plateado.",
  "Espinela roja": "Cristal transparente rojo vivo.",
  "Espinela verde intenso": "Cristal transparente de un verde profundo.",
  "Espinela rojo vinoso": "Cristal transparente del color del vino tinto.",
  "Turmalina": "Cristal alargado que pasa del verde al rosa de un extremo a otro.",
  "Alejandrita": "Cristal que es verde a la luz del día y rojo a la de una vela.",
  "Aguamarina": "Cristal transparente azul verdoso, como agua de mar.",
  "Granate violáceo": "Cristal transparente de rojo violáceo.",
  "Perla negra": "Perla redonda negra con reflejos verdosos; muy codiciada.",
  "Espinela azul intenso": "Cristal transparente de un azul profundo.",
  "Topacio amarillo": "Cristal transparente amarillo dorado de mucho brillo.",
  "Esmeralda": "Cristal transparente de un verde intenso.",
  "Ópalo de fuego": "Piedra translúcida naranja con destellos rojos que parecen llamas.",
  "Ópalo blanco": "Piedra lechosa con destellos de todos los colores.",
  "Ópalo negro": "Piedra oscura con destellos verdes, azules y rojos.",
  "Zafiro azul": "Cristal transparente de un azul intenso.",
  "Corindón amarillo intenso": "Cristal transparente de un amarillo encendido.",
  "Corindón violado": "Cristal transparente violeta.",
  "Zafiro negro estrella": "Zafiro negro con una estrella de luz blanca de seis puntas.",
  "Zafiro azul estrella": "Zafiro azul con una estrella de luz blanca de seis puntas.",
  "Rubí estrella": "Rubí rojo intenso con una estrella de luz blanca de seis puntas.",
  "Esmeralda diáfana y de color verde de gran brillo": "Esmeralda sin defectos, limpia como el cristal y de un verde deslumbrante.",
  "Diamante azulado": "Diamante transparente con un tenue tinte azul.",
  "Diamante castaño": "Diamante transparente de un cálido tono castaño.",
  "Diamante rosa": "Diamante transparente de un rosa delicado.",
  "Diamante ambarino": "Diamante transparente de un tono miel.",
  "Diamante hialino": "Diamante incoloro y perfectamente transparente.",
  "Jacinto": "Circón transparente de un rojo anaranjado ardiente.",

  // Art objects
  "Jarra de plata": "Jarra con asa y tapa, de plata algo deslucida.",
  "Estatua de marfil labrado": "Figurilla de un palmo tallada en marfil.",
  "Estatua de hueso labrado": "Figurilla de un palmo tallada en hueso amarillento.",
  "Pequeño brazalete de oro finamente labrado": "Aro de oro fino grabado con motivos vegetales.",
  "Tela con hilo de oro": "Pieza de tela con bordados de hilo de oro que brillan a la luz.",
  "Máscara de terciopelo negro con gran cantidad de cuarzos citrinos": "Antifaz de terciopelo negro cubierto de piedras amarillas.",
  "Cáliz de plata con gemas de lapislázuli": "Copa ceremonial de plata con piedras azules engastadas en el pie.",
  "Tapiz de grandes dimensiones hecho de lana finamente trabajada": "Tapiz de lana que cubre una pared entera; pesado y difícil de transportar.",
  "Taza de cobre con incrustaciones de jade": "Taza de cobre bruñido con piedras verdes incrustadas.",
  "Peine de plata con adularias": "Peine de plata adornado con piedras de luna.",
  "Espada larga de acero con baño de plata y una joya de azabache en la empuñadura": "Espada ceremonial plateada; luce bien, pero no está hecha para combatir.",
  "Arpa tallada en una madera exótica con incrustaciones de marfil y circones": "Arpa de madera oscura y perfumada, con marfil y piedras azules; aún suena.",
  "Ídolo de oro macizo (10 lb.)": "Figura de una deidad o criatura en oro macizo; pesa unas 10 libras.",
  "Peine en forma de dragón, con un ojo de granate rojo": "Peine con forma de dragón enroscado y un granate por ojo.",
  "Tapón de botella de oro y topacio": "Tapón de oro coronado por un topacio tallado.",
  "Daga ceremonial de electro con un rubí estrella en el pomo": "Daga de oro y plata con un rubí estrella en el pomo; de adorno, sin filo.",
  "Parche para el ojo con ojo falso de zafiro y piedra de luna": "Parche con un ojo falso que parece mirar de verdad.",
  "Colgante de ópalo de fuego con cadena de oro fino": "Ópalo de fuego en una cadena de oro fino.",
  "Cuadro antiguo (pintura) de gran calidad": "Pintura de un maestro olvidado, en un marco dorado; se daña con facilidad.",
  "Manto bordado en seda y terciopelo y adornado con numerosas piedras de luna": "Manto de terciopelo con bordados de seda y piedras de luna cosidas.",
  "Colgante de zafiro en una cadena de oro": "Zafiro azul en una cadena de oro.",
  "Guante bordado y enjoyado": "Guante de dama con bordados y pequeñas gemas.",
  "Tobillera con joyas": "Cadena fina de oro con gemas para el tobillo.",
  "Caja de música de oro": "Cajita de oro que toca una melodía antigua al abrirse.",
  "Ceño de oro con cuatro aguamarinas": "Diadema de oro con cuatro aguamarinas.",
  "Collar de pequeñas perlas rosadas": "Collar de varias vueltas de perlas rosadas.",
  "Corona de oro enjoyada": "Corona de oro con gemas engastadas, digna de un monarca.",
  "Anillo de electro con joyas engastadas": "Anillo de oro y plata con varias gemas pequeñas.",
  "Anillo de oro y rubí": "Anillo de oro con un rubí grande.",
  "Copa de oro decorada con esmeraldas": "Copa de oro con esmeraldas incrustadas alrededor del borde.",
};

const DOUBLE =
  "Arma doble: tras atacar con la acción de Atacar, puedes atacar con el otro extremo como acción adicional (sin sumar tu modificador al daño).";
const AMMUNITION =
  "Tras el combate puedes recuperar la mitad de la munición gastada.";
const SHORT_BOW =
  "Arma sencilla a distancia: 1d6 perforante; munición (80/320 pies), a dos manos.";
const LONG_BOW =
  "Arma marcial a distancia: 1d8 perforante; munición (150/600 pies), pesada, a dos manos.";

/** A composite bow: a bow that adds up to `strength` of Fuerza to its damage. */
const composite = (bow: string, strength: number) =>
  strength === 0
    ? `${bow} Compuesto, sin bonificador de Fuerza.`
    : `${bow} Compuesto: suma tu modificador de Fuerza al daño, hasta +${strength}.`;

const STUDDED_LEATHER = "Armadura ligera: CA 12 + Destreza.";
const HALF_PLATE =
  "Armadura intermedia: CA 15 + Destreza (máx. 2); desventaja en Sigilo.";
const FULL_PLATE =
  "Armadura pesada: CA 18; requiere Fuerza 15; desventaja en Sigilo.";
const BUCKLER =
  "Escudo: +1 a la CA; va sujeto al antebrazo y deja la mano libre para sostener objetos.";
const LIGHT_SHIELD = "Escudo: +2 a la CA.";
const HEAVY_SHIELD = "Escudo: +2 a la CA; más pesado y robusto que uno ligero.";

/**
 * Table 3-8 and the bases of the magic gear (tables 7-3, 7-4 and 7-11 to
 * 7-13): alchemical items, tools, weapons, armor and shields.
 */
export const MUNDANE_DESCRIPTIONS: Descriptions = {
  // Alchemical items
  "Fuego de alquimista": "Vial que se lanza (20 pies): al impactar, el objetivo arde y recibe 1d4 de fuego al inicio de cada turno hasta que use una acción y supere una prueba de Destreza CD 10.",
  "Ácido": "Vial que se lanza (20 pies) o se vierte sobre una criatura a 5 pies: 2d6 de ácido.",
  "Ahumadera": "Al encenderla con una acción llena un cubo de 10 pies de humo espeso que oscurece totalmente la zona durante 1 minuto o hasta que el viento lo disperse.",
  "Agua bendita": "Vial que se lanza (20 pies) o se vierte sobre una criatura a 5 pies: 2d6 radiante a infernales y muertos vivientes.",
  "Contraveneno": "Al beberlo tienes ventaja en las salvaciones contra veneno durante 1 hora.",
  "Antorcha siempreardiente": "Antorcha con una llama mágica que nunca se apaga ni quema: luz brillante en 20 pies y tenue en otros 20.",
  "Bolsas de maraña": "Se lanza (20 pies): al impactar, una criatura Grande o menor queda apresada hasta que use una acción y supere una prueba de Fuerza CD 12.",
  "Piedras de trueno": "Se lanza (60 pies) y estalla: cada criatura a 10 pies del impacto debe superar una salvación de Constitución CD 13 o queda ensordecida durante 1 minuto.",

  // Tools
  "Mochila, vacía": "Mochila de cuero con capacidad para 30 libras de equipo.",
  "Palanqueta": "Ventaja en las pruebas de Fuerza en las que la palanca ayude, como forzar puertas o cofres.",
  "Linterna de ojo de buey": "Proyecta luz brillante en un cono de 60 pies y tenue en otros 60; arde 6 horas con un frasco de aceite.",
  "Cerradura sencilla": "Abrirla sin llave requiere una prueba de Destreza con herramientas de ladrón CD 10.",
  "Cerradura corriente": "Abrirla sin llave requiere una prueba de Destreza con herramientas de ladrón CD 15.",
  "Cerradura de calidad": "Abrirla sin llave requiere una prueba de Destreza con herramientas de ladrón CD 20.",
  "Cerradura superior": "Abrirla sin llave requiere una prueba de Destreza con herramientas de ladrón CD 25.",
  "Grilletes de gran calidad": "Sujetan a una criatura Pequeña o Mediana; escapar requiere Destreza CD 25 y romperlos, Fuerza CD 25.",
  "Espejito de acero pulido": "Espejo de mano; sirve para mirar tras las esquinas o hacer señales con el sol.",
  "Cuerda de seda (50')": "50 pies de cuerda ligera y resistente; romperla requiere Fuerza CD 17.",
  "Catalejo": "Los objetos que miras a través de él se ven al doble de tamaño.",
  "Herramientas de gran calidad para artesano": "Herramientas de un oficio a elegir, de factura excepcional; con competencia, sumas tu bonificador a las pruebas de ese oficio.",
  "Material de escalada": "Pitones, guantes y arnés: con una acción te anclas y no puedes caer más de 25 pies desde ese punto.",
  "Material de disfraz": "Cosméticos, tintes y atrezo; con competencia, sumas tu bonificador a las pruebas para disfrazarte.",
  "Material de curandero": "Vendas y ungüentos para 10 usos: con una acción estabilizas a una criatura a 0 PG sin necesidad de prueba.",
  "Símbolo sagrado de plata": "Sirve de canalizador para los conjuros de clérigo y paladín.",
  "Reloj de arena": "Mide con precisión el paso de una hora.",
  "Lupa": "Ventaja en las pruebas para examinar objetos pequeños o detallados; con sol directo enciende fuego.",
  "Instrumento musical de gran calidad": "Instrumento a elegir, de factura excepcional; sirve de canalizador para los conjuros de bardo.",
  "Herramientas de ladrón de gran calidad": "Ganzúas, limas y espejito de factura excepcional; con competencia, sumas tu bonificador a abrir cerraduras y desactivar trampas.",

  // Melee weapons (table 7-11)
  "Bastón": `Arma sencilla: 1d6 contundente; versátil (1d8). ${DOUBLE}`,
  "Cimitarra": "Arma marcial: 1d6 cortante; ligera, sutil.",
  "Daga": "Arma sencilla: 1d4 perforante; ligera, sutil, arrojadiza (20/60 pies).",
  "Espada bastarda": "Arma marcial: 1d10 cortante; versátil (1d12).",
  "Espada corta": "Arma marcial: 1d6 perforante; ligera, sutil.",
  "Espada larga": "Arma marcial: 1d8 cortante; versátil (1d10).",
  "Espadón": "Arma marcial: 2d6 cortante; pesada, a dos manos.",
  "Estoque": "Arma marcial: 1d8 perforante; sutil.",
  "Gran hacha": "Arma marcial: 1d12 cortante; pesada, a dos manos.",
  "Hacha de guerra enana": "Arma marcial: 1d10 cortante; versátil (1d12).",
  "Kama": "Arma sencilla: 1d6 cortante; ligera.",
  "Lanza corta": "Arma sencilla: 1d6 perforante; arrojadiza (20/60 pies), versátil (1d8).",
  "Maza ligera": "Arma sencilla: 1d6 contundente.",
  "Maza pesada": "Arma marcial: 1d8 contundente.",
  "Nunchaku": "Arma sencilla: 1d6 contundente; ligera, sutil.",
  "Siangham": "Arma sencilla: 1d6 perforante; ligera, sutil.",

  // Uncommon weapons (table 7-12)
  "Alabarda": "Arma marcial: 1d10 cortante; pesada, alcance, a dos manos.",
  "Alfanjón": "Arma marcial: 2d4 cortante; pesada, a dos manos.",
  "Ballesta de mano": "Arma marcial a distancia: 1d6 perforante; munición (30/120 pies), ligera, recarga.",
  "Ballesta de repetición": "Arma marcial a distancia: 1d8 perforante; munición (80/320 pies), a dos manos; cargador de 5 virotes, sin recarga.",
  "Bisarma": "Arma marcial: 1d10 cortante; pesada, alcance, a dos manos.",
  "Cachiporra": "Arma sencilla: 1d4 contundente; ligera. Pensada para dejar inconsciente en lugar de matar.",
  "Cadena armada": "Arma marcial: 2d4 perforante; pesada, alcance, a dos manos.",
  "Clava": "Arma sencilla: 1d4 contundente; ligera.",
  "Espada de dos hojas": `Arma marcial: 1d8 cortante; a dos manos. ${DOUBLE}`,
  "Gran clava": "Arma sencilla: 1d8 contundente; a dos manos.",
  "Guadaña": "Arma marcial: 2d4 cortante; pesada, a dos manos.",
  "Guantelete": "Tus golpes sin armas con él infligen 1d4 contundente.",
  "Guantelete armado": "Arma sencilla: 1d4 perforante; ligera.",
  "Guja": "Arma marcial: 1d10 cortante; pesada, alcance, a dos manos.",
  "Hacha de batalla": "Arma marcial: 1d8 cortante; versátil (1d10).",
  "Hacha de mano": "Arma sencilla: 1d6 cortante; ligera, arrojadiza (20/60 pies).",
  "Hacha doble orca": `Arma marcial: 1d8 cortante; pesada, a dos manos. ${DOUBLE}`,
  "Hoz": "Arma sencilla: 1d4 cortante; ligera.",
  "Kukri": "Arma marcial: 1d4 cortante; ligera, sutil.",
  "Lanza larga": "Arma marcial: 1d10 perforante; pesada, alcance, a dos manos.",
  "Lanza ligera de caballería": "Arma marcial: 1d10 perforante; alcance. Desventaja contra objetivos a 5 pies; a dos manos si no vas montado.",
  "Lanza pesada de caballería": "Arma marcial: 1d12 perforante; alcance. Desventaja contra objetivos a 5 pies; a dos manos si no vas montado.",
  "Látigo": "Arma marcial: 1d4 cortante; sutil, alcance.",
  "Mangual doble": `Arma marcial: 1d8 contundente; pesada, a dos manos. ${DOUBLE}`,
  "Mangual ligero": "Arma marcial: 1d6 contundente.",
  "Mangual pesado": "Arma marcial: 1d10 contundente; pesada, a dos manos.",
  "Martillo de guerra": "Arma marcial: 1d8 contundente; versátil (1d10).",
  "Martillo ganchudo gnomo": `Arma marcial: 1d6 contundente (martillo) o 1d4 perforante (gancho); a dos manos. ${DOUBLE}`,
  "Martillo ligero": "Arma sencilla: 1d4 contundente; ligera, arrojadiza (20/60 pies).",
  "Maza de armas": "Arma marcial: 1d8 perforante.",
  "Media lanza": "Arma sencilla: 1d6 perforante; arrojadiza (20/60 pies), versátil (1d8).",
  "Pico ligero": "Arma marcial: 1d6 perforante; ligera.",
  "Pico pesado": "Arma marcial: 1d8 perforante.",
  "Puñal": "Arma sencilla: 1d4 perforante; ligera.",
  "Red": "Arma marcial a distancia: arrojadiza (5/15 pies). Una criatura Grande o menor alcanzada queda apresada hasta liberarse con una prueba de Fuerza CD 10 o hasta que alguien corte la red (CA 10, 5 PG).",
  "Ronca": "Arma marcial: 2d4 perforante; alcance, a dos manos.",
  "Shuriken": "Arma marcial a distancia: 1d4 perforante; sutil, arrojadiza (20/60 pies).",
  "Tridente": "Arma marcial: 1d6 perforante; arrojadiza (20/60 pies), versátil (1d8).",
  "Urgrosh enano": `Arma marcial: 1d8 cortante (hacha) o 1d6 perforante (lanza); a dos manos. ${DOUBLE}`,

  // Ranged weapons and ammunition (table 7-13)
  "Flechas (50)": `Munición para arcos cortos y largos. ${AMMUNITION}`,
  "Virotes de ballesta (50)": `Munición para ballestas. ${AMMUNITION}`,
  "Balas de honda (50)": `Munición para hondas. ${AMMUNITION}`,
  "Hacha arrojadiza": "Arma sencilla: 1d6 cortante; ligera, arrojadiza (20/60 pies).",
  "Ballesta pesada": "Arma marcial a distancia: 1d10 perforante; munición (100/400 pies), pesada, recarga, a dos manos.",
  "Ballesta ligera": "Arma sencilla a distancia: 1d8 perforante; munición (80/320 pies), recarga, a dos manos.",
  "Dardos (50)": "Arma sencilla a distancia: 1d4 perforante; sutil, arrojadiza (20/60 pies).",
  "Jabalina": "Arma sencilla: 1d6 perforante; arrojadiza (30/120 pies).",
  "Arco corto": SHORT_BOW,
  "Arco corto compuesto (bonificador Fue +0)": composite(SHORT_BOW, 0),
  "Arco corto compuesto (bonificador Fue +1)": composite(SHORT_BOW, 1),
  "Arco corto compuesto (bonificador Fue +2)": composite(SHORT_BOW, 2),
  "Honda": "Arma sencilla a distancia: 1d4 contundente; munición (30/120 pies).",
  "Arco largo": LONG_BOW,
  "Arco largo compuesto": composite(LONG_BOW, 0),
  "Arco largo compuesto (bonificador Fue +1)": composite(LONG_BOW, 1),
  "Arco largo compuesto (bonificador Fue +2)": composite(LONG_BOW, 2),
  "Arco largo compuesto (bonificador Fue +3)": composite(LONG_BOW, 3),
  "Arco largo compuesto (bonificador Fue +4)": composite(LONG_BOW, 4),

  // Armor (tables 3-8 and 7-3)
  "Acolchada": "Armadura ligera: CA 11 + Destreza; desventaja en Sigilo.",
  "Cuero": "Armadura ligera: CA 11 + Destreza.",
  "Cuero tachonado": STUDDED_LEATHER,
  "Armadura de cuero tachonado": STUDDED_LEATHER,
  "Camisote de mallas": "Armadura intermedia: CA 13 + Destreza (máx. 2).",
  "Pieles": "Armadura intermedia: CA 12 + Destreza (máx. 2).",
  "Cota de escamas": "Armadura intermedia: CA 14 + Destreza (máx. 2); desventaja en Sigilo.",
  "Cota de mallas": "Armadura pesada: CA 16; requiere Fuerza 13; desventaja en Sigilo.",
  "Coraza": "Armadura intermedia: CA 14 + Destreza (máx. 2).",
  "Laminada": "Armadura pesada: CA 17; requiere Fuerza 15; desventaja en Sigilo.",
  "Cota de bandas": "Armadura pesada: CA 17; requiere Fuerza 15; desventaja en Sigilo.",
  "Placas y mallas": HALF_PLATE,
  "Armadura de placas y mallas": HALF_PLATE,
  "Completa": FULL_PLATE,
  "Armadura completa": FULL_PLATE,

  // Shields (tables 3-8 and 7-4)
  "Broquel": BUCKLER,
  "Broquel o rodela": BUCKLER,
  "Broquel de maderaoscura": `${BUCKLER} De maderaoscura: pesa la mitad.`,
  "Escudo de maderaoscura": `${LIGHT_SHIELD} De maderaoscura: pesa la mitad.`,
  "Escudo ligero de madera": LIGHT_SHIELD,
  "Escudo ligero de acero": LIGHT_SHIELD,
  "Escudo pesado de madera": HEAVY_SHIELD,
  "Escudo pesado de acero": HEAVY_SHIELD,
  "Escudo pavés": "Escudo: +2 a la CA; requiere Fuerza 15 y da desventaja en Sigilo. Con una acción puedes plantarlo y tener media cobertura hasta que te muevas.",
};

const MASTERWORK_SUFFIX = " de gran calidad";
const MASTERWORK =
  "De gran calidad: factura excepcional; vale más, pero no da bonificador.";

/**
 * Description of an object of table 3-8. A weapon, armor or shield "de gran
 * calidad" is described as its base plus a masterwork line.
 */
export function describeMundane(name: string): string | undefined {
  const exact = MUNDANE_DESCRIPTIONS[name];
  if (exact !== undefined || !name.endsWith(MASTERWORK_SUFFIX)) return exact;
  const base = MUNDANE_DESCRIPTIONS[name.slice(0, -MASTERWORK_SUFFIX.length)];
  return base && `${base}\n${MASTERWORK}`;
}

/** Tables 7-14 and 7-15, keyed by the feminine name the book prints. */
export const WEAPON_ABILITY_DESCRIPTIONS: Descriptions = {
  "Azote": "Contra un tipo de criatura que elige el DM: +2 adicional a las tiradas de ataque y de daño, y 2d6 de daño adicional.",
  "Defensora": "Al inicio de tu turno puedes pasar parte o todo su bonificador mágico a tu CA hasta tu siguiente turno; lo que pasas deja de sumarse al ataque y al daño.",
  "Flamígera": "Con una acción adicional se envuelve en llamas: +1d6 de fuego al impactar.",
  "Congeladora": "Con una acción adicional se cubre de escarcha: +1d6 de frío al impactar.",
  "Electrizante": "Con una acción adicional chisporrotea: +1d6 de relámpago al impactar.",
  "Fantasmal": "Daña con normalidad a las criaturas incorpóreas (ignora su resistencia) y puede golpear a las que están en el Plano Etéreo.",
  "Afilada": "Logra un golpe crítico con un 19 o un 20.",
  "Canalizadora de ki": "Cuenta como arma de monje, y puedes usar tus rasgos de ki (como Golpe aturdidor) a través de ella.",
  "Compasiva": "+1d6 de daño, pero deja inconsciente en lugar de matar. Se puede desactivar con una acción adicional.",
  "Hendiente": "Una vez por turno, cuando reduces a una criatura a 0 PG con ella, puedes atacar a otra criatura a tu alcance como parte de la misma acción.",
  "Almacenaconjuros": "Guarda un conjuro de nivel 3 o inferior que se lance sobre ella; al impactar puedes liberarlo sobre el objetivo.",
  "Arrojadiza": "Gana la propiedad arrojadiza (20/60 pies).",
  "Tronante": "En un golpe crítico inflige 2d8 de trueno adicional, y el objetivo debe superar una salvación de Constitución CD 14 o queda ensordecido durante 1 minuto.",
  "Viciosa": "Al impactar inflige 2d6 de daño necrótico adicional al objetivo, pero tú recibes 1d6 de daño necrótico.",
  "Anárquica": "Contra criaturas legales inflige 2d6 de daño adicional. Una criatura legal que la empuñe tiene desventaja en las tiradas de ataque con ella.",
  "Axiomática": "Contra criaturas caóticas inflige 2d6 de daño adicional. Una criatura caótica que la empuñe tiene desventaja en las tiradas de ataque con ella.",
  "Disruptora": "Un muerto viviente al que impacta debe superar una salvación de Sabiduría CD 14 o queda destruido.",
  "Explosiva ígnea": "Con una acción adicional se envuelve en llamas: +1d6 de fuego al impactar, y 1d10 de fuego más en un golpe crítico.",
  "Explosiva gélida": "Con una acción adicional se cubre de escarcha: +1d6 de frío al impactar, y 1d10 de frío más en un golpe crítico.",
  "Explosiva eléctrica": "Con una acción adicional chisporrotea: +1d6 de relámpago al impactar, y 1d10 de relámpago más en un golpe crítico.",
  "Sagrada": "Contra criaturas malignas inflige 2d6 de daño radiante adicional. Una criatura maligna que la empuñe tiene desventaja en las tiradas de ataque con ella.",
  "Sacrílega": "Contra criaturas buenas inflige 2d6 de daño necrótico adicional. Una criatura buena que la empuñe tiene desventaja en las tiradas de ataque con ella.",
  "Hiriente": "Una vez por turno, al impactar abre una herida: el objetivo pierde 1d4 PG al inicio de cada uno de sus turnos hasta que reciba curación mágica o alguien supere una prueba de Sabiduría (Medicina) CD 15.",
  "Veloz": "Cuando realizas la acción de Atacar, puedes hacer un ataque más con ella como acción adicional.",
  "Radiante": "Hecha de energía luminosa: sus ataques ignoran la CA que dan la armadura y el escudo, y emite luz brillante en 20 pies. No afecta a constructos, muertos vivientes ni objetos.",
  "Danzante": "Con una acción adicional la sueltas y flota a tu lado: durante 4 turnos ataca sola una vez por turno con tu bonificador, y luego vuelve a tu mano.",
  "Vorpalina": "Ignora la resistencia al daño cortante. Con un 20 natural decapita al objetivo; si puede vivir sin cabeza o no la tiene, recibe 6d8 de daño cortante adicional.",
  "Distante": "Duplica el alcance normal y largo del arma.",
  "Retornante": "Tras lanzarla, vuelve volando a tu mano justo después del ataque.",
  "Buscadora": "No tienes desventaja al atacar a un objetivo que no ves si sabes dónde está, y la media cobertura no lo protege.",
};

/** The bonus line of a magic weapon, and of a magic armor or shield. */
export const weaponBonus = (n: number) =>
  `+${n} a las tiradas de ataque y de daño.`;
export const armorBonus = (n: number) => `+${n} a la CA.`;

/** Damage type in 5e of each energy of the resistance abilities. */
const RESISTANCES = [
  ["Resistente al ácido", "ácido"],
  ["Resistente al frío", "frío"],
  ["Resistente a la electricidad", "relámpago"],
  ["Resistente al fuego", "fuego"],
  ["Resistente al sonido", "trueno"],
] as const;

/**
 * Tables 7-5 and 7-6, keyed by the feminine name the book prints; armor and
 * shields share the abilities that both tables list.
 */
export const ARMOR_ABILITY_DESCRIPTIONS: Descriptions = {
  "Ilusoria": "Con una acción adicional cambia de aspecto y parece ropa normal u otra armadura; conserva todas sus propiedades.",
  "Fortificante leve": "Cuando recibes un golpe crítico, tira 1d4: con un 1 se convierte en un impacto normal.",
  "Fortificante moderada": "Cuando recibes un golpe crítico, tira 1d4: con 1–3 se convierte en un impacto normal.",
  "Fortificante intensa": "Los golpes críticos contra ti se convierten en impactos normales.",
  "Resbaladiza": "Ventaja en las pruebas para escapar de un agarre o de ataduras.",
  "Resbaladiza, mejorada": "Ventaja en las pruebas para escapar de un agarre o de ataduras, y en las salvaciones contra quedar apresado.",
  "Resbaladiza, mayor": "No puedes quedar agarrado por medios no mágicos, y tienes ventaja en las salvaciones contra quedar apresado.",
  "De las sombras": "+2 a las pruebas de Destreza (Sigilo) para esconderte.",
  "De las sombras, mejorada": "+5 a las pruebas de Destreza (Sigilo) para esconderte.",
  "De las sombras, mayor": "Ventaja en las pruebas de Destreza (Sigilo) para esconderte.",
  "Silenciosa": "No da desventaja en Sigilo y suma +2 a las pruebas de Destreza (Sigilo) para moverte sin ruido.",
  "Silenciosa, mejorada": "No da desventaja en Sigilo y suma +5 a las pruebas de Destreza (Sigilo) para moverte sin ruido.",
  "Silenciosa, mayor": "No da desventaja en Sigilo y te da ventaja en las pruebas de Destreza (Sigilo) para moverte sin ruido.",
  "Resistente a conjuros (13)": "+1 a las salvaciones contra conjuros.",
  "Resistente a conjuros (15)": "+2 a las salvaciones contra conjuros.",
  "Resistente a conjuros (17)": "+3 a las salvaciones contra conjuros.",
  "Resistente a conjuros (19)": "Ventaja en las salvaciones contra conjuros.",
  ...Object.fromEntries(
    RESISTANCES.flatMap(([name, damage]) => [
      [name, `Reduce en 5 el daño de ${damage} que recibes.`],
      [`${name}, mejorada`, `Resistencia al daño de ${damage}.`],
      [`${name}, mayor`, `Inmunidad al daño de ${damage}.`],
    ]),
  ),
  "Fantasmal": "Tienes resistencia al daño de los ataques de criaturas incorpóreas, y una criatura incorpórea puede llevarla puesta.",
  "De invulnerabilidad": "Resistencia al daño contundente, cortante y perforante de ataques no mágicos.",
  "Salvaje": "Sigue dándote su bonificador mágico a la CA cuando adoptas una forma salvaje o te transformas.",
  "De etereidad": "Una vez al día, con una acción, pasas al Plano Etéreo durante hasta 10 minutos, como con el conjuro excursión etérea.",
  "De controlar muertos vivientes": "Una vez al día, con una acción, un muerto viviente que veas a 60 pies debe superar una salvación de Sabiduría CD 17 o queda bajo tu control durante 1 hora.",
  "Atrapaflechas": "+1 a la CA contra ataques a distancia, y los ataques a distancia contra criaturas a 5 pies de ti te tienen a ti como objetivo.",
  "Golpeadora": "Puedes atacar con el escudo como arma: 1d6 contundente, sumando su bonificador mágico a ataque y daño.",
  "Cegadora": "Una vez al día, con una acción, destella: cada otra criatura a 20 pies debe superar una salvación de Constitución CD 14 o queda cegada durante 1 minuto (repite la salvación al final de cada uno de sus turnos).",
  "Desviaflechas": "Una vez por turno, cuando te impacta un ataque a distancia con arma, puedes usar tu reacción para desviarlo y que falle.",
  "Animada": "Con una acción adicional flota a tu lado y te protege sin ocupar tu mano durante 1 minuto o hasta que vuelvas a tomarlo.",
  "Reflectante": "Una vez al día, cuando un conjuro te tiene como único objetivo, puedes usar tu reacción para devolvérselo a su lanzador.",
};

const base = (name: string) => MUNDANE_DESCRIPTIONS[name];
const ADAMANTINE_WEAPON =
  "Adamantina: cualquier impacto contra un objeto es un golpe crítico.";

/** A luck blade with the wishes left in it. */
const luckBlade = (wishes: number) =>
  joinDescription([
    base("Espada corta"),
    weaponBonus(2),
    "+1 a todas tus salvaciones. Una vez al día puedes repetir una tirada de ataque, prueba o salvación y quedarte con el nuevo resultado.",
    wishes === 0
      ? "No le quedan deseos."
      : `Guarda ${wishes} ${wishes === 1 ? "deseo" : "deseos"}: con una acción lanzas el conjuro deseo; no se recargan.`,
  ]);

/**
 * Tables 7-16 ("Armas específicas"), 7-7 ("Armaduras específicas") and 7-8
 * ("Escudos específicos"): the object as a whole, base included.
 */
export const SPECIFIC_DESCRIPTIONS: Descriptions = {
  // Specific weapons (table 7-16)
  "Flecha adormecedora": joinDescription([
    "Una sola flecha +1; se gasta al impactar.",
    "El objetivo debe superar una salvación de Sabiduría CD 11 o cae dormido durante 1 minuto o hasta que reciba daño.",
  ]),
  "Virote aullante": joinDescription([
    "Un solo virote +2; se gasta al dispararlo.",
    "Chilla en vuelo: cada enemigo a 20 pies de su trayectoria debe superar una salvación de Sabiduría CD 14 o queda asustado hasta el final de su siguiente turno.",
  ]),
  "Daga de plata de gran calidad": joinDescription([
    base("Daga"),
    "De plata: supera la resistencia de licántropos y otras criaturas al daño de armas no plateadas.",
  ]),
  "Espada larga de hierro frío de gran calidad": joinDescription([
    base("Espada larga"),
    "De hierro frío: supera la resistencia de feéricos y demonios al daño de armas no mágicas.",
  ]),
  "Jabalina del relámpago": joinDescription([
    base("Jabalina"),
    "Un solo uso: al lanzarla se convierte en un relámpago de 5 pies de ancho hasta el objetivo. Cada criatura en la línea debe superar una salvación de Destreza CD 13 o recibe 4d6 de relámpago (la mitad si la supera); si impactas, el objetivo recibe además el daño de la jabalina y 4d6 de relámpago.",
  ]),
  "Flecha asesina": joinDescription([
    "Una sola flecha +1 contra un tipo de criatura que elige el DM; se gasta al impactar.",
    "Si impacta a una criatura de ese tipo, esta debe superar una salvación de Constitución CD 17 o recibe 6d10 de daño perforante adicional (la mitad si la supera).",
  ]),
  "Flecha asesina (mayor)": joinDescription([
    "Una sola flecha +1 contra un tipo de criatura que elige el DM; se gasta al impactar.",
    "Si impacta a una criatura de ese tipo, esta debe superar una salvación de Constitución CD 19 o recibe 10d10 de daño perforante adicional (la mitad si la supera).",
  ]),
  "Daga adamantina": joinDescription([base("Daga"), ADAMANTINE_WEAPON]),
  "Hacha de batalla adamantina": joinDescription([
    base("Hacha de batalla"),
    ADAMANTINE_WEAPON,
  ]),
  "Rompedora": joinDescription([
    base("Espada larga"),
    weaponBonus(1),
    "Ventaja en los ataques para romper armas, escudos u otros objetos; sus impactos contra objetos son golpes críticos.",
  ]),
  "Daga de ponzoña": joinDescription([
    base("Daga"),
    weaponBonus(1),
    "Una vez al día, con una acción, la hoja rezuma veneno durante 1 minuto: el siguiente impacto obliga a superar una salvación de Constitución CD 15 o el objetivo recibe 2d10 de veneno y queda envenenado durante 1 minuto.",
  ]),
  "Tridente avisador": joinDescription([
    base("Tridente"),
    weaponBonus(2),
    "Te avisa de las criaturas hostiles bajo el agua a menos de 680 pies: no pueden sorprenderte.",
  ]),
  "Daga del asesino": joinDescription([
    base("Daga"),
    weaponBonus(2),
    "Tu Ataque furtivo con ella inflige 1d6 de daño adicional.",
  ]),
  "Tormento de cambiantes": joinDescription([
    base("Espada de dos hojas"),
    "+1 a las tiradas de ataque y de daño con cada hoja.",
    "Contra cambiaformas inflige 2d6 de daño adicional, y uno al que impacta debe superar una salvación de Sabiduría CD 15 o recupera su forma verdadera.",
  ]),
  "Tridente de comandar peces": joinDescription([
    base("Tridente"),
    weaponBonus(1),
    "Tres cargas al día: con una acción gastas una y lanzas dominar bestia (CD 15) sobre una bestia con velocidad nadando.",
  ]),
  "Lengua flamígera": joinDescription([
    base("Espada larga"),
    weaponBonus(1),
    "Con una acción adicional se envuelve en llamas: +2d6 de fuego al impactar, luz brillante en 40 pies y tenue en otros 40.",
  ]),
  "Hoja de la suerte (0 deseos)": luckBlade(0),
  "Hoja de la suerte (1 deseo)": luckBlade(1),
  "Hoja de la suerte (2 deseos)": luckBlade(2),
  "Hoja de la suerte (3 deseos)": luckBlade(3),
  "Espada de sutileza": joinDescription([
    base("Espada corta"),
    weaponBonus(1),
    "Cuando haces un Ataque furtivo con ella, +2 adicional a la tirada de ataque y de daño.",
  ]),
  "Espada de los Planos": joinDescription([
    base("Espada larga"),
    weaponBonus(1),
    "Contra elementales, celestiales, infernales y otros extraplanares, el bonificador es +3.",
  ]),
  "Robadora de nueve vidas": joinDescription([
    base("Espada larga"),
    weaponBonus(2),
    "Tiene 1d8 + 1 cargas. Con un golpe crítico contra una criatura de menos de 100 PG, esta debe superar una salvación de Constitución CD 15 o muere, y se gasta una carga. Sin cargas, queda como espada +2.",
  ]),
  "Espada arrebatavidas": joinDescription([
    base("Espada larga"),
    weaponBonus(2),
    "Con un golpe crítico contra una criatura que no sea constructo ni muerto viviente, inflige 10 de daño necrótico adicional y ganas 10 PG temporales.",
  ]),
  "Arco juramentado": joinDescription([
    base("Arco largo compuesto (bonificador Fue +2)"),
    weaponBonus(2),
    "Una vez al día, al disparar, puedes jurar muerte a un objetivo: hasta que muera o pasen 7 días, tienes ventaja contra él y le infliges 3d6 de daño perforante adicional; mientras, tienes desventaja con otras armas.",
  ]),
  "Maza del terror": joinDescription([
    base("Maza pesada"),
    weaponBonus(2),
    "Tres cargas al día: con una acción gastas una y cada criatura a 30 pies que elijas debe superar una salvación de Sabiduría CD 15 o queda asustada de ti durante 1 minuto.",
  ]),
  "Bebedora de vidas": joinDescription([
    base("Gran hacha"),
    weaponBonus(1),
    "Al impactar, el objetivo debe superar una salvación de Constitución CD 16 o su máximo de PG se reduce en 2d6 hasta un descanso largo. Cada vez que mata a alguien, tú también pierdes 1d6 de tu máximo de PG hasta un descanso largo.",
  ]),
  "Cimitarra de los bosques": joinDescription([
    base("Cimitarra"),
    weaponBonus(3),
    "Al aire libre en un bosque inflige 1d6 de daño cortante adicional.",
  ]),
  "Estoque punzante": joinDescription([
    base("Estoque"),
    weaponBonus(2),
    `Hiriente: ${WEAPON_ABILITY_DESCRIPTIONS["Hiriente"]}`,
  ]),
  "Hoja solar": joinDescription([
    base("Espada bastarda"),
    weaponBonus(2),
    "Su hoja es de luz: inflige daño radiante en vez de cortante, y 1d8 radiante adicional a los muertos vivientes. Con una acción adicional emite luz solar brillante en 15 pies y tenue en otros 15.",
  ]),
  "Hierro de escarcha": joinDescription([
    base("Espadón"),
    weaponBonus(3),
    "+1d6 de frío al impactar. Te da resistencia al fuego y, con una acción, apaga las llamas no mágicas a 30 pies.",
  ]),
  "Martillo arrojadizo de los enanos": joinDescription([
    base("Martillo de guerra"),
    weaponBonus(2),
    "En manos de un enano gana arrojadiza (20/60 pies), inflige 1d8 de daño adicional al lanzarlo (2d8 contra gigantes) y vuelve a su mano tras el ataque.",
  ]),
  "Maza del castigo": joinDescription([
    base("Maza pesada"),
    weaponBonus(3),
    "Contra constructos el bonificador es +5, y con un 20 natural un constructo de 25 PG o menos queda destruido.",
  ]),
  "Vengadora sagrada": joinDescription([
    base("Espada larga"),
    weaponBonus(2),
    "En manos de un paladín es +3, inflige 2d10 de daño radiante adicional a infernales y muertos vivientes, y da a los aliados a 10 pies del paladín ventaja en las salvaciones contra conjuros.",
  ]),

  // Specific armor (table 7-7)
  "Camisote de mallas de mithril": joinDescription([
    base("Camisote de mallas"),
    "De mithril: cuenta como armadura ligera y no da desventaja en Sigilo.",
  ]),
  "Armadura completa de piel de dragón": joinDescription([
    base("Armadura completa"),
    "De piel de dragón: no lleva metal, así que los druidas pueden usarla.",
  ]),
  "Cota de mallas élfica": joinDescription([
    base("Camisote de mallas"),
    armorBonus(1),
    "Cualquiera puede llevarla como si tuviera competencia, y no da desventaja en Sigilo.",
  ]),
  "Armadura de piel de rinoceronte": joinDescription([
    base("Pieles"),
    armorBonus(2),
    "Si te mueves al menos 20 pies en línea recta antes de atacar cuerpo a cuerpo, ese ataque inflige 2d6 de daño adicional.",
  ]),
  "Coraza adamantina": joinDescription([
    base("Coraza"),
    "Adamantina: los golpes críticos contra ti se convierten en impactos normales.",
  ]),
  "Armadura completa enana": joinDescription([
    base("Armadura completa"),
    armorBonus(2),
    "Cuando un efecto te desplaza contra tu voluntad, puedes usar tu reacción para reducir la distancia hasta en 10 pies.",
  ]),
  "Cota de bandas de la suerte": joinDescription([
    base("Cota de bandas"),
    armorBonus(3),
    "Una vez por semana, cuando te impacta un ataque, puedes obligar a repetir la tirada.",
  ]),
  "Armadura celestial": joinDescription([
    base("Cota de mallas"),
    armorBonus(3),
    "Dorada y ligera: no da desventaja en Sigilo ni pide Fuerza. Una vez al día, con una acción, lanzas volar sobre ti mismo.",
  ]),
  "Armadura completa de las profundidades": joinDescription([
    base("Armadura completa"),
    armorBonus(1),
    "Puedes respirar bajo el agua, tienes velocidad nadando igual a la de andar y puedes hablar con las criaturas acuáticas.",
  ]),
  "Coraza de mando": joinDescription([
    base("Coraza"),
    armorBonus(2),
    "Ventaja en las pruebas de Carisma (Persuasión e Intimidación). Los aliados a 30 pies que te vean tienen ventaja en las salvaciones contra quedar asustados.",
  ]),
  "Armadura completa veloz de mithril": joinDescription([
    base("Armadura completa"),
    armorBonus(1),
    "De mithril: no pide Fuerza ni da desventaja en Sigilo. Una vez al día, con una acción adicional, te afecta acelerar durante 1 minuto (sin concentración).",
  ]),
  "Armadura demoníaca": joinDescription([
    base("Armadura completa"),
    armorBonus(4),
    "Sus guanteletes son garras: tus golpes sin armas infligen 1d10 cortante. Maldita: no puedes quitártela sin un conjuro de levantar maldición, y tienes desventaja en los ataques contra demonios.",
  ]),

  // Specific shields (table 7-8)
  "Broquel de maderaoscura": base("Broquel de maderaoscura"),
  "Escudo de maderaoscura": base("Escudo de maderaoscura"),
  "Escudo pesado de mithril": joinDescription([
    base("Escudo pesado de acero"),
    "De mithril: pesa la mitad.",
  ]),
  "Escudo del lanzador de conjuros": joinDescription([
    base("Escudo ligero de madera"),
    armorBonus(1),
    "Lleva en el interior un pergamino de conjuro que puedes leer sin soltarlo, y no te estorba para lanzar conjuros con componentes somáticos.",
  ]),
  "Escudo espinoso": joinDescription([
    base("Escudo pesado de acero"),
    armorBonus(1),
    "Tres veces al día, con una acción adicional, dispara una espina: ataque a distancia (120 pies) que inflige 1d10 perforante.",
  ]),
  "Escudo del león": joinDescription([
    base("Escudo pesado de acero"),
    armorBonus(2),
    "Tres veces al día, con una acción adicional, la cabeza de león del escudo muerde a una criatura a 5 pies: 2d6 perforante.",
  ]),
  "Escudo alado": joinDescription([
    base("Escudo pesado de madera"),
    armorBonus(2),
    "Una vez al día, con una acción, te da velocidad volando de 60 pies durante 10 minutos.",
  ]),
  "Escudo absorbente": joinDescription([
    base("Escudo pesado de acero"),
    armorBonus(1),
    "Una vez cada dos días, con una acción, lanza desintegrar (CD 17) sobre una criatura u objeto que toques con él.",
  ]),
};

const ENERGY_CHOICE =
  "Al crearlo se elige un tipo de daño: ácido, frío, relámpago, fuego o trueno.";
const spellStoring = (levels: number) =>
  `Guarda conjuros que se lancen sobre él hasta sumar ${levels} niveles. Quien lo lleve puede lanzarlos con la CD y el bonificador de ataque de quien los guardó; después queda vacío.`;
const wizardry = (level: number) =>
  `Si eres mago, ganas 2 espacios de conjuro de nivel ${level} adicionales.`;

/** A ring of elemental command: its element's language and powers. */
const elementalCommand = (element: string, language: string, powers: string) =>
  `Los elementales de ${element} tienen desventaja al atacarte y tú ventaja al atacarlos. Hablas ${language}. Una vez al día puedes lanzar dominar monstruo (CD 18) sobre un elemental de ${element}. ${powers}`;

/** Table 7-17 ("Anillos"), by the name the table prints. */
export const RING_DESCRIPTIONS: Descriptions = {
  "Protección +1": armorBonus(1),
  "Protección +2": armorBonus(2),
  "Protección +3": armorBonus(3),
  "Protección +4": armorBonus(4),
  "Protección +5": armorBonus(5),
  "Caída de pluma": "Si caes, desciendes a 60 pies por asalto y no recibes daño por la caída.",
  "Sustento": "No necesitas comer ni beber, y con 2 horas de sueño obtienes el beneficio de 8.",
  "Escalada": "+5 a las pruebas de Fuerza (Atletismo) para trepar.",
  "Escalada, mejorado": "Tienes velocidad trepando igual a tu velocidad caminando.",
  "Salto": "+5 a las pruebas de Fuerza (Atletismo) para saltar, y saltas como si hubieras cogido carrerilla.",
  "Salto, mejorado": "Tu distancia de salto se triplica, como con el conjuro saltar.",
  "Nadar": "+5 a las pruebas de Fuerza (Atletismo) para nadar.",
  "Nadar, mejorado": "Tienes velocidad nadando de 40 pies.",
  "Contraconjuros": "Guarda un conjuro de nivel 1 a 6 que se lance sobre él. Si alguien lanza ese mismo conjuro contra ti, queda contrarrestado y el anillo se vacía.",
  "Escudo mental": "Nadie puede leer tus pensamientos, saber con magia si mientes ni conocer tu alineamiento o tipo de criatura.",
  "Escudo de fuerza": "Con una acción adicional crea un escudo de fuerza invisible: +2 a la CA. No puedes llevar otro escudo a la vez.",
  "Ariete": "Tiene 3 cargas y recupera 1d3 al amanecer. Con una acción gastas de 1 a 3: ataque a distancia (+7, 60 pies) que inflige 2d10 de fuerza por carga y empuja 5 pies por carga.",
  "Amistad con los animales": "Tres veces al día, con una acción, lanzas amistad con los animales (CD 13).",
  "Resistir energía, menor": `${ENERGY_CHOICE} Reduce en 5 el daño de ese tipo que recibes.`,
  "Resistir energía, mayor": `${ENERGY_CHOICE} Tienes resistencia a ese daño.`,
  "Resistir energía, superior": `${ENERGY_CHOICE} Tienes inmunidad a ese daño.`,
  "Poder camaleónico": "Con una acción adicional adoptas los colores de tu entorno: ventaja en las pruebas de Destreza (Sigilo) para esconderte. Además puedes lanzar disfrazarse a voluntad.",
  "Caminar sobre las aguas": "Puedes caminar sobre el agua y cualquier otro líquido como si fuera suelo firme.",
  "Almacenar conjuros, menor": spellStoring(3),
  "Almacenar conjuros": spellStoring(5),
  "Almacenar conjuros, mayor": spellStoring(9),
  "Invisibilidad": "Con una acción te vuelves invisible hasta que ataques, lances un conjuro o uses una acción adicional para volver a ser visible.",
  "Magia (I)": wizardry(1),
  "Magia (II)": wizardry(2),
  "Magia (III)": wizardry(3),
  "Magia (IV)": wizardry(4),
  "Evasión": "Cuando un efecto te pide una salvación de Destreza para recibir la mitad del daño, no recibes ninguno si la superas.",
  "Visión de rayos X": "Con una acción ves a través de la materia sólida a 30 pies durante 1 minuto (hasta 1 pie de piedra, 1 pulgada de metal o 3 pies de madera). Usarlo más de una vez antes de un descanso largo te da un nivel de cansancio.",
  "Intermitencia": "Tres veces al día, con una acción adicional, lanzas intermitencia sobre ti.",
  "Libertad de movimiento": "El terreno difícil no te frena, la magia no puede reducir tu velocidad ni dejarte paralizado o apresado, y moverte bajo el agua no te cuesta más.",
  "Escudar al amigo (pareja)": "Son dos anillos. Mientras sus portadores estén a 60 pies o menos, cada uno tiene +1 a la CA y a las salvaciones, y el portador del segundo anillo recibe la mitad del daño que sufra el del primero.",
  "Estrellas fugaces": "Solo de noche y bajo el cielo: puedes lanzar luces danzantes y luz a voluntad, y fuego feérico una vez al día. Con sus 6 cargas diarias crea bolas de relámpago (2d4 a 4d12 de relámpago) o una lluvia de estrellas fugaces que estallan con 6d4 de fuego.",
  "Telecinesis": "Puedes lanzar telequinesis a voluntad, pero solo sobre objetos que nadie lleve puestos ni sujete.",
  "Regeneración": "Mientras tengas al menos 1 PG, recuperas 1d6 PG cada 10 minutos. Las partes del cuerpo perdidas vuelven a crecer en 1d6 + 1 días.",
  "Tres deseos": "Guarda 3 cargas: con una acción gastas una y lanzas el conjuro deseo. Sin cargas, queda como un anillo normal.",
  "Retornar conjuros": "Ventaja en las salvaciones contra conjuros que solo te tienen a ti como objetivo. Si sacas un 20 contra un conjuro de nivel 7 o inferior, el conjuro se vuelve contra su lanzador.",
  "Llamar djinni": "Una vez al día, con una acción, llamas a un djinni que te obedece durante 1 hora. Si el djinni muere, el anillo pierde su poder.",
  "Comandar elementales de aire": elementalCommand("aire", "aurano", "No recibes daño por caídas, y con sus cargas lanzas ráfaga de viento, muro de viento y relámpago encadenado."),
  "Comandar elementales de tierra": elementalCommand("tierra", "terrano", "Atraviesas la roca y la tierra como si fueran terreno normal, y con sus cargas lanzas moldear la piedra, piel de piedra y muro de piedra."),
  "Comandar elementales de fuego": elementalCommand("fuego", "ígneo", "Tienes resistencia al fuego, y con sus cargas lanzas manos ardientes, bola de fuego y muro de fuego."),
  "Comandar elementales de agua": elementalCommand("agua", "acuano", "Caminas sobre el agua y respiras bajo ella, y con sus cargas lanzas crear o destruir agua, muro de hielo y controlar agua."),
};

/** A metamagic rod: three times a day, on a spell of `maxLevel` or lower. */
const metamagic = (effect: string, maxLevel: number) =>
  `Tres veces al día, al lanzar un conjuro de nivel ${maxLevel} o inferior, ${effect}`;
const ENLARGE = "duplicas su alcance (o lo llevas a 30 pies si es de toque).";
const EXTEND = "duplicas su duración, hasta un máximo de 24 horas.";
const SILENT = "lo lanzas sin componentes verbales.";
const EMPOWER = "puedes volver a tirar los dados de daño que quieras y quedarte con los nuevos resultados.";
const MAXIMIZE = "su daño o curación es el máximo posible, sin tirar dados.";
const QUICKEN = "si se lanza con 1 acción, lo lanzas con una acción adicional.";

/** Table 7-19 ("Cetros"), by the name the table prints. */
export const ROD_DESCRIPTIONS: Descriptions = {
  "Metamágico, ampliación, menor": metamagic(ENLARGE, 3),
  "Metamágico, ampliación": metamagic(ENLARGE, 6),
  "Metamágico, ampliación, mayor": metamagic(ENLARGE, 9),
  "Metamágico, prolongación, menor": metamagic(EXTEND, 3),
  "Metamágico, prolongación": metamagic(EXTEND, 6),
  "Metamágico, prolongación, mayor": metamagic(EXTEND, 9),
  "Metamágico, silencio, menor": metamagic(SILENT, 3),
  "Metamágico, silencio": metamagic(SILENT, 6),
  "Metamágico, silencio, mayor": metamagic(SILENT, 9),
  "Metamágico, potenciación, menor": metamagic(EMPOWER, 3),
  "Metamágico, potenciación": metamagic(EMPOWER, 6),
  "Metamágico, potenciación, mayor": metamagic(EMPOWER, 9),
  "Metamágico, maximización, menor": metamagic(MAXIMIZE, 3),
  "Metamágico, maximización": metamagic(MAXIMIZE, 6),
  "Metamágico, apresuración, menor": metamagic(QUICKEN, 3),
  "Metamágico, apresuración": metamagic(QUICKEN, 6),
  "Metamágico, apresuración, mayor": metamagic(QUICKEN, 9),
  "Inamovible": "Al pulsar su botón queda fijo en el sitio, aunque esté en el aire. Aguanta hasta 8.000 libras; moverlo exige una prueba de Fuerza CD 30.",
  "Detección de metales y minerales": "Con una acción nombras un metal o mineral y sabes dónde está el más cercano a 30 pies y en qué cantidad aproximada.",
  "Cancelación": "Con una acción tocas un objeto mágico (si alguien lo lleva, necesitas impactar con un ataque cuerpo a cuerpo) y pierde su magia para siempre. Después el cetro se vuelve quebradizo y no puede volver a usarse.",
  "De las maravillas": "Tiene cargas. Con una acción gastas una y lo apuntas a un objetivo a 120 pies: ocurre un efecto al azar que decide el DM, desde una lluvia de mariposas hasta un relámpago o la invisibilidad.",
  "Pitón": joinDescription([
    base("Bastón"),
    weaponBonus(1),
    "Si lo lanzas al suelo con una acción, se convierte en una serpiente constrictora gigante a tus órdenes; vuelve a su forma a tu orden o si la matan.",
  ]),
  "Extinguellamas": "Tiene 10 cargas. Con una acción apaga los fuegos no mágicos de un cubo de 10 pies (1 carga) o un fuego mágico (2 cargas); contra una criatura de fuego, su toque inflige 6d6 de frío (3 cargas).",
  "De la víbora": joinDescription([
    base("Maza pesada"),
    weaponBonus(2),
    "Una vez al día, con una acción adicional, su cabeza se vuelve una víbora durante 10 minutos: al impactar, el objetivo debe superar una salvación de Constitución CD 14 o recibe 3d6 de veneno y queda envenenado durante 1 minuto.",
  ]),
  "Detección de enemigos": "Tres veces al día, con una acción, sabes durante 10 minutos dónde están las criaturas a 60 pies que te son hostiles.",
  "Magnificencia": "Ventaja en las pruebas de Carisma. Una vez al día te viste con ropas nobles que duran 12 horas; una vez a la semana levanta un pabellón de seda con un festín para 100 personas.",
  "Marchitante": joinDescription([
    base("Maza ligera"),
    weaponBonus(1),
    "Al impactar, el objetivo debe superar una salvación de Constitución CD 17 o su Fuerza o su Constitución (a tu elección) se reduce en 1d4 hasta un descanso largo.",
  ]),
  "Truenos y relámpagos": joinDescription([
    base("Maza ligera"),
    weaponBonus(2),
    "Cada poder una vez al día: un trueno que aturde al objetivo impactado (Constitución CD 15), 2d6 de relámpago adicional en un impacto, un estruendo que ensordece a todos a 10 pies, o un relámpago de 9d6 (Destreza CD 15).",
  ]),
  "Negación": "Tres veces al día, con una acción, lanza un rayo a un objeto mágico a 60 pies: sus poderes se anulan durante 1 minuto (si alguien lo lleva, puede evitarlo con una salvación de Destreza CD 17).",
  "Absorción": "Con tu reacción absorbes un conjuro que solo te tiene a ti como objetivo y guardas sus niveles (hasta 50 en total). Puedes gastarlos para lanzar tus propios conjuros sin usar espacios.",
  "Mangual": joinDescription([
    base("Mangual doble"),
    weaponBonus(3),
    "Una vez al día, con una acción, te da +4 a la CA y a las salvaciones durante 10 minutos.",
  ]),
  "Gobierno": "Una vez al día, con una acción, cada criatura que elijas y te vea a 120 pies debe superar una salvación de Sabiduría CD 15 o queda hechizada por ti durante 8 horas.",
  "Seguridad": "Con una acción te llevas a ti y a hasta 199 criaturas voluntarias a un semiplano paradisíaco donde no hace falta comer ni beber; podéis quedaros un total de 200 días entre todos.",
  "Poder señorial": joinDescription([
    base("Maza ligera"),
    weaponBonus(3),
    "Sus botones la convierten en espada llameante, hacha o lanza, o en una escala, un ariete o un detector de norte. Una vez al día cada uno: paralizar, asustar o drenar 4d6 PG de una criatura que impactes (CD 17).",
  ]),
  "Alerta": "Ventaja en las pruebas de Sabiduría (Percepción) y en las tiradas de iniciativa. A voluntad lanzas detectar el bien y el mal, detectar magia, detectar veneno y enfermedad, y ver lo invisible. Una vez al día, clavado en el suelo, vigila un área de 120 pies durante 10 minutos.",
};

const STAFF =
  "Gasta las cargas que indica su nombre y no se recargan solas. Lanza sus conjuros con tu CD y tu bonificador de ataque de conjuros:";

/** A staff and the charges each of its spells costs. */
const staff = (spells: string) => `${STAFF} ${spells}.`;

/** Table 7-18 ("Bastones"), by the name the table prints. */
export const STAFF_DESCRIPTIONS: Descriptions = {
  "Hechizador": staff("hechizar persona (1 carga) y hechizar monstruo (2)"),
  "Fuego": staff("manos ardientes (1 carga), bola de fuego (1) y muro de fuego (2)"),
  "Enjambre de insectos": staff("invocar un enjambre de insectos (1 carga) y plaga de insectos (3)"),
  "Curación": staff("restablecimiento menor (1 carga), curar heridas a nivel 3 (1), quitar la ceguera o la sordera (2) y curar enfermedades (3)"),
  "Cambio de tamaño": staff("agrandar/reducir sobre una criatura u objeto (1 carga)"),
  "Iluminador": staff("luz (1 carga), luz del día (1) y estallido solar (3)"),
  "Escarcha": staff("tormenta de hielo (1 carga), muro de hielo (2) y cono de frío (3)"),
  "Defensa": staff("escudo (1 carga), armadura de mago (1), escudo de fe (1) y vínculo protector (2)"),
  "Abjuración": staff("escudo (1 carga), protección contra la energía (1), disipar magia (1), destierro (2) y globo de invulnerabilidad (3)"),
  "Conjuración": staff("sirviente invisible (1 carga), nube apestosa (1), puerta dimensional (2) y nube aniquiladora (3)"),
  "Encantamiento": staff("dormir (1 carga), risa horrible de Tasha (1), sugestión (1), confusión (2) y dominar persona (3)"),
  "Evocación": staff("proyectil mágico (1 carga), romper (1), bola de fuego (1), tormenta de hielo (2), muro de fuerza (2) y relámpago encadenado (3)"),
  "Ilusión": staff("disfrazarse (1 carga), imagen múltiple (1), imagen mayor (1), terreno alucinatorio (2) e imagen programada (3)"),
  "Nigromancia": staff("rayo de debilitamiento (1 carga), ceguera/sordera (1), toque vampírico (1), animar a los muertos (2) y círculo de muerte (3)"),
  "Transmutación": staff("alterarse (1 carga), forma gaseosa (1), acelerar (1), polimorfar (2) y desintegrar (3)"),
  "Adivinación": staff("detectar magia (1 carga), localizar objeto (1), don de lenguas (1), clarividencia (1), ojo arcano (2) y visión verdadera (3)"),
  "Tierra y piedra": staff("pasamuros (1 carga), muro de piedra (2) y mover la tierra (2)"),
  "De los bosques": joinDescription([
    base("Bastón"),
    weaponBonus(2),
    staff("hablar con los animales (1 carga), piel robliza (2), hablar con las plantas (3), despertar (5) y muro de espinos (6)"),
    "Con una acción puedes clavarlo en el suelo y convertirlo en un árbol de 60 pies.",
  ]),
  "Vida": staff("sanar (1 carga) y revivir a los muertos (5)"),
  "Paso": staff("puerta dimensional (1 carga), pasamuros (1), teletransporte (2) y proyección astral (3)"),
  "Poder": joinDescription([
    base("Bastón"),
    weaponBonus(2),
    "+2 a la CA, a las salvaciones y a las tiradas de ataque de conjuros.",
    staff("proyectil mágico (1 carga), rayo de debilitamiento (1), levitar (2), bola de fuego (5), relámpago (5), cono de frío (5), inmovilizar monstruo (5), muro de fuerza (5) y globo de invulnerabilidad (6)"),
    "Golpe de represalia: con una acción lo rompes y estalla. Cada criatura a 10 pies recibe 16 de fuerza por carga restante; a 20 pies, 6 por carga; a 30 pies, 4 por carga (Destreza CD 17, mitad).",
  ]),
};
