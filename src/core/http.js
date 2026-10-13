import { humanJitter } from './utils.js';

export class HttpClient {
  constructor(options = {}) {
    this.profile = options.profile || {};
    this.timeout = options.timeout || 20000;
  }

  async request(url, options = {}) {
    const minJitter = options.minJitter ?? 1.2;
    const maxJitter = options.maxJitter ?? 2.8;
    if (options.applyJitter !== false) {
      await humanJitter(minJitter, maxJitter);
    }

    const headers = {
      ...this.getBaseHeaders(),
      ...(options.headers || {})
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body,
        signal: controller.signal,
        redirect: options.redirect || 'follow'
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        ok: response.ok,
        headers: response.headers,
        data
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  getBaseHeaders() {
    return {
      'User-Agent': this.profile.user_agent || '',
      'Sec-CH-UA': this.profile.sec_ch_ua || '',
      'Sec-CH-UA-Platform': this.profile.sec_ch_ua_platform || '',
      'Sec-CH-UA-Mobile': this.profile.sec_ch_ua_mobile || '?0',
      'Accept-Language': this.profile.accept_language || 'en-US,en;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty'
    };
  }
}
