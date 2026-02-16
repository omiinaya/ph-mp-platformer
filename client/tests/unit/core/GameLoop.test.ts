// Type tests for GameLoop
import { GameLoopConfig, GameLoopEvent } from '../../../src/core/GameLoop';

// Mock Phaser completely
jest.mock('phaser', () => ({
  Events: {
    EventEmitter: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('GameLoop', () => {
  describe('type definitions', () => {
    it('should export GameLoopConfig interface', () => {
      const config: GameLoopConfig = {
        targetFps: 60,
        fixedTimestep: false,
        fixedDelta: 16.67,
        maxDelta: 100,
        slowMotion: false,
        slowMotionFactor: 0.5,
      };
      expect(config.targetFps).toBe(60);
    });

    it('should export GameLoopEvent enum', () => {
      expect(GameLoopEvent.PreUpdate).toBe('preupdate');
      expect(GameLoopEvent.Update).toBe('update');
      expect(GameLoopEvent.PostUpdate).toBe('postupdate');
      expect(GameLoopEvent.FixedUpdate).toBe('fixedupdate');
      expect(GameLoopEvent.Render).toBe('render');
    });
  });

  describe('GameLoopEvent values', () => {
    it('should have correct event names', () => {
      expect(GameLoopEvent.PreUpdate).toBeDefined();
      expect(GameLoopEvent.Update).toBeDefined();
      expect(GameLoopEvent.PostUpdate).toBeDefined();
      expect(GameLoopEvent.FixedUpdate).toBeDefined();
      expect(GameLoopEvent.Render).toBeDefined();
    });
  });
});
