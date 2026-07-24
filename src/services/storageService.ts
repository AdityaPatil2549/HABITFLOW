/**
 * Firebase Storage Service
 * Handles profile photo uploads and cloud data backups.
 */
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase';

export const storageService = {
  /**
   * Upload a profile photo for the current user.
   * Returns the public download URL.
   */
  async uploadProfilePhoto(file: File): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to upload a photo.');

    // Validate file type
    if (!file.type.startsWith('image/')) throw new Error('File must be an image.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image must be smaller than 5MB.');

    const ext = file.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `profile-photos/${user.uid}/avatar.${ext}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    // Cache URL locally
    localStorage.setItem('habitflow_profile_photo', url);
    return url;
  },

  /**
   * Get the cached profile photo URL.
   */
  getProfilePhotoUrl(): string | null {
    return localStorage.getItem('habitflow_profile_photo');
  },

  /**
   * Upload a JSON data backup to the user's Firebase Storage folder.
   * Returns the download URL.
   */
  async uploadBackup(data: object): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be signed in to backup to cloud.');

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const timestamp = new Date().toISOString().split('T')[0];
    const storageRef = ref(storage, `backups/${user.uid}/habitflow-backup-${timestamp}.json`);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  },

  /**
   * Delete the user's profile photo from Storage.
   */
  async deleteProfilePhoto(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}/avatar.jpg`);
      await deleteObject(storageRef);
    } catch {
      // File may not exist, ignore
    }
    localStorage.removeItem('habitflow_profile_photo');
  },
};
