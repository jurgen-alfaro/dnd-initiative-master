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

**Reparto**:
Asignación de cada moneda y objeto de un tesoro a sus PJs destinatarios. Las monedas se dividen a partes iguales; cada objeto indivisible lo asigna el DM a un PJ.

**Entrega**:
Momento en que el DM da por bueno un reparto y lo anuncia: en público si es un tesoro de party, solo al PJ si es un tesoro individual.
_Avoid_: Confirmar, publicar
