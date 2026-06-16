# @tecture/core

Standalone browser viewer for [Tecture](https://github.com/tecture-io/tecture)
architecture docs — render the file-based architecture in `./architecture/`
(JSON + Markdown) as interactive, navigable diagrams.

## Usage

From a repo that has an `architecture/` folder:

```bash
npx @tecture/core
# → http://localhost:3000
```

Options: `--port <n>`, `--architecture-path <dir>`, `--tecture-path <dir>`.

To generate the architecture in the first place, install the skill into your
coding agent with `npx @tecture/skill@latest` and run `/architecture-docs`.

## Telemetry

The viewer sends **anonymous** usage stats (which C4 diagram **level** is
viewed, and how often) to help prioritize improvements. It records only the
level (1/2/3) and counts — **never** your diagram names, node names, file
paths, or any architecture content. Events are keyed to a random id stored at
`~/.config/tecture/telemetry-id`.

It's opt-out: set `TECTURE_TELEMETRY=0` (or the standard `DO_NOT_TRACK=1`) to
disable it entirely. A one-time notice is printed on first run.
