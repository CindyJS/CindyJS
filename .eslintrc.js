module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: "eslint:recommended",
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
        ClipperLib: true,
        enableInlineVideo: true,
        WebKitMutationObserver: true,
        version: true,
        generateId: true,
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
    },
    rules: {
        // "no-undef": ["off"],
        "no-unused-vars": ["off"],
        "no-prototype-builtins": ["off"],
        "no-constant-condition": ["off"],
        "no-useless-escape": ["off"],
    },
};
