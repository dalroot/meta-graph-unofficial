export const AuthMixin = {
  setSession({ cookies, csrfToken, dsUserId }) {
    if (cookies) this.cookies = cookies;
    if (csrfToken) this.csrfToken = csrfToken;
    if (dsUserId) this.dsUserId = dsUserId;
  },

  isAuthenticated() {
    return Boolean(this.cookies && this.cookies.includes('sessionid='));
  }
};
