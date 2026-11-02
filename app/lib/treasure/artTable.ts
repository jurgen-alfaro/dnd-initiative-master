import type { ValuableRow } from "./gemTable";

/**
 * DMG 3.5 table 3-7 ("Objetos de arte"). Each object takes one name picked at
 * random from the examples of its row, transcribed as printed in Spanish.
 */
export const ART_TABLE: readonly ValuableRow[] = [
  {
    upTo: 10,
    dice: "1d10",
    times: 10,
    names: [
      "Jarra de plata",
      "Estatua de marfil o hueso labrado",
      "Pequeño brazalete de oro finamente labrado",
    ],
  },
  {
    upTo: 25,
    dice: "3d6",
    times: 10,
    names: [
      "Tela con hilo de oro",
      "Máscara de terciopelo negro con gran cantidad de cuarzos citrinos",
      "Cáliz de plata con gemas de lapislázuli",
    ],
  },
  {
    upTo: 40,
    dice: "1d6",
    times: 100,
    names: [
      "Tapiz de grandes dimensiones hecho de lana finamente trabajada",
      "Taza de cobre con incrustaciones de jade",
    ],
  },
  {
    upTo: 50,
    dice: "1d10",
    times: 100,
    names: [
      "Peine de plata con adularias",
      "Espada larga de acero con baño de plata y una joya de azabache en la empuñadura",
    ],
  },
  {
    upTo: 60,
    dice: "2d6",
    times: 100,
    names: [
      "Arpa tallada en una madera exótica con incrustaciones de marfil y circones",
      "Ídolo de oro macizo (10 lb.)",
    ],
  },
  {
    upTo: 70,
    dice: "3d6",
    times: 100,
    names: [
      "Peine en forma de dragón, con un ojo de granate rojo",
      "Tapón de botella de oro y topacio",
      "Daga ceremonial de electro con un rubí estrella en el pomo",
    ],
  },
  {
    upTo: 80,
    dice: "4d6",
    times: 100,
    names: [
      "Parche para el ojo con ojo falso de zafiro y piedra de luna",
      "Colgante de ópalo de fuego con cadena de oro fino",
      "Cuadro antiguo (pintura) de gran calidad",
    ],
  },
  {
    upTo: 85,
    dice: "5d6",
    times: 100,
    names: [
      "Manto bordado en seda y terciopelo y adornado con numerosas piedras de luna",
      "Colgante de zafiro en una cadena de oro",
    ],
  },
  {
    upTo: 90,
    dice: "1d4",
    times: 1000,
    names: [
      "Guante bordado y enjoyado",
      "Tobillera con joyas",
      "Caja de música de oro",
    ],
  },
  {
    upTo: 95,
    dice: "1d6",
    times: 1000,
    names: [
      "Ceño de oro con cuatro aguamarinas",
      "Collar de pequeñas perlas rosadas",
    ],
  },
  {
    upTo: 99,
    dice: "2d4",
    times: 1000,
    names: ["Corona de oro enjoyada", "Anillo de electro con joyas engastadas"],
  },
  {
    upTo: 100,
    dice: "2d6",
    times: 1000,
    names: ["Anillo de oro y rubí", "Copa de oro decorada con esmeraldas"],
  },
];
