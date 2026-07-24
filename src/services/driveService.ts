/**
 * Google Drive Service
 * Allows users to save and restore HabitFlow backups directly to their Google Drive.
 * Uses the Google Drive REST API with the OAuth access token from Google Sign-In.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const BACKUP_FILE_NAME = 'habitflow-backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'google_drive_token';

export const driveService = {
  isDriveConnected(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Connect Google Drive by signing in with the drive.file scope.
   * Saves the access token to localStorage.
   */
  async connectDrive(): Promise<void> {
    const { auth } = await import('@/lib/firebase');
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      throw new Error('No Drive access token received');
    }
  },

  disconnectDrive(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Save a JSON backup to Google Drive.
   * Creates a new file or updates the existing backup file.
   */
  async saveBackupToDrive(data: object): Promise<string> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('Google Drive not connected');

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // Check if backup file already exists
    const existingFileId = await this._findBackupFile(token);

    let url: string;
    let method: string;
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
    };

    if (existingFileId) {
      // Update existing file
      url = `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=multipart`;
      method = 'PATCH';
    } else {
      // Create new file
      url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
      method = 'POST';
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (response.status === 401) {
      this.disconnectDrive();
      throw new Error('Drive token expired. Please reconnect Google Drive.');
    }

    if (!response.ok) {
      throw new Error(`Drive API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id;
  },

  /**
   * Restore backup data from Google Drive.
   * Returns the parsed JSON object.
   */
  async restoreFromDrive(): Promise<object> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('Google Drive not connected');

    const fileId = await this._findBackupFile(token);
    if (!fileId) throw new Error('No HabitFlow backup found in your Google Drive');

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      this.disconnectDrive();
      throw new Error('Drive token expired. Please reconnect Google Drive.');
    }

    if (!response.ok) throw new Error(`Failed to download backup: ${response.statusText}`);

    return response.json();
  },

  async _findBackupFile(token: string): Promise<string | null> {
    const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
    const res = await fetch(`${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.files?.[0]?.id ?? null;
  },
};
