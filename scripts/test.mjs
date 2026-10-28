// Runs the tests against a separate SQLite file (prisma/test.db),
// so your real data in dev.db is never touched.
import { spawnSync } from "node:child_process";

const env = { ...process.env, DATABASE_URL: "file:./test.db" };

function run(cmd) {
  const result = spawnSync(cmd, { stdio: "inherit", env, shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx prisma db push --skip-generate --force-reset --accept-data-loss");
run("node --test --test-concurrency=1 tests/rules.test.mjs tests/inventory.test.mjs");
