import OpenAPIParser from '@readme/openapi-parser';

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

export type OpenAPIDocument = OpenAPIParser['api'] & {
  components?: {
    schemas?: PropertiesMap;
  };
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