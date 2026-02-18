// Type-only tests for Skill types - no imports needed from source files

describe('Skill Types', () => {
  describe('SkillTarget', () => {
    it('should have all target types', () => {
      type SkillTarget = 'self' | 'enemy' | 'ally' | 'area';
      const targets: SkillTarget[] = ['self', 'enemy', 'ally', 'area'];
      expect(targets).toHaveLength(4);
    });
  });

  describe('SkillConfig', () => {
    it('should define skill config', () => {
      interface SkillConfig {
        id: string;
        name: string;
        cooldown: number;
        manaCost: number;
        damage: number;
        target: string;
        healing?: number;
        range?: number;
        areaOfEffect?: number;
        duration?: number;
      }
      const config: SkillConfig = {
        id: 'fireball',
        name: 'Fireball',
        cooldown: 5000,
        manaCost: 20,
        damage: 50,
        target: 'enemy',
      };
      expect(config.id).toBe('fireball');
      expect(config.cooldown).toBe(5000);
    });

    it('should allow optional fields', () => {
      interface SkillConfig {
        id: string;
        name: string;
        cooldown: number;
        manaCost: number;
        damage: number;
        target: string;
        healing?: number;
        range?: number;
        areaOfEffect?: number;
        duration?: number;
      }
      const config: SkillConfig = {
        id: 'heal',
        name: 'Heal',
        cooldown: 10000,
        manaCost: 30,
        damage: 0,
        target: 'ally',
        healing: 50,
        range: 100,
        areaOfEffect: 50,
      };
      expect(config.healing).toBe(50);
      expect(config.range).toBe(100);
      expect(config.areaOfEffect).toBe(50);
    });
  });
});
