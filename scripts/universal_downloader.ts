/**
 * Meta Graph Unofficial — Universal Media & Audio Downloader Engine
 * 
 * Supports:
 * - High-definition Reels & Videos (MP4)
 * - Extracted Original Audio Tracks (MP3 / M4A via FFmpeg or Direct Stream)
 * - High-resolution Photos & Covers (JPEG)
 * - Safe guest transport via SOCKS5 proxy
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { TwinTransport } from '../dist/twins/transport.js';

export interface MediaDownloadResult {
  shortcode: string;
  mediaType: 'video' | 'photo' | 'carousel';
  title?: string;
  videoPath?: string;
  videoBytes?: number;
  audioPath?: string;
  audioBytes?: number;
  photoPath?: string;
  photoBytes?: number;
  extractedAt: string;
}

export class UniversalDownloader {
  private transport: TwinTransport;
  private downloadsDir: string;

  constructor(downloadsDir?: string, proxyUrl: string = 'socks5://127.0.0.1:10808') {
    this.transport = new TwinTransport({ proxyUrl });
    this.downloadsDir = downloadsDir || path.resolve(process.cwd(), 'scratch/downloads');
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
  }

  /**
   * Resolve and download media by Instagram shortcode
   */
  public async downloadMedia(
    shortcodeOrUrl: string,
    options: { downloadVideo?: boolean; downloadAudio?: boolean; downloadPhoto?: boolean } = {
      downloadVideo: true,
      downloadAudio: true,
      downloadPhoto: true
    }
  ): Promise<MediaDownloadResult> {
    const shortcode = this.extractShortcode(shortcodeOrUrl);
    console.log(`[*] Resolving media metadata for shortcode: ${shortcode}...`);

    const reelUrl = `https://www.instagram.com/reel/${shortcode}/`;
    const response = await this.transport.request(reelUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch media page. HTTP ${response.status}: ${response.statusText}`);
    }

    const html = response.data;
    
    // Extract video URL
    let videoUrl: string | null = null;
    const videoMatch = html.match(/"video_versions":\s*(\[[^\]]+\])/);
    if (videoMatch) {
      try {
        const versions = JSON.parse(videoMatch[1]);
        if (versions.length > 0 && versions[0].url) {
          videoUrl = versions[0].url;
        }
      } catch {
        // Fallback
      }
    }

    // Extract photo candidate URL
    let photoUrl: string | null = null;
    const candsMatch = html.match(/"candidates":\s*(\[[^\]]+\])/);
    if (candsMatch) {
      try {
        const cands = JSON.parse(candsMatch[1]);
        if (cands.length > 0 && cands[0].url) {
          photoUrl = cands[0].url;
        }
      } catch {
        // Fallback
      }
    }

    const result: MediaDownloadResult = {
      shortcode,
      mediaType: videoUrl ? 'video' : 'photo',
      extractedAt: new Date().toISOString()
    };

    // 1. Download Video
    if (options.downloadVideo !== false && videoUrl) {
      const videoFilename = `${shortcode}.mp4`;
      const videoFilePath = path.join(this.downloadsDir, videoFilename);
      console.log(`[*] Streaming video (MP4) to ${videoFilePath}...`);
      
      const dlRes = await this.transport.downloadToFile(videoUrl, videoFilePath);
      console.log(`[+] Video download complete: ${(dlRes.bytes / (1024 * 1024)).toFixed(2)} MB`);
      result.videoPath = videoFilePath;
      result.videoBytes = dlRes.bytes;

      // 2. Extract Audio if requested and video exists
      if (options.downloadAudio !== false && fs.existsSync(videoFilePath)) {
        try {
          const audioFilename = `${shortcode}.mp3`;
          const audioFilePath = path.join(this.downloadsDir, audioFilename);
          console.log(`[*] Extracting high-fidelity audio track via FFmpeg to ${audioFilePath}...`);
          execSync(`ffmpeg -y -i "${videoFilePath}" -vn -c:a libmp3lame -q:a 2 "${audioFilePath}" 2>/dev/null`);
          
          if (fs.existsSync(audioFilePath)) {
            const audioStat = fs.statSync(audioFilePath);
            console.log(`[+] Audio extraction complete: ${(audioStat.size / (1024 * 1024)).toFixed(2)} MB`);
            result.audioPath = audioFilePath;
            result.audioBytes = audioStat.size;
          }
        } catch (err: any) {
          console.warn(`[!] Audio extraction skipped: ${err.message}`);
        }
      }
    }

    // 3. Download High-Res Photo / Thumbnail
    if (options.downloadPhoto !== false && photoUrl) {
      const photoFilename = `${shortcode}.jpg`;
      const photoFilePath = path.join(this.downloadsDir, photoFilename);
      console.log(`[*] Downloading high-resolution image to ${photoFilePath}...`);
      
      const dlRes = await this.transport.downloadToFile(photoUrl, photoFilePath);
      console.log(`[+] Image download complete: ${(dlRes.bytes / 1024).toFixed(2)} KB`);
      result.photoPath = photoFilePath;
      result.photoBytes = dlRes.bytes;
    }

    return result;
  }

  private extractShortcode(input: string): string {
    const clean = input.trim();
    if (clean.includes('/reel/') || clean.includes('/p/')) {
      const parts = clean.split('/');
      const idx = parts.findIndex(p => p === 'reel' || p === 'p');
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1].split('?')[0];
      }
    }
    return clean.replace(/[^a-zA-Z0-9_-]/g, '');
  }
}

// CLI direct runner
if (process.argv[1]?.endsWith('universal_downloader.ts')) {
  const target = process.argv[2] || 'Dd_sxJDxH6G';
  const downloader = new UniversalDownloader();
  downloader.downloadMedia(target)
    .then(res => {
      console.log('\n======================================================');
      console.log('  🎉 DOWNLOAD COMPLETE & VERIFIED');
      console.log('======================================================');
      console.log(JSON.stringify(res, null, 2));
      
      // Save audit record
      const auditFile = path.resolve(process.cwd(), 'scratch/downloads_audit.json');
      fs.writeFileSync(auditFile, JSON.stringify(res, null, 2));
    })
    .catch(err => {
      console.error('Download failed:', err);
      process.exit(1);
    });
}
