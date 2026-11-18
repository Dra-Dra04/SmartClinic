import { useAuthStore } from '../store/useAuthStore';

// Profile editing uses its real API and must not call this preview-only guard.
export function blockPreviewWrite(): boolean {
  if (useAuthStore.getState().isDemo) return false;
  return true;
}
