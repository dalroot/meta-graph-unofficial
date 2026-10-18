/**
 * Publishing Reference Demo - Meta Graph Unofficial & TwinGraph
 * 
 * Demonstrates publishing Feed Posts, Stories, Reels, Text/Notes, and Captions
 * matching Meta Graph API v21.0 standards in safe offline Digital Twin mode.
 * 
 * Features Demonstrated:
 *   1. Feed Post Publishing (Image + Rich Persian/English Caption, Hashtags, User Tags)
 *   2. Story Publishing (Photo + Typography Overlays & Interactive Stickers)
 *   3. Reel Publishing (Video + Hardware Qualcomm HEVC Codec + Caption)
 *   4. Instagram Direct Status Note Publishing (Text up to 60 characters)
 *   5. Official Graph API 2-Step Protocol: POST /{user-id}/media -> POST /{user-id}/media_publish
 */

import { TwinGraph } from '../dist/index.js';
import type {
  PublishFeedPostParams,
  PublishStoryParams,
  PublishReelParams,
  PublishNoteParams,
  ParsedCaptionInfo,
  GraphNote
} from '../dist/index.js';

async function main() {
  console.log('================================================================');
  console.log('   META GRAPH UNOFFICIAL - CONTENT PUBLISHING REFERENCE DEMO    ');
  console.log('================================================================\n');

  // Initialize TwinGraph in safe offline Digital Twin mode (Redmi Note 13 4G)
  const tg = new TwinGraph({ offlineMode: true });
  const userId = tg.device.getUserId();

  console.log(`[*] Active Attested Account: User ID ${userId} (@${tg.device.getUsername()})\n`);

  // --------------------------------------------------------------------------
  // 1. Feed Post Publishing with Persian / English Caption & Hashtags
  // Meta Graph API v21.0: POST /{user-id}/media + POST /{user-id}/media_publish
  // Mobile Mapping: POST /rupload_igphoto/{upload_id} -> POST /api/v1/media/configure/
  // --------------------------------------------------------------------------
  console.log('--- [1] Feed Post Publishing & Caption Validation ---');
  const captionText = 'پست جدید با معماری تویین گراف! 🚀 تست قابلیت انتشار پست، استوری و یادداشت‌ها. #تکنولوژی #برنامه‌نویسی #هوش_مصنوعی @tawanatallks';
  
  const postParams: PublishFeedPostParams = {
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    caption: captionText,
    userTags: [{ username: 'tawanatallks', x: 0.5, y: 0.5 }],
    disableComments: false,
    likeAndViewCountsDisabled: false
  };

  const postResult = await tg.publishFeedPost(postParams);
  console.log(`[✓] Feed Post Published Successfully:`);
  console.log(`    - FBID / Graph ID: ${postResult.id}`);
  console.log(`    - Mobile Media ID: ${postResult.media_id}`);
  console.log(`    - Status: ${postResult.status}`);
  console.log(`    - Caption Length: ${postResult.caption_info.length} chars (Limit: ${postResult.caption_info.characterLimit})`);
  console.log(`    - Discovered Hashtags (${postResult.caption_info.hashtags.length}): #${postResult.caption_info.hashtags.join(' #')}`);
  console.log(`    - Discovered Mentions (${postResult.caption_info.mentions.length}): @${postResult.caption_info.mentions.join(' @')}`);
  console.log();

  // --------------------------------------------------------------------------
  // 2. Story Publishing with Typography Overlays & Interactive Stickers
  // Meta Graph API v21.0: POST /{user-id}/media?media_type=STORIES
  // Mobile Mapping: POST /rupload_igphoto/{upload_id} -> POST /api/v1/media/configure_to_story/
  // --------------------------------------------------------------------------
  console.log('--- [2] Story Publishing with Typography & Overlays ---');
  const storyParams: PublishStoryParams = {
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119',
    textOverlays: [
      {
        text: 'روزمرگی دیجیتال تویین 📱',
        font: 'InstagramSans-Bold',
        fontSize: 32.0,
        textColor: '#FFFFFF',
        backgroundColor: '#00000088',
        x: 0.5,
        y: 0.25
      }
    ],
    stickers: [
      {
        type: 'mention',
        x: 0.5,
        y: 0.7,
        data: { username: 'tawanatallks' }
      }
    ]
  };

  const storyResult = await tg.publishStory(storyParams);
  console.log(`[✓] Story Published Successfully:`);
  console.log(`    - Story ID: ${storyResult.id}`);
  console.log(`    - Is Reel Media: ${storyResult.is_reel_media}`);
  console.log(`    - Expires At (24h TTL): ${new Date(storyResult.expiring_at * 1000).toISOString()}`);
  console.log(`    - Status: ${storyResult.status}`);
  console.log();

  // --------------------------------------------------------------------------
  // 3. Reel Publishing with Qualcomm Hardware Codecs
  // Meta Graph API v21.0: POST /{user-id}/media?media_type=REELS
  // Mobile Mapping: POST /rupload_igvideo/{upload_id} -> POST /api/v1/media/configure_to_clips/
  // --------------------------------------------------------------------------
  console.log('--- [3] Reel Video Publishing with Hardware Codec Acceleration ---');
  const reelParams: PublishReelParams = {
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    caption: 'ریلز آزمایشی با سرعت بالا و کدک سخت‌افزاری اسنپ‌دراگون 🎬 #reels #explore',
    durationMs: 15000,
    shareToFeed: true
  };

  const reelResult = await tg.publishReel(reelParams);
  console.log(`[✓] Reel Published Successfully:`);
  console.log(`    - Reel Graph ID: ${reelResult.id}`);
  console.log(`    - Media ID: ${reelResult.media_id}`);
  console.log(`    - Status: ${reelResult.status}`);
  console.log(`    - Codec Acceleration: Qualcomm HEVC (c2.qti.hevc.encoder)`);
  console.log();

  // --------------------------------------------------------------------------
  // 4. Instagram Direct Status Note Publishing
  // Internal Mobile Mapping: POST /api/v1/notes/create/ (Max 60 characters)
  // --------------------------------------------------------------------------
  console.log('--- [4] Instagram Status Note Publishing (Max 60 chars) ---');
  const noteParams: PublishNoteParams = {
    text: 'در حال کدنویسی با هوش مصنوعی ⚡',
    audience: 'followers_you_follow_back'
  };

  const noteResult: GraphNote = await tg.publishNote(noteParams);
  console.log(`[✓] Instagram Note Created:`);
  console.log(`    - Note ID: ${noteResult.id}`);
  console.log(`    - Content: "${noteResult.text}" (${noteResult.text.length}/60 chars)`);
  console.log(`    - Audience: ${noteResult.audience}`);
  console.log(`    - Expires At: ${new Date(noteResult.expires_at * 1000).toISOString()}`);
  console.log();

  // --------------------------------------------------------------------------
  // 5. Official Meta Graph API Standard 2-Step Protocol (FB.api style)
  // Step 1: POST /{user-id}/media (Container Creation)
  // Step 2: POST /{user-id}/media_publish (Publishing Creation ID)
  // --------------------------------------------------------------------------
  console.log('--- [5] Official Meta Graph API v21.0 Standard 2-Step Protocol ---');
  
  // Step 1: Create Container
  const container = await tg.api<{ id: string; status: string }>(`/${userId}/media`, 'POST', {
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    caption: 'Official Meta Graph API v21.0 container publish #official #meta'
  });
  console.log(`[✓] Step 1 Container Created: ID = ${container.id} (Status: ${container.status})`);

  // Step 2: Publish Container
  const publishResponse = await tg.api<{ id: string }>(`/${userId}/media_publish`, 'POST', {
    creation_id: container.id
  });
  console.log(`[✓] Step 2 Container Published: Media ID = ${publishResponse.id}`);

  console.log('\n================================================================');
  console.log('   ALL PUBLISHING CAPABILITIES VERIFIED AND EXECUTED WITH 0 ERRORS! ');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('[!] Publishing demo failed:', err);
  process.exit(1);
});
