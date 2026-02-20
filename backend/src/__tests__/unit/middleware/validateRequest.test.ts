import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from '../../../middleware/validateRequest.js';
import type { Request, Response, NextFunction } from 'express';

function makeReq(body: unknown) {
  return { body } as Request;
}

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

describe('validate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('calls next() and replaces req.body with parsed data on valid input', () => {
    const req = makeReq({ name: 'Alice', age: 30 });
    const res = makeRes();
    const middleware = validate(testSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('returns 400 VALIDATION_ERROR when required field is missing', () => {
    const req = makeReq({ name: 'Alice' }); // missing age
    const res = makeRes();

    validate(testSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'VALIDATION_ERROR' })
    );
  });

  it('returns 400 when field type is wrong', () => {
    const req = makeReq({ name: 'Alice', age: 'not-a-number' });
    const res = makeRes();

    validate(testSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when body is empty object', () => {
    const req = makeReq({});
    const res = makeRes();

    validate(testSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('includes validation details in error response', () => {
    const req = makeReq({ name: '', age: 30 }); // name too short
    const res = makeRes();

    validate(testSchema)(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: expect.any(Object),
      })
    );
  });

  it('applies schema defaults via Zod parsing', () => {
    const schemaWithDefault = z.object({
      name: z.string(),
      active: z.boolean().default(true),
    });
    const req = makeReq({ name: 'Bob' });
    const res = makeRes();

    validate(schemaWithDefault)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'Bob', active: true });
  });
});
