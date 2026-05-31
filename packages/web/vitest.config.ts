import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "web",
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
