const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const excluded = new Set([
  '.git', '.github', 'node_modules', 'www', 'android', 'ios',
  '.vercel', '.firebase', 'scripts'
]);

function copyDir(src, dest, isRoot = false) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (isRoot && excluded.has(entry.name)) continue;
    if (entry.name === '.DS_Store' || entry.name === 'package-lock.json') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to, false);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

fs.rmSync(out, { recursive: true, force: true });
copyDir(root, out, true);
console.log('Copied Remon website files to www/ for Capacitor.');
