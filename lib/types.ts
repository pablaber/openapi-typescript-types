export type OpenAPITypes =
  | 'object'
  | 'integer'
  | 'string'
  | 'array'
  | 'boolean'
  | 'number';

export type PropertyDefinition = {
  type: OpenAPITypes;
  properties?: PropertiesMap;
  items?: PropertyDefinition;
};
export type PropertiesMap = Record<string, PropertyDefinition>;

type OpenApiResponse = Partial<{
  description: string;
  content: {
    'application/json': {
      schema: PropertiesMap;
    };
  };
}>;
type OpenApiMethods =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head';
type OpenApiMethodDefinition = Partial<{
  description: string;
  summary: string;
  tags: string[];
  responses: Record<string, OpenApiResponse>;
}>;
export type PathRoot = Record<OpenApiMethods, OpenApiMethodDefinition>;
export type OpenAPIDocument = {
  components?: {
    schemas?: PropertiesMap;
  };
  paths?: Record<string, PathRoot>;
};

type ProgramGenerateOption = {
  generate: boolean;
  include?: string[];
  exclude?: string[];
};

export type ProgramOptions = {
  input: string;
  output: string;

  paths: ProgramGenerateOption;
  schemas: ProgramGenerateOption;

  typeNameFormat?: string;
};

type YamlConfigGenerateOption =
  | boolean
  | { include?: string[]; exclude?: string[] };

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
