// Mock Phaser
const mockScene = {
  scene: {
    start: jest.fn(),
  },
  preload: jest.fn(),
  create: jest.fn(),
};

jest.mock('phaser', () => ({
  Scene: jest.fn().mockImplementation(() => mockScene),
}));

import { BootScene } from '../../../src/scenes/BootScene';

describe('BootScene', () => {
  let bootScene: BootScene;

  beforeEach(() => {
    jest.clearAllMocks();
    bootScene = new BootScene();
  });

  describe('constructor', () => {
    it('should create a BootScene instance', () => {
      expect(bootScene).toBeInstanceOf(BootScene);
    });
  });

  describe('preload', () => {
    it('should have a preload method', () => {
      expect(typeof bootScene.preload).toBe('function');
    });
  });

  describe('create', () => {
    it('should have a create method', () => {
      expect(typeof bootScene.create).toBe('function');
    });

    it('should start PreloadScene', () => {
      bootScene.create();
      expect(mockScene.scene.start).toHaveBeenCalledWith('PreloadScene');
    });
  });
});
