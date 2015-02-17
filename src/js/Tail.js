    return globalInstance;}; // end newInstance method

    return createCindy;
})();
var defaultAppearance = {
    clip: "none",
    pointColor: [1,0,0],
    lineColor: [0,0,1],
    pointSize: 5,
    lineSize: 2,
    alpha: 1,
    overhangLine: 1.1,
    overhangSeg: 1,
    dimDependent: 1
};
if (typeof process !== "undefined" &&
    typeof module !== "undefined" &&
    typeof module.exports !== "undefined" &&
    typeof window === "undefined")
    module.exports = createCindy;
