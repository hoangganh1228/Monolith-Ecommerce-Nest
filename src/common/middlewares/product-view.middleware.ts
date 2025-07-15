import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request } from 'express';

@Injectable()
export class ProductViewMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    if (method === 'GET' && originalUrl.includes('/products')) {
      // console.log(`${method} ${originalUrl}`);
    }
    next();
  }
}
