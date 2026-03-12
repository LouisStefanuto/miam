import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Game constants ---
const GROUND_H = 50;
const BEAVER_W = 44;
const BEAVER_H = 40;
const BEAVER_X = 60;
const JUMP_VELOCITY = -12;
const GRAVITY = 0.6;
const INITIAL_SPEED = 5;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.003;
const INGREDIENT_CHANCE = 0.35;

// Obstacle gap shrinks as speed increases (progressive difficulty)
const INITIAL_MIN_GAP = 50;
const INITIAL_MAX_GAP = 180;
const FINAL_MIN_GAP = 25;   // at max speed
const FINAL_MAX_GAP = 90;

type ObstacleKind = 'spoon' | 'saucepan' | 'fork-double' | 'bird';

interface Obstacle {
  x: number;
  kind: ObstacleKind;
  w: number;
  h: number;
  y: number;
  flying: boolean;
  frame: number;
}

interface Collectible {
  x: number;
  y: number;
  collected: boolean;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
}

interface GameState {
  beaverY: number;
  velocity: number;
  ducking: boolean;
  jumping: boolean;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  clouds: Cloud[];
  speed: number;
  score: number;
  ingredients: number;
  frame: number;
  nextObstacleIn: number;
  gameOver: boolean;
  started: boolean;
  width: number;
  height: number;
  animId: number;
  groundY: number;
}

// --- 8-bit jump sound using Web Audio API ---
let audioCtx: AudioContext | null = null;

function playJumpSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    // Audio not available
  }
}

function playCollectSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  } catch {
    // Audio not available
  }
}

function playDeathSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}

// --- Carrot drawing helper ---
function drawCarrot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#22c55e';
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.quadraticCurveTo(x - 10, y - 30, x - 5, y - 24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.quadraticCurveTo(x, y - 34, x, y - 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.quadraticCurveTo(x + 10, y - 30, x + 5, y - 24);
  ctx.stroke();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 12);
  ctx.quadraticCurveTo(x - 9, y + 4, x, y + 18);
  ctx.quadraticCurveTo(x + 9, y + 4, x + 8, y - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - 2, 2, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 4);
  ctx.lineTo(x + 6, y - 4);
  ctx.moveTo(x - 4, y + 4);
  ctx.lineTo(x + 4, y + 4);
  ctx.stroke();
  ctx.restore();
}

// --- Drawing helpers ---

function getThemeColor(): string {
  const style = getComputedStyle(document.documentElement);
  const fg = style.getPropertyValue('--foreground').trim();
  if (fg) return `hsl(${fg})`;
  return '#535353';
}

function getAccentColor(): string {
  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue('--primary').trim();
  if (accent) return `hsl(${accent})`;
  return '#f97316';
}

function drawBeaver(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ducking: boolean, frame: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (ducking) {
    const dw = w * 1.3;
    const dh = h * 0.5;
    const dx = x - (dw - w) / 2;
    const dy = y - dh;
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, dh, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(dx - 4, dy + dh * 0.5, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dx + dw - 8, dy + dh * 0.35, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dx + dw - 7, dy + dh * 0.35, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(dx + dw - 3, dy + dh * 0.6, 3, 4);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(dx + dw - 1.5, dy + dh * 0.6);
    ctx.lineTo(dx + dw - 1.5, dy + dh * 0.6 + 4);
    ctx.stroke();
  } else {
    const bx = x;
    const by = y - h;
    ctx.beginPath();
    ctx.roundRect(bx + 4, by + 6, w - 8, h - 10, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(bx + 2, by, w - 4, h * 0.5, [8, 8, 2, 2]);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + h - 6, 10, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    const legOffset = Math.sin(frame * 0.4) * 3;
    ctx.fillRect(bx + 10, by + h - 6, 5, 6 + legOffset);
    ctx.fillRect(bx + w - 15, by + h - 6, 5, 6 - legOffset);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bx + w - 12, by + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx + w - 11, by + 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + w - 10, by + h * 0.42, 3, 5);
    ctx.fillRect(bx + w - 6, by + h * 0.42, 3, 5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx + w - 10, by + h * 0.42, 3, 5);
    ctx.strokeRect(bx + w - 6, by + h * 0.42, 3, 5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx + 8, by + 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + w - 8, by + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Obstacle drawing ---

function drawSpoon(ctx: CanvasRenderingContext2D, x: number, groundY: number, color: string) {
  ctx.fillStyle = color;
  // Handle
  ctx.fillRect(x - 2, groundY - 32, 4, 22);
  // Bowl of spoon
  ctx.beginPath();
  ctx.ellipse(x, groundY - 38, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner highlight
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(x, groundY - 39, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSaucepan(ctx: CanvasRenderingContext2D, x: number, groundY: number, color: string) {
  ctx.fillStyle = color;
  // Pan body
  const panW = 56;
  const panH = 42;
  ctx.beginPath();
  ctx.roundRect(x - panW / 2, groundY - panH, panW, panH, 5);
  ctx.fill();
  // Rim
  ctx.fillRect(x - panW / 2 - 4, groundY - panH, panW + 8, 5);
  // Handle sticking out to the right
  ctx.fillRect(x + panW / 2, groundY - panH + 14, 28, 6);
  ctx.beginPath();
  ctx.roundRect(x + panW / 2 + 26, groundY - panH + 11, 10, 12, 4);
  ctx.fill();
  // Lid knob on top
  ctx.beginPath();
  ctx.arc(x, groundY - panH - 6, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawForkDouble(ctx: CanvasRenderingContext2D, x: number, groundY: number, color: string) {
  ctx.fillStyle = color;
  const forkX = x - 8;
  ctx.fillRect(forkX - 2, groundY - 32, 4, 32);
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(forkX + i * 4 - 1, groundY - 42, 2, 12);
  }
  const fork2X = x + 8;
  ctx.fillRect(fork2X - 2, groundY - 26, 4, 26);
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(fork2X + i * 4 - 1, groundY - 36, 2, 12);
  }
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, color: string) {
  const angle = Math.sin(frame * 0.15) * 0.3;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Whisk handle
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Whisk wires (the "wings")
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(16, i * 6, 28, i * 4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 12, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w * 0.2, y - 6, w * 0.5, 10, 5);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// --- Difficulty progression ---
function getObstacleGap(speed: number): { min: number; max: number } {
  const t = Math.min((speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED), 1);
  return {
    min: Math.round(INITIAL_MIN_GAP + (FINAL_MIN_GAP - INITIAL_MIN_GAP) * t),
    max: Math.round(INITIAL_MAX_GAP + (FINAL_MAX_GAP - INITIAL_MAX_GAP) * t),
  };
}

export default function BeaverCatchGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    beaverY: 0, velocity: 0, ducking: false, jumping: false,
    obstacles: [], collectibles: [], clouds: [],
    speed: INITIAL_SPEED, score: 0, ingredients: 0,
    frame: 0, nextObstacleIn: 60,
    gameOver: false, started: false,
    width: 0, height: 0, animId: 0, groundY: 0,
  });

  const [score, setScore] = useState(0);
  const [ingredients, setIngredients] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const stored = localStorage.getItem('miam-dino-highscore');
    return stored ? parseInt(stored, 10) : 0;
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;
    if (!s.started) {
      s.started = true;
      setStarted(true);
    }
    if (s.beaverY <= 0 && !s.jumping) {
      s.velocity = JUMP_VELOCITY;
      s.jumping = true;
      s.ducking = false;
      playJumpSound();
    }
  }, []);

  const setDucking = useCallback((duck: boolean) => {
    const s = stateRef.current;
    if (s.gameOver || !s.started) return;
    s.ducking = duck;
  }, []);

  const endGame = useCallback(() => {
    const s = stateRef.current;
    s.gameOver = true;
    setGameOver(true);
    playDeathSound();
    const best = Math.max(s.score, parseInt(localStorage.getItem('miam-dino-highscore') ?? '0', 10));
    localStorage.setItem('miam-dino-highscore', String(best));
    setHighScore(best);
  }, []);

  const initGame = useCallback(() => {
    const s = stateRef.current;
    s.beaverY = 0;
    s.velocity = 0;
    s.ducking = false;
    s.jumping = false;
    s.obstacles = [];
    s.collectibles = [];
    s.speed = INITIAL_SPEED;
    s.score = 0;
    s.ingredients = 0;
    s.frame = 0;
    s.nextObstacleIn = 60;
    s.gameOver = false;
    s.started = false;
    setScore(0);
    setIngredients(0);
    setGameOver(false);
    setStarted(false);

  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement!;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.width = parent.clientWidth;
      stateRef.current.height = parent.clientHeight;
      stateRef.current.groundY = parent.clientHeight - GROUND_H;
    };
    resize();
    window.addEventListener('resize', resize);

    const s = stateRef.current;

    // Init clouds
    if (s.clouds.length === 0) {
      for (let i = 0; i < 5; i++) {
        s.clouds.push({
          x: Math.random() * s.width * 1.5,
          y: 20 + Math.random() * 80,
          w: 40 + Math.random() * 50,
        });
      }
    }

    const spawnObstacle = () => {
      const type = Math.random();
      let obstacle: Obstacle;

      if (type < 0.18 && s.score > 5) {
        // Flying whisk — duck to avoid
        obstacle = { x: s.width + 40, kind: 'bird', w: 56, h: 30, y: 30 + Math.random() * 12, flying: true, frame: 0 };
      } else if (type < 0.45) {
        // Saucepan
        obstacle = { x: s.width + 40, kind: 'saucepan', w: 80, h: 50, y: 0, flying: false, frame: 0 };
      } else if (type < 0.72) {
        // Double forks
        obstacle = { x: s.width + 40, kind: 'fork-double', w: 24, h: 42, y: 0, flying: false, frame: 0 };
      } else {
        // Spoon
        obstacle = { x: s.width + 40, kind: 'spoon', w: 14, h: 48, y: 0, flying: false, frame: 0 };
      }
      s.obstacles.push(obstacle);

      if (Math.random() < INGREDIENT_CHANCE) {
        const offsetX = (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 40);
        s.collectibles.push({
          x: obstacle.x + offsetX,
          y: 65 + Math.random() * 30,
          collected: false,
        });
      }
    };

    const loop = () => {
      const { width, groundY } = s;
      const color = getThemeColor();
      const accent = getAccentColor();
      void accent; // keep for future use

      if (s.started && !s.gameOver) {
        s.frame++;
        s.speed = Math.min(INITIAL_SPEED + s.frame * SPEED_INCREMENT, MAX_SPEED);

        if (s.frame % 6 === 0) {
          s.score++;
          setScore(s.score);
        }

        // Beaver physics
        if (s.beaverY > 0 || s.velocity < 0) {
          s.velocity += GRAVITY;
          s.beaverY -= s.velocity;
          if (s.beaverY <= 0) {
            s.beaverY = 0;
            s.velocity = 0;
            s.jumping = false;
          }
        }

        // Spawn obstacles — gap shrinks with speed
        s.nextObstacleIn--;
        if (s.nextObstacleIn <= 0) {
          spawnObstacle();
          const gap = getObstacleGap(s.speed);
          s.nextObstacleIn = gap.min + Math.floor(Math.random() * (gap.max - gap.min));
        }

        // Move obstacles & collectibles
        for (const o of s.obstacles) {
          o.x -= s.speed;
          o.frame++;
        }
        for (const c of s.collectibles) c.x -= s.speed;

        // Collision detection
        const bh = s.ducking ? BEAVER_H * 0.5 : BEAVER_H;
        const bBottom = s.beaverY;
        const bTop = s.beaverY + bh;
        const bLeft = BEAVER_X;
        const bRight = BEAVER_X + BEAVER_W - 8;

        for (const o of s.obstacles) {
          const oLeft = o.x - o.w / 2;
          const oRight = o.x + o.w / 2;
          const oBottom = o.y;
          const oTop = o.y + o.h;

          if (bRight > oLeft && bLeft < oRight && bTop > oBottom && bBottom < oTop) {
            endGame();
            break;
          }
        }

        // Collect carrots
        for (const c of s.collectibles) {
          if (c.collected) continue;
          const bCenterX = BEAVER_X + BEAVER_W / 2;
          const bCenterY = s.beaverY + bh / 2;
          const dx = bCenterX - c.x;
          const dy = bCenterY - c.y;
          if (Math.sqrt(dx * dx + dy * dy) < 28) {
            c.collected = true;
            s.ingredients++;
            setIngredients(s.ingredients);
            playCollectSound();
          }
        }

        // Cleanup
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > -40);
        s.collectibles = s.collectibles.filter((c) => c.x > -30);
      }

      // Move clouds
      for (const cloud of s.clouds) {
        cloud.x -= (s.started && !s.gameOver ? s.speed : 1) * 0.2;
        if (cloud.x + cloud.w < -20) cloud.x = width + 20 + Math.random() * 100;
      }

      // --- DRAW ---
      ctx.clearRect(0, 0, width, s.height);

      // Clouds
      for (const cloud of s.clouds) {
        drawCloud(ctx, cloud.x, cloud.y, cloud.w, color);
      }

      // Ground line
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Ground texture
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      const dashOffset = s.started ? (s.frame * s.speed) % 40 : 0;
      for (let gx = -dashOffset; gx < width; gx += 40) {
        const segW = 3 + Math.abs(Math.sin(gx * 0.1)) * 8;
        ctx.beginPath();
        ctx.moveTo(gx, groundY + 6);
        ctx.lineTo(gx + segW, groundY + 6);
        ctx.stroke();
      }
      for (let gx = -dashOffset + 15; gx < width; gx += 55) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY + 14);
        ctx.lineTo(gx + 4, groundY + 14);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Obstacles
      for (const o of s.obstacles) {
        switch (o.kind) {
          case 'spoon':
            drawSpoon(ctx, o.x, groundY, color);
            break;
          case 'saucepan':
            drawSaucepan(ctx, o.x, groundY, color);
            break;
          case 'fork-double':
            drawForkDouble(ctx, o.x, groundY, color);
            break;
          case 'bird':
            drawBird(ctx, o.x, groundY - o.y - o.h / 2, o.frame, color);
            break;
        }
      }

      // Collectibles (carrots)
      for (const c of s.collectibles) {
        if (c.collected) continue;
        drawCarrot(ctx, c.x, groundY - c.y);
      }

      // Beaver
      const bDrawY = groundY - s.beaverY;
      drawBeaver(ctx, BEAVER_X, bDrawY, BEAVER_W, BEAVER_H, s.ducking, s.frame, color);

      // Idle prompt
      if (!s.started && !s.gameOver) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Tap haut / Espace = sauter — Tap bas / ↓ = se baisser', width / 2, groundY / 2);
        ctx.globalAlpha = 1;
      }

      // Score display (Chrome dino style, top-right)
      if (s.started) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(String(s.score).padStart(5, '0'), width - 16, 16);
        ctx.globalAlpha = 1;
      }

      s.animId = requestAnimationFrame(loop);
    };

    s.animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.animId);
      window.removeEventListener('resize', resize);
    };
  }, [endGame]);

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDucking(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setDucking(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump, setDucking]);

  const restart = useCallback(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0 bg-background">
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold">Beaver Run</span>
          {started && (
            <div className="flex items-center gap-3 font-body text-sm text-muted-foreground">
              <span>Score: <span className="font-semibold text-foreground">{score}</span></span>
              <span>🥕 <span className="font-semibold text-foreground">{ingredients}</span></span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>

      {/* Game area — top half: jump, bottom half: duck */}
      <div
        className="flex-1 relative select-none cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          if (y > rect.height * 0.6) {
            setDucking(true);
            setTimeout(() => setDucking(false), 300);
          } else {
            jump();
          }
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = e.currentTarget.getBoundingClientRect();
          const y = touch.clientY - rect.top;
          if (y > rect.height * 0.6) {
            setDucking(true);
          } else {
            jump();
          }
        }}
        onTouchEnd={() => { setDucking(false); }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 overflow-y-auto">
            <div className="text-center space-y-4 p-6 max-w-sm w-full">
              <p className="text-5xl">🦫</p>
              <h2 className="font-display text-2xl font-bold">Game Over!</h2>
              <div className="space-y-1">
                <p className="font-body text-2xl font-bold">{score} pts</p>
                <p className="font-body text-sm text-muted-foreground">
                  🥕 {ingredients} carotte{ingredients !== 1 ? 's' : ''} collectée{ingredients !== 1 ? 's' : ''}
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  Meilleur: {highScore}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={restart} className="gradient-warm text-primary-foreground font-body font-semibold">
                  Rejouer
                </Button>
                <Button variant="outline" onClick={onClose} className="font-body">
                  Quitter
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
