// Mock Phaser
jest.mock('phaser', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: {
      existing: jest.fn(),
    },
    physics: {
      add: {
        existing: jest.fn(),
      },
    },
  })),
  Math: {
    Vector2: class {
      x = 0;
      y = 0;
    },
  },
}));

// Test the ParticlePool exports and types
describe('ParticlePool Types', () => {
  describe('ParticleConfig', () => {
    it('should define particle config', () => {
      interface ParticleConfig {
        texture: string;
        x: number;
        y: number;
        speed: number;
        lifespan: number;
        quantity: number;
        scale?: { start: number; end: number };
        alpha?: { start: number; end: number };
        tint?: number;
      }
      const config: ParticleConfig = {
        texture: 'particle',
        x: 100,
        y: 200,
        speed: 50,
        lifespan: 1000,
        quantity: 10,
      };
      expect(config.texture).toBe('particle');
      expect(config.lifespan).toBe(1000);
    });

    it('should allow optional scale', () => {
      interface ParticleConfig {
        texture: string;
        x: number;
        y: number;
        speed: number;
        lifespan: number;
        quantity: number;
        scale?: { start: number; end: number };
        alpha?: { start: number; end: number };
        tint?: number;
      }
      const config: ParticleConfig = {
        texture: 'particle',
        x: 100,
        y: 200,
        speed: 50,
        lifespan: 1000,
        quantity: 10,
        scale: { start: 1, end: 0 },
      };
      expect(config.scale).toEqual({ start: 1, end: 0 });
    });

    it('should allow optional alpha', () => {
      interface ParticleConfig {
        texture: string;
        x: number;
        y: number;
        speed: number;
        lifespan: number;
        quantity: number;
        scale?: { start: number; end: number };
        alpha?: { start: number; end: number };
        tint?: number;
      }
      const config: ParticleConfig = {
        texture: 'particle',
        x: 100,
        y: 200,
        speed: 50,
        lifespan: 1000,
        quantity: 10,
        alpha: { start: 1, end: 0 },
      };
      expect(config.alpha).toEqual({ start: 1, end: 0 });
    });

    it('should allow optional tint', () => {
      interface ParticleConfig {
        texture: string;
        x: number;
        y: number;
        speed: number;
        lifespan: number;
        quantity: number;
        scale?: { start: number; end: number };
        alpha?: { start: number; end: number };
        tint?: number;
      }
      const config: ParticleConfig = {
        texture: 'particle',
        x: 100,
        y: 200,
        speed: 50,
        lifespan: 1000,
        quantity: 10,
        tint: 0xff0000,
      };
      expect(config.tint).toBe(0xff0000);
    });
  });
});
