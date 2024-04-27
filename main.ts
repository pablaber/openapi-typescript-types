import { getCommandLineOptions } from './lib/options';
import { parseOpenAPIFile } from './lib/openapi-parser';
import { generateTypes } from './lib/type-builder';
import { writeTypesToFile } from './lib/file-writer';

async function main() {
  const { input, output, typeNameFormat } = getCommandLineOptions();
  const apiDocument = await parseOpenAPIFile(input);
  const types = generateTypes(apiDocument, { typeNameFormat });
  writeTypesToFile(types, output);
}

main();
