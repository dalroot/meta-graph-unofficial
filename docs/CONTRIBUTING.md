# Project Inviolable Rules & Engineering Standards

This document establishes the permanent, non-negotiable rules of the `meta-graph-unofficial` project. Every contributor, maintainer, and automated agent MUST follow these principles without exception.

---

## 1. The Zero-Guesswork Principle (Absolute Rule)

- **No Speculative Implementation:** Never guess, extrapolate, or approximate an API endpoint, payload parameter, query variable, or HTTP header.
- **Strict Evidence Provenance:** Every method introduced into `src/` must be directly mapped to a concrete, reproducible network trace captured via the **REA (Reverse Engineer Anything)** methodology.
- **Trace Accountability:** If an endpoint behavior changes or a new feature is requested, an empirical capture must be placed into `evidence/` before any code is written.

---

## 2. REA Capture Workflow (How New Capabilities Are Admitted)

1. **Passive Runtime Observation:** Observe real user execution inside legitimate browser environments via Chrome DevTools Protocol (CDP) or proxy traces.
2. **Sanitization:** Strip secrets (session IDs, passwords, persistent tokens) while preserving exact structure, casing, JSON types, and query doc_ids.
3. **Evidence Archival:** Save the sanitized trace in `evidence/<feature>_evidence.json`.
4. **Manifest Registration:** Register the endpoint, HTTP method, and verified status in `evidence/REA_MANIFEST.md`.
5. **Code Synthesis:** Implement the corresponding mixin or core method, referencing the Evidence ID in the docstring.

---

## 3. Architecture & Separation of Concerns

- **Node.js (API Layer):** Clean, modular, type-safe API for end developers with standard mixin pattern.
- **Go Engine (Transport & TLS Layer):** Native sidecar/engine utilizing `uTLS` for packet-level browser TLS and JA4 impersonation.
- **Profiles Subsystem:** Digital twin profiles must be strictly isolated. Switching User-Agents or Client Hints mid-session is strictly prohibited.
