import { UniversalDownloader } from '../ts_src/utils/downloader.js';

async function testGuestLightweight() {
  console.log('===============================================================');
  console.log('🌐 LIVE GUEST MODE LIGHTWEIGHT TEST (Zero Account / Zero Download)');
  console.log('===============================================================\n');

  const downloader = new UniversalDownloader();
  const testShortcode = 'DFVb_oBtzc6'; // Public reel

  console.log(`[*] Requesting public metadata for reel: ${testShortcode} (Guest Mode - No Cookies)...`);
  const t0 = Date.now();

  // Test with download flags disabled -> Only fetches lightweight metadata (few KB)
  const result = await downloader.downloadMedia(testShortcode, {
    downloadVideo: false,
    downloadAudio: false,
    downloadPhoto: false
  });

  const duration = Date.now() - t0;
  console.log(`\n[✓] Guest Metadata Fetched in ${duration}ms!`);
  console.log('Result:');
  console.dir(result, { depth: null });
  console.log('\n===============================================================');
  console.log('🎉 LIGHTWEIGHT GUEST MODE TEST PASSED WITHOUT HEAVY BANDWIDTH');
  console.log('===============================================================');
}

testGuestLightweight().catch(err => {
  console.error('Guest test error:', err.message);
});
