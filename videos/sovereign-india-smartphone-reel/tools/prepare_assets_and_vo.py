#!/usr/bin/env python3
"""
tools/prepare_assets_and_vo.py
1. Fetches Google Fonts (Instrument Serif Regular/Italic + Plus Jakarta Sans Variable).
2. Compiles World Countries + Official Complete Sovereign India Boundary GeoJSON.
3. Synthesizes 12 scenes via Edge-TTS (en-GB-RyanNeural) with WordBoundary timestamps,
   stitches 48kHz vo.wav, and writes deterministic data/vo_timeline.json.
"""

import asyncio
import json
import math
import os
import subprocess
import urllib.request
from pathlib import Path

import edge_tts

ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parent.parent))
FONTS_DIR = ROOT / "fonts"
DATA_DIR = ROOT / "data"
OUT_DIR = ROOT / "out"
TMP_VO_DIR = OUT_DIR / "vo_parts"

for d in (FONTS_DIR, DATA_DIR, OUT_DIR, TMP_VO_DIR):
    d.mkdir(parents=True, exist_ok=True)


def download_file(url: str, dest: Path):
    if dest.exists() and dest.stat().st_size > 1000:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        dest.write_bytes(resp.read())


def ensure_fonts():
    fonts = {
        "InstrumentSerif-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf",
        "InstrumentSerif-Italic.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf",
        "PlusJakartaSans-Variable.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf",
    }
    for fname, url in fonts.items():
        download_file(url, FONTS_DIR / fname)
        print(f"[fonts] Ready: {fname} ({(FONTS_DIR / fname).stat().st_size} bytes)")


def build_sovereign_world_india_geo():
    out_geo = DATA_DIR / "world_india_geo.json"
    if out_geo.exists() and out_geo.stat().st_size > 50_000:
        print("[geo] Cached world_india_geo.json ready.")
        return

    # 1. Natural Earth 110m countries GeoJSON (has ISO_A3 / ADM0_A3 properties!)
    ne_url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    ne_path = DATA_DIR / "ne_110m_countries.geojson"
    download_file(ne_url, ne_path)
    ne_data = json.loads(ne_path.read_text(encoding="utf-8"))

    # 2. Official Complete Sovereign India Composite GeoJSON (DataMeet Survey of India composite)
    india_urls = [
        "https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson",
        "https://raw.githubusercontent.com/geohacker/india/master/country/india.geojson",
    ]
    india_geom = None
    for u in india_urls:
        try:
            ip = DATA_DIR / "india_official_raw.geojson"
            if ip.exists():
                ip.unlink()
            download_file(u, ip)
            raw_ind = json.loads(ip.read_text(encoding="utf-8"))
            if raw_ind.get("type") == "FeatureCollection" and raw_ind.get("features"):
                # Merge all features into one MultiPolygon if multiple
                polys = []
                for f in raw_ind["features"]:
                    g = f.get("geometry") or {}
                    if g.get("type") == "Polygon":
                        polys.append(g["coordinates"])
                    elif g.get("type") == "MultiPolygon":
                        polys.extend(g["coordinates"])
                if polys:
                    india_geom = {"type": "MultiPolygon", "coordinates": polys}
                    break
            elif raw_ind.get("type") == "Feature":
                india_geom = raw_ind["geometry"]
                break
        except Exception as exc:
            print(f"[geo] Warning fetching {u}: {exc}")

    def simplify_ring(ring, step=0.08):
        if len(ring) <= 12:
            return [[round(pt[0], 3), round(pt[1], 3)] for pt in ring]
        out = [ring[0]]
        for pt in ring[1:-1]:
            prev = out[-1]
            if abs(pt[0] - prev[0]) + abs(pt[1] - prev[1]) >= step:
                out.append(pt)
        out.append(ring[-1])
        return [[round(pt[0], 3), round(pt[1], 3)] for pt in out]

    def compact_geom(geom, step=0.08):
        if geom["type"] == "Polygon":
            return {
                "type": "Polygon",
                "coordinates": [simplify_ring(r, step) for r in geom["coordinates"] if len(r) >= 4],
            }
        elif geom["type"] == "MultiPolygon":
            polys = []
            for poly in geom["coordinates"]:
                rings = [simplify_ring(r, step) for r in poly if len(r) >= 4]
                if rings:
                    polys.append(rings)
            return {"type": "MultiPolygon", "coordinates": polys}
        return geom

    world_features = []
    fallback_india = None
    for feat in ne_data.get("features", []):
        props = feat.get("properties") or {}
        iso = props.get("ISO_A3") or props.get("ADM0_A3") or ""
        if iso == "-99":
            iso = props.get("ADM0_A3") or props.get("SOV_A3") or ""
        name = props.get("NAME") or props.get("ADMIN") or ""
        geom = feat.get("geometry")
        if not geom:
            continue
        if iso == "IND" or name == "India":
            fallback_india = geom
            continue
        if iso == "ATA":  # skip Antarctica
            continue
        world_features.append({
            "iso": iso,
            "name": name,
            "geometry": compact_geom(geom, step=0.12),
        })

    final_india = compact_geom(india_geom if india_geom else fallback_india, step=0.05)
    payload = {
        "worldFeatures": world_features,
        "indiaFeature": {
            "iso": "IND",
            "name": "India",
            "geometry": final_india,
        },
    }
    out_geo.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"[geo] Wrote world_india_geo.json ({out_geo.stat().st_size // 1024} KB, {len(world_features)} countries + Sovereign India)")


def probe_duration(path: Path) -> float:
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True
    )
    return float(res.stdout.strip())


async def synth_scene(idx: int, scene: dict, voice: str, rate: str):
    raw_mp3 = TMP_VO_DIR / f"s_{idx:02d}_raw.mp3"
    trim_wav = TMP_VO_DIR / f"s_{idx:02d}.wav"

    communicate = edge_tts.Communicate(scene["ttsText"], voice=voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(raw_mp3, "wb") as f_audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f_audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_s = chunk["offset"] / 10_000_000.0
                dur_s = chunk["duration"] / 10_000_000.0
                words.append({
                    "text": chunk["text"],
                    "startRaw": round(start_s, 3),
                    "endRaw": round(start_s + dur_s, 3),
                })

    # Convert to clean 48kHz mono WAV and trim only excessive dead silence (>0.08s) at start/end
    subprocess.run([
        "ffmpeg", "-nostdin", "-y", "-i", str(raw_mp3),
        "-af", "silenceremove=start_periods=1:start_silence=0.06:start_threshold=-46dB,areverse,silenceremove=start_periods=1:start_silence=0.08:start_threshold=-46dB,areverse",
        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le",
        str(trim_wav)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    speech_dur = probe_duration(trim_wav)
    lead_shift = words[0]["startRaw"] if words else 0.0
    norm_words = []
    for w in words:
        st = max(0.0, round(w["startRaw"] - lead_shift + 0.04, 3))
        en = max(st + 0.05, round(w["endRaw"] - lead_shift + 0.04, 3))
        norm_words.append({"text": w["text"], "startLocal": st, "endLocal": en})

    return trim_wav, speech_dur, norm_words


async def build_voiceover_and_timeline():
    script = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
    fps = script.get("fps", 30)
    voice = script.get("voice", "en-GB-RyanNeural")
    rate = script.get("voiceRate", "+5%")

    timeline_scenes = []
    concat_entries = []
    cursor_sec = 0.12  # tiny 120ms opening breath

    # Initial 120ms silence pad
    lead_pad = TMP_VO_DIR / "pad_lead.wav"
    subprocess.run([
        "ffmpeg", "-nostdin", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
        "-t", "0.12", "-c:a", "pcm_s16le", str(lead_pad)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    concat_entries.append(lead_pad)

    for idx, sc in enumerate(script["scenes"]):
        wav_path, speech_dur, words = await synth_scene(idx, sc, voice, rate)
        pause_after = float(sc.get("pauseAfterSec", 0.24))

        pad_wav = TMP_VO_DIR / f"pad_{idx:02d}.wav"
        subprocess.run([
            "ffmpeg", "-nostdin", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
            "-t", f"{pause_after:.3f}", "-c:a", "pcm_s16le", str(pad_wav)
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        start_sec = round(cursor_sec, 4)
        total_scene_dur = speech_dur + pause_after
        end_sec = round(cursor_sec + total_scene_dur, 4)

        timeline_scenes.append({
            "id": sc["id"],
            "index": idx,
            "startSec": start_sec,
            "endSec": end_sec,
            "speechDurSec": round(speech_dur, 4),
            "words": words,
        })
        print(f"[vo] {sc['id']}: {start_sec:.2f}s -> {end_sec:.2f}s ({speech_dur:.2f}s speech, {len(words)} words)")

        concat_entries.append(wav_path)
        concat_entries.append(pad_wav)
        cursor_sec += total_scene_dur

    # Align total duration to exact integer multiple of 12 frames (divisible cleanly across 4 or 6 shards!)
    raw_total_frames = math.ceil(cursor_sec * fps)
    total_frames = int(math.ceil(max(raw_total_frames, 300) / 12.0) * 12)
    exact_total_sec = total_frames / float(fps)
    extra_tail = max(0.05, exact_total_sec - cursor_sec)

    tail_pad = TMP_VO_DIR / "pad_tail.wav"
    subprocess.run([
        "ffmpeg", "-nostdin", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
        "-t", f"{extra_tail:.4f}", "-c:a", "pcm_s16le", str(tail_pad)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    concat_entries.append(tail_pad)
    timeline_scenes[-1]["endSec"] = round(exact_total_sec, 4)

    concat_txt = TMP_VO_DIR / "concat.txt"
    concat_txt.write_text("\n".join(f"file '{p.as_posix()}'" for p in concat_entries) + "\n", encoding="utf-8")

    vo_out = OUT_DIR / "vo.wav"
    subprocess.run([
        "ffmpeg", "-nostdin", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt),
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(vo_out)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    tl_payload = {
        "fps": fps,
        "totalFrames": total_frames,
        "totalDurationSec": round(exact_total_sec, 4),
        "scenes": timeline_scenes,
    }
    (DATA_DIR / "vo_timeline.json").write_text(json.dumps(tl_payload, indent=2), encoding="utf-8")
    print(f"[vo] COMPLETE: totalDuration={exact_total_sec:.2f}s, totalFrames={total_frames}, vo.wav ready.")


if __name__ == "__main__":
    ensure_fonts()
    build_sovereign_world_india_geo()
    asyncio.run(build_voiceover_and_timeline())
