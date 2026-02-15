const mockSprite = jest.fn().mockImplementation(() => ({
  x: 0,
  y: 0,
  texture: { key: 'default' },
  setCollideWorldBounds: jest.fn().mockReturnThis(),
  setBounce: jest.fn().mockReturnThis(),
  setDrag: jest.fn().mockReturnThis(),
  setVelocity: jest.fn().mockReturnThis(),
  setPosition: jest.fn().mockReturnThis(),
  setScale: jest.fn().mockReturnThis(),
  setTint: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  setFlipX: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  destroy: jest.fn(),
  anims: {
    play: jest.fn(),
    exists: jest.fn().mockReturnValue(true),
    create: jest.fn(),
  },
  body: {
    setSize: jest.fn(),
    setOffset: jest.fn(),
    velocity: { x: 0, y: 0 },
    blocked: { down: false },
    touching: { down: false },
    enable: true,
  },
}));

module.exports = {
  Game: jest.fn(),
  Scene: jest.fn(),
  GameObjects: {
    Sprite: mockSprite,
  },
  Physics: {
    Arcade: {
      Sprite: mockSprite,
    },
  },
  Math: {
    Vector2: class MockVector2 {
      x = 0;
      y = 0;
      set(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    Vector3: class MockVector3 {},
  },
  Utils: {
    String: {
      UUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    },
  },
};
