import { z } from 'zod';
import { insertDataFileSchema, insertAnalysisSchema, dataFiles, analyses } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  files: {
    upload: {
      method: 'POST' as const,
      path: '/api/files',
      // Multipart form data, not typed here
      responses: {
        201: z.custom<typeof dataFiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/files',
      responses: {
        200: z.array(z.custom<typeof dataFiles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/files/:id',
      responses: {
        200: z.custom<typeof dataFiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  analyses: {
    create: {
      method: 'POST' as const,
      path: '/api/analyses',
      input: z.object({
        fileId: z.number(),
      }),
      responses: {
        201: z.custom<typeof analyses.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/analyses',
      responses: {
        200: z.array(z.custom<typeof analyses.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/analyses/:id',
      responses: {
        200: z.custom<typeof analyses.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/analyses/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type DataFileInput = z.infer<typeof insertDataFileSchema>;
export type AnalysisInput = z.infer<typeof api.analyses.create.input>;
