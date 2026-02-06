#!/usr/bin/env node

/**
 * Sound Effect Generator
 *
 * Generates placeholder sound effects using the Web Audio API
 * and saves them as WAV files.
 *
 * Usage: node scripts/generate-sound-effects.js
 */

const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(__dirname, "../client/public/assets/audio");

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Generate a WAV file from audio data
 */
function writeWAV(filename, audioData, sampleRate = 44100) {
  const buffer = Buffer.alloc(44 + audioData.length * 2);

  // WAV Header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + audioData.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(audioData.length * 2, 40);

  // Audio data
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    buffer.writeInt16LE(sample * 0x7fff, 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

/**
 * Generate jump sound (quick pitch rise)
 */
function generateJumpSound() {
  const sampleRate = 44100;
  const duration = 0.3; // seconds
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 200 + (t / duration) * 300; // Rising pitch
    const envelope = 1 - t / duration; // Decay
    audioData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "jump.wav"), audioData);
  console.log("✓ Generated jump.wav");
}

/**
 * Generate coin collect sound (high ding)
 */
function generateCoinSound() {
  const sampleRate = 44100;
  const duration = 0.3;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 987.77; // B5 note
    const freq2 = 1318.51; // E6 note
    const envelope = Math.exp(-t * 10);
    audioData[i] =
      (Math.sin(2 * Math.PI * freq * t) * 0.5 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.3) *
      envelope *
      0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "coin.wav"), audioData);
  console.log("✓ Generated coin.wav");
}

/**
 * Generate enemy hit sound (low impact)
 */
function generateEnemyHitSound() {
  const sampleRate = 44100;
  const duration = 0.2;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 100;
    const envelope = Math.exp(-t * 15);
    // Add some noise
    const noise = (Math.random() - 0.5) * 0.3;
    audioData[i] =
      (Math.sin(2 * Math.PI * freq * t) * 0.7 + noise) * envelope * 0.6;
  }

  writeWAV(path.join(AUDIO_DIR, "enemy_hit.wav"), audioData);
  console.log("✓ Generated enemy_hit.wav");
}

/**
 * Generate player hurt sound (ouch)
 */
function generatePlayerHitSound() {
  const sampleRate = 44100;
  const duration = 0.4;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 150 - (t / duration) * 50; // Falling pitch
    const envelope = Math.exp(-t * 5);
    audioData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.7;
  }

  writeWAV(path.join(AUDIO_DIR, "player_hit.wav"), audioData);
  console.log("✓ Generated player_hit.wav");
}

/**
 * Generate health pickup sound (magical sparkle)
 */
function generateHealthPickupSound() {
  const sampleRate = 44100;
  const duration = 0.5;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 523.25; // C5
    const freq2 = 659.25; // E5
    const freq3 = 783.99; // G5
    const envelope = Math.exp(-t * 8);
    audioData[i] =
      (Math.sin(2 * Math.PI * freq * t) * 0.3 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.3 +
        Math.sin(2 * Math.PI * freq3 * t) * 0.3) *
      envelope *
      0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "health_pickup.wav"), audioData);
  console.log("✓ Generated health_pickup.wav");
}

/**
 * Generate level complete sound (victory)
 */
function generateLevelCompleteSound() {
  const sampleRate = 44100;
  const duration = 1.5;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  // Arpeggio: C - E - G - C
  const notes = [261.63, 329.63, 392.0, 523.25];
  const noteDuration = duration / notes.length;

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t / noteDuration);
    const freq = notes[Math.min(noteIndex, notes.length - 1)];
    const envelope = Math.exp(-(t % noteDuration) * 5);
    audioData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "level_complete.wav"), audioData);
  console.log("✓ Generated level_complete.wav");
}

/**
 * Generate game over sound (sad)
 */
function generateGameOverSound() {
  const sampleRate = 44100;
  const duration = 1.0;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 200 - (t / duration) * 100; // Falling pitch
    const envelope = 1 - t / duration;
    audioData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
  }

  writeWAV(path.join(AUDIO_DIR, "game_over.wav"), audioData);
  console.log("✓ Generated game_over.wav");
}

/**
 * Generate attack sound (swoosh)
 */
function generateAttackSound() {
  const sampleRate = 44100;
  const duration = 0.2;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 800 - (t / duration) * 400; // Falling pitch
    const envelope = Math.exp(-t * 20);
    const noise = (Math.random() - 0.5) * 0.2;
    audioData[i] =
      (Math.sin(2 * Math.PI * freq * t) * 0.7 + noise) * envelope * 0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "attack.wav"), audioData);
  console.log("✓ Generated attack.wav");
}

/**
 * Generate footstep sound (soft thud)
 */
function generateFootstepSound() {
  const sampleRate = 44100;
  const duration = 0.1;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 30);
    const noise = Math.random() - 0.5;
    audioData[i] = noise * envelope * 0.3;
  }

  writeWAV(path.join(AUDIO_DIR, "footstep.wav"), audioData);
  console.log("✓ Generated footstep.wav");
}

/**
 * Generate landing sound (thud)
 */
function generateLandingSound() {
  const sampleRate = 44100;
  const duration = 0.15;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 80;
    const envelope = Math.exp(-t * 25);
    const noise = (Math.random() - 0.5) * 0.3;
    audioData[i] =
      (Math.sin(2 * Math.PI * freq * t) * 0.5 + noise) * envelope * 0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "landing.wav"), audioData);
  console.log("✓ Generated landing.wav");
}

/**
 * Generate background music (simple ambient)
 */
function generateBackgroundMusic() {
  const sampleRate = 44100;
  const duration = 30; // 30 seconds loop
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  // Simple ambient pad
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq1 = 110; // A2
    const freq2 = 164.81; // E3
    const freq3 = 196; // G3

    // Slow modulation
    const mod = Math.sin(t * 0.5) * 0.1;

    audioData[i] =
      (Math.sin(2 * Math.PI * freq1 * t) * 0.2 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.15 +
        Math.sin(2 * Math.PI * freq3 * t) * 0.15 +
        Math.sin(2 * Math.PI * (freq1 * 2) * t + mod) * 0.1) *
      0.3;
  }

  writeWAV(path.join(AUDIO_DIR, "menu_music.mp3"), audioData);
  console.log("✓ Generated menu_music.mp3");
}

/**
 * Generate gameplay music (upbeat)
 */
function generateGameplayMusic() {
  const sampleRate = 44100;
  const duration = 60; // 60 seconds loop
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  // Simple bassline and melody
  const bassNotes = [65.41, 65.41, 73.42, 73.42, 82.41, 82.41, 98.0, 98.0]; // C2, D2, E2, G2
  const bassDuration = duration / bassNotes.length;

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const bassIndex = Math.floor(t / bassDuration);
    const bassFreq = bassNotes[bassIndex % bassNotes.length];

    // Simple arpeggio
    const melodyNotes = [261.63, 329.63, 392.0, 523.25];
    const melodyIndex = Math.floor((t * 4) % melodyNotes.length);
    const melodyFreq = melodyNotes[melodyIndex];

    const envelope = 0.8 + Math.sin(t * 2) * 0.2;

    audioData[i] =
      (Math.sin(2 * Math.PI * bassFreq * t) * 0.25 +
        Math.sin(2 * Math.PI * melodyFreq * t) * 0.15) *
      envelope *
      0.3;
  }

  writeWAV(path.join(AUDIO_DIR, "gameplay_music.mp3"), audioData);
  console.log("✓ Generated gameplay_music.mp3");
}

/**
 * Generate victory music
 */
function generateVictoryMusic() {
  const sampleRate = 44100;
  const duration = 3;
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples);

  // Victory fanfare
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]; // C E G C G C
  const noteDuration = duration / notes.length;

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t / noteDuration);
    const freq = notes[Math.min(noteIndex, notes.length - 1)];
    const envelope = Math.exp(-(t % noteDuration) * 3);

    audioData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
  }

  writeWAV(path.join(AUDIO_DIR, "victory_music.mp3"), audioData);
  console.log("✓ Generated victory_music.mp3");
}

// Main execution
console.log("🎵 Generating sound effects...\n");

try {
  // Generate SFX
  generateJumpSound();
  generateCoinSound();
  generateEnemyHitSound();
  generatePlayerHitSound();
  generateHealthPickupSound();
  generateLevelCompleteSound();
  generateGameOverSound();
  generateAttackSound();
  generateFootstepSound();
  generateLandingSound();

  // Generate music
  generateBackgroundMusic();
  generateGameplayMusic();
  generateVictoryMusic();

  console.log("\n✅ Sound effect generation complete!");
  console.log(`\nOutput directory: ${AUDIO_DIR}`);
  console.log("\nFiles generated:");
  const files = fs.readdirSync(AUDIO_DIR);
  files.forEach((file) => {
    const stats = fs.statSync(path.join(AUDIO_DIR, file));
    console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
} catch (error) {
  console.error("❌ Error generating sound effects:", error.message);
  process.exit(1);
}
