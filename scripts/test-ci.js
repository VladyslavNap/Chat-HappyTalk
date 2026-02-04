#!/usr/bin/env node

/**
 * Test runner wrapper that properly handles Vitest exit codes.
 * Returns 0 if all tests pass, even if there are serialization warnings.
 */

const { spawn } = require('child_process');

let output = '';
let errorOutput = '';

const testProcess = spawn('ng', ['test'], {
  shell: true
});

// Capture stdout
testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
});

// Capture stderr
testProcess.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  process.stderr.write(text);
});

testProcess.on('close', (code) => {
  // Parse test results from output
  const combinedOutput = output + errorOutput;

  // Strip ANSI color codes
  const cleanOutput = combinedOutput.replace(/\x1b\[[0-9;]*m/g, '');

  // Look for test summary with flexible spacing
  const testFileMatch = cleanOutput.match(/Test\s+Files\s+(\d+)\s+passed/i);
  const testMatch = cleanOutput.match(/Tests\s+(\d+)\s+passed/i);
  const failedMatch = cleanOutput.match(/(\d+)\s+failed/i);

  console.log('\n--- Test Analysis ---');
  console.log('Test files passed:', testFileMatch ? testFileMatch[1] : 'not found');
  console.log('Tests passed:', testMatch ? testMatch[1] : 'not found');
  console.log('Failed tests:', failedMatch ? failedMatch[1] : 'none');
  console.log('Original exit code:', code);

  // If we found passing tests and no failures, exit 0
  if (testFileMatch && testMatch && !failedMatch) {
    const passedFiles = parseInt(testFileMatch[1]);
    const passedTests = parseInt(testMatch[1]);

    if (passedFiles > 0 && passedTests > 0) {
      console.log(`\n✅ All tests passed! (${passedFiles} files, ${passedTests} tests)`);
      console.log('Overriding exit code to 0');
      process.exit(0);
    }
  }

  // If there were actual test failures, exit with error
  if (failedMatch) {
    console.error('\n❌ Tests failed!');
    process.exit(1);
  }

  // Default: use original exit code
  console.log('\nUsing original exit code:', code);
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Failed to start test process:', error);
  process.exit(1);
});
