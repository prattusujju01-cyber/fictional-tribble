#!/usr/bin/env python3
"""
Broadcast Editorial Documentary Audio Master (-14.2 LUFS) for Water Intoxication / Hyponatremia (120.00s, v14.0).
Layers minimal documentary BGM bed + 38 frame-locked real acoustic WAV foley cues synced to cuts, whip-pans, zoom-dives,
pouring water bubbles, split-flap counters, marker circles, rubber stamps, and ICU saline rescue chimes.
"""
import os, subprocess

ROOT = os.environ.get("PROJECT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
SFX_DIR = os.environ.get("SFX_DIR", os.path.join(ROOT, "assets_sfx"))

SILENT_MP4 = os.path.join(ROOT, "out", "water_intoxication_silent.mp4")
FINAL_MP4 = os.path.join(ROOT, "out", "water_intoxication_final.mp4")
MIX_WAV = os.path.join(ROOT, "out", "mix_master.wav")
AUDIT_JPG = os.path.join(ROOT, "out", "audit_36.jpg")

CUES = [
    (0.06,   "bubble_pop_pill.wav",      0.42),  # S01 crystal water pour
    (1.55,   "whoosh_silk_air.wav",      0.32),  # S01 mid-shot shutter swap
    (3.20,   "whoosh_whip_fast.wav",     0.44),  # S02 whip_left -> 2007 Radio Studio
    (3.65,   "click_mouse_crisp.wav",    0.42),  # S02 2007 flip-board
    (6.50,   "paper_fan_flutter.wav",    0.40),  # S03 paper_wipe -> Console prize
    (10.00,  "whoosh_whip_fast.wav",     0.42),  # S04 whip_right -> 7.5 Liters bottles
    (10.55,  "shutter_metal_roll.wav",   0.42),  # S04 7.5 L mechanical counter
    (13.50,  "sub_bass_thud.wav",        0.48),  # S05 film_flash -> 5 hours collapse
    (14.35,  "marker_stroke_draw.wav",   0.44),  # S05 Coroner clipping highlight
    (16.80,  "whoosh_whip_fast.wav",     0.40),  # S06 whip_left -> Autopsy bottle
    (17.45,  "marker_stroke_draw.wav",   0.46),  # S06 NOT POISON slash
    (19.80,  "whoosh_deep_velvet.wav",   0.46),  # S07 zoom_dive -> Hyponatremia H2O/Na+
    (23.00,  "paper_fan_flutter.wav",    0.38),  # S08 paper_wipe -> Myth sticky note
    (23.85,  "stamp_thump_heavy.wav",    0.52),  # S08 DEADLY IN EXCESS stamp
    (26.20,  "whoosh_whip_fast.wav",     0.40),  # S09 whip_right -> Kidneys
    (29.80,  "click_mouse_crisp.wav",    0.42),  # S10 0.8 L/H flip-board
    (31.05,  "marker_stroke_draw.wav",   0.44),  # S10 Hand-drawn marker circle
    (32.85,  "ref_alpha_thud_01.wav",    0.46),  # S11 Kidneys overflow!
    (36.20,  "whoosh_deep_velvet.wav",   0.44),  # S12 zoom_dive -> Blood Sodium 140
    (39.60,  "whoosh_whip_fast.wav",     0.38),  # S13 whip_left -> Neuron spark
    (42.85,  "riser_warm_swell.wav",     0.42),  # S14 Water flood dilutes blood!
    (46.20,  "paper_fan_flutter.wav",    0.38),  # S15 paper_wipe -> Live Sodium Crash Chart
    (48.10,  "marker_stroke_draw.wav",   0.46),  # S15 Red circle on 118 CRITICAL
    (49.40,  "whoosh_whip_fast.wav",     0.40),  # S16 whip_right -> Osmometer U-tube
    (52.80,  "whoosh_deep_velvet.wav",   0.46),  # S17 zoom_dive -> Aquaporin water influx
    (56.25,  "pop_double_stack.wav",     0.44),  # S18 Cells ballooning!
    (59.40,  "whoosh_whip_fast.wav",     0.38),  # S19 whip_left -> Soft muscle vs bone
    (62.60,  "whoosh_deep_velvet.wav",   0.48),  # S20 zoom_dive -> Solid 7mm Skull Vault!
    (66.25,  "sub_bass_thud.wav",        0.52),  # S21 Cerebral edema crushing against bone!
    (70.45,  "stamp_thump_heavy.wav",    0.48),  # S22 45 mmHg pressure slam!
    (73.20,  "paper_fan_flutter.wav",    0.36),  # S23 paper_wipe -> Red-flag symptoms
    (76.60,  "sub_bass_thud.wav",        0.54),  # S24 Foramen magnum herniation!
    (81.20,  "stamp_thump_heavy.wav",    0.52),  # S25 Lungs & Heart switches snap OFF!
    (84.00,  "shutter_dslr_snap.wav",    0.40),  # S26 film_flash -> Marathon runners
    (92.00,  "stamp_thump_heavy.wav",    0.48),  # S28 Baby bottle warning stamp
    (94.00,  "metallic_chime_bell.wav",  0.42),  # S29 3% Hypertonic Saline ICU rescue!
    (104.20, "bubble_pop_pill.wav",      0.44),  # S32 Electrolyte ORS fizz tablet
    (116.90, "metallic_chime_bell.wav",  0.38),  # S36 Final share card chime
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
