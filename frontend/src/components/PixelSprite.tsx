import { PixelSpriteData, spriteRuns } from '@/lib/pixel-sprites';

interface PixelSpriteProps {
  sprite: PixelSpriteData;
  /**
   * Screen pixels per sprite pixel. A whole number keeps every pixel the same size;
   * a half step such as 2.5 still looks even on high-density phone screens.
   * A parent can override it per breakpoint by setting the `--pixel-scale` CSS variable.
   */
  scale?: number;
  className?: string;
}

/** Decorative pixel-art sprite, drawn as crisp SVG rects. */
export default function PixelSprite({ sprite, scale = 3, className }: PixelSpriteProps) {
  const width = sprite.rows[0].length;
  const height = sprite.rows.length;

  return (
    <svg
      style={{
        width: `calc(${width}px * var(--pixel-scale, ${scale}))`,
        height: `calc(${height}px * var(--pixel-scale, ${scale}))`,
      }}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {spriteRuns(sprite.rows).map((run) => (
        <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.length} height={1} fill={run.color} />
      ))}
    </svg>
  );
}
