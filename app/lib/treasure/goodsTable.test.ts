import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatIndividualAnnouncement,
  formatItemName,
  generateTreasure,
} from "./treasure";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import { fixedDie } from "./testDice";

/** "01-14" → [1, 14]. */
const range = (text: string): [number, number] => {
  const [low, high] = text.split("-").map(Number);
  return [low, high];
};

const CATEGORY_OF_WORD: Record<string, string> = {
  mundano: "mundane",
  menor: "minor",
  intermedio: "medium",
  mayor: "major",
};

/**
 * Objects column of table 3-5 copied cell by cell as the DMG prints it, kept
 * apart from the production data so a typo in either one fails a test.
 */
const BOOK_GOODS: Record<number, string[]> = {
  1: ["01-71 —", "72-95 1 mundano", "96-100 1 menor"],
  2: ["01-49 —", "50-85 1 mundano", "86-100 1 menor"],
  3: ["01-49 —", "50-79 1d3 mundanos", "80-100 1 menor"],
  4: ["01-42 —", "43-62 1d4 mundanos", "63-100 1 menor"],
  5: ["01-57 —", "58-67 1d4 mundanos", "68-100 1d3 menores"],
  6: ["01-54 —", "55-59 1d4 mundanos", "60-99 1d3 menores", "100-100 1 intermedio"],
  7: ["01-51 —", "52-97 1d3 menores", "98-100 1 intermedio"],
  8: ["01-48 —", "49-96 1d4 menores", "97-100 1 intermedio"],
  9: ["01-43 —", "44-91 1d4 menores", "92-100 1 intermedio"],
  10: ["01-40 —", "41-88 1d4 menores", "89-99 1 intermedio", "100-100 1 mayor"],
  11: ["01-31 —", "32-84 1d4 menores", "85-98 1 intermedio", "99-100 1 mayor"],
  12: ["01-27 —", "28-82 1d6 menores", "83-97 1 intermedio", "98-100 1 mayor"],
  13: ["01-19 —", "20-73 1d6 menores", "74-95 1 intermedio", "96-100 1 mayor"],
  14: ["01-19 —", "20-58 1d6 menores", "59-92 1 intermedio", "93-100 1 mayor"],
  15: ["01-11 —", "12-46 1d10 menores", "47-90 1 intermedio", "91-100 1 mayor"],
  16: ["01-40 —", "41-46 1d10 menores", "47-90 1d3 intermedios", "91-100 1 mayor"],
  17: ["01-33 —", "34-83 1d3 intermedios", "84-100 1 mayor"],
  18: ["01-24 —", "25-80 1d4 intermedios", "81-100 1 mayor"],
  19: ["01-04 —", "05-70 1d4 intermedios", "71-100 1 mayor"],
  20: ["01-25 —", "26-65 1d4 intermedios", "66-100 1d3 mayores"],
};

/**
 * The rolls that resolve one item of each category: tools #1, or family #1
 * (armor) with row #1 of table 7-2 (an enchanted shield) and of table 7-4.
 */
const ITEM_ROLLS = {
  mundane: [84, 1],
  minor: [1, 1, 1],
  medium: [1, 1, 1],
  major: [1, 1, 1],
};

describe("generateTreasure objects column (table 3-5)", () => {
  for (const [level, cells] of Object.entries(BOOK_GOODS)) {
    for (const cell of cells) {
      const [rangeText, ...rest] = cell.split(" ");
      const result = rest.join(" ");
      const [low, high] = range(rangeText);

      for (const percentile of new Set([low, high])) {
        if (result === "—") {
          it(`should give no objects at NE ${level} with d% ${percentile}`, () => {
            const die = fixedDie(1, 1, percentile);
            const treasure = generateTreasure(Number(level), die);

            assert.deepEqual(treasure.items, []);
            assert.equal(die.rest(), 0);
          });
          continue;
        }

        const [count, word] = result.split(" ");
        const category = CATEGORY_OF_WORD[word.replace(/(e?s)$/, "")];
        const sides = count === "1" ? 1 : Number(count.split("d")[1]);
        for (const amount of new Set([1, sides])) {
          it(`should give ${amount} ${category} of ${result} at NE ${level} with d% ${percentile}`, () => {
            const die = fixedDie(
              1,
              1,
              percentile,
              ...(count === "1" ? [] : [amount]),
              ...Array.from({ length: amount }, () => ITEM_ROLLS[category as keyof typeof ITEM_ROLLS]).flat(),
            );
            const treasure = generateTreasure(Number(level), die);

            assert.deepEqual(
              treasure.items.map((item) => item.category),
              Array(amount).fill(category),
            );
            assert.equal(die.rest(), 0);
          });
        }
      }
    }
  }

  it("should keep the objects roll and the count die on each item", () => {
    const treasure = generateTreasure(3, fixedDie(1, 1, 60, 2, 84, 1, 84, 2));

    assert.equal(treasure.items.length, 2);
    for (const item of treasure.items) {
      assert.deepEqual(
        item.rolls.slice(0, 2).map((r) => [r.dice, r.values]),
        [
          ["d%", [60]],
          ["1d3", [2]],
        ],
      );
    }
  });
});

/** Table 7-1 copied as the DMG prints it: d% range and family per column. */
const BOOK_MAGIC: Record<"minor" | "medium" | "major", string[]> = {
  minor: [
    "01-04 Armadura y escudos",
    "05-09 Armas",
    "10-44 Pociones",
    "45-46 Anillos",
    "47-81 Rollos de pergamino",
    "82-91 Varitas",
    "92-100 Objetos maravillosos",
  ],
  medium: [
    "01-10 Armadura y escudos",
    "11-20 Armas",
    "21-30 Pociones",
    "31-40 Anillos",
    "41-50 Cetros",
    "51-65 Rollos de pergamino",
    "66-68 Bastones",
    "69-83 Varitas",
    "84-100 Objetos maravillosos",
  ],
  major: [
    "01-10 Armadura y escudos",
    "11-20 Armas",
    "21-25 Pociones",
    "26-35 Anillos",
    "36-45 Cetros",
    "46-55 Rollos de pergamino",
    "56-75 Bastones",
    "76-80 Varitas",
    "81-100 Objetos maravillosos",
  ],
};

/** The first table each family of table 7-1 rolls on, as its roll is labelled. */
const FIRST_FAMILY_TABLE: Record<string, RegExp> = {
  "Armadura y escudos": /^Table 7-2, /,
  Armas: /^Table 7-9, /,
  Pociones: /^Table 7-20, /,
  Anillos: /^Table 7-17, /,
  Cetros: /^Table 7-19, /,
  "Rollos de pergamino": /^Table 7-21$/,
  Bastones: /^Table 7-18, /,
  Varitas: /^Table 7-26, /,
  "Objetos maravillosos": /^Table 7-2[789]$/,
};

describe("generateTreasure magic family (table 7-1)", () => {
  for (const [category, cells] of Object.entries(BOOK_MAGIC)) {
    it(`should give the family printed for every d% in the ${category} column`, () => {
      for (let percentile = 1; percentile <= 100; percentile++) {
        const cell = cells.find((c) => {
          const [low, high] = range(c.split(" ")[0]);
          return percentile >= low && percentile <= high;
        });
        assert.ok(cell, `d% ${percentile} must have a row in ${category}`);
        const family = cell.slice(cell.indexOf(" ") + 1);

        // Table 7-1 gets `percentile`; the family's own tables get 1s.
        let isFirstRoll = true;
        const die = () => {
          if (!isFirstRoll) return 1;
          isFirstRoll = false;
          return percentile;
        };
        const item = rollMagicItem(category as MagicCategory, die);

        assert.equal(item.category, category);
        assert.match(
          item.rolls[1].label,
          FIRST_FAMILY_TABLE[family],
          `${category} d% ${percentile} must go to ${family}`,
        );
      }
    });
  }

  it("should keep the family roll on the item", () => {
    const treasure = generateTreasure(1, fixedDie(1, 1, 96, 20, 33));

    assert.deepEqual(
      treasure.items[0].rolls.map((r) => [r.dice, r.values]),
      [
        ["d%", [96]],
        ["d%", [20]],
        ["d%", [33]],
      ],
    );
  });
});

describe("formatIndividualAnnouncement objects", () => {
  it("should show the price of a mundane object and of a resolved magic one", () => {
    const mundaneTreasure = generateTreasure(1, fixedDie(1, 1, 72, 18, 19, 11));
    const magicTreasure = generateTreasure(1, fixedDie(1, 1, 96, 10, 1));

    assert.deepEqual(formatIndividualAnnouncement(mundaneTreasure, "Aria"), [
      "Treasure for Aria\n- Coraza (Mediana) (200 po)\n  Armadura intermedia: CA 14 + Destreza (máx. 2).\nTotal: 200 po",
    ]);
    assert.deepEqual(formatIndividualAnnouncement(magicTreasure, "Aria"), [
      "Treasure for Aria\n- Curar heridas leves (poción) (50 po)\n  Quien la bebe, o el objeto o arma que recibe el aceite, obtiene el efecto del conjuro, sin necesidad de concentración:\n  Una criatura recupera 1d8 + 1 PG.\nTotal: 50 po",
    ]);
  });
});

/** Table 3-8 and tables 7-11 to 7-13 as printed: "d%-range|name|price in po". */
const BOOK_ALCHEMICAL = [
  "01-12|Fuego de alquimista|1d4|20",
  "13-24|Ácido|2d4|10",
  "25-36|Ahumadera|1d4|20",
  "37-48|Agua bendita|1d4|25",
  "49-62|Contraveneno|1d4|50",
  "63-74|Antorcha siempreardiente||110",
  "75-88|Bolsas de maraña|1d4|50",
  "89-100|Piedras de trueno|1d4|30",
];
const BOOK_ARMOR = [
  "01-12|Camisote de mallas|100",
  "13-18|Armadura de cuero tachonado de gran calidad|175",
  "19-26|Coraza|200",
  "27-34|Cota de bandas|250",
  "35-54|Armadura de placas y mallas|600",
  "55-80|Armadura completa|1500",
];
const BOOK_DARKWOOD = ["01-50|Broquel de maderaoscura|205", "51-100|Escudo de maderaoscura|257"];
const BOOK_MASTERWORK_SHIELDS = [
  "01-17|Broquel de gran calidad|165",
  "18-40|Escudo ligero de madera de gran calidad|153",
  "41-60|Escudo ligero de acero de gran calidad|159",
  "61-83|Escudo pesado de madera de gran calidad|157",
  "84-100|Escudo pesado de acero de gran calidad|170",
];
const BOOK_COMMON_MELEE = [
  "01-03|Bastón de gran calidad|600",
  "04-08|Cimitarra de gran calidad|315",
  "09-12|Daga de gran calidad|302",
  "13-22|Espada bastarda de gran calidad|335",
  "23-27|Espada corta de gran calidad|310",
  "28-40|Espada larga de gran calidad|315",
  "41-50|Espadón de gran calidad|350",
  "51-54|Estoque de gran calidad|320",
  "55-64|Gran hacha de gran calidad|320",
  "65-75|Hacha de guerra enana de gran calidad|330",
  "76-79|Kama de gran calidad|302",
  "80-83|Lanza corta de gran calidad|302",
  "84-87|Maza ligera de gran calidad|305",
  "88-92|Maza pesada de gran calidad|312",
  "93-96|Nunchaku de gran calidad|302",
  "97-100|Siangham de gran calidad|303",
];
const BOOK_UNCOMMON = [
  "01-03|Alabarda de gran calidad|310",
  "04-05|Alfanjón de gran calidad|375",
  "06-09|Ballesta de mano de gran calidad|400",
  "10-12|Ballesta de repetición de gran calidad|550",
  "13-14|Bisarma de gran calidad|309",
  "15-16|Cachiporra de gran calidad|301",
  "17-19|Cadena armada de gran calidad|325",
  "20-21|Clava de gran calidad|300",
  "22-24|Espada de dos hojas de gran calidad|700",
  "25-26|Gran clava de gran calidad|305",
  "27-28|Guadaña de gran calidad|318",
  "29-30|Guantelete de gran calidad|302",
  "31-32|Guantelete armado de gran calidad|305",
  "33-34|Guja de gran calidad|308",
  "35-38|Hacha de batalla de gran calidad|310",
  "39-40|Hacha de mano de gran calidad|306",
  "41-43|Hacha doble orca de gran calidad|660",
  "44-45|Hoz de gran calidad|306",
  "46-48|Kukri de gran calidad|308",
  "49-50|Lanza larga de gran calidad|305",
  "51-52|Lanza ligera de caballería de gran calidad|306",
  "53-54|Lanza pesada de caballería de gran calidad|310",
  "55-57|Látigo de gran calidad|301",
  "58-60|Mangual doble de gran calidad|690",
  "61-64|Mangual ligero de gran calidad|308",
  "65-69|Mangual pesado de gran calidad|315",
  "70-72|Martillo de guerra de gran calidad|312",
  "73-75|Martillo ganchudo gnomo de gran calidad|620",
  "76-77|Martillo ligero de gran calidad|301",
  "78-80|Maza de armas de gran calidad|308",
  "81-83|Media lanza de gran calidad|301",
  "84-85|Pico ligero de gran calidad|304",
  "86-87|Pico pesado de gran calidad|308",
  "88-89|Puñal de gran calidad|302",
  "90-91|Red de gran calidad|320",
  "92-93|Ronca de gran calidad|310",
  "94-95|Shuriken de gran calidad|301",
  "96-97|Tridente de gran calidad|315",
  "98-100|Urgrosh enano de gran calidad|650",
];
const BOOK_RANGED = [
  "11-15|Hacha arrojadiza de gran calidad|308",
  "16-25|Ballesta pesada de gran calidad|350",
  "26-35|Ballesta ligera de gran calidad|335",
  "36-39|Dardos (50) de gran calidad|300.5",
  "40-41|Jabalina de gran calidad|301",
  "42-46|Arco corto de gran calidad|330",
  "47-51|Arco corto compuesto (bonificador Fue +0) de gran calidad|375",
  "52-56|Arco corto compuesto (bonificador Fue +1) de gran calidad|450",
  "57-61|Arco corto compuesto (bonificador Fue +2) de gran calidad|525",
  "62-65|Honda de gran calidad|300",
  "66-75|Arco largo de gran calidad|375",
  "76-80|Arco largo compuesto de gran calidad|400",
  "81-85|Arco largo compuesto (bonificador Fue +1) de gran calidad|500",
  "86-90|Arco largo compuesto (bonificador Fue +2) de gran calidad|600",
  "91-95|Arco largo compuesto (bonificador Fue +3) de gran calidad|700",
  "96-100|Arco largo compuesto (bonificador Fue +4) de gran calidad|800",
];
const BOOK_AMMUNITION = [
  "01-50|Flechas (50) de gran calidad|350",
  "51-80|Virotes de ballesta (50) de gran calidad|350",
  "81-100|Balas de honda (50) de gran calidad|350",
];
const BOOK_TOOLS = [
  "01-03|Mochila, vacía|2",
  "04-06|Palanqueta|2",
  "07-11|Linterna de ojo de buey|12",
  "12-16|Cerradura sencilla|20",
  "17-21|Cerradura corriente|40",
  "22-28|Cerradura de calidad|80",
  "29-35|Cerradura superior|150",
  "36-40|Grilletes de gran calidad|50",
  "41-43|Espejito de acero pulido|10",
  "44-46|Cuerda de seda (50')|10",
  "47-53|Catalejo|1000",
  "54-58|Herramientas de gran calidad para artesano|55",
  "59-63|Material de escalada|80",
  "64-68|Material de disfraz|50",
  "69-73|Material de curandero|50",
  "74-77|Símbolo sagrado de plata|25",
  "78-81|Reloj de arena|25",
  "82-88|Lupa|100",
  "89-95|Instrumento musical de gran calidad|100",
  "96-100|Herramientas de ladrón de gran calidad|50",
];

/** The d% faces to try for a row: its first and last. */
const edges = (cell: string) => [...new Set(range(cell.split("|")[0]))];
/**
 * The one mundane object NE 1 gives (no coins, d% 72 on the objects column)
 * when the rolls of table 3-8 are `rolls`.
 */
function mundane(...rolls: number[]) {
  const die = fixedDie(1, 1, 72, ...rolls);
  const treasure = generateTreasure(1, die);
  assert.equal(die.rest(), 0, "every planned roll must be used");
  assert.equal(treasure.items.length, 1);
  return treasure.items[0];
}
const cp = (po: string) => Math.round(Number(po) * 100);

describe("generateTreasure mundane objects (table 3-8)", () => {
  for (const cell of BOOK_ALCHEMICAL) {
    const [, name, dice, price] = cell.split("|");
    for (const face of edges(cell)) {
      it(`should give ${name} with alchemical d% ${face}`, () => {
        const [count, sides] = dice ? dice.split("d").map(Number) : [0, 0];
        const item = mundane(1, face, ...Array(count).fill(sides));
        const quantity = count * sides;

        assert.equal(item.category, "mundane");
        assert.equal(item.name, name);
        assert.equal(formatItemName(item), dice ? `${name} ×${quantity}` : name);
        assert.equal(item.valueCp, dice ? cp(price) * quantity : cp(price));
      });
    }
  }

  it("should sum the dice of a quantity", () => {
    const item = mundane(1, 13, 3, 4);

    assert.deepEqual([item.name, item.quantity, item.valueCp], ["Ácido", 7, 7000]);
  });

  for (const cell of BOOK_ARMOR) {
    const [, name, price] = cell.split("|");
    for (const face of edges(cell)) {
      for (const [size, sizeRoll] of [["Pequeña", 10], ["Mediana", 11]] as const) {
        it(`should give ${name} (${size}) with armor d% ${face}`, () => {
          const item = mundane(18, face, sizeRoll);

          assert.deepEqual([item.name, item.valueCp], [`${name} (${size})`, cp(price)]);
        });
      }
    }
  }

  for (const [label, sub, rows] of [
    ["darkwood", 85, BOOK_DARKWOOD],
    ["masterwork", 95, BOOK_MASTERWORK_SHIELDS],
  ] as const) {
    for (const cell of rows) {
      const [, name, price] = cell.split("|");
      for (const face of edges(cell)) {
        it(`should give ${name} with ${label} shield d% ${face}`, () => {
          const item = mundane(50, sub, face);

          assert.deepEqual([item.name, item.valueCp], [name, cp(price)]);
        });
      }
    }
  }

  for (const [label, sub, rows] of [
    ["7-11 common melee", 1, BOOK_COMMON_MELEE],
    ["7-12 uncommon", 51, BOOK_UNCOMMON],
  ] as const) {
    for (const cell of rows) {
      const [, name, price] = cell.split("|");
      for (const face of edges(cell)) {
        it(`should give ${name} with ${label} d% ${face}`, () => {
          const item = mundane(51, sub, face);

          assert.deepEqual([item.name, item.valueCp], [name, cp(price)]);
        });
      }
    }
  }

  for (const cell of BOOK_RANGED) {
    const [, name, price] = cell.split("|");
    for (const face of edges(cell)) {
      it(`should give ${name} with 7-13 ranged d% ${face}`, () => {
        const item = mundane(51, 100, face);

        assert.deepEqual([item.name, item.valueCp], [name, cp(price)]);
      });
    }
  }

  for (const cell of BOOK_AMMUNITION) {
    const [, name, price] = cell.split("|");
    for (const face of edges(cell)) {
      it(`should give ${name} with 7-13 ammunition d% ${face}`, () => {
        const item = mundane(51, 71, 10, face);

        assert.deepEqual([item.name, item.valueCp], [name, cp(price)]);
      });
    }
  }

  for (const cell of BOOK_TOOLS) {
    const [, name, price] = cell.split("|");
    for (const face of edges(cell)) {
      it(`should give ${name} with tools d% ${face}`, () => {
        const item = mundane(84, face);

        assert.deepEqual([item.name, item.valueCp], [name, cp(price)]);
      });
    }
  }

  it("should send each d% of table 3-8 to its branch", () => {
    const branch = (top: number, rolls: number[]) => formatItemName(mundane(top, ...rolls));

    assert.equal(branch(17, [1, 1]), "Fuego de alquimista ×1");
    assert.equal(branch(18, [1, 11]), "Camisote de mallas (Mediana)");
    assert.equal(branch(50, [91, 1]), "Broquel de gran calidad");
    assert.equal(branch(51, [50, 1]), "Bastón de gran calidad");
    assert.equal(branch(83, [100, 100]), "Arco largo compuesto (bonificador Fue +4) de gran calidad");
    assert.equal(branch(84, [1]), "Mochila, vacía");
  });

  it("should send each d% of the weapons branch to its table", () => {
    const branch = (sub: number, face: number) => mundane(51, sub, face).name;

    assert.equal(branch(50, 1), "Bastón de gran calidad");
    assert.equal(branch(51, 1), "Alabarda de gran calidad");
    assert.equal(branch(70, 1), "Alabarda de gran calidad");
    assert.equal(branch(71, 11), "Hacha arrojadiza de gran calidad");
  });
});
