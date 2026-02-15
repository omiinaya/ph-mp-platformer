import { RoomManager, Room } from '../../../src/network/RoomManager';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('RoomManager', () => {
  let roomManager: RoomManager;
  let mockIo: any;
  let mockConnectionManager: any;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      sockets: {
        sockets: new Map(),
      },
    };
    mockConnectionManager = {
      assignRoom: jest.fn(),
      removeRoomAssignment: jest.fn(),
    };
    roomManager = new RoomManager(mockIo, mockConnectionManager);
  });

  describe('constructor', () => {
    it('should create a RoomManager instance', () => {
      expect(roomManager).toBeDefined();
    });
  });

  describe('createRoom', () => {
    it('should create a new room', () => {
      const room = roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });

      expect(room).toBeDefined();
      expect(room.roomId).toBe('room1');
      expect(room.gameMode).toBe('deathmatch');
      expect(room.isActive).toBe(true);
    });

    it('should create room with default max players', () => {
      const room = roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      expect(room.maxPlayers).toBe(4);
    });

    it('should create room with custom max players', () => {
      const room = roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        maxPlayers: 8,
        players: [],
      });

      expect(room.maxPlayers).toBe(8);
    });

    it('should emit room_created event', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });

      expect(mockIo.to).toHaveBeenCalledWith('room1');
    });
  });

  describe('getRoom', () => {
    it('should return room by ID', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const room = roomManager.getRoom('room1');
      expect(room).toBeDefined();
      expect(room?.roomId).toBe('room1');
    });

    it('should return undefined for non-existent room', () => {
      const room = roomManager.getRoom('nonexistent');
      expect(room).toBeUndefined();
    });
  });

  describe('addPlayer', () => {
    it('should add player to room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const result = roomManager.addPlayer('room1', 'player1', 'socket1');
      expect(result).toBe(true);
    });

    it('should not add player to non-existent room', () => {
      const result = roomManager.addPlayer('nonexistent', 'player1', 'socket1');
      expect(result).toBe(false);
    });

    it('should not add player to inactive room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });
      roomManager.pauseRoom('room1');

      const result = roomManager.addPlayer('room1', 'player1', 'socket1');
      expect(result).toBe(false);
    });

    it('should not add player to full room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        maxPlayers: 2,
        players: [
          { playerId: 'player1', socketId: 'socket1' },
          { playerId: 'player2', socketId: 'socket2' },
        ],
      });

      const result = roomManager.addPlayer('room1', 'player3', 'socket3');
      expect(result).toBe(false);
    });

    it('should not add duplicate player', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });

      const result = roomManager.addPlayer('room1', 'player1', 'socket1');
      expect(result).toBe(false);
    });
  });

  describe('removePlayer', () => {
    it('should remove player from room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });

      const result = roomManager.removePlayer('room1', 'player1');
      expect(result).toBe(true);
    });

    it('should return false for non-existent room', () => {
      const result = roomManager.removePlayer('nonexistent', 'player1');
      expect(result).toBe(false);
    });

    it('should return false for non-existent player', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const result = roomManager.removePlayer('room1', 'nonexistent');
      expect(result).toBe(false);
    });

    it('should destroy room when empty', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });

      roomManager.removePlayer('room1', 'player1');
      expect(roomManager.getRoom('room1')).toBeUndefined();
    });
  });

  describe('pauseRoom', () => {
    it('should pause active room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const result = roomManager.pauseRoom('room1');
      expect(result).toBe(true);
    });

    it('should not pause non-existent room', () => {
      const result = roomManager.pauseRoom('nonexistent');
      expect(result).toBe(false);
    });

    it('should not pause already paused room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });
      roomManager.pauseRoom('room1');

      const result = roomManager.pauseRoom('room1');
      expect(result).toBe(false);
    });
  });

  describe('resumeRoom', () => {
    it('should resume paused room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });
      roomManager.pauseRoom('room1');

      const result = roomManager.resumeRoom('room1');
      expect(result).toBe(true);
    });

    it('should not resume non-existent room', () => {
      const result = roomManager.resumeRoom('nonexistent');
      expect(result).toBe(false);
    });

    it('should not resume already active room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const result = roomManager.resumeRoom('room1');
      expect(result).toBe(false);
    });
  });

  describe('endRoom', () => {
    it('should end active room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const result = roomManager.endRoom('room1');
      expect(result).toBe(true);
    });

    it('should not end non-existent room', () => {
      const result = roomManager.endRoom('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getActiveRooms', () => {
    it('should return all active rooms', () => {
      roomManager.createRoom('room1', { gameMode: 'deathmatch', players: [] });
      roomManager.createRoom('room2', { gameMode: 'coop', players: [] });
      roomManager.pauseRoom('room1');

      const activeRooms = roomManager.getActiveRooms();
      expect(activeRooms).toHaveLength(1);
      expect(activeRooms[0].roomId).toBe('room2');
    });
  });

  describe('getRoomsForPlayer', () => {
    it('should return rooms for player', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });
      roomManager.createRoom('room2', {
        gameMode: 'coop',
        players: [{ playerId: 'player1', socketId: 'socket1' }],
      });

      const rooms = roomManager.getRoomsForPlayer('player1');
      expect(rooms).toHaveLength(2);
    });

    it('should return empty array for player not in any room', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      const rooms = roomManager.getRoomsForPlayer('nonexistent');
      expect(rooms).toHaveLength(0);
    });
  });

  describe('updateGameState', () => {
    it('should update game state', () => {
      roomManager.createRoom('room1', {
        gameMode: 'deathmatch',
        players: [],
      });

      roomManager.updateGameState('room1', { score: 10 });
      const room = roomManager.getRoom('room1');
      expect(room?.gameState).toEqual({ score: 10 });
    });

    it('should do nothing for non-existent room', () => {
      expect(() => {
        roomManager.updateGameState('nonexistent', {});
      }).not.toThrow();
    });
  });
});
