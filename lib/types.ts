/** Types supported by OpenAPI and this script. */
export type OpenAPITypes =
  | 'object'
  | 'integer'
  | 'string'
  | 'array'
  | 'boolean'
  | 'number';

/** Along with PropertiesMap, creates recursive structure of the OpenAPI doc. */
export type PropertyDefinition = {
  type: OpenAPITypes;
  properties?: PropertiesMap;
  items?: PropertyDefinition;
};

/* Along with PropertyDefinition, creates recursive structure of OpenAPI doc. */
export type PropertiesMap = Record<string, PropertyDefinition>;

/** Different methods supported in OpenAPI */
export type OpenApiMethods =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';

/**
 * An entry for a method within a path. The string keys are the status codes
 * that are supported for that given method of a path.
 */
export type OpenApiPathMethodEntry = Partial<{
  responses: Record<
    string,
    {
      description?: string;
      content?: {
        'application/json'?: {
          schema?: PropertiesMap;
        };
      };
    }
  >;
}>;

/** The structure of an OpenAPI path. */
export type PathRoot = Record<OpenApiMethods, OpenApiPathMethodEntry>;

/** The structure of the entire OpenAPI document after being parsed. */
export type OpenAPIDocument = {
  components?: {
    schemas?: PropertiesMap;
  };
  paths?: Record<string, PathRoot>;
};

/** A reusable option within the program config. */
type ProgramGenerateOption = {
  generate: boolean;
  include?: string[];
  exclude?: string[];
};

/** The parsed program options that are passed around the script. */
export type ProgramOptions = {
  input: string;
  output: string;

  paths: ProgramGenerateOption;
  schemas: ProgramGenerateOption;

  typeNameFormat?: string;
};

/** An reusable option within the YAML config */
type YamlConfigGenerateOption =
  | boolean
  | { include?: string[]; exclude?: string[] };

/** The config file for the script. */
export type YamlConfig = Partial<{
  version: number;
  input: string;
  output: string;
  options: Partial<{
    typeNameFormat: string;
    paths: YamlConfigGenerateOption;
    schemas: YamlConfigGenerateOption;
  }>;
}>;
