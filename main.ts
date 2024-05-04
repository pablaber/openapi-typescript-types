import { getProgramOptions } from './lib/options';
import { parseOpenAPIFile } from './lib/openapi-parser';
import { buildTypes } from './lib/builder/type-builder';
import { writeTypesToFile } from './lib/file-writer';

async function main() {
  const programOptions = getProgramOptions();
  const apiDocument = await parseOpenAPIFile(programOptions.input);
  const types = buildTypes(apiDocument, programOptions);
  writeTypesToFile(types, programOptions.output);
}

main();
