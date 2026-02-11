import type { Response, NextFunction } from 'express';
import type { ApiKeyRequest } from '../middleware/validateApiKey.js';
import * as sdkLogService from '../services/sdkLog.service.js';

export async function ingestLogs(req: ApiKeyRequest, res: Response, next: NextFunction) {
  try {
    const data = sdkLogService.batchLogSchema.parse(req.body);
    const result = await sdkLogService.ingestBatch(
      req.project.id,
      req.projectUser.id,
      data
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
