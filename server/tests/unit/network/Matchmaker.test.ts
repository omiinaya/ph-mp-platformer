import { Matchmaker } from '../../../src/network/Matchmaker';
import { ConnectionManager } from '../../../src/network/ConnectionManager';
import { RoomManager } from '../../../src/network/RoomManager';
import { Server, Socket } from 'socket.io';
import { MatchmakingPreferences, MatchmakingRequest } from '../../../src/types/matchmaking';
import { PlayerSession } from '../../../src/persistence/models/PlayerSession';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../src/workers/MatchmakingWorker');

describe('Matchmaker', () => {
  let mockServer: jest.Mocked<Server>;
  let mockConnectionManager: jest.Mocked<ConnectionManager>;
  let mockRoomManager: jest.Mocked<RoomManager>;
  let matchmaker: Matchmaker;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    mockServer = {
      sockets: {
        sockets: new Map(),
      },
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;

    mockConnectionManager = {
      getSession: jest.fn(),
      assignRoom: jest.fn(),
    } as any;

    mockRoomManager = {
      createRoom: jest.fn(),
    } as any;

    mockSocket = {
      id: 'socket-123',
      emit: jest.fn(),
      join: jest.fn(),
    } as any;

    matchmaker = new Matchmaker(mockServer, mockConnectionManager, mockRoomManager);
  });

  afterEach(() => {
    matchmaker.stop();
    jest.clearAllMocks();
  });

  describe('enqueuePlayer', () => {
    it('should add player to queue', () => {
      const session: PlayerSession = {
        socketId: 'socket-123',
        playerId: 'player1',
        connectedAt: new Date(),
        lastActivity: new Date(),
        roomId: null,
      };
      mockConnectionManager.getSession.mockReturnValue(session);

      const preferences: MatchmakingPreferences = {
        gameMode: 'deathmatch',
        region: 'us-east',
      };

      const requestId = matchmaker.enqueuePlayer(mockSocket, preferences);
      
      expect(requestId).toBeDefined();
      expect(mockSocket.emit).toHaveBeenCalledWith('matchmaking_queued', expect.objectContaining({
        requestId,
        estimatedWait: expect.any(Number),
      }));
    });

    it('should throw if session not found', () => {
      mockConnectionManager.getSession.mockReturnValue(undefined);

      expect(() => {
        matchmaker.enqueuePlayer(mockSocket, { gameMode: 'deathmatch' });
      }).toThrow('Player session not found');
    });
  });

  describe('dequeuePlayer', () => {
    it('should remove player from queue', () => {
      const session: PlayerSession = {
        socketId: 'socket-123',
        playerId: 'player1',
        connectedAt: new Date(),
        lastActivity: new Date(),
        roomId: null,
      };
      mockConnectionManager.getSession.mockReturnValue(session);

      const preferences: MatchmakingPreferences = {
        gameMode: 'deathmatch',
      };

      matchmaker.enqueuePlayer(mockSocket, preferences);
      expect(matchmaker.getQueueLength()).toBe(1);

      const result = matchmaker.dequeuePlayer('socket-123');
      expect(result).toBe(true);
      expect(matchmaker.getQueueLength()).toBe(0);
    });

    it('should return false if player not in queue', () => {
      const result = matchmaker.dequeuePlayer('unknown-socket');
      expect(result).toBe(false);
    });
  });

  describe('getQueueLength', () => {
    it('should return 0 for empty queue', () => {
      expect(matchmaker.getQueueLength()).toBe(0);
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status for player', () => {
      const session: PlayerSession = {
        socketId: 'socket-123',
        playerId: 'player1',
        connectedAt: new Date(),
        lastActivity: new Date(),
        roomId: null,
      };
      mockConnectionManager.getSession.mockReturnValue(session);

      matchmaker.enqueuePlayer(mockSocket, { gameMode: 'deathmatch' });
      
      const status = matchmaker.getQueueStatus('socket-123');
      expect(status).toBeDefined();
      expect(status?.playerId).toBe('player1');
    });

    it('should return undefined for unknown player', () => {
      const status = matchmaker.getQueueStatus('unknown-socket');
      expect(status).toBeUndefined();
    });
  });

  describe('stop', () => {
    it('should clear matchmaking interval', () => {
      matchmaker.stop();
      // Should not throw
    });
  });

  describe('processQueue', () => {
    it('should process queue when worker succeeds', async () => {
      const session: PlayerSession = {
        socketId: 'socket-123',
        playerId: 'player1',
        connectedAt: new Date(),
        lastActivity: new Date(),
        roomId: null,
      };
      mockConnectionManager.getSession.mockReturnValue(session);
      mockConnectionManager.assignRoom.mockReturnValue();
      
      const preferences: MatchmakingPreferences = {
        gameMode: 'deathmatch',
        region: 'us-east',
      };
      
      matchmaker.enqueuePlayer(mockSocket, preferences);
      
      // Wait for the matchmaking loop to process
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should not process empty queue', async () => {
      // Queue is empty, should not throw
      await (matchmaker as any).processQueue();
    });
  });

  describe('createMatch', () => {
    it('should create a match with matched requests', () => {
      const requests: MatchmakingRequest[] = [
        {
          requestId: 'req_1',
          playerId: 'player1',
          socketId: 'socket-123',
          preferences: { gameMode: 'deathmatch', region: 'us-east' },
          queuedAt: new Date(),
        },
        {
          requestId: 'req_2',
          playerId: 'player2',
          socketId: 'socket-124',
          preferences: { gameMode: 'deathmatch', region: 'us-east' },
          queuedAt: new Date(),
        },
      ];

      mockConnectionManager.assignRoom.mockReturnValue();
      
      (matchmaker as any).createMatch(requests);
      
      expect(mockRoomManager.createRoom).toHaveBeenCalled();
      expect(mockConnectionManager.assignRoom).toHaveBeenCalled();
    });
  });

  describe('groupByGameMode', () => {
    it('should group requests by game mode and region', () => {
      const requests: MatchmakingRequest[] = [
        {
          requestId: 'req_1',
          playerId: 'player1',
          socketId: 'socket-123',
          preferences: { gameMode: 'deathmatch', region: 'us-east' },
          queuedAt: new Date(),
        },
        {
          requestId: 'req_2',
          playerId: 'player2',
          socketId: 'socket-124',
          preferences: { gameMode: 'deathmatch', region: 'us-east' },
          queuedAt: new Date(),
        },
        {
          requestId: 'req_3',
          playerId: 'player3',
          socketId: 'socket-125',
          preferences: { gameMode: 'ctf', region: 'us-west' },
          queuedAt: new Date(),
        },
      ];

      const groups = (matchmaker as any).groupByGameMode(requests);
      
      expect(groups.size).toBe(2);
      expect(groups.get('deathmatch_us-east')?.length).toBe(2);
      expect(groups.get('ctf_us-west')?.length).toBe(1);
    });

    it('should handle requests without region', () => {
      const requests: MatchmakingRequest[] = [
        {
          requestId: 'req_1',
          playerId: 'player1',
          socketId: 'socket-123',
          preferences: { gameMode: 'deathmatch' },
          queuedAt: new Date(),
        },
      ];

      const groups = (matchmaker as any).groupByGameMode(requests);
      
      expect(groups.size).toBe(1);
      expect(groups.get('deathmatch_any')?.length).toBe(1);
    });
  });

  describe('estimateWaitTime', () => {
    it('should return estimated wait time', () => {
      const waitTime = (matchmaker as any).estimateWaitTime();
      expect(waitTime).toBeGreaterThan(0);
    });
  });
});
