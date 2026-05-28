import * as assert from "node:assert";
import { buildSourceUrl } from "@tecture/shared";

suite("buildSourceUrl", () => {
  test("github: file uses /blob/HEAD, directory uses /tree/HEAD", () => {
    const src = "https://github.com/acme/ecommerce";
    assert.strictEqual(
      buildSourceUrl(src, "github", "src/api/order-service.ts"),
      "https://github.com/acme/ecommerce/blob/HEAD/src/api/order-service.ts",
    );
    assert.strictEqual(
      buildSourceUrl(src, "github", "src/api/controllers/"),
      "https://github.com/acme/ecommerce/tree/HEAD/src/api/controllers",
    );
  });

  test("gitlab: inserts /-/ segment", () => {
    const src = "https://gitlab.com/acme/ecommerce";
    assert.strictEqual(
      buildSourceUrl(src, "gitlab", "src/app.ts"),
      "https://gitlab.com/acme/ecommerce/-/blob/HEAD/src/app.ts",
    );
    assert.strictEqual(
      buildSourceUrl(src, "gitlab", "src/lib/"),
      "https://gitlab.com/acme/ecommerce/-/tree/HEAD/src/lib",
    );
  });

  test("bitbucket: uses /src/HEAD for both files and directories", () => {
    const src = "https://bitbucket.org/acme/ecommerce";
    assert.strictEqual(
      buildSourceUrl(src, "bitbucket", "src/app.ts"),
      "https://bitbucket.org/acme/ecommerce/src/HEAD/src/app.ts",
    );
    assert.strictEqual(
      buildSourceUrl(src, "bitbucket", "src/lib/"),
      "https://bitbucket.org/acme/ecommerce/src/HEAD/src/lib",
    );
  });

  test("infers host from the source domain when host is omitted", () => {
    assert.strictEqual(
      buildSourceUrl("https://github.com/acme/repo", undefined, "a/b.ts"),
      "https://github.com/acme/repo/blob/HEAD/a/b.ts",
    );
  });

  test("explicit host wins over the domain (self-hosted GitLab)", () => {
    assert.strictEqual(
      buildSourceUrl("https://git.internal.acme.dev/team/repo", "gitlab", "a/b.ts"),
      "https://git.internal.acme.dev/team/repo/-/blob/HEAD/a/b.ts",
    );
  });

  test("unknown host degrades to the repo root", () => {
    assert.strictEqual(
      buildSourceUrl("https://example.com/team/repo", undefined, "a/b.ts"),
      "https://example.com/team/repo",
    );
  });

  test("trims a trailing slash and a .git suffix from source", () => {
    assert.strictEqual(
      buildSourceUrl("https://github.com/acme/repo.git/", "github", "a.ts"),
      "https://github.com/acme/repo/blob/HEAD/a.ts",
    );
  });

  test("URL-encodes path segments", () => {
    assert.strictEqual(
      buildSourceUrl("https://github.com/acme/repo", "github", "src/my file.ts"),
      "https://github.com/acme/repo/blob/HEAD/src/my%20file.ts",
    );
  });

  test("returns undefined when source is missing", () => {
    assert.strictEqual(buildSourceUrl(undefined, "github", "a.ts"), undefined);
  });
});
