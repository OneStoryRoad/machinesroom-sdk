#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const packages = [
  {
    directory: "packages/contracts",
    name: "@machinesroom/contracts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js"
      },
      "./package.json": {
        default: "./package.json"
      }
    },
    requiredDist: ["index.js", "index.d.ts", "reward-merkle-deploy.js", "reward-merkle-distributor.js"],
    forbiddenRootImportMarkers: []
  },
  {
    directory: "packages/api-client",
    name: "@machinesroom/api-client",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js"
      },
      "./agent": {
        types: "./dist/agent.d.ts",
        import: "./dist/agent.js"
      },
      "./gate-one-policy": {
        types: "./dist/generated/gate-one-policy.generated.d.ts",
        import: "./dist/generated/gate-one-policy.generated.js"
      },
      "./gate-one-proof-graph": {
        types: "./dist/generated/gate-one-proof-graph.generated.d.ts",
        import: "./dist/generated/gate-one-proof-graph.generated.js"
      },
      "./package.json": {
        default: "./package.json"
      }
    },
    requiredDist: [
      "index.js",
      "index.d.ts",
      "agent.js",
      "agent.d.ts",
      "generated/gate-one-policy.generated.js",
      "generated/gate-one-policy.generated.d.ts",
      "generated/gate-one-proof-graph.generated.js",
      "generated/gate-one-proof-graph.generated.d.ts"
    ],
    forbiddenRootImportMarkers: ['"node:crypto"', "'node:crypto'"]
  }
];

const expectedFiles = ["dist", "README.md", "LICENSE"];
const errors = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function assertEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    errors.push(`${label} must be ${expectedJson}; found ${actualJson}`);
  }
}

function assertFileExists(relativePath) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    errors.push(`${relativePath} is required`);
  }
}

for (const sdkPackage of packages) {
  const manifestPath = path.join(sdkPackage.directory, "package.json");
  const manifest = readJson(manifestPath);
  const label = `${manifestPath} (${sdkPackage.name})`;

  if (manifest.name !== sdkPackage.name) {
    errors.push(`${label} has unexpected package name ${manifest.name ?? "<missing>"}`);
  }
  if (manifest.private === true) {
    errors.push(`${label} must not be private; external agents must be able to install it from npm`);
  }
  if (manifest.license !== "MIT") {
    errors.push(`${label} must declare MIT license`);
  }
  if (manifest.main !== "dist/index.js") {
    errors.push(`${label} main must point at dist/index.js`);
  }
  if (manifest.types !== "dist/index.d.ts") {
    errors.push(`${label} types must point at dist/index.d.ts`);
  }
  if (manifest.publishConfig?.access !== "public") {
    errors.push(`${label} publishConfig.access must be public`);
  }
  if (manifest.publishConfig?.registry !== "https://registry.npmjs.org/") {
    errors.push(`${label} publishConfig.registry must be https://registry.npmjs.org/`);
  }
  if (manifest.repository?.url !== "git+https://github.com/OneStoryRoad/machinesroom-sdk.git") {
    errors.push(`${label} repository.url must point at OneStoryRoad/machinesroom-sdk`);
  }
  if (manifest.repository?.directory !== sdkPackage.directory) {
    errors.push(`${label} repository.directory must be ${sdkPackage.directory}`);
  }
  if (manifest.engines?.node !== ">=20.19.0") {
    errors.push(`${label} engines.node must be >=20.19.0`);
  }
  if (manifest.sideEffects !== false) {
    errors.push(`${label} sideEffects must be false`);
  }
  assertEqual(manifest.files, expectedFiles, `${label} files`);
  assertEqual(manifest.exports, sdkPackage.exports, `${label} exports`);

  const tsconfig = readJson(path.join(sdkPackage.directory, "tsconfig.json"));
  if (tsconfig.compilerOptions?.declaration !== true) {
    errors.push(`${sdkPackage.directory}/tsconfig.json must emit declaration files`);
  }

  assertFileExists(path.join(sdkPackage.directory, "README.md"));
  assertFileExists(path.join(sdkPackage.directory, "LICENSE"));
  for (const distFile of sdkPackage.requiredDist) {
    assertFileExists(path.join(sdkPackage.directory, "dist", distFile));
  }

  const rootDistPath = path.join(repoRoot, sdkPackage.directory, "dist", "index.js");
  if (fs.existsSync(rootDistPath)) {
    const rootDist = fs.readFileSync(rootDistPath, "utf8");
    for (const marker of sdkPackage.forbiddenRootImportMarkers) {
      if (rootDist.includes(marker)) {
        errors.push(`${sdkPackage.directory}/dist/index.js must not import ${marker}; Node signing stays in ./agent`);
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[check:sdk-package] ${error}`);
  }
  process.exit(1);
}

console.log(`[check:sdk-package] pass packages=${packages.length}`);
