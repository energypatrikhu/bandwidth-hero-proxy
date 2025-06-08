import { Env } from "#/libs/env";
import { spawn } from "bun";

const buns = new Array(Env.CLUSTER_SIZE);

for (let i = 0; i < Env.CLUSTER_SIZE; i++) {
  buns[i] = spawn({
    cmd: ["bun", "src/server.ts"],
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
}

function kill() {
  for (const bun of buns) {
    bun.kill();
  }
}

process.on("SIGINT", kill);
process.on("exit", kill);
