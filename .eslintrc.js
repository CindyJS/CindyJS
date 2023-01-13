module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
        mocha: true,
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
        "no-unused-vars": ["off"],
        "no-prototype-builtins": ["off"],
        "no-constant-condition": ["off"],
        "no-useless-escape": ["off"],
    },
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            plugins: ["@typescript-eslint"],
            extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                project: ["./tsconfig.json"],
            },
            rules: {
                "@typescript-eslint/no-explicit-any": ["off"],
            },
        },
    ],
};
