import { program } from 'commander';

type CommandLineOptions = {
  input: string;
  output: string;
  typeNameFormat?: string;
};

export function getCommandLineOptions(): CommandLineOptions {
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

  return { input, output, typeNameFormat };
}
