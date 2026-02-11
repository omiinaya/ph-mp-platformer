import { SaveManager } from "../../../src/core/SaveManager";
import { SaveData } from "../../../src/core/SaveManager";

describe("SaveManager", () => {
  let saveManager: SaveManager;
  let mockScene: any;

  beforeEach(() => {
    mockScene = {
      time: {
        addEvent: jest.fn(),
      },
      events: {
        emit: jest.fn(),
      },
    };

    // Clear localStorage before each test
    localStorage.clear();

    saveManager = new SaveManager(mockScene, false); // Disable auto-save for tests
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("constructor", () => {
    it("should initialize with default auto-save settings", () => {
      expect(saveManager.isAutoSaveEnabled()).toBe(false);
    });

    it("should initialize with auto-save disabled when false", () => {
      const manager = new SaveManager(mockScene, false);
      expect(manager.isAutoSaveEnabled()).toBe(false);
    });

    it("should initialize with auto-save enabled when true", () => {
      const manager = new SaveManager(mockScene, true);
      expect(manager.isAutoSaveEnabled()).toBe(true);
    });

    it("should use default auto-save interval if not provided", () => {
      const manager = new SaveManager(mockScene, true);
      expect(manager["autoSaveInterval"]).toBe(60000);
    });

    it("should use custom auto-save interval when provided", () => {
      const manager = new SaveManager(mockScene, true, 5000);
      expect(manager["autoSaveInterval"]).toBe(5000);
    });
  });

  describe("hasSave", () => {
    it("should return false for invalid slot indices", () => {
      expect(saveManager.hasSave(-1)).toBe(false);
      expect(saveManager.hasSave(5)).toBe(false);
    });

    it("should return false for non-existent save", () => {
      expect(saveManager.hasSave(0)).toBe(false);
    });

    it("should return true after saving", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };
      expect(saveManager.saveGame(0, saveData)).toBe(true);
      expect(saveManager.hasSave(0)).toBe(true);
    });
  });

  describe("hasAutoSave", () => {
    it("should return false when no auto-save exists", () => {
      expect(saveManager.hasAutoSave()).toBe(false);
    });

    it("should return true after auto-saving", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };
      expect(saveManager.saveAutoGame(saveData)).toBe(true);
      expect(saveManager.hasAutoSave()).toBe(true);
    });
  });

  describe("saveGame", () => {
    it("should return false for invalid slot indices", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };
      expect(saveManager.saveGame(-1, saveData)).toBe(false);
      expect(saveManager.saveGame(5, saveData)).toBe(false);
    });

    it("should save data and return true", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };
      expect(saveManager.saveGame(0, saveData)).toBe(true);
      expect(saveManager.hasSave(0)).toBe(true);
    });

    it("should merge save data with existing data", () => {
      const initialData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };

      const updateData: Partial<SaveData> = {
        player: {
          health: 8,
          maxHealth: 10,
          currentLevel: 2,
          unlockedLevels: [1],
          totalScore: 100,
          totalCoins: 5,
          totalEnemiesDefeated: 2,
        },
      };

      saveManager.saveGame(0, initialData);
      expect(saveManager.saveGame(0, updateData)).toBe(true);

      const loaded = saveManager.loadGame(0);
      expect(loaded?.player.health).toBe(8);
      expect(loaded?.player.currentLevel).toBe(2);
      expect(loaded?.player.totalScore).toBe(100);
    });

    it("should update timestamp on save", () => {
      const beforeTime = Date.now();
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };

      saveManager.saveGame(0, saveData);

      const loaded = saveManager.loadGame(0);
      expect(loaded?.timestamp).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe("saveAutoGame", () => {
    it("should save auto-save data", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };
      expect(saveManager.saveAutoGame(saveData)).toBe(true);
      expect(saveManager.hasAutoSave()).toBe(true);
    });

    it("should update timestamp", () => {
      const beforeTime = Date.now();
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };

      saveManager.saveAutoGame(saveData);
      const loaded = saveManager.loadAutoGame();
      expect(loaded?.timestamp).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe("loadGame", () => {
    it("should return undefined for invalid slot index", () => {
      expect(saveManager.loadGame(-1)).toBeUndefined();
      expect(saveManager.loadGame(5)).toBeUndefined();
    });

    it("should return undefined when save not found", () => {
      expect(saveManager.loadGame(0)).toBeUndefined();
    });

    it("should load saved game data", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 15,
          maxHealth: 20,
          currentLevel: 3,
          unlockedLevels: [1, 2, 3],
          totalScore: 500,
          totalCoins: 50,
          totalEnemiesDefeated: 10,
        },
        levels: {
          1: { highScore: 100, completed: true, lastCheckpoint: 0 },
          2: { highScore: 200, completed: false, lastCheckpoint: 0 },
          3: { highScore: 150, completed: false, lastCheckpoint: 2 },
        },
      };

      saveManager.saveGame(0, saveData);
      const loaded = saveManager.loadGame(0);

      expect(loaded).toBeDefined();
      expect(loaded?.player.health).toBe(15);
      expect(loaded?.player.currentLevel).toBe(3);
      expect(loaded?.player.unlockedLevels).toEqual([1, 2, 3]);
      expect(loaded?.levels[3]?.highScore).toBe(150);
      expect(loaded?.levels[1]?.completed).toBe(true);
    });
  });

  describe("loadAutoGame", () => {
    it("should return undefined when no auto-save exists", () => {
      expect(saveManager.loadAutoGame()).toBeUndefined();
    });

    it("should load auto-save data", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 20,
          maxHealth: 20,
          currentLevel: 1,
          unlockedLevels: [1, 2],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };

      saveManager.saveAutoGame(saveData);
      const loaded = saveManager.loadAutoGame();

      expect(loaded).toBeDefined();
      expect(loaded?.player.health).toBe(20);
      expect(loaded?.player.unlockedLevels).toEqual([1, 2]);
    });
  });

  describe("deleteSave", () => {
    it("should return false for invalid slot index", () => {
      expect(saveManager.deleteSave(-1)).toBe(false);
      expect(saveManager.deleteSave(5)).toBe(false);
    });

    it("should delete save and return true", () => {
      const saveData: Partial<SaveData> = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      };

      saveManager.saveGame(0, saveData);
      expect(saveManager.hasSave(0)).toBe(true);
      expect(saveManager.deleteSave(0)).toBe(true);
      expect(saveManager.hasSave(0)).toBe(false);
    });

    it("should return true when deleting non-existent save", () => {
      expect(saveManager.deleteSave(0)).toBe(true);
      expect(saveManager.hasSave(0)).toBe(false);
    });
  });

  describe("getSaveSlots", () => {
    it("should return array of 5 slots all empty initially", () => {
      const slots = saveManager.getSaveSlots();
      expect(slots.length).toBe(5);
      expect(slots.every((slot) => !slot.exists)).toBe(true);
    });

    it("should return slot info after saving", () => {
      const saveData = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 100,
          totalCoins: 10,
          totalEnemiesDefeated: 5,
        },
      } as SaveData;

      saveManager.saveGame(2, saveData);

      const slots = saveManager.getSaveSlots();
      expect(slots[0]?.exists).toBe(false);
      expect(slots[1]?.exists).toBe(false);
      expect(slots[2]?.exists).toBe(true);
      expect(slots[3]?.exists).toBe(false);
      expect(slots[4]?.exists).toBe(false);
    });

    it("should include save data in slot info", () => {
      const saveData = {
        player: {
          health: 15,
          maxHealth: 20,
          currentLevel: 2,
          unlockedLevels: [1, 2],
          totalScore: 250,
          totalCoins: 20,
          totalEnemiesDefeated: 8,
        },
      } as SaveData;

      saveManager.saveGame(1, saveData);

      const slots = saveManager.getSaveSlots();
      expect(slots[1]?.data).toBeDefined();
      expect(slots[1]?.data?.player.health).toBe(15);
      expect(slots[1]?.data?.player.currentLevel).toBe(2);
    });
  });

  describe("getAutoSaveInfo", () => {
    it("should return null when no auto-save exists", () => {
      expect(saveManager.getAutoSaveInfo()).toBeNull();
    });

    it("should return auto-save info when exists", () => {
      const saveData = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      } as SaveData;

      saveManager.saveAutoGame(saveData);

      const info = saveManager.getAutoSaveInfo();
      expect(info).not.toBeNull();
      expect(info?.index).toBe(-1); // -1 indicates auto-save
      expect(info?.exists).toBe(true);
      expect(info?.data).toBeDefined();
      expect(info?.data?.player.health).toBe(10);
    });
  });

  describe("clearAllSaves", () => {
    it("should clear all save slots", () => {
      const saveData1 = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 1,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      } as SaveData;

      const saveData2 = {
        player: {
          health: 10,
          maxHealth: 10,
          currentLevel: 2,
          unlockedLevels: [1],
          totalScore: 0,
          totalCoins: 0,
          totalEnemiesDefeated: 0,
        },
      } as SaveData;

      saveManager.saveGame(0, saveData1);
      saveManager.saveGame(1, saveData2);

      saveManager.clearAllSaves();

      expect(saveManager.hasSave(0)).toBe(false);
      expect(saveManager.hasSave(1)).toBe(false);
      expect(saveManager.hasSave(2)).toBe(false);
      expect(saveManager.hasSave(3)).toBe(false);
      expect(saveManager.hasSave(4)).toBe(false);
      expect(saveManager.hasAutoSave()).toBe(false);
    });
  });

  describe("destroy", () => {
    it("should clean up resources", () => {
      saveManager.destroy();
      expect(saveManager["scene"]).toBeUndefined();
    });
  });
});
