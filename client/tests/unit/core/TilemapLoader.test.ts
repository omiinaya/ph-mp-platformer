// Mock Phaser
jest.mock('phaser', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    load: {
      tilemapTiledJSON: jest.fn(),
    },
    make: {
      tilemap: jest.fn().mockReturnValue(null),
    },
  })),
}));

import { TilemapLoader, LoadedTilemapData } from '../../../src/core/TilemapLoader';
import { LevelConfig } from '../../../src/core/LevelManager';

describe('TilemapLoader', () => {
  let mockScene: any;
  let loader: TilemapLoader;

  beforeEach(() => {
    mockScene = {
      load: {
        tilemapTiledJSON: jest.fn(),
      },
      make: {
        tilemap: jest.fn().mockReturnValue({
          tilesets: [],
          layers: [],
          objects: [],
          addTilesetImage: jest.fn().mockReturnValue({}),
          createLayer: jest.fn().mockReturnValue({}),
        }),
      },
    };
    loader = new TilemapLoader(mockScene);
  });

  describe('constructor', () => {
    it('should create a TilemapLoader instance', () => {
      expect(loader).toBeInstanceOf(TilemapLoader);
    });
  });

  describe('loadTilemap', () => {
    it('should call scene.load.tilemapTiledJSON', () => {
      loader.loadTilemap('level1', 'assets/level1.json');
      expect(mockScene.load.tilemapTiledJSON).toHaveBeenCalledWith('level1', 'assets/level1.json');
    });
  });

  describe('createFromTilemap', () => {
    it('should return null when tilemap is null', () => {
      mockScene.make.tilemap.mockReturnValueOnce(null);
      const result = loader.createFromTilemap('level1');
      expect(result).toBeNull();
    });

    it('should return loaded tilemap data', () => {
      const mockMap = {
        tilesets: [{ name: 'tiles', tileWidth: 32, tileHeight: 32 }],
        layers: [
          {
            name: 'Ground',
            tilemapLayer: {},
          },
        ],
        objects: [
          {
            name: 'platforms',
            objects: [{ x: 100, y: 200, width: 32, height: 32 }],
          },
          {
            name: 'enemies',
            objects: [{ x: 50, y: 100, type: 'slime' }],
          },
          {
            name: 'items',
            objects: [{ x: 75, y: 150, type: 'coin' }],
          },
          {
            name: 'player',
            objects: [{ x: 50, y: 300, type: 'spawn' }],
          },
        ],
      };
      mockScene.make.tilemap.mockReturnValueOnce(mockMap);

      const result = loader.createFromTilemap('level1');

      expect(result).not.toBeNull();
      expect(result?.objects.platforms).toHaveLength(1);
      expect(result?.objects.enemies).toHaveLength(1);
      expect(result?.objects.items).toHaveLength(1);
      expect(result?.objects.playerSpawn).toEqual({ x: 50, y: 300 });
    });
  });

  describe('loadLevelFromJSON', () => {
    it('should load level from config', () => {
      const config: LevelConfig = {
        key: 'level1',
        tilemap: 'assets/level1.json',
      };

      const mockMap = {
        tilesets: [],
        layers: [],
        objects: [],
        addTilesetImage: jest.fn().mockReturnValue({}),
        createLayer: jest.fn().mockReturnValue({}),
      };
      mockScene.make.tilemap.mockReturnValueOnce(mockMap);

      const result = loader.loadLevelFromJSON(config);
      expect(result).not.toBeNull();
    });
  });

  describe('preloadLevelAssets', () => {
    it('should preload tilemap assets', () => {
      const config: LevelConfig = {
        key: 'level1',
        tilemap: 'assets/level1.json',
      };

      loader.preloadLevelAssets(config);
      expect(mockScene.load.tilemapTiledJSON).toHaveBeenCalledWith('level1', 'assets/level1.json');
    });

    it('should not preload when no tilemap defined', () => {
      const config: LevelConfig = {
        key: 'level1',
      };

      loader.preloadLevelAssets(config);
      expect(mockScene.load.tilemapTiledJSON).not.toHaveBeenCalled();
    });
  });
});
