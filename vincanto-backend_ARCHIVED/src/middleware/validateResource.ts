import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (e: any) {
    const errors = e.errors.map((error: any) => ({
        path: error.path.join('.'),
        message: error.message
    }));
    return res.status(400).json({ success: false, errors: errors });
  }
};

export default validate;