# Code Standards

This document outlines the coding standards and best practices for the Phaser Platformer project.

## Languages

- **Primary**: TypeScript 5.x
- **Build**: Webpack 5 (client), tsc (server)
- **Linting**: ESLint 9.x with TypeScript support

## TypeScript Guidelines

### Strict Mode

All code must compile with `strict: true` in tsconfig.json.

### Type Definitions

- Prefer explicit types over `any`
- Use `unknown` when type is uncertain
- Leverage generics for reusable components

### Example

```typescript
// Good
interface PlayerConfig {
  id: string;
  name: string;
  level: number;
}

// Avoid
const player: any = {};
```

## Code Style

### Formatting

- Run `npm run format` before committing
- Uses Prettier with project config

### Naming Conventions

- **Classes**: PascalCase (`GameScene`)
- **Interfaces**: PascalCase with optional I prefix (`PlayerConfig` or `IPlayerConfig`)
- **Functions**: camelCase (`calculateScore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PLAYERS`)
- **Files**: kebab-case (`game-scene.ts`)

### Import Order

1. External libraries (Phaser, Socket.IO, etc.)
2. Internal modules (server/, client/, shared/)
3. Relative imports

```typescript
// 1. External
import Phaser from 'phaser';
import { Socket } from 'socket.io';

// 2. Internal
import { Player } from '@shared/types';

// 3. Relative
import { GameConfig } from './config';
```

## Component Structure

### Client (Phaser)

```typescript
export class GameScene extends Phaser.Scene {
  // Properties
  private player: Player;

  // Lifecycle
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialization
  }

  update(time: number, delta: number): void {
    // Game loop
  }
}
```

### Server (Express + Socket.IO)

```typescript
export class GameServer {
  private io: Server;

  public async start(port: number): Promise<void> {
    this.io = new Server(port);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      // Handle connection
    });
  }
}
```

## Error Handling

### Client

- Use try-catch for async operations
- Display user-friendly error messages
- Log errors for debugging

### Server

- Use Winston for structured logging
- Return appropriate HTTP status codes
- Never expose internal errors to clients

```typescript
// Good
try {
  await savePlayer(player);
} catch (error) {
  logger.error('Failed to save player', { error, playerId: player.id });
  throw new ApiError('Failed to save player', 500);
}
```

## Testing Standards

### Unit Tests

- Test one thing per test
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('Player', () => {
  describe('takeDamage', () => {
    it('should reduce health by damage amount', () => {
      // Arrange
      const player = new Player();

      // Act
      player.takeDamage(10);

      // Assert
      expect(player.health).toBe(90);
    });
  });
});
```

## Git Conventions

### Commit Messages

- Use conventional commits format
- Include scope: `feat(players): add player ranking`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branch Naming

- `feature/add-player-ranking`
- `fix/login-error`
- `docs/update-readme`

## Performance Guidelines

### Client

- Object pooling for frequently created objects
- Minimize DOM manipulations
- Use Phaser's built-in batching

### Server

- Use connection pooling for database
- Implement rate limiting
- Cache frequently accessed data

## Security

### Never

- Commit secrets or API keys
- Trust client input
- Use `eval()` or similar

### Always

- Validate all input
- Use parameterized queries
- Implement proper authentication
