import { Context } from 'hono';
import { ZodError } from 'zod';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export class AppError extends Error implements ApiError {
  code: string;
  statusCode: number;
  details?: Record<string, any>;

  constructor(message: string, code: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', err);

  // Handle ZodError (validation errors)
  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err.errors,
      },
      400
    );
  }

  // Handle AppError
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        code: err.code,
        details: err.details,
      },
      err.statusCode
    );
  }

  // Default error response
  return c.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
    500
  );
};
