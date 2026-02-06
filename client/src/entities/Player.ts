import "phaser";
import { Character } from "./Character";
import { InputManager } from "../core/InputManager";
import {
  AnimationManager,
  AnimationStateMachine,
} from "../core/AnimationManager";

/**
 * Player-specific configuration.
 */
export interface PlayerConfig {
  /** Player's session ID for multiplayer synchronization. */
  sessionId?: string;
  /** Player's display name. */
  name?: string;
  /** Initial health. */
  health?: number;
  /** Movement speed. */
  moveSpeed?: number;
  /** Jump force. */
  jumpForce?: number;
  /** Input actions mapping (optional). */
  inputActions?: Array<{ id: string; keys: string[] }>;
  /** Animation manager for sprite animations. */
  animationManager?: AnimationManager;
}

/**
 * Concrete player class.
 * Extends Character and adds input handling, animation states, and multiplayer sync.
 */
export class Player extends Character {
  /** Player's session ID (for multiplayer). */
  public sessionId: string;

  /** Player's display name. */
  public name: string;

  /** Reference to InputManager for handling controls. */
  private inputManager?: InputManager;

  /** Animation manager for sprite animations. */
  private animationManager?: AnimationManager;

  /** Animation state machine. */
  private animationStateMachine: AnimationStateMachine;

  /** Current animation state. */
  private animationState:
    | "idle"
    | "walking"
    | "jumping"
    | "falling"
    | "attacking";

  /** Whether the player is currently attacking. */
  private isAttacking: boolean;

  /** Cooldown timer for attack (ms). */
  private attackCooldown: number;

  /** Time since last attack (ms). */
  private attackTimer: number;

  /** Inventory slot count (simplified). */
  public inventorySize: number;

  /** Equipped skill IDs. */
  public equippedSkills: string[];

  /** Whether animations are initialized. */
  private animationsInitialized: boolean = false;

  /**
   * Creates an instance of Player.
   * @param scene The scene this player belongs to.
   * @param x The x position.
   * @param y The y position.
   * @param texture The texture key.
   * @param config Player configuration.
   * @param frame The frame index (optional).
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: PlayerConfig = {},
    frame?: string | number,
  ) {
    super(scene, x, y, texture, frame);
    this.sessionId = config.sessionId || "local";
    this.name = config.name || "Player";
    this.health = config.health ?? 10;
    this.maxHealth = this.health;
    this.moveSpeed = config.moveSpeed ?? 250;
    this.jumpForce = config.jumpForce ?? 450;
    this.animationState = "idle";
    this.isAttacking = false;
    this.attackCooldown = 500; // half second
    this.attackTimer = 0;
    this.inventorySize = 10;
    this.equippedSkills = [];
    this.animationManager = config.animationManager;

    // Initialize animation state machine
    this.animationStateMachine = new AnimationStateMachine();
    this.setupAnimationStates();

    // Enable physics by default
    this.enablePhysics();
  }

  /**
   * Setup animation states and transitions.
   */
  private setupAnimationStates(): void {
    // Define all animation states
    this.animationStateMachine.addState(
      "idle",
      "player_idle",
      ["walk", "jump", "fall", "attack"],
      () => this.onAnimationEnter("idle"),
      () => this.onAnimationExit("idle"),
    );

    this.animationStateMachine.addState(
      "walk",
      "player_walk",
      ["idle", "jump", "fall", "attack"],
      () => this.onAnimationEnter("walk"),
      () => this.onAnimationExit("walk"),
    );

    this.animationStateMachine.addState(
      "jump",
      "player_jump",
      ["fall", "idle", "walk"],
      () => this.onAnimationEnter("jump"),
      () => this.onAnimationExit("jump"),
    );

    this.animationStateMachine.addState(
      "fall",
      "player_fall",
      ["idle", "walk", "jump"],
      () => this.onAnimationEnter("fall"),
      () => this.onAnimationExit("fall"),
    );

    this.animationStateMachine.addState(
      "attack",
      "player_attack",
      ["idle", "walk"],
      () => this.onAnimationEnter("attack"),
      () => this.onAnimationExit("attack"),
    );
  }

  /**
   * Initialize animations (call once after sprite sheet is loaded).
   */
  public initializeAnimations(): void {
    if (this.animationsInitialized) return;

    // Create animations from player sprite sheet
    if (this.animationManager) {
      this.animationManager.createAnimationsFromSheet("player", [
        { name: "idle", start: 0, end: 7, frameRate: 8, repeat: -1 },
        { name: "walk", start: 8, end: 15, frameRate: 12, repeat: -1 },
        { name: "jump", start: 16, end: 19, frameRate: 10, repeat: 0 },
        { name: "attack", start: 20, end: 25, frameRate: 15, repeat: 0 },
      ]);
    }

    this.animationsInitialized = true;
  }

  /**
   * Callback when entering an animation state.
   */
  private onAnimationEnter(state: string): void {
    // Could trigger effects, sounds, etc.
    if (state === "jump") {
      // Play jump sound
      this.scene.events.emit("player:jump", { player: this });
    }
  }

  /**
   * Callback when exiting an animation state.
   */
  private onAnimationExit(state: string): void {
    // Cleanup if needed
  }

  /**
   * Bind an InputManager to this player for control.
   * @param inputManager The InputManager instance.
   */
  public bindInputManager(inputManager: InputManager): void {
    this.inputManager = inputManager;
  }

  /**
   * Update player state each frame.
   * @param delta Time delta in milliseconds.
   */
  public update(delta: number): void {
    super.update(delta);

    // Initialize animations on first update
    if (!this.animationsInitialized) {
      this.initializeAnimations();
    }

    // Update attack timer
    if (this.isAttacking) {
      this.attackTimer += delta;
      if (this.attackTimer >= this.attackCooldown) {
        this.isAttacking = false;
      }
    }

    // Handle input if InputManager is bound
    if (this.inputManager) {
      this.handleInput();
    }

    // Update animation based on state
    this.updateAnimation();
  }

  /**
   * Handle player input.
   */
  private handleInput(): void {
    if (!this.inputManager) return;

    // Horizontal movement
    let direction = 0;
    if (this.inputManager.isActionActive("left")) {
      direction -= 1;
    }
    if (this.inputManager.isActionActive("right")) {
      direction += 1;
    }
    this.move(direction);

    // Jump
    if (this.inputManager.isActionActive("jump")) {
      this.jump();
    }

    // Attack
    if (this.inputManager.isActionActive("attack") && !this.isAttacking) {
      this.attack();
    }

    // Optional: other actions (crouch, dash, etc.)
  }

  /**
   * Perform a jump.
   */
  public jump(): void {
    if (this.isOnGround) {
      super.jump();
      // Transition to jump animation
      this.animationStateMachine.transition("jump");
    }
  }

  /**
   * Perform an attack.
   */
  public attack(): void {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.attackTimer = 0;

    // Transition to attack animation
    const result = this.animationStateMachine.transition("attack");
    if (result.success && this.animationManager) {
      this.animationManager.playOnce(
        this as unknown as Phaser.GameObjects.Sprite,
        result.animation,
        () => {
          this.isAttacking = false;
          // Return to idle after attack
          this.animationStateMachine.transition("idle");
        },
      );
    }

    // Emit event or deal damage to nearby enemies
    this.scene.events.emit("player:attack", { player: this });
  }

  /**
   * Update animation based on current state.
   */
  protected updateAnimation(): void {
    // Don't interrupt attack animation
    if (this.isAttacking) return;

    let newState: "idle" | "walking" | "jumping" | "falling" = "idle";

    if (!this.isOnGround) {
      newState = this.velocity.y < 0 ? "jumping" : "falling";
    } else if (Math.abs(this.velocity.x) > 10) {
      newState = "walking";
    } else {
      newState = "idle";
    }

    // Only transition if state changed
    if (newState !== this.animationState) {
      this.animationState = newState;

      // Map state names to animation state machine states
      const stateMap: Record<string, string> = {
        idle: "idle",
        walking: "walk",
        jumping: "jump",
        falling: "fall",
      };

      const targetState = stateMap[newState];
      if (targetState) {
        const result = this.animationStateMachine.transition(targetState);
        if (result.success && this.animationManager) {
          this.animationManager.play(
            this as unknown as Phaser.GameObjects.Sprite,
            result.animation,
            true, // Don't restart if already playing
          );
        }
      }
    }

    // Flip sprite based on facing direction
    this.flipX = this.facing === -1;
  }

  /**
   * Play a specific animation.
   */
  public playAnimation(
    animationKey: string,
    ignoreIfPlaying: boolean = true,
  ): boolean {
    if (!this.animationManager) return false;

    return this.animationManager.play(
      this as unknown as Phaser.GameObjects.Sprite,
      animationKey,
      ignoreIfPlaying,
    );
  }

  /**
   * Check if an animation is currently playing.
   */
  public isAnimationPlaying(animationKey?: string): boolean {
    if (!this.animationManager) return false;

    return this.animationManager.isPlaying(
      this as unknown as Phaser.GameObjects.Sprite,
      animationKey,
    );
  }

  /**
   * Equip a skill.
   * @param skillId Skill identifier.
   */
  public equipSkill(skillId: string): void {
    if (!this.equippedSkills.includes(skillId)) {
      this.equippedSkills.push(skillId);
    }
  }

  /**
   * Unequip a skill.
   * @param skillId Skill identifier.
   */
  public unequipSkill(skillId: string): void {
    const index = this.equippedSkills.indexOf(skillId);
    if (index >= 0) {
      this.equippedSkills.splice(index, 1);
    }
  }

  /**
   * Use a skill by its ID.
   * @param skillId Skill identifier.
   * @param target Optional target character.
   */
  public useSkill(skillId: string, target?: Character): void {
    if (!this.equippedSkills.includes(skillId)) {
      console.warn(`Skill ${skillId} not equipped.`);
      return;
    }
    // Skill logic would be implemented elsewhere (SkillManager)
    // For now, just emit an event
    this.scene.events.emit("player:skill-used", {
      player: this,
      skillId,
      target,
    });
  }

  /**
   * Synchronize player state with server (for multiplayer).
   * @param data Server state data.
   */
  public sync(data: any): void {
    if (data.position) {
      this.x = data.position.x;
      this.y = data.position.y;
    }
    if (data.velocity) {
      this.velocity.set(data.velocity.x, data.velocity.y);
    }
    if (data.health !== undefined) {
      this.health = data.health;
    }
    if (data.facing !== undefined) {
      this.facing = data.facing;
    }
    if (data.animationState) {
      this.animationState = data.animationState;
      // Update animation to match server state
      const result = this.animationStateMachine.transition(data.animationState);
      if (result.success && this.animationManager) {
        this.animationManager.play(
          this as unknown as Phaser.GameObjects.Sprite,
          result.animation,
          true,
        );
      }
    }
  }

  /**
   * Get player data for synchronization.
   */
  public getSyncData(): any {
    return {
      sessionId: this.sessionId,
      position: { x: this.x, y: this.y },
      velocity: { x: this.velocity.x, y: this.velocity.y },
      health: this.health,
      facing: this.facing,
      animationState: this.animationState,
    };
  }

  /**
   * Reset player to initial state (e.g., after death).
   */
  public respawn(): void {
    this.health = this.maxHealth;
    this.invulnerable = false;
    this.isAttacking = false;
    this.animationState = "idle";

    // Reset to idle animation
    this.animationStateMachine.forceSetState("idle");
    if (this.animationManager) {
      const result = this.animationStateMachine.transition("idle");
      if (result.success) {
        this.animationManager.play(
          this as unknown as Phaser.GameObjects.Sprite,
          result.animation,
          false,
        );
      }
    }

    // Position reset should be handled by level logic
  }
}
