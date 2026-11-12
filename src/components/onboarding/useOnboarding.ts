import { useState } from 'react';

export const ONBOARDING_KEY = 'habitflow_onboarding_done';

export function useOnboarding() {
  const [show, setShow] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('skip_onboarding')) return false;
      return !localStorage.getItem(ONBOARDING_KEY);
    }
    return false;
  });

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  return { show, complete };
}

