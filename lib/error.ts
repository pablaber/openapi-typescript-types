import logger from './logger';

export function logErrorAndExit(message: string, exitCode: number = 1): never {
  logger.error(message);
  process.exit(exitCode);
}
