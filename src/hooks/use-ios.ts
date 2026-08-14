import * as React from 'react';

/**
 * Detects iOS devices (iPhone, iPad, iPod) including iPad on desktop Safari.
 * Returns true on iOS Safari and iOS Chrome (which uses WebKit).
 */
export function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    const ua = navigator.userAgent || '';
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPad on desktop Safari 13+ identifies as Mac but has touch support
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
  }, []);

  return isIOS;
}
