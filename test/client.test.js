import test from 'node:test';
import assert from 'node:assert/strict';
import MetaGraph, { InstagramClient, FacebookClient, ProfileManager } from '../src/index.js';

test('MetaGraph initializes with valid OS profile', () => {
  const mg = new MetaGraph({ osProfile: 'linux_x86_64_chrome' });
  assert.ok(mg.instagram instanceof InstagramClient);
  assert.ok(mg.facebook instanceof FacebookClient);
  assert.equal(mg.profile.sec_ch_ua_platform, '"Linux"');
});

test('InstagramClient mixins are correctly composed including DownloadMixin', () => {
  const client = new InstagramClient();
  assert.equal(typeof client.setSession, 'function');
  assert.equal(typeof client.getMediaComments, 'function');
  assert.equal(typeof client.getNotificationsInbox, 'function');
  assert.equal(typeof client.getUserProfile, 'function');
  assert.equal(typeof client.getReelsTray, 'function');
  assert.equal(typeof client.downloadMediaUrl, 'function');
});

test('FacebookClient mixins are correctly composed', () => {
  const client = new FacebookClient();
  assert.equal(typeof client.setSession, 'function');
  assert.equal(typeof client.publishTextPost, 'function');
});

test('ProfileManager lists built-in profiles and accepts custom profile', () => {
  const manager = new ProfileManager();
  const list = manager.listProfiles();
  assert.ok(list.includes('linux_x86_64_chrome'));
  assert.ok(list.includes('windows_11_chrome'));
  assert.ok(list.includes('macos_sonoma_safari'));

  const custom = manager.registerCustomProfile('test_agent', {
    name: 'Custom Agent',
    user_agent: 'CustomAgent/1.0',
    sec_ch_ua: '"Custom";v="1"',
    sec_ch_ua_platform: '"Linux"'
  });
  assert.equal(custom.isCustom, true);
  assert.equal(manager.getProfile('test_agent').name, 'Custom Agent');
});
