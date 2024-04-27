import { getCommandLineOptions } from './lib/options';
import { parseOpenAPIFile } from './lib/openapi-parser';

console.log('hello world');

async function main() {
  const { input } = getCommandLineOptions();
  const api = await parseOpenAPIFile(input);

  console.log(api.info);
}

main();
