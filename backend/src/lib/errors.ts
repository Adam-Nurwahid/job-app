import { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Meneruskan error dari async handler ke error middleware
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
