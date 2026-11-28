// engine/video_clips.js (v3.0)
// Deterministic 30fps Real-World Internet Video Clip Bank & Specular Frosted Frame Compositor

import { W, H, roundRectPath } from './camera_v3.js';
import { drawTrackedCaps } from './typography.js';

export class VideoClipBank {
  constructor(manifest = {}) {
    this.manifest = manifest;
    this.frames = {};
  }

  async preloadAll() {
    const tasks = [];
    for (const [name, info] of Object.entries(this.manifest || {})) {
      this.frames[name] = new Array(info.count);
      for (let i = 0; i < info.count; i++) {
        const idxStr = String(i + 1).padStart(3, '0');
        const url = `./clips_frames/${name}/f_${idxStr}.jpg`;
        tasks.push(
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { this.frames[name][i] = img; resolve(); };
            img.onerror = () => resolve();
            img.src = url;
          })
        );
      }
    }
    await Promise.all(tasks);
  }

  getFrame(name, globalFrameIdx) {
    const arr = this.frames[name];
    if (!arr || arr.length === 0) return null;
    const srcIdx = Math.floor(globalFrameIdx * 0.5);
    const cycle = arr.length * 2 - 2;
    if (cycle <= 0) return arr[0];
    const mod = srcIdx % cycle;
    const idx = mod < arr.length ? mod : cycle - mod;
    return arr[idx] || arr[0];
  }

  drawClipCard(ctx, name, globalFrameIdx, x, y, w, h, opts = {}) {
    const {
      radius = 24,
      titleItalic = '',
      tagCaps = '',
      alpha = 1.0,
      zoom = 1.05,
      borderColor = 'rgba(255, 255, 255, 0.76)',
      glowColor = 'rgba(15, 23, 95, 0.55)'
    } = opts;

    if (alpha <= 0.01) return;
    const img = this.getFrame(name, globalFrameIdx);

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.save();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#07103A';
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.clip();

    if (img && img.naturalWidth > 0) {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(w / iw, h / ih) * zoom;
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, x + (w - dw) * 0.5, y + (h - dh) * 0.5, dw, dh);
    }

    if (titleItalic || tagCaps) {
      const scrim = ctx.createLinearGradient(x, y + h * 0.36, x, y + h);
      scrim.addColorStop(0, 'rgba(4, 10, 42, 0.00)');
      scrim.addColorStop(0.65, 'rgba(4, 10, 42, 0.62)');
      scrim.addColorStop(1, 'rgba(4, 10, 42, 0.88)');
      ctx.fillStyle = scrim;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();

    roundRectPath(ctx, x, y, w, h, radius);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    if (titleItalic) {
      ctx.save();
      ctx.font = 'italic 400 40px InstrumentSerif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(titleItalic, x + 22, y + h - 20);
      const tw = ctx.measureText(titleItalic).width;
      if (tagCaps) {
        drawTrackedCaps(ctx, tagCaps, x + 22 + tw + 14, y + h - 28, {
          fontSize: 13.5, tracking: 2.2, color: '#FDE68A', weight: 600
        });
      }
      ctx.restore();
    } else if (tagCaps) {
      drawTrackedCaps(ctx, tagCaps, x + 20, y + h - 24, {
        fontSize: 15, tracking: 2.4, color: '#FFFBEB', weight: 600
      });
    }

    ctx.restore();
  }

  drawFullBleedClip(ctx, name, globalFrameIdx, opts = {}) {
    const {
      alpha = 1.0,
      zoom = 1.08,
      blurPx = 4,
      tintTop = 'rgba(6, 14, 92, 0.68)',
      tintMid = 'rgba(8, 18, 82, 0.45)',
      tintBot = 'rgba(3, 6, 48, 0.86)'
    } = opts;

    if (alpha <= 0.01) return;
    const img = this.getFrame(name, globalFrameIdx);
    if (!img || img.naturalWidth === 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (blurPx > 0.4) ctx.filter = `blur(${blurPx}px)`;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(W / iw, H / ih) * zoom;
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (W - dw) * 0.5, (H - dh) * 0.5, dw, dh);
    ctx.filter = 'none';

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.0, tintTop);
    g.addColorStop(0.5, tintMid);
    g.addColorStop(1.0, tintBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
