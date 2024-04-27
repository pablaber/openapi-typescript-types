import OpenAPIParser from '@readme/openapi-parser';
import { logErrorAndExit } from './error';
import type { OpenAPIDocument } from './types';

export async function parseOpenAPIFile(
  pathToOpenApi: string,
): Promise<OpenAPIDocument> {
  let api;
  try {
    api = await OpenAPIParser.validate(pathToOpenApi);
  } catch (err: unknown) {
    if (err)
      if (err instanceof SyntaxError) {
        let errorMessage = 'Error parsing OpenAPI file:';
        // @ts-expect-error These syntax errors are weird but this works I promise
        err.forEach((e: unknown) => {
          // @ts-expect-error same reason as above
          errorMessage += `\n  - ${e.instancePath} ${e.message} ${JSON.stringify(e.params)}`;
        });
        logErrorAndExit(errorMessage);
      }

    if (err instanceof Error) {
      let errorMessage = 'Unknown error parsing OpenAPI file:';
      errorMessage += `\n${err.stack}`;
      logErrorAndExit(errorMessage);
    }

    logErrorAndExit('Unknown error parsing OpenAPI file');
  }

  return api as OpenAPIDocument;
}
