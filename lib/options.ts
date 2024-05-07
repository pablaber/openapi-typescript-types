import { program } from 'commander';
import yaml from 'js-yaml';
import fs from 'fs';
import type { ProgramOptions, YamlConfig } from './types';
import * as packageJson from '../package.json';

export function getProgramOptions(): ProgramOptions {
  // Define program name and information.
  program
    .name('ott')
    .description('Generate TypeScript types from an OpenAPI schema')
    .version(packageJson.version, '-v, --version');

  // Define program options
  program
    .option(
      '-c, --config <config>',
      'use a config file for options, no other command line options are honored',
    )
    .option(
      '-i, --input <input>',
      'specify the input OpenAPI schema file (e.g. petstore.yaml)',
    )
    .option(
      '-o, --output <output>',
      'specify the output type file (e.g. out/petstore-types.ts)',
    )
    .option('--exclude-paths', 'do not generate path types', false)
    .option('--exclude-schemas', 'do not generate schema types', false);

  // Parse all options
  program.parse();

  const { config: configPath } = program.opts();

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

  // Totally Optional (TODO: removed implementation for initial release anyways)
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
  const { input, output, typeNameFormat, excludePaths, excludeSchemas } =
    program.opts();

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

  if (typeof excludePaths !== 'boolean') {
    throw new Error('Exclude paths must be a boolean');
  }
  if (typeof excludeSchemas !== 'boolean') {
    throw new Error('Exclude schemas must be a boolean');
  }
  if (excludePaths && excludeSchemas) {
    throw new Error('Cannot exclude both paths and schemas');
  }

  return {
    input,
    output,
    typeNameFormat,
    paths: { generate: !excludePaths },
    schemas: { generate: !excludeSchemas },
  };
}
