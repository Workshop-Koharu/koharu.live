/**
 * TetrisPage — Full-featured Tetris with tetr.io-inspired visuals.
 * Features: hold, ghost piece, wall kicks, levels, scoring, particle effects.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";

// ── Constants ────────────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const CELL = 32;
const PREVIEW_CELL = 24;

const COLORS: Record<string, string> = {
  I: "#00d8ff",
  O: "#ffd700",
  T: "#bf5af2",
  S: "#30d158",
  Z: "#ff453a",
  J: "#0a84ff",
  L: "#ff9f0a",
  GHOST: "rgba(255,255,255,0.12)",
  EMPTY: "transparent",
};

const TETROMINOES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const PIECES = Object.keys(TETROMINOES);

function rotatePiece(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function emptyBoard(): string[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
}

function randomPiece(): { type: string; matrix: number[][] } {
  const type = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { type, matrix: TETROMINOES[type] };
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Piece {
  type: string;
  matrix: number[][];
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

// ── Collision ─────────────────────────────────────────────────────────────────
function collides(board: string[][], piece: Piece, dx = 0, dy = 0): boolean {
  const { matrix, x, y } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const nx = x + c + dx;
      const ny = y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function lockPiece(board: string[][], piece: Piece): string[][] {
  const next = board.map((row) => [...row]);
  const { matrix, x, y, type } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const ny = y + r;
      const nx = x + c;
      if (ny >= 0) next[ny][nx] = type;
    }
  }
  return next;
}

function clearLines(board: string[][]): { board: string[][]; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => !cell));
  const cleared = ROWS - kept.length;
  const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(""));
  return { board: [...newRows, ...kept], cleared };
}

function calcGhost(board: string[][], piece: Piece): Piece {
  let ghost = { ...piece };
  while (!collides(board, ghost, 0, 1)) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return { ...ghost, type: "GHOST" };
}

// Scoring
const LINE_SCORES = [0, 100, 300, 500, 800];
const DROP_INTERVAL = (level: number) => Math.max(100, 800 - level * 70);

// ── Canvas draw helper ────────────────────────────────────────────────────────
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  cellSize: number,
  isGhost = false
) {
  const px = x * cellSize;
  const py = y * cellSize;
  const pad = 1;

  if (isGhost) {
    ctx.fillStyle = COLORS.GHOST;
    ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, cellSize - pad * 2 - 1, cellSize - pad * 2 - 1);
    return;
  }

  // Main fill with gradient
  const grad = ctx.createLinearGradient(px, py, px + cellSize, py + cellSize);
  grad.addColorStop(0, color + "ee");
  grad.addColorStop(1, color + "99");
  ctx.fillStyle = grad;
  ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2);

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(px + pad, py + pad, cellSize - pad * 2, 4);

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, cellSize - pad * 2 - 1, cellSize - pad * 2 - 1);
}

function spawnParticles(
  particles: React.MutableRefObject<Particle[]>,
  lineY: number,
  color: string
) {
  for (let i = 0; i < 20; i++) {
    particles.current.push({
      x: Math.random() * COLS * CELL,
      y: lineY * CELL + CELL / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 5 - 1,
      alpha: 1,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TetrisPage() {
  const boardCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [clearFlash, setClearFlash] = useState(false);

  // Game state refs (avoid re-renders in game loop)
  const boardRef = useRef<string[][]>(emptyBoard());
  const pieceRef = useRef<Piece>({ ...randomPiece(), x: 3, y: 0 });
  const nextPieceRef = useRef(randomPiece());
  const holdPieceRef = useRef<{ type: string; matrix: number[][] } | null>(null);
  const holdUsedRef = useRef(false);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const lastDropRef = useRef(0);
  const pausedRef = useRef(false);
  const gameOverRef = useRef(false);
  const animIdRef = useRef<number>(0);

  const spawnNext = useCallback(() => {
    const next = nextPieceRef.current;
    const startX = Math.floor((COLS - next.matrix[0].length) / 2);
    const piece: Piece = { ...next, x: startX, y: 0 };

    nextPieceRef.current = randomPiece();
    holdUsedRef.current = false;

    if (collides(boardRef.current, piece)) {
      gameOverRef.current = true;
      setGameOver(true);
      return null;
    }
    return piece;
  }, []);

  const lockAndSpawn = useCallback(() => {
    const piece = pieceRef.current;
    const newBoard = lockPiece(boardRef.current, piece);
    const { board: clearedBoard, cleared } = clearLines(newBoard);

    boardRef.current = clearedBoard;

    if (cleared > 0) {
      // Particles for cleared lines
      const clearColor = COLORS[piece.type] || "#ff9f0a";
      for (let i = 0; i < cleared; i++) {
        const y = ROWS - 1 - i;
        spawnParticles(particlesRef, y, clearColor);
      }

      setClearFlash(true);
      setTimeout(() => setClearFlash(false), 200);

      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      setCombo(newCombo);

      const pts = (LINE_SCORES[cleared] || 0) * levelRef.current * (newCombo > 1 ? newCombo : 1);
      scoreRef.current += pts;
      linesRef.current += cleared;

      const newLevel = Math.floor(linesRef.current / 10) + 1;
      levelRef.current = newLevel;

      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(newLevel);
    } else {
      comboRef.current = 0;
      setCombo(0);
    }

    const next = spawnNext();
    if (next) pieceRef.current = next;
  }, [spawnNext]);

  const moveLeft = useCallback(() => {
    if (!collides(boardRef.current, pieceRef.current, -1, 0)) {
      pieceRef.current = { ...pieceRef.current, x: pieceRef.current.x - 1 };
    }
  }, []);

  const moveRight = useCallback(() => {
    if (!collides(boardRef.current, pieceRef.current, 1, 0)) {
      pieceRef.current = { ...pieceRef.current, x: pieceRef.current.x + 1 };
    }
  }, []);

  const moveDown = useCallback(() => {
    if (!collides(boardRef.current, pieceRef.current, 0, 1)) {
      pieceRef.current = { ...pieceRef.current, y: pieceRef.current.y + 1 };
    } else {
      lockAndSpawn();
    }
  }, [lockAndSpawn]);

  const hardDrop = useCallback(() => {
    const ghost = calcGhost(boardRef.current, pieceRef.current);
    scoreRef.current += (ghost.y - pieceRef.current.y) * 2;
    setScore(scoreRef.current);
    pieceRef.current = { ...pieceRef.current, y: ghost.y };
    lockAndSpawn();
  }, [lockAndSpawn]);

  const rotate = useCallback(() => {
    const rotated = rotatePiece(pieceRef.current.matrix);
    const attempt = { ...pieceRef.current, matrix: rotated };
    // Wall kicks: try offsets
    const kicks = [0, -1, 1, -2, 2];
    for (const dx of kicks) {
      if (!collides(boardRef.current, attempt, dx, 0)) {
        pieceRef.current = { ...attempt, x: attempt.x + dx };
        return;
      }
    }
  }, []);

  const holdPiece = useCallback(() => {
    if (holdUsedRef.current) return;
    holdUsedRef.current = true;

    const current = { type: pieceRef.current.type, matrix: TETROMINOES[pieceRef.current.type] };
    const prev = holdPieceRef.current;
    holdPieceRef.current = current;

    if (prev) {
      const startX = Math.floor((COLS - prev.matrix[0].length) / 2);
      pieceRef.current = { ...prev, x: startX, y: 0 };
    } else {
      const next = spawnNext();
      if (next) pieceRef.current = next;
    }
  }, [spawnNext]);

  // Draw mini preview canvas
  const drawPreview = useCallback(
    (canvas: HTMLCanvasElement | null, piece: { type: string; matrix: number[][] } | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!piece) return;

      const offX = Math.floor((canvas.width / PREVIEW_CELL - piece.matrix[0].length) / 2);
      const offY = Math.floor((canvas.height / PREVIEW_CELL - piece.matrix.length) / 2);
      const color = COLORS[piece.type];

      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c]) {
            drawCell(ctx, offX + c, offY + r, color, PREVIEW_CELL);
          }
        }
      }
    },
    []
  );

  // Main draw function
  const draw = useCallback(
    (timestamp: number) => {
      const canvas = boardCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Auto drop
      if (!pausedRef.current && !gameOverRef.current) {
        const interval = DROP_INTERVAL(levelRef.current);
        if (timestamp - lastDropRef.current > interval) {
          lastDropRef.current = timestamp;
          if (!collides(boardRef.current, pieceRef.current, 0, 1)) {
            pieceRef.current = { ...pieceRef.current, y: pieceRef.current.y + 1 };
          } else {
            lockAndSpawn();
          }
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Board background
      ctx.fillStyle = "#0d0520";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(COLS * CELL, r * CELL);
        ctx.stroke();
      }
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, ROWS * CELL);
        ctx.stroke();
      }

      // Draw board
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = boardRef.current[r][c];
          if (cell) {
            drawCell(ctx, c, r, COLORS[cell] || "#fff", CELL);
          }
        }
      }

      // Draw ghost
      if (!gameOverRef.current) {
        const ghost = calcGhost(boardRef.current, pieceRef.current);
        const { matrix, x, y } = ghost;
        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] && y + r >= 0) {
              drawCell(ctx, x + c, y + r, "", CELL, true);
            }
          }
        }
      }

      // Draw active piece
      if (!gameOverRef.current) {
        const { matrix, x, y, type } = pieceRef.current;
        const color = COLORS[type];
        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] && y + r >= 0) {
              drawCell(ctx, x + c, y + r, color, CELL);
            }
          }
        }
      }

      // Particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.alpha *= 0.92;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw previews
      drawPreview(holdCanvasRef.current, holdPieceRef.current);
      drawPreview(nextCanvasRef.current, nextPieceRef.current);

      animIdRef.current = requestAnimationFrame(draw);
    },
    [lockAndSpawn, drawPreview]
  );

  // Start game
  const startGame = useCallback(() => {
    boardRef.current = emptyBoard();
    const first = randomPiece();
    const startX = Math.floor((COLS - first.matrix[0].length) / 2);
    pieceRef.current = { ...first, x: startX, y: 0 };
    nextPieceRef.current = randomPiece();
    holdPieceRef.current = null;
    holdUsedRef.current = false;
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    comboRef.current = 0;
    gameOverRef.current = false;
    pausedRef.current = false;
    particlesRef.current = [];
    lastDropRef.current = 0;

    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);

    cancelAnimationFrame(animIdRef.current);
    animIdRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Keyboard controls
  useEffect(() => {
    if (!started) return;

    const handleKey = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          moveDown();
          break;
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          rotate();
          break;
        case "Space":
          e.preventDefault();
          hardDrop();
          break;
        case "KeyC":
        case "ShiftLeft":
        case "ShiftRight":
          e.preventDefault();
          holdPiece();
          break;
        case "Escape":
        case "KeyP":
          e.preventDefault();
          pausedRef.current = !pausedRef.current;
          setPaused(pausedRef.current);
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, moveLeft, moveRight, moveDown, rotate, hardDrop, holdPiece]);

  useEffect(() => {
    return () => cancelAnimationFrame(animIdRef.current);
  }, []);

  const boardW = COLS * CELL;
  const boardH = ROWS * CELL;
  const previewW = 5 * PREVIEW_CELL;
  const previewH = 4 * PREVIEW_CELL;

  return (
    <div className="min-h-screen bg-[#08011a]" style={{ background: "radial-gradient(ellipse at top, #1a0533 0%, #08011a 60%)" }}>
      <SiteNav active="" />

      <main className="flex flex-col items-center justify-start pt-6 pb-10 px-4 min-h-[calc(100vh-4rem)]">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-1">
            🎮 TETRIS
          </h1>
          <p className="text-xs text-purple-300/60 font-mono">koharu.live mini games</p>
        </div>

        <div className="flex gap-4 items-start">
          {/* Left Panel: Hold + Controls */}
          <div className="flex flex-col gap-3 w-[130px]">
            {/* Hold */}
            <div className="rounded-2xl overflow-hidden border border-purple-900/60 bg-[#0d0520]/80 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2 text-center">
                HOLD
              </div>
              <canvas
                ref={holdCanvasRef}
                width={previewW}
                height={previewH}
                className="rounded-lg mx-auto block"
              />
            </div>

            {/* Score */}
            <div className="rounded-2xl border border-purple-900/60 bg-[#0d0520]/80 p-3 space-y-3">
              {[
                { label: "SCORE", value: score.toLocaleString() },
                { label: "LEVEL", value: level },
                { label: "LINES", value: lines },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400 mb-0.5">
                    {label}
                  </div>
                  <div className="text-lg font-extrabold text-white font-mono">{value}</div>
                </div>
              ))}
              {combo > 1 && (
                <div className="text-center animate-bounce">
                  <div className="text-[10px] font-bold text-yellow-400">COMBO ×{combo}!</div>
                </div>
              )}
            </div>

            {/* Controls help */}
            <div className="rounded-2xl border border-purple-900/30 bg-[#0d0520]/60 p-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-2 text-center">
                CONTROLS
              </div>
              <div className="space-y-1 text-[10px] text-purple-300/60 font-mono">
                <div>← → Move</div>
                <div>↑ / W  Rotate</div>
                <div>↓ / S  Soft Drop</div>
                <div>SPACE Hard Drop</div>
                <div>C / Shift Hold</div>
                <div>P / ESC Pause</div>
              </div>
            </div>
          </div>

          {/* Board */}
          <div className="relative">
            <canvas
              ref={boardCanvasRef}
              width={boardW}
              height={boardH}
              className="rounded-2xl block border-2 border-purple-900/60 shadow-2xl shadow-purple-900/40"
              style={{
                boxShadow: clearFlash ? "0 0 40px #bf5af2, 0 0 80px #bf5af240" : undefined,
                transition: "box-shadow 0.1s",
              }}
            />

            {/* Overlay: Not started */}
            {!started && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/75 backdrop-blur-sm gap-4">
                <div className="text-5xl select-none">🎮</div>
                <div className="text-2xl font-extrabold text-white">TETRIS</div>
                <button
                  onClick={startGame}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base shadow-lg hover:opacity-90 transition cursor-pointer"
                >
                  게임 시작
                </button>
              </div>
            )}

            {/* Overlay: Game Over */}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/80 backdrop-blur-sm gap-4">
                <div className="text-4xl select-none">💀</div>
                <div className="text-2xl font-extrabold text-red-400">GAME OVER</div>
                <div className="text-sm text-white/70 font-mono">
                  Score: <strong>{score.toLocaleString()}</strong>
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base shadow-lg hover:opacity-90 transition cursor-pointer"
                >
                  다시 하기
                </button>
              </div>
            )}

            {/* Overlay: Paused */}
            {paused && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm gap-3">
                <div className="text-4xl select-none">⏸</div>
                <div className="text-xl font-extrabold text-white">PAUSED</div>
                <button
                  onClick={() => {
                    pausedRef.current = false;
                    setPaused(false);
                  }}
                  className="px-6 py-2 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:opacity-90 transition cursor-pointer"
                >
                  계속하기
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Next */}
          <div className="flex flex-col gap-3 w-[130px]">
            <div className="rounded-2xl overflow-hidden border border-purple-900/60 bg-[#0d0520]/80 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2 text-center">
                NEXT
              </div>
              <canvas
                ref={nextCanvasRef}
                width={previewW}
                height={previewH}
                className="rounded-lg mx-auto block"
              />
            </div>

            {/* Mobile buttons */}
            <div className="flex flex-col gap-2 mt-2 lg:hidden">
              <button
                onPointerDown={rotate}
                className="py-3 rounded-2xl bg-purple-700/60 text-white font-bold text-sm cursor-pointer"
              >
                ↻ 회전
              </button>
              <div className="flex gap-2">
                <button
                  onPointerDown={moveLeft}
                  className="flex-1 py-3 rounded-2xl bg-purple-700/60 text-white font-bold cursor-pointer"
                >
                  ◀
                </button>
                <button
                  onPointerDown={moveRight}
                  className="flex-1 py-3 rounded-2xl bg-purple-700/60 text-white font-bold cursor-pointer"
                >
                  ▶
                </button>
              </div>
              <button
                onPointerDown={moveDown}
                className="py-3 rounded-2xl bg-purple-700/60 text-white font-bold cursor-pointer"
              >
                ▼ 내리기
              </button>
              <button
                onPointerDown={hardDrop}
                className="py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold cursor-pointer"
              >
                ⬇ 하드드롭
              </button>
              <button
                onPointerDown={holdPiece}
                className="py-3 rounded-2xl bg-blue-700/60 text-white font-bold text-sm cursor-pointer"
              >
                📦 홀드
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
