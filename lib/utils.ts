import { minimatch } from 'minimatch';

/**
 * Returns true if the string to match matches any glob patterns in the array.
 * Uses minimatch for comparison.
 */
export function matchesAny(toMatch: string, globPatterns: string[]): boolean {
  return globPatterns.some((pattern) => minimatch(toMatch, pattern));
}

/**
 * Takes the given string and uppercases the first letter.
 */
export function upperCaseFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Returns the text for the HTTP status provided
 */
export function textForStatus(status: string): string {
  switch (status) {
    case '200':
      return 'Ok';
    case '201':
      return 'Created';
    default:
      return status;
  }
}
