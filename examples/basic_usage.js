import MetaGraph from '../src/index.js';

// Initialize MetaGraph with a pre-calibrated OS Profile
const mg = new MetaGraph({
  osProfile: 'linux_x86_64_chrome' // 'linux_x86_64_chrome' | 'windows_11_chrome' | 'macos_sonoma_safari'
});

// Configure Instagram Session Credentials
mg.instagram.setSession({
  cookies: 'sessionid=YOUR_SESSIONID; ds_user_id=YOUR_DS_USER_ID; csrftoken=YOUR_CSRFTOKEN;',
  csrfToken: 'YOUR_CSRFTOKEN',
  dsUserId: 'YOUR_DS_USER_ID'
});

async function main() {
  console.log('--- Fetching User Profile ---');
  try {
    const profile = await mg.instagram.getUserProfile('instagram');
    console.log('Profile Stats:', profile.rawStats);
  } catch (err) {
    console.error('Error fetching profile:', err.message);
  }

  console.log('\n--- Fetching Post Comments ---');
  try {
    // Replace with a valid Instagram Media ID
    const commentsData = await mg.instagram.getMediaComments('4007195903156614326');
    console.log(`Found ${commentsData.commentCount} comments:`);
    for (const c of commentsData.comments) {
      console.log(`- @${c.username}: ${c.text}`);
    }
  } catch (err) {
    console.error('Error fetching comments:', err.message);
  }
}

main();
