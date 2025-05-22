import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function generateTypes() {
  try {
    const sqlFile = readFileSync(join(process.cwd(), 'lib', 'db.types.sql'), 'utf-8');
    
    // Extract table definitions
    const tables = sqlFile.match(/CREATE TABLE.*?;/gs) || [];
    const views = sqlFile.match(/CREATE (?:OR REPLACE )?VIEW.*?;/gs) || [];
    const functions = sqlFile.match(/CREATE (?:OR REPLACE )?FUNCTION.*?\$\$/gs) || [];
    
    let types = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
`;

    // Process each schema
    ['public', 'analytics', 'assistants', 'users'].forEach(schema => {
      types += `  ${schema}: {\n    Tables: {\n`;
      
      // Add tables
      tables.forEach(table => {
        if (table.includes(`CREATE TABLE ${schema}.`)) {
          const tableName = table.match(/CREATE TABLE.*?"(.*?)"/)?.[1].split('.')[1] || '';
          const columns = table.match(/\(([\s\S]*?)\)/)?.[1] || '';
          
          types += `      ${tableName}: {\n`;
          types += `        Row: {\n`;
          
          // Parse columns
          const columnDefs = columns.split('\n').filter(c => c.trim().startsWith('"'));
          columnDefs.forEach(col => {
            const match = col.match(/"([^"]+)"\s+([^,\n]+)/);
            if (match) {
              const [, name, type] = match;
              const tsType = sqlTypeToTS(type);
              const isNullable = !col.includes('NOT NULL');
              types += `          ${name}: ${tsType}${isNullable ? ' | null' : ''};\n`;
            }
          });
          
          types += '        };\n';
          types += '        Insert: {\n';
          columnDefs.forEach(col => {
            const match = col.match(/"([^"]+)"\s+([^,\n]+)/);
            if (match) {
              const [, name, type] = match;
              const tsType = sqlTypeToTS(type);
              const isNullable = !col.includes('NOT NULL');
              const hasDefault = col.includes('DEFAULT');
              types += `          ${name}${hasDefault ? '?' : ''}: ${tsType}${isNullable ? ' | null' : ''};\n`;
            }
          });
          types += '        };\n';
          types += '        Update: {\n';
          columnDefs.forEach(col => {
            const match = col.match(/"([^"]+)"\s+([^,\n]+)/);
            if (match) {
              const [, name, type] = match;
              const tsType = sqlTypeToTS(type);
              types += `          ${name}?: ${tsType} | null;\n`;
            }
          });
          types += '        };\n';
          types += '      };\n';
        }
      });
      
      types += '    };\n';
      
      // Add views
      types += '    Views: {\n';
      views.forEach(view => {
        if (view.includes(`CREATE VIEW ${schema}.`)) {
          const viewName = view.match(/CREATE.*?VIEW.*?"([^"]+)"/)?.[1].split('.')[1] || '';
          const columns = view.match(/AS SELECT([\s\S]*?)(?:FROM|;)/)?.[1] || '';
          
          types += `      ${viewName}: {\n`;
          types += `        Row: {\n`;
          const columnList = columns.split(',').map(col => col.trim());
          columnList.forEach(col => {
            const colName = col.split(/\s+AS\s+/).pop()?.trim().replace(/[",]/g, '') || '';
            if (colName) {
              types += `          ${colName}: unknown;\n`;
            }
          });
          types += '        };\n      };\n';
        }
      });
      types += '    };\n';
      
      // Add functions
      types += '    Functions: {\n';
      functions.forEach(func => {
        if (func.includes(`CREATE FUNCTION ${schema}.`)) {
          const funcName = func.match(/CREATE.*?FUNCTION.*?"([^"]+)"/)?.[1].split('.')[1] || '';
          const args = func.match(/\(([\s\S]*?)\)/)?.[1] || '';
          const returnType = func.match(/RETURNS (.*?)(?:\s|$)/)?.[1] || 'void';
          
          types += `      ${funcName}: {\n`;
          types += `        Args: {\n`;
          
          // Parse arguments
          args.split(',').forEach(arg => {
            const parts = arg.trim().split(/\s+/);
            if (parts.length >= 2) {
              const name = parts[0].replace(/^p_/, '');
              const type = parts[1];
              const hasDefault = arg.includes('DEFAULT');
              types += `          ${name}${hasDefault ? '?' : ''}: ${sqlTypeToTS(type)};\n`;
            }
          });
          
          types += '        };\n';
          types += `        Returns: ${sqlTypeToTS(returnType)};\n`;
          types += '      };\n';
        }
      });
      types += '    };\n';
      types += '  };\n';
    });
    
    types += '}';
    
    writeFileSync(join(process.cwd(), 'lib', 'db.types.ts'), types);
    console.log('Successfully generated TypeScript types from SQL schema');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

function sqlTypeToTS(sqlType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'string',
    'varchar': 'string',
    'char': 'string',
    'uuid': 'string',
    'int': 'number',
    'integer': 'number',
    'bigint': 'number',
    'numeric': 'number',
    'decimal': 'number',
    'boolean': 'boolean',
    'bool': 'boolean',
    'timestamptz': 'string',
    'timestamp': 'string',
    'date': 'string',
    'time': 'string',
    'jsonb': 'Json',
    'json': 'Json',
    'void': 'undefined'
  };
  
  const baseType = sqlType.toLowerCase().split('(')[0].trim();
  return typeMap[baseType] || 'unknown';
}

generateTypes();