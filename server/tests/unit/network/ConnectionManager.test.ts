import { ConnectionManager } from '../../../src/network/ConnectionManager';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ProgressionService } from '../../../src/services/ProgressionService';
import { logger } from '../../../src/utils/logger';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('jsonwebtoken');
jest.mock('../../../src/services/ProgressionService');

describe('ConnectionManager', () => {
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;
  let connectionManager: ConnectionManager;
  let mockProgressionService: jest.Mocked<ProgressionService>;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    eventHandlers = new Map();
    mockServer = {
      on: jest.fn((event: string, handler: Function) => {
        eventHandlers.set(event, handler);
        return mockServer;
      }),
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      sockets: {
        sockets: new Map(),
      },
    } as any;

    mockSocket = {
      id: 'socket-123',
      handshake: {
        auth: {},
        query: {},
      },
      emit: jest.fn(),
      on: jest.fn((event: string, handler: Function) => {
        eventHandlers.set(`${mockSocket.id}:${event}`, handler);
        return mockSocket;
      }),
      join: jest.fn(),
      leave: jest.fn(),
    } as any;

    mockProgressionService = {
      initializePlayer: jest.fn().mockResolvedValue(undefined),
    } as any;

    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('setupEventHandlers', () => {
    it('should set up connection handler on initialization', () => {
      connectionManager = new ConnectionManager(mockServer);
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should set up connection handler with ProgressionService', () => {
      connectionManager = new ConnectionManager(mockServer, mockProgressionService);
      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('handleConnection', () => {
    beforeEach(() => {
      connectionManager = new ConnectionManager(mockServer);
    });

    it('should handle connection with valid JWT token', () => {
      const mockPlayerId = 'player-456';
      const mockToken = 'valid-token';
      process.env.JWT_SECRET = 'test-secret';
      
      mockSocket.handshake.auth = { token: mockToken };
      (jwt.verify as jest.Mock).mockReturnValue({ playerId: mockPlayerId });

      const connectionHandler = eventHandlers.get('connection')!;
      connectionHandler(mockSocket);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret');
      expect(mockSocket.emit).toHaveBeenCalledWith('connection_ack', {
        sessionId: 'socket-123',
        playerId: mockPlayerId,
        serverTime: expect.any(Number),
      });
    });

    it('should assign guest session when no token provided', () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};

      const connectionHandler = eventHandlers.get('connection')!;
      connectionHandler(mockSocket);

      const session = connectionManager.getSession('socket-123');
      expect(session?.playerId).toBe('guest_socket-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('connection_ack', {
        sessionId: 'socket-123',
        playerId: 'guest_socket-123',
        serverTime: expect.any(Number),
      });
    });

    it('should register disconnect event handler', () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};

      const connectionHandler = eventHandlers.get('connection')!;
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('handleDisconnection', () => {
    beforeEach(() => {
      connectionManager = new ConnectionManager(mockServer);
    });

    it('should handle disconnection without room assignment', () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      const connectionHandler = eventHandlers.get('connection')!;
      connectionHandler(mockSocket);

      const disconnectHandler = eventHandlers.get('socket-123:disconnect')!;
      disconnectHandler();

      expect(logger.info).toHaveBeenCalledWith('Client disconnected: socket-123');
      expect(connectionManager.getConnectedCount()).toBe(0);
    });

    it('should notify room on disconnection', () => {
      const mockEmit = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: mockEmit });

      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      const connectionHandler = eventHandlers.get('connection')!;
      connectionHandler(mockSocket);

      connectionManager.assignRoom('socket-123', 'room-1');

      const disconnectHandler = eventHandlers.get('socket-123:disconnect')!;
      disconnectHandler();

      expect(mockServer.to).toHaveBeenCalledWith('room-1');
      expect(mockEmit).toHaveBeenCalledWith('player_left', {
        playerId: 'guest_socket-123',
        socketId: 'socket-123',
      });
    });
  });

  describe('getSession', () => {
    beforeEach(() => {
      connectionManager = new ConnectionManager(mockServer);
      const connectionHandler = eventHandlers.get('connection')!;
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      connectionHandler(mockSocket);
    });

    it('should return session by socket ID', () => {
      const session = connectionManager.getSession('socket-123');
      expect(session).toBeDefined();
      expect(session?.socketId).toBe('socket-123');
    });

    it('should return undefined for unknown socket', () => {
      const session = connectionManager.getSession('unknown-socket');
      expect(session).toBeUndefined();
    });
  });

  describe('getSessionsInRoom', () => {
    beforeEach(() => {
      connectionManager = new ConnectionManager(mockServer);
      const connectionHandler = eventHandlers.get('connection')!;
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      connectionHandler(mockSocket);
    });

    it('should return all sessions in a room', () => {
      connectionManager.assignRoom('socket-123', 'room-1');

      const sessions = connectionManager.getSessionsInRoom('room-1');
      expect(sessions.length).toBe(1);
      expect(sessions[0].socketId).toBe('socket-123');
    });

    it('should return empty array for empty room', () => {
      const sessions = connectionManager.getSessionsInRoom('empty-room');
      expect(sessions).toEqual([]);
    });
  });

  describe('getConnectedCount', () => {
    beforeEach(() => {
      connectionManager = new ConnectionManager(mockServer);
    });

    it('should return connected client count', () => {
      const connectionHandler = eventHandlers.get('connection')!;
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      connectionHandler(mockSocket);

      expect(connectionManager.getConnectedCount()).toBe(1);
    });

    it('should return 0 when no clients connected', () => {
      expect(connectionManager.getConnectedCount()).toBe(0);
    });
  });
});
