import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'auto-start-backend',
      configureServer(server) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const backendDir = path.resolve(__dirname, '..', 'backend');
        const backendHost = '127.0.0.1';
        const backendPort = 8000;

        let backendProcess = null;
        let backendStarting = null;

        const stopBackend = async () => {
          const proc = backendProcess;
          backendProcess = null;
          backendStarting = null;

          if (!proc) {
            // If we didn't start it (e.g. Vite restarted), fall back to killing whatever
            // is listening on the expected port, but only if it looks like our backend.
            if (process.platform === 'win32') {
              try {
                const netstatOut = execSync(`netstat -ano -p tcp | findstr :${backendPort}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf-8');
                const lines = netstatOut.split(/\r?\n/).filter(Boolean);
                const listeningLines = lines.filter((l) => l.includes('LISTENING'));
                const pids = Array.from(
                  new Set(
                    listeningLines
                      .map((l) => l.trim().split(/\s+/).slice(-1)[0])
                      .filter((x) => /^\d+$/.test(x))
                  )
                );

                if (pids.length > 0) {
                  let killedAny = false;
                  for (const pid of pids) {
                    const wmicOut = execSync(
                      `wmic process where ProcessId=${pid} get Name,CommandLine /value`,
                      { stdio: ['ignore', 'pipe', 'ignore'] }
                    ).toString('utf-8');

                    const looksLikeOurs = /server\.py/i.test(wmicOut);
                    if (!looksLikeOurs) continue;

                    execSync(`taskkill /PID ${pid} /T /F`, { stdio: ['ignore', 'ignore', 'ignore'] });
                    killedAny = true;
                  }

                  if (killedAny) return { stopped: true, message: 'Backend stopped.' };
                  return { stopped: false, message: 'Port 8000 is in use, but not by this backend.' };
                }
              } catch {
                // ignore and fall through
              }
            }

            return { stopped: false, message: 'Backend not running (started by this dev server).' };
          }

          // Try a graceful stop first.
          try {
            proc.kill('SIGTERM');
          } catch {
            // ignore
          }

          const exitedGracefully = await new Promise((resolve) => {
            let done = false;
            const timer = setTimeout(() => {
              if (done) return;
              done = true;
              resolve(false);
            }, 3000);

            proc.once('exit', () => {
              if (done) return;
              done = true;
              clearTimeout(timer);
              resolve(true);
            });
          });

          // If it didn't exit quickly, force kill.
          if (!exitedGracefully) {
            try {
              proc.kill('SIGKILL');
            } catch {
              // ignore
            }

            await new Promise((resolve) => {
              const timer = setTimeout(resolve, 2000);
              proc.once('exit', () => clearTimeout(timer) || resolve());
            });
          }

          return { stopped: true, message: 'Backend stopped.' };
        };

        const requestBackendJson = (backendPath) => {
          return new Promise((resolve, reject) => {
            const options = {
              hostname: backendHost,
              port: backendPort,
              path: backendPath,
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            };

            const req = http.request(options, (res) => {
              const chunks = [];
              res.on('data', (d) => chunks.push(d));
              res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf-8');
                resolve({
                  statusCode: res.statusCode ?? 500,
                  headers: res.headers,
                  body,
                });
              });
            });

            req.on('error', reject);
            req.end();
          });
        };

        const waitForBackend = async (timeoutMs = 10000) => {
          const start = Date.now();
          // Poll `/health` until it responds successfully.
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              const res = await requestBackendJson('/health');
              if (res.statusCode >= 200 && res.statusCode < 300) return true;
            } catch {
              // ignore while backend is starting
            }
            if (Date.now() - start > timeoutMs) {
              throw new Error(`Timed out waiting for backend at http://${backendHost}:${backendPort}`);
            }
            await new Promise((r) => setTimeout(r, 250));
          }
        };

        const ensureBackendStarted = async () => {
          if (backendProcess) return waitForBackend();
          if (backendStarting) return backendStarting;

          backendStarting = (async () => {
            // Start Python backend (same code your runbook uses).
            backendProcess = spawn('python', ['src\\server.py'], {
              cwd: backendDir,
              stdio: 'inherit',
            });

            // If Python exits quickly, don't leave a stuck promise.
            backendProcess.on('exit', (code) => {
              backendProcess = null;
              if (code !== 0) {
                // eslint-disable-next-line no-console
                console.error(`Backend exited with code ${code}`);
              }
            });

            await waitForBackend();
          })().finally(() => {
            backendStarting = null;
          });

          return backendStarting;
        };

        // NOTE: Vite serves `index.html` for unknown paths (SPA fallback).
        // This middleware must run early enough to intercept `/api/demo` before that fallback.
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = req.url || '';

            if (req.method === 'GET' && url.startsWith('/api/demo')) {
              await ensureBackendStarted();
              const backendRes = await requestBackendJson('/api/demo');
              res.statusCode = backendRes.statusCode;
              if (backendRes.headers['content-type']) {
                res.setHeader('content-type', backendRes.headers['content-type']);
              }
              res.end(backendRes.body);
              return;
            }

            if (req.method === 'POST' && url.startsWith('/api/stop-backend')) {
              const stopRes = await stopBackend();
              res.statusCode = 200;
              res.setHeader('content-type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(stopRes));
              return;
            }

            return next();
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: e?.message ? String(e.message) : String(e) }));
          }
        });
      },
    },
  ],
});
