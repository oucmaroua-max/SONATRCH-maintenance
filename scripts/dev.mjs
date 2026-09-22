import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONT = { name: 'front', dir: path.join(root, 'Sonatrach-bolt-main'), port: 5173 };
const BACK = { name: 'back', dir: path.join(root, 'Backend'), port: 3000 };

function pidsOnPort(port) {
  try {
    const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes(`:${port}`) || !line.includes('LISTENING')) continue;
      const pid = Number(line.trim().split(/\s+/).pop());
      if (pid > 0) pids.add(pid);
    }
    return [...pids];
  } catch { return []; }
}

function kill(pid) {
  try { execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

for (const { port } of [FRONT, BACK]) {
  for (const pid of pidsOnPort(port)) {
    if (kill(pid)) console.log(`[dev] Processus ${pid} arrêté sur le port ${port}`);
  }
}

const children = [];
let closing = false;

function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  children.forEach((c) => kill(c.pid));
  process.exit(code);
}

for (const app of [BACK, FRONT]) {
  const child = spawn('npm', ['run', 'dev'], { cwd: app.dir, stdio: 'inherit', shell: true, env: process.env });
  child.on('exit', (code) => { console.log(`[dev] ${app.name} arrêté (code ${code})`); shutdown(code ?? 0); });
  children.push(child);
}

process.on('SIGINT', () => shutdown(0));