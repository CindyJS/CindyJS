var Mesh = {};

/**
 * @param {number} n
 * @return {Array<number>}
 */
Mesh.tetrakis = function(n) {
    var /** Array<number> */ mesh = [];
    for (var x = -5 * n; x < 5 * n; x++) {
        for (var y = -5 * n; y < 5 * n; y++) {
            if ((x + y) % 2 === 0) {
                mesh = mesh.concat(
                    [x, y, x + 1, y, x, y + 1, x + 1, y, x + 1, y + 1, x, y + 1]
                );
            } else {
                mesh = mesh.concat(
                    [x, y, x + 1, y + 1, x, y + 1, x, y, x + 1, y, x + 1, y + 1]
                );
            }
        }
    }
    return mesh.map(z => z / n);
};
