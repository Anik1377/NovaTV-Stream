import { useState, useEffect, useRef } from 'react';

export function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px', threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, threshold]);

  return { ref, isVisible };
}
