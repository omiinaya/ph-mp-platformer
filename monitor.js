#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function runCommand(cmd, cwd = null) {
  return new Promise((resolve, reject) => {
    const options = cwd ? { cwd } : {};
    exec(cmd, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

async function runTests() {
  const result = await runCommand('npm run test', __dirname);
  const output = result.stdout + result.stderr;
  const passed =
    /Test Suites:.*passed/.test(output) &&
    /Tests:.*passed/.test(output) &&
    result.error === null;
  return { passed, output };
}

async function runLint() {
  const result = await runCommand('npm run lint', __dirname);
  const passed = result.error === null;
  return { passed, output: result.stdout + result.stderr };
}

async function checkStatus() {
  log('Checking repository status...');

  // Pull latest
  const pull = await runCommand('git pull origin main', __dirname);
  if (pull.error) {
    log('Git pull error: ' + pull.stderr);
    return;
  }
  if (pull.stdout.includes('up to date')) {
    log('Repository up to date');
  } else {
    log('Repository updated: ' + pull.stdout);
  }

  // Lint
  const lint = await runLint();
  if (!lint.passed) {
    log('Lint failures detected. Attempting auto-fix with prettier...');
    const format = await runCommand('npm run format', __dirname);
    if (format.error) {
      log('Prettier fix failed. Manual intervention needed.');
      // Try to commit format changes
      const status = await runCommand('git status --porcelain', __dirname);
      if (status.stdout.trim()) {
        await runCommand('git add .', __dirname);
        await runCommand(
          'git commit -m "chore: auto-format with prettier"',
          __dirname,
        );
        await runCommand('git push origin main', __dirname);
      }
    } else {
      log('Code formatted. Committing changes...');
      const commitResult = await runCommand('git diff --quiet', __dirname);
      if (commitResult.error) {
        await runCommand('git add .', __dirname);
        await runCommand('git commit -m "chore: auto-format code"', __dirname);
        const push = await runCommand('git push origin main', __dirname);
        if (push.error) {
          log('Push failed: ' + push.stderr);
        } else {
          log('Pushed formatting changes.');
        }
      }
    }
    // Re-check lint after format
    const lintAfter = await runLint();
    if (!lintAfter.passed) {
      log('Lint still failing after formatting: ' + lintAfter.output);
    }
  } else {
    log('Lint passed.');
  }

  // Tests
  const tests = await runTests();
  if (!tests.passed) {
    log(
      'Test failures detected. Investigation needed. Output: ' +
        tests.output.substring(0, 2000),
    );
    // Could attempt to fix common issues, but generally requires manual debugging
  } else {
    log('All tests passed.');
    // Count tests
    const testCount = tests.output.match(/Tests:\s+(\d+)\s+passed/);
    if (testCount) {
      log(`${testCount[1]} tests passing`);
    }
  }

  // Check for any lingering issues like worker leaks (warnings)
  if (tests.output.includes('worker process has failed to exit gracefully')) {
    log(
      'Warning: worker process exit issues detected. Consider investigating test cleanup.',
    );
  }

  log(
    'Status check complete. Next check in ' +
      CHECK_INTERVAL / 60000 +
      ' minutes.\n',
  );
}

// Run indefinitely
(async function monitorLoop() {
  try {
    await checkStatus();
  } catch (err) {
    log('Error during monitoring: ' + err.message);
  }
  setTimeout(monitorLoop, CHECK_INTERVAL);
})();
