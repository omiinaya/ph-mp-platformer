// Type tests for Enemy - no instantiation needed
import { EnemyAIConfig, EnemyState } from '../../../src/entities/Enemy';

describe('EnemyAIConfig', () => {
  it('should allow partial configuration', () => {
    const config: EnemyAIConfig = {
      detectionRange: 200,
    };
    expect(config.detectionRange).toBe(200);
  });

  it('should allow all configuration options', () => {
    const config: EnemyAIConfig = {
      detectionRange: 300,
      attackRange: 100,
      patrolSpeed: 50,
      chaseSpeed: 150,
      patrolChangeTime: 2000,
      flying: true,
      dropsLoot: true,
      lootTable: ['coin', 'gem', 'key'],
    };
    expect(config.detectionRange).toBe(300);
    expect(config.attackRange).toBe(100);
    expect(config.patrolSpeed).toBe(50);
    expect(config.chaseSpeed).toBe(150);
    expect(config.patrolChangeTime).toBe(2000);
    expect(config.flying).toBe(true);
    expect(config.dropsLoot).toBe(true);
    expect(config.lootTable).toHaveLength(3);
  });
});

describe('EnemyState type', () => {
  it('should accept idle state', () => {
    const state: EnemyState = 'idle';
    expect(state).toBe('idle');
  });

  it('should accept patrol state', () => {
    const state: EnemyState = 'patrol';
    expect(state).toBe('patrol');
  });

  it('should accept chase state', () => {
    const state: EnemyState = 'chase';
    expect(state).toBe('chase');
  });

  it('should accept attack state', () => {
    const state: EnemyState = 'attack';
    expect(state).toBe('attack');
  });

  it('should accept flee state', () => {
    const state: EnemyState = 'flee';
    expect(state).toBe('flee');
  });

  it('should accept dead state', () => {
    const state: EnemyState = 'dead';
    expect(state).toBe('dead');
  });
});
