export default {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    testMatch: ["**/tests/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup/setup.ts"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/index.ts",
        "!src/types/**/*.ts",
        "!src/config/db.ts",
        "!src/config/swagger.ts",
        "!src/utils/handleLogger.ts"
    ],
    coverageReporters: ["text"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "tsconfig.test.json"
            }
        ]
    }
};