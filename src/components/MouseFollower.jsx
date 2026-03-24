import { useEffect, useState } from "react";

const MouseFollower = () => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isMouseSupported, setIsMouseSupported] = useState(false);

    useEffect(() => {
        const isFinePointer = window.matchMedia("(pointer: fine)").matches;
        if (!isFinePointer) {
            setIsMouseSupported(false);
            return;
        }

        setIsMouseSupported(true);

        const move = (e) => {
            setPos({
                x: e.clientX,
                y: e.clientY,
            });
        };

        window.addEventListener("mousemove", move);
        document.body.style.cursor = "none";

        return () => {
            window.removeEventListener("mousemove", move);
            document.body.style.cursor = "";
        };
    }, []);

    if (!isMouseSupported) return null;

    return (
        <>


            {/* Custom cursor dot */}
            <div
                className="fixed w-2 h-2 bg-accent-red md:block hidden pointer-events-none z-[9999]"
                style={{
                    left: pos.x,
                    top: pos.y,
                    transform: "translate(-50%, -50%)",
                }}
            />

            {/* Coordinates display */}
            <div
                className="fixed hidden md:block bg-black/70 bg-accent-red text-sm font-mono px-2 py-1 rounded pointer-events-none z-[9999] whitespace-nowrap"
                style={{
                    left: pos.x + 15,
                    top: pos.y + 15,
                }}
            >
                X: {pos.x} Y: {pos.y}
            </div>
        </>
    );
};

export default MouseFollower;