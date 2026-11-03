import { entry, rollColumnTable, type ColumnRow } from "./columnTable";
import { RING_DESCRIPTIONS } from "./descriptions";
import type { MagicResolver } from "./magicTable";

const e = entry;

/**
 * Table 7-17: Anillos, columns Menor / Intermedio / Mayor.
 *
 * NOTE: in the capture "Caminar sobre las aguas" prints Intermedio "—" and
 * Mayor "04", which leaves Intermedio 62-66 with no ring and makes Mayor 04
 * overlap "Protección +3" (03-07). Read as Intermedio 62-66 and no Mayor.
 */
export const RING_ROWS: readonly ColumnRow[] = [
  e("01-18", "-", "-", "Protección +1", 2000),
  e("19-28", "-", "-", "Caída de pluma", 2200),
  e("29-36", "-", "-", "Sustento", 2500),
  e("37-44", "-", "-", "Escalada", 2500),
  e("45-52", "-", "-", "Salto", 2500),
  e("53-60", "-", "-", "Nadar", 2500),
  e("61-70", "01-05", "-", "Contraconjuros", 4000),
  e("71-75", "06-08", "-", "Escudo mental", 8000),
  e("76-80", "09-18", "-", "Protección +2", 8000),
  e("81-85", "19-23", "-", "Escudo de fuerza", 8500),
  e("86-90", "24-28", "-", "Ariete", 8600),
  e("-", "29-34", "-", "Escalada, mejorado", 10000),
  e("-", "35-40", "-", "Salto, mejorado", 10000),
  e("-", "41-46", "-", "Nadar, mejorado", 10000),
  e("91-93", "47-51", "-", "Amistad con los animales", 10800),
  e("94-96", "52-56", "01-02", "Resistir energía, menor", 12000),
  e("97-98", "57-61", "-", "Poder camaleónico", 12700),
  e("99-100", "62-66", "-", "Caminar sobre las aguas", 15000),
  e("-", "67-71", "03-07", "Protección +3", 18000),
  e("-", "72-76", "08-10", "Almacenar conjuros, menor", 18000),
  e("-", "77-81", "11-15", "Invisibilidad", 20000),
  e("-", "82-85", "16-19", "Magia (I)", 20000),
  e("-", "86-90", "20-25", "Evasión", 25000),
  e("-", "91-93", "26-28", "Visión de rayos X", 25000),
  e("-", "94-97", "29-32", "Intermitencia", 27000),
  e("-", "98-100", "33-39", "Resistir energía, mayor", 28000),
  e("-", "-", "40-49", "Protección +4", 32000),
  e("-", "-", "50-55", "Magia (II)", 40000),
  e("-", "-", "56-60", "Libertad de movimiento", 40000),
  e("-", "-", "61-63", "Resistir energía, superior", 44000),
  e("-", "-", "64-65", "Escudar al amigo (pareja)", 50000),
  e("-", "-", "66-70", "Protección +5", 50000),
  e("-", "-", "71-74", "Estrellas fugaces", 50000),
  e("-", "-", "75-79", "Almacenar conjuros", 50000),
  e("-", "-", "80-83", "Magia (III)", 70000),
  e("-", "-", "84-86", "Telecinesis", 75000),
  e("-", "-", "87-88", "Regeneración", 90000),
  e("-", "-", "89", "Tres deseos", 97950),
  e("-", "-", "90-92", "Retornar conjuros", 98280),
  e("-", "-", "93-94", "Magia (IV)", 100000),
  e("-", "-", "95", "Llamar djinni", 125000),
  e("-", "-", "96", "Comandar elementales de aire", 200000),
  e("-", "-", "97", "Comandar elementales de tierra", 200000),
  e("-", "-", "98", "Comandar elementales de fuego", 200000),
  e("-", "-", "99", "Comandar elementales de agua", 200000),
  e("-", "-", "100", "Almacenar conjuros, mayor", 200000),
];

export const rollRing: MagicResolver = (category, die) =>
  rollColumnTable(
    { table: "7-17", rows: RING_ROWS, kind: "Anillo", descriptions: RING_DESCRIPTIONS },
    category,
    die,
  );
