const COLOURS = ["#ffcf8a", "#ff9fb5", "#fff1e6", "#ff7f9b", "#ffd9a0", "#f3b5d8"];

const pseudo = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export function Confetti({ pieces = 70 }: { pieces?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {Array.from({ length: pieces }, (_, index) => {
        const heart = index % 5 === 0;
        const size = heart ? 14 + pseudo(index, 1) * 10 : 6 + pseudo(index, 2) * 6;
        return (
          <span
            key={index}
            className="absolute top-0 block"
            style={{
              left: `${pseudo(index, 3) * 100}%`,
              width: size,
              height: heart ? size : size * 1.6,
              color: COLOURS[index % COLOURS.length],
              background: heart ? "none" : "currentColor",
              borderRadius: heart ? 0 : 2,
              animation: `confettiFall ${3.2 + pseudo(index, 4) * 2.6}s cubic-bezier(0.25,0.6,0.4,1) ${pseudo(index, 5) * 1.2}s both`,
              ["--drift" as string]: `${(pseudo(index, 6) - 0.5) * 220}px`,
            }}
          >
            {heart ? (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path d="M12 21 C 3 15 3 6.5 8 6 C 10 5.8 11.3 7 12 8.3 C 12.7 7 14 5.8 16 6 C 21 6.5 21 15 12 21 Z" fill="currentColor" />
              </svg>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
