import sys
sys.path.insert(0, r'e:\University life\FYP\driversafetysystem')

# ---- Test DrowsinessDetector ----
from backend.app.ai.drowsiness.detector import DrowsinessDetector

d = DrowsinessDetector()

# Simulate calibration: 20 open-eye frames
for i in range(20):
    s, drowsy, sev, new_a = d.evaluate(0.28, 0.18)
assert s == 'ATTENTION NORMAL', f'Expected ATTENTION NORMAL, got {s}'
assert not drowsy, 'Eyes open should not be drowsy'
print(f'[PASS] Calibrated: threshold={d.ear_threshold:.3f}, baseline={d.baseline_ear:.3f}')

# Normal blink — 3 frames closed, should NOT alert
for i in range(3):
    s, drowsy, sev, new_a = d.evaluate(0.10, 0.18)
assert not drowsy, f'Normal blink (3 frames) should NOT be drowsy, got {s}'
# Eyes reopen
s, drowsy, sev, new_a = d.evaluate(0.28, 0.18)
assert s == 'ATTENTION NORMAL' and not drowsy, 'Eyes reopened after blink should clear'
assert d.consecutive_low_frames == 0, 'Counter must reset on reopen'
print('[PASS] Normal blink (3 frames): no alert, counter reset')

# Prolonged closure — 15+ frames
for i in range(15):
    s, drowsy, sev, new_a = d.evaluate(0.10, 0.18)
assert drowsy, f'15 consecutive low frames should be drowsy, got status={s}'
assert s == 'DROWSINESS DETECTED', f'Expected DROWSINESS DETECTED got {s}'
assert new_a == True, 'First alert frame should fire new_alert=True'
print(f'[PASS] Prolonged closure (15 frames): DROWSINESS DETECTED, new_alert=True')

# Additional frames — continuous is_drowsy=True but new_alert=False
s2, drowsy2, sev2, new_a2 = d.evaluate(0.10, 0.18)
assert drowsy2, 'Continued closure should still be drowsy'
assert new_a2 == False, 'Subsequent frames should NOT fire new_alert again'
print('[PASS] Continued closure: is_drowsy=True, is_new_alert=False (no duplicate DB write)')

# Eyes reopen — IMMEDIATE clearance
s3, drowsy3, sev3, new_a3 = d.evaluate(0.28, 0.18)
assert not drowsy3, 'Eyes reopened should immediately clear drowsy state'
assert s3 == 'ATTENTION NORMAL', f'Expected ATTENTION NORMAL after reopen, got {s3}'
assert d.consecutive_low_frames == 0, 'Counter must be 0 immediately after reopen'
assert d.last_alert_time == 0.0, 'Cooldown must reset on reopen for instant next episode'
print('[PASS] Eye reopen: immediate clearance, cooldown reset')

# Microsleep test — 25+ frames
d2 = DrowsinessDetector()
for i in range(20): d2.evaluate(0.28, 0.18)
for i in range(25): s, drowsy, sev, new_a = d2.evaluate(0.10, 0.18)
assert s == 'MICROSLEEP WARNING', f'Expected MICROSLEEP WARNING, got {s}'
assert drowsy and sev == 'critical'
print('[PASS] Microsleep (25 frames): MICROSLEEP WARNING, critical severity')

print()

# ---- Test DistractionDetector ----
from backend.app.ai.distraction.detector import DistractionDetector

dd = DistractionDetector()
# Calibrate with 20 forward frames
for i in range(20):
    st, dis, sv, na = dd.evaluate(2.0, -3.0)
assert dd.is_calibrated, 'Should be calibrated after 20 forward frames'
print(f'[PASS] Calibrated: neutral_yaw={dd.neutral_yaw:.1f}, neutral_pitch={dd.neutral_pitch:.1f}')

# Forward gaze — no alert
st, dis, sv, na = dd.evaluate(2.0, -3.0)
assert not dis, f'Forward gaze should NOT be distracted, got {st}'
print('[PASS] Forward gaze: no distraction')

# Head turn — 8+ frames
for i in range(8):
    st, dis, sv, na = dd.evaluate(30.0, -3.0)
assert dis, f'8 consecutive turned frames should be distracted, got {st}'
assert st == 'HEAD TURNED / OFF-ROAD', f'Expected HEAD TURNED / OFF-ROAD, got {st}'
assert na == True, 'First alert frame should fire new_alert=True'
print(f'[PASS] Head turn (8 frames): HEAD TURNED / OFF-ROAD, new_alert=True')

# Continued distraction — is_distracted=True but new_alert=False
st2, dis2, sv2, na2 = dd.evaluate(30.0, -3.0)
assert dis2, 'Continued distraction should still be is_distracted=True'
assert na2 == False, 'Subsequent frames should NOT fire new_alert again'
print('[PASS] Continued distraction: is_distracted=True, is_new_alert=False')

# Return forward — IMMEDIATE clearance
st3, dis3, sv3, na3 = dd.evaluate(2.0, -3.0)
assert not dis3, 'Return to forward should immediately clear distraction'
assert st3 == 'FOCUSED ON ROAD', f'Expected FOCUSED ON ROAD, got {st3}'
assert dd.consecutive_distracted_frames == 0
assert dd.last_alert_time == 0.0, 'Cooldown must reset for instant next episode'
print('[PASS] Return forward: immediate clearance, cooldown reset')

# Downward gaze test
dd2 = DistractionDetector()
for i in range(20): dd2.evaluate(2.0, -3.0)
for i in range(8):  st, dis, sv, na = dd2.evaluate(2.0, -25.0)  # pitch_dev = -25-(-3) = -22 < -18
assert dis and st == 'PHONE / DOWNWARD GAZE', f'Expected PHONE / DOWNWARD GAZE, got {st}'
print('[PASS] Downward gaze (8 frames): PHONE / DOWNWARD GAZE')

print()
print('=== ALL DETECTOR TESTS PASSED ===')
