import { Request, Response, NextFunction } from 'express';

// We need to import the module to access the buckets
// Use jest.doMock pattern to get fresh state
let httpRateLimit: any;
let startCleanupInterval: any;

jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('httpRateLimit', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    // Require fresh module to get cleared buckets
    jest.resetModules();
    const module = require('../../../../src/network/middleware/httpRateLimit');
    httpRateLimit = module.httpRateLimit;
    startCleanupInterval = module.startCleanupInterval;
    
    mockReq = {
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    
    nextFn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('httpRateLimit middleware', () => {
    it('should call next for first request within limit', () => {
      const middleware = httpRateLimit(100, 60000);
      middleware(mockReq as Request, mockRes as Response, nextFn);
      
      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 99);
    });

    it('should set rate limit headers', () => {
      const middleware = httpRateLimit(50, 60000);
      middleware(mockReq as Request, mockRes as Response, nextFn);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 50);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 49);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('should block requests exceeding rate limit', () => {
      const middleware = httpRateLimit(2, 60000);
      
      // First request
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
      
      // Second request
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(2);
      
      // Third request should be blocked
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        retryAfter: expect.any(Number),
      });
      expect(nextFn).not.toHaveBeenCalledTimes(3);
    });

    it('should use custom maxRequests and window', () => {
      const middleware = httpRateLimit(10, 30000);
      middleware(mockReq as Request, mockRes as Response, nextFn);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    });

    it('should handle missing IP address', () => {
      mockReq = {
        ip: undefined as any,
        socket: {
          remoteAddress: undefined,
        } as any,
      };
      
      const middleware = httpRateLimit(100, 60000);
      middleware(mockReq as Request, mockRes as Response, nextFn);
      
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('startCleanupInterval', () => {
    it('should start cleanup interval', () => {
      // Just verify the function can be called without throwing
      expect(() => {
        startCleanupInterval(1000);
      }).not.toThrow();
    });
  });
});
