'use client';
import { useEffect, useRef } from 'react';

/**
 * Full-viewport atmospheric light beam overlay.
 * Sits fixed above the page with mix-blend-mode: screen so it
 * adds light to the black background without blocking text.
 * Parallax: the beams shift at ~25% of scroll speed.
 */
export default function LightBeams() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let current = 0;
    let target = 0;

    const onScroll = () => {
      target = window.scrollY;
    };

    const tick = () => {
      // Smooth lerp toward target
      current += (target - current) * 0.06;
      if (ref.current) {
        // 25% parallax factor — beams drift slower than content
        ref.current.style.transform = `translateY(${current * 0.25}px)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div aria-hidden="true" className="light-beams-root">
      <div ref={ref} className="light-beams-inner">
        <img
          src="/media/light-beams.png"
          alt=""
          className="light-beams-img"
          draggable={false}
        />
      </div>
    </div>
  );
}
