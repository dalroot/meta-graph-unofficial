import fs from 'fs';
import path from 'path';

export const DownloadMixin = {
  async getReelsTray() {
    const url = 'https://www.instagram.com/api/v1/feed/reels_tray/';
    const res = await this.http.request(url, {
      method: 'GET',
      headers: this.getHeaders('https://www.instagram.com/')
    });

    if (res.status !== 200 || !res.data) {
      throw new Error(`Failed to fetch reels tray: HTTP ${res.status}`);
    }

    const tray = res.data.tray || [];
    return tray.map(item => ({
      userId: item.user?.pk || item.id,
      username: item.user?.username,
      items: (item.items || []).map(story => ({
        id: story.id,
        mediaType: story.media_type, // 1 = Photo, 2 = Video
        takenAt: story.taken_at,
        expiringAt: story.expiring_at,
        imageUrl: story.image_versions2?.candidates?.[0]?.url,
        videoUrl: story.video_versions?.[0]?.url
      }))
    }));
  },

  async downloadMediaUrl(mediaUrl, outputPath) {
    if (!mediaUrl) throw new Error('mediaUrl is required for download');
    const res = await fetch(mediaUrl);
    if (!res.ok) {
      throw new Error(`Failed to download media file: HTTP ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    return {
      outputPath,
      bytes: buffer.length,
      contentType: res.headers.get('content-type')
    };
  }
};
