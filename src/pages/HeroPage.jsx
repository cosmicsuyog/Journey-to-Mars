import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

const defaultChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const HeroPage = () => {
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const canvasRef = useRef(null);

    // --- Star field animation (canvas) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        const STAR_COUNT = 300;
        const MAX_OFFSET = 40;
        let mouseX = 0.5;
        let mouseY = 0.5;
        let animationId;

        const stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.3,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
            });
        }

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            for (let i = 0; i < stars.length; i++) {
                stars[i].x = (stars[i].x / (canvas.width || 1)) * width;
                stars[i].y = (stars[i].y / (canvas.height || 1)) * height;
            }
        };

        const handleMouseMove = (e) => {
            mouseX = e.clientX / width;
            mouseY = e.clientY / height;
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const offsetX = (mouseX - 0.5) * MAX_OFFSET * 2;
            const offsetY = (mouseY - 0.5) * MAX_OFFSET * 2;

            for (let star of stars) {
                star.x += star.vx;
                star.y += star.vy;
                if (star.x < 0) star.x = width;
                if (star.x > width) star.x = 0;
                if (star.y < 0) star.y = height;
                if (star.y > height) star.y = 0;

                if (Math.random() < 0.01) {
                    star.vx += (Math.random() - 0.5) * 0.1;
                    star.vy += (Math.random() - 0.5) * 0.1;
                    star.vx = Math.min(Math.max(star.vx, -0.5), 0.5);
                    star.vy = Math.min(Math.max(star.vy, -0.5), 0.5);
                }

                const drawX = star.x + offsetX;
                const drawY = star.y + offsetY;
                ctx.beginPath();
                ctx.arc(drawX, drawY, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
                ctx.fill();
            }
            animationId = requestAnimationFrame(animate);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    // --- GSAP text reveal ---
    useEffect(() => {
        const animateReveal = () => {
            const titleEl = titleRef.current;
            const subtitleEl = subtitleRef.current;
            if (!titleEl || !subtitleEl) return;

            const titleSplit = new SplitText(titleEl, { type: 'chars' });
            const titleChars = titleSplit.chars;

            const tl = gsap.timeline({ delay: 0.5 });
            tl.to('.hero-content', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power1.inOut',
            })
            .to('.hero-text-scroll', {
                duration: 1,
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                ease: 'circ.out',
            }, '-=0.5')
            .from(titleChars, {
                yPercent: 200,
                stagger: 0.02,
                duration: 0.8,
                ease: 'power2.out',
            }, '-=0.5');

            return () => titleSplit.revert();
        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(animateReveal);
        } else {
            animateReveal();
        }
    }, []);

    // --- Scramble effect on hover/focus ---
    useEffect(() => {
        const titleEl = titleRef.current;
        const subtitleEl = subtitleRef.current;
        if (!titleEl || !subtitleEl) return;

        const handleScramble = (e) => {
            const target = e.currentTarget;
            if (!gsap.isTweening(target) && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
                gsap.to(target, {
                    duration: 0.8,
                    ease: 'sine.in',
                    scrambleText: {
                        text: target.innerText,
                        speed: 2,
                        chars: defaultChars,
                    },
                });
            }
        };

        titleEl.addEventListener('mouseenter', handleScramble);
        titleEl.addEventListener('focus', handleScramble);
        subtitleEl.addEventListener('mouseenter', handleScramble);
        subtitleEl.addEventListener('focus', handleScramble);

        return () => {
            titleEl.removeEventListener('mouseenter', handleScramble);
            titleEl.removeEventListener('focus', handleScramble);
            subtitleEl.removeEventListener('mouseenter', handleScramble);
            subtitleEl.removeEventListener('focus', handleScramble);
        };
    }, []);

    // --- Mouse‑following effect for title and subtitle ---
    useEffect(() => {
        const title = titleRef.current;
        const subtitle = subtitleRef.current;
        if (!title || !subtitle) return;

        const handleMouseMove = (e) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            // Map mouse position to offset between -15px and 15px
            const offsetX = ((e.clientX - centerX) / centerX) * 15;
            const offsetY = ((e.clientY - centerY) / centerY) * 15;
            title.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
            subtitle.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <main className="w-full h-dvh flex justify-center items-center md:h-screen mx-auto overflow-hidden relative">
            {/* Star field canvas */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ zIndex: 5 }}
            />

            {/* Background GIF */}
            <img
                src="https://i.pinimg.com/originals/57/d0/4e/57d04ec2fb7c183adfe167887718bede.gif"
                alt="Mars background"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 object-auto scale-150 md:scale-180 mix-blend-screen pointer-events-none"
                style={{ zIndex: 1 }}
            />

            {/* Main content */}
            <div className="hero-container relative z-10">
                <div
                    className="hero-content text-center"
                    style={{ opacity: 0, transform: 'translateY(20px)' }}
                >
                    <div className="overflow-hidden">
                        <h1
                            ref={titleRef}
                            className="hero-title font-mono font-extrabold"
                            tabIndex={0}
                        >
                            Journey to
                        </h1>
                    </div>

                    <div
                        style={{
                            clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
                        }}
                        className="hero-text-scroll"
                    >
                        <div className="hero-subtitle font-mono font-extrabold text-red">
                            <h1
                                ref={subtitleRef}
                                className="text-nowrap"
                                tabIndex={0}
                            >
                                Mars
                            </h1>
                        </div>
                    </div>

                    <h2 className="font-mono">
                        Fuel your ambition with the legendary spaceship that refreshes your soul and keeps you moving forward
                    </h2>
                </div>
            </div>
        </main>
    );
};

export default HeroPage;