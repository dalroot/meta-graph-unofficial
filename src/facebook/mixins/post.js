export const FacebookPostMixin = {
  async publishTextPost(text) {
    if (!text) throw new Error('Post text cannot be empty');
    if (!this.fbDtsg) throw new Error('fb_dtsg CSRF token is required to publish Facebook posts');

    const payload = new URLSearchParams();
    payload.append('fb_dtsg', this.fbDtsg);
    payload.append('variables', JSON.stringify({
      input: {
        composer_entry_point: 'inline_composer',
        composer_source_surface: 'timeline',
        composer_type: 'feed',
        logging: { composer_session_id: String(Date.now()) },
        source: 'WWW',
        message: { text },
        audience: { privacy: { base_state: 'EVERYONE' } },
        actor_id: this.cUser,
        client_mutation_id: String(Math.floor(Math.random() * 10))
      }
    }));
    payload.append('doc_id', '7160754877372224');

    const res = await this.http.request('https://www.facebook.com/api/graphql/', {
      method: 'POST',
      headers: this.getHeaders(),
      body: payload.toString()
    });

    return res.data;
  }
};
