import React from "react";

interface Props {
  value: string;
  size?: number;
}

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

function isFinderModule(r: number, c: number, n: number): boolean | null {
  const finderBlock = (row: number, col: number): boolean | null => {
    if (row < 0 || row > 6 || col < 0 || col > 6) return null;
    if (row === 0 || row === 6 || col === 0 || col === 6) return true;
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
    return false;
  };
  // top-left
  if (r <= 7 && c <= 7) {
    if (r === 7 || c === 7) return false;
    return finderBlock(r, c);
  }
  // top-right
  if (r <= 7 && c >= n - 8) {
    if (r === 7 || c === n - 8) return false;
    return finderBlock(r, c - (n - 7));
  }
  // bottom-left
  if (r >= n - 8 && c <= 7) {
    if (r === n - 8 || c === 7) return false;
    return finderBlock(r - (n - 7), c);
  }
  return null;
}

export default function QRCodeDisplay({ value, size = 160 }: Props) {
  const n = 25;
  const cell = size / n;
  const h = hashStr(value);

  const modules: boolean[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => {
      const finder = isFinderModule(r, c, n);
      if (finder !== null) return finder;
      // timing pattern
      if (r === 6) return c % 2 === 0;
      if (c === 6) return r % 2 === 0;
      // data modules — deterministic from hash
      const seed = (h * (r * n + c + 1) * 0x9e3779b9) & 0x7fffffff;
      return (seed >> 3) % 3 !== 0;
    })
  );

  return (
    <div
      style={{ width: size + 16, height: size + 16, background: "white", borderRadius: 12, padding: 8, display: "inline-flex" }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        {modules.map((row, r) =>
          row.map((on, c) =>
            on ? (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell - 0.5}
                height={cell - 0.5}
                fill="#080B14"
                rx={0.8}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
