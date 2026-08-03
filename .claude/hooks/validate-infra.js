#!/usr/bin/env node
// PostToolUse hook (Edit|Write): valida sintaxis de nginx.conf y docker-compose*.yml
// justo despues de editarlos, para detectar errores antes de reiniciar contenedores.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const filePath =
  (input.tool_input && input.tool_input.file_path) ||
  (input.tool_response && input.tool_response.filePath) ||
  '';

if (!filePath) process.exit(0);

const base = path.basename(filePath);
let cmd = null;

if (/^nginx.*\.conf$/i.test(base)) {
  cmd = `docker run --rm -v "${filePath}:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t`;
} else if (/^(docker-)?compose.*\.ya?ml$/i.test(base)) {
  cmd = `docker compose -f "${filePath}" config -q`;
} else {
  process.exit(0);
}

try {
  execSync('docker info', { stdio: 'ignore' });
} catch {
  process.exit(0); // docker no disponible: no bloquear la edicion por eso
}

try {
  execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
  process.exit(0);
} catch (e) {
  const out = (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
  console.log(
    JSON.stringify({
      decision: 'block',
      reason: `Validacion de configuracion fallo para ${filePath}:\n${out}`.slice(0, 4000),
    })
  );
}
