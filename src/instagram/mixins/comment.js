export const CommentMixin = {
  async getMediaComments(mediaId) {
    if (!mediaId) throw new Error('mediaId is required to fetch comments');
    const cleanMediaId = String(mediaId).split('_')[0];

    const url = `https://www.instagram.com/api/v1/media/${cleanMediaId}/comments/`;
    const res = await this.http.request(url, {
      method: 'GET',
      headers: this.getHeaders(`https://www.instagram.com/p/${cleanMediaId}/`)
    });

    if (res.status !== 200 || !res.data) {
      throw new Error(`Failed to fetch comments for media ${cleanMediaId}: HTTP ${res.status}`);
    }

    const payload = res.data;
    const comments = (payload.comments || []).map(c => ({
      id: c.pk || c.id,
      text: c.text,
      createdAt: c.created_at,
      userId: c.user_id || c.user?.pk,
      username: c.user?.username,
      fullName: c.user?.full_name,
      likeCount: c.comment_like_count || 0
    }));

    return {
      commentCount: payload.comment_count || comments.length,
      hasMoreComments: Boolean(payload.has_more_comments),
      comments
    };
  }
};
