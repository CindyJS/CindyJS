    return globalInstance;
    }; // end newInstance method

    return CindyJS;
    })();
    var createCindy = CindyJS; // backwards compatibility, deprecated!
    if (typeof process !== "undefined" &&
        typeof module !== "undefined" &&
        typeof module.exports !== "undefined" &&
        typeof window === "undefined")
        module.exports = CindyJS;
