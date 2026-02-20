#!/usr/bin/env node

/**
 * Sprite Sheet Generator
 *
 * Generates sprite sheet PNGs from SVG assets with frame variations
 * for animations (idle, walk, jump, attack, etc.)
 *
 * Usage: node scripts/generate-sprite-sheets.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const ASSETS_DIR = path.join(__dirname, '../client/public/assets');
const SPRITES_DIR = path.join(ASSETS_DIR, 'sprites');
const OUTPUT_DIR = path.join(ASSETS_DIR, 'spritesheets');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sprite configurations
const SPRITE_CONFIGS = {
  player: {
    frameWidth: 32,
    frameHeight: 32,
    animations: {
      idle: { frames: 8, variations: ['default', 'blink', 'breathe'] },
      walk: { frames: 8, variations: ['step1', 'step2', 'step3', 'step4'] },
      jump: { frames: 4, variations: ['start', 'rise', 'peak', 'fall'] },
      attack: {
        frames: 6,
        variations: ['windup', 'strike', 'follow', 'recover'],
      },
    },
    colors: {
      body: ['#3498db', '#2980b9', '#3498db', '#2980b9'],
      head: ['#f1c40f', '#f39c12', '#f1c40f', '#f39c12'],
    },
  },
  slime: {
    frameWidth: 32,
    frameHeight: 32,
    animations: {
      idle: { frames: 4, variations: ['rest', 'squash'] },
      bounce: {
        frames: 6,
        variations: ['compress', 'jump', 'peak', 'fall', 'land'],
      },
    },
    colors: {
      body: ['#2ecc71', '#27ae60', '#2ecc71', '#27ae60'],
    },
  },
  flying: {
    frameWidth: 32,
    frameHeight: 32,
    animations: {
      hover: { frames: 4, variations: ['up', 'down'] },
      fly: { frames: 6, variations: ['flap1', 'flap2'] },
    },
    colors: {
      wings: ['#9b59b6', '#8e44ad', '#9b59b6', '#8e44ad'],
    },
  },
};

/**
 * Generate a simple colored rectangle frame
 */
function generateSimpleFrame(
  ctx,
  x,
  y,
  width,
  height,
  colors,
  frameIndex,
  totalFrames,
) {
  const progress = frameIndex / totalFrames;

  // Calculate animation offset
  const bounceOffset = Math.sin(progress * Math.PI * 2) * 3;

  // Body
  const bodyColor = colors.body[frameIndex % colors.body.length];
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 2, y + 4 + bounceOffset, width - 4, height - 8);

  // Head
  if (colors.head) {
    const headColor = colors.head[frameIndex % colors.head.length];
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 10 + bounceOffset, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x + width / 2 - 3, y + 8 + bounceOffset, 2, 0, Math.PI * 2);
  ctx.arc(x + width / 2 + 3, y + 8 + bounceOffset, 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Generate player sprite sheet
 */
function generatePlayerSpriteSheet() {
  const config = SPRITE_CONFIGS.player;
  const totalFrames = Object.values(config.animations).reduce(
    (sum, anim) => sum + anim.frames,
    0,
  );

  const canvas = createCanvas(
    config.frameWidth * totalFrames,
    config.frameHeight,
  );
  const ctx = canvas.getContext('2d');

  // Clear with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let currentFrame = 0;

  // Generate frames for each animation
  Object.entries(config.animations).forEach(([animName, animConfig]) => {
    for (let i = 0; i < animConfig.frames; i++) {
      const x = currentFrame * config.frameWidth;
      const y = 0;

      // Generate frame based on animation type
      switch (animName) {
        case 'idle':
          generateIdleFrame(ctx, x, y, config, i, animConfig.frames);
          break;
        case 'walk':
          generateWalkFrame(ctx, x, y, config, i, animConfig.frames);
          break;
        case 'jump':
          generateJumpFrame(ctx, x, y, config, i, animConfig.frames);
          break;
        case 'attack':
          generateAttackFrame(ctx, x, y, config, i, animConfig.frames);
          break;
      }

      currentFrame++;
    }
  });

  // Save sprite sheet
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'player.png'), buffer);
  console.log('✓ Generated player sprite sheet');

  // Save animation metadata
  const metadata = {
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight,
    animations: {},
  };

  currentFrame = 0;
  Object.entries(config.animations).forEach(([animName, animConfig]) => {
    metadata.animations[animName] = {
      start: currentFrame,
      end: currentFrame + animConfig.frames - 1,
      frameRate: animName === 'attack' ? 12 : 10,
    };
    currentFrame += animConfig.frames;
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'player.json'),
    JSON.stringify(metadata, null, 2),
  );
  console.log('✓ Generated player animation metadata');
}

/**
 * Generate idle animation frame
 */
function generateIdleFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const progress = frameIndex / totalFrames;
  const breathe = Math.sin(progress * Math.PI * 2) * 1;
  const blink = frameIndex === 2 || frameIndex === 3;

  // Body
  ctx.fillStyle = config.colors.body[0];
  ctx.fillRect(x + 8, y + 8 + breathe, 16, 20 - breathe);

  // Head
  ctx.fillStyle = config.colors.head[0];
  ctx.beginPath();
  ctx.arc(x + 16, y + 6 + breathe, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (blink on certain frames)
  if (!blink) {
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x + 13, y + 5 + breathe, 2, 0, Math.PI * 2);
    ctx.arc(x + 19, y + 5 + breathe, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Closed eyes
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 11, y + 5 + breathe);
    ctx.lineTo(x + 15, y + 5 + breathe);
    ctx.moveTo(x + 17, y + 5 + breathe);
    ctx.lineTo(x + 21, y + 5 + breathe);
    ctx.stroke();
  }

  // Arms
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(x + 4, y + 10 + breathe, 3, 12);
  ctx.fillRect(x + 25, y + 10 + breathe, 3, 12);

  // Legs
  ctx.fillStyle = '#34495e';
  ctx.fillRect(x + 10, y + 26, 5, 6);
  ctx.fillRect(x + 17, y + 26, 5, 6);
}

/**
 * Generate walk animation frame
 */
function generateWalkFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const progress = frameIndex / totalFrames;
  const legOffset = Math.sin(progress * Math.PI * 2) * 3;

  // Body
  ctx.fillStyle = config.colors.body[frameIndex % 2 === 0 ? 0 : 1];
  ctx.fillRect(x + 8, y + 8, 16, 18);

  // Head
  ctx.fillStyle = config.colors.head[0];
  ctx.beginPath();
  ctx.arc(x + 16, y + 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x + 13, y + 5, 2, 0, Math.PI * 2);
  ctx.arc(x + 19, y + 5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Arms (swinging)
  const armSwing = Math.sin(progress * Math.PI * 2) * 2;
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(x + 4 + armSwing, y + 10, 3, 12);
  ctx.fillRect(x + 25 - armSwing, y + 10, 3, 12);

  // Legs (walking motion)
  ctx.fillStyle = '#34495e';
  ctx.fillRect(x + 10, y + 24 + legOffset, 5, 6 - legOffset);
  ctx.fillRect(x + 17, y + 24 - legOffset, 5, 6 + legOffset);
}

/**
 * Generate jump animation frame
 */
function generateJumpFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const phases = ['crouch', 'rise', 'peak', 'fall'];
  const phase = phases[frameIndex] || 'rise';

  let yOffset = 0;
  let stretch = 0;

  switch (phase) {
    case 'crouch':
      yOffset = 4;
      stretch = -2;
      break;
    case 'rise':
      yOffset = -2;
      stretch = 2;
      break;
    case 'peak':
      yOffset = -4;
      stretch = 0;
      break;
    case 'fall':
      yOffset = -2;
      stretch = 1;
      break;
  }

  // Body (stretched/squashed)
  ctx.fillStyle = config.colors.body[0];
  ctx.fillRect(x + 8, y + 8 + yOffset, 16, 18 + stretch);

  // Head
  ctx.fillStyle = config.colors.head[0];
  ctx.beginPath();
  ctx.arc(x + 16, y + 6 + yOffset, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (looking up/down based on phase)
  ctx.fillStyle = '#2c3e50';
  const eyeOffset = phase === 'rise' ? -1 : phase === 'fall' ? 1 : 0;
  ctx.beginPath();
  ctx.arc(x + 13, y + 5 + yOffset + eyeOffset, 2, 0, Math.PI * 2);
  ctx.arc(x + 19, y + 5 + yOffset + eyeOffset, 2, 0, Math.PI * 2);
  ctx.fill();

  // Arms (raised during jump)
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(x + 4, y + 8 + yOffset, 3, 10);
  ctx.fillRect(x + 25, y + 8 + yOffset, 3, 10);

  // Legs (tucked during jump)
  ctx.fillStyle = '#34495e';
  ctx.fillRect(x + 10, y + 26 + yOffset, 5, 4);
  ctx.fillRect(x + 17, y + 26 + yOffset, 5, 4);
}

/**
 * Generate attack animation frame
 */
function generateAttackFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const phases = ['windup', 'windup', 'strike', 'strike', 'follow', 'recover'];
  const phase = phases[frameIndex] || 'strike';

  let armExtension = 0;
  let bodyRotation = 0;

  switch (phase) {
    case 'windup':
      armExtension = -3;
      bodyRotation = -2;
      break;
    case 'strike':
      armExtension = 6;
      bodyRotation = 2;
      break;
    case 'follow':
      armExtension = 4;
      bodyRotation = 1;
      break;
    case 'recover':
      armExtension = 2;
      bodyRotation = 0;
      break;
  }

  // Body
  ctx.fillStyle = config.colors.body[0];
  ctx.fillRect(x + 8 + bodyRotation, y + 8, 16, 18);

  // Head
  ctx.fillStyle = config.colors.head[0];
  ctx.beginPath();
  ctx.arc(x + 16 + bodyRotation, y + 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (focused during attack)
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x + 13 + bodyRotation + 2, y + 5, 2, 0, Math.PI * 2);
  ctx.arc(x + 19 + bodyRotation + 2, y + 5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Arms (attacking arm extended)
  ctx.fillStyle = '#e74c3c';
  // Left arm (back)
  ctx.fillRect(x + 4 + bodyRotation, y + 10, 3, 12);
  // Right arm (attacking - extended)
  ctx.fillRect(
    x + 25 + bodyRotation + armExtension,
    y + 10,
    3 + armExtension,
    12,
  );

  // Legs
  ctx.fillStyle = '#34495e';
  ctx.fillRect(x + 10 + bodyRotation, y + 24, 5, 6);
  ctx.fillRect(x + 17 + bodyRotation, y + 24, 5, 6);

  // Attack effect (during strike phase)
  if (phase === 'strike') {
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 32, y + 16, 8, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
}

/**
 * Generate enemy sprite sheets
 */
function generateEnemySpriteSheets() {
  // Generate slime sprite sheet
  generateSlimeSpriteSheet();

  // Generate flying enemy sprite sheet
  generateFlyingSpriteSheet();
}

function generateSlimeSpriteSheet() {
  const config = SPRITE_CONFIGS.slime;
  const totalFrames = Object.values(config.animations).reduce(
    (sum, anim) => sum + anim.frames,
    0,
  );

  const canvas = createCanvas(
    config.frameWidth * totalFrames,
    config.frameHeight,
  );
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let currentFrame = 0;

  Object.entries(config.animations).forEach(([animName, animConfig]) => {
    for (let i = 0; i < animConfig.frames; i++) {
      const x = currentFrame * config.frameWidth;

      if (animName === 'idle') {
        generateSlimeIdleFrame(ctx, x, 0, config, i, animConfig.frames);
      } else if (animName === 'bounce') {
        generateSlimeBounceFrame(ctx, x, 0, config, i, animConfig.frames);
      }

      currentFrame++;
    }
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'slime.png'), buffer);
  console.log('✓ Generated slime sprite sheet');
}

function generateSlimeIdleFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const progress = frameIndex / totalFrames;
  const breathe = Math.sin(progress * Math.PI * 2) * 2;

  // Slime body
  ctx.fillStyle = config.colors.body[0];
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 24 - breathe, 14, 8 + breathe / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + 12, y + 20 - breathe, 3, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 20 - breathe, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x + 12, y + 20 - breathe, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 20 - breathe, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function generateSlimeBounceFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const progress = frameIndex / totalFrames;
  const height = Math.sin(progress * Math.PI) * 12;
  const squash = Math.abs(Math.sin(progress * Math.PI * 2)) * 3;

  // Slime body (squashed during bounce)
  ctx.fillStyle = config.colors.body[frameIndex % 2];
  ctx.beginPath();
  ctx.ellipse(
    x + 16,
    y + 24 - height,
    14 - squash,
    8 + squash,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Eyes (look direction based on velocity)
  const eyeOffset = height > 0 ? -2 : 2;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + 12, y + 20 - height + eyeOffset, 3, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 20 - height + eyeOffset, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x + 12, y + 20 - height + eyeOffset, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 20 - height + eyeOffset, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function generateFlyingSpriteSheet() {
  const config = SPRITE_CONFIGS.flying;
  const totalFrames = Object.values(config.animations).reduce(
    (sum, anim) => sum + anim.frames,
    0,
  );

  const canvas = createCanvas(
    config.frameWidth * totalFrames,
    config.frameHeight,
  );
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let currentFrame = 0;

  Object.entries(config.animations).forEach(([animName, animConfig]) => {
    for (let i = 0; i < animConfig.frames; i++) {
      const x = currentFrame * config.frameWidth;

      if (animName === 'hover') {
        generateFlyingHoverFrame(ctx, x, 0, config, i, animConfig.frames);
      } else if (animName === 'fly') {
        generateFlyingFlyFrame(ctx, x, 0, config, i, animConfig.frames);
      }

      currentFrame++;
    }
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'flying.png'), buffer);
  console.log('✓ Generated flying enemy sprite sheet');
}

function generateFlyingHoverFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const progress = frameIndex / totalFrames;
  const hoverOffset = Math.sin(progress * Math.PI * 2) * 2;

  // Wings
  ctx.fillStyle = config.colors.wings[0];
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 12 + hoverOffset, 8, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 24, y + 12 + hoverOffset, 8, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#8e44ad';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16 + hoverOffset, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#9b59b6';
  ctx.beginPath();
  ctx.arc(x + 16, y + 10 + hoverOffset, 5, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(x + 14, y + 9 + hoverOffset, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 18, y + 9 + hoverOffset, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 11 + hoverOffset);
  ctx.lineTo(x + 14, y + 14 + hoverOffset);
  ctx.lineTo(x + 18, y + 14 + hoverOffset);
  ctx.fill();
}

function generateFlyingFlyFrame(ctx, x, y, config, frameIndex, totalFrames) {
  const progress = frameIndex / totalFrames;
  const wingFlap = Math.sin(progress * Math.PI * 4) * 3;

  // Wings (flapping)
  ctx.fillStyle = config.colors.wings[frameIndex % 2];
  ctx.beginPath();
  ctx.ellipse(
    x + 8,
    y + 12,
    8 + wingFlap,
    4 - wingFlap / 2,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    x + 24,
    y + 12,
    8 + wingFlap,
    4 - wingFlap / 2,
    0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Body
  ctx.fillStyle = '#8e44ad';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#9b59b6';
  ctx.beginPath();
  ctx.arc(x + 16, y + 10, 5, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(x + 14, y + 9, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 18, y + 9, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 11);
  ctx.lineTo(x + 14, y + 14);
  ctx.lineTo(x + 18, y + 14);
  ctx.fill();
}

// Main execution
console.log('🎨 Generating sprite sheets...\n');

try {
  generatePlayerSpriteSheet();
  generateEnemySpriteSheets();

  console.log('\n✅ Sprite sheet generation complete!');
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log('\nFiles generated:');
  const files = fs.readdirSync(OUTPUT_DIR);
  files.forEach((file) => {
    const stats = fs.statSync(path.join(OUTPUT_DIR, file));
    console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
} catch (error) {
  console.error('❌ Error generating sprite sheets:', error.message);
  console.error('\nMake sure you have canvas installed:');
  console.error('  npm install canvas');
  process.exit(1);
}
