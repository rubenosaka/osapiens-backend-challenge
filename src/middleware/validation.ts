import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export interface ValidatedRequest<T> extends Request {
  validatedData: T;
}

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      (req as ValidatedRequest<T>).validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: "Validation Error",
          message: "The provided data is not valid",
          details: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error("Unexpected validation error:", error);
        res.status(500).json({
          error: "Internal Server Error",
          message: "Internal server error during validation",
        });
      }
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      (req as ValidatedRequest<T>).validatedData = validatedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: "Invalid Parameters",
          message: "URL parameters are not valid",
          details: formattedErrors,
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Internal server error",
        });
      }
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      (req as ValidatedRequest<T>).validatedData = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: "Invalid Query Parameters",
          message: "Query parameters are not valid",
          details: formattedErrors,
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Internal server error",
        });
      }
    }
  };
}

export function createErrorResponse(
  res: Response,
  statusCode: number,
  message: string,
  details?: any
) {
  return res.status(statusCode).json({
    error: "Request Error",
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}
