# AGENTS.md

Guidance for coding agents working in this repository.

## Project overview

`openapi-typescript-types` (binary: `ott`) is a Node.js CLI that reads an
OpenAPI 3.x document and emits a single TypeScript file containing types for
the document's component schemas, request bodies, and 2xx response bodies.

It is published to npm as `openapi-typescript-types` and built from
TypeScript sources in `lib/` and `main.ts` to `dist/` via `tsc`.

## Repository layout

- `main.ts` — CLI entrypoint (`#! /usr/bin/env node`). Wires the pipeline:
  options → parse → build → write.
- `lib/options.ts` — Parses CLI flags (via `commander`) and YAML config files
  (via `js-yaml`) into a `ProgramOptions` object. Either `--config <path>` or
  the explicit `--input`/`--output` flags are required.
- `lib/openapi-parser.ts` — Wraps `@readme/openapi-parser` to validate and
  dereference the OpenAPI document.
- `lib/builder/type-builder.ts` — Core type-emission logic. Walks the
  dereferenced schema recursively and produces TypeScript source strings.
  Handles `oneOf`/`anyOf`/`allOf`, enums, `nullable`, arrays,
  `additionalProperties`, and nested objects.
- `lib/builder/path-builder-utils.ts` — Builds a synthetic `PropertiesMap`
  for path operations: each entry is keyed by a generated name like
  `GetPetByIdOkResponse` or `PostPetRequestBody`. Only 2xx responses with an
  `application/json` schema are emitted.
- `lib/writer/file-writer.ts` — Writes the generated types to disk, prepends
  a generated-file banner and the shared `Nullable<T>` helper.
- `lib/types.ts` — Internal TypeScript types describing the OpenAPI subset
  this tool understands plus `ProgramOptions` and `YamlConfig`.
- `lib/utils.ts` — Small helpers (`matchesAny` glob check, status-code text,
  capitalize).
- `lib/logger.ts` — `winston` console logger; level is set to `debug` when
  `--debug` is passed, otherwise `info`.
- `lib/error.ts` — `logErrorAndExit` helper.
- `demo/petstore.yaml` — Sample OpenAPI doc used for ad-hoc smoke tests.
- `test/fixtures/*.yaml` — Test-suite fixtures exercising supported
  OpenAPI constructs.
- `test/run.js` — Test runner. Generates types from each fixture and
  type-checks the output with `tsc --strict`.
- `.github/workflows/` — `checks.yaml` runs lint + build on every PR;
  `pr-validate.yaml` enforces Conventional Commit PR titles (`chore`,
  `feat`, `fix`); `release.yaml` runs release-please on `main` and
  publishes to npm when a release PR is merged.
- `release-please-config.json` — release-please configuration (changelog
  sections for `feat`, `fix`, `chore`).

## Development commands

Node version is pinned in `.nvmrc` (Node 24). Install with `npm install`.

- `npm run build` — Compile TypeScript to `dist/` per `tsconfig.json`.
- `npm run lint` — Run ESLint over the repo.
- `npm run create-executable` — Build then `npm i -g`, exposing `ott`
  globally for local end-to-end testing.
- `npm test` — Run the fixture-based test suite via `test/run.js`.
  Requires `dist/main.js` to exist (run `npm run build` first).

The test suite generates types from every YAML in `test/fixtures/` and
type-checks the output with `tsc --noEmit --strict`. To add coverage,
drop another `*.yaml` in `test/fixtures/` — the runner picks it up
automatically. Output lands in `test/output/` (gitignored).

For a bug fix tied to a new OpenAPI construct, prefer adding a case to
`test/fixtures/test-api.yaml` (or a new fixture) over a one-off manual
check.

## CLI surface

Flags (see `lib/options.ts` for the source of truth):

- `-c, --config <path>` — YAML config file (preferred). When provided, all
  other input/output flags are ignored.
- `-i, --input <path>` — OpenAPI document.
- `-o, --output <path>` — Destination `.ts` file.
- `--exclude-paths` — Skip path/operation types.
- `--exclude-schemas` — Skip component-schema types. Cannot be combined with
  `--exclude-paths`.
- `-d, --debug` — Verbose logging.
- `-v, --version` — Print version from `package.json`.

The YAML config schema (`YamlConfig` in `lib/types.ts`) supports
`paths`/`schemas` as either booleans or `{ include?: string[]; exclude?:
string[] }`. `include` takes precedence over `exclude`. Patterns are matched
with `minimatch` (full glob syntax).

## Code style and conventions

- TypeScript strict mode is on (`tsconfig.json`). ESLint uses
  `typescript-eslint`'s `strict` configs — keep the codebase free of
  warnings.
- Prettier config: `semi: true`, `singleQuote: true` (`.prettierrc.json`).
- Imports use ES module syntax. The project compiles to CommonJS (per
  `tsconfig.json`); avoid runtime-only ESM features.
- Logger usage: import the default logger from `lib/logger`. Use
  `logger.debug` for trace info, `logger.info` for user-facing progress,
  `logger.warn` for skipped/unsupported schema constructs, and the
  `logErrorAndExit` helper in `lib/error.ts` for fatal parse failures.
- Errors thrown in `main.ts` are caught and logged with `process.exit(1)`;
  prefer throwing `Error` with a clear message over silent failures.
- Follow the patterns already in `type-builder.ts` for recursion: pass a
  `currentPath` array down so warning messages can pinpoint the schema
  location.

## Generated output contract

`writer/file-writer.ts` produces files with this shape:

```
// This file was generated by the openapi-to-typescript tool.
// Do not modify it by hand.

// START TYPES BASE
type Nullable<T> = T | null;
// END TYPES BASE

export type Pet = { ... };
export type GetPetByIdOkResponse = { ... };
```

Keep the banner and `START TYPES BASE`/`END TYPES BASE` markers stable —
downstream consumers may rely on them.

## Naming for generated path types

Path operation names are built in `path-builder-utils.ts`:

- Method is upper-cased and prepended (`Get`, `Post`, …).
- Path segments are PascalCased; `{id}`-style variables become `ById`.
- Response types are suffixed with the status text (`Ok` for 200,
  `Created` for 201, the raw code otherwise) plus `Response`.
- Request bodies are suffixed with `RequestBody`.

Example: `GET /pet/{petId}` 200 → `GetPetByPetIdOkResponse`.

## Release process

- Commits to `main` follow Conventional Commits (`feat:`, `fix:`, `chore:`).
  PR titles are validated by `pr-validate.yaml`.
- `release.yaml` uses `release-please` (configured via
  `release-please-config.json`) to open release PRs; merging one triggers
  a build and `npm publish`. Do not bump the version in `package.json`
  manually.

## Pull request conventions

When opening a PR (whether by hand or as an agent), follow the rules below
so that `pr-validate.yaml` passes and release-please produces a sensible
changelog entry.

### 1. Conventional Commit PR title

The PR title is the source of truth for release-please. It must match:

```
<type>[optional scope][!]: <subject>
```

Only these `<type>` prefixes are accepted (enforced by
`amannn/action-semantic-pull-request` in `pr-validate.yaml`, and the only
ones that produce a release-please changelog entry per
`release-please-config.json`):

| Prefix   | Changelog section | Version bump | Use for                                                                                                                       |
| -------- | ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `feat:`  | Features          | minor        | New user-visible capability — a new flag, support for a new OpenAPI construct, a new code-generation behavior.                |
| `fix:`   | Bug Fixes         | patch        | Correcting incorrect behavior — wrong generated output, crashes, regressions, malformed type emission.                        |
| `chore:` | Miscellaneous     | none         | Repo housekeeping with no runtime effect — CI tweaks, docs, dependency bumps, refactors, build-tooling changes, dev scripts.  |

Add `!` after the type (e.g. `feat!: drop Node 20 support`) **or** include
a `BREAKING CHANGE:` footer in the PR body to force a major version bump.
Use this for any change that breaks existing consumers — dropping a flag,
changing the generated-output contract, requiring a newer Node version,
etc.

Examples:

- `fix: wrap nullable arrays correctly in generated types`
- `feat: support discriminated unions via discriminator mapping`
- `chore: bump @types/node to ^24.0.0`
- `feat!: rename --exclude-paths to --no-paths`

### 2. PR description: what changed

Include a short summary of the change as bullet points. Keep it concrete
— callers reading the changelog should be able to tell from the bullets
whether the change affects them.

```markdown
## Summary

- Fix nullable arrays emitting `Nullable<  name: type[]>` instead of
  `name: Nullable<type[]>` (file: `lib/builder/type-builder.ts`).
- No change to non-nullable arrays or arrays of objects.
```

### 3. Validation steps

Document the exact commands you ran to verify the change. Because there
is no automated test suite, this is the only record of what was checked.
At minimum:

```markdown
## Validation

- `npm run lint` — clean.
- `npm run build` — clean.
- `npm test` — all fixtures pass.
- Added a nullable-array case to `test/fixtures/test-api.yaml` and
  confirmed it appears in `test/output/test-api.ts` as
  `Nullable<T[]>`.
```

If you generated types against an external/private OpenAPI doc to
reproduce a reported issue, mention it but do not check the doc into the
repo.

### 4. Manual validation for reviewers (if needed)

If the change cannot be fully verified by lint+build alone (e.g. it
affects generated output for a specific OpenAPI shape), include a
"Manual validation" section telling the reviewer how to reproduce.
Provide a minimal YAML snippet inline and the expected generated TS
output, or a one-liner they can paste:

```markdown
## Manual validation

Save as `repro.yaml`:

\`\`\`yaml
# minimal schema that triggered the bug
\`\`\`

Then run:

\`\`\`bash
npm run build
node dist/main.js --input repro.yaml --output /tmp/out.ts
\`\`\`

Expect `types: Nullable<string[]>;` in the output (previously emitted
`Nullable<  types: string[]>` which fails to parse).
```

Skip this section if `npm run lint && npm run build` plus the petstore
smoke test are sufficient to demonstrate the change works.

## Tips for agents

- Prefer editing existing modules over adding new files; the codebase is
  intentionally small.
- When adding support for a new OpenAPI construct, extend
  `generateCodeForProperty` in `type-builder.ts` and update
  `PropertyDefinition` in `types.ts` if the field isn't already modeled.
- After non-trivial changes, run `npm run lint && npm run build` and
  regenerate `demo/petstore.yaml` types to spot regressions.
- There is no test runner. Treat `demo/petstore.yaml` plus a manual diff of
  the generated output as the smoke test, and call out in the PR that
  testing was manual.
