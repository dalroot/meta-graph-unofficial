export const UserMixin = {
  async getUserProfile(username) {
    const target = username || this.username;
    if (!target) throw new Error('Username required to fetch profile');

    const res = await this.http.request(`https://www.instagram.com/${target}/`, {
      method: 'GET',
      headers: this.getHeaders(`https://www.instagram.com/${target}/`)
    });

    if (res.status !== 200) {
      throw new Error(`Failed to load profile for ${target}: HTTP ${res.status}`);
    }

    const descMatch = typeof res.data === 'string' && res.data.match(/<meta content="([^"]+)" property="og:description"/);
    return {
      username: target,
      rawStats: descMatch ? descMatch[1] : null,
      status: res.status
    };
  }
};
