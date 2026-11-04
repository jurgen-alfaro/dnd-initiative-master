# D&D Initiative Master

Herramienta de mesa para que el DM lleve el combate de una partida de D&D y comparta con los jugadores lo que deben ver.

## Language

### Mesa

**Party**:
La sesión de juego compartida por el DM y los jugadores, identificada por un código de 6 caracteres. Contiene a todos los combatientes, tanto PJs como enemigos.
_Avoid_: Grupo, partida

**PJ**:
Combatiente de tipo jugador. Es el único que puede recibir tesoro.
_Avoid_: Personaje (a secas), player

**Enemigo**:
Combatiente controlado por el DM. Nunca recibe tesoro.
_Avoid_: Monstruo, NPC

### Tesoro

**Tesoro**:
Conjunto de monedas y objetos generado al azar con las tablas de tesoro de la DMG 3.5 a partir de un NE.
_Avoid_: Botín, loot

**NE (Nivel de Encuentro)**:
Dificultad del encuentro, de 1 a 20, que determina la fila de la tabla de tesoro.
_Avoid_: CR, nivel de desafío

**Tesoro de party**:
Tesoro que se reparte entre los PJs que el DM elige como destinatarios.

**Tesoro individual**:
Tesoro que recibe entero un único PJ.

**Descripción**:
Texto breve en español que acompaña a cada objeto de un tesoro y dice qué es o qué hace, siempre en reglas de 5e aunque el objeto venga de las tablas 3.5. Un objeto compuesto (arma o armadura con bono y aptitudes) se describe por partes: base, bono y cada aptitud.
_Avoid_: Detalle, ficha

**Valor**:
Lo que vale un objeto concreto de un tesoro, fijado al generarlo. En gemas y arte es la tirada de su tabla; en el resto se tira al azar alrededor del precio de tabla (entre el 75 % y el 150 %, con media en el precio de tabla y más a menudo por debajo).
_Avoid_: Precio (a secas), coste

**Precio de tabla**:
Precio fijo que la DMG 3.5 da a un objeto que no es gema ni arte. Es la media del valor, no el valor.

**Reparto**:
Asignación de cada moneda y objeto de un tesoro a sus PJs destinatarios. Las monedas se dividen a partes iguales; cada objeto indivisible lo asigna el DM a un PJ.

**Entrega**:
Momento en que el DM da por bueno un reparto y lo anuncia: en público si es un tesoro de party, solo al PJ si es un tesoro individual. Lo entregado pasa al inventario de cada PJ destinatario.
_Avoid_: Confirmar, publicar

### Inventario

**Inventario**:
Monedas y objetos que posee un PJ. Solo entran objetos por una entrega o porque otro PJ se los da; nadie crea objetos a mano. Lo ven el DM y el jugador que reclamó el PJ.
_Avoid_: Mochila, bolsa

**Categoría**:
Grupo en que se ordena un objeto del inventario: Armas, Armaduras y escudos, Consumibles, Objetos mágicos (anillos, cetros, bastones, varitas), Objetos maravillosos, Gemas y arte, Objetos mundanos. Un arma o armadura va a su categoría sea mágica o no.

**Consumible**:
Objeto que se gasta al usarlo: pociones, pergaminos y alquímicos (fuego de alquimista, ácido, piedra de trueno…), más cualquier otro que el DM marque como tal. Cada uso gasta una unidad; los consumibles iguales se apilan.

**Carga**:
Unidad de uso de una varita, un bastón o cualquier objeto al que el DM le fije cargas. Cada uso gasta una; solo el DM corrige cuántas quedan. Sin cargas el objeto sigue en el inventario hasta que el DM decida qué pasa con él.

**Uso**:
Momento en que el jugador gasta una unidad de un consumible o una carga. Genera un aviso para el DM, que aplica el efecto; la app no lo resuelve.

**Actividad**:
Lista de avisos de un PJ: uno por cada cambio que el jugador hace en su inventario (usos, ajustes de monedas, objetos quitados o dados a otro PJ). Solo la ve el DM; los cambios que hace el propio DM o una entrega no generan aviso.
_Avoid_: Notificaciones, historial, log
