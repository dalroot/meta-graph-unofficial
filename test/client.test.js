import test from 'node:test';
import assert from 'node:assert/strict';
import MetaGraph, { InstagramClient, FacebookClient } from '../src/index.js';

test('MetaGraph initializes with valid OS profile', () => {
  const mg = new MetaGraph({ osProfile: 'linux_x86_64_chrome' });
  assert.ok(mg.instagram instanceof InstagramClient);
  assert.ok(mg.facebook instanceof FacebookClient);
  assert.equal(mg.profile.sec_ch_ua_platform, '"Linux"');
});

test('InstagramClient mixins are correctly composed', () => {
  const client = new InstagramClient();
  assert.equal(typeof client.setSession, 'function');
  assert.equal(typeof client.getMediaComments, 'function');
  assert.equal(typeof client.getNotificationsInbox, 'function');
  assert.equal(typeof client.getUserProfile, 'function');
});

test('FacebookClient mixins are correctly composed', () => {
  const client = new FacebookClient();
  assert.equal(typeof client.setSession, 'function');
  assert.equal(typeof client.publishTextPost, 'function');
});
