// El repo es público: estos tests impiden publicar documentos internos.
// Patrones sensibles adicionales (uno por línea, regex) en `.private-patterns`, que está en
// .gitignore; si no existe (p. ej. en CI) esa comprobación se omite.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).trim().split('\n');

const INTERNAL_FILES = [/^BRIEF\.md$/, /^privacidad\.txt$/, /^DEVELOPMENT\.md$/, /^AGENTS\.md$/, /^CLAUDE\.md$/, /^DESIGN\.md$/, /^\.vscode\//, /^\.claude\//, /^\.private-patterns$/, /^\.agents\//, /^skills-lock\.json$/, /(^|\/)\.env/];

const PATTERNS_FILE = join(ROOT, '.private-patterns');
const privatePatterns = existsSync(PATTERNS_FILE)
  ? readFileSync(PATTERNS_FILE, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => new RegExp(l, 'i'))
  : [];

describe('higiene del repo público', () => {
  it('no versiona documentos internos ni configuración local', () => {
    expect(tracked.filter((f) => INTERNAL_FILES.some((re) => re.test(f)))).toEqual([]);
  });

  it('el README no expone detalles del entorno local', () => {
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
    expect(readme).not.toMatch(/localhost|npm run|node_modules/i);
  });

  it.skipIf(privatePatterns.length === 0)('ningún fichero versionado contiene patrones privados', () => {
    const textFiles = tracked.filter((f) => !/\.(png|jpe?g|webp|avif|ico)$|package-lock\.json$/.test(f));
    const hits = textFiles.flatMap((f) => {
      const content = readFileSync(join(ROOT, f), 'utf8');
      return privatePatterns.filter((re) => re.test(content)).map((re) => `${f}: ${re.source}`);
    });
    expect(hits).toEqual([]);
  });
});
