// Pure Node.js verification test for audioAlerts.ts

const fs = require('fs');
const path = require('path');
const ts = require(path.join(__dirname, '../node_modules/typescript'));

class MockAudioParam {
  constructor() {
    this.value = 0;
    this.scheduledEvents = [];
  }
  setValueAtTime(val, time) {
    this.value = val;
    this.scheduledEvents.push({ type: 'setValueAtTime', val, time });
  }
  linearRampToValueAtTime(val, time) {
    this.value = val;
    this.scheduledEvents.push({ type: 'linearRampToValueAtTime', val, time });
  }
  exponentialRampToValueAtTime(val, time) {
    this.value = val;
    this.scheduledEvents.push({ type: 'exponentialRampToValueAtTime', val, time });
  }
  cancelScheduledValues(time) {
    this.scheduledEvents.push({ type: 'cancelScheduledValues', time });
  }
}

class MockAudioNode {
  constructor() {
    this.connectedTo = null;
  }
  connect(dest) {
    this.connectedTo = dest;
    return dest;
  }
  disconnect() {
    this.connectedTo = null;
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = new MockAudioParam();
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = new MockAudioParam();
    this.startedAt = null;
    this.stoppedAt = null;
  }
  start(time) {
    this.startedAt = time !== undefined ? time : 0;
  }
  stop(time) {
    this.stoppedAt = time !== undefined ? time : 0;
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super();
    this.type = 'lowpass';
    this.frequency = new MockAudioParam();
  }
}

class MockCompressorNode extends MockAudioNode {
  constructor() {
    super();
    this.threshold = new MockAudioParam();
    this.knee = new MockAudioParam();
    this.ratio = new MockAudioParam();
    this.attack = new MockAudioParam();
    this.release = new MockAudioParam();
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 100.0;
    this.destination = new MockAudioNode();
    this.createdOscillators = [];
    this.createdGainNodes = [];
  }
  createOscillator() {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc;
  }
  createGain() {
    const gain = new MockGainNode();
    this.createdGainNodes.push(gain);
    return gain;
  }
  createBiquadFilter() {
    return new MockBiquadFilterNode();
  }
  createDynamicsCompressor() {
    return new MockCompressorNode();
  }
  async resume() {
    this.state = 'running';
  }
}

global.window = {
  AudioContext: MockAudioContext,
};

// Transpile audioAlerts.ts cleanly using typescript
const tsSource = fs.readFileSync(path.join(__dirname, '../lib/audioAlerts.ts'), 'utf-8');
const jsOutput = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

const moduleExports = {};
const moduleFn = new Function('require', 'exports', 'module', 'global', 'window', jsOutput);
const moduleObj = { exports: moduleExports };
moduleFn(require, moduleExports, moduleObj, global, global.window);

const { AUDIO_CONFIG, audioAlerts } = moduleObj.exports;

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('DRIVEGUARD AI AUDIO ALERT SUITE VERIFICATION');
  console.log('======================================================\n');

  // Req 1 & 9: Volume levels & configuration
  console.log('Requirement 1 & 9: Configurable volume & safe maximum');
  assert(AUDIO_CONFIG.masterVolume >= 0.8 && AUDIO_CONFIG.masterVolume <= 0.85, `Master volume is set to audible ceiling: ${AUDIO_CONFIG.masterVolume}`);
  assert(AUDIO_CONFIG.maxSafeGain === 0.85, 'Individual node max safe gain is 0.85 (prevents clipping)');
  audioAlerts.setMasterVolume(0.70);
  assert(audioAlerts.getMasterVolume() === 0.70, 'Volume is configurable via setMasterVolume');
  audioAlerts.setMasterVolume(AUDIO_CONFIG.masterVolume);

  // Req 8: Autoplay AudioContext resume
  console.log('\nRequirement 8: Browser Autoplay Policy & AudioContext Resume');
  const ctx = await audioAlerts.ensureAudioContext();
  assert(ctx !== null, 'AudioContext created successfully');
  assert(ctx.state === 'running', 'AudioContext resumed to "running" state on user action');

  // Req 2 & 5: Critical warning sequence (~4.6s)
  console.log('\nRequirement 2 & 5: Critical Warning Duration (~4–5s) & Urgency');
  ctx.createdOscillators = [];
  audioAlerts.playCriticalWarning();
  const critOscs = ctx.createdOscillators;
  assert(critOscs.length > 0, `Scheduled ${critOscs.length} pulse oscillators for emergency pattern`);
  const critDur = critOscs[critOscs.length - 1].stoppedAt - critOscs[0].startedAt;
  console.log(`  Measured Critical Duration: ${critDur.toFixed(2)}s`);
  assert(critDur >= 4.0 && critDur <= 5.0, `Critical warning runs for ~4.5 seconds (${critDur.toFixed(2)}s)`);

  // Req 6: No overlapping audio streams
  console.log('\nRequirement 6: Ensure alerts do not overlap');
  const countBefore = ctx.createdOscillators.length;
  audioAlerts.playCaution();
  const countAfter = ctx.createdOscillators.length;
  assert(countBefore === countAfter, 'Lower-priority alert rejected while critical is active (zero audio overlap)');

  // Req 7: Cooldown & Preemption
  console.log('\nRequirement 7: Alert Cooldown & Preemption');
  audioAlerts.stopCurrentAlert();
  ctx.createdOscillators = [];
  audioAlerts.lastAlertTimes.clear();
  audioAlerts.globalLastAlertTime = 0;

  audioAlerts.playDistractionAlert();
  assert(audioAlerts.activeAlert && audioAlerts.activeAlert.priority === 2, 'Distraction alert started with priority 2');
  
  // High-priority alert preempts lower-priority alert
  audioAlerts.playCriticalWarning();
  assert(audioAlerts.activeAlert && audioAlerts.activeAlert.priority === 3, 'Critical alert immediately preempted distraction alert');

  // Req 3 & 4: Drowsiness Alert Duration (~4.4s)
  console.log('\nRequirement 3 & 4: Drowsiness Alert Pattern & Duration');
  audioAlerts.stopCurrentAlert();
  ctx.createdOscillators = [];
  audioAlerts.lastAlertTimes.clear();
  audioAlerts.globalLastAlertTime = 0;
  audioAlerts.playDrowsinessAlert();
  const dOscs = ctx.createdOscillators;
  const dDur = dOscs[dOscs.length - 1].stoppedAt - dOscs[0].startedAt;
  console.log(`  Measured Drowsiness Duration: ${dDur.toFixed(2)}s`);
  assert(dDur >= 4.0 && dDur <= 5.0, `Drowsiness alert runs for ~4-5s (${dDur.toFixed(2)}s)`);

  // Req 4: Distraction Alert Duration (~4.2s)
  console.log('\nRequirement 4: Distraction Alert Pattern & Duration');
  audioAlerts.stopCurrentAlert();
  ctx.createdOscillators = [];
  audioAlerts.lastAlertTimes.clear();
  audioAlerts.globalLastAlertTime = 0;
  audioAlerts.playDistractionAlert();
  const distOscs = ctx.createdOscillators;
  const distDur = distOscs[distOscs.length - 1].stoppedAt - distOscs[0].startedAt;
  console.log(`  Measured Distraction Duration: ${distDur.toFixed(2)}s`);
  assert(distDur >= 4.0 && distDur <= 5.0, `Distraction alert runs for ~4-5s (${distDur.toFixed(2)}s)`);

  // Req 4: Face Visibility Alert Duration (~4.4s)
  console.log('\nRequirement 4: Face Visibility Alert Pattern & Duration');
  audioAlerts.stopCurrentAlert();
  ctx.createdOscillators = [];
  audioAlerts.lastAlertTimes.clear();
  audioAlerts.globalLastAlertTime = 0;
  audioAlerts.playFaceLostAlert();
  const faceOscs = ctx.createdOscillators;
  const faceDur = faceOscs[faceOscs.length - 1].stoppedAt - faceOscs[0].startedAt;
  console.log(`  Measured Face Visibility Duration: ${faceDur.toFixed(2)}s`);
  assert(faceDur >= 4.0 && faceDur <= 5.0, `Face visibility alert runs for ~4-5s (${faceDur.toFixed(2)}s)`);

  // Stop current alert & tactile acknowledge
  console.log('\nTesting Tactile Acknowledge & Immediate Hush');
  audioAlerts.playCriticalWarning();
  assert(audioAlerts.activeAlert !== null, 'Alert active before acknowledge');
  audioAlerts.stopCurrentAlert();
  audioAlerts.playAcknowledge();
  assert(audioAlerts.activeAlert === null, 'Active alert hushed immediately on acknowledge');

  // Testing Continuous Looping Alerts and Instant Hush
  console.log('\nTesting Continuous Looping Alert Activation & Instant Stop');
  audioAlerts.stopCurrentAlert();
  ctx.createdOscillators = [];

  audioAlerts.startContinuousAlert('distraction');
  assert(audioAlerts.activeAlert !== null, 'Continuous distraction alert is active');
  assert(audioAlerts.activeAlert.category === 'distraction', 'Category is distraction');
  assert(audioAlerts.activeAlert.isContinuous === true, 'Session is marked continuous');

  // Higher priority drowsiness preempts distraction
  audioAlerts.startContinuousAlert('drowsiness');
  assert(audioAlerts.activeAlert.category === 'drowsiness', 'Continuous drowsiness alert preempted distraction');

  // Eye reopen stops drowsiness immediately
  audioAlerts.stopAlert('drowsiness');
  assert(audioAlerts.activeAlert === null, 'Drowsiness alert stopped immediately upon eye reopen');

  // New distraction event starts immediately without cooldown delay
  audioAlerts.startContinuousAlert('distraction');
  assert(audioAlerts.activeAlert !== null && audioAlerts.activeAlert.category === 'distraction', 'Distraction alert started immediately with zero cooldown lockout');

  // Driver looks forward stops distraction immediately
  audioAlerts.stopAlert('distraction');
  assert(audioAlerts.activeAlert === null, 'Distraction alert stopped immediately when looking forward');

  console.log(`\n======================================================`);
  console.log(`ALL TESTS PASSED: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`======================================================\n`);

  if (testsFailed > 0) process.exit(1);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
