import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';

// ─── Icons (unchanged) ────────────────────────────────────────────────────────
const CompassStarIcon = () => (
    <svg viewBox="0 0 32 32" style={{ width: 28, height: 28, fill: '#F6F3E7', flexShrink: 0 }}>
        <path d="M16 0 L18.8 13.2 L32 16 L18.8 18.8 L16 32 L13.2 18.8 L0 16 L13.2 13.2 Z" />
        <circle cx="16" cy="16" r="3.5" fill="#18120F" />
    </svg>
);

const PlanetIconSVG = () => (
    <svg
        viewBox="0 0 24 24"
        style={{ width: 17, height: 17, flexShrink: 0 }}
        fill="none"
        stroke="rgba(246,243,231,0.65)"
        strokeWidth="1.6"
    >
        <circle cx="12" cy="12" r="7.5" />
        <ellipse cx="12" cy="12" rx="11.5" ry="3.5" strokeDasharray="2.5 2.5" />
    </svg>
);

// ─── Mars 3D Component (unchanged) ──────────────────────────────────────────
function Mars3D({ onReady }) {
    const groupRef = useRef();
    const readyFired = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const texPromise = new Promise((resolve, reject) => {
            new THREE.TextureLoader().load(
                '/marrs/textures/Material.002_diffuse.jpeg',
                resolve,
                undefined,
                reject
            );
        });

        const gltfPromise = new Promise((resolve, reject) => {
            new GLTFLoader().load('/marrs/scene.gltf', resolve, undefined, reject);
        });

        Promise.all([texPromise, gltfPromise])
            .then(([texture, gltf]) => {
                if (cancelled) return;

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.needsUpdate = true;

                const model = gltf.scene;
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: texture,
                            roughness: 0.88,
                            metalness: 0.05,
                        });
                        child.material.needsUpdate = true;
                    }
                });

                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                const center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);
                model.position.sub(center);
                const maxDim = Math.max(size.x, size.y, size.z);
                model.scale.setScalar(2 / maxDim);

                if (groupRef.current) {
                    groupRef.current.add(model);
                }

                if (!readyFired.current) {
                    readyFired.current = true;
                    onReady?.();
                }
            })
            .catch((err) => {
                console.error('Mars3D load error:', err);
            });

        return () => {
            cancelled = true;
            if (groupRef.current) {
                [...groupRef.current.children].forEach((c) => groupRef.current.remove(c));
            }
        };
    }, []);

    return (
        <>
            <directionalLight position={[-3, 4.5, 3]} intensity={3.4} color="#FFCF92" />
            <directionalLight position={[4, -2, 1]} intensity={0.2} color="#FF7A2F" />
            <ambientLight intensity={0.05} color="#FF9055" />
            <group ref={groupRef} scale={1.7} />
        </>
    );
}

// ─── Main Hero Page with Tailwind CSS ────────────────────────────────────────
export default function HeroPage() {
    const topNavRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const headingRef = useRef(null);
    const bottomLeftRef = useRef(null);
    const buttonRef = useRef(null);
    const bottomRightRef = useRef(null);

    const handleMarsReady = () => {
        gsap.fromTo(
            topNavRef.current,
            { opacity: 0, x: -28 },
            { opacity: 1, x: 0, duration: 1.0, ease: 'power2.out', delay: 0.1 }
        );

        gsap.fromTo(
            canvasWrapperRef.current,
            { opacity: 0, scale: 0.97 },
            { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', delay: 0.2 }
        );

        gsap.fromTo(
            headingRef.current,
            { opacity: 0, y: 44 },
            { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.5 }
        );

        gsap.fromTo(
            [bottomLeftRef.current, buttonRef.current, bottomRightRef.current],
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 1.0, stagger: 0.15, ease: 'power2.out', delay: 0.9 }
        );
    };

    // Global styles for reset and nav fix – include these in your main CSS file
    // or add a <style> tag in the component if preferred.
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      body, html {
        background-color: #18120F;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }
      /* Fix for Nav.jsx conflict */
      body > #root > nav,
      body > #root > header {
        position: fixed !important;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: transparent !important;
        pointer-events: none;
      }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    return (
        <div
            className="min-h-screen w-screen mx-[calc(50%-50vw)] bg-[#18120F] relative flex flex-col items-center overflow-hidden z-10"
        >
            {/* Top Nav */}
            <div
                ref={topNavRef}
                className="absolute top-[40px] left-[5vw] right-[5vw] flex items-center gap-4 z-10 opacity-0"
            >
                <CompassStarIcon />
                <div className="h-px flex-1 bg-[rgba(246,243,231,0.3)]" />
            </div>

            {/* Canvas Wrapper with radial gradient via ::after */}
            <div
                ref={canvasWrapperRef}
                className="relative w-[95vw] max-w-[1200px] h-[62vw] max-h-[860px] mt-[100px]  z-5 opacity-0
                   after:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_90%_48%_at_50%_100%,#18120F_0%,transparent_62%)] after:pointer-events-none after:z-2
                   lg:w-[82vw] lg:h-[76vw]
                   max-md:w-[100vw] max-md:h-[96vw] max-md:mt-[70px] max-md:mt-[250px]"
            >
                <Canvas
                    camera={{ position: [0, 0, 4], fov: 50 }}
                    gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
                    style={{ background: 'transparent', width: '100%', height: '100%', scale: 0.95 }}
                >
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={true}
                        zoomSpeed={1.0}
                        rotateSpeed={0.8}
                        panSpeed={0.8}
                        target={[0, 0, 0]}
                    />
                    <Mars3D onReady={handleMarsReady} />
                </Canvas>
            </div>

            {/* Heading */}
            <h1
                ref={headingRef}
                className="font-['Orbitron','Russo_One',sans-serif] text-[clamp(48px,10vw,200px)] font-black text-[#F6F3E7] tracking-[-0.04em] leading-none uppercase  z-20 opacity-0 text-center font-extrabold
         lg:text-[15vw]  lg:-mt-[170vh] xl:-mt-[60vh] xl:text-[15vw] 2xl:text-[10vw]
        max-md:text-7xl max-md:-mt-[250px]"
            >
                MARS
            </h1>

            {/* Bottom Row */}
            <div
                className="absolute bottom-[48px] left-[5vw] right-[5vw] flex justify-between items-center z-10
                   max-md:flex-col max-md:gap-6 max-md:relative max-md:bottom-auto max-md:mt-auto max-md:pb-8"
            >
                <div
                    ref={bottomLeftRef}
                    className="flex items-center gap-2.5 opacity-0 [&_.text]:font-['Inter'] [&_.text]:text-[15px] [&_.text]:font-normal [&_.text]:text-[rgba(246,243,231,0.6)] [&_.text]:whitespace-nowrap [&_.text]:tracking-[0.01em]"
                >
                    <div className="w-3 h-3 border-2 border-[rgba(246,243,231,0.55)] rounded-full flex-shrink-0" />
                    <span className="text">Phobos &amp; Deimos</span>
                </div>

                <div
                    ref={buttonRef}
                    className="opacity-0 -ml-[100px] max-md:w-full"
                >
                    <button
                        className="bg-[#F6F3E7] text-[#18120F] font-['Inter'] text-[15px] font-medium py-3 px-[34px] rounded-full border-none cursor-pointer
                       transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(246,243,231,0.18)]
                       flex items-center justify-center tracking-wide max-md:w-full  max-md:ml-[10vw] "
                    >
                        Explore Surface
                    </button>
                </div>

                <div
                    ref={bottomRightRef}
                    className="flex items-center gap-2 opacity-0 [&_.text]:font-['Inter'] [&_.text]:text-[14px] [&_.text]:font-normal [&_.text]:text-[rgba(246,243,231,0.6)] [&_.text]:whitespace-nowrap [&_.text]:tracking-wide"
                >
                    <span className="text">0.107 M</span>
                    <PlanetIconSVG />
                </div>
            </div>
        </div>
    );
}