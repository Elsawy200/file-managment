import { ZodType, ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;

      // Express 5 exposes `req.query` as a getter, so assigning to it throws.
      // Define own properties so downstream handlers receive Zod's transformed
      // values (for example, coerced numbers and defaults).
      for (const key of ["body", "query", "params"] as const) {
        if (parsed[key] !== undefined) {
          Object.defineProperty(req, key, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: parsed[key],
          });
        }
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: err.issues,
        });
        return;
      }
      next(err);
    }
  };
