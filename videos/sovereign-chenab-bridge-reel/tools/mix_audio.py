#!/usr/bin/env python3
"""
tools/mix_audio.py (v3.0 — INSTRUMENTAL BGM + SYNCED HIGH-VELOCITY CAMERA FOLEY, SINGLE-PASS UNIVERSAL BT.709 H.264 MASTER)
- ZERO AI voiceover (creator records own voiceover using VOICEOVER_SCRIPT.md).
- Re-encodes concatenated intra shards in ONE unified H.264 High@L4.1 BT.709 pass
  so SPS/PPS, timestamps, and bitrate (maxrate 6.5M) play seamlessly across all 78.00s!
"""

import json
import os
import subprocess
from pathlib import Path

ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parent.parent))
SFX_DIR = Path(os.environ.get("SFX_DIR", ROOT.parent / "fried-rice-syndrome" / "assets_sfx"))
OUT_DIR = ROOT / "out"

script = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
total_dur = float(script["totalDurationSec"])
total_frames = int(script["totalFrames"])

silent_mp4 = OUT_DIR / "chenab_silent.mp4"
master_wav = OUT_DIR / "master_audio.wav"
final_mp4 = OUT_DIR / "Chenab_Bridge_359m_Sovereign_Reel.mp4"

inputs = []
filter_parts = []
mix_labels = []

# Exact 78.0000s stereo silent anchor
inputs += ["-f", "lavfi", "-t", f"{total_dur:.4f}", "-i", "anullsrc=r=48000:cl=stereo"]
filter_parts.append("[0:a]volume=0.0[base]")
mix_labels.append("[base]")
next_idx = 1

bgm_file = SFX_DIR / "bgm_swiss_dark_pulse_loop.wav"
if bgm_file.exists():
    inputs += ["-stream_loop", "-1", "-i", str(bgm_file)]
    fade_st = max(0.0, total_dur - 2.2)
    filter_parts.append(
        f"[{next_idx}:a]atrim=0:{total_dur:.4f},asetpts=PTS-STARTPTS,"
        f"lowpass=f=5200,volume=-11.5dB,"
        f"afade=t=in:st=0:d=0.8,afade=t=out:st={fade_st:.3f}:d=2.0[bgm]"
    )
    mix_labels.append("[bgm]")
    next_idx += 1

sfx_events = []
for sc in script["scenes"]:
    base_t = float(sc["startSec"])
    for cue in sc.get("sfx", []):
        wav_p = SFX_DIR / cue["file"]
        if wav_p.exists():
            t_ms = max(0, int(round((base_t + float(cue.get("offsetSec", 0.0))) * 1000)))
            gain_db = float(cue.get("gainDb", -10.0))
            sfx_events.append((wav_p, t_ms, gain_db))

for wav_p, _, _ in sfx_events:
    inputs += ["-i", str(wav_p)]

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
    f"alimiter=limit=0.89,loudnorm=I=-16.0:TP=-1.5:LRA=7.0,"
    f"atrim=0:{total_dur:.4f}[aout]"
)

subprocess.run(
    ["ffmpeg", "-nostdin", "-y"] + inputs + [
        "-filter_complex", ";".join(filter_parts),
        "-map", "[aout]",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
        str(master_wav)
    ],
    check=True
)

# SINGLE-PASS UNIFIED BT.709 HIGH@L4.1 MASTER ENCODE
subprocess.run([
    "ffmpeg", "-nostdin", "-y",
    "-fflags", "+genpts",
    "-i", str(silent_mp4),
    "-i", str(master_wav),
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-frames:v", str(total_frames),
    "-c:v", "libx264",
    "-preset", "medium",
    "-profile:v", "high",
    "-level:v", "4.1",
    "-crf", "19",
    "-maxrate", "6500k",
    "-bufsize", "13000k",
    "-pix_fmt", "yuv420p",
    "-colorspace", "bt709",
    "-color_primaries", "bt709",
    "-color_trc", "bt709",
    "-r", "30",
    "-g", "60",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    str(final_mp4)
], check=True)

step_s = total_dur / 24.0
subprocess.run([
    "ffmpeg", "-nostdin", "-y",
    "-i", str(final_mp4),
    "-vf", f"fps=1/{step_s:.4f},scale=320:568,tile=6x4:padding=4:margin=4:color=0x0b0f29",
    "-frames:v", "1", "-q:v", "2",
    str(OUT_DIR / "audit_24.jpg")
], check=True)

print(f"[mix] UNIVERSAL 78.00s FINAL MP4 READY: {final_mp4} ({final_mp4.stat().st_size / (1024*1024):.2f} MB)")
