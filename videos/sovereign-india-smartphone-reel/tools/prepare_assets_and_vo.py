#!/usr/bin/env python3
"""
tools/prepare_assets_and_vo.py (v2.0 — ZERO AI VOICEOVER + REAL CLIPS UNPACKER)
1. Downloads Google Fonts (Instrument Serif Regular/Italic + Plus Jakarta Sans Variable).
2. Builds Official Complete Sovereign India + World Countries GeoJSON.
3. Unpacks real internet video clips (clips/*.mp4) into 15fps deterministic JPEG sequences
   (clips_frames/<name>/f_%03d.jpg) and writes data/clips_manifest.json + data/vo_timeline.json.
"""

import json
import os
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parent.parent))
FONTS_DIR = ROOT / "fonts"
DATA_DIR = ROOT / "data"
CLIPS_IN_DIR = ROOT / "clips"
CLIPS_FRAMES_DIR = ROOT / "clips_frames"
OUT_DIR = ROOT / "out"

for d in (FONTS_DIR, DATA_DIR, CLIPS_FRAMES_DIR, OUT_DIR):
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
        print(f"[fonts] Ready: {fname}")


def build_sovereign_world_india_geo():
    out_geo = DATA_DIR / "world_india_geo.json"
    if out_geo.exists() and out_geo.stat().st_size > 50_000:
        print("[geo] Cached world_india_geo.json ready.")
        return

    ne_url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    ne_path = DATA_DIR / "ne_110m_countries.geojson"
    download_file(ne_url, ne_path)
    ne_data = json.loads(ne_path.read_text(encoding="utf-8"))

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
        if iso == "ATA":
            continue
        world_features.append({
            "iso": iso,
            "name": name,
            "geometry": compact_geom(geom, step=0.12),
        })

    final_india = compact_geom(india_geom if india_geom else fallback_india, step=0.05)
    payload = {
        "worldFeatures": world_features,
        "indiaFeature": {"iso": "IND", "name": "India", "geometry": final_india},
    }
    out_geo.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"[geo] Wrote world_india_geo.json ({len(world_features)} countries + Sovereign India)")


def unpack_real_video_clips():
    manifest = {}
    if CLIPS_IN_DIR.exists():
        for mp4 in sorted(CLIPS_IN_DIR.glob("*.mp4")):
            name = mp4.stem
            cdir = CLIPS_FRAMES_DIR / name
            cdir.mkdir(parents=True, exist_ok=True)
            subprocess.run([
                "ffmpeg", "-nostdin", "-y", "-i", str(mp4),
                "-vf", "fps=15,scale=640:360",
                "-q:v", "3",
                str(cdir / "f_%03d.jpg")
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            cnt = len(list(cdir.glob("f_*.jpg")))
            manifest[name] = {"count": cnt, "fps": 15}
            print(f"[clips] Unpacked {name}.mp4 -> {cnt} frames")

    (DATA_DIR / "clips_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def write_deterministic_timeline():
    script = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
    tl = {
        "fps": script["fps"],
        "totalFrames": script["totalFrames"],
        "totalDurationSec": script["totalDurationSec"],
        "scenes": [
            {
                "id": sc["id"],
                "index": i,
                "startSec": sc["startSec"],
                "endSec": sc["endSec"],
            }
            for i, sc in enumerate(script["scenes"])
        ],
    }
    (DATA_DIR / "vo_timeline.json").write_text(json.dumps(tl, indent=2), encoding="utf-8")
    print(f"[timeline] Deterministic {tl['totalDurationSec']}s ({tl['totalFrames']} frames) ready — ZERO AI TTS.")


if __name__ == "__main__":
    ensure_fonts()
    build_sovereign_world_india_geo()
    unpack_real_video_clips()
    write_deterministic_timeline()
