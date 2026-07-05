import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "install",
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
