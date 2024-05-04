# openapi-typescript-types

A library for generating Typescript types from an OpenAPI document.

## Usage

The script can either be run through the command line or with a config file.

### Command Line

_Not yet implemented_

### Config File

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