import {
  OpenAPIDocument,
  OpenAPITypes,
  ProgramOptions,
  PropertiesMap,
  PropertyDefinition,
} from '../types';
import { buildPathsPropertyMap } from './path-builder-utils';
import logger from '../logger';

const INDENT_SIZE = 2;
const getIndents = (level = 0) => ' '.repeat(level * INDENT_SIZE);
const indented = (text: string, level = 0, noIndent = false) =>
  noIndent ? text : `${getIndents(level)}${text}`;

/**
 * Simple function that returns the TypeScript type version for a given OpenAPI
 * type. As of now this simply just maps the integer type to number and leaves
 * the rest as is.
 *
 * Will throw an error if the type is not supported.
 */
function openApiTypeToTypeScriptType(openApiType: OpenAPITypes): string {
  switch (openApiType) {
    case 'integer':
      return 'number';
    case 'string':
    case 'boolean':
    case 'number':
      return openApiType;
    default:
      throw new Error(`Cannot convert OpenAPI type to TS type: ${openApiType}`);
  }
}

type GenerateCodeForPropertyParams = {
  currentPath?: string[];
  propertyName?: string;
  propertyDefinition: PropertyDefinition;
  isRequired: boolean;
  level?: number;
};

/**
 * Given a property name and definition, will return the TypeScript code for
 * that property. Will recursively call itself for nested objects or arrays.
 */
function generateCodeForProperty(
  params: GenerateCodeForPropertyParams,
): string | null {
  const {
    propertyName,
    propertyDefinition,
    isRequired,
    currentPath = [],
    level = 1,
  } = params;
  const unnamed = propertyName === undefined;

  // TODO: support for "additionalProperties" key
  let propertyPrefix = '';
  if (!unnamed && isRequired) propertyPrefix = `${propertyName}: `;
  if (!unnamed && !isRequired) propertyPrefix = `${propertyName}?: `;

  const { type, nullable = false } = propertyDefinition;
  if (['string', 'integer', 'boolean', 'number'].includes(type)) {
    let basicTypeString = openApiTypeToTypeScriptType(type);
    if (nullable) {
      basicTypeString = `Nullable<${basicTypeString}>`;
    }
    return indented(`${propertyPrefix}${basicTypeString}`, level, unnamed);
  }
  if (type === 'object') {
    const nextPath = [...currentPath];
    if (propertyName !== undefined) nextPath.push(propertyName);

    const { properties = {}, additionalProperties } = propertyDefinition;
    const propertyEntries = Object.entries(properties);
    const hasProperties = propertyEntries.length > 0;
    const hasAdditionalProperties = !!additionalProperties;

    if (!hasProperties && !hasAdditionalProperties) {
      return indented(
        `${propertyPrefix}Record<string, unknown>`,
        level,
        unnamed,
      );
    }

    let propertiesTypeString = indented(propertyPrefix, level, unnamed);
    if (hasProperties) {
      propertiesTypeString += '{\n';
      const innerRequiredProperties = propertyDefinition.required ?? [];
      propertyEntries.forEach(([propName, prop]) => {
        const innerIsRequired = innerRequiredProperties.includes(propName);
        const propTypeString = generateCodeForProperty({
          currentPath: nextPath,
          propertyName: propName,
          propertyDefinition: prop,
          isRequired: innerIsRequired,
          level: level + 1,
        });
        if (propTypeString) propertiesTypeString += `${propTypeString};\n`;
      });
    }

    // If there are no additional properties, we're good to return here
    if (!additionalProperties) {
      propertiesTypeString += indented('}', level);
      return propertiesTypeString;
    }

    // Below here we're dealing with additional properties
    // TODO: we should update generateCodeForProperty to be able to handle
    // "unnamed" properties, and then we can use it here and at the main
    // function as well.
    const valuesType = generateCodeForProperty({
      currentPath: nextPath,
      propertyDefinition: additionalProperties,
      isRequired: false,
      level: level,
    });
    const additionalPropertiesTypeString = `Record<string, ${valuesType}>`;

    // If there are already properties, we need to concatenate the additional
    // properties Record with existing
    if (hasProperties) {
      return `${propertiesTypeString} & ${additionalPropertiesTypeString}`;
    }
    return indented(
      `${propertyPrefix}${additionalPropertiesTypeString}`,
      level,
    );
  }

  if (type === 'array') {
    const { items } = propertyDefinition;
    if (!items) {
      const currentPathString = `${currentPath.join('.')}.${propertyName}`;
      logger.warn(`${currentPathString} is an array with no items. Skipping.`);
      return null;
    }
    const nextPath = [...currentPath, 'items[]'];
    const propTypeString = generateCodeForProperty({
      currentPath: nextPath,
      propertyName: propertyName,
      propertyDefinition: items,
      isRequired,
      level,
    });
    if (propTypeString) return `${propTypeString}[]`;
  }

  const currentPathString = `${currentPath.join('.')}.${propertyName}`;
  logger.warn(`${currentPathString} has unsupported type: ${type}. Skipping.`);
  return null;
}

/**
 * Generates types from the given OpenAPIDocument and options.
 */
export function buildTypes(
  document: OpenAPIDocument,
  options: ProgramOptions,
): string[] {
  logger.debug('starting type generation');
  const {
    typeNameFormat = '{name}',
    paths: pathOptions,
    schemas: schemaOptions,
  } = options;

  const allGeneratedTypes: string[] = [];

  // Schemas
  if (schemaOptions.generate) {
    logger.debug('generating types for schemas');
    const schemas = document.components?.schemas ?? {};
    const schemaTypes = generateTypesForMap(schemas, typeNameFormat);
    allGeneratedTypes.push(...schemaTypes);
    logger.debug(`generated ${schemaTypes.length} types from schemas`);
  }

  if (pathOptions.generate) {
    logger.debug('generating types for paths');
    const pathsPropertiesMap = buildPathsPropertyMap(document, options);
    const pathTypes = generateTypesForMap(pathsPropertiesMap, typeNameFormat);
    allGeneratedTypes.push(...pathTypes);
    logger.debug(`generated ${pathTypes.length} types from paths`);
  }

  logger.debug('finished type generation');
  return allGeneratedTypes;
}

function generateTypesForMap(
  propertiesMap: PropertiesMap,
  typeNameFormat: string,
) {
  const generatedTypesArray: string[] = [];

  Object.entries(propertiesMap).forEach(([schemaName, schemaDefinition]) => {
    const typeName = typeNameFormat.replace('{name}', schemaName);
    let generatedTypeCode = `export type ${typeName} = {\n`;
    const requiredProperties = schemaDefinition.required ?? [];
    // Iterate through the properties, generating the type string for each one.
    Object.entries(schemaDefinition.properties ?? {}).forEach(
      ([propertyName, propertyDefinition]) => {
        const isRequired = requiredProperties.includes(propertyName);
        const generatedPropertyCode = generateCodeForProperty({
          currentPath: [schemaName],
          propertyName,
          propertyDefinition,
          isRequired,
        });
        if (generatedPropertyCode)
          generatedTypeCode += `${generatedPropertyCode};\n`;
      },
    );
    generatedTypeCode += '};\n';
    generatedTypesArray.push(generatedTypeCode);
  });

  return generatedTypesArray;
}
