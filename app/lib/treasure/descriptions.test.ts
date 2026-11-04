import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ART_TABLE } from "./artTable";
import type { ColumnRow } from "./columnTable";
import { RING_ROWS } from "./ringTable";
import { ROD_ROWS } from "./rodTable";
import { POTION_ROWS } from "./potionTable";
import { SCROLL_SPELL_TABLES } from "./scrollSpellTable";
import {
  describePotion,
  describeScroll,
  describeWand,
  SPELL_DESCRIPTIONS,
  spellOf,
} from "./spellDescriptions";
import { STAFF_ROWS } from "./staffTable";
import { WAND_ROWS } from "./wandTable";
import { WONDROUS_DESCRIPTIONS } from "./wondrousDescriptions";
import { WONDROUS_TABLES } from "./wondrousTable";
import {
  ARMOR_ABILITY_DESCRIPTIONS,
  describeMundane,
  MUNDANE_DESCRIPTIONS,
  RING_DESCRIPTIONS,
  ROD_DESCRIPTIONS,
  SPECIFIC_DESCRIPTIONS,
  STAFF_DESCRIPTIONS,
  VALUABLE_DESCRIPTIONS,
  WEAPON_ABILITY_DESCRIPTIONS,
  type Descriptions,
} from "./descriptions";
import { GEM_TABLE } from "./gemTable";
import {
  ARMOR_ABILITIES,
  BASE_TYPES,
  SHIELD_ABILITIES,
  SPECIFIC,
} from "./magicArmorTable";
import type { AbilityRow } from "./magicGear";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import {
  MELEE_ABILITIES,
  RANGED_ABILITIES,
  SPECIFIC_WEAPONS,
} from "./magicWeaponTable";
import {
  COMMON_MELEE,
  MUNDANE_TABLE,
  RANGED_WEAPONS,
  UNCOMMON_WEAPONS,
  type Node,
} from "./mundaneTable";
import { fixedDie } from "./testDice";
import { formatItemEntry, generateTreasure, TreasureItemSchema } from "./treasure";

/** Every object at the bottom of a table and of the tables it nests. */
const leaves = <Leaf,>(rows: readonly Node<Leaf>[]): Leaf[] =>
  rows.flatMap((row) => ("rows" in row ? leaves(row.rows) : [row.item]));

/** Feminine name of every ability of a table, in every category. */
const abilityNames = (tables: Record<MagicCategory, readonly AbilityRow[]>[]) =>
  new Set(
    tables.flatMap((rows) =>
      Object.values(rows).flatMap((column) =>
        column.flatMap(({ ability }) =>
          ability === "rollTwice" ? [] : [ability.name.feminine],
        ),
      ),
    ),
  );

const without = (names: Iterable<string>, texts: Descriptions) =>
  [...names].filter((name) => texts[name] === undefined);

const MASTERWORK_SUFFIX = " de gran calidad";
const mundaneNames = leaves(MUNDANE_TABLE).map((leaf) => leaf.name);
const gearNames = [
  ...[COMMON_MELEE, UNCOMMON_WEAPONS, RANGED_WEAPONS].flatMap((rows) =>
    leaves(rows).map((weapon) => weapon.name),
  ),
  ...Object.values(BASE_TYPES).flatMap(({ rows }) => rows.map((r) => r.name)),
];

describe("descriptions", () => {
  it("should describe every gem and art object, with no text left over", () => {
    const names = new Set(
      [...GEM_TABLE, ...ART_TABLE].flatMap((row) => row.names),
    );

    assert.deepEqual(without(names, VALUABLE_DESCRIPTIONS), []);
    assert.deepEqual(
      Object.keys(VALUABLE_DESCRIPTIONS).filter((key) => !names.has(key)),
      [],
    );
  });

  it("should describe every mundane object and base of the magic gear, with no text left over", () => {
    assert.deepEqual(
      mundaneNames.filter((name) => describeMundane(name) === undefined),
      [],
    );
    assert.deepEqual(without(gearNames, MUNDANE_DESCRIPTIONS), []);

    const used = new Set([
      ...gearNames,
      ...mundaneNames,
      ...mundaneNames.map((name) => name.replace(MASTERWORK_SUFFIX, "")),
    ]);
    assert.deepEqual(
      Object.keys(MUNDANE_DESCRIPTIONS).filter((key) => !used.has(key)),
      [],
    );
  });

  it("should describe every special ability, with no text left over", () => {
    const pairs: [Set<string>, Descriptions][] = [
      [abilityNames([MELEE_ABILITIES, RANGED_ABILITIES]), WEAPON_ABILITY_DESCRIPTIONS],
      [abilityNames([ARMOR_ABILITIES, SHIELD_ABILITIES]), ARMOR_ABILITY_DESCRIPTIONS],
    ];
    for (const [names, texts] of pairs) {
      assert.deepEqual(without(names, texts), []);
      assert.deepEqual(Object.keys(texts).filter((key) => !names.has(key)), []);
    }
  });

  it("should describe every specific weapon, armor and shield, with no text left over", () => {
    const names = new Set(
      [SPECIFIC_WEAPONS, SPECIFIC.armor.rows, SPECIFIC.shield.rows].flatMap(
        (columns) => Object.values(columns).flatMap((rows) => rows.map((r) => r.name)),
      ),
    );

    assert.deepEqual(without(names, SPECIFIC_DESCRIPTIONS), []);
    assert.deepEqual(
      Object.keys(SPECIFIC_DESCRIPTIONS).filter((key) => !names.has(key)),
      [],
    );
  });

  it("should describe every ring, rod and staff, with no text left over", () => {
    const tables: [readonly ColumnRow[], Descriptions][] = [
      [RING_ROWS, RING_DESCRIPTIONS],
      [ROD_ROWS, ROD_DESCRIPTIONS],
      [STAFF_ROWS, STAFF_DESCRIPTIONS],
    ];
    for (const [rows, texts] of tables) {
      const names = new Set(rows.map((row) => row.name));
      assert.deepEqual(without(names, texts), []);
      assert.deepEqual(Object.keys(texts).filter((key) => !names.has(key)), []);
    }
  });

  it("should describe every wondrous object, with no text left over", () => {
    const names = new Set(
      Object.values(WONDROUS_TABLES).flatMap((rows) => rows.map((r) => r.name)),
    );

    assert.deepEqual(without(names, WONDROUS_DESCRIPTIONS), []);
    assert.deepEqual(
      Object.keys(WONDROUS_DESCRIPTIONS).filter((key) => !names.has(key)),
      [],
    );
  });

  it("should describe every spell of scrolls, potions and wands, with no text left over", () => {
    const scrollSpells = Object.values(SCROLL_SPELL_TABLES).flatMap((levels) =>
      levels.flatMap((rows) => rows.map((row) => row.name)),
    );
    const potionAndWandSpells = [...POTION_ROWS, ...WAND_ROWS].map((row) => spellOf(row.name));

    assert.deepEqual(without(scrollSpells, SPELL_DESCRIPTIONS), []);
    assert.deepEqual(without(potionAndWandSpells, SPELL_DESCRIPTIONS), []);
    const used = new Set([...scrollSpells, ...potionAndWandSpells]);
    assert.deepEqual(Object.keys(SPELL_DESCRIPTIONS).filter((key) => !used.has(key)), []);
  });

  it("should describe a potion and a wand by their spell, with how they are used", () => {
    const [potionUse, potionSpell] = (describePotion("Escudo de la fe +3 (poción)") ?? "").split("\n");
    const [wandUse, wandSpell] = (describeWand("Bola de fuego (10.°)") ?? "").split("\n");

    assert.match(potionUse, /^Quien la bebe/);
    assert.equal(potionSpell, SPELL_DESCRIPTIONS["Escudo de la fe"]);
    assert.match(wandUse, /^Con una acción gastas una carga/);
    assert.equal(wandSpell, SPELL_DESCRIPTIONS["Bola de fuego"]);
  });

  it("should describe each spell of a scroll once, after how it is used", () => {
    // Minor divine scroll with Conocer la dirección, Alarma and Augurio, as in
    // the scroll tests.
    const item = rollMagicItem("minor", fixedDie(50, 71, 3, 1, 1, 6, 1, 51, 7));

    assert.deepEqual(item.description?.split("\n").slice(1), [
      `Conocer la dirección: ${SPELL_DESCRIPTIONS["Conocer la dirección"]}`,
      `Alarma: ${SPELL_DESCRIPTIONS["Alarma"]}`,
      `Augurio: ${SPELL_DESCRIPTIONS["Augurio"]}`,
    ]);
    assert.equal(describeScroll(["Alarma", "Alarma"])?.split("\n").length, 2);
  });

  it("should fit the item schema with a scroll of the six longest spell texts", () => {
    const longest = Object.keys(SPELL_DESCRIPTIONS)
      .sort((a, b) => (SPELL_DESCRIPTIONS[b]?.length ?? 0) - (SPELL_DESCRIPTIONS[a]?.length ?? 0))
      .slice(0, 6);

    const parsed = TreasureItemSchema.shape.description.safeParse(describeScroll(longest));

    assert.equal(parsed.success, true);
  });

  it("should describe a bag of tricks without its animal", () => {
    // Table 7-1 minor 100 → Objetos maravillosos → 7-27 18 Bolsa de trucos
    // (gris) → animal 1 Murciélago.
    const item = rollMagicItem("minor", fixedDie(100, 18, 1));

    assert.equal(item.name, "Bolsa de trucos (gris): Murciélago");
    assert.equal(item.description, WONDROUS_DESCRIPTIONS["Bolsa de trucos (gris)"]);
  });

  it("should describe a staff by the name its table prints, charges aside", () => {
    // Table 7-1 medium 67 → Bastones → 7-18 medium 16-30 Fuego → 1d50 = 12.
    const item = rollMagicItem("medium", fixedDie(67, 20, 12));

    assert.equal(item.name, "Bastón: Fuego (12 cargas)");
    assert.equal(item.description, STAFF_DESCRIPTIONS["Fuego"]);
  });

  it("should give a specific object its whole description", () => {
    // Table 7-1 medium 15 → Armas → 7-9 medium 63-68 → 7-16 medium 67-74.
    const item = rollMagicItem("medium", fixedDie(15, 63, 70));

    assert.equal(item.name, "Lengua flamígera");
    assert.equal(item.description, SPECIFIC_DESCRIPTIONS["Lengua flamígera"]);
  });

  it("should describe a masterwork object as its base plus a masterwork line", () => {
    const [base, masterwork] = (describeMundane("Espada larga de gran calidad") ?? "").split("\n");

    assert.equal(base, MUNDANE_DESCRIPTIONS["Espada larga"]);
    assert.match(masterwork, /^De gran calidad:/);
  });

  it("should describe a magic weapon by its base, its bonus and each ability", () => {
    // Table 7-1 medium 15 → Armas; same rolls as the weapon tests:
    // Espada larga +2 flamígera.
    const item = rollMagicItem("medium", fixedDie(15, 70, 15, 1, 30, 15));

    assert.equal(item.name, "Espada larga +2 flamígera");
    assert.deepEqual(item.description?.split("\n"), [
      MUNDANE_DESCRIPTIONS["Espada larga"],
      "+2 a las tiradas de ataque y de daño.",
      `Flamígera: ${WEAPON_ABILITY_DESCRIPTIONS["Flamígera"]}`,
    ]);
  });

  it("should add the second head of a double weapon", () => {
    // Bastón +2 flamígero/+1, as in the weapon tests.
    const item = rollMagicItem("medium", fixedDie(15, 70, 15, 1, 1, 15, 51));

    assert.deepEqual(item.description?.split("\n").slice(2), [
      `Flamígero: ${WEAPON_ABILITY_DESCRIPTIONS["Flamígera"]}`,
      "Segundo extremo: +1.",
    ]);
  });

  it("should list an item's description indented below it in announcements", () => {
    // NE 1: no coins (d% 1), no gems (1), objects 72 → 1 mundane → table 3-8
    // 18 armor → 19 Coraza → size 11 Mediana → valor d% 100 (150 %).
    const [item] = generateTreasure(1, fixedDie(1, 1, 72, 18, 19, 11, 100)).items;

    assert.equal(
      formatItemEntry(item),
      `- Coraza (Mediana) (300 po)\n  ${MUNDANE_DESCRIPTIONS["Coraza"]}`,
    );
  });

  it("should list an item without a description as a single line", () => {
    assert.equal(
      formatItemEntry({ category: "minor", name: "Varita", valueCp: 100, rolls: [] }),
      "- Varita (1 po)",
    );
  });
});
