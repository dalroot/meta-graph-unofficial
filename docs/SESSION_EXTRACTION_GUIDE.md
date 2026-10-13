# Session & Cookie Extraction Guide (How to Feed Credentials)

This guide documents the exact format required by `meta-graph-unofficial` to authenticate requests without requiring browser automation or password submission.

---

## 1. What Credentials Are Needed?

### Instagram:
The library requires three primary tokens:
- **`sessionid`**: The main authentication token.
- **`csrftoken`**: The cross-site request forgery protection token (sent as `X-CSRFToken`).
- **`ds_user_id`**: Your unique Instagram User ID (numeric string, e.g. `19835089130`).

### Facebook:
- **`c_user`**: Your Facebook User ID (e.g. `61594901048716`).
- **`xs`**: Session credential.
- **`fb_dtsg`**: Anti-CSRF token extracted from the HTML source (e.g. `NAfwMx3M...`).

---

## 2. Standard Session File Format (`session.json`)

To configure sessions securely, save your credentials in a JSON file:

```json
{
  "instagram": {
    "username": "your_handle",
    "ds_user_id": "19835089130",
    "csrf_token": "s51GbHBjwTJ88hKQYjBjbEED8ZqSZ22v",
    "cookie_string": "sessionid=...; ds_user_id=19835089130; csrftoken=...; mid=...; datr=..."
  },
  "facebook": {
    "c_user": "61594901048716",
    "fb_dtsg": "NAfwMx3M...",
    "cookie_string": "c_user=61594901048716; xs=...; datr=..."
  }
}
```

---

## 3. How to Extract Cookies from Linux / Chrome

1. Open **Google Chrome** or **Firefox** where you are logged into Instagram/Facebook.
2. Press `F12` to open Developer Tools.
3. Go to the **Application** (or **Storage**) tab -> **Cookies** -> `https://www.instagram.com`.
4. Locate:
   - `sessionid` (Copy the Value)
   - `csrftoken` (Copy the Value)
   - `ds_user_id` (Copy the Value)
5. Or in the **Network** tab, inspect any request to `instagram.com`, scroll down to **Request Headers**, and copy the entire `Cookie:` string.

---

## 4. Usage in Code

```javascript
import MetaGraph from 'meta-graph-unofficial';
import fs from 'fs';

const session = JSON.parse(fs.readFileSync('./session.json', 'utf-8'));

const mg = new MetaGraph({ osProfile: 'linux_x86_64_chrome' });

mg.instagram.setSession({
  cookies: session.instagram.cookie_string,
  csrfToken: session.instagram.csrf_token,
  dsUserId: session.instagram.ds_user_id
});
```
