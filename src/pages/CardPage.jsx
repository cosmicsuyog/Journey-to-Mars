import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { evidenceData } from '../constants/evidanceData';

gsap.registerPlugin(ScrollTrigger);

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const CardPage = () => {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.innerWidth < 768;

    const section = sectionRef.current;
    const cards = cardRefs.current.filter(Boolean);
    const total = cards.length;
    const intensity = isMobile.current ? 0.55 : 1;

    // ── Initial stack: position each card with depth offsets ──────────────────
    cards.forEach((card, i) => {
      if (!card) return;
      const reverseIdx = total - 1 - i; // 0 = front card, total-1 = back card
      const depthStep = 28 * intensity;
      const scaleStep = 0.045;
      const yStep = 16 * intensity;

      gsap.set(card, {
        translateZ: -reverseIdx * depthStep * 10,
        scale: 1 - reverseIdx * scaleStep,
        y: reverseIdx * yStep,
        rotateX: reverseIdx * 2.5 * intensity,
        opacity: clamp(1 - reverseIdx * 0.15, 0.25, 1),
        filter: `blur(${reverseIdx * 1.0 * intensity}px)`,
        transformOrigin: '50% 100%',
        zIndex: i,
        willChange: 'transform, opacity, filter',
      });
    });

    // ── GSAP timeline pinned to section ───────────────────────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${total * 620}`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
      },
    });

    // ── Animate each card off in sequence, promote next ───────────────────────
    cards
      .slice()
      .reverse()
      .forEach((card, seq) => {
        if (!card) return;
        const stepStart = seq;

        // Top card exits: fly up + slight tilt + fade
        tl.to(
          card,
          {
            y: `-${115 * intensity}vh`,
            rotateX: `-${20 * intensity}deg`,
            rotateZ: `${(seq % 2 === 0 ? 1 : -1) * 3.5 * intensity}deg`,
            scale: 0.86,
            opacity: 0,
            filter: 'blur(8px)',
            ease: 'power3.inOut',
            duration: 1,
          },
          stepStart
        );

        // Card beneath promotes to front
        const nextCard = cards[cards.length - 2 - seq];
        if (nextCard) {
          tl.to(
            nextCard,
            {
              translateZ: 0,
              scale: 1,
              y: 0,
              rotateX: 0,
              opacity: 1,
              filter: 'blur(0px)',
              ease: 'power3.out',
              duration: 1,
            },
            stepStart + 0.15
          );
        }

        // Remaining background cards recompress
        cards
          .slice(0, cards.length - 2 - seq)
          .reverse()
          .forEach((bgCard, bi) => {
            if (!bgCard) return;
            const rIdx = bi + 1;
            tl.to(
              bgCard,
              {
                translateZ: -rIdx * 28 * intensity * 10,
                scale: 1 - rIdx * 0.045,
                y: rIdx * 16 * intensity,
                rotateX: rIdx * 2.5 * intensity,
                opacity: clamp(1 - rIdx * 0.15, 0.25, 1),
                filter: `blur(${rIdx * 1.0 * intensity}px)`,
                ease: 'power3.out',
                duration: 1,
              },
              stepStart + 0.15
            );
          });
      });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Share+Tech+Mono&display=swap');

        body { background: #0a0a0a; margin: 0; }

        /* ── Spinning conic-gradient border (same as AboutPage) ── */
        @property --rotate {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes borderSpin {
          from { --rotate: 0deg; }
          to   { --rotate: 360deg; }
        }
        .evidence-card {
          background:
            linear-gradient(#111, #111) padding-box,
            conic-gradient(
              from var(--rotate),
              #0a0a0a 0%, #0a0a0a 30%,
              rgba(231,111,46,0.55) 45%,
              #E76F2E 50%,
              rgba(231,111,46,0.55) 55%,
              #0a0a0a 70%, #0a0a0a 100%
            ) border-box;
          border: 2px solid transparent;
          animation: borderSpin 4s linear infinite;
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* Scroll hint */
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%       { opacity: 0.9;  transform: translateY(7px); }
        }
        .scroll-hint { animation: scrollPulse 1.9s ease-in-out infinite; }

        /* Card image hover */
        .evidence-card img {
          transition: transform 0.6s ease, filter 0.5s ease;
        }
        .evidence-card:hover img {
          transform: scale(1.04);
          filter: grayscale(30%) brightness(0.75);
        }
      `}</style>

      {/* ── Scroll hint ── */}
      <div className="w-full flex flex-col items-center justify-center pt-16 pb-4 bg-[#0a0a0a]">
        <p
          className="text-[10px] tracking-[6px] text-white/25 uppercase mb-2"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          Scroll to reveal
        </p>
        <div className="scroll-hint text-white/35 text-base">↓</div>
      </div>

      {/* ── Pinned section ── */}
      <section
        ref={sectionRef}
        className="relative w-full bg-[#0a0a0a]"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        {/* Subtle background glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 50% at 50% 58%, rgba(231,111,46,0.07) 0%, transparent 70%)',
          }}
        />

        {/* ── 3D perspective wrapper ── */}
        <div
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '1400px', perspectiveOrigin: '50% 46%' }}
        >
          {/* Stack container */}
          <div
            className="relative"
            style={{
              width: 'min(80vw, 1100px)',
              height: 'min(62vh, 560px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {evidenceData.map((item, idx) => (
              <div
                key={item.id}
                ref={(el) => (cardRefs.current[idx] = el)}
                className="evidence-card absolute inset-0 rounded-[4px] overflow-hidden cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* ── Card inner ── */}
                <div className="relative w-full h-full">

                  {/* Background image */}
                  <img
                    src={item.img}
                    alt={item.title}
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                    className="absolute inset-0 w-full h-full object-cover grayscale-[80%] brightness-[0.6]"
                  />

                  {/* Top-left three dots */}
                  <div className="absolute top-4 left-4 flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-[#E76F2E] opacity-70" />
                    ))}
                  </div>

                  {/* Top-right bracket corner */}
                  <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-white/30" />

                  {/* Rotated label on right edge */}
                  <span
                    className="absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-[9px] tracking-[3px] text-[#E76F2E] uppercase whitespace-nowrap opacity-80"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  >
                    {item.label}
                  </span>

                  {/* Bottom gradient + text */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pb-7 bg-gradient-to-t from-black/92 via-black/60 to-transparent">
                    <div
                      className="text-[10px] tracking-[3px] text-[#E76F2E] uppercase mb-2"
                      style={{ fontFamily: "'Share Tech Mono', monospace" }}
                    >
                      {item.number}
                    </div>
                    <div
                      className="text-4xl md:text-5xl text-gray-300 leading-none"
                      style={{ fontFamily: "'Anton', sans-serif" }}
                    >
                      {item.title}
                    </div>
                    <div className="h-px bg-[#E76F2E] mt-3 w-12 opacity-60" />
                    <div
                      className="text-[9px] tracking-[2px] text-white/40 uppercase mt-2"
                      style={{ fontFamily: "'Share Tech Mono', monospace" }}
                    >
                      [ CLICK TO DECRYPT ]
                    </div>
                  </div>

                  {/* Card index indicator top-center */}
                  <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] tracking-[3px] text-white/20 uppercase"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  >
                    {String(idx + 1).padStart(2, '0')} / {String(evidenceData.length).padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── End spacer ── */}
      <div className="w-full flex flex-col items-center justify-center py-28 bg-[#0a0a0a]">
        <div
          className="w-px h-14 mb-5"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(231,111,46,0.25))',
          }}
        />
        <p
          className="text-[9px] tracking-[5px] text-white/15 uppercase"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          End of sequence
        </p>
      </div>
    </>
  );
};

export default  CardPage;