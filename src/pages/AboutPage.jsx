import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Observer } from 'gsap/all';
import { evidenceData } from '../constants/evidanceData';

gsap.registerPlugin(Observer);

const NORMAL_W = 220;
const ACTIVE_W = 290;
const HOVER_W = 310;
const ACTIVE_HOVER_W = HOVER_W + 30;
const NORMAL_H = 540;
const ACTIVE_H = 570;
const GAP = 12;
const MOBILE_BREAKPOINT = 768;

const AboutPage = () => {
  const [viewMode, setViewMode] = useState('slider');
  const [currentIndex, setCurrentIndex] = useState(2);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);

  // carouselIndex tracks position in the extended array (1..evidenceData.length are the real slides)
  const [carouselIndex, setCarouselIndex] = useState(1);
  const carouselIndexRef = useRef(1); // always in sync, safe to read inside callbacks

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const currentXPercentRef = useRef(-100); // mirrors the current gsap x% value

  const trackRef = useRef(null);
  const sliderWrapRef = useRef(null);
  const cardRefs = useRef([]);
  const crossTimelines = useRef([]);
  const listRowsRef = useRef([]);
  const carouselContainerRef = useRef(null);
  const carouselTrackRef = useRef(null);
  const carouselAnimRef = useRef(null);

  // Extended array: [last, ...items, first]  (indices 0 and extendedCount-1 are clones)
  const extendedData = [
    evidenceData[evidenceData.length - 1],
    ...evidenceData,
    evidenceData[0],
  ];
  const extendedCount = extendedData.length; // evidenceData.length + 2

  // Map an extendedData index to the real evidenceData index
  const getRealIndex = (extIdx) => {
    if (extIdx === 0) return evidenceData.length - 1;
    if (extIdx === extendedCount - 1) return 0;
    return extIdx - 1;
  };

  const activeRealIndex = getRealIndex(carouselIndex);

  // ─── Core carousel navigator ────────────────────────────────────────────────
  const goToIndex = useCallback(
    (newIdx, animate = true) => {
      if (!carouselTrackRef.current) return;
      if (carouselAnimRef.current) carouselAnimRef.current.kill();

      const containerWidth = carouselContainerRef.current?.offsetWidth ?? 0;
      const targetX = -newIdx * containerWidth;

      currentXPercentRef.current = targetX;
      carouselIndexRef.current = newIdx;
      setCarouselIndex(newIdx);

      const doJump = () => {
        // After animating INTO a clone, silently teleport to its real counterpart
        if (newIdx === 0) {
          // clone-of-last → jump to real last
          const realIdx = evidenceData.length;
          const jumpX = -realIdx * containerWidth;
          currentXPercentRef.current = jumpX;
          carouselIndexRef.current = realIdx;
          setCarouselIndex(realIdx);
          gsap.set(carouselTrackRef.current, { x: jumpX });
        } else if (newIdx === extendedCount - 1) {
          // clone-of-first → jump to real first
          const realIdx = 1;
          const jumpX = -realIdx * containerWidth;
          currentXPercentRef.current = jumpX;
          carouselIndexRef.current = realIdx;
          setCarouselIndex(realIdx);
          gsap.set(carouselTrackRef.current, { x: jumpX });
        }
      };

      if (animate) {
        carouselAnimRef.current = gsap.to(carouselTrackRef.current, {
          x: targetX,
          duration: 0.4,
          ease: 'power2.out',
          onComplete: doJump,
        });
      } else {
        gsap.set(carouselTrackRef.current, { x: targetX });
        // silent init — always a real index, no jump needed
      }
    },
    [extendedCount]
  );

  // Read index from ref so callbacks never go stale between renders
  const nextSlide = useCallback(() => goToIndex(carouselIndexRef.current + 1), [goToIndex]);
  const prevSlide = useCallback(() => goToIndex(carouselIndexRef.current - 1), [goToIndex]);

  // ─── Drag / pointer events ───────────────────────────────────────────────────
  const handleCarouselPointerDown = (e) => {
    if (!carouselTrackRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId); // keep receiving events if pointer leaves
    if (carouselAnimRef.current) carouselAnimRef.current.kill();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
  };

  const handleCarouselPointerMove = (e) => {
    if (!isDraggingRef.current || !carouselTrackRef.current) return;
    const containerWidth = carouselContainerRef.current?.offsetWidth ?? 1;
    const deltaX = e.clientX - dragStartXRef.current;
    const newX = currentXPercentRef.current + deltaX;
    gsap.set(carouselTrackRef.current, { x: newX });
  };

  const handleCarouselPointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const deltaX = e.clientX - dragStartXRef.current;
    const THRESHOLD = 50; // px
    if (deltaX < -THRESHOLD) {
      nextSlide();
    } else if (deltaX > THRESHOLD) {
      prevSlide();
    } else {
      // Snap back to current slide
      goToIndex(carouselIndexRef.current);
    }
  };

  // ─── Detect mobile ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Init carousel position when switching to mobile slider ─────────────────
  useEffect(() => {
    if (viewMode === 'slider' && isMobile) {
      // Start at index 1 (first real slide) with no animation
      const startIdx = 1;
      const containerWidth = carouselContainerRef.current?.offsetWidth ?? 0;
      const targetX = -startIdx * containerWidth;
      currentXPercentRef.current = targetX;
      setCarouselIndex(startIdx);
      if (carouselTrackRef.current) {
        gsap.set(carouselTrackRef.current, { x: targetX });
      }
    }
  }, [viewMode, isMobile]);

  // Also set position after the carousel DOM mounts (ref available)
  useEffect(() => {
    if (carouselTrackRef.current && isMobile) {
      const containerWidth = carouselContainerRef.current?.offsetWidth ?? 0;
      const targetX = -1 * containerWidth; // index 1 = first real slide
      currentXPercentRef.current = targetX;
      gsap.set(carouselTrackRef.current, { x: targetX });
    }
  }, [isMobile]); // runs when mobile state first resolves

  // ─── Desktop layout helpers (unchanged) ─────────────────────────────────────
  const getCardWidth = useCallback(
    (idx) => {
      const isActive = idx === currentIndex;
      const isHovered = idx === hoveredIndex;
      if (!isHovered) return isActive ? ACTIVE_W : NORMAL_W;
      if (isActive) return ACTIVE_HOVER_W;
      return HOVER_W;
    },
    [currentIndex, hoveredIndex]
  );

  const layoutCards = useCallback(
    (duration = 0.6) => {
      if (!sliderWrapRef.current || !trackRef.current) return;
      const wrapWidth = sliderWrapRef.current.offsetWidth - 60;
      const widths = cardRefs.current.map((_, i) => getCardWidth(i));
      let activeLeft = 0;
      for (let i = 0; i < currentIndex; i++) activeLeft += widths[i] + GAP;
      const offsetX = wrapWidth / 2 - activeLeft - widths[currentIndex] / 2;
      let x = offsetX;
      const positions = widths.map((w) => {
        const left = x;
        x += w + GAP;
        return left;
      });
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const isActive = i === currentIndex;
        gsap.to(card, {
          left: positions[i],
          width: widths[i],
          height: isActive ? ACTIVE_H : NORMAL_H,
          duration,
          ease: 'power3.out',
        });
        if (isActive) card.classList.add('active');
        else card.classList.remove('active');
      });
    },
    [currentIndex, getCardWidth]
  );

  useEffect(() => {
    if (viewMode !== 'slider' || isMobile) return;
    crossTimelines.current.forEach((tl) => tl?.kill());
    crossTimelines.current = [];
    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const ch = card.querySelector('.cross-h');
      const ch2 = card.querySelector('.cross-h2');
      const cv = card.querySelector('.cross-v');
      const cv2 = card.querySelector('.cross-v2');
      const cc = card.querySelector('.cross-center');
      if (!ch || !ch2 || !cv || !cv2 || !cc) return;
      const tl = gsap.timeline({ paused: true });
      tl.to(ch, { width: '50%', duration: 0.35, ease: 'power2.out' }, 0)
        .to(ch2, { width: '50%', duration: 0.35, ease: 'power2.out' }, 0)
        .to(cv, { height: '45%', duration: 0.35, ease: 'power2.out' }, 0)
        .to(cv2, { height: '45%', duration: 0.35, ease: 'power2.out' }, 0)
        .to(cc, { opacity: 1, scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(2)' }, 0.15);
      crossTimelines.current[idx] = tl;
    });
  }, [viewMode, isMobile]);

  useEffect(() => {
    if (viewMode === 'slider' && !isMobile) layoutCards(0.65);
  }, [currentIndex, hoveredIndex, viewMode, isMobile, layoutCards]);

  useEffect(() => {
    const handleResize = () => {
      if (viewMode === 'slider' && !isMobile) layoutCards(0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, isMobile, layoutCards]);

  const handleCardMouseEnter = (idx) => {
    setHoveredIndex(idx);
    crossTimelines.current[idx]?.play();
  };
  const handleCardMouseLeave = (idx) => {
    setHoveredIndex(-1);
    crossTimelines.current[idx]?.reverse();
  };

  const showSlider = () => setViewMode('slider');
  const showList = () => {
    setViewMode('list');
    setTimeout(() => {
      gsap.fromTo(
        listRowsRef.current,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power3.out' }
      );
    }, 50);
  };

  const handleListClick = (item) => alert(`Decrypting: ${item.title}`);
  const handleCardClick = (item) => alert(`Decrypting: ${item.title}`);

  return (
    <div className="min-h-screen text-white font-mono flex flex-col justify-center items-center">

      {/* Top Bar */}
      <div className="w-full max-w-[1400px] flex justify-between items-center px-6 py-5">
        <div className="flex gap-2">
          <button
            onClick={showSlider}
            className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] tracking-[2px] uppercase transition-all ${viewMode === 'slider'
              ? 'bg-[#E76F2E] border-[#E76F2E] text-white'
              : 'border-[#333] text-[#888] hover:bg-[#E76F2E] hover:border-[#E76F2E] hover:text-white'
              }`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" />
              <rect x="9" y="1" width="6" height="6" />
              <rect x="1" y="9" width="6" height="6" />
              <rect x="9" y="9" width="6" height="6" />
            </svg>
            SLIDER
          </button>
          <button
            onClick={showList}
            className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] tracking-[2px] uppercase transition-all ${viewMode === 'list'
              ? 'bg-[#E76F2E] border-[#E76F2E] text-white'
              : 'border-[#333] text-[#888] hover:bg-[#E76F2E] hover:border-[#E76F2E] hover:text-white'
              }`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" />
              <rect x="1" y="7" width="14" height="2" />
              <rect x="1" y="12" width="14" height="2" />
            </svg>
            LIST
          </button>
        </div>

        {/* Mobile nav arrows */}
        {viewMode === 'slider' && isMobile && (
          <div className="flex gap-1.5">
            <button
              onClick={prevSlide}
              className="w-11 h-11 border border-[#333] text-white text-xl flex items-center justify-center transition-all hover:border-[#E76F2E] hover:text-[#E76F2E]"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="w-11 h-11 border border-[#333] text-white text-xl flex items-center justify-center transition-all hover:border-[#E76F2E] hover:text-[#E76F2E]"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Slider View */}
      {viewMode === 'slider' && (
        <>
          {!isMobile ? (
            // ── Desktop static slider ──────────────────────────────────────────
            <div
              ref={sliderWrapRef}
              className="w-full max-w-[1400px] overflow-hidden px-[30px] pb-10"
            >
              <div ref={trackRef} className="relative h-[590px]">
                {evidenceData.map((item, idx) => (
                  <div
                    key={item.id}
                    ref={(el) => (cardRefs.current[idx] = el)}
                    className="card absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-[4px] overflow-hidden border-2 border-transparent"
                    onMouseEnter={() => handleCardMouseEnter(idx)}
                    onMouseLeave={() => handleCardMouseLeave(idx)}
                    onClick={() => handleCardClick(item)}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-[3px]">
                      <img
                        src={item.img}
                        alt={item.title}
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 hover:scale-105 grayscale-[80%] brightness-60 hover:grayscale-[30%] hover:brightness-75"
                      />
                      <div className="absolute top-3 left-3 flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <span key={i} className="w-1 h-1 bg-[#E76F2E] opacity-70" />
                        ))}
                      </div>
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t border-r border-white/30 transition-colors duration-300 group-hover:border-[#E76F2E]" />
                      <span className="absolute top-1/2 right-3.5 -translate-y-1/2 rotate-90 text-[9px] tracking-[3px] text-[#E76F2E] uppercase whitespace-nowrap opacity-80">
                        {item.label}
                      </span>
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="cross-line cross-h absolute top-1/2 left-0 w-0 h-px -translate-y-1/2 bg-white/20" />
                        <div className="cross-line cross-h2 absolute top-1/2 right-0 w-0 h-px -translate-y-1/2 bg-white/20" />
                        <div className="cross-line cross-v absolute left-1/2 top-0 h-0 w-px -translate-x-1/2 bg-white/20" />
                        <div className="cross-line cross-v2 absolute left-1/2 bottom-0 h-0 w-px -translate-x-1/2 bg-white/20" />
                        <div className="cross-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 rotate-45 w-7 h-7 opacity-0">
                          <div className="absolute w-0.5 h-full left-1/2 top-0 -translate-x-1/2 bg-white/55" />
                          <div className="absolute h-0.5 w-full top-1/2 left-0 -translate-y-1/2 bg-white/55" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <div className="text-[10px] tracking-[2px] text-[#E76F2E] uppercase mb-1.5">
                          {item.number}
                        </div>
                        <div className="font-['Anton',sans-serif] text-3xl text-gray-300 leading-none transition-colors duration-300 group-hover:text-white">
                          {item.title}
                        </div>
                        <div className="h-0.5 bg-[#E76F2E] mt-2.5 scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
                        <div className="text-[9px] tracking-[2px] text-white/50 uppercase mt-2 opacity-0 translate-y-1 transition-all duration-300 delay-100 group-hover:opacity-100 group-hover:translate-y-0">
                          [ CLICK TO DECRYPT ]
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // ── Mobile infinite carousel ───────────────────────────────────────
            <div
              ref={carouselContainerRef}
              className="w-full overflow-hidden pb-10"
              style={{ touchAction: 'pan-y pinch-zoom' }}
              onPointerDown={handleCarouselPointerDown}
              onPointerMove={handleCarouselPointerMove}
              onPointerUp={handleCarouselPointerUp}
              onPointerCancel={handleCarouselPointerUp} // cancel = treat as pointer-up
            >
              {/*
               * FIX: The track is (extendedCount * 100)% of the CONTAINER,
               * and each slide is (100 / extendedCount)% of the TRACK,
               * so each slide = 100% of the container — i.e. full-width.
               * We move with gsap x in px (not %) so sizes are always exact.
               */}
              <div
                ref={carouselTrackRef}
                className="flex"
                style={{ width: `${extendedCount * 100}%` }}
              >
                {extendedData.map((item, idx) => (
                  <div
                    key={`carousel-${idx}`}
                    className="flex-shrink-0 flex justify-center items-center"
                    style={{ width: `${100 / extendedCount}%` }}
                  >
                    <div
                      className={`card w-[280px] h-[500px] rounded-[4px] overflow-hidden cursor-pointer border-2 border-transparent ${getRealIndex(idx) === activeRealIndex ? 'active' : ''
                        }`}
                      onClick={() => handleCardClick(item)}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={item.img}
                          alt={item.title}
                          draggable="false"
                          onDragStart={(e) => e.preventDefault()}
                          className="absolute inset-0 w-full h-full object-cover grayscale-[80%] brightness-60"
                        />
                        <div className="absolute top-3 left-3 flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className="w-1 h-1 bg-[#E76F2E] opacity-70" />
                          ))}
                        </div>
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t border-r border-white/30" />
                        <span className="absolute top-1/2 right-3.5 -translate-y-1/2 rotate-90 text-[9px] tracking-[3px] text-[#E76F2E] uppercase whitespace-nowrap opacity-80">
                          {item.label}
                        </span>
                        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                          <div className="text-[10px] tracking-[2px] text-[#E76F2E] uppercase mb-1.5">
                            {item.number}
                          </div>
                          <div className="font-['Anton',sans-serif] text-3xl text-gray-300 leading-none">
                            {item.title}
                          </div>
                          <div className="h-0.5 bg-[#E76F2E] mt-2.5" />
                          <div className="text-[9px] tracking-[2px] text-white/50 uppercase mt-2">
                            [ CLICK TO DECRYPT ]
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="w-full max-w-[1400px] px-[30px] pb-16 flex flex-col">
          {evidenceData.map((item, idx) => (
            <div
              key={item.id}
              ref={(el) => (listRowsRef.current[idx] = el)}
              className="relative h-32 overflow-hidden cursor-pointer border-b border-[#1e1e1e] opacity-0 translate-y-[18px] group"
              onClick={() => handleListClick(item)}
            >
              <img
                src={item.listImg}
                alt=""
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
                className="absolute inset-0 w-full h-full object-cover object-center grayscale-[85%] brightness-45 transition-all duration-500 group-hover:grayscale-[20%] group-hover:brightness-55 group-hover:scale-105"
              />
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#E76F2E] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 flex items-center px-6 bg-gradient-to-r from-black/80 via-black/30 to-black/60">
                <div className="flex items-center gap-5 flex-1">
                  <div className="flex flex-col gap-1">
                    {[...Array(4)].map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 bg-[#E76F2E] opacity-70 group-hover:opacity-100"
                      />
                    ))}
                  </div>
                  <div>
                    <div className="text-[9px] tracking-[3px] text-[#E76F2E] uppercase">
                      {item.number}
                    </div>
                    <div className="font-['Anton',sans-serif] text-4xl text-gray-400 leading-none transition-colors group-hover:text-white">
                      {item.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-7 shrink-0">
                  <span className="text-[10px] tracking-[3px] text-white/50 uppercase group-hover:text-white/85">
                    {item.category}
                  </span>
                  <span className="text-[9px] tracking-[2px] text-white/30 uppercase flex items-center gap-2 whitespace-nowrap opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white/60">
                    [ CLICK TO DECRYPT ]
                  </span>
                  <div className="w-6 h-6 border border-white/25 flex items-center justify-center text-sm text-white/40 transition-all group-hover:border-[#E76F2E] group-hover:text-[#E76F2E] group-hover:bg-[#E76F2E]/10">
                    →
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#E76F2E] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @property --rotate {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes borderSpin {
          from { --rotate: 0deg; }
          to { --rotate: 360deg; }
        }
        .card {
          background: linear-gradient(#111, #111) padding-box,
                      conic-gradient(from var(--rotate), #0a0a0a 0%, #0a0a0a 30%, rgba(231,111,46,0.55) 45%, #E76F2E 50%, rgba(231,111,46,0.55) 55%, #0a0a0a 70%, #0a0a0a 100%) border-box;
          animation: borderSpin 4s linear infinite;
          animation-play-state: paused;
        }
        .card.active {
          animation-play-state: running;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;