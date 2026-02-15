import { Inventory, InventorySlot, DroppedItem } from '../../../src/entities/Inventory';
import { Item } from '../../../src/entities/Item';

// Mock Phaser
jest.mock('phaser', () => ({
  Scene: jest.fn(),
}));

describe('Inventory', () => {
  let inventory: Inventory;
  let mockScene: any;

  beforeEach(() => {
    mockScene = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setPosition: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
        }),
      },
      events: {
        emit: jest.fn(),
      },
    };

    inventory = new Inventory(mockScene, 10);
  });

  describe('constructor', () => {
    it('should initialize with correct number of slots', () => {
      expect(inventory.getMaxSlots()).toBe(10);
    });

    it('should initialize with custom slot count', () => {
      const customInventory = new Inventory(mockScene, 20);
      expect(customInventory.getMaxSlots()).toBe(20);
    });

    it('should initialize with 0 occupied slots', () => {
      expect(inventory.getOccupiedSlots()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add item to inventory', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      const result = inventory.addItem(mockItem, 1);
      expect(result).toBe(true);
      expect(inventory.getOccupiedSlots()).toBe(1);
    });

    it('should stack items in same slot', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      const result = inventory.addItem(mockItem, 3);
      expect(result).toBe(true);
      expect(inventory.getOccupiedSlots()).toBe(1);
    });

    it('should fail when inventory is full', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      // Fill up the inventory
      for (let i = 0; i < 10; i++) {
        const item = { ...mockItem, id: `item-${i}` } as unknown as Item;
        inventory.addItem(item, 1);
      }

      // Try to add one more
      const newItem = { ...mockItem, id: 'overflow' } as unknown as Item;
      const result = inventory.addItem(newItem, 1);
      expect(result).toBe(false);
    });

    it('should use default quantity of 1', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem);
      expect(inventory.getOccupiedSlots()).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove item from inventory', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      const result = inventory.removeItem(mockItem.id, 2);
      expect(result).toBeGreaterThan(0);
      expect(inventory.getItemQuantity(mockItem.id)).toBe(3);
    });

    it('should remove entire stack if quantity equals total', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      const result = inventory.removeItem(mockItem.id, 5);
      expect(result).toBe(5);
      expect(inventory.getItemQuantity(mockItem.id)).toBe(0);
    });

    it('should fail when item not found', () => {
      const result = inventory.removeItem('nonexistent', 1);
      expect(result).toBe(0);
    });

    it('should use default quantity of 1', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      inventory.removeItem(mockItem.id);
      expect(inventory.getItemQuantity(mockItem.id)).toBe(4);
    });
  });

  describe('hasItem', () => {
    it('should return true if item exists', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 1);
      expect(inventory.hasItem(mockItem.id)).toBe(true);
    });

    it('should return false if item does not exist', () => {
      expect(inventory.hasItem('nonexistent')).toBe(false);
    });

    it('should check minimum quantity', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 3);
      expect(inventory.hasItem(mockItem.id, 2)).toBe(true);
      expect(inventory.hasItem(mockItem.id, 5)).toBe(false);
    });
  });

  describe('getItemQuantity', () => {
    it('should return correct quantity for item', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      expect(inventory.getItemQuantity(mockItem.id)).toBe(5);
    });

    it('should return 0 for non-existent item', () => {
      expect(inventory.getItemQuantity('nonexistent')).toBe(0);
    });
  });

  describe('getEmptySlots', () => {
    it('should return max slots for empty inventory', () => {
      expect(inventory.getEmptySlots()).toBe(10);
    });

    it('should return correct empty slots after adding items', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 1);
      expect(inventory.getEmptySlots()).toBe(9);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      inventory.clear();
      expect(inventory.getOccupiedSlots()).toBe(0);
    });
  });

  describe('getAllItemIds', () => {
    it('should return empty array for empty inventory', () => {
      const items = inventory.getAllItemIds();
      expect(items).toEqual([]);
    });

    it('should return all item IDs in inventory', () => {
      const mockItem1 = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      const mockItem2 = {
        id: 'potion-1',
        name: 'Health Potion',
        type: 'consumable',
        rarity: 'common',
        description: 'Restores health',
        spriteKey: 'items',
        frame: 2,
        value: 5,
        metadata: { healAmount: 10 },
      } as unknown as Item;
      
      inventory.addItem(mockItem1, 5);
      inventory.addItem(mockItem2, 3);
      const items = inventory.getAllItemIds();
      expect(items).toHaveLength(2);
      expect(items).toContain('sword-1');
      expect(items).toContain('potion-1');
    });
  });

  describe('getSlot', () => {
    it('should return slot at index', () => {
      const mockItem = {
        id: 'sword-1',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: 'common',
        description: 'A basic iron sword',
        spriteKey: 'items',
        frame: 1,
        value: 10,
        metadata: { damage: 5 },
      } as unknown as Item;
      
      inventory.addItem(mockItem, 5);
      const slot = inventory.getSlot(0);
      expect(slot).toBeDefined();
      expect(slot?.quantity).toBe(5);
    });

    it('should return undefined for empty slot', () => {
      const slot = inventory.getSlot(0);
      expect(slot?.quantity).toBe(0);
    });
  });
});
