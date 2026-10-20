"use client";

import { useEffect, useRef, useState } from "react";
import { BathroomBackdrop } from "@/components/gate/BathroomBackdrop";
import {
  Cloth,
  RUNG_REACH,
  SCENE,
  projectPoint,
  projectScale,
  unprojectPoint,
  type PlacementIssue,
} from "@/components/gate/cloth";
import { sfx } from "@/lib/sfx";

interface View {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  dpr: number;
}

type Status = "hooked" | "carrying" | "loose" | "almost" | "placed" | "unlocking";

interface Wisp {
  x: number;
  y: number;
  life: number;
  size: number;
  drift: number;
}

const ISSUE_MESSAGES: Record<PlacementIssue, string> = {
  lopsided: "Almost. It's a bit lopsided. Try holding it from the middle.",
  crooked: "So close. Straighten it out a little.",
  "off-centre": "Nearly. Shuffle it into the middle of the rail.",
  slipping: "Careful, it's slipping off…",
};

const PLACED_HINTS = [
  "Perfect.",
  "Perfect.",
  "Neatly folded. A little chilly in here, though.",
  "Neatly folded. A little chilly in here, though.",
  "Psst. Towels like to be warm.",
];

const CORAL = [232, 151, 144];
const CREAM = [251, 239, 226];
const ACCENT = [204, 110, 106];
const LIGHT = (() => {
  const x = -0.3;
  const y = -0.5;
  const z = 0.81;
  const length = Math.hypot(x, y, z);
  return { x: x / length, y: y / length, z: z / length };
})();

const mix = (from: number[], to: number[], amount: number) =>
  from.map((value, index) => Math.round(value + (to[index] - value) * amount));

const computeView = (width: number, height: number): View => {
  const scale = Math.min(width / SCENE.width, height / SCENE.height);
  return {
    width,
    height,
    scale,
    offsetX: (width - SCENE.width * scale) / 2,
    offsetY: (height - SCENE.height * scale) / 2,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  };
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function TowelGate({ nextPath }: { nextPath: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clothRef = useRef<Cloth | null>(null);
  const viewRef = useRef<View | null>(null);
  const heatOnRef = useRef(false);
  const placedRef = useRef(false);
  const unlockingRef = useRef(false);
  const shiverRef = useRef(0);
  const unlockRef = useRef<() => void>(() => {});
  const statusRef = useRef<{ status: Status; issue: PlacementIssue | null }>({ status: "hooked", issue: null });

  const [view, setView] = useState<View | null>(null);
  const [heatOn, setHeatOn] = useState(false);
  const [lightsOn, setLightsOn] = useState(true);
  const [status, setStatus] = useState<Status>("hooked");
  const [issue, setIssue] = useState<PlacementIssue | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [everGrabbed, setEverGrabbed] = useState(false);
  const [showHand, setShowHand] = useState(false);
  const [handPoint, setHandPoint] = useState<{ x: number; y: number } | null>(null);
  const [foldPoint, setFoldPoint] = useState<{ x: number; y: number } | null>(null);
  const [brr, setBrr] = useState(0);
  const [mirrorFog, setMirrorFog] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [duckKey, setDuckKey] = useState(0);
  const [cordKey, setCordKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    heatOnRef.current = heatOn;
  }, [heatOn]);

  useEffect(() => {
    const unlock = async () => {
      setStatus("unlocking");
      setError("");
      setMirrorFog(true);
      sfx.chime([523.25, 659.25, 783.99, 1046.5]);

      const request = fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ towelPlaced: true, railHeated: true }),
      })
        .then((response) => response.ok)
        .catch(() => false);

      await wait(1500);
      setShowMessage(true);
      await wait(2800);

      if (!(await request)) {
        setError("The door's stuck. Give it a second and try the switch again.");
        setMirrorFog(false);
        setShowMessage(false);
        setHeatOn(false);
        unlockingRef.current = false;
        setStatus("placed");
        return;
      }

      setWelcome(true);
      await wait(1300);
      window.location.replace(nextPath);
    };

    unlockRef.current = () => {
      void unlock();
    };
  }, [nextPath]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) {
      return;
    }

    const cloth = new Cloth();
    clothRef.current = cloth;
    const ctx = canvas.getContext("2d");
    const shadowCanvas = document.createElement("canvas");
    const shadowCtx = shadowCanvas.getContext("2d");
    if (!ctx || !shadowCtx) {
      return;
    }

    const projectedX = new Float32Array(cloth.count);
    const projectedY = new Float32Array(cloth.count);
    const cellsPerRow = cloth.cols - 1;
    const cellCount = cellsPerRow * (cloth.rows - 1);
    const cellOrder = Array.from({ length: cellCount }, (_, index) => index);
    const cellDepth = new Float32Array(cellCount);
    const cellBase = new Float32Array(cellCount * 3);
    const lastCellRow = cloth.rows - 2;

    for (let r = 0; r <= lastCellRow; r += 1) {
      for (let c = 0; c < cellsPerRow; c += 1) {
        const cell = r * cellsPerRow + c;
        const fromEnd = Math.min(r, lastCellRow - r);
        let color = CORAL;
        if (fromEnd === 2 || fromEnd === 3) color = CREAM;
        else if (fromEnd === 4) color = ACCENT;
        let tone = 1;
        if (fromEnd === 0) tone *= 0.92;
        if (c === 0 || c === cellsPerRow - 1) tone *= 0.94;
        cellBase[cell * 3] = color[0] * tone;
        cellBase[cell * 3 + 1] = color[1] * tone;
        cellBase[cell * 3 + 2] = color[2] * tone;
      }
    }

    const shimmer: Wisp[] = [];
    const steam: Wisp[] = [];
    let heat = 0;
    let frame = 0;
    let settleFrames = 0;
    let raf = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let grabbing = false;
    let lastFold = { x: 0, y: 0 };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const nextView = computeView(rect.width, rect.height);
      canvas.width = Math.round(rect.width * nextView.dpr);
      canvas.height = Math.round(rect.height * nextView.dpr);
      shadowCanvas.width = canvas.width;
      shadowCanvas.height = canvas.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      viewRef.current = nextView;
      setView(nextView);
    };

    const updateHandPoint = () => {
      const centre = cloth.centre();
      setHandPoint(projectPoint(centre.x, centre.y - 20, centre.z));
    };

    resize();
    updateHandPoint();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const publishStatus = (next: Status, nextIssue: PlacementIssue | null) => {
      const current = statusRef.current;
      if (current.status === next && current.issue === nextIssue) {
        return;
      }
      statusRef.current = { status: next, issue: nextIssue };
      setStatus(next);
      setIssue(nextIssue);
    };

    const evaluate = () => {
      if (unlockingRef.current) {
        return;
      }

      const report = cloth.evaluate();
      if (report.clean) {
        settleFrames = cloth.speed < 0.06 ? settleFrames + 5 : settleFrames;
      } else {
        settleFrames = 0;
      }

      const placed = report.clean && (placedRef.current || settleFrames >= 30);
      if (placed !== placedRef.current) {
        placedRef.current = placed;
        if (placed) {
          lastFold = { x: report.foldX, y: report.foldY };
          setFoldPoint(projectPoint(report.foldX, report.foldY, SCENE.rail.z));
          sfx.chime();
        }
      }

      if (cloth.isGrabbed) {
        publishStatus("carrying", null);
      } else if (cloth.hooked) {
        publishStatus("hooked", null);
      } else if (placed) {
        publishStatus("placed", null);
      } else if (report.onRail) {
        publishStatus("almost", cloth.speed < 0.12 ? report.issue : statusRef.current.issue);
      } else if (cloth.speed < 0.2) {
        publishStatus("loose", null);
      }

      if (placedRef.current && heat > 0.93 && !unlockingRef.current) {
        unlockingRef.current = true;
        unlockRef.current();
      }
    };

    const drawQuad = (target: CanvasRenderingContext2D, a: number, b: number, c: number, d: number, xs: Float32Array, ys: Float32Array) => {
      target.beginPath();
      target.moveTo(xs[a], ys[a]);
      target.lineTo(xs[b], ys[b]);
      target.lineTo(xs[c], ys[c]);
      target.lineTo(xs[d], ys[d]);
      target.closePath();
    };

    const shadowX = new Float32Array(cloth.count);
    const shadowY = new Float32Array(cloth.count);
    const normals = new Float32Array(cloth.count * 3);

    const computeNormals = () => {
      const p = cloth.pos;
      for (let r = 0; r < cloth.rows; r += 1) {
        for (let c = 0; c < cloth.cols; c += 1) {
          const left = cloth.index(Math.max(0, c - 1), r) * 3;
          const right = cloth.index(Math.min(cloth.cols - 1, c + 1), r) * 3;
          const up = cloth.index(c, Math.max(0, r - 1)) * 3;
          const down = cloth.index(c, Math.min(cloth.rows - 1, r + 1)) * 3;
          const ux = p[right] - p[left];
          const uy = p[right + 1] - p[left + 1];
          const uz = p[right + 2] - p[left + 2];
          const vx = p[down] - p[up];
          const vy = p[down + 1] - p[up + 1];
          const vz = p[down + 2] - p[up + 2];
          const o = cloth.index(c, r) * 3;
          normals[o] = uy * vz - uz * vy;
          normals[o + 1] = uz * vx - ux * vz;
          normals[o + 2] = ux * vy - uy * vx;
        }
      }
    };

    const drawRail = (currentView: View) => {
      const { rail } = SCENE;
      const k = projectScale(rail.z);
      const base = mix([220, 225, 229], [255, 186, 150], heat);
      const highlight = mix([255, 255, 255], [255, 236, 214], heat);
      const shade = mix([158, 166, 173], [214, 120, 88], heat);
      const line = (x1: number, y1: number, x2: number, y2: number) => {
        const from = projectPoint(x1, y1, rail.z);
        const to = projectPoint(x2, y2, rail.z);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      };

      ctx.lineCap = "round";
      ctx.save();
      if (heat > 0.02) {
        ctx.shadowColor = `rgba(255, 112, 60, ${0.55 * heat})`;
        ctx.shadowBlur = 22 * heat * currentView.dpr * currentView.scale;
      }
      ctx.strokeStyle = `rgb(${shade.join(",")})`;
      ctx.lineWidth = rail.postRadius * 2 * k;
      line(rail.left, rail.top, rail.left, rail.bottom);
      line(rail.right, rail.top, rail.right, rail.bottom);
      ctx.lineWidth = rail.rungRadius * 2 * k;
      rail.rungs.forEach((y) => line(rail.left, y, rail.right, y));
      ctx.restore();

      ctx.strokeStyle = `rgb(${base.join(",")})`;
      ctx.lineWidth = rail.postRadius * 1.5 * k;
      line(rail.left - 1, rail.top, rail.left - 1, rail.bottom);
      line(rail.right - 1, rail.top, rail.right - 1, rail.bottom);
      ctx.lineWidth = rail.rungRadius * 1.4 * k;
      rail.rungs.forEach((y) => line(rail.left, y - 1, rail.right, y - 1));

      ctx.strokeStyle = `rgba(${highlight.join(",")}, 0.9)`;
      ctx.lineWidth = rail.postRadius * 0.45 * k;
      line(rail.left - 3, rail.top + 2, rail.left - 3, rail.bottom - 2);
      line(rail.right - 3, rail.top + 2, rail.right - 3, rail.bottom - 2);
      ctx.lineWidth = rail.rungRadius * 0.45 * k;
      rail.rungs.forEach((y) => line(rail.left + 4, y - rail.rungRadius * 0.45, rail.right - 4, y - rail.rungRadius * 0.45));

      const element = projectPoint(rail.right - 9, rail.bottom - 4, rail.z);
      ctx.fillStyle = `rgb(${mix([236, 238, 240], [255, 214, 190], heat).join(",")})`;
      ctx.beginPath();
      ctx.roundRect(element.x, element.y, 18 * k, 26 * k, 4 * k);
      ctx.fill();
      ctx.fillStyle = heat > 0.05 ? `rgba(255, 70, 50, ${0.4 + heat * 0.6})` : "rgba(120, 120, 120, 0.6)";
      ctx.beginPath();
      ctx.arc(element.x + 9 * k, element.y + 18 * k, 2.4 * k, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (now: number) => {
      const currentView = viewRef.current;
      if (!currentView) {
        return;
      }
      const { dpr, scale, offsetX, offsetY } = currentView;
      const p = cloth.pos;
      const { rail } = SCENE;

      for (let i = 0; i < cloth.count; i += 1) {
        const o = i * 3;
        const k = projectScale(p[o + 2]);
        projectedX[i] = SCENE.eye.x + (p[o] - SCENE.eye.x) * k;
        projectedY[i] = SCENE.eye.y + (p[o + 1] - SCENE.eye.y) * k;
        shadowX[i] = p[o] + p[o + 2] * 0.34;
        shadowY[i] = p[o + 1] + p[o + 2] * 0.46;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
      shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
      const transform: [number, number, number, number, number, number] = [
        dpr * scale,
        0,
        0,
        dpr * scale,
        dpr * offsetX,
        dpr * offsetY,
      ];
      ctx.setTransform(...transform);
      shadowCtx.setTransform(...transform);

      shadowCtx.fillStyle = "#000";
      shadowCtx.strokeStyle = "#000";
      shadowCtx.lineWidth = 1.5;
      for (let cell = 0; cell < cellCount; cell += 1) {
        const r = Math.floor(cell / cellsPerRow);
        const c = cell % cellsPerRow;
        const a = cloth.index(c, r);
        drawQuad(shadowCtx, a, a + 1, a + 1 + cloth.cols, a + cloth.cols, shadowX, shadowY);
        shadowCtx.fill();
        shadowCtx.stroke();
      }
      shadowCtx.lineCap = "round";
      shadowCtx.lineWidth = rail.rungRadius * 2;
      const sx = rail.z * 0.34;
      const sy = rail.z * 0.46;
      [rail.left, rail.right].forEach((x) => {
        shadowCtx.beginPath();
        shadowCtx.moveTo(x + sx, rail.top + sy);
        shadowCtx.lineTo(x + sx, rail.bottom + sy);
        shadowCtx.stroke();
      });
      rail.rungs.forEach((y) => {
        shadowCtx.beginPath();
        shadowCtx.moveTo(rail.left + sx, y + sy);
        shadowCtx.lineTo(rail.right + sx, y + sy);
        shadowCtx.stroke();
      });

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.13;
      ctx.drawImage(shadowCanvas, 0, 0);
      ctx.restore();

      for (let cell = 0; cell < cellCount; cell += 1) {
        const r = Math.floor(cell / cellsPerRow);
        const c = cell % cellsPerRow;
        const a = cloth.index(c, r) * 3;
        const d = (cloth.index(c + 1, r + 1)) * 3;
        cellDepth[cell] = (p[a + 2] + p[d + 2] + p[a + 5] + p[a + cloth.cols * 3 + 2]) / 4;
      }
      cellOrder.sort((left, right) => cellDepth[left] - cellDepth[right]);
      computeNormals();

      const warm = heat * 0.06;
      const drawCell = (cell: number) => {
        const r = Math.floor(cell / cellsPerRow);
        const c = cell % cellsPerRow;
        const i00 = cloth.index(c, r);
        const i10 = i00 + 1;
        const i01 = i00 + cloth.cols;
        const i11 = i01 + 1;
        let nx = normals[i00 * 3] + normals[i10 * 3] + normals[i01 * 3] + normals[i11 * 3];
        let ny = normals[i00 * 3 + 1] + normals[i10 * 3 + 1] + normals[i01 * 3 + 1] + normals[i11 * 3 + 1];
        let nz = normals[i00 * 3 + 2] + normals[i10 * 3 + 2] + normals[i01 * 3 + 2] + normals[i11 * 3 + 2];
        const length = Math.hypot(nx, ny, nz) || 1;
        nx /= length;
        ny /= length;
        nz /= length;
        if (nz < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }
        const diffuse = Math.max(0, nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z);
        const shade = Math.min(1.06, 0.5 + 0.6 * diffuse);
        const red = Math.min(255, cellBase[cell * 3] * shade * (1 + warm));
        const green = Math.min(255, cellBase[cell * 3 + 1] * shade);
        const blue = Math.min(255, cellBase[cell * 3 + 2] * shade * (1 - warm));
        const color = `rgb(${red | 0},${green | 0},${blue | 0})`;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        drawQuad(ctx, i00, i10, i11, i01, projectedX, projectedY);
        ctx.fill();
        ctx.stroke();
      };

      ctx.lineWidth = 0.9;
      ctx.lineJoin = "round";
      let index = 0;
      for (; index < cellCount && cellDepth[cellOrder[index]] < rail.z - 1; index += 1) {
        drawCell(cellOrder[index]);
      }
      drawRail(currentView);
      ctx.lineWidth = 0.9;
      for (; index < cellCount; index += 1) {
        drawCell(cellOrder[index]);
      }

      if (heat > 0.25 && Math.random() < heat * 0.5) {
        shimmer.push({
          x: rail.left + Math.random() * (rail.right - rail.left),
          y: rail.rungs[Math.floor(Math.random() * rail.rungs.length)] - 8,
          life: 1,
          size: 2 + Math.random() * 3,
          drift: Math.random() * Math.PI * 2,
        });
      }
      if (placedRef.current && heat > 0.55 && Math.random() < 0.35) {
        steam.push({
          x: lastFold.x + (Math.random() - 0.5) * 150,
          y: lastFold.y + Math.random() * 30,
          life: 1,
          size: 6 + Math.random() * 6,
          drift: Math.random() * Math.PI * 2,
        });
      }

      for (let i = shimmer.length - 1; i >= 0; i -= 1) {
        const wisp = shimmer[i];
        wisp.life -= 0.02;
        wisp.y -= 0.6;
        if (wisp.life <= 0) {
          shimmer.splice(i, 1);
          continue;
        }
        const point = projectPoint(wisp.x + Math.sin(now / 300 + wisp.drift) * 3, wisp.y, rail.z);
        ctx.fillStyle = `rgba(255, 196, 160, ${wisp.life * 0.45})`;
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, wisp.size * 0.6, wisp.size * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = steam.length - 1; i >= 0; i -= 1) {
        const wisp = steam[i];
        wisp.life -= 0.009;
        wisp.y -= 0.9;
        wisp.size += 0.25;
        if (wisp.life <= 0) {
          steam.splice(i, 1);
          continue;
        }
        const point = projectPoint(wisp.x + Math.sin(now / 500 + wisp.drift) * 10, wisp.y, rail.z + 20);
        ctx.fillStyle = `rgba(255, 255, 255, ${wisp.life * 0.28})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, wisp.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      accumulator += dt;
      let steps = 0;
      while (accumulator >= 1 / 120 && steps < 6) {
        if (shiverRef.current > 0) {
          shiverRef.current -= 1;
          const nudge = shiverRef.current % 4 < 2 ? 0.05 : -0.05;
          for (let i = 0; i < cloth.count; i += 1) {
            if (Math.floor(i / cloth.cols) % 2 === 0) {
              cloth.pos[i * 3] += nudge;
            }
          }
        }
        cloth.step();
        accumulator -= 1 / 120;
        steps += 1;
      }
      if (steps === 6) {
        accumulator = 0;
      }

      const targetHeat = heatOnRef.current ? 1 : 0;
      heat += (targetHeat - heat) * Math.min(1, dt * (targetHeat > heat ? 0.9 : 0.5));

      frame += 1;
      if (frame % 5 === 0) {
        evaluate();
      }
      render(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const toScene = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentView = viewRef.current ?? computeView(rect.width, rect.height);
      return {
        x: (event.clientX - rect.left - currentView.offsetX) / currentView.scale,
        y: (event.clientY - rect.top - currentView.offsetY) / currentView.scale,
      };
    };

    const dragTo = (point: { x: number; y: number }) => {
      const { rail, floorY } = SCENE;
      const world = unprojectPoint(point.x, point.y, rail.z);
      let y = Math.min(world.y, floorY - 10);
      const rowCentre = world.x + cloth.heldRowCentreOffset();
      if (rowCentre > rail.left - 30 && rowCentre < rail.right + 30) {
        for (const rungY of rail.rungs) {
          if (y >= rungY - 28 && y <= rungY + 30) {
            y = rungY - RUNG_REACH - 1.5;
            break;
          }
        }
      }
      cloth.drag(world.x, y, rail.z);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (unlockingRef.current) {
        return;
      }
      const point = toScene(event);
      const particle = cloth.nearestParticle(point.x, point.y, projectedX, projectedY, 40);
      if (particle < 0) {
        return;
      }
      event.preventDefault();
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Capture isn't available for every pointer type; dragging still works without it.
      }
      grabbing = true;
      settleFrames = 0;
      placedRef.current = false;
      cloth.grab(particle);
      dragTo(point);
      canvas.style.cursor = "grabbing";
      setEverGrabbed(true);
      setShowHand(false);
      sfx.thud();
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = toScene(event);
      if (grabbing) {
        dragTo(point);
        return;
      }
      if (event.pointerType === "mouse") {
        const over = cloth.nearestParticle(point.x, point.y, projectedX, projectedY, 40) >= 0;
        canvas.style.cursor = over && !unlockingRef.current ? "grab" : "default";
      }
    };

    const onPointerUp = () => {
      if (!grabbing) {
        return;
      }
      grabbing = false;
      cloth.release();
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const handTimer = window.setTimeout(() => setShowHand(true), 2600);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.clearTimeout(handTimer);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      clothRef.current = null;
    };
  }, []);

  const placed = status === "placed";

  useEffect(() => {
    if (!placed || heatOn) {
      setHintLevel(0);
      return;
    }

    const timers = [
      window.setTimeout(() => setHintLevel(1), 4000),
      window.setTimeout(() => setHintLevel(2), 9000),
      window.setTimeout(() => setHintLevel(3), 18000),
      window.setTimeout(() => setHintLevel(4), 30000),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [placed, heatOn]);

  useEffect(() => {
    if (!placed || heatOn || hintLevel < 1) {
      return;
    }

    const shiver = () => {
      shiverRef.current = 26;
      setBrr((value) => value + 1);
    };
    shiver();
    const interval = window.setInterval(shiver, 7000);
    return () => window.clearInterval(interval);
  }, [placed, heatOn, hintLevel]);

  const toggleHeat = () => {
    if (status === "unlocking") {
      return;
    }
    sfx.click();
    sfx.hum(!heatOn);
    setHeatOn((value) => !value);
  };

  const resetTowel = () => {
    if (status === "unlocking") {
      return;
    }
    clothRef.current?.reset();
    placedRef.current = false;
    setEverGrabbed(false);
    const centre = clothRef.current?.centre();
    if (centre) {
      setHandPoint(projectPoint(centre.x, centre.y - 20, centre.z));
    }
  };

  let message = "";
  if (status === "hooked") {
    message = everGrabbed ? "" : "Somebody left the towel on the hook again…";
  } else if (status === "carrying") {
    message = heatOn ? "The rail's nice and warm…" : "";
  } else if (status === "loose") {
    message = "Hmm, not quite. The towel lives on the rail.";
  } else if (status === "almost") {
    message = issue ? ISSUE_MESSAGES[issue] : "Almost…";
  } else if (status === "placed") {
    message = heatOn ? "Mmm. Warming up…" : PLACED_HINTS[hintLevel];
  } else if (status === "unlocking") {
    message = "A warm towel. Perfect.";
  }
  if (heatOn && (status === "hooked" || status === "loose")) {
    message = "The rail's warming up… but where's the towel?";
  }

  const screen = (x: number, y: number) =>
    view ? { left: view.offsetX + x * view.scale, top: view.offsetY + y * view.scale } : { left: 0, top: 0 };
  const plate = SCENE.switchPlate;
  const plateSize = view ? plate.size * view.scale : 0;
  const switchPosition = screen(plate.x - plate.size / 2, plate.y - plate.size / 2);
  const cordPosition = screen(SCENE.cordX, SCENE.cordBeadY);
  const duckPosition = screen(SCENE.window.x + SCENE.window.width - 46, SCENE.window.y + SCENE.window.height - 36);
  const viewBox = view
    ? `${-view.offsetX / view.scale} ${-view.offsetY / view.scale} ${view.width / view.scale} ${view.height / view.scale}`
    : `0 0 ${SCENE.width} ${SCENE.height}`;

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#efe4d4] font-sans text-[#3d2a24] select-none">
      <div ref={hostRef} className="absolute inset-0">
        <BathroomBackdrop
          viewBox={viewBox}
          frost={placed && !heatOn && hintLevel >= 2 ? 1 : 0}
          mirrorFog={mirrorFog}
          showMessage={showMessage}
        />
        <canvas ref={canvasRef} className="absolute inset-0 touch-none" aria-label="A towel you can drag onto the towel rail" />

        <div
          className="pointer-events-none absolute inset-0 bg-[#0d1236] mix-blend-multiply transition-opacity duration-700"
          style={{ opacity: lightsOn ? 0 : 0.62 }}
        />

        {view ? (
          <>
            <button
              type="button"
              onClick={toggleHeat}
              aria-label={heatOn ? "Switch off the towel rail" : "Switch on the towel rail"}
              aria-pressed={heatOn}
              className="absolute grid place-items-center rounded-[18%] border border-[#ddd5c9] bg-[#fdfcf9] shadow-[0_3px_6px_rgba(0,0,0,0.12),inset_0_-2px_0_rgba(0,0,0,0.06)] transition active:scale-95"
              style={{ ...switchPosition, width: plateSize, height: plateSize }}
            >
              <span
                className="absolute rounded-full transition-all duration-300"
                style={{
                  top: plateSize * 0.12,
                  right: plateSize * 0.14,
                  width: plateSize * 0.14,
                  height: plateSize * 0.14,
                  background: heatOn ? "#ff3b2f" : "#7a2d28",
                  boxShadow: heatOn ? `0 0 ${plateSize * 0.3}px #ff4a3a` : "none",
                  animation: !heatOn && placed && hintLevel >= 3 ? "twinkle 2.4s ease-in-out infinite" : undefined,
                }}
              />
              <span
                className="block rounded-[3px] border border-[#e1dbd1] transition-all duration-200"
                style={{
                  width: plateSize * 0.32,
                  height: plateSize * 0.5,
                  background: heatOn
                    ? "linear-gradient(180deg, #e9e4dc 0%, #fdfcf9 55%)"
                    : "linear-gradient(0deg, #e9e4dc 0%, #fdfcf9 55%)",
                  transform: `perspective(80px) rotateX(${heatOn ? 16 : -16}deg)`,
                }}
              />
            </button>

            <div className="absolute w-px bg-[#c8b8a2]" style={{ left: cordPosition.left, top: 0, height: Math.max(0, cordPosition.top) }} />
            <button
              key={`cord-${cordKey}`}
              type="button"
              onClick={() => {
                sfx.click();
                setLightsOn((value) => !value);
                setCordKey((value) => value + 1);
              }}
              aria-label={lightsOn ? "Pull the light cord to switch the lights off" : "Pull the light cord to switch the lights on"}
              className="absolute -translate-x-1/2 animate-[bob_0.5s_ease-out_1]"
              style={{ left: cordPosition.left, top: cordPosition.top - 6, width: 34, height: 44 }}
            >
              <span className="mx-auto block h-5 w-3 rounded-full bg-gradient-to-b from-[#d9b98a] to-[#b48d5c] shadow" />
            </button>

            <button
              key={`duck-${duckKey}`}
              type="button"
              onClick={() => {
                sfx.squeak();
                setDuckKey((value) => value + 1);
              }}
              aria-label="Squeak the rubber duck"
              className="absolute animate-[bob_0.45s_ease-out_2]"
              style={{ left: duckPosition.left, top: duckPosition.top, width: 40 * view.scale, height: 34 * view.scale }}
            >
              <svg viewBox="0 0 40 34" className="h-full w-full drop-shadow-sm">
                <ellipse cx="22" cy="24" rx="16" ry="9" fill="#ffd34d" />
                <circle cx="14" cy="13" r="8" fill="#ffd34d" />
                <path d="M 5 13 q -5 1 -4 4 q 3 1 6 -1 z" fill="#f28c28" />
                <circle cx="12" cy="11" r="1.4" fill="#3d2a24" />
                <path d="M 24 20 q 6 -5 12 0" fill="none" stroke="#f5c02c" strokeWidth="2" />
              </svg>
            </button>

            {showHand && !everGrabbed && handPoint ? (
              <div
                className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={screen(handPoint.x, handPoint.y)}
              >
                <span className="relative block h-10 w-10">
                  <span className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-2 border-white/80 animate-[ripple_1.6s_ease-out_infinite]" />
                  <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow" />
                </span>
                <span className="rounded-full bg-white/85 px-2 py-0.5 font-hand text-lg leading-none text-[#3d2a24] shadow-sm">hold &amp; drag</span>
              </div>
            ) : null}

            {brr > 0 && placed && !heatOn && foldPoint ? (
              <span
                key={`brr-${brr}`}
                className="pointer-events-none absolute -translate-x-1/2 font-hand text-2xl text-[#6f8fb5] animate-[fadeUp_1.6s_ease-out_both]"
                style={screen(foldPoint.x + 70, foldPoint.y - 30)}
              >
                brr
              </span>
            ) : null}
          </>
        ) : null}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#8a6d5f]">before you come in</p>
        <h1 className="mt-1 font-hand text-[clamp(2rem,6vw,3.2rem)] leading-none text-[#3d2a24] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          How should the towel be placed?
        </h1>
      </header>

      <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
        <p
          className="min-h-[2.2rem] max-w-md rounded-full bg-[#fbf7f0]/85 px-5 py-1.5 font-hand text-2xl leading-tight text-[#3d2a24] shadow-sm backdrop-blur transition-opacity duration-500"
          style={{ opacity: message ? 1 : 0 }}
          aria-live="polite"
        >
          {message}
        </p>
        {error ? <p className="text-sm text-[#a3322b]">{error}</p> : null}
        <button
          type="button"
          onClick={resetTowel}
          className="text-xs uppercase tracking-[0.25em] text-[#f6efe6]/80 underline-offset-4 hover:underline"
        >
          start over
        </button>
      </footer>

      <div
        className="pointer-events-none fixed inset-0 grid place-items-center bg-[#fbf6ee] transition-opacity duration-1000"
        style={{ opacity: welcome ? 1 : 0 }}
      >
        <p className="font-hand text-5xl text-[#3d2a24]">Welcome in.</p>
      </div>
    </main>
  );
}
