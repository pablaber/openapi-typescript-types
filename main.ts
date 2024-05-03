import { getProgramOptions } from './lib/options';
import { parseOpenAPIFile } from './lib/openapi-parser';
import { generateTypes } from './lib/type-builder';
import { writeTypesToFile } from './lib/file-writer';

async function main() {
  const programOptions = getProgramOptions();
  const apiDocument = await parseOpenAPIFile(programOptions.input);
  const types = generateTypes(apiDocument, programOptions);
  writeTypesToFile(types, programOptions.output);
}

main();
