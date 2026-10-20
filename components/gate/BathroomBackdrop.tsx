import { SCENE } from "@/components/gate/cloth";

const TILE = 36;
const TRIM_Y = 560;

export function BathroomBackdrop({
  viewBox,
  frost,
  mirrorFog,
  showMessage,
}: {
  viewBox: string;
  frost: number;
  mirrorFog: boolean;
  showMessage: boolean;
}) {
  const { floorY, mirror, window: win, hook, switchPlate, rail } = SCENE;
  const cablePath = `M ${switchPlate.x} ${switchPlate.y + switchPlate.size / 2} L ${switchPlate.x} ${rail.bottom - 22} Q ${switchPlate.x} ${rail.bottom - 10} ${switchPlate.x - 12} ${rail.bottom - 10} L ${rail.right + 6} ${rail.bottom - 10}`;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox={viewBox}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="wallPaint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7efe4" />
          <stop offset="1" stopColor="#efe3d2" />
        </linearGradient>
        <pattern id="tiles" width={TILE} height={TILE} patternUnits="userSpaceOnUse" y={TRIM_Y}>
          <rect width={TILE} height={TILE} fill="#f6f2ea" />
          <rect x="1.5" y="1.5" width={TILE - 3} height={TILE - 3} rx="3" fill="#cfe1d2" />
          <rect x="3" y="3" width={TILE - 10} height="3" rx="1.5" fill="#e3efe4" opacity="0.8" />
        </pattern>
        <linearGradient id="floorWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99f78" />
          <stop offset="1" stopColor="#a87d58" />
        </linearGradient>
        <linearGradient id="nightGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f2a55" />
          <stop offset="0.65" stopColor="#4f5f98" />
          <stop offset="1" stopColor="#c99bb0" />
        </linearGradient>
        <linearGradient id="mirrorGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8f0f1" />
          <stop offset="1" stopColor="#b7cbd1" />
        </linearGradient>
        <radialGradient id="frostCorner" cx="0" cy="0" r="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#eaf4ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#eaf4ff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="mirrorClip">
          <circle cx={mirror.x} cy={mirror.y} r={mirror.r - 6} />
        </clipPath>
        <clipPath id="windowClip">
          <rect x={win.x + 10} y={win.y + 10} width={win.width - 20} height={win.height - 20} rx="4" />
        </clipPath>
        <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {/* Walls */}
      <rect x="-4000" y="-4000" width="8600" height={4000 + TRIM_Y} fill="url(#wallPaint)" />
      <rect x="-4000" y={TRIM_Y} width="8600" height={floorY - TRIM_Y} fill="url(#tiles)" />
      <rect x="-4000" y={TRIM_Y - 7} width="8600" height="12" fill="#a9c8b1" />
      <rect x="-4000" y={TRIM_Y - 7} width="8600" height="3" fill="#c4dbc9" />

      {/* Floor */}
      <rect x="-4000" y={floorY} width="8600" height="4000" fill="url(#floorWood)" />
      {[12, 30, 54, 86, 126, 176, 240, 320].map((offset) => (
        <line
          key={offset}
          x1="-4000"
          x2="4600"
          y1={floorY + offset}
          y2={floorY + offset}
          stroke="#8f6a4a"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      ))}
      <rect x="-4000" y={floorY - 16} width="8600" height="18" fill="#fbf7f0" />
      <rect x="-4000" y={floorY + 1} width="8600" height="4" fill="#000" opacity="0.08" />

      {/* Bath mat */}
      <g>
        <rect x="300" y={floorY + 22} width="200" height="42" rx="18" fill="#e7b3ac" />
        <rect x="312" y={floorY + 28} width="176" height="30" rx="13" fill="none" stroke="#f6d8d2" strokeWidth="2" strokeDasharray="4 5" />
      </g>

      {/* Window */}
      <g>
        <rect x={win.x} y={win.y} width={win.width} height={win.height} rx="8" fill="#fbf8f2" />
        <g clipPath="url(#windowClip)">
          <rect x={win.x} y={win.y} width={win.width} height={win.height} fill="url(#nightGlass)" />
          <circle cx={win.x + 108} cy={win.y + 48} r="17" fill="#fdf6dc" />
          <circle cx={win.x + 116} cy={win.y + 43} r="15" fill="#2a3762" opacity="0.85" />
          {[
            [32, 34],
            [60, 22],
            [84, 62],
            [40, 78],
            [128, 90],
            [20, 104],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={win.x + x} cy={win.y + y} r="1.4" fill="#fff" opacity="0.85" />
          ))}
          <rect x={win.x} y={win.y + win.height * 0.56} width={win.width} height={win.height} fill="#f4f1ff" opacity="0.42" />
          <g style={{ opacity: frost, transition: "opacity 3s ease" }}>
            <circle cx={win.x + 10} cy={win.y + 10} r="70" fill="url(#frostCorner)" />
            <circle cx={win.x + win.width - 10} cy={win.y + 10} r="56" fill="url(#frostCorner)" />
            <circle cx={win.x + 10} cy={win.y + win.height - 10} r="60" fill="url(#frostCorner)" />
            <circle cx={win.x + win.width - 10} cy={win.y + win.height - 10} r="74" fill="url(#frostCorner)" />
            <text
              x={win.x + win.width / 2}
              y={win.y + 92}
              textAnchor="middle"
              fontSize="30"
              fill="#ffffff"
              opacity="0.9"
              style={{ fontFamily: "var(--font-caveat), cursive" }}
            >
              brr…
            </text>
          </g>
        </g>
        <line x1={win.x + win.width / 2} x2={win.x + win.width / 2} y1={win.y + 10} y2={win.y + win.height - 10} stroke="#fbf8f2" strokeWidth="6" />
        <rect x={win.x - 12} y={win.y + win.height - 2} width={win.width + 24} height="14" rx="3" fill="#f1ebe1" />
        <rect x={win.x - 12} y={win.y + win.height + 10} width={win.width + 24} height="4" fill="#000" opacity="0.07" />
        {/* Little succulent on the sill */}
        <path d={`M ${win.x + 14} ${win.y + win.height - 2} l 4 -22 h 22 l 4 22 z`} fill="#d98c6a" />
        <path d={`M ${win.x + 29} ${win.y + win.height - 24} c -10 -6 -14 -18 -8 -26 c 4 8 8 12 8 26 c 0 -14 4 -22 10 -28 c 4 10 0 22 -10 28`} fill="#7fae86" />
      </g>

      {/* Mirror */}
      <g>
        <circle cx={mirror.x} cy={mirror.y + 6} r={mirror.r} fill="#000" opacity="0.08" />
        <circle cx={mirror.x} cy={mirror.y} r={mirror.r} fill="#d4b06a" />
        <circle cx={mirror.x} cy={mirror.y} r={mirror.r - 6} fill="url(#mirrorGlass)" />
        <g clipPath="url(#mirrorClip)">
          <path d={`M ${mirror.x - 70} ${mirror.y + 40} L ${mirror.x + 10} ${mirror.y - 90} L ${mirror.x + 34} ${mirror.y - 90} L ${mirror.x - 46} ${mirror.y + 40} Z`} fill="#fff" opacity="0.35" />
          <path d={`M ${mirror.x - 20} ${mirror.y + 80} L ${mirror.x + 60} ${mirror.y - 50} L ${mirror.x + 70} ${mirror.y - 50} L ${mirror.x - 10} ${mirror.y + 80} Z`} fill="#fff" opacity="0.25" />
          <circle
            cx={mirror.x}
            cy={mirror.y}
            r={mirror.r}
            fill="#f7f9fa"
            style={{ opacity: mirrorFog ? 0.82 : 0, transition: "opacity 2.4s ease" }}
          />
          <g
            style={{
              opacity: showMessage ? 1 : 0,
              transition: "opacity 1.6s ease 0.6s",
            }}
            filter="url(#softBlur)"
          >
            <text
              x={mirror.x}
              y={mirror.y + 4}
              textAnchor="middle"
              fontSize="34"
              fill="#9fb4bb"
              style={{ fontFamily: "var(--font-caveat), cursive" }}
            >
              hi Aanavee
            </text>
            <path
              d={`M ${mirror.x} ${mirror.y + 46} c -14 -10 -22 -18 -14 -27 c 6 -6 12 -2 14 3 c 2 -5 8 -9 14 -3 c 8 9 0 17 -14 27 z`}
              fill="none"
              stroke="#9fb4bb"
              strokeWidth="3"
            />
          </g>
        </g>
      </g>

      {/* Towel hook */}
      <g>
        <rect x={hook.x - 9} y={hook.y - 16} width="18" height="10" rx="4" fill="#c9a45c" />
        <path d={`M ${hook.x} ${hook.y - 8} v 10 q 0 8 -7 8`} fill="none" stroke="#b8924a" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Rail wall mounts and the cable from the switch */}
      {[rail.left, rail.right].flatMap((x) =>
        [rail.top + 8, rail.bottom - 8].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#e7e2da" stroke="#cfc8bd" strokeWidth="2" />
        )),
      )}
      <path d={cablePath} fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="6" transform="translate(2 3)" />
      <path d={cablePath} fill="none" stroke="#fbfaf7" strokeWidth="4.5" strokeLinecap="round" />

      {/* Floor plant */}
      <g>
        <path d="M 548 790 l 6 50 h 40 l 6 -50 z" fill="#d48a62" />
        <rect x="544" y="782" width="60" height="12" rx="4" fill="#c27a55" />
        <path d="M 574 782 C 540 740 532 700 548 664 C 566 700 572 740 574 782 C 572 730 584 690 612 670 C 616 712 600 750 574 782" fill="#6f9f78" />
        <path d="M 574 782 C 560 744 572 716 592 700" fill="none" stroke="#4f7d5a" strokeWidth="2" />
      </g>

      {/* Wide screens: the bath on the left */}
      <g>
        <rect x="-430" y="452" width="300" height="10" rx="3" fill="#f1ebe1" />
        <rect x="-410" y="414" width="22" height="38" rx="5" fill="#f0c6bd" />
        <rect x="-380" y="400" width="18" height="52" rx="5" fill="#a9c8b1" />
        <rect x="-330" y="424" width="34" height="28" rx="6" fill="#fbf7f0" stroke="#e2d8c8" strokeWidth="2" />
        <path d="M -313 424 q -3 -8 0 -14 q 3 6 0 14" fill="#f7b267" />
        <rect x="-250" y="420" width="26" height="32" rx="6" fill="#e9dfcf" />
        <path d="M -520 640 h 480 q 0 150 -110 168 h -260 q -110 -18 -110 -168 z" fill="#fdfcf9" stroke="#e4ddd2" strokeWidth="3" />
        <rect x="-530" y="626" width="500" height="20" rx="10" fill="#ffffff" stroke="#e4ddd2" strokeWidth="3" />
        <path d="M -470 806 l -14 34 h 22 l 8 -30 z M -110 806 l 14 34 h -22 l -8 -30 z" fill="#d4b06a" />
        {[
          [-470, 624, 16],
          [-440, 612, 22],
          [-400, 620, 14],
          [-150, 618, 18],
          [-120, 610, 12],
          [-96, 624, 15],
        ].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#ffffff" stroke="#dbe9f4" strokeWidth="2" />
        ))}
        <path d="M -60 626 v -90 q 0 -24 24 -24 h 10" fill="none" stroke="#c9a45c" strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* Wide screens: a shelf, candles and a tall plant on the right */}
      <g>
        <rect x="700" y="470" width="220" height="10" rx="3" fill="#f1ebe1" />
        <rect x="716" y="430" width="30" height="40" rx="6" fill="#fbf7f0" stroke="#e2d8c8" strokeWidth="2" />
        <path d="M 731 430 q -3 -9 0 -15 q 3 7 0 15" fill="#f7b267" />
        <rect x="760" y="440" width="26" height="30" rx="6" fill="#fbf7f0" stroke="#e2d8c8" strokeWidth="2" />
        <path d="M 773 440 q -3 -8 0 -13 q 3 6 0 13" fill="#f7b267" />
        <rect x="806" y="418" width="44" height="52" rx="8" fill="#e7b3ac" />
        <rect x="862" y="432" width="40" height="38" rx="8" fill="#cfe1d2" />
        <path d="M 820 790 l 8 50 h 54 l 8 -50 z" fill="#e9dfcf" />
        <path d="M 855 790 C 800 720 790 640 820 580 C 846 640 852 720 855 790 C 852 700 880 630 924 600 C 930 670 900 740 855 790" fill="#6f9f78" />
      </g>
    </svg>
  );
}
