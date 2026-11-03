import { entry, rollColumnTable, type ColumnRow } from "./columnTable";
import type { MagicResolver } from "./magicTable";

const e = entry;

/** Table 7-18: Bastones. There are no minor staffs: columns Intermedio / Mayor. */
export const STAFF_ROWS: readonly ColumnRow[] = [
  e("-", "01-15", "01-03", "Hechizador", 16500),
  e("-", "16-30", "04-09", "Fuego", 17750),
  e("-", "31-40", "10-11", "Enjambre de insectos", 24750),
  e("-", "41-60", "12-17", "Curación", 27750),
  e("-", "61-75", "18-19", "Cambio de tamaño", 29000),
  e("-", "76-90", "20-24", "Iluminador", 48250),
  e("-", "91-95", "25-31", "Escarcha", 56250),
  e("-", "96-100", "32-38", "Defensa", 58250),
  e("-", "-", "39-43", "Abjuración", 65000),
  e("-", "-", "44-48", "Conjuración", 65000),
  e("-", "-", "49-53", "Encantamiento", 65000),
  e("-", "-", "54-58", "Evocación", 65000),
  e("-", "-", "59-63", "Ilusión", 65000),
  e("-", "-", "64-68", "Nigromancia", 65000),
  e("-", "-", "69-73", "Transmutación", 65000),
  e("-", "-", "74-77", "Adivinación", 73500),
  e("-", "-", "78-82", "Tierra y piedra", 80500),
  e("-", "-", "83-87", "De los bosques", 101250),
  e("-", "-", "88-92", "Vida", 155750),
  e("-", "-", "93-97", "Paso", 170500),
  e("-", "-", "98-100", "Poder", 211000),
];

export const rollStaff: MagicResolver = (category, die) =>
  rollColumnTable(
    { table: "7-18", rows: STAFF_ROWS, kind: "Bastón", isCharged: true },
    category,
    die,
  );
