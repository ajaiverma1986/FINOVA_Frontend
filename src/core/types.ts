export type Value = string | number | boolean | null;
export type Fields = Record<string, Value | File>;
export interface Field {
  name: string;
  label: string;
  type: string;
  required: boolean;
  default?: Value;
  uiOnly?: boolean;
}
export interface Operation {
  id: string;
  title: string;
  method: 'GET' | 'POST';
  path: string;
  fields: Field[];
  query: Record<string, string>;
  read: boolean;
  multipart?: boolean;
}
export interface PageDefinition {
  path: string;
  title: string;
  group: string;
  component: string;
  source: string;
  operations: string[];
  defaults: Record<string, Value>;
  columns: string[];
}
export interface ApiResponse<T = unknown> {
  Result?: T;
  HasError?: boolean | string;
  Errors?: { ErrorMessage?: string; ErrorCode?: number }[];
  TotalRecords?: number;
  [key: string]: unknown;
}
