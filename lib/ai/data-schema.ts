import { z } from 'zod';
import { DataSchema } from '@/types/agent';

export function createZodSchemaFromDataSchema(dataSchema: DataSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  dataSchema.fields.forEach(field => {
    let zodType: z.ZodTypeAny;
    
    switch (field.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        zodType = z.array(z.string());
        break;
      default:
        zodType = z.string();
    }
    
    if (!field.required) {
      zodType = zodType.optional();
    }
    
    shape[field.name] = zodType;
  });
  
  return z.object(shape);
}

