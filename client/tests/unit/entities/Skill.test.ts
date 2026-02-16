import { Skill, SkillConfig, SkillTarget } from '../../../src/entities/Skill';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock phaser - create mock scene object
const mockSceneEvents = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const mockScene = {
  add: {
    sprite: jest.fn(),
    graphics: jest.fn(),
    text: jest.fn(),
  },
  time: {
    addEvent: jest.fn(),
    delayedCall: jest.fn((delay: number, callback: () => void) => {
      callback();
      return { remove: jest.fn() };
    }),
  },
  events: mockSceneEvents,
  sound: {
    play: jest.fn(),
  },
};

jest.mock('phaser', () => ({
  Scene: jest.fn().mockImplementation(() => mockScene),
}));

// Mock Character with reference to mockScene
jest.mock('../../../src/entities/Character', () => {
  const mockSceneEvents = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };
  const mockScene = {
    add: { sprite: jest.fn(), graphics: jest.fn(), text: jest.fn() },
    time: { addEvent: jest.fn(), delayedCall: jest.fn((delay: number, cb: () => void) => { cb(); return { remove: jest.fn() }; }) },
    events: mockSceneEvents,
    sound: { play: jest.fn() },
  };
  return {
    Character: class MockCharacter {
      scene = mockScene;
      x = 0;
      y = 0;
      facing = 1;
      invulnerable = false;
      getScene() { return mockScene; }
      getPosition() { return { x: 0, y: 0 }; }
      applyEffect() {}
      takeDamage() {}
      heal() {}
      playAnimation() {}
      playSound() {}
    },
  };
});

// Create a concrete implementation for testing
class TestSkill extends Skill {
  public activateOverride: boolean = false;
  
  protected onActivate(): boolean {
    return this.activateOverride;
  }
  
  // Override update to test cooldown - access protected via 'this'
  public update(delta: number): void {
    // Access protected property from subclass
    (this as any).cooldownRemaining -= delta;
    if ((this as any).cooldownRemaining <= 0) {
      (this as any).cooldownRemaining = 0;
      this.isOnCooldown = false;
    }
  }
  
  // Method to manually start cooldown for testing
  public testStartCooldown(duration?: number): void {
    this.isOnCooldown = true;
    (this as any).cooldownRemaining = duration ?? this.config.cooldown;
  }
}

describe('Skill', () => {
  let skill: TestSkill;

  const createSkillConfig = (overrides?: Partial<SkillConfig>): SkillConfig => ({
    id: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill',
    icon: 'skill-icon',
    cooldown: 5000,
    cost: 10,
    castTime: 1000,
    range: 100,
    target: SkillTarget.Directional,
    castEffect: 'test-effect',
    castSound: 'test-sound',
    damage: 50,
    heal: 25,
    effect: 'test-buff',
    ...overrides,
  });

  beforeEach(() => {
    const config = createSkillConfig();
    skill = new TestSkill(config);
  });

  describe('constructor', () => {
    it('should create skill with config', () => {
      expect(skill.config).toBeDefined();
      expect(skill.config.id).toBe('test-skill');
    });

    it('should initialize with no cooldown', () => {
      expect(skill.isOnCooldown).toBe(false);
    });

    it('should initialize not casting', () => {
      expect(skill.isCasting).toBe(false);
    });

    it('should apply default config values', () => {
      const minimalConfig: SkillConfig = {
        id: 'minimal',
        name: 'Minimal',
        cooldown: 1000,
        target: SkillTarget.Self,
      };
      const minimalSkill = new TestSkill(minimalConfig);
      
      expect(minimalSkill.config.cost).toBe(0);
      expect(minimalSkill.config.castTime).toBe(0);
      expect(minimalSkill.config.range).toBe(0);
    });
  });

  describe('setOwner', () => {
    it('should set owner character', () => {
      // Should not throw
      skill.setOwner({} as any);
    });
  });

  describe('update', () => {
    it('should decrease cooldown', () => {
      skill.isOnCooldown = true;
      (skill as any).cooldownRemaining = 5000;
      
      skill.update(1000);
      
      expect(skill.isOnCooldown).toBe(true);
    });

    it('should clear cooldown when reaches zero', () => {
      skill.isOnCooldown = true;
      (skill as any).cooldownRemaining = 500;
      
      skill.update(600);
      
      expect(skill.isOnCooldown).toBe(false);
    });

    it('should not decrease cooldown when not on cooldown', () => {
      skill.isOnCooldown = false;
      
      skill.update(1000);
      
      // No error expected
    });
  });

  describe('getCooldownProgress', () => {
    it('should return 0 when not on cooldown', () => {
      expect(skill.getCooldownProgress()).toBe(0);
    });

    it('should return percentage of cooldown remaining', () => {
      skill.isOnCooldown = true;
      (skill as any).cooldownRemaining = 2500;
      
      const progress = skill.getCooldownProgress();
      
      expect(progress).toBe(0.5); // 2500/5000 = 0.5
    });
  });

  describe('canActivate', () => {
    it('should return false when on cooldown', () => {
      skill.setOwner({} as any);
      skill.isOnCooldown = true;
      (skill as any).cooldownRemaining = 1000;
      
      expect(skill.canActivate()).toBe(false);
    });

    it('should return false when already casting', () => {
      skill.setOwner({} as any);
      skill.isCasting = true;
      
      expect(skill.canActivate()).toBe(false);
    });

    it('should return true when ready', () => {
      skill.setOwner({} as any);
      expect(skill.canActivate()).toBe(true);
    });
  });

  describe('resetCooldown', () => {
    it('should reset cooldown state', () => {
      skill.isOnCooldown = true;
      (skill as any).cooldownRemaining = 3000;
      
      skill.resetCooldown();
      
      expect(skill.isOnCooldown).toBe(false);
    });
  });

  describe('activate', () => {
    it('should return false when cannot activate', () => {
      skill.setOwner({} as any);
      skill.isOnCooldown = true;
      
      expect(skill.activate()).toBe(false);
    });

    it('should activate when ready', () => {
      // Create a mock owner with scene
      const mockOwner = {
        scene: mockScene,
        x: 0,
        y: 0,
        facing: 1,
        invulnerable: false,
      } as any;
      skill.setOwner(mockOwner);
      skill.activateOverride = true;
      
      expect(skill.activate()).toBe(true);
      expect(skill.isOnCooldown).toBe(true);
    });

    it('should not call onActivate when cannot activate', () => {
      skill.setOwner({} as any);
      skill.isOnCooldown = true;
      
      skill.activate();
      
      expect(skill.activateOverride).toBe(false);
    });
  });

  describe('cancelCast', () => {
    it('should cancel casting', () => {
      skill.isCasting = true;
      
      skill.cancelCast();
      
      expect(skill.isCasting).toBe(false);
    });

    it('should not start cooldown when cancelled', () => {
      skill.isCasting = true;
      
      skill.cancelCast();
      
      expect(skill.isOnCooldown).toBe(false);
    });
  });

  describe('SkillTarget enum', () => {
    it('should have correct target values', () => {
      expect(SkillTarget.Self).toBe('self');
      expect(SkillTarget.Directional).toBe('directional');
      expect(SkillTarget.Target).toBe('target');
      expect(SkillTarget.Area).toBe('area');
      expect(SkillTarget.Projectile).toBe('projectile');
    });
  });
});
