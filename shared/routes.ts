import { z } from 'zod';
import { 
  insertListSchema, 
  insertTagSchema, 
  insertTaskSchema, 
  insertSubtaskSchema,
  lists,
  tags,
  tasks,
  subtasks,
  taskTags
} from './schema';

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

// Mocking custom types for nested responses
const listWithCountSchema = z.custom<typeof lists.$inferSelect & { taskCount: number }>();
const taskWithDetailsSchema = z.custom<typeof tasks.$inferSelect & { 
  list: typeof lists.$inferSelect | null,
  tags: (typeof taskTags.$inferSelect & { tag: typeof tags.$inferSelect })[],
  subtasks: typeof subtasks.$inferSelect[]
}>();

export const api = {
  lists: {
    list: {
      method: 'GET' as const,
      path: '/api/lists' as const,
      responses: {
        200: z.array(listWithCountSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/lists' as const,
      input: insertListSchema,
      responses: {
        201: z.custom<typeof lists.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/lists/:id' as const,
      input: insertListSchema.partial(),
      responses: {
        200: z.custom<typeof lists.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/lists/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  tags: {
    list: {
      method: 'GET' as const,
      path: '/api/tags' as const,
      responses: {
        200: z.array(z.custom<typeof tags.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tags' as const,
      input: insertTagSchema,
      responses: {
        201: z.custom<typeof tags.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks' as const,
      input: z.object({
        listId: z.coerce.number().optional(),
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(taskWithDetailsSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tasks/:id' as const,
      responses: {
        200: taskWithDetailsSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks' as const,
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tasks/:id' as const,
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    assignTag: {
      method: 'POST' as const,
      path: '/api/tasks/:id/tags' as const,
      input: z.object({ tagId: z.number() }),
      responses: {
        201: z.custom<typeof taskTags.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    removeTag: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id/tags/:tagId' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  subtasks: {
    create: {
      method: 'POST' as const,
      path: '/api/tasks/:taskId/subtasks' as const,
      input: z.object({ title: z.string() }),
      responses: {
        201: z.custom<typeof subtasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/subtasks/:id' as const,
      input: insertSubtaskSchema.partial(),
      responses: {
        200: z.custom<typeof subtasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subtasks/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  }
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

export type ListWithCountResponse = z.infer<typeof api.lists.list.responses[200]>[number];
export type TaskWithDetailsResponse = z.infer<typeof api.tasks.list.responses[200]>[number];
export type TaskInput = z.infer<typeof api.tasks.create.input>;
export type TaskUpdateInput = z.infer<typeof api.tasks.update.input>;
