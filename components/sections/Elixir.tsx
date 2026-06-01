'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';

const FRAME_COUNT = 49;

interface Drink {
  id: string;
  name: string;
  description: string;
  frames: string; // base path for pre-extracted WebP frames
}

const DRINKS: Drink[] = [
  {
    id: 'tropical-sunset',
    name: 'Tropical Sunset',
    description:
      'A vibrant tropical highball layered with citrus and passionfruit notes, served over crystal-clear ice and finished with fresh mint, dried orange, and pink grapefruit.',
    frames: '/frames/tropical-sunset',
  },
  {
    id: 'emerald-cooler',
    name: 'Emerald Cooler',
    description:
      'A crisp gin-based refresher with cucumber essence and elderflower, served over a frozen cucumber sphere and finished with a spray of lime.',
    frames: '/frames/emerald-cooler',
  },
  {
    id: 'dragon-berry',
    name: 'Dragon Berry',
    description:
      'A bold, exotic blend of dragonfruit and wild berries, infused with a hint of hibiscus and finished with a sparkling lime zest.',
    frames: '/frames/dragon-berry',
  },
];

type FrameBank = HTMLImageElement[];

function loadFrames(basePath: string): Promise<FrameBank> {
  return new Promise((resolve) => {
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loaded = 0;
    const onLoad = () => { if (++loaded === FRAME_COUNT) resolve(images); };
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad; // count errors so we always resolve
      img.src = `${basePath}/frame_${String(i + 1).padStart(4, '0')}.webp`;
      images[i] = img;
    }
  });
}

/*
  Scroll progress → frame mapping (4 equal segments):

  0.00 – 0.25  Tropical Sunset  last → 0   (drain as you scroll in)
  0.25 – 0.50  Emerald Cooler   0 → last   (fill)
  0.50 – 0.75  Emerald Cooler   last → 0   (drain)
  0.75 – 1.00  Dragon Berry     0 → last   (fill → section unpins)

  Transitions happen at frame 0 of each drink, so the visual cut is seamless.
*/
function resolveScrollState(progress: number): { drinkIdx: number; frameProgress: number } {
  if (progress <= 0.25) return { drinkIdx: 0, frameProgress: 1 - progress / 0.25 };
  if (progress <= 0.50) return { drinkIdx: 1, frameProgress: (progress - 0.25) / 0.25 };
  if (progress <= 0.75) return { drinkIdx: 1, frameProgress: 1 - (progress - 0.50) / 0.25 };
  return { drinkIdx: 2, frameProgress: (progress - 0.75) / 0.25 };
}

export default function Elixir({ onReserve }: { onReserve?: () => void }) {
  const stickyRef     = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const framebanksRef = useRef<(FrameBank | null)[]>([null, null, null]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [ready,       setReady]       = useState(false);

  const drawFrame = (drinkIdx: number, frameProgress: number) => {
    const bank   = framebanksRef.current[drinkIdx];
    const canvas = canvasRef.current;
    if (!bank || !canvas || bank.length === 0) return;
    const idx   = Math.round(Math.max(0, Math.min(1, frameProgress)) * (bank.length - 1));
    const frame = bank[idx];
    if (!frame) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale 1.2× (20% larger than original).
    // Anchor the bottom of the drawn image to canvas bottom, then lift 5 vw.
    // 5 vw in canvas-space = 0.05 × 1920 = 96 px.
    const scale  = 1.08;
    const dw     = canvas.width  * scale;               // 2304
    const dh     = canvas.height * scale;               // 1296
    const dx     = (canvas.width  - dw) / 2;           // centre horizontally: -192
    const dy     = canvas.height - dh - 58;             // bottom flush − 3 vw up (5 vw − 2 vw)

    // Fill with site background first, then screen-blend the video frame on top.
    // This bakes the blend into canvas pixels, bypassing CSS stacking-context limits.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(frame, dx, dy, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
  };

  // ── load pre-extracted frames ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const first = await loadFrames(DRINKS[0].frames);
      if (cancelled) return;
      framebanksRef.current[0] = first;
      drawFrame(0, 1);
      setReady(true);

      const [bank1, bank2] = await Promise.all([
        loadFrames(DRINKS[1].frames),
        loadFrames(DRINKS[2].frames),
      ]);
      if (!cancelled) {
        framebanksRef.current[1] = bank1;
        framebanksRef.current[2] = bank2;
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ScrollTrigger pin + scrub ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !stickyRef.current) return;

    // Draw the first frame immediately so the canvas isn't blank on pin
    drawFrame(0, 1);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: stickyRef.current,
        start: 'top top',
        // 4 viewport-heights of scroll travel before unpinning
        end: () => `+=${window.innerHeight * 4}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        onUpdate(self) {
          const { drinkIdx, frameProgress } = resolveScrollState(self.progress);
          setActiveIndex(drinkIdx);
          drawFrame(drinkIdx, frameProgress);
        },
      });
    });

    return () => ctx.revert();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <section id="elixir">
      <div className="elixir-sticky" ref={stickyRef}>

        <div className="elixir-bg">
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="elixir-video elixir-video-active"
            style={{ opacity: !ready ? 0 : undefined }}
          />
          <div className="elixir-overlay" />
        </div>

        <div className="elixir-content-grid">

          <div className="elixir-left">
            <p className="elixir-kicker">Hand-crafted. Small-batch.</p>
            <h2 className="elixir-main-title">
              What&apos;s your<br /><span style={{ color: '#F4C485' }}>elixir?</span>
            </h2>
          </div>

          <div className="elixir-center" />

          <div className="elixir-right">
            <div className="elixir-drink-list">
              {DRINKS.map((drink, index) => (
                <div
                  key={drink.id}
                  className={`elixir-drink-item${index === activeIndex ? ' active' : ''}`}
                >
                  <h3 className="elixir-drink-name">{drink.name}</h3>

                  <AnimatePresence mode="wait">
                    {index === activeIndex && (
                      <motion.p
                        key={drink.id}
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="elixir-drink-desc"
                      >
                        {drink.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
