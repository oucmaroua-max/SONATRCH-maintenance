import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 5173;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'Sonatrach-bolt-main');

function pidsOnPort(port) {
  try {
    const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes(`:${port}`) || !line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (pid > 0) pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function killPids(pids) {
  for (const pid of pids) {
    try {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      console.log(`[dev] Stopped stale process ${pid} on port ${PORT}`);
    } catch {
      // already gone
    }
  }
}

killPids(pidsOnPort(PORT));

const child = spawn(
  'npm',
  ['run', 'dev', '--prefix', appDir],
  { cwd: appDir, stdio: 'inherit', shell: true, env: process.env },
);

child.on('exit', (code) => process.exit(code ?? 0));
