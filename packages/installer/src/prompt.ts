import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export async function confirm(message: string, def = true): Promise<boolean> {
  const hint = def ? "[Y/n]" : "[y/N]";
  const answer = (await ask(`${message} ${hint} `)).toLowerCase();
  if (answer === "") return def;
  return answer === "y" || answer === "yes";
}

export interface Choice<T> {
  label: string;
  value: T;
}

/**
 * Line-based multi-select (no raw-mode arrow keys — robust across terminals and
 * non-TTY pipes). User types comma-separated numbers, or "all", or blank for the
 * pre-selected defaults.
 */
export async function multiSelect<T>(
  message: string,
  choices: Choice<T>[],
  preselected: T[] = [],
): Promise<T[]> {
  const lines = choices.map((c, i) => {
    const mark = preselected.includes(c.value) ? "*" : " ";
    return `  ${i + 1}) [${mark}] ${c.label}`;
  });
  stdout.write(`${message}\n${lines.join("\n")}\n`);
  const answer = await ask(
    `Select numbers (comma-separated), "all", or Enter for the marked defaults: `,
  );
  if (answer === "") {
    return preselected.length ? preselected : choices.map((c) => c.value);
  }
  if (answer.toLowerCase() === "all") return choices.map((c) => c.value);
  const picked = new Set<T>();
  for (const tok of answer.split(",")) {
    const n = Number(tok.trim());
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
      picked.add(choices[n - 1]!.value);
    }
  }
  return [...picked];
}

export async function selectScope(): Promise<"global" | "project"> {
  stdout.write(
    `Install scope?\n  1) project — this repo only\n  2) global  — all repos on this machine\n`,
  );
  const answer = await ask(`Select [1]: `);
  return answer.trim() === "2" ? "global" : "project";
}
