import { OpenAPIDocument, OpenAPITypes, SchemaProperty } from './types';

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
      return openApiType;
    default:
      throw new Error(`Cannot convert OpenAPI type to TS type: ${openApiType}`);
  }
}

/**
 * Given a schema property, will return the typescript string representation of
 * that property. Will recursively call itself for nested objects or arrays.
 */
function schemaTypeStringForProperty(
  propertyName: string,
  schemaProperty: SchemaProperty,
  level = 1,
): string {
  const { type, properties, items } = schemaProperty;
  if (['string', 'integer', 'boolean'].includes(type)) {
    return indented(
      `${propertyName}: ${openApiTypeToTypeScriptType(type)}`,
      level,
    );
  }
  if (type === 'object') {
    let stringRep = indented(`${propertyName}: {\n`, level);
    Object.entries(properties ?? {}).forEach(([propName, prop]) => {
      stringRep += `${schemaTypeStringForProperty(propName, prop, level + 1)};\n`;
    });
    stringRep += indented('}', level);
    return stringRep;
  }

  if (type === 'array') {
    if (!items) throw new Error('Array type must have items');
    return `${schemaTypeStringForProperty(propertyName, items, level)}[]`;
  }

  throw new Error(`Unsupported type: ${type}`);
}

type GenerateTypesOptions = {
  typeNameFormat?: string;
};

/**
 * Generates types from the given OpenAPIDocument and options.
 */
export function generateTypes(
  document: OpenAPIDocument,
  options: GenerateTypesOptions,
): string[] {
  const { typeNameFormat = '{name}' } = options;
  const typeStringsArray: string[] = [];

  // Schemas first, they're simple
  const schemas = document.components?.schemas ?? {};
  Object.entries(schemas).forEach(([name, schema]) => {
    const typeName = typeNameFormat.replace('{name}', name);
    let typeString = `export type ${typeName} = {\n`;
    Object.entries(schema.properties ?? {}).forEach(([propName, prop]) => {
      typeString += `${schemaTypeStringForProperty(propName, prop)};\n`;
    });
    typeString += '};\n';
    typeStringsArray.push(typeString);
  });

  return typeStringsArray;
}
