# Meta Graph API v21.0: Authentication & Token Architecture

## 1. Official Token Flow vs. Digital Twin Mapping

In the official Meta Graph API v21.0, developers use:
- **App ID & Secret**: Registered in the Meta Developer Portal.
- **Access Tokens**: Short-lived or Long-lived User/Page tokens passed via query param `?access_token={token}` or `Authorization: Bearer {token}`.

In our **Digital Twin Hybrid Architecture**, the official token interface is transparently bridged to:
1. **Physical Device Attestation**: Xiaomi Redmi Note 13 4G (`1121b522`) fingerprint parameters.
2. **Session Cookies & Keystores**: `sessionid`, `csrftoken`, `ds_user_id`, `rur`, and `mid` stored in `instagram_session.json`.
3. **Payload Signatures**: Official HMAC-SHA256 signature scheme using the Instagram Android signing key.

---

## 2. Authentication Parameters

| Official Parameter | Type | Digital Twin Bridge Mapping |
| :--- | :--- | :--- |
| `access_token` | `string` | Mapped to `sessionid` + `Authorization: Bearer IGT:2:...` |
| `app_id` | `string` | Official Mobile App ID: `1217981644879628` / Web: `936619743392459` |
| `client_secret` | `string` | Verified internal signing secret |
| `user_id` / `me` | `string` | Bound to active `ds_user_id` (`19835089130` for `@hokar368`) |

---

## 3. Request Security & Anti-Bot Signatures
Every request dispatched by the SDK or received by the Proxy Server is signed with:
- `X-FB-HTTP-Engine: Liger`
- `X-IG-Capabilities: 3brTv10=`
- Jittered bandwidth indicators (`X-IG-Bandwidth-Speed-KBPS`)
- Accurate Xiaomi HyperOS 2 / Android 15 User-Agent
