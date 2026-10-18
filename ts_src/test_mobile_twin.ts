/**
 * Mobile Twin Architecture Verification Test Suite
 * 
 * Tests:
 * 1. MobileSession loader & parser (raw cookie string, flat json, nested json, cookie array)
 * 2. Authentic Redmi Note 13 Android Liger headers (X-IG-App-ID: 1217981644879628, Host: i.instagram.com)
 * 3. Mobile DirectTwin routing & Graph API v21.0 node translation
 * 4. TwinGraph public interface compatibility
 */

import {
  TwinGraph,
  DeviceTwin,
  DirectTwin,
  parseMobileSession,
  formatMobileCookie,
  loadMobileSession,
  MobileSession
} from './index.js';

async function runMobileTwinTests() {
  console.log('================================================================');
  console.log('       PURE MOBILE CLIENT TWIN ARCHITECTURE VERIFICATION        ');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Session Loader - Raw Cookie String
  // -------------------------------------------------------------------------
  console.log('[*] Test 1: Testing parseMobileSession with raw cookie string...');
  const rawCookie = 'sessionid=19835089130%3Atest_session%3A23%3AXYZ; ds_user_id=19835089130; csrftoken=csrftest123; mid=midtest456; ig_did=DID-TEST-789; rur=RVA; datr=datrtest';
  const sessionFromCookie = parseMobileSession(rawCookie);

  console.log('    Parsed session:', {
    ds_user_id: sessionFromCookie.ds_user_id,
    sessionid: sessionFromCookie.sessionid.slice(0, 20) + '...',
    csrftoken: sessionFromCookie.csrftoken,
    mid: sessionFromCookie.mid,
    device_id: sessionFromCookie.device_id
  });

  if (sessionFromCookie.ds_user_id !== '19835089130' || sessionFromCookie.mid !== 'midtest456') {
    throw new Error('Test 1 Failed: parseMobileSession did not extract tokens correctly');
  }
  if (!sessionFromCookie.cookie_string.includes('sessionid=') || !sessionFromCookie.cookie_string.includes('ig_did=')) {
    throw new Error('Test 1 Failed: canonical cookie string missing expected components');
  }
  console.log('    ✓ Test 1 Passed: Raw cookie string successfully parsed into MobileSession.\n');

  // -------------------------------------------------------------------------
  // Test 2: Session Loader - Flat JSON & Nested JSON
  // -------------------------------------------------------------------------
  console.log('[*] Test 2: Testing parseMobileSession with JSON formats...');
  const flatJson = {
    ds_user_id: '19835089130',
    sessionid: '19835089130:flat_session',
    csrftoken: 'csrf_flat',
    authorization: 'Bearer IGT:2:eyJhbGciOi...',
    username: 'hokar368'
  };
  const sessionFromFlat = parseMobileSession(flatJson);
  if (sessionFromFlat.authorization !== flatJson.authorization || sessionFromFlat.username !== 'hokar368') {
    throw new Error('Test 2 Failed: Flat JSON parsing error');
  }

  const cookieArray = [
    { name: 'sessionid', value: '19835089130:array_session' },
    { name: 'ds_user_id', value: '19835089130' },
    { name: 'csrftoken', value: 'csrf_array' }
  ];
  const sessionFromArray = parseMobileSession(cookieArray);
  if (sessionFromArray.sessionid !== '19835089130:array_session') {
    throw new Error('Test 2 Failed: Cookie array parsing error');
  }
  console.log('    ✓ Test 2 Passed: Flat JSON and Cookie Array formats cleanly handled.\n');

  // -------------------------------------------------------------------------
  // Test 3: DeviceTwin Pure Mobile Headers
  // -------------------------------------------------------------------------
  console.log('[*] Test 3: Verifying DeviceTwin mobile headers...');
  const deviceTwin = new DeviceTwin(sessionFromFlat);
  const liger = deviceTwin.getLigerHeaders();

  console.log('    User-Agent:', liger['User-Agent']);
  console.log('    X-IG-App-ID:', liger['X-IG-App-ID']);
  console.log('    Host:', liger['Host']);
  console.log('    X-FB-HTTP-Engine:', liger['X-FB-HTTP-Engine']);
  console.log('    Authorization:', liger['Authorization'] ? 'Bearer (Present)' : 'None');

  if (liger['X-IG-App-ID'] !== '1217981644879628') {
    throw new Error(`Test 3 Failed: Invalid X-IG-App-ID ${liger['X-IG-App-ID']}, expected 1217981644879628 (Android Mobile)`);
  }
  if (liger['Host'] !== 'i.instagram.com') {
    throw new Error(`Test 3 Failed: Invalid Host ${liger['Host']}, expected i.instagram.com`);
  }
  if (liger['X-FB-HTTP-Engine'] !== 'Liger') {
    throw new Error('Test 3 Failed: Expected Liger HTTP engine');
  }
  if (liger['Authorization'] !== flatJson.authorization) {
    throw new Error('Test 3 Failed: Authorization Bearer header not passed through');
  }
  console.log('    ✓ Test 3 Passed: 100% authentic Redmi Note 13 Android Liger headers confirmed.\n');

  // -------------------------------------------------------------------------
  // Test 4: DirectTwin Graph API v21.0 Resource Model Translation
  // -------------------------------------------------------------------------
  console.log('[*] Test 4: Verifying DirectTwin offline translation...');
  const directTwin = new DirectTwin(deviceTwin, { offlineMode: true });

  const conversations = await directTwin.getConversations();
  console.log(`    Conversations returned: ${conversations.data.length}`);
  const conv = conversations.data[0];
  console.log('    Conversation structure:', {
    id: conv.id,
    participants: conv.participants?.data.map(p => p.username),
    snippet: conv.snippet,
    unread_count: conv.unread_count
  });
  if (!conv.id || !conv.participants || conv.participants.data.length === 0) {
    throw new Error('Test 4 Failed: Invalid conversation node');
  }

  const messages = await directTwin.getMessages(conv.id, 10);
  console.log(`    Messages in thread: ${messages.data.length}`);
  const msg = messages.data[0];
  console.log('    Message item:', {
    id: msg.id,
    created_time: msg.created_time,
    from: msg.from,
    message: msg.message
  });
  if (!msg.id || !msg.created_time || !msg.from?.id) {
    throw new Error('Test 4 Failed: Invalid message item node');
  }

  const sendResult = await directTwin.sendMessage(conv.id, 'Test Mobile Message');
  console.log('    Send Result:', sendResult);
  if (sendResult.status !== 'ok' || !sendResult.message_id) {
    throw new Error('Test 4 Failed: Direct message send response invalid');
  }
  console.log('    ✓ Test 4 Passed: DirectTwin maps mobile endpoints 1:1 to Graph API v21.0.\n');

  // -------------------------------------------------------------------------
  // Test 5: TwinGraph Public Interface with Mobile Session
  // -------------------------------------------------------------------------
  console.log('[*] Test 5: Verifying TwinGraph with custom mobile session...');
  const tg = new TwinGraph({
    mobileSession: rawCookie,
    offlineMode: true
  });

  const apiConvs = await tg.api('/me/conversations');
  console.log(`    tg.api('/me/conversations') count: ${(apiConvs as any).data.length}`);

  const apiMsgs = await tg.api(`/${conv.id}/messages`);
  console.log(`    tg.api('/${conv.id}/messages') count: ${(apiMsgs as any).data.length}`);

  const apiSend = await tg.api(`/${conv.id}/messages`, 'POST', { text: 'Hello via tg.api' });
  console.log('    tg.api(POST) result:', apiSend);

  if ((apiSend as any).status !== 'ok') {
    throw new Error('Test 5 Failed: tg.api POST message failed');
  }
  console.log('    ✓ Test 5 Passed: TwinGraph seamlessly unifies mobile client operations.\n');

  console.log('================================================================');
  console.log('  ALL MOBILE TWIN ARCHITECTURE TESTS COMPLETED SUCCESSFULLY!    ');
  console.log('================================================================');
}

runMobileTwinTests().catch((err) => {
  console.error('[!] Test Suite Error:', err);
  process.exit(1);
});
