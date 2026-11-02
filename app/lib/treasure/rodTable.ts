import { entry, rollColumnTable, type ColumnRow } from "./columnTable";
import type { MagicResolver } from "./magicTable";

const e = entry;

/** Table 7-19: Cetros. There are no minor rods: columns Intermedio / Mayor. */
export const ROD_ROWS: readonly ColumnRow[] = [
  e("-", "01-07", "-", "Metamágico, ampliación, menor", 3000),
  e("-", "08-14", "-", "Metamágico, prolongación, menor", 3000),
  e("-", "15-21", "-", "Metamágico, silencio, menor", 3000),
  e("-", "22-28", "-", "Inamovible", 5000),
  e("-", "29-35", "-", "Metamágico, potenciación, menor", 9000),
  e("-", "36-42", "-", "Detección de metales y minerales", 10500),
  e("-", "43-53", "01-04", "Cancelación", 11000),
  e("-", "54-57", "05-06", "Metamágico, ampliación", 11000),
  e("-", "58-61", "07-08", "Metamágico, prolongación", 11000),
  e("-", "62-65", "09-10", "Metamágico, silencio", 11000),
  e("-", "66-71", "11-14", "De las maravillas", 12000),
  e("-", "72-79", "15-18", "Pitón", 13000),
  e("-", "80-83", "-", "Metamágico, maximización, menor", 14000),
  e("-", "84-89", "19-21", "Extinguellamas", 15000),
  e("-", "90-97", "22-25", "De la víbora", 19000),
  e("-", "-", "26-30", "Detección de enemigos", 23500),
  e("-", "-", "31-36", "Metamágico, ampliación, mayor", 24500),
  e("-", "-", "37-42", "Metamágico, prolongación, mayor", 24500),
  e("-", "-", "43-48", "Metamágico, silencio, mayor", 24500),
  e("-", "-", "49-53", "Magnificencia", 25000),
  e("-", "-", "54-58", "Marchitante", 25000),
  e("-", "98-99", "59-64", "Metamágico, potenciación", 32500),
  e("-", "-", "65-69", "Truenos y relámpagos", 33000),
  e("-", "100", "70-73", "Metamágico, apresuración, menor", 35000),
  e("-", "-", "74-77", "Negación", 37000),
  e("-", "-", "78-80", "Absorción", 50000),
  e("-", "-", "81-84", "Mangual", 50000),
  e("-", "-", "85-86", "Metamágico, maximización", 54000),
  e("-", "-", "87-88", "Gobierno", 60000),
  e("-", "-", "89-90", "Seguridad", 61000),
  e("-", "-", "91-92", "Poder señorial", 70000),
  e("-", "-", "93-94", "Metamágico, potenciación, mayor", 73000),
  e("-", "-", "95-96", "Metamágico, apresuración", 75000),
  e("-", "-", "97-98", "Alerta", 85000),
  e("-", "-", "99", "Metamágico, maximización", 121500),
  e("-", "-", "100", "Metamágico, apresuración, mayor", 170000),
];

export const rollRod: MagicResolver = (category, die) =>
  rollColumnTable({ table: "7-19", rows: ROD_ROWS, kind: "Cetro" }, category, die);
