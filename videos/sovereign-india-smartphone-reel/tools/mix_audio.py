#!/usr/bin/env python3
"""
tools/mix_audio.py
Mixes 48kHz Edge-TTS voiceover (vo.wav) + single cohesive pulse BGM bed + frame-locked real-WAV foley cues,
normalizes via EBU R128 (-14.0 LUFS / -1.0 dBTP), muxes final 1080x1920 @ 30fps MP4, and writes audit_24.jpg.
"""

import json
import os
import subprocess
from pathlib import Path

ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parent.parent))
SFX_DIR = Path(os.environ.get("SFX_DIR", ROOT.parent / "fried-rice-syndrome" / "assets_sfx"))
OUT_DIR = ROOT / "out"

script = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
timeline = json.loads((ROOT / "data" / "vo_timeline.json").read_text(encoding="utf-8"))
total_dur = float(timeline["totalDurationSec"])

silent_mp4 = OUT_DIR / "smartphone_silent.mp4"
vo_wav = OUT_DIR / "vo.wav"
master_wav = OUT_DIR / "master_audio.wav"
final_mp4 = OUT_DIR / "India_Smartphone_Revolution_Sovereign_Reel.mp4"

# Build FFmpeg filter_complex for VO + looped BGM bed + discrete real-WAV foley events
inputs = ["-i", str(vo_wav)]
bgm_file = SFX_DIR / "bgm_swiss_dark_pulse_loop.wav"
has_bgm = bgm_file.exists()
if has_bgm:
    inputs += ["-stream_loop", "-1", "-i", str(bgm_file)]

sfx_events = []
for sc_cfg, sc_tl in zip(script["scenes"], timeline["scenes"]):
    base_t = float(sc_tl["startSec"])
    for cue in sc_cfg.get("sfx", []):
        wav_p = SFX_DIR / cue["file"]
        if wav_p.exists():
            t_ms = max(0, int(round((base_t + float(cue.get("offsetSec", 0.0))) * 1000)))
            gain_db = float(cue.get("gainDb", -10.0))
            sfx_events.append((wav_p, t_ms, gain_db))

for wav_p, _, _ in sfx_events:
    inputs += ["-i", str(wav_p)]

filter_parts = []
mix_labels = []

# Input 0: Voiceover with crisp documentary presence
filter_parts.append(
    f"[0:a]highpass=f=85,equalizer=f=3200:t=q:w=1.2:g=2.2,volume=2.0dB,apad=whole_dur={total_dur:.4f}[vo]"
)
mix_labels.append("[vo]")

next_idx = 1
if has_bgm:
    fade_st = max(0.0, total_dur - 1.8)
    filter_parts.append(
        f"[{next_idx}:a]atrim=0:{total_dur:.4f},asetpts=PTS-STARTPTS,"
        f"lowpass=f=4800,volume=-15.5dB,"
        f"afade=t=in:st=0:d=0.6,afade=t=out:st={fade_st:.3f}:d=1.7[bgm]"
    )
    mix_labels.append("[bgm]")
    next_idx += 1

for i, (_, delay_ms, gain_db) in enumerate(sfx_events):
    in_idx = next_idx + i
    lbl = f"[s{i}]"
    filter_parts.append(
        f"[{in_idx}:a]volume={gain_db:.1f}dB,adelay={delay_ms}|{delay_ms},apad=whole_dur={total_dur:.4f}{lbl}"
    )
    mix_labels.append(lbl)

n_mix = len(mix_labels)
filter_parts.append(
    f"{''.join(mix_labels)}amix=inputs={n_mix}:duration=first:dropout_transition=0:normalize=0,"
    f"alimiter=limit=0.92,loudnorm=I=-14.0:TP=-1.0:LRA=7.0,"
    f"atrim=0:{total_dur:.4f}[aout]"
)

filter_str = ";".join(filter_parts)
subprocess.run(
    ["ffmpeg", "-nostdin", "-y"] + inputs + [
        "-filter_complex", filter_str,
        "-map", "[aout]",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
        str(master_wav)
    ],
    check=True
)

# Mux silent H.264 video + -14.0 LUFS stereo AAC 192k soundtrack
subprocess.run([
    "ffmpeg", "-nostdin", "-y",
    "-i", str(silent_mp4),
    "-i", str(master_wav),
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    "-shortest",
    str(final_mp4)
], check=True)

# Generate 24-frame final MP4 visual verification contact sheet
step_s = max(0.5, total_dur / 24.0)
subprocess.run([
    "ffmpeg", "-nostdin", "-y",
    "-i", str(final_mp4),
    "-vf", f"fps=1/{step_s:.4f},scale=320:568,tile=6x4:padding=4:margin=4:color=0x0b0f29",
    "-frames:v", "1", "-q:v", "2",
    str(OUT_DIR / "audit_24.jpg")
], check=True)

print(f"[mix] FINAL MP4 READY: {final_mp4} ({final_mp4.stat().st_size / (1024*1024):.2f} MB)")
