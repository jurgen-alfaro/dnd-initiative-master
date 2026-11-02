import type { DiceNotation } from "./dice";

/** One d% range of table 3-6 or 3-7: a value in po and example names. */
export type ValuableRow = {
  upTo: number;
  dice: DiceNotation;
  times: number;
  names: readonly string[];
};

/**
 * DMG 3.5 table 3-6 ("Gemas"). Each gem takes one name picked at random from
 * the examples of its row. Names are transcribed as printed in Spanish.
 */
export const GEM_TABLE: readonly ValuableRow[] = [
  {
    upTo: 25,
    dice: "4d4",
    times: 1,
    names: [
      "Ágata listada, musgosa o aojada",
      "Azurita",
      "Cuarzo azul",
      "Hematites",
      "Lapislázuli",
      "Malaquita",
      "Obsidiana",
      "Rodocrosita",
      "Ojo de tigre",
      "Perla de agua dulce (con irregularidades)",
    ],
  },
  {
    upTo: 50,
    dice: "2d4",
    times: 10,
    names: [
      "Heliotropo (piedra de sangre)",
      "Cornalina",
      "Calcedonia",
      "Crisoprasa",
      "Iolita",
      "Jaspe",
      "Adularia (piedra de luna)",
      "Ónice",
      "Peridoto",
      "Cristal de roca (cuarzo transparente)",
      "Sarda",
      "Sardónice",
      "Cuarzo citrino, rosado estrella, ahumado, rosado",
      "Circón",
    ],
  },
  {
    upTo: 70,
    dice: "4d4",
    times: 10,
    names: [
      "Ámbar",
      "Amatista",
      "Crisoberilo",
      "Coral",
      "Granate rojo o amarillo verdoso",
      "Jade",
      "Azabache",
      "Perla blanca, dorada, rosada o argéntea",
      "Espinela roja, verde intenso o rojo vinoso",
      "Turmalina",
    ],
  },
  {
    upTo: 90,
    dice: "2d4",
    times: 100,
    names: [
      "Alejandrita",
      "Aguamarina",
      "Granate violáceo",
      "Perla negra",
      "Espinela azul intenso",
      "Topacio amarillo",
    ],
  },
  {
    upTo: 99,
    dice: "4d4",
    times: 100,
    names: [
      "Esmeralda",
      "Ópalo de fuego, blanco o negro",
      "Zafiro azul",
      "Corindón amarillo intenso o violado",
      "Zafiro negro o azul estrella",
      "Rubí estrella",
    ],
  },
  {
    upTo: 100,
    dice: "2d4",
    times: 1000,
    names: [
      "Esmeralda diáfana y de color verde de gran brillo",
      "Diamante azulado, castaño, rosa, ambarino o hialino",
      "Jacinto",
    ],
  },
];
