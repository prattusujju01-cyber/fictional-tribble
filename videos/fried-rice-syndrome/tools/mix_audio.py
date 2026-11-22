#!/usr/bin/env python3
"""
Broadcast Editorial Documentary Audio Master (-14.2 LUFS) for Fried Rice Syndrome (120.00s).
Layers minimal documentary BGM bed + 30 frame-locked real acoustic WAV foley cues (ZERO synthetic math tones).
"""
import os, subprocess

ROOT = os.environ.get("PROJECT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
SFX_DIR = os.environ.get("SFX_DIR", os.path.join(ROOT, "assets_sfx"))
if not os.path.isdir(SFX_DIR) and os.path.isdir("/workspaces/fictional-tribble/assets_v10_sfx"):
    SFX_DIR = "/workspaces/fictional-tribble/assets_v10_sfx"

SILENT_MP4 = os.path.join(ROOT, "out", "fried_rice_syndrome_silent.mp4")
FINAL_MP4 = os.path.join(ROOT, "out", "fried_rice_syndrome_final.mp4")
MIX_WAV = os.path.join(ROOT, "out", "mix_master.wav")
AUDIT_JPG = os.path.join(ROOT, "out", "audit_36.jpg")

CUES = [
    (0.05,   "shutter_dslr_snap.wav",    0.36),  # S01 kitchen intro
    (3.80,   "whoosh_silk_air.wav",      0.38),  # S02 wok toss
    (6.95,   "click_mouse_crisp.wav",    0.42),  # S03 2008 flip-board
    (7.60,   "marker_stroke_draw.wav",   0.44),  # S03 journal highlight
    (10.20,  "clock_tick_tock.wav",      0.42),  # S04 10 hours alarm clock
    (13.40,  "paper_fan_flutter.wav",    0.36),  # S05 bottle
    (14.80,  "marker_stroke_draw.wav",   0.46),  # S05 NOT POISON slash
    (16.60,  "sub_bass_thud.wav",        0.48),  # S06 Fried Rice Syndrome reveal
    (19.60,  "paper_fan_flutter.wav",    0.35),  # S07 sticky note
    (21.15,  "stamp_thump_heavy.wav",    0.52),  # S07 COMPLETELY FALSE stamp
    (22.80,  "whoosh_whip_fast.wav",     0.40),  # S08 Bacillus cereus
    (26.00,  "paper_fan_flutter.wav",    0.34),  # S09 rice paddy soil
    (32.60,  "ref_alpha_thud_01.wav",    0.42),  # S11 armored endospore
    (36.20,  "click_mouse_crisp.wav",    0.40),  # S12 100C boil flip
    (40.55,  "stamp_thump_heavy.wav",    0.46),  # S13 endospore cracks open
    (43.20,  "clock_tick_tock.wav",      0.42),  # S14 hours on counter
    (46.80,  "riser_warm_swell.wav",     0.38),  # S15 4-60C danger zone
    (50.60,  "pop_double_stack.wav",     0.40),  # S16 doubling colony
    (54.40,  "shutter_metal_roll.wav",   0.42),  # S17 1,000,000 flip odometer
    (61.00,  "sub_bass_thud.wav",        0.52),  # S19 Cereulide hero ring
    (65.20,  "whoosh_deep_velvet.wav",   0.44),  # S20 121C flame blast
    (68.80,  "shutter_dslr_snap.wav",    0.36),  # S21 split pedestals
    (75.40,  "whoosh_whip_fast.wav",     0.42),  # S23 bloodstream Y-artery
    (79.20,  "ref_alpha_thud_01.wav",    0.42),  # S24 mitochondria reveal
    (84.85,  "stamp_thump_heavy.wav",    0.50),  # S25 potassium collapse
    (87.20,  "clock_tick_tock.wav",      0.42),  # S26 1-5 hours watch
    (90.40,  "sub_bass_thud.wav",        0.48),  # S27 acute liver failure
    (96.80,  "paper_fan_flutter.wav",    0.38),  # S29 3 simple rules clipboard
    (103.20, "metallic_chime_bell.wav",  0.34),  # S31 cool fridge safe
    (111.40, "stamp_thump_heavy.wav",    0.50),  # S33 THROW IT OUT stamp
]

def main():
    os.makedirs(os.path.dirname(MIX_WAV), exist_ok=True)
    bgm = os.path.join(SFX_DIR, "bgm_swiss_dark_pulse_loop.wav")
    assert os.path.isfile(bgm), f"Missing BGM WAV: {bgm}"

    inputs = ["-stream_loop", "-1", "-t", "120.0", "-i", bgm]
    filter_parts = ["[0:a]volume=-7.5dB,afade=t=in:st=0:d=0.8,afade=t=out:st=118.0:d=2.0[bgm]"]
    mix_labels = ["[bgm]"]

    idx = 1
    applied = 0
    for t_sec, fname, gain in CUES:
        p = os.path.join(SFX_DIR, fname)
        if not os.path.isfile(p):
            print(f"WARN missing cue: {p}")
            continue
        ms = int(round(t_sec * 1000))
        inputs.extend(["-i", p])
        filter_parts.append(f"[{idx}:a]volume={gain:.2f},adelay={ms}|{ms}[s{idx}]")
        mix_labels.append(f"[s{idx}]")
        idx += 1
        applied += 1

    print(f"Mixing BGM + {applied}/{len(CUES)} real acoustic WAV foley cues...")
    filter_parts.append(f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=first:normalize=0,loudnorm=I=-14.2:TP=-1.0:LRA=7[aout]")
    fc = ";".join(filter_parts)

    subprocess.run([
        "ffmpeg", "-nostdin", "-y", *inputs,
        "-filter_complex", fc, "-map", "[aout]",
        "-t", "120.0", "-ar", "48000", "-ac", "2", MIX_WAV
    ], check=True)

    subprocess.run([
        "ffmpeg", "-nostdin", "-y",
        "-i", SILENT_MP4, "-i", MIX_WAV,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", FINAL_MP4
    ], check=True)

    import cv2
    from PIL import Image, ImageDraw
    cap = cv2.VideoCapture(FINAL_MP4)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cols, rows, tw, th = 6, 6, 320, 568
    sheet = Image.new("RGB", (cols * tw, rows * th), (12, 12, 15))
    d = ImageDraw.Draw(sheet)
    for k in range(36):
        f_idx = min(total - 1, int(round(k * (total - 1) / 35)))
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
        ok, fr = cap.read()
        if not ok:
            continue
        im = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)).resize((tw, th), Image.Resampling.LANCZOS)
        x, y = (k % cols) * tw, (k // cols) * th
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 130, y + 22], fill=(0, 0, 0))
        d.text((x + 5, y + 4), f"f{f_idx} | {f_idx/30.0:.1f}s", fill=(255, 225, 110))
    cap.release()
    sheet.save(AUDIT_JPG, quality=90)
    os.remove(MIX_WAV)
    print("FINAL VERIFIED DELIVERABLES:", FINAL_MP4, AUDIT_JPG)

if __name__ == "__main__":
    main()
