// backend/src/utils/errorHandler.ts
import { NextFunction, Request, Response } from 'express';

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for certificate not found
 */
export class CertificateNotFoundError extends AppError {
  constructor(certificateId: number) {
    super(`Certificate with ID ${certificateId} not found`, 404);
    this.name = 'CertificateNotFoundError';
  }
}

/**
 * Error for blockchain connection issues
 */
export class BlockchainConnectionError extends AppError {
  constructor(message: string = 'Blockchain connection failed') {
    super(message, 503); // Service Unavailable
    this.name = 'BlockchainConnectionError';
  }
}

/**
 * Error for contract interaction failures
 */
export class ContractInteractionError extends AppError {
  constructor(method: string, error: string) {
    super(`Contract interaction failed for ${method}: ${error}`, 500);
    this.name = 'ContractInteractionError';
  }
}

/**
 * Error for unauthorized issuer attempts
 */
export class UnauthorizedIssuerError extends AppError {
  constructor(issuerAddress: string) {
    super(
      `Address ${issuerAddress} is not authorized to issue certificates`,
      403,
    );
    this.name = 'UnauthorizedIssuerError';
  }
}

/**
 * Error for invalid certificate data
 */
export class InvalidCertificateDataError extends AppError {
  constructor(field: string, value: any) {
    super(`Invalid certificate data: ${field} = ${value}`, 400);
    this.name = 'InvalidCertificateDataError';
  }
}

/**
 * Global error handler middleware for Express
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log error for debugging
  console.error('🚨 Error caught by global handler:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle AppError instances
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Handle Zod validation errors (from our validation middleware)
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Request validation failed',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle unexpected errors
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(500).json({
    error: 'InternalServerError',
    message: isProduction ? 'An unexpected error occurred' : error.message,
    timestamp: new Date().toISOString(),
    ...(!isProduction && { stack: error.stack }),
  });
};

/**
 * Async error handler wrapper for Express routes
 * Eliminates the need for try-catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
