// backend/src/middleware/validationMiddleware.ts
import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { prepareCertificateSchema } from '../schemas/certificateSchemas.js';

/**
 * Express middleware for request validation using Zod schemas
 * @param schema - Zod schema to validate against
 * @returns Middleware function that validates request data
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data against the schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Validation successful, proceed to next middleware
      next();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          message: 'One or more fields are invalid',
          details: validationErrors,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle unexpected errors
      console.error('Unexpected validation error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

/**
 * Middleware to validate request body only
 * @param schema - Zod schema for body validation
 */
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // CORRECTION: Validate req.body directly, not nested under 'body'
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Invalid request body',
          details: validationErrors,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate request parameters only
 * @param schema - Zod schema for params validation
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // CORRECTION: Validate req.params directly, not nested under 'params'
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Invalid URL parameters',
          details: validationErrors,
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  };
};

/**
 * Special validation for certificate preparation
 * Includes issuer address validation
 */
export const validateCertificatePreparation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  validateBody(prepareCertificateSchema)(req, res, next);
};
