import type { GObjectType } from '@gati-framework/contracts';

export const CreateTodoSchema: GObjectType = {
  kind: 'object',
  properties: {
    title: {
      kind: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Todo title'
    },
    description: {
      kind: 'string',
      maxLength: 500,
      nullable: true,
      description: 'Optional todo description'
    }
  },
  required: ['title']
};

export const UpdateTodoSchema: GObjectType = {
  kind: 'object',
  properties: {
    title: {
      kind: 'string',
      minLength: 1,
      maxLength: 100,
      nullable: true
    },
    completed: {
      kind: 'boolean',
      nullable: true
    }
  }
};

export const TodoResponseSchema: GObjectType = {
  kind: 'object',
  properties: {
    id: {
      kind: 'string',
      description: 'Unique todo identifier'
    },
    title: {
      kind: 'string',
      description: 'Todo title'
    },
    completed: {
      kind: 'boolean',
      description: 'Completion status'
    },
    createdAt: {
      kind: 'string',
      description: 'ISO 8601 timestamp'
    }
  },
  required: ['id', 'title', 'completed', 'createdAt']
};
