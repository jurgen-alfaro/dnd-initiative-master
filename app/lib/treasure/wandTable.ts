import { entry, rollColumnTable, type ColumnRow } from "./columnTable";
import type { MagicResolver } from "./magicTable";

const e = entry;

/**
 * Table 7-26: Varitas, columns Menor / Intermedia / Mayor.
 *
 * NOTE: in the capture "Telaraña" prints Intermedia "—" and Mayor "26-27",
 * which leaves Intermedia 58-59 with no wand and makes Mayor 26-27 overlap
 * "Sugestión". Read as Intermedia 58-59 and no Mayor.
 *
 * NOTE: "Rayo relampagueante (5.°)" (mayor 20-21) prints 13.500 po, the price
 * of the 6th-level ones; it uses 11.250 po like "Bola de fuego (5.°)", as the
 * author chose.
 */
export const WAND_ROWS: readonly ColumnRow[] = [
  e("01-02", "-", "-", "Detectar magia", 375),
  e("03-04", "-", "-", "Luz", 375),
  e("05-07", "-", "-", "Manos ardientes", 750),
  e("08-10", "-", "-", "Hechizar animal", 750),
  e("11-13", "-", "-", "Hechizar persona", 750),
  e("14-16", "-", "-", "Rociada de color", 750),
  e("17-19", "-", "-", "Curar heridas leves", 750),
  e("20-22", "-", "-", "Detectar puertas secretas", 750),
  e("23-25", "-", "-", "Agrandar persona", 750),
  e("26-28", "-", "-", "Proyectil mágico (1.°)", 750),
  e("29-31", "-", "-", "Contacto electrizante", 750),
  e("32-34", "-", "-", "Convocar monstruo I", 750),
  e("35-36", "-", "-", "Proyectil mágico (3.°)", 2250),
  e("37", "01-03", "-", "Proyectil mágico (5.°)", 3750),
  e("38-40", "04-07", "-", "Resistencia de oso", 4500),
  e("41-43", "08-11", "-", "Fuerza de toro", 4500),
  e("44-46", "12-15", "-", "Gracia felina", 4500),
  e("47-49", "16-20", "-", "Curar heridas moderadas", 4500),
  e("50-51", "21-22", "-", "Oscuridad", 4500),
  e("52-54", "23-24", "-", "Luz del día", 4500),
  e("55-57", "25-27", "-", "Lentificar veneno", 4500),
  e("58-60", "28-31", "-", "Esplendor de águila", 4500),
  e("61-63", "32-33", "-", "Falsa vida", 4500),
  e("64-66", "34-37", "-", "Astucia de zorro", 4500),
  e("67-68", "38", "-", "Toque de necrófago", 4500),
  e("69-71", "39", "-", "Inmovilizar persona", 4500),
  e("72-74", "40-42", "-", "Invisibilidad", 4500),
  e("75-77", "43-44", "-", "Apertura", 4500),
  e("78-80", "45", "-", "Levitar", 4500),
  e("81-83", "46-47", "-", "Flecha ácida de Melf", 4500),
  e("84-86", "48-49", "-", "Imagen múltiple", 4500),
  e("87-89", "50-53", "-", "Sabiduría de búho", 4500),
  e("90-91", "54", "-", "Estallar", 4500),
  e("92-94", "55-56", "-", "Silencio", 4500),
  e("95-97", "57", "-", "Convocar monstruo II", 4500),
  e("98-100", "58-59", "-", "Telaraña", 4500),
  e("-", "60-62", "01-02", "Proyectil mágico (7.°)", 5250),
  e("-", "63-64", "03-05", "Proyectil mágico (9.°)", 6750),
  e("-", "65-67", "06-07", "Llamar al relámpago (5.°)", 11250),
  e("-", "68", "08", "Hechizar persona, intensificado (conjuro 3.er nivel)", 11250),
  e("-", "69-70", "09-10", "Contagio", 11250),
  e("-", "71-74", "11-13", "Curar heridas graves", 11250),
  e("-", "75-77", "14-15", "Disipar magia", 11250),
  e("-", "78-81", "16-17", "Bola de fuego (5.°)", 11250),
  e("-", "82-83", "18-19", "Afiladura", 11250),
  e("-", "84-87", "20-21", "Rayo relampagueante (5.°)", 11250),
  e("-", "88-89", "22-23", "Imagen mayor", 11250),
  e("-", "90-91", "24-25", "Ralentizar", 11250),
  e("-", "92-94", "26-27", "Sugestión", 11250),
  e("-", "95-97", "28-29", "Convocar monstruo III", 11250),
  e("-", "98", "30-31", "Bola de fuego (6.°)", 13500),
  e("-", "99", "32-33", "Rayo relampagueante (6.°)", 13500),
  e("-", "100", "34-35", "Luz abrasadora (6.°)", 13500),
  e("-", "-", "36-37", "Llamar al relámpago (8.°)", 13500),
  e("-", "-", "38-39", "Bola de fuego (8.°)", 18000),
  e("-", "-", "40-41", "Rayo relampagueante (8.°)", 18000),
  e("-", "-", "42-45", "Hechizar monstruo", 21000),
  e("-", "-", "46-50", "Curar heridas críticas", 21000),
  e("-", "-", "51-52", "Ancla dimensional", 21000),
  e("-", "-", "53-55", "Miedo", 21000),
  e("-", "-", "56-59", "Invisibilidad mayor", 21000),
  e("-", "-", "60", "Inmovilizar persona, intensificado (4.° nivel)", 21000),
  e("-", "-", "61-65", "Tormenta de hielo", 21000),
  e("-", "-", "66-68", "Infligir heridas críticas", 21000),
  e("-", "-", "69-72", "Neutralizar veneno", 21000),
  e("-", "-", "73-74", "Veneno", 21000),
  e("-", "-", "75-77", "Polimorfarse", 21000),
  e("-", "-", "78", "Rayo de debilitamiento, intensificado (4.° nivel)", 21000),
  e("-", "-", "79", "Sugestión, intensificado (4.° nivel)", 21000),
  e("-", "-", "80-82", "Convocar monstruo IV", 21000),
  e("-", "-", "83-86", "Muro de fuego", 21000),
  e("-", "-", "87-90", "Muro de hielo", 21000),
  e("-", "-", "91", "Disipar magia (10.°)", 22500),
  e("-", "-", "92", "Bola de fuego (10.°)", 22500),
  e("-", "-", "93", "Rayo relampagueante (10.°)", 22500),
  e("-", "-", "94", "Martillo del caos (8.°)", 24000),
  e("-", "-", "95", "Castigo divino (8.°)", 24000),
  e("-", "-", "96", "Ira del orden (8.°)", 24000),
  e("-", "-", "97", "Azote sacrílego (8.°)", 24000),
  e("-", "-", "98-99", "Restablecimiento", 26000),
  e("-", "-", "100", "Piel pétrea", 33500),
];

export const rollWand: MagicResolver = (category, die) =>
  rollColumnTable(
    { table: "7-26", rows: WAND_ROWS, kind: "Varita", isCharged: true },
    category,
    die,
  );
