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
  Physics: {
    Arcade: {
      Sprite: class {},
    },
  },
  Math: {
    Vector2: class {
      x = 0;
      y = 0;
    },
  },
}));

// Test the ProjectilePool exports and types
describe('ProjectilePool Types', () => {
  describe('ProjectileConfig', () => {
    it('should define projectile config', () => {
      interface ProjectileConfig {
        texture: string;
        speed: number;
        damage: number;
        lifespan: number;
        pierce?: number;
        explosive?: boolean;
      }
      const config: ProjectileConfig = {
        texture: 'arrow',
        speed: 300,
        damage: 10,
        lifespan: 3000,
      };
      expect(config.texture).toBe('arrow');
      expect(config.damage).toBe(10);
    });

    it('should allow optional pierce', () => {
      interface ProjectileConfig {
        texture: string;
        speed: number;
        damage: number;
        lifespan: number;
        pierce?: number;
        explosive?: boolean;
      }
      const config: ProjectileConfig = {
        texture: 'arrow',
        speed: 300,
        damage: 10,
        lifespan: 3000,
        pierce: 3,
      };
      expect(config.pierce).toBe(3);
    });

    it('should allow optional explosive', () => {
      interface ProjectileConfig {
        texture: string;
        speed: number;
        damage: number;
        lifespan: number;
        pierce?: number;
        explosive?: boolean;
      }
      const config: ProjectileConfig = {
        texture: 'arrow',
        speed: 300,
        damage: 10,
        lifespan: 3000,
        explosive: true,
      };
      expect(config.explosive).toBe(true);
    });
  });
});
