import { resolve } from "node:path";
import { createApp } from "./server.js";

interface CliOptions {
  port: number;
  architecturePath: string;
  tecturePath: string;
}

function parseArgs(argv: string[]): CliOptions {
  let port = Number(process.env.PORT ?? 3000);
  let architecturePath = process.env.ARCHITECTURE_PATH;
  let tecturePath = process.env.TECTURE_PATH;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--port" || arg === "-p") {
      const next = argv[i + 1];
      if (!next) throw new Error(`Missing value for ${arg}`);
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`Invalid port: ${next}`);
      }
      port = parsed;
      i++;
    } else if (arg === "--architecture-path" || arg === "-a") {
      const next = argv[i + 1];
      if (!next) throw new Error(`Missing value for ${arg}`);
      architecturePath = next;
      i++;
    } else if (arg === "--tecture-path" || arg === "-t") {
      const next = argv[i + 1];
      if (!next) throw new Error(`Missing value for ${arg}`);
      tecturePath = next;
      i++;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: tecture-io [--port <number>] [--architecture-path <path>] [--tecture-path <path>]",
      );
      process.exit(0);
    }
  }
  return {
    port,
    architecturePath: resolve(architecturePath ?? "architecture"),
    tecturePath: resolve(tecturePath ?? ".tecture"),
  };
}

const { port, architecturePath, tecturePath } = parseArgs(process.argv.slice(2));
const app = createApp({ architecturePath, tecturePath });

app.listen(port, () => {
  console.log(`Tecture IO running at http://localhost:${port}`);
  console.log(`Architecture root: ${architecturePath}`);
  console.log(`Tecture state: ${tecturePath}`);
});
