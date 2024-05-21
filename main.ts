#! /usr/bin/env node

import logger from './lib/logger';
import { getProgramOptions } from './lib/options';
import { parseOpenAPIFile } from './lib/openapi-parser';
import { buildTypes } from './lib/builder/type-builder';
import { writeTypesToFile } from './lib/writer/file-writer';

async function main() {
  try {
    const programOptions = getProgramOptions();
    logger.debug(`loaded program options: ${JSON.stringify(programOptions)}`);
    logger.info(`generating types from ${programOptions.input}`);

    const apiDocument = await parseOpenAPIFile(programOptions.input);

    const types = buildTypes(apiDocument, programOptions);

    writeTypesToFile(types, programOptions.output);
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error('an unknown error occurred');
    }
    process.exit(1);
  }
}

main();
