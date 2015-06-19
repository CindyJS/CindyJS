    return globalInstance;
    }; // end newInstance method

    return createCindy;
    })();
    if (typeof process !== "undefined" &&
        typeof module !== "undefined" &&
        typeof module.exports !== "undefined" &&
        typeof window === "undefined")
        module.exports = createCindy;
