import React, { useRef, useState, useEffect } from 'react';
import { useWindowScroll } from 'react-use';
import { gsap } from 'gsap';

const navItems = ["Launch", "Space Travel", "Landing", "Exploration"];

const Nav = () => {
  const [isAudioPlaying, setAudioPlaying] = useState(false);
  const [isIndicatorActive, setIndicatorActive] = useState(false);
  const navContainerRef = useRef(null);
  const audioElementRef = useRef(null);

  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setNavVisible] = useState(true);
  const { y: currentScrollY } = useWindowScroll();

  const toggleAudioIndicator = () => {
    setAudioPlaying(prev => !prev);
    setIndicatorActive(prev => !prev);
  };

  useEffect(() => {
    if (currentScrollY === 0) {
      setNavVisible(true);
      navContainerRef.current?.classList.remove("floating-nav");
    } else if (currentScrollY > lastScrollY) {
      setNavVisible(false);
      navContainerRef.current?.classList.add("floating-nav");
    } else if (currentScrollY < lastScrollY) {
      setNavVisible(true);
      navContainerRef.current?.classList.remove("floating-nav");
    }
    setLastScrollY(currentScrollY);
  }, [currentScrollY, lastScrollY]);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      duration: 0.2,
      opacity: isNavVisible ? 1 : 0,
      ease: "power2.out",
    });
  }, [isNavVisible]);

  useEffect(() => {
    if (isAudioPlaying) {
      audioElementRef.current?.play();
    } else {
      audioElementRef.current?.pause();
    }
  }, [isAudioPlaying]);

  return (
    <div
      ref={navContainerRef}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="w-full max-w-7xl">
        <nav className="flex w-full items-center justify-between py-2">
          <div className="flex items-center gap-7">
            <img className="size-10" src="/marslogo.png" alt="Mars Logo" />
          </div>
          <div className="flex h-full items-center">
            <div className="hidden md:flex gap-6">
              {navItems.map(item => (
                <a key={item} className="nav-hover-btn" href="#">
                  {item}
                </a>
              ))}
            </div>
            <button
              className="ml-10 flex items-center space-x-0.5"
              onClick={toggleAudioIndicator}
            >
              <audio ref={audioElementRef} className="hidden" src="Audio/loop.mp3" loop />
              {[1, 2, 3, 4].map(bar => (
                <div
                  key={bar}
                  className={`indicator-line ${isIndicatorActive ? "active" : ""}`}
                  style={{ animationDelay: `${bar * 0.1}s` }}
                />
              ))}
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Nav;