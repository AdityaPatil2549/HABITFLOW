# Security & Compliance Posture

## 1. Overview
HabitFlow is designed with a **Privacy-First, Offline-First** architecture. By relying heavily on IndexedDB for local storage and minimizing server round-trips, our attack surface is significantly smaller than traditional cloud-only SaaS apps. However, as we introduce Supabase for real-time Squads and Cloud Sync, rigorous security measures are mandated.

## 2. Data Classification
- **Public Data:** Global Leaderboards, Theme metadata, App assets.
- **Internal Data:** Application logs, telemetry (anonymized), aggregated AI prompts.
- **Confidential Data:** User emails, encrypted passwords, payment metadata.
- **Restricted Data (PII & PHI):** Daily journals, mood tracking logs, personal habit titles, AI Coach behavioral analyses.

## 3. Threat Model & Mitigations

### 3.1 Local Data Extraction
**Threat:** Malicious browser extensions or local malware extracting the unencrypted IndexedDB (`HabitFlowDB`).
**Mitigation:** 
- Restrict sensitive data (Moods, Journals) to local-only sync by default.
- In Phase 2, implement Web Crypto API to AES-GCM encrypt specific tables in IndexedDB using a user-derived Key (PBKDF2) stored in an HTTP-only secure cookie.

### 3.2 Network Interception (MITM)
**Threat:** Interception of sync data between client and Supabase.
**Mitigation:**
- Strict TLS 1.3 enforcement (HSTS preload).
- WebSocket (WSS) connections for Squad real-time updates are fully encrypted.

### 3.3 Supabase Data Breaches
**Threat:** Unauthorized access to our cloud database.
**Mitigation:**
- **Row Level Security (RLS):** Enabled on all tables. A user can only `SELECT`, `UPDATE`, or `DELETE` rows where `user_id = auth.uid()`.
- Squads use a junction table (`squad_members`) to authorize reads to squad-specific data.

## 4. Compliance Goals
- **GDPR / CCPA:** Users must have a single-click "Export My Data" (JSON) and "Delete My Account" functionality. (Currently partially supported via IndexedDB wipe).
- **HIPAA:** While we are not a medical app, mood tracking borders on sensitive health data. We will explicitly state in our ToS that we do not provide medical advice, and mood data synced to the cloud must eventually be E2E encrypted to avoid compliance scope creep.
