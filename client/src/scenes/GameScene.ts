import { Scene } from "phaser";
import { AssetManager } from "../core/AssetManager";
import { InputManager, InputConfig } from "../core/InputManager";
import { PhysicsManager } from "../core/PhysicsManager";
import { GameLoop, GameLoopEvent } from "../core/GameLoop";
import { eventBus } from "../core/EventBus";
import { AnimationManager } from "../core/AnimationManager";
import { AudioService, setGlobalAudioService } from "../core/AudioService";
import {
  ParticleManager,
  setGlobalParticleManager,
} from "../core/ParticleManager";
import { EntityFactory } from "../factories/EntityFactory";
import { Player } from "../entities/Player";
import { Enemy, Projectile, Archer } from "../entities/Enemy";
import { Item } from "../entities/Item";
import { Platform } from "../entities/Platform";
import { LevelManager, LevelConfig } from "../core/LevelManager";
import { TilemapLoader, LoadedTilemapData } from "../core/TilemapLoader";
import { SceneService } from "../core/SceneManager";
import { PauseSceneData } from "./PauseScene";
import { GameOverSceneData } from "./GameOverScene";

export interface GameSceneData {
  level?: number;
  restart?: boolean;
}

export class GameScene extends Scene {
  private player!: Player;
  private assetManager?: AssetManager;
  private inputManager?: InputManager;
  private physicsManager?: PhysicsManager;
  private gameLoop?: GameLoop;
  private entityFactory?: EntityFactory;
  private levelManager?: LevelManager;
  private tilemapLoader?: TilemapLoader;
  private sceneService?: SceneService;
  private animationManager?: AnimationManager;
  private audioService?: AudioService;
  private particleManager?: ParticleManager;
  private enemies: Enemy[] = [];
  private items: Item[] = [];
  private platforms: Platform[] = [];
  private projectiles: Projectile[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private healthText?: Phaser.GameObjects.Text;
  private healthBar?: Phaser.GameObjects.Graphics;
  private healthBarBg?: Phaser.GameObjects.Graphics;
  private levelText?: Phaser.GameObjects.Text;
  private currentLevel: number = 1;
  private isPaused: boolean = false;
  private lastHealth: number = 0;
  private currentScore: number = 0;
  private displayedScore: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: GameSceneData) {
    this.currentLevel = data.level ?? 1;
    this.isPaused = false;
  }

  preload() {
    // Use AssetManager to load assets
    this.assetManager = new AssetManager(this);

    // Initialize AnimationManager for preloading sprite sheets
    this.animationManager = new AnimationManager(this);

    // Initialize AudioService for preloading audio
    this.audioService = new AudioService(this);
    this.audioService.preload();

    // Load sprite sheets with animations
    // Player: 32px frames, 26 total frames (8 idle + 8 walk + 4 jump + 6 attack)
    this.load.spritesheet("player", "assets/spritesheets/player.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Enemy sprite sheets
    this.load.spritesheet("slime", "assets/spritesheets/slime.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("flying", "assets/spritesheets/flying.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("archer", "assets/spritesheets/archer.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image("arrow", "assets/sprites/arrow.png");

    // Static items (we'll animate them with tweens)
    this.load.svg("health_potion", "assets/sprites/health_potion.svg", {
      width: 32,
      height: 32,
    });
    this.load.svg("coin", "assets/sprites/coin.svg", { width: 32, height: 32 });
    this.load.svg("platform", "assets/sprites/platform.svg", {
      width: 32,
      height: 32,
    });

    // Load all level tilemaps
    this.load.tilemapTiledJSON("level1", "assets/tilemaps/level1.json");
    this.load.tilemapTiledJSON("level2", "assets/tilemaps/level2.json");
    this.load.tilemapTiledJSON("level3", "assets/tilemaps/level3.json");
  }

  create() {
    // Initialize SceneService
    this.sceneService = new SceneService(this.game);

    // Initialize LevelManager
    this.levelManager = new LevelManager(this);
    const loaded = this.levelManager.loadLevelByNumber(this.currentLevel);
    if (!loaded) {
      console.error(`Failed to load level ${this.currentLevel}`);
      return;
    }

    const levelConfig = this.levelManager.getCurrentLevel()!;
    const bgColor = levelConfig.backgroundColor ?? 0x1a1a2e;

    // Background
    this.add
      .rectangle(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        bgColor,
      )
      .setOrigin(0);

    // Set up level callbacks
    this.levelManager.setScoreCallback((score) => {
      this.updateUI();
    });
    this.levelManager.setLevelCompleteCallback(() => {
      this.handleLevelComplete();
    });
    this.levelManager.setGameOverCallback(() => {
      this.handleGameOver(false);
    });

    // Initialize AudioService
    this.audioService!.create();
    setGlobalAudioService(this.audioService!);
    this.audioService!.playMusic("gameplay_music");

    // Subscribe to audio events
    this.setupAudioEvents();

    // Initialize ParticleManager
    this.particleManager = new ParticleManager(this);
    setGlobalParticleManager(this.particleManager);

    // Initialize PhysicsManager
    this.physicsManager = new PhysicsManager(this, {
      gravity: { x: 0, y: 300 },
      debug: false,
    });

    // Initialize InputManager
    const inputConfig: InputConfig = {
      actions: [
        { id: "left", keys: ["Left", "A"] },
        { id: "right", keys: ["Right", "D"] },
        { id: "jump", keys: ["Up", "W", "Space"] },
        { id: "pause", keys: ["Escape", "P"] },
        { id: "attack", keys: ["Z", "Space"] },
      ],
    };
    this.inputManager = new InputManager(this, inputConfig);
    this.inputManager.onInputEvent((event) => {
      if (event.action === "pause" && event.active) {
        this.openPauseMenu();
      }
    });

    // Initialize EntityFactory
    this.entityFactory = new EntityFactory(this);

    // Create player using factory with animation manager
    this.player = this.entityFactory.createPlayer(100, 300, {
      sessionId: "test",
      name: "Hero",
      health: 20,
      moveSpeed: -1, // use default
      animationManager: this.animationManager,
    });
    this.player.bindInputManager(this.inputManager);
    this.physicsManager.enableBody(this.player);
    this.physicsManager.setBodyCollisionWithBounds(
      this.player.body as Phaser.Physics.Arcade.Body,
    );

    // Initialize player animations
    this.player.initializeAnimations();
    this.lastHealth = this.player.health;

    // Create platforms
    const ground = this.entityFactory.createPlatform(400, 500, {
      tileWidth: 10,
      tileHeight: 1,
      tileSize: 32,
    });
    this.platforms.push(ground);

    const movingPlatform = this.entityFactory.createMovingHorizontalPlatform(
      200,
      400,
      200,
      100,
    );
    this.platforms.push(movingPlatform);

    // Create enemies
    const slime = this.entityFactory.createSlime(300, 400);
    this.enemies.push(slime);

    const flyingEnemy = this.entityFactory.createFlyingEnemy(500, 200);
    this.enemies.push(flyingEnemy);

    // Create items with callbacks and particle effects
    const healthPotion = this.entityFactory.createHealthPotion(150, 350);
    healthPotion.onCollide = (player) => {
      this.levelManager?.collectItem("health_potion");
      // Health pickup particles
      this.particleManager?.createHealthPickupEffect(
        healthPotion.x,
        healthPotion.y,
      );
      // Play sound
      this.audioService?.playSFX("health_pickup");
      healthPotion.destroy();
    };
    this.items.push(healthPotion);

    const coin = this.entityFactory.createCoin(250, 350);
    coin.onCollide = (player) => {
      this.levelManager?.collectCoin();
      // Coin collection particles
      this.particleManager?.createCoinSparkles(coin.x, coin.y);
      // Play sound
      this.audioService?.playSFX("coin");
      coin.destroy();
    };
    this.items.push(coin);

    // Add more coins for scoring
    const coin2 = this.entityFactory.createCoin(400, 250);
    coin2.onCollide = (player) => {
      this.levelManager?.collectCoin();
      this.particleManager?.createCoinSparkles(coin2.x, coin2.y);
      this.audioService?.playSFX("coin");
      coin2.destroy();
    };
    this.items.push(coin2);

    const coin3 = this.entityFactory.createCoin(600, 300);
    coin3.onCollide = (player) => {
      this.levelManager?.collectCoin();
      this.particleManager?.createCoinSparkles(coin3.x, coin3.y);
      this.audioService?.playSFX("coin");
      coin3.destroy();
    };
    this.items.push(coin3);

    // Add item animations (coin spin and potion glow)
    this.items.forEach((item) => {
      if (item.texture.key === "coin") {
        // Coin spin animation
        this.tweens.add({
          targets: item,
          scaleX: 0,
          duration: 300,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        // Floating animation
        this.tweens.add({
          targets: item,
          y: item.y - 5,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      } else if (item.texture.key === "health_potion") {
        // Potion glow animation
        this.tweens.add({
          targets: item,
          alpha: 0.7,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        // Gentle float
        this.tweens.add({
          targets: item,
          y: item.y - 3,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    });

    // Set up collisions
    this.physicsManager.setCollision(this.player, ground);
    this.physicsManager.setOverlap(
      this.player,
      healthPotion,
      (playerObj, itemObj) => {
        const item = itemObj as Item;
        const player = playerObj as Player;
        item.onCollide(player);
      },
    );
    this.physicsManager.setOverlap(this.player, coin, (playerObj, itemObj) => {
      const item = itemObj as Item;
      const player = playerObj as Player;
      item.onCollide(player);
    });
    this.physicsManager.setCollision(
      this.player,
      slime,
      (playerObj, enemyObj) => {
        // Player takes damage when colliding with enemy
        const player = playerObj as Player;
        const enemy = enemyObj as Enemy;

        if (player.takeDamage(1)) {
          // Screen shake
          this.cameras.main.shake(200, 0.01);
          // Damage particles
          this.particleManager?.createDamageEffect(player.x, player.y, 1);
          // Play sound
          this.audioService?.playSFX("player_hit");
        }
      },
    );
    this.physicsManager.setCollision(
      this.player,
      flyingEnemy,
      (playerObj, enemyObj) => {
        // Player takes damage when colliding with enemy
        const player = playerObj as Player;

        if (player.takeDamage(1)) {
          // Screen shake
          this.cameras.main.shake(200, 0.01);
          // Damage particles
          this.particleManager?.createDamageEffect(player.x, player.y, 1);
          // Play sound
          this.audioService?.playSFX("player_hit");
        }
      },
    );

    // Set up projectile collisions
    this.setupProjectileCollisions();

    // Listen for enemy projectile firing
    this.events.on(
      "enemy:projectile-fired",
      (data: { enemy: Enemy; projectile: Projectile }) => {
        this.projectiles.push(data.projectile);
        if (this.physicsManager) {
          this.physicsManager.enableBody(data.projectile);
          this.physicsManager.setCollision(
            this.player,
            data.projectile,
            (playerObj, projectileObj) => {
              const player = playerObj as Player;
              const projectile = projectileObj as Projectile;
              if (player.takeDamage(projectile.getDamage())) {
                this.cameras.main.shake(200, 0.01);
                this.particleManager?.createDamageEffect(
                  player.x,
                  player.y,
                  projectile.getDamage(),
                );
                this.audioService?.playSFX("player_hit");
              }
              projectile.onHit();
            },
          );
        }
      },
    );

    // Initialize GameLoop
    this.gameLoop = new GameLoop(this);
    this.gameLoop.on(GameLoopEvent.Update, (delta) => {
      this.handleInput(delta);
      this.updateEntities(delta);
      this.checkGameConditions();
    });
    this.gameLoop.start();

    // Camera follow with level-specific bounds
    this.cameras.main.startFollow(this.player);

    // Set camera bounds based on level dimensions
    const levelBounds = this.getLevelBounds(this.currentLevel);
    this.cameras.main.setBounds(0, 0, levelBounds.width, levelBounds.height);

    // Set physics world bounds
    this.physicsManager?.setBounds(0, 0, levelBounds.width, levelBounds.height);

    // Create UI
    this.createUI();

    // Subscribe to events
    eventBus.on("game:pause", this.openPauseMenu.bind(this));
    eventBus.on("game:resume", this.resumeGame.bind(this));
  }

  update(time: number, delta: number) {
    // Update input manager
    if (this.inputManager && !this.isPaused) {
      this.inputManager.update();
    }
    // GameLoop updates are handled via its own event
  }

  private createUI(): void {
    const { width } = this.cameras.main;

    // Score text with animated counter
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "28px",
      color: "#f1c40f",
      fontFamily: "Arial",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setShadow(2, 2, "#000000", 2, true, true);

    // Health bar background
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRoundedRect(18, 53, 204, 24, 4);
    this.healthBarBg.setScrollFactor(0);

    // Health bar
    this.healthBar = this.add.graphics();
    this.healthBar.fillStyle(0xe74c3c);
    this.healthBar.fillRoundedRect(20, 55, 200, 20, 4);
    this.healthBar.setScrollFactor(0);

    // Health text (overlay on bar)
    this.healthText = this.add.text(120, 65, "20 / 20", {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold",
    });
    this.healthText.setOrigin(0.5);
    this.healthText.setScrollFactor(0);
    this.healthText.setShadow(1, 1, "#000000", 1, true, true);

    // Level text
    this.levelText = this.add.text(
      width - 20,
      20,
      `Level ${this.currentLevel}`,
      {
        fontSize: "24px",
        color: "#3498db",
        fontFamily: "Arial",
        fontStyle: "bold",
      },
    );
    this.levelText.setOrigin(1, 0);
    this.levelText.setScrollFactor(0);
  }

  private updateUI(): void {
    if (this.levelManager) {
      const state = this.levelManager.getState();
      this.currentScore = state.score;

      // Animate score counter
      if (this.scoreText && this.currentScore !== this.displayedScore) {
        const diff = this.currentScore - this.displayedScore;
        const increment = Math.max(1, Math.ceil(diff * 0.1)); // Smooth animation
        this.displayedScore += increment;
        if (this.displayedScore > this.currentScore) {
          this.displayedScore = this.currentScore;
        }
        this.scoreText.setText(`Score: ${this.displayedScore}`);
      }
    }

    if (this.player && this.healthBar && this.healthText) {
      // Update health bar
      const healthPercent = this.player.health / this.player.maxHealth;
      const barWidth = 200 * Math.max(0, Math.min(1, healthPercent));

      this.healthBar.clear();

      // Change color based on health
      if (healthPercent > 0.6) {
        this.healthBar.fillStyle(0x2ecc71); // Green
      } else if (healthPercent > 0.3) {
        this.healthBar.fillStyle(0xf1c40f); // Yellow
      } else {
        this.healthBar.fillStyle(0xe74c3c); // Red
      }

      this.healthBar.fillRoundedRect(20, 55, barWidth, 20, 4);

      // Update health text
      this.healthText.setText(
        `${this.player.health} / ${this.player.maxHealth}`,
      );
    }
  }

  private handleInput(delta: number): void {
    // Input handling is now delegated to Player via InputManager binding
    // Additional global input (e.g., pause) can be handled here
  }

  private updateEntities(delta: number): void {
    if (this.isPaused) return;

    // Update player (always)
    this.player.update(delta);

    // Get camera bounds with a margin for culling
    const camera = this.cameras.main;
    const margin = 200;
    const left = camera.worldView.x - margin;
    const right = camera.worldView.x + camera.worldView.width + margin;
    const top = camera.worldView.y - margin;
    const bottom = camera.worldView.y + camera.worldView.height + margin;

    // Helper to check if a game object is within bounds
    const isInView = (obj: Phaser.GameObjects.GameObject) => {
      const x = (obj as any).x ?? 0;
      const y = (obj as any).y ?? 0;
      return x >= left && x <= right && y >= top && y <= bottom;
    };

    // Update enemies within view
    this.enemies.forEach((enemy) => {
      if (isInView(enemy)) {
        enemy.update(delta);
      }
    });

    // Update items within view
    this.items.forEach((item) => {
      if (isInView(item)) {
        item.update(delta);
      }
    });

    // Update platforms within view (optional, but platforms may move)
    this.platforms.forEach((platform) => {
      if (isInView(platform)) {
        platform.update(delta);
      }
    });

    // Update projectiles and remove destroyed ones
    this.projectiles = this.projectiles.filter((projectile) => {
      if (projectile.active) {
        projectile.update(delta);
        return true;
      }
      return false;
    });

    // Update UI
    this.updateUI();
  }

  private checkGameConditions(): void {
    if (!this.player || !this.levelManager) return;

    // Check if player died
    if (this.player.health <= 0 && this.lastHealth > 0) {
      this.handleGameOver(false);
    }
    this.lastHealth = this.player.health;

    // Check if player fell off the world
    if (this.player.y > 800) {
      this.handleGameOver(false);
    }

    // Check time limit
    if (!this.levelManager.checkTimeLimit()) {
      this.handleGameOver(false);
    }
  }

  private handleLevelComplete(): void {
    if (this.isPaused) return;
    this.isPaused = true;

    this.physicsManager?.pause();
    this.gameLoop?.stop();

    const state = this.levelManager?.getState();
    const gameOverData: GameOverSceneData = {
      score: state?.score ?? 0,
      level: this.currentLevel,
      won: true,
      coins: state?.coins ?? 0,
      enemiesDefeated: state?.enemiesDefeated ?? 0,
      timeElapsed: this.levelManager?.getTimeElapsed() ?? 0,
    };

    this.scene.launch("GameOverScene", gameOverData);
    this.scene.pause();
  }

  private handleGameOver(won: boolean): void {
    if (this.isPaused) return;
    this.isPaused = true;

    this.physicsManager?.pause();
    this.gameLoop?.stop();

    const state = this.levelManager?.getState();
    const gameOverData: GameOverSceneData = {
      score: state?.score ?? 0,
      level: this.currentLevel,
      won,
      coins: state?.coins ?? 0,
      enemiesDefeated: state?.enemiesDefeated ?? 0,
      timeElapsed: this.levelManager?.getTimeElapsed() ?? 0,
    };

    this.scene.launch("GameOverScene", gameOverData);
    this.scene.pause();
  }

  private openPauseMenu(): void {
    if (this.isPaused) return;
    this.isPaused = true;

    this.physicsManager?.pause();
    this.gameLoop?.stop();

    const state = this.levelManager?.getState();
    const pauseData: PauseSceneData = {
      score: state?.score ?? 0,
      level: this.currentLevel,
      fromScene: "GameScene",
    };

    this.scene.launch("PauseScene", pauseData);
    this.scene.pause();
  }

  private resumeGame(): void {
    if (!this.isPaused) return;
    this.isPaused = false;

    this.physicsManager?.resume();
    this.gameLoop?.start();
  }

  private togglePause(): void {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.openPauseMenu();
    }
  }

  private setupAudioEvents(): void {
    // Player events
    this.events.on("player:jump", () => {
      this.audioService?.playSFX("jump");
    });

    this.events.on("player:attack", () => {
      this.audioService?.playSFX("attack");
    });

    this.events.on("player:land", () => {
      this.audioService?.playSFX("landing");
    });

    // Item collection events
    this.events.on("item:collected", (data: { type: string }) => {
      if (data.type === "coin") {
        this.audioService?.playSFX("coin");
      } else if (data.type === "health_potion") {
        this.audioService?.playSFX("health_pickup");
      }
    });

    // Damage events
    this.events.on("player:damage", () => {
      this.audioService?.playSFX("player_hit");
    });

    this.events.on("enemy:damage", () => {
      this.audioService?.playSFX("enemy_hit");
    });

    // Level events
    this.events.on("level:complete", () => {
      this.audioService?.stopMusic(true);
      this.audioService?.playSFX("level_complete");
    });

    this.events.on("game:over", () => {
      this.audioService?.stopMusic(true);
      this.audioService?.playSFX("game_over");
    });
  }

  private setupProjectileCollisions(): void {
    // Create a projectile group for efficient physics
    const projectileGroup = this.physics.add.group();
    this.projectiles.forEach((p) => {
      projectileGroup.add(p);
    });

    // Collision with player
    this.physics.add.overlap(
      this.player,
      projectileGroup,
      (playerObj, projectileObj) => {
        const player = playerObj as Player;
        const projectile = projectileObj as Projectile;
        if (player.takeDamage(projectile.getDamage())) {
          this.cameras.main.shake(200, 0.01);
          this.particleManager?.createDamageEffect(
            player.x,
            player.y,
            projectile.getDamage(),
          );
          this.audioService?.playSFX("player_hit");
        }
        projectile.onHit();
      },
    );
  }

  private getLevelBounds(levelNumber: number): {
    width: number;
    height: number;
  } {
    // Define level dimensions based on level number
    switch (levelNumber) {
      case 1:
        return { width: 2000, height: 600 };
      case 2:
        return { width: 1280, height: 2560 };
      case 3:
        return { width: 3000, height: 800 };
      default:
        return { width: 2000, height: 600 };
    }
  }

  destroy() {
    // Clean up
    this.gameLoop?.destroy();
    eventBus.off("game:pause", this.openPauseMenu.bind(this));
    eventBus.off("game:resume", this.resumeGame.bind(this));
  }
}
