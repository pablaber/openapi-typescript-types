# openapi-typescript-types

A library for generating Typescript types from an OpenAPI document.

## Usage

The script can either be run through the command line or with a config file.

### Command Line

_Not yet implemented_

### Config File

You can also run the program using a YAML configuration file. If the config file
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