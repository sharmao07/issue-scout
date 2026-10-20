import math
import struct
import wave

SAMPLE_RATE = 48000
DURATION = 14.5
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)

# Ambient Audio Generator for Issue Scout Cinematic Fly-Over
# Subtle electronic ambience + restrained whooshes + principal hit at 9.97s

left_channel = [0.0] * NUM_SAMPLES
right_channel = [0.0] * NUM_SAMPLES

# 1. Base Atmospheric Drone (Warm, subtle analog pad)
# Root note A (55Hz, 110Hz, 164.8Hz)
for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    
    # Envelope: gentle swell, dips slightly during whooshes, blooms at end
    env = 0.18 * (1.0 - math.exp(-t * 2.0))
    if t > 14.0:
        env *= (14.5 - t) / 0.5
        
    s1 = math.sin(2 * math.pi * 55.0 * t)
    s2 = 0.5 * math.sin(2 * math.pi * 110.0 * t + 0.3)
    s3 = 0.25 * math.sin(2 * math.pi * 164.81 * t + 0.7)
    s4 = 0.15 * math.sin(2 * math.pi * 220.0 * t + 1.2)
    
    # Subtle chorus / stereo spread
    drone_l = env * (s1 + s2 * 0.9 + s3 * 1.1 + s4 * 0.8)
    drone_r = env * (s1 + s2 * 1.1 + s3 * 0.9 + s4 * 1.2)
    
    left_channel[i] += drone_l
    right_channel[i] += drone_r

# 2. Delicate High Shimmer (Tonal sparkle, soft glass texture)
for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    env = 0.04 * math.sin(t * 0.8)**2
    if t > 14.0:
        env *= (14.5 - t) / 0.5
    shimmer_l = env * (math.sin(2 * math.pi * 880.0 * t) + 0.5 * math.sin(2 * math.pi * 1320.0 * t))
    shimmer_r = env * (math.sin(2 * math.pi * 884.0 * t) + 0.5 * math.sin(2 * math.pi * 1316.0 * t))
    left_channel[i] += shimmer_l
    right_channel[i] += shimmer_r

# 3. Restrained Whoosh 1 (centered at 8.66s, duration ~0.8s)
# Smooth airy sweep without harsh noise
whoosh1_center = 8.66
whoosh1_width = 0.45
for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    dt = t - whoosh1_center
    if abs(dt) < whoosh1_width:
        w_env = 0.12 * math.exp(- (dt / 0.20)**2)
        # filtered noise-like airy sweep
        freq = 350.0 + 200.0 * math.tanh(dt * 6.0)
        airy = math.sin(2 * math.pi * freq * t) * math.sin(2 * math.pi * (freq * 1.414) * t)
        pan = 0.5 + 0.3 * (dt / whoosh1_width)
        left_channel[i] += w_env * airy * (1.0 - pan)
        right_channel[i] += w_env * airy * pan

# 4. Restrained Whoosh 2 (centered at 9.80s, duration ~0.4s)
whoosh2_center = 9.80
whoosh2_width = 0.30
for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    dt = t - whoosh2_center
    if abs(dt) < whoosh2_width:
        w_env = 0.15 * math.exp(- (dt / 0.14)**2)
        freq = 500.0 - 250.0 * (dt / whoosh2_width)
        airy = math.sin(2 * math.pi * freq * t) * math.cos(2 * math.pi * (freq * 1.732) * t)
        left_channel[i] += w_env * airy * 0.9
        right_channel[i] += w_env * airy * 1.1

# 5. Principal Audio Hit at 9.97s (Warm crystalline chime / pad bloom)
hit_time = 9.97
for i in range(NUM_SAMPLES):
    t = i / SAMPLE_RATE
    if t >= hit_time:
        dt = t - hit_time
        # Attack ~0.03s, decay ~3.5s
        attack = min(1.0, dt / 0.035)
        decay = math.exp(-dt / 1.6)
        hit_env = 0.28 * attack * decay
        if t > 14.0:
            hit_env *= (14.5 - t) / 0.5
            
        # Rich harmonious chord: A major 9 / sus2 (220, 277.18, 330, 440, 659.25, 880)
        c1 = math.sin(2 * math.pi * 220.0 * dt)
        c2 = 0.7 * math.sin(2 * math.pi * 330.0 * dt + 0.4)
        c3 = 0.5 * math.sin(2 * math.pi * 440.0 * dt + 0.8)
        c4 = 0.3 * math.sin(2 * math.pi * 659.25 * dt + 1.2)
        c5 = 0.2 * math.sin(2 * math.pi * 880.0 * dt + 1.6)
        
        chord_l = hit_env * (c1 + c2 * 1.1 + c3 * 0.9 + c4 * 1.2 + c5 * 0.8)
        chord_r = hit_env * (c1 + c2 * 0.9 + c3 * 1.1 + c4 * 0.8 + c5 * 1.2)
        
        left_channel[i] += chord_l
        right_channel[i] += chord_r

# Normalize to safe peak around -2 dB (0.78)
max_peak = max(max(abs(x) for x in left_channel), max(abs(x) for x in right_channel))
print(f"Raw audio peak: {max_peak:.4f}")
target_peak = 0.75
scale = target_peak / max_peak if max_peak > 0 else 1.0

# Write 16-bit WAV
with wave.open('flyover/audio.wav', 'w') as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    for i in range(NUM_SAMPLES):
        l = int(max(-32767, min(32767, left_channel[i] * scale * 32767)))
        r = int(max(-32767, min(32767, right_channel[i] * scale * 32767)))
        frames.extend(struct.pack('<hh', l, r))
        
    wav_file.writeframes(frames)

print(f"Generated flyover/audio.wav successfully ({DURATION}s, 48kHz stereo, peak -2.5dB).")
