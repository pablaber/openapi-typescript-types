import {
  OpenAPIDocument,
  OpenAPITypes,
  ProgramOptions,
  PropertiesMap,
  PropertyDefinition,
} from './types';

const INDENT_SIZE = 2;
const getIndents = (level = 0) => ' '.repeat(level * INDENT_SIZE);
const indented = (text: string, level = 0) => `${getIndents(level)}${text}`;

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

/**
 * Given a property name and definition, will return the TypeScript code for
 * that property. Will recursively call itself for nested objects or arrays.
 */
function generateCodeForProperty(
  propertyName: string,
  propertyDefinition: PropertyDefinition,
  level = 1,
): string | null {
  const { type, properties, items } = propertyDefinition;
  if (['string', 'integer', 'boolean', 'number'].includes(type)) {
    return indented(
      `${propertyName}: ${openApiTypeToTypeScriptType(type)}`,
      level,
    );
  }
  if (type === 'object') {
    let stringRep = indented(`${propertyName}: {\n`, level);
    Object.entries(properties ?? {}).forEach(([propName, prop]) => {
      const propTypeString = generateCodeForProperty(propName, prop, level + 1);
      if (propTypeString) stringRep += `${propTypeString};\n`;
    });
    stringRep += indented('}', level);
    return stringRep;
  }

  if (type === 'array') {
    if (!items) {
      console.warn(
        `  ! Property ${propertyName} is an array with no items. Skipping.`,
      );
      return null;
    }
    const propTypeString = generateCodeForProperty(propertyName, items, level);
    if (propTypeString) return `${propTypeString}[]`;
  }

  console.warn(
    `  ! Property ${propertyName} has unsupported type: ${type}. Skipping.`,
  );
  return null;
}

/**
 * Generates types from the given OpenAPIDocument and options.
 */
export function generateTypes(
  document: OpenAPIDocument,
  options: ProgramOptions,
): string[] {
  const {
    typeNameFormat = '{name}',
    paths: pathOptions,
    schemas: schemaOptions,
  } = options;

  const allGeneratedTypes: string[] = [];

  // Schemas
  if (schemaOptions.generate) {
    const schemas = document.components?.schemas ?? {};
    const schemaTypes = generateTypesForMap(schemas, typeNameFormat);
    allGeneratedTypes.push(...schemaTypes);
  }

  if (pathOptions.generate) {
    // TODO: paths
  }

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

    // Iterate through the properties, generating the type string for each one.
    Object.entries(schemaDefinition.properties ?? {}).forEach(
      ([propertyName, propertyDefinition]) => {
        const generatedPropertyCode = generateCodeForProperty(
          propertyName,
          propertyDefinition,
        );
        if (generatedPropertyCode)
          generatedTypeCode += `${generatedPropertyCode};\n`;
      },
    );
    generatedTypeCode += '};\n';
    generatedTypesArray.push(generatedTypeCode);
  });

  return generatedTypesArray;
}
