import { useState } from 'react';

// Aucun service worker en développement ni dans les tests unitaires.
export function useRegisterSW() {
  return { needRefresh: useState(false), offlineReady: useState(false),
    updateServiceWorker: async () => {} };
}
