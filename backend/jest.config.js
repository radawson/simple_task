export default {
    testEnvironment: 'node',
    transform: {},
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testMatch: [
        "**/src/tests/**/*.js",
        "**/src/tests/**/?(*.)+(spec|test).js"
    ],
    setupFilesAfterEnv: ["./src/tests/setup.js"],
    testTimeout: 10000,
    verbose: true,
    forceExit: true,
    // Add this to ensure proper module resolution
    moduleDirectories: ['node_modules'],
    // Add this to handle JSON imports in tests
    transformIgnorePatterns: [
        "node_modules/(?!(module-that-needs-transformation)/)"
    ]
};