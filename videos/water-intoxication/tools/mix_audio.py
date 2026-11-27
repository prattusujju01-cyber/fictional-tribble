import os
import json
import subprocess
import cv2
from PIL import Image, ImageDraw

ROOT = os.environ.get("PROJECT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
SFX = os.environ.get("SFX_DIR", os.path.abspath(os.path.join(ROOT, "..", "fried-rice-syndrome", "assets_sfx")))
OUT_DIR = os.path.join(ROOT, "out")
os.makedirs(OUT_DIR, exist_ok=True)

SILENT_MP4 = os.path.join(OUT_DIR, "water_intoxication_silent.mp4")
MASTER_WAV = os.path.join(OUT_DIR, "water_intoxication_master.wav")
FINAL_MP4 = os.path.join(OUT_DIR, "water_intoxication_final.mp4")
AUDIT_JPG = os.path.join(OUT_DIR, "audit_36.jpg")

with open(os.path.join(ROOT, "script.json"), encoding="utf-8") as f:
    shots = json.load(f)["shots"]

# Build surgical real-WAV soundscape synced to the 32-shot v15.0 edit (~5 cues per 10s, zero synthetic noise)
cues = [
    # Continuous cohesive ambient & Rhodes/curiosity underscore beds
    ("bgm_curiosity_bed.wav", 0.0, 0.24, "aloop=loop=6:size=2e+09,atrim=0:120,afade=t=in:st=0:d=1.2,afade=t=out:st=116.5:d=3.5"),
    ("room_tone_warm.wav", 0.0, 0.14, "aloop=loop=8:size=2e+09,atrim=0:120,afade=t=out:st=118.0:d=2.0"),

    # World 1: Radio Studio (0.0 - 15.0s)
    ("camera_shutter_soft.wav", 0.18, 0.42, None),
    ("switch_click_crisp.wav", 3.65, 0.48, None),
    ("liquid_pour_glass.wav", 7.55, 0.62, "atrim=0:3.2,afade=t=out:st=2.7:d=0.5"),
    ("heartbeat_deep.wav", 11.55, 0.58, None),

    # World 2: Bedroom & Coroner Dossier (15.0 - 26.5s)
    ("clock_tick_loop.wav", 15.10, 0.34, "atrim=0:3.6,afade=t=out:st=3.0:d=0.6"),
    ("paper_slide.wav", 19.08, 0.52, None),
    ("stamp_impact_heavy.wav", 20.35, 0.56, None),
    ("marker_stroke.wav", 23.85, 0.50, None),
    ("marker_stroke.wav", 24.30, 0.50, None),

    # World 3: Sagittal Kidney & Flowmeter (26.5 - 41.5s)
    ("whoosh_soft_air.wav", 26.55, 0.40, None),
    ("gauge_tick_brass.wav", 31.10, 0.55, None),
    ("liquid_pour_glass.wav", 34.20, 0.56, "atrim=0:3.1,afade=t=out:st=2.6:d=0.5"),
    ("bubble_submerge.wav", 38.00, 0.50, "atrim=0:3.0,afade=t=out:st=2.5:d=0.5"),

    # World 4: Bloodstream, Y-Artery & Sodium Analyzer (41.5 - 57.0s)
    ("electric_spark_short.wav", 42.10, 0.44, None),
    ("gauge_tick_brass.wav", 45.65, 0.45, None),
    ("liquid_pour_glass.wav", 49.55, 0.52, "atrim=0:2.8,afade=t=out:st=2.3:d=0.5"),
    ("monitor_beep_short.wav", 53.60, 0.44, None),
    ("monitor_beep_short.wav", 54.80, 0.48, None),

    # World 5: U-Tube Osmometer & Aquaporin Membrane (57.0 - 69.0s)
    ("glass_clink_clean.wav", 57.15, 0.46, None),
    ("bubble_submerge.wav", 61.20, 0.48, "atrim=0:3.2,afade=t=out:st=2.6:d=0.6"),
    ("thud_soft_wood.wav", 65.25, 0.48, None),

    # World 6: Sagittal Skull, Cerebral Edema, Herniation & Switchboard (69.0 - 92.5s)
    ("switch_click_crisp.wav", 69.25, 0.45, None),
    ("heartbeat_deep.wav", 73.20, 0.55, None),
    ("heartbeat_deep.wav", 77.00, 0.65, None),
    ("stamp_impact_heavy.wav", 82.40, 0.62, None),
    ("breaker_slam_off.wav", 85.05, 0.68, None),
    ("breaker_slam_off.wav", 85.45, 0.65, None),
    ("breaker_slam_off.wav", 85.85, 0.62, None),
    ("monitor_flatline_soft.wav", 89.55, 0.42, "atrim=0:2.7,afade=t=out:st=2.1:d=0.6"),

    # World 7: Marathon, Infant Warning & 3% Saline Rescue (92.5 - 103.5s)
    ("paper_slide.wav", 92.75, 0.48, None),
    ("marker_stroke.wav", 96.65, 0.48, None),
    ("water_drop_single.wav", 100.35, 0.52, None),
    ("water_drop_single.wav", 101.45, 0.52, None),

    # World 8: 3 Golden Hydration Rules & Brass Scale Finale (103.5 - 120.0s)
    ("liquid_pour_glass.wav", 103.65, 0.50, "atrim=0:1.9,afade=t=out:st=1.5:d=0.4"),
    ("effervescent_fizz.wav", 107.60, 0.54, "atrim=0:2.6,afade=t=out:st=2.0:d=0.6"),
    ("glass_clink_clean.wav", 110.70, 0.46, None),
    ("brass_chime_warm.wav", 114.25, 0.54, None),
    ("paper_slide.wav", 117.30, 0.46, None),
]

# Fallback mapping in case any stem filename differs slightly in assets_sfx
available = sorted([f for f in os.listdir(SFX) if f.endswith(".wav")])
print(f"Available studio WAV stems ({len(available)}):", available)

def pick_wav(preferred):
    exact = os.path.join(SFX, preferred)
    if os.path.exists(exact):
        return exact
    key = preferred.split("_")[0].lower()
    for cand in available:
        if key in cand.lower():
            return os.path.join(SFX, cand)
    return os.path.join(SFX, available[0])

inputs = []
filter_parts = []
mix_labels = []

for idx, (fname, start_s, vol, extra_flt) in enumerate(cues):
    wav_path = pick_wav(fname)
    inputs.extend(["-i", wav_path])
    delay_ms = int(round(start_s * 1000))
    chain = []
    if extra_flt:
        chain.append(extra_flt)
    chain.append(f"volume={vol:.3f}")
    chain.append("aformat=sample_rates=48000:channel_layouts=stereo")
    if delay_ms > 0:
        chain.append(f"adelay={delay_ms}|{delay_ms}")
    lbl = f"a{idx}"
    filter_parts.append(f"[{idx}:a]{','.join(chain)}[{lbl}]")
    mix_labels.append(f"[{lbl}]")

amix_str = (
    f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0,"
    f"atrim=0:120,asetpts=PTS-STARTPTS,"
    f"loudnorm=I=-14.2:TP=-1.2:LRA=9.5[aout]"
)
filter_parts.append(amix_str)

cmd_wav = [
    "ffmpeg", "-nostdin", "-y",
    *inputs,
    "-filter_complex", ";".join(filter_parts),
    "-map", "[aout]",
    "-ar", "48000", "-ac", "2",
    MASTER_WAV
]
subprocess.run(cmd_wav, check=True)

# Mux silent 3600-frame H.264 stream + -14.2 LUFS stereo AAC 192k
cmd_mux = [
    "ffmpeg", "-nostdin", "-y",
    "-i", SILENT_MP4,
    "-i", MASTER_WAV,
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-movflags", "+faststart",
    "-shortest",
    FINAL_MP4
]
subprocess.run(cmd_mux, check=True)

# Build 6x6 36-frame Audit Contact Sheet across the final MP4
cap = cv2.VideoCapture(FINAL_MP4)
total_f = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
tw, th, pad = 270, 480, 6
sheet = Image.new("RGB", (6 * (tw + pad) + pad, 6 * (th + 24 + pad) + pad), (14, 13, 12))
draw = ImageDraw.Draw(sheet)

for i in range(36):
    f_idx = min(total_f - 1, int(round((i + 0.45) * (3600 / 36.0))))
    cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
    ok, frame = cap.read()
    if not ok:
        continue
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    im = Image.fromarray(rgb).resize((tw, th), Image.Resampling.LANCZOS)
    r, c = divmod(i, 6)
    x = pad + c * (tw + pad)
    y = pad + r * (th + 24 + pad)
    sheet.paste(im, (x, y + 20))
    draw.text((x + 4, y + 3), f"f{f_idx} | {f_idx/30.0:.2f}s", fill=(242, 232, 212))

cap.release()
sheet.save(AUDIT_JPG, quality=92)
print("Saved final MP4 & audit_36.jpg:", FINAL_MP4, AUDIT_JPG)
