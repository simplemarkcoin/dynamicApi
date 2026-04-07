export type FieldType = 'text' | 'number' | 'select' | 'boolean' | 'date' | 'json';

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  fields: FieldDefinition[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface DataRecord {
  id: string;
  collectionId: string;
  data: Record<string, any>;
  createdAt: any;
  updatedAt: any;
}

export interface ApiConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  mapping: Record<string, string>;
  trigger: 'onCreate' | 'onUpdate';
  collectionId: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: any;
  createdBy: string;
}

export interface ApiLog {
  id: string;
  apiConfigId: string;
  status: number;
  request: any;
  response: any;
  timestamp: any;
}
