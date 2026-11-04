# Valor aleatorio alrededor del precio de tabla

Las tablas de la DMG 3.5 dan un precio fijo a armas, armaduras, objetos mundanos y objetos mágicos (ADR-0001). Al generar un tesoro, cada uno de esos objetos recibe un valor al azar entre el 75 % y el 150 % de su precio de tabla. La tirada está sesgada para que la media quede en torno al precio de tabla (alrededor del 100,1 %) y el valor salga por debajo más a menudo (cerca del 58 % de las veces): muchos valores quedan un poco por debajo y unos pocos bastante por encima. Un d% da U = (d% − 1)/99, de 0 a 1, y el precio se multiplica por 0,75 + 0,75·U²; así los dos extremos, 75 % y 150 %, pueden salir, a cambio de esa décima de más en la media. Así, dos objetos iguales no valen siempre lo mismo y el precio de la DMG sigue siendo la referencia media. El valor se fija al generar el objeto y no vuelve a cambiar, así que lo que se anuncia en la entrega es lo mismo que queda en el inventario.

Gemas y objetos de arte no pasan por esta tirada, porque las tablas 3-6 y 3-7 ya tiran su valor con dados.

Por eso una «Coraza» cuyo precio de tabla es 200 po puede valer 163 po en un tesoro y 270 po en otro.

## Considered Options

- **Precio de tabla tal cual:** es fiel al ADR-0001, pero todos los objetos iguales valen lo mismo.
- **Tabla como techo (50 %–110 %):** casi siempre por debajo y la media queda en torno al 85 %. Trata la tabla como precio de compra y no como media.
- **Rango amplio (50 %–200 %):** la misma forma, pero con gangas y sobreprecios demasiado extremos para la economía de la mesa.
- **Tasar cada vez:** un valor nuevo en cada consulta. Se descartó porque el valor dejaría de ser una propiedad del objeto.
- **Aplicar la tirada también a gemas y arte:** sería una segunda tirada encima de unos valores que ya se tiraron con dados.
