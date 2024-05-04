import { matchesAny, textForStatus, upperCaseFirstLetter } from '../utils';
import {
  OpenAPIDocument,
  OpenApiPathMethodEntry,
  PathRoot,
  ProgramOptions,
  PropertiesMap,
} from '../types';

/**
 * Builds a typescript name for the given path and method.
 */
function buildPathName(
  pathName: string,
  methodKey: string,
  status: string,
): string {
  const camelCaseMethod = upperCaseFirstLetter(methodKey);
  const transformedPath = pathName
    .split('/')
    .map((pathPart: string) => {
      const isVariable = pathPart.startsWith('{');
      const pathPartName = isVariable ? pathPart.slice(1, -1) : pathPart;
      return isVariable
        ? `By${upperCaseFirstLetter(pathPartName)}`
        : upperCaseFirstLetter(pathPartName);
    })
    .join('');
  const statusText = textForStatus(status);
  return `${camelCaseMethod}${transformedPath}${statusText}Response`;
}

/**
 * Given an OpenAPI object of response method status codes and their response
 * definitions, return the properties map for the 2xx responses.
 */
function getPropertiesMapsFromMethodInfo(
  methodInfo: OpenApiPathMethodEntry,
): Record<string, PropertiesMap> {
  return Object.entries(methodInfo.responses || {}).reduce(
    (acc, [responseCode, responseInfo]) => {
      // Filter out any responses that are not 200 status.
      const isGoodResponse = responseCode.startsWith('2');
      if (!isGoodResponse) return acc;

      // Filter out responses with no content (204, incomplete definitions etc.)
      const responseApplicationJson =
        responseInfo.content?.['application/json'];
      if (!responseApplicationJson) return acc;

      // Filter out responses with no schema.
      const responseProperties = responseApplicationJson.schema;
      if (!responseProperties) return acc;

      return {
        ...acc,
        [responseCode]: responseProperties,
      };
    },
    {},
  );
}

/**
 * Forms all the entries for all the methods of a given path. This generates a
 * properties map for each method definition found within the path, and then for
 * each good response status code with a schema.
 */
function buildPathPropertyEntries(
  pathName: string,
  pathInfo: PathRoot,
): Record<string, PropertiesMap> {
  return Object.entries(pathInfo).reduce((acc, [methodKey, methodInfo]) => {
    const propertiesMap = getPropertiesMapsFromMethodInfo(methodInfo);
    const propertiesToAppend = Object.entries(propertiesMap).reduce(
      (acc, [status, propertiesMap]) => {
        return {
          ...acc,
          [buildPathName(pathName, methodKey, status)]: propertiesMap,
        };
      },
      {},
    );
    return {
      ...acc,
      ...propertiesToAppend,
    };
  }, {});
}

/**
 * Will filter out the correct paths based on the options provided and then
 * return a full properties map for all of the matching routes, their methods,
 * and response codes.
 */
export function buildPathsPropertyMap(
  document: OpenAPIDocument,
  options: ProgramOptions,
): PropertiesMap {
  const { paths: pathOptions } = options;
  const paths = document.paths ?? {};

  return Object.entries(paths).reduce((acc, [pathName, pathInfo]) => {
    if (pathOptions.include && !matchesAny(pathName, pathOptions.include))
      return acc;
    if (pathOptions.exclude && matchesAny(pathName, pathOptions.exclude))
      return acc;

    const propertyEntries = buildPathPropertyEntries(pathName, pathInfo);
    return {
      ...acc,
      ...propertyEntries,
    };
  }, {});
}
