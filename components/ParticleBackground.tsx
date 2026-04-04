const petals = [
  { left: "6%", duration: "14s", delay: "0s", size: 10, opacity: 0.54 },
  { left: "14%", duration: "17s", delay: "2s", size: 14, opacity: 0.7 },
  { left: "23%", duration: "13s", delay: "5s", size: 12, opacity: 0.62 },
  { left: "31%", duration: "16s", delay: "1s", size: 10, opacity: 0.55 },
  { left: "42%", duration: "18s", delay: "4s", size: 14, opacity: 0.66 },
  { left: "53%", duration: "15s", delay: "3s", size: 11, opacity: 0.58 },
  { left: "64%", duration: "19s", delay: "6s", size: 12, opacity: 0.72 },
  { left: "74%", duration: "14s", delay: "1.5s", size: 10, opacity: 0.64 },
  { left: "84%", duration: "17s", delay: "0.75s", size: 13, opacity: 0.69 },
  { left: "92%", duration: "16s", delay: "4.5s", size: 11, opacity: 0.57 },
];

export function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal, index) => (
        <span
          key={`${petal.left}-${index}`}
          className="absolute -top-8 rounded-full bg-sakura/70 blur-[0.5px]"
          style={{
            left: petal.left,
            width: `${petal.size}px`,
            height: `${petal.size * 1.55}px`,
            opacity: petal.opacity,
            animationName: "drift",
            animationDuration: petal.duration,
            animationDelay: petal.delay,
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
          }}
        />
      ))}
    </div>
  );
}
