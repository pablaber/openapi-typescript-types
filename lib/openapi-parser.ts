import OpenAPIParser from '@readme/openapi-parser';
import { logErrorAndExit } from './error';

type OpenAPIDocument = Awaited<ReturnType<typeof OpenAPIParser.validate>>;

export async function parseOpenAPIFile(
  pathToOpenApi: string,
): Promise<OpenAPIDocument> {
  let api;
  try {
    api = await OpenAPIParser.validate(pathToOpenApi);
  } catch (err: any) {
    if (err.name === 'SyntaxError') {
      let errorMessage = 'Error parsing OpenAPI file:';
      err.forEach((e: any) => {
        errorMessage += `\n  - ${e.instancePath} ${e.message} ${JSON.stringify(e.params)}`;
      });
      logErrorAndExit(errorMessage);
    }
    let errorMessage = 'Unknown error parsing OpenAPI file:';
    errorMessage += `\n${err.stack}`;
    logErrorAndExit(errorMessage);
  }

  return api;
}
