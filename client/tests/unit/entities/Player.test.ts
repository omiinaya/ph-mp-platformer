import "phaser";
import { Player, PlayerConfig } from "../../../src/entities/Player";
import { Inventory } from "../../../src/entities/Inventory";
import { AnimationManager } from "../../../src/core/AnimationManager";

// Mock Phaser
jest.mock("phaser", () => {
  return {
    Scene: class MockScene {
      add = {
        sprite: jest.fn().mockReturnValue({
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
          x: 0,
          y: 0,
          texture: { key: "player" },
        }),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
        }),
      };
      physics = {
        add: {
          sprite: jest.fn().mockReturnValue({
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
            },
            x: 0,
            y: 0,
            texture: { key: "player" },
          }),
        },
      };
      events = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      };
      tweens = {
        add: jest.fn().mockReturnValue({ stop: jest.fn() }),
      };
      time = {
        now: 0,
      };
    },
    GameObjects: {
      Sprite: class MockSprite {
        x = 0;
        y = 0;
        texture = { key: "player" };
      },
    },
    Physics: {
      Arcade: {
        Sprite: class MockPhysicsSprite {
          x = 0;
          y = 0;
          body = {
            setSize: jest.fn(),
            setOffset: jest.fn(),
            velocity: { x: 0, y: 0 },
            blocked: { down: false },
            touching: { down: false },
          };
          texture = { key: "player" };
        },
      },
    },
  };
});

describe("Player", () => {
  let player: Player;
  let mockScene: any;
  let mockAnimationManager: any;

  beforeEach(() => {
    mockScene = {
      add: {
        sprite: jest.fn().mockReturnValue({
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
          x: 100,
          y: 200,
          texture: { key: "player" },
        }),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
        }),
      },
      physics: {
        add: {
          sprite: jest.fn().mockReturnValue({
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
            },
            x: 100,
            y: 200,
            texture: { key: "player" },
          }),
        },
      },
      events: {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
      },
      tweens: {
        add: jest.fn().mockReturnValue({ stop: jest.fn() }),
      },
      time: {
        now: 0,
      },
    };

    mockAnimationManager = {
      playAnimation: jest.fn(),
      stopAnimation: jest.fn(),
      setAnimationState: jest.fn(),
      addAnimationState: jest.fn(),
    };

    const config: PlayerConfig = {
      sessionId: "test-session-123",
      name: "TestPlayer",
      health: 100,
      moveSpeed: 200,
      jumpForce: 400,
      animationManager: mockAnimationManager,
    };

    player = new Player(mockScene, 100, 200, "player", config);
  });

  afterEach(() => {
    if (player) {
      player.destroy();
    }
  });

  describe("constructor", () => {
    it("should initialize with correct default values", () => {
      expect(player.health).toBe(100);
      expect(player.maxHealth).toBe(100);
      expect(player.name).toBe("TestPlayer");
      expect(player.sessionId).toBe("test-session-123");
      expect(player.inventory).toBeDefined();
      expect(player.inventorySize).toBe(10);
    });

    it("should initialize with custom health value", () => {
      const customPlayer = new Player(mockScene, 100, 200, "player", {
        health: 150,
      });
      expect(customPlayer.health).toBe(150);
      expect(customPlayer.maxHealth).toBe(150);
    });

    it("should generate session ID if not provided", () => {
      const customPlayer = new Player(mockScene, 100, 200, "player", {});
      expect(customPlayer.sessionId).toBeDefined();
      expect(customPlayer.sessionId.length).toBeGreaterThan(0);
    });
  });

  describe("health management", () => {
    it("should take damage correctly", () => {
      const initialHealth = player.health;
      player.takeDamage(20);
      expect(player.health).toBe(initialHealth - 20);
    });

    it("should not take damage below 0", () => {
      player.takeDamage(200);
      expect(player.health).toBe(0);
    });

    it("should heal correctly", () => {
      player.takeDamage(50);
      player.heal(20);
      expect(player.health).toBe(70);
    });

    it("should not heal above max health", () => {
      player.heal(100);
      expect(player.health).toBe(100);
    });

    it("should return false from takeDamage when health reaches 0", () => {
      const result = player.takeDamage(100);
      expect(result).toBe(false);
      expect(player.health).toBe(0);
    });

    it("should return true from takeDamage when health remains above 0", () => {
      const result = player.takeDamage(50);
      expect(result).toBe(true);
      expect(player.health).toBe(50);
    });
  });

  describe("position management", () => {
    it("should return correct x position", () => {
      expect(player.x).toBe(100);
    });

    it("should return correct y position", () => {
      expect(player.y).toBe(200);
    });

    it("should update position", () => {
      player.setPosition(300, 400);
      expect(player.x).toBe(300);
      expect(player.y).toBe(400);
    });
  });

  describe("inventory management", () => {
    it("should have an inventory", () => {
      expect(player.inventory).toBeDefined();
    });

    it("should have default inventory size of 10", () => {
      expect(player.inventorySize).toBe(10);
    });
  });

  describe("animation", () => {
    it("should have an animation manager", () => {
      expect(player["animationManager"]).toBeDefined();
    });

    it("should initialize animations", () => {
      player.initializeAnimations();
      expect(player["animationsInitialized"]).toBe(true);
    });
  });

  describe("combo system", () => {
    it("should start with combo count of 0", () => {
      expect(player["comboCount"]).toBe(0);
    });

    it("should start with combo multiplier of 1.0", () => {
      expect(player["comboMultiplier"]).toBe(1.0);
    });

    it("should get combo multiplier", () => {
      expect(player.getComboMultiplier()).toBe(1.0);
    });

    it("should get combo count", () => {
      expect(player.getComboCount()).toBe(0);
    });
  });

  describe("parry system", () => {
    it("should start with parry not active", () => {
      expect(player.isParryActive()).toBe(false);
    });

    it("should have parry cooldown remaining of 0 initially", () => {
      expect(player.getParryCooldownRemaining()).toBe(0);
    });
  });

  describe("attack system", () => {
    it("should have attack cooldown timer", () => {
      expect(player["attackTimer"]).toBeDefined();
    });

    it("should start not attacking", () => {
      expect(player["isAttacking"]).toBe(false);
    });
  });

  describe("update", () => {
    it("should update without errors", () => {
      const delta = 16;
      expect(() => player.update(delta)).not.toThrow();
    });
  });

  describe("destroy", () => {
    it("should destroy cleanly", () => {
      expect(() => player.destroy()).not.toThrow();
    });

    it("should clean up resources", () => {
      player.destroy();
      expect(player.active).toBe(false);
    });
  });

  describe("takeDamage with events", () => {
    it("should emit player:damage event when taking damage", () => {
      player.takeDamage(10);
      expect(mockScene.events.emit).toHaveBeenCalledWith(
        "player:damage",
        expect.any(Object),
      );
    });
  });

  describe("heal with events", () => {
    it("should emit player:healed event when healing", () => {
      player.takeDamage(20);
      player.heal(10);
      expect(mockScene.events.emit).toHaveBeenCalledWith(
        "player:healed",
        expect.any(Object),
      );
    });
  });
});
