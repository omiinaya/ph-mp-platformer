# Phaser Platformer

A multiplayer platformer game built with Phaser 3, Node.js, Socket.IO, and TypeScript.

## Project Status

**Current Version:** v1.0.0-alpha  
**Completion Status:** ~90% MVP Complete  
**Latest Update:** All core phases (1, 2, 4) COMPLETE ✅

### Completed Phases:

- ✅ Phase 1: Polish & Audio (animations, particles, audio system, UI improvements)
- ✅ Phase 2: Content Expansion (3 levels, 4 enemy types, 5 hazards, 5 power-ups, 5 gem types)
- ✅ Phase 4: Multiplayer & Networking (real-time sync, lobby system, interpolation)

### In Progress:

- 🟡 Phase 3: Combat & Systems Enhancement

## Quick Start

### Development

Start the client and server in development mode:

```bash
npm run dev
```

This starts:

- Client on http://localhost:3000
- Server on http://localhost:4000

### Multiplayer

For multiplayer, run:

```bash
# Terminal 1 - Server
cd server && npm start

# Terminal 2 - Client
cd client && npm run dev
```

Then click "Multiplayer" in the main menu to join/create a lobby.

## Game Features

### Single Player

- **3 Themed Maps:** Forest, Cave, and Sky levels
- **4 Enemy Types:** Slime, Flying, Archer, and Boss (3-phase fight)
- **5 Environmental Hazards:** Spikes, Lava, Saw Blades, Fire, Acid
- **5 Power-ups:** Double Jump, Shield, Speed Boost, Health Boost, Damage Boost
- **5 Gem Types:** Red, Blue, Green, Purple, Yellow (common to legendary)
- **Complete Animation System:** Player and enemy sprite animations
- **Audio System:** SFX and music with volume controls
- **Particle Effects:** Visual feedback for all game actions
- **Level Selection Menu:** Choose from unlocked levels

### Multiplayer

- **Real-time Synchronization:** 20Hz server tick rate
- **Lobby System:** Create/join rooms, share room codes
- **2-4 Players:** Cooperative gameplay
- **Interpolation:** Smooth remote player movement
- **Connection Events:** Toast notifications for join/leave
- **Player Prediction:** Input sequence-based client prediction

## Project Structure

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL (optional, for persistence)
- Redis (optional, for caching)

### Quick Setup Script

A comprehensive setup script is provided to automate environment preparation, dependency resolution, database creation, and configuration.

Run the script from the project root:

```bash
./scripts/setup.sh
```

Options:

- `--skip-deps` – Skip dependency installation (useful if you already have them)
- `--skip-db` – Skip PostgreSQL setup
- `--skip-redis` – Skip Redis installation
- `--skip-build` – Skip building the project

The script will:

1. Fix known dependency issues (ajv, schema-utils, webpack compatibility)
2. Install PostgreSQL and Redis (if not present) and start services
3. Create the `phaser_platformer` database and user
4. Generate environment configuration files (`.env` in client and server)
5. Install all dependencies (root, client, server, shared)
6. Build the project (TypeScript compilation, webpack bundling)
7. Run database migrations

After running the script, you can start development with:

```bash
npm run dev
```

### Manual Installation

If you prefer manual setup:

1. Clone the repository.
2. Install root dependencies:

```bash
npm install
```

3. Install workspace dependencies:

```bash
npm run install:all
```

Or install individually:

```bash
cd client && npm install
cd server && npm install
cd shared && npm install
```

### Development

Start the client and server in development mode:

```bash
npm run dev
```

This will start:

- Client on http://localhost:3000 (via webpack-dev-server)
- Server on http://localhost:4000 (Express + Socket.IO)

### Building for Production

```bash
npm run build
```

Outputs:

- `client/dist/` – Bundled static assets
- `server/dist/` – Compiled Node.js server

## Testing

The project includes comprehensive test suites:

### Unit Tests

Unit tests are written with Jest and cover core modules, game entities, and server services.

Run client unit tests:

```bash
cd client && npm test
```

Run server unit tests:

```bash
cd server && npm test
```

Run all unit tests from root:

```bash
npm run test:unit
```

### Integration Tests

Integration tests verify client‑server communication and database interactions using Supertest and a test SQLite database.

Run integration tests:

```bash
npm run test:integration
```

### End‑to‑End Tests

E2E tests simulate gameplay with Puppeteer.

Run E2E tests:

```bash
npm run test:e2e
```

### Coverage Reports

Jest is configured to collect code coverage. Generate coverage reports:

```bash
npm run test:coverage
```

Coverage thresholds are set to >80% for statements, branches, functions, and lines.

## Documentation

### API Documentation

API documentation is automatically generated from TypeScript source using TypeDoc. To generate:

```bash
npm run docs
```

The output is placed in `docs/api/`. Open `docs/api/index.html` in a browser.

### Developer Guides

See `docs/developer/` for guides on extending the game, adding new entities, and integrating with the server.

### Player Guides

See `docs/player/` for gameplay instructions and controls.

## Continuous Integration

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push, executing all tests and generating coverage reports.

## Architecture

See [plans/architecture.md](plans/architecture.md) for detailed design.

## License

MIT
