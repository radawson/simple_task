// jest.config.mjs
export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: [
        "**/src/tests/**/*.test.js",
        "**/src/tests/**/*.spec.js"
    ],
    setupFilesAfterEnv: ["./src/tests/setup.js"],
    testTimeout: 10000,
    verbose: true,
    forceExit: true,
    moduleDirectories: ['node_modules'],
    transformIgnorePatterns: [
        "node_modules/(?!(module-that-needs-transformation)/)"
    ],
    extensionsToTreatAsEsm: ['.js'],
    moduleFileExtensions: ['js'],
    testRunner: 'jest-circus/runner',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    }
}