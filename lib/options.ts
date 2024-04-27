import { program } from 'commander';

type CommandLineOptions = {
  input: string;
};

export function getCommandLineOptions(): CommandLineOptions {
  const { input } = program
    .option('--input <input>', 'Input OpenAPI file')
    .parse()
    .opts();

  if (typeof input !== 'string') {
    throw new Error('Input file is required');
  }

  return { input };
}
