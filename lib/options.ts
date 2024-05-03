import { program } from 'commander';
import yaml from 'js-yaml';
import fs from 'fs';
import type { ProgramOptions, YamlConfig } from './types';

export function getProgramOptions(): ProgramOptions {
  const { config: configPath } = program
    .option('-c, --config <config>', 'Config file path')
    .parse()
    .opts();

  if (configPath !== undefined) return getConfigFileOptions(configPath);
  return getCommandLineOptions();
}

function getConfigFileOptions(configFilePath: string): ProgramOptions {
  function readYamlFile(filePath: string) {
    try {
      const fileContents = fs.readFileSync(filePath);
      return yaml.load(fileContents.toString());
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Error reading config file:\n${err.stack}`);
      }
      throw new Error('Unknown error reading config file');
    }
  }

  const {
    input,
    output,
    options = {},
  } = readYamlFile(configFilePath) as YamlConfig;

  const ConfigFileError = (message: string) =>
    new Error(`${configFilePath}: ${message}`);

  if (typeof input !== 'string') {
    throw ConfigFileError('"input" is required');
  }

  if (typeof output !== 'string') {
    throw ConfigFileError('"output" is required');
  }

  // Optional Config, Required Options
  const { paths = true } = options;
  let generatePaths = true;
  let pathsInclude: string[] | undefined;
  let pathsExclude: string[] | undefined;
  if (typeof paths === 'boolean') generatePaths = paths;
  else if (paths.include !== undefined) {
    pathsInclude = paths.include;
  } else if (paths.exclude !== undefined) {
    pathsExclude = paths.exclude;
  }

  const { schemas = true } = options;
  let generateSchemas = true;
  let schemasInclude: string[] | undefined;
  let schemasExclude: string[] | undefined;
  if (typeof schemas === 'boolean') generateSchemas = schemas;
  else if (schemas.include !== undefined) {
    schemasInclude = schemas.include;
  } else if (schemas.exclude !== undefined) {
    schemasExclude = schemas.exclude;
  }

  // Totally Optional
  const { typeNameFormat } = options;
  if (
    typeof typeNameFormat !== 'string' &&
    typeof typeNameFormat !== 'undefined'
  ) {
    throw ConfigFileError('"options.typeNameFormat" must be a string');
  }

  return {
    input,
    output,
    typeNameFormat,

    paths: {
      generate: generatePaths,
      include: pathsInclude,
      exclude: pathsExclude,
    },

    schemas: {
      generate: generateSchemas,
      include: schemasInclude,
      exclude: schemasExclude,
    },
  };
}

function getCommandLineOptions(): ProgramOptions {
  const {
    input,
    output = 'openapi-typescript-types.ts',
    typeNameFormat,
  } = program
    .option('--input <input>', 'Input OpenAPI file')
    .option('--output <output>', 'Output file (e.g. out/types.ts)')
    .option(
      '--type-name-format <typeNameFormat>',
      'Type name format (e.g. MyApi{name}, default: {name})',
    )
    .parse()
    .opts();

  if (typeof input !== 'string') {
    throw new Error('Input file is required');
  }
  if (typeof output !== 'string') {
    throw new Error('Output file is required');
  }
  if (
    typeof typeNameFormat !== 'string' &&
    typeof typeNameFormat !== 'undefined'
  ) {
    throw new Error('Type name format must be a string');
  }

  return {
    input,
    output,
    typeNameFormat,
    paths: { generate: true },
    schemas: { generate: true },
  };
}
