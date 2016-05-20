    return globalInstance;
    }; // end newInstance method

    return CindyJS;
    })();
    if (typeof process !== "undefined" &&
        typeof module !== "undefined" &&
        typeof module.exports !== "undefined" &&
        typeof window === "undefined")
        module.exports = CindyJS;
