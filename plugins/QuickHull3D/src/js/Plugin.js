CindyJS.registerPlugin(1, "QuickHull3D", function(api) {
    api.defineFunction("convexhull3d", 1, function(args) {
        var pointsList = api.evaluateAndVal(args[0]);
        var length = pointsList.value.length;
        var points = [];
        var hull, coordinates, point;

        for (var i = 0; i < length; i++) {
            coordinates = pointsList.value[i].value;

            points.push(new Vector(coordinates[0].value.real,
                                   coordinates[1].value.real,
                                   coordinates[2].value.real));
        }

        hull = new QuickHull3D();
        hull.build(points);

        var vertices = {
            ctype: "list",
            value: hull.getVertices()
        };

        var faces = {
            ctype: "list",
            value: hull.getFaces()
        };

        return {
            ctype: "list",
            value: [vertices, faces]
        };
    });
});
