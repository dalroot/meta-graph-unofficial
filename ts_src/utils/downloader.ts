/**
 * Universal Media & Audio Downloader Utility
 * 
 * Directly embedded into TwinGraph SDK for 100% native execution.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { TwinTransport } from '../twins/transport.js';

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

  constructor(downloadsDir?: string) {
    this.transport = new TwinTransport();
    this.downloadsDir = downloadsDir || path.resolve(process.cwd(), 'scratch/downloads');
    if (!fs.existsSync(this.downloadsDir)) {
      try {
        fs.mkdirSync(this.downloadsDir, { recursive: true });
      } catch {}
    }
  }

  public extractShortcode(input: string): string {
    const clean = input.trim();
    const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i;
    const match = clean.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return clean;
  }

  public async downloadMedia(
    shortcodeOrUrl: string,
    options: {
      downloadVideo?: boolean;
      downloadAudio?: boolean;
      downloadPhoto?: boolean;
      outputDir?: string;
    } = {
      downloadVideo: true,
      downloadAudio: true,
      downloadPhoto: true
    }
  ): Promise<MediaDownloadResult> {
    const shortcode = this.extractShortcode(shortcodeOrUrl);
    const targetDir = options.outputDir || this.downloadsDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const reelUrl = `https://www.instagram.com/reel/${shortcode}/`;
    const response = await this.transport.request(reelUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459'
      }
    });

    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    let videoUrl: string | null = null;
    let photoUrl: string | null = null;

    const videoMatch = html.match(/"video_versions":\s*(\[[^\]]+\])/);
    if (videoMatch) {
      try {
        const versions = JSON.parse(videoMatch[1]);
        if (Array.isArray(versions) && versions.length > 0) {
          versions.sort((a: any, b: any) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
          videoUrl = versions[0].url;
        }
      } catch {}
    }

    if (!videoUrl) {
      const ogVideoMatch = html.match(/<meta property="og:video" content="([^"]*)"/i);
      if (ogVideoMatch) {
        videoUrl = ogVideoMatch[1].replace(/&amp;/g, '&');
      }
    }

    const candsMatch = html.match(/"candidates":\s*(\[[^\]]+\])/);
    if (candsMatch) {
      try {
        const cands = JSON.parse(candsMatch[1]);
        if (Array.isArray(cands) && cands.length > 0) {
          cands.sort((a: any, b: any) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
          photoUrl = cands[0].url;
        }
      } catch {}
    }

    if (!photoUrl) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"/i);
      if (ogImageMatch) {
        photoUrl = ogImageMatch[1].replace(/&amp;/g, '&');
      }
    }

    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/i);
    const title = titleMatch ? titleMatch[1] : undefined;

    const result: MediaDownloadResult = {
      shortcode,
      mediaType: videoUrl ? 'video' : 'photo',
      title,
      extractedAt: new Date().toISOString()
    };

    if (options.downloadVideo && videoUrl) {
      const videoFile = path.join(targetDir, `${shortcode}_video.mp4`);
      await this.transport.downloadToFile(videoUrl, videoFile);
      result.videoPath = videoFile;
      result.videoBytes = fs.statSync(videoFile).size;

      if (options.downloadAudio) {
        try {
          const audioFile = path.join(targetDir, `${shortcode}_audio.mp3`);
          execSync(`ffmpeg -y -i "${videoFile}" -vn -c:a libmp3lame -q:a 2 "${audioFile}"`, { stdio: 'ignore' });
          if (fs.existsSync(audioFile)) {
            result.audioPath = audioFile;
            result.audioBytes = fs.statSync(audioFile).size;
          }
        } catch {}
      }
    }

    if (options.downloadPhoto && photoUrl) {
      const photoFile = path.join(targetDir, `${shortcode}_cover.jpg`);
      await this.transport.downloadToFile(photoUrl, photoFile);
      result.photoPath = photoFile;
      result.photoBytes = fs.statSync(photoFile).size;
    }

    return result;
  }
}
