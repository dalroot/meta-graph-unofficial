export const ActivityMixin = {
  async getNotificationsInbox(markAsRead = false) {
    const url = `https://www.instagram.com/api/v1/news/inbox/?mark_as_read=${markAsRead}`;
    const res = await this.http.request(url, {
      method: 'GET',
      headers: this.getHeaders('https://www.instagram.com/')
    });

    if (res.status !== 200 || !res.data) {
      throw new Error(`Failed to fetch notifications inbox: HTTP ${res.status}`);
    }

    return {
      counts: res.data.counts || {},
      newStories: res.data.new_stories || [],
      oldStories: res.data.old_stories || [],
      status: res.data.status
    };
  }
};
