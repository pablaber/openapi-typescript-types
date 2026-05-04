# openapi-typescript-types

A library for generating Typescript types from an OpenAPI document.

## Usage

The script can either be run through the command line or with a config file.

### Config File

The preferred way of running `ott` is by using a config file. If the config file
is named `ott.config.yaml` and stored in the current working directory,
the script can be invoked with that config file by running:

```bash
ott --config ./ott.config.yaml
```

#### Config File Structure

The structure and options for the config file are defined below:

```yaml
version: 1.0               # The config version, only supports 1.0
input: ./swagger.yaml      # The path to teh swagger file input
output: ./out/types.ts     # The output file for the typescript types

options:                   # Additional options (optional)
  typeNameFormat: "{name}" # Format the name of output types.
  
  paths:                   # Options for paths, paths excluded if false
    include:               # List specific paths to include.
      - /pet/**            #   - Takes precedence over "exclude"
      - /store/**
    exclude:               # List specific paths to exclude
      - /user/**           #   - Has no effect if "include" is specified
  
  schemas:                 # Options for schemas, all schemas excluded if false
    include:               # List specific paths to include.
      - Pet                #   - Takes precedence over "exclude"
      - Category
    exclude:               # List specific paths to exclude
      - Customer           #   - Has no effect if "include" is specified
```

### Command Line

The script can also be run through the command line, although the options are
more limited than the config file.

You can always run `ott --help` for the most detailed and up to date explanation
of the command line options.

#### Command Line Example

Below is an example of invoking the command to generate a types file without
schemas that will be named `petstore-types.ts` from an input file of 
`petstore.yaml`.

```bash
ott \
  --input petstore.yaml \
  --output petstore-types.ts \
  --exclude-schemas
```

## Development

### Prerequisites

Node version is pinned in `.nvmrc` (Node 24). If you use `nvm`:

```bash
nvm use
```

### Setup

```bash
npm install
```

### Scripts

- `npm run build` — Compile TypeScript sources to `dist/` via `tsc`.
- `npm run lint` — Run ESLint over the repo (uses `typescript-eslint`'s
  strict configs).
- `npm run create-executable` — Build and `npm i -g` so `ott` is available
  globally on your machine for end-to-end testing.
- `npm test` — Run the fixture-based test suite (see "Testing" below).
  Requires `npm run build` first.

### Testing

The test suite (`test/run.js`) drives the built CLI against every
fixture in `test/fixtures/` and confirms the generated TypeScript compiles
under `tsc --strict`. The default fixture (`test/fixtures/test-api.yaml`)
covers the OpenAPI constructs ott supports: basic types, nullable types,
enums, arrays (including nullable arrays of objects), nested objects,
`additionalProperties`, `oneOf`/`anyOf`/`allOf`, path operations with
request bodies and 2xx responses, and path variables.

```bash
npm run build
npm test
```

To extend coverage for a new construct or a regression, drop another
`*.yaml` file into `test/fixtures/` — the runner picks it up
automatically. Generated output is written to `test/output/` (gitignored).

### CI workflows

Located in `.github/workflows/`:

- `checks.yaml` — Runs on every push to `main` and every pull request.
  Sets up Node from `.nvmrc`, runs `npm ci`, `npm run lint`, and
  `npm run build`. PRs must be green here before merge.
- `pr-validate.yaml` — Validates that the PR title follows
  [Conventional Commits](https://www.conventionalcommits.org/) using
  `amannn/action-semantic-pull-request`. Only `feat`, `fix`, and `chore`
  prefixes are accepted.
- `release.yaml` — Runs on push to `main`. Uses
  [release-please](https://github.com/googleapis/release-please) to open
  release PRs that bump the version and update `CHANGELOG.md`. Merging a
  release PR triggers a build and `npm publish`.

### Release process

This repo uses release-please. **Do not edit `package.json`'s `version`
field manually** — release-please derives the next version from the
Conventional Commit messages on `main`:

- `feat:` commits trigger a minor version bump.
- `fix:` commits trigger a patch version bump.
- `feat!:` (or any commit with a `BREAKING CHANGE:` footer) triggers a
  major version bump.
- `chore:` commits appear in the changelog under "Miscellaneous" and do
  not bump the version.

Sections in the generated changelog are configured in
`release-please-config.json`.

