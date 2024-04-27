export function logErrorAndExit(message: string, exitCode: number = 1): never {
  console.error(message);
  process.exit(exitCode);
}
