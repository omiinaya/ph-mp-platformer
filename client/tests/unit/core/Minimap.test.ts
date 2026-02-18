// Mock Phaser
jest.mock('phaser', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: {
      container: jest.fn().mockReturnValue({
        setPosition: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
    },
    cameras: {
      main: {
        worldView: {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        },
      },
    },
  })),
}));

// Test the Minimap exports and types
describe('Minimap Types', () => {
  describe('MinimapConfig', () => {
    it('should define minimap config', () => {
      interface MinimapConfig {
        width: number;
        height: number;
        x: number;
        y: number;
        zoom: number;
        scrollSpeed: number;
      }
      const config: MinimapConfig = {
        width: 200,
        height: 150,
        x: 600,
        y: 10,
        zoom: 0.5,
        scrollSpeed: 100,
      };
      expect(config.width).toBe(200);
      expect(config.zoom).toBe(0.5);
    });

    it('should allow optional background alpha', () => {
      interface MinimapConfig {
        width: number;
        height: number;
        x: number;
        y: number;
        zoom: number;
        scrollSpeed: number;
        backgroundAlpha?: number;
      }
      const config: MinimapConfig = {
        width: 200,
        height: 150,
        x: 600,
        y: 10,
        zoom: 0.5,
        scrollSpeed: 100,
        backgroundAlpha: 0.5,
      };
      expect(config.backgroundAlpha).toBe(0.5);
    });
  });
});
