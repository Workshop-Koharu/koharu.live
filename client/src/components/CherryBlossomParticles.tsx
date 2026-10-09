/**
 * CherryBlossomParticles — Mouse-reactive cherry blossom particle canvas.
 * Pure Canvas 2D, no external dependencies. Renders full-screen behind content.
 */
import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  swayOffset: number;
  swaySpeed: number;
  color: string;
}

const COLORS = [
  "#ffb7c5",
  "#ffc0cb",
  "#ff9eb5",
  "#f8d7da",
  "#ffd4e8",
  "#ffadd2",
  "#fce4ec",
  "#f48fb1",
];

function makePetal(canvasW: number, canvasH: number): Petal {
  return {
    x: Math.random() * canvasW,
    y: -20 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 0.4 + Math.random() * 0.8,
    size: 4 + Math.random() * 8,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.04,
    opacity: 0.55 + Math.random() * 0.45,
    swayOffset: Math.random() * Math.PI * 2,
    swaySpeed: 0.01 + Math.random() * 0.01,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.opacity;

  ctx.beginPath();
  // draw a simple cherry-blossom petal (two bezier curves)
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, -p.size * 1.5, 0, -p.size * 2);
  ctx.bezierCurveTo(p.size, -p.size * 1.5, p.size / 2, -p.size / 2, 0, 0);

  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.restore();
}

export default function CherryBlossomParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const PETAL_COUNT = 60;
    const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () =>
      makePetal(width, height)
    );

    // Initialize petals randomly positioned on screen
    petals.forEach((p, i) => {
      if (i < PETAL_COUNT / 2) {
        p.y = Math.random() * height;
      }
    });

    let mouseX = width / 2;
    let mouseY = height / 2;
    let frame = 0;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    const tick = () => {
      animId = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, width, height);

      frame++;

      for (const p of petals) {
        // Wind influence from mouse position
        const dx = (mouseX - width / 2) / width;
        const windX = dx * 0.3;

        // Sway motion
        const sway = Math.sin(frame * p.swaySpeed + p.swayOffset) * 0.5;

        p.x += p.vx + sway + windX;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Repel from mouse
        const mx = p.x - mouseX;
        const my = p.y - mouseY;
        const dist = Math.sqrt(mx * mx + my * my);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.vx += (mx / dist) * force * 0.5;
          p.vy += (my / dist) * force * 0.3;
        }

        // Dampen velocity drift
        p.vx *= 0.99;
        if (p.vy < 0.4) p.vy = 0.4;

        // Recycle petal
        if (p.y > height + 30 || p.x < -50 || p.x > width + 50) {
          Object.assign(p, makePetal(width, height));
        }

        drawPetal(ctx, p);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85,
      }}
      aria-hidden="true"
    />
  );
}
