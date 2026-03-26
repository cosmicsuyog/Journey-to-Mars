import React, { useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import gsap from 'gsap';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: #0A0A0A;
    color: #FFFFFF;
    font-family: 'Orbitron', Arial, sans-serif;
    overflow: hidden;
  }
`;

const DashboardLayout = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #0A0A0A;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 1199px) {
    transform: scale(0.8);
  }

  @media (max-width: 767px) {
    flex-direction: column;
    transform: scale(1);
  }
`;

const NoiseBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.08;
  pointer-events: none;
  z-index: 1;
  background-image: url('https://www.transparenttextures.com/patterns/dark-matter.png');
  background-repeat: repeat;
`;

const SignalGraphContainer = styled.div`
  position: relative;
  width: 80vw;
  max-width: 1000px;
  height: 280px;
  z-index: 10;
  
  @media (max-width: 767px) {
    width: 90%;
    height: 300px;
  }
`;

const TopLabels = styled.div`
  position: absolute;
  top: -24px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #E76F2E;
  font-weight: 500;
  z-index: 5;
`;

const BoundingBoxWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(231, 111, 46, 0.3);
  z-index: 1;
`;

const CornerTick = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  border: 0 solid #E76F2E;
  
  &.tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
  &.tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; }
  &.bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; }
  &.br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; }
`;

const GridLine = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: rgba(34, 34, 34, 0.5);
  z-index: 2;

  &.top { top: 33%; }
  &.bottom { top: 66%; }
`;

const WaveformWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100vw;
  transform: translate(-50%, -50%);
  height: 80px;
  z-index: 3;
  
  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 8px #E76F2E);
  }
`;

const CenterContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SignalTracingBox = styled.div`
  background: rgba(10, 10, 10, 0.7);
  border: 1px solid #FFFFFF;
  padding: 8px 24px;
  border-radius: 2px;
  margin-bottom: -15px; /* Brings it visually closer to the percentage to match screenshot */
  transition: border-color 0.2s ease;
  position: relative;
  z-index: 25;

  &:hover {
    border-color: #E76F2E;
  }
  
  h2 {
    font-size: 18px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #FFFFFF;
  }
`;

const PercentageText = styled.h1`
  font-size: 96px;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
  z-index: 20;
  margin: 0;
  padding: 0;
  line-height: 1;

  @media (max-width: 767px) {
    font-size: 64px;
  }
`;

/* SIDEBAR RIGHT */
const SidebarContainer = styled.div`
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 20;

  @media (max-width: 767px) {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    align-items: center;
    margin-top: 40px;
  }
`;

const CircularProgress = styled.div`
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  
  svg {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
  }
  circle {
    fill: transparent;
    stroke: #E76F2E;
    stroke-width: 3;
  }
  .progress {
    stroke-dasharray: 113; /* Circumference array for sweep */
    stroke-dashoffset: 113; /* Initial hidden */
  }
`;

const LatLabel = styled.div`
  font-size: 12px;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.7;
`;

const EncryptedBadgeBox = styled.div`
  background-color: #E76F2E;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 16px;
  border-radius: 2px;
  margin-top: 8px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  cursor: default;

  &:hover {
    background-color: #FFFFFF;
    color: #E76F2E;
  }
`;

const NumberStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 12px;
  color: #FFFFFF;
  opacity: 0.7;
  letter-spacing: 0.08em;

  @media (max-width: 767px) {
    align-items: center;
  }
`;

/* SYSTEM STATUS LEFT */
const SystemStatusContainer = styled.div`
  position: absolute;
  bottom: 48px;
  left: 48px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 20;

  @media (max-width: 767px) {
    position: relative;
    bottom: auto;
    left: auto;
    margin-top: 40px;
    align-self: flex-start;
    padding-left: 24px;
  }
`;

const StatusItem = styled.div`
  font-size: 14px;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  &.highlight {
    color: #E76F2E;
  }
`;

const statusLinesData = [
  { id: 1, text: "INIT_SEQ_99", highlight: true },
  { id: 2, text: "BYPASSING_FIREWALL", highlight: false },
  { id: 3, text: "ANALYZING_BIOMETRICS", highlight: false },
  { id: 4, text: "DECRYPTING_DRIVE_C", highlight: false },
  { id: 5, text: "RESOLVING_HOST", highlight: false }
];

export default function Loader({ duration = 3, onComplete }) {
  const wavePathRef = useRef(null);
  const signalBoxRef = useRef(null);
  const percentRef = useRef(null);
  const circleRef = useRef(null);
  const statusRefs = useRef([]);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // 1. Waveform - left to right draw effect
    if (wavePathRef.current) {
      const length = wavePathRef.current.getTotalLength();
      gsap.set(wavePathRef.current, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(wavePathRef.current, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: "power2.out"
      });
    }

    // 2. SIGNAL TRACING... Box fades in and slides up
    if (signalBoxRef.current) {
       gsap.fromTo(signalBoxRef.current,
         { opacity: 0, y: 24 },
         { opacity: 1, y: 0, duration: 0.6, delay: 0.8, ease: "power2.out" }
       );
    }

    // 3. Percentage scales and fades in
    if (percentRef.current) {
       gsap.fromTo(percentRef.current,
         { opacity: 0, scale: 0.8 },
         { opacity: 1, scale: 1, duration: 0.7, delay: 1.0, ease: "power2.out" }
       );
    }

    // Interpolate counter to 100
    gsap.to({ val: 0 }, {
      val: 100,
      duration: duration,
      delay: 1.0,
      ease: "power1.inOut",
      onUpdate: function() {
        setPercentage(Math.floor(this.targets()[0].val));
      },
      onComplete: () => {
        if(onComplete) onComplete();
      }
    });

    // 4. Sidebar Arc sweep 0 to 25%
    if (circleRef.current) {
       gsap.to(circleRef.current, {
         strokeDashoffset: 84.75, // 113 - (113 * 0.25)
         duration: 1.0,
         delay: 1.2,
         ease: "power2.out"
       });
    }

    // 5. System status lines fade in sequentially
    if (statusRefs.current.length > 0) {
       gsap.fromTo(statusRefs.current,
         { opacity: 0, x: -10 },
         { opacity: 1, x: 0, duration: 0.4, stagger: 0.2, delay: 1.4, ease: "power2.out" }
       );
    }

  }, [duration, onComplete]);

  return (
    <>
      <GlobalStyle />
      <DashboardLayout>
        <NoiseBg />
        
        <SignalGraphContainer>
          <BoundingBoxWrapper>
             <CornerTick className="tl" />
             <CornerTick className="tr" />
             <CornerTick className="bl" />
             <CornerTick className="br" />
             <GridLine className="top" />
             <GridLine className="bottom" />
          </BoundingBoxWrapper>
          
          <TopLabels>
             <div className="left">X:243 Y:0</div>
             <div className="right">FREQ 24.9 Hz</div>
          </TopLabels>

          <WaveformWrapper>
            <svg viewBox="0 0 2000 100" preserveAspectRatio="none">
              <path
                ref={wavePathRef}
                d="M0,50 L20,48 L35,55 L50,45 L65,60 L80,40 L95,50 L120,45 L135,55 L150,35 L170,60 L190,40 L210,50 L230,45 L250,55 L280,30 L300,60 L320,45 L350,55 L380,40 L400,50 L420,45 L440,60 L460,35 L480,50 L500,45 L520,55 L540,40 L560,50 L580,35 L600,60 L620,40 L650,50 L680,40 L700,60 L720,45 L740,55 L760,40 L780,50 L800,45 L820,60 L840,35 L860,50 L880,45 L900,55 L920,40 L940,50 L960,45 L980,55 L1000,50 L1020,48 L1035,55 L1050,45 L1065,60 L1080,40 L1095,50 L1120,45 L1135,55 L1150,35 L1170,60 L1190,40 L1210,50 L1230,45 L1250,55 L1280,30 L1300,60 L1320,45 L1350,55 L1380,40 L1400,50 L1420,45 L1440,60 L1460,35 L1480,50 L1500,45 L1520,55 L1540,40 L1560,50 L1580,35 L1600,60 L1620,40 L1650,50 L1680,40 L1700,60 L1720,45 L1740,55 L1760,40 L1780,50 L1800,45 L1820,60 L1840,35 L1860,50 L1880,45 L1900,55 L1920,40 L1940,50 L1960,45 L1980,55 L2000,50"
                fill="none"
                stroke="#E76F2E"
                strokeWidth="3"
                strokeLinejoin="miter"
              />
            </svg>
          </WaveformWrapper>

          <CenterContent>
             <SignalTracingBox ref={signalBoxRef}>
               <h2>SIGNAL TRACING...</h2>
             </SignalTracingBox>
             <PercentageText ref={percentRef}>{percentage}%</PercentageText>
          </CenterContent>
        </SignalGraphContainer>

        <SidebarContainer>
           <CircularProgress>
              <svg viewBox="0 0 40 40">
                 <circle cx="20" cy="20" r="18" />
                 <circle className="progress" cx="20" cy="20" r="18" ref={circleRef} />
              </svg>
           </CircularProgress>
           <LatLabel>LAT: 45.0802 N</LatLabel>
           <EncryptedBadgeBox>ENCRYPTED</EncryptedBadgeBox>
           <NumberStack>
              <div>57 37 10 25</div>
              <div>68  8 73 81</div>
              <div>78 34 18 54</div>
              <div> 1 59 91 62</div>
           </NumberStack>
        </SidebarContainer>

        <SystemStatusContainer>
           {statusLinesData.map((item, index) => (
             <StatusItem 
                key={item.id} 
                className={item.highlight ? 'highlight' : ''}
                ref={el => statusRefs.current[index] = el}
             >
                <span>&gt;</span> {item.text}
             </StatusItem>
           ))}
        </SystemStatusContainer>

      </DashboardLayout>
    </>
  );
}