The public npm registry is the sole distribution channel for Tecture IO. Only the `@tecture/io` package is published; the internal `@tecture/web` and `@tecture/shared` workspace packages stay private and are bundled into the server's `dist/` at build time.

## Responsibilities
- Host the `@tecture/io` tarball containing `dist/cli.js` + `dist/public/` + `package.json` (no source, no tests, no lockfile).
- Let developers fetch and execute the CLI ad-hoc via `npx @tecture/io`, or install it globally / into a project.

## Tech Stack
- `npm` registry with `publishConfig.access = "public"`.
- Published artefact is an ESM bundle produced by `tsup` with a Node shebang, paired with the pre-built Vite output copied by `scripts/copy-web-assets.mjs`.
