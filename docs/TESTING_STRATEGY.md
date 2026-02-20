# Testing Strategy

This document outlines the testing approach for the Phaser Platformer game.

## Test Types

### Unit Tests

- **Purpose**: Test individual components in isolation
- **Location**: `*/tests/unit/`
- **Run**: `npm run test:unit`
- **Framework**: Jest
- **Coverage Target**: >80% for statements, branches, functions, lines

### Integration Tests

- **Purpose**: Test interactions between components and services
- **Location**: `*/tests/integration/`
- **Run**: `npm run test:integration`
- **Framework**: Jest + Supertest
- **Database**: SQLite (in-memory for tests)

### End-to-End Tests

- **Purpose**: Verify complete user workflows
- **Location**: `*/tests/e2e/`
- **Run**: `npm run test:e2e`
- **Framework**: Jest + Puppeteer
- **Browser**: Headless Chrome

## Running Tests

### All Tests

```bash
npm test
```

### By Type

```bash
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e       # E2E tests only
```

### With Coverage

```bash
npm run test:coverage
```

## Test Organization

### Client Tests

- Scene tests: MenuScene, GameScene, LevelSelectScene
- Entity tests: Player, Enemy, PowerUp, Gem
- Service tests: AudioService, InputHandler

### Server Tests

- Service tests: InventoryService, ProgressionService, LeaderboardService
- API tests: Player endpoints, Game state endpoints
- Socket tests: Connection handling, room management

### Shared Tests

- Type tests: Ensure types are correctly defined
- Utility tests: Game logic helpers

## Mocking Strategy

### External Dependencies

- **Database**: SQLite in-memory (TypeORM)
- **Redis**: Mock Redis client
- **External APIs**: HTTP mocking with Jest

### Game-Specific Mocks

- **Phaser**: jest-canvas-mock for canvas operations
- **Socket.IO**: Socket mock server

## CI Integration

Tests run automatically on:

- Every push to `main`
- Every PR
- Scheduled daily run

See `.github/workflows/ci.yml` for details.

## Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Meaningful Names**: Test names should describe the scenario
3. **One Assertion**: Each test should verify one behavior
4. **Isolation**: Tests should not depend on each other
5. **Fast**: Unit tests should complete in <1 second
6. **Deterministic**: Same input = same output, no flaky tests
