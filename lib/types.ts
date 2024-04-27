import OpenAPIParser from '@readme/openapi-parser';

export type OpenAPITypes =
  | 'object'
  | 'integer'
  | 'string'
  | 'array'
  | 'boolean';

export type SchemaProperty = {
  type: OpenAPITypes;
  properties?: SchemaProperties;
  items?: SchemaProperty;
};
type SchemaProperties = Record<string, SchemaProperty>;

export type OpenAPIDocument = OpenAPIParser['api'] & {
  components?: {
    schemas?: Record<string, SchemaProperty>;
  };
};
