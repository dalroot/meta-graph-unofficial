/**
 * Universal Media & Audio Downloader Utility
 *
 * Directly embedded into TwinGraph SDK for 100% native execution.
 */
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
export declare class UniversalDownloader {
    private transport;
    private downloadsDir;
    constructor(downloadsDir?: string, proxyUrl?: string);
    extractShortcode(input: string): string;
    downloadMedia(shortcodeOrUrl: string, options?: {
        downloadVideo?: boolean;
        downloadAudio?: boolean;
        downloadPhoto?: boolean;
        outputDir?: string;
    }): Promise<MediaDownloadResult>;
}
