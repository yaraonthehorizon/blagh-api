import { Response } from 'express';
import { Result } from '../types/result';
import { ResponseCode } from '../constants/enums';

export function handleResponse(res: Response, result: Result<any>) {
  let status = 200;
  switch (result.statusCode) {
    case ResponseCode.Ok:
      status = 200;
      break;
    case ResponseCode.NotExist:
      status = 404;
      break;
    case ResponseCode.Duplicate:
      status = 409;
      break;
    case ResponseCode.Unauthorized:
      status = 401;
      break;
    default:
      status = 400;
  }
  res.status(status).json(result);
} 