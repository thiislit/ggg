#!/usr/bin/env node
/**
 * Propaga la versión de package.json (única fuente de verdad) a:
 *   - www/src/constants/version.js  (texto del menú)
 *   - android/app/build.gradle      (versionName / versionCode)
 *   - ios/App/App.xcodeproj         (MARKETING_VERSION / CURRENT_PROJECT_VERSION)
 *
 * Uso habitual: `npm version patch|minor|major` (lo ejecuta el hook "version").
 * También se puede lanzar a mano: `npm run version:sync`.
 *
 * versionCode = major*10000 + minor*100 + patch  (1.1.0 -> 10100), siempre creciente.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const write = (path, content) => writeFileSync(join(root, path), content);

const { version } = JSON.parse(read('package.json'));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
if (!match) {
    console.error(`Versión no soportada en package.json: "${version}" (se espera X.Y.Z)`);
    process.exit(1);
}
const [major, minor, patch] = match.slice(1).map(Number);
if (minor > 99 || patch > 99) {
    console.error('minor y patch deben ser <= 99 para calcular versionCode');
    process.exit(1);
}
const versionCode = major * 10000 + minor * 100 + patch;

function replaceOrFail(path, pattern, replacement) {
    const before = read(path);
    if (!pattern.test(before)) {
        console.error(`No se encontró el campo de versión en ${path}`);
        process.exit(1);
    }
    write(path, before.replace(pattern, replacement));
}

write(
    'www/src/constants/version.js',
    `// Generado por scripts/sync-version.mjs desde package.json. No editar a mano.\nexport const APP_VERSION = '${version}';\n`
);
replaceOrFail('android/app/build.gradle', /versionCode \d+/, `versionCode ${versionCode}`);
replaceOrFail('android/app/build.gradle', /versionName "[^"]*"/, `versionName "${version}"`);
replaceOrFail(
    'ios/App/App.xcodeproj/project.pbxproj',
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${version};`
);
replaceOrFail(
    'ios/App/App.xcodeproj/project.pbxproj',
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${versionCode};`
);

process.stdout.write(`Versión ${version} (code ${versionCode}) aplicada a web, Android e iOS.\n`);
