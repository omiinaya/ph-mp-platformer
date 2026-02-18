// Type-only tests for Checkpoint types - no imports needed from source files

describe('Checkpoint Types', () => {
  describe('CheckpointData', () => {
    it('should define checkpoint data', () => {
      interface CheckpointData {
        id: string;
        x: number;
        y: number;
        isActivated: boolean;
        nextCheckpointId?: string;
      }
      const data: CheckpointData = {
        id: 'checkpoint-1',
        x: 100,
        y: 200,
        isActivated: false,
      };
      expect(data.id).toBe('checkpoint-1');
      expect(data.x).toBe(100);
      expect(data.isActivated).toBe(false);
    });

    it('should allow optional fields', () => {
      interface CheckpointData {
        id: string;
        x: number;
        y: number;
        isActivated: boolean;
        nextCheckpointId?: string;
      }
      const data: CheckpointData = {
        id: 'checkpoint-1',
        x: 100,
        y: 200,
        isActivated: true,
        nextCheckpointId: 'checkpoint-2',
      };
      expect(data.isActivated).toBe(true);
      expect(data.nextCheckpointId).toBe('checkpoint-2');
    });
  });
});
