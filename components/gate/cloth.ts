// World units: x right, y down, z out of the wall towards the viewer (the wall is z = 0).

export const SCENE = {
  width: 600,
  height: 1000,
  floorY: 840,
  eye: { x: 300, y: 250 },
  focal: 900,
  rail: {
    left: 300,
    right: 500,
    top: 372,
    bottom: 690,
    z: 36,
    rungRadius: 6,
    postRadius: 8,
    rungs: [396, 460, 524, 588, 652],
  },
  hook: { x: 128, y: 372, z: 10 },
  towel: { cols: 11, rows: 21, spacing: 17 },
  switchPlate: { x: 556, y: 470, size: 44 },
  cordX: 46,
  cordBeadY: 440,
  mirror: { x: 175, y: 205, r: 82 },
  window: { x: 400, y: 120, width: 160, height: 170 },
};

const GRAVITY = 0.11;
const DAMPING = 0.992;
const ITERATIONS = 10;
const THICKNESS = 4;
export const RUNG_REACH = SCENE.rail.rungRadius + THICKNESS;
const WALL_Z = 3;
const FRONT_Z = 260;
const MAX_RELEASE_SPEED = 16;
const BEND_STIFFNESS = 0.3;
const SEPARATION_BIAS = 0.022;

export const projectScale = (z: number): number => SCENE.focal / (SCENE.focal - z);

export const projectPoint = (x: number, y: number, z: number) => {
  const k = projectScale(z);
  return {
    x: SCENE.eye.x + (x - SCENE.eye.x) * k,
    y: SCENE.eye.y + (y - SCENE.eye.y) * k,
  };
};

export const unprojectPoint = (sx: number, sy: number, z: number) => {
  const k = projectScale(z);
  return {
    x: SCENE.eye.x + (sx - SCENE.eye.x) / k,
    y: SCENE.eye.y + (sy - SCENE.eye.y) / k,
  };
};

export type PlacementIssue = "lopsided" | "crooked" | "off-centre" | "slipping";

export interface PlacementReport {
  onRail: boolean;
  clean: boolean;
  issue: PlacementIssue | null;
  rung: number;
  foldX: number;
  foldY: number;
}

const NOT_ON_RAIL: PlacementReport = {
  onRail: false,
  clean: false,
  issue: null,
  rung: -1,
  foldX: 0,
  foldY: 0,
};

export class Cloth {
  readonly cols = SCENE.towel.cols;
  readonly rows = SCENE.towel.rows;
  readonly spacing = SCENE.towel.spacing;
  readonly count = this.cols * this.rows;
  readonly pos = new Float32Array(this.count * 3);
  readonly prev = new Float32Array(this.count * 3);
  readonly target = new Float32Array(this.count * 3);
  readonly pinned = new Uint8Array(this.count);

  hooked = true;
  grabRow = -1;
  grabCol = -1;
  speed = 0;

  private separationRow = -1;
  private separationTimer = 0;
  private readonly constraintA: Uint16Array;
  private readonly constraintB: Uint16Array;
  private readonly restLength: Float32Array;
  private readonly stiffness: Float32Array;

  constructor() {
    const a: number[] = [];
    const b: number[] = [];
    const rest: number[] = [];
    const stiff: number[] = [];
    const add = (i: number, j: number, length: number, k: number) => {
      a.push(i);
      b.push(j);
      rest.push(length);
      stiff.push(k);
    };
    const s = this.spacing;

    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const i = this.index(c, r);
        if (c + 1 < this.cols) add(i, i + 1, s, 1);
        if (r + 1 < this.rows) add(i, i + this.cols, s, 1);
        if (c + 1 < this.cols && r + 1 < this.rows) {
          add(i, i + this.cols + 1, s * Math.SQRT2, 0.85);
          add(i + 1, i + this.cols, s * Math.SQRT2, 0.85);
        }
        if (c + 2 < this.cols) add(i, i + 2, s * 2, BEND_STIFFNESS);
        if (r + 2 < this.rows) add(i, i + this.cols * 2, s * 2, BEND_STIFFNESS);
      }
    }

    this.constraintA = Uint16Array.from(a);
    this.constraintB = Uint16Array.from(b);
    this.restLength = Float32Array.from(rest);
    this.stiffness = Float32Array.from(stiff);
    this.reset();
  }

  index(c: number, r: number): number {
    return r * this.cols + c;
  }

  get isGrabbed(): boolean {
    return this.grabRow >= 0;
  }

  reset(): void {
    const { hook } = SCENE;
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const o = this.index(c, r) * 3;
        this.pos[o] = hook.x + c * this.spacing * 0.98;
        this.pos[o + 1] = hook.y + r * this.spacing * 0.98;
        this.pos[o + 2] = hook.z + (c % 2) * 0.4;
        this.prev[o] = this.pos[o];
        this.prev[o + 1] = this.pos[o + 1];
        this.prev[o + 2] = this.pos[o + 2];
      }
    }

    this.pinned.fill(0);
    this.hooked = true;
    this.grabRow = -1;
    this.grabCol = -1;
    this.separationRow = -1;
    this.separationTimer = 0;
    this.pinToHook();

    for (let step = 0; step < 480; step += 1) {
      this.step();
    }
  }

  private pinToHook(): void {
    const { hook } = SCENE;
    this.pinned[0] = 1;
    this.target[0] = hook.x;
    this.target[1] = hook.y;
    this.target[2] = hook.z;
  }

  nearestParticle(px: number, py: number, projectedX: Float32Array, projectedY: Float32Array, radius: number): number {
    let best = -1;
    let bestScore = radius * radius;
    for (let i = 0; i < this.count; i += 1) {
      const dx = projectedX[i] - px;
      const dy = projectedY[i] - py;
      const score = dx * dx + dy * dy - this.pos[i * 3 + 2] * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  grab(particle: number): void {
    this.hooked = false;
    this.pinned.fill(0);
    this.grabRow = Math.floor(particle / this.cols);
    this.grabCol = particle % this.cols;
    this.separationRow = this.grabRow;
    this.separationTimer = Number.POSITIVE_INFINITY;

    for (let c = 0; c < this.cols; c += 1) {
      const i = this.index(c, this.grabRow);
      this.pinned[i] = 1;
      this.target[i * 3] = this.pos[i * 3];
      this.target[i * 3 + 1] = this.pos[i * 3 + 1];
      this.target[i * 3 + 2] = this.pos[i * 3 + 2];
    }
  }

  // Places the held row so the particle under the pointer sits at (x, y, z).
  drag(x: number, y: number, z: number): void {
    if (!this.isGrabbed) {
      return;
    }
    const gap = this.spacing * 0.94;
    for (let c = 0; c < this.cols; c += 1) {
      const i = this.index(c, this.grabRow);
      this.target[i * 3] = x + (c - this.grabCol) * gap;
      this.target[i * 3 + 1] = y;
      this.target[i * 3 + 2] = z;
    }
  }

  heldRowCentreOffset(): number {
    return ((this.cols - 1) / 2 - this.grabCol) * this.spacing * 0.94;
  }

  release(): void {
    if (!this.isGrabbed) {
      return;
    }
    for (let c = 0; c < this.cols; c += 1) {
      const o = this.index(c, this.grabRow) * 3;
      for (let axis = 0; axis < 3; axis += 1) {
        const velocity = this.pos[o + axis] - this.prev[o + axis];
        const clamped = Math.max(-MAX_RELEASE_SPEED, Math.min(MAX_RELEASE_SPEED, velocity));
        this.prev[o + axis] = this.pos[o + axis] - clamped;
      }
    }
    this.pinned.fill(0);
    this.grabRow = -1;
    this.grabCol = -1;
    this.separationTimer = 90;
  }

  step(): void {
    const p = this.pos;
    const q = this.prev;
    let motion = 0;

    if (this.separationTimer > 0 && Number.isFinite(this.separationTimer)) {
      this.separationTimer -= 1;
    }
    const separating = this.separationTimer > 0 && this.separationRow >= 0;

    for (let i = 0; i < this.count; i += 1) {
      const o = i * 3;
      if (this.pinned[i]) {
        q[o] = p[o];
        q[o + 1] = p[o + 1];
        q[o + 2] = p[o + 2];
        p[o] += (this.target[o] - p[o]) * 0.5;
        p[o + 1] += (this.target[o + 1] - p[o + 1]) * 0.5;
        p[o + 2] += (this.target[o + 2] - p[o + 2]) * 0.5;
        continue;
      }

      const vx = (p[o] - q[o]) * DAMPING;
      const vy = (p[o + 1] - q[o + 1]) * DAMPING;
      const vz = (p[o + 2] - q[o + 2]) * DAMPING;
      q[o] = p[o];
      q[o + 1] = p[o + 1];
      q[o + 2] = p[o + 2];

      let bias = 0;
      if (separating) {
        const row = Math.floor(i / this.cols);
        bias = row < this.separationRow ? -SEPARATION_BIAS : row > this.separationRow ? SEPARATION_BIAS : 0;
      }

      p[o] += vx;
      p[o + 1] += vy + GRAVITY;
      p[o + 2] += vz + bias;
      motion += Math.abs(vx) + Math.abs(vy) + Math.abs(vz);
    }

    this.speed = motion / this.count;

    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      this.solveConstraints();
      this.collide(iteration === ITERATIONS - 1);
    }
  }

  private solveConstraints(): void {
    const p = this.pos;
    const total = this.constraintA.length;
    for (let k = 0; k < total; k += 1) {
      const ia = this.constraintA[k];
      const ib = this.constraintB[k];
      const wa = this.pinned[ia] ? 0 : 1;
      const wb = this.pinned[ib] ? 0 : 1;
      const weight = wa + wb;
      if (weight === 0) {
        continue;
      }
      const a = ia * 3;
      const b = ib * 3;
      const dx = p[b] - p[a];
      const dy = p[b + 1] - p[a + 1];
      const dz = p[b + 2] - p[a + 2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < 1e-6) {
        continue;
      }
      const restLength = this.restLength[k];
      // Bend springs only push apart (resisting sharp folds); stretching is left to the structural springs.
      if (this.stiffness[k] < 0.5 && distance > restLength) {
        continue;
      }
      const correction = ((distance - restLength) / distance) * this.stiffness[k];
      const ca = (correction * wa) / weight;
      const cb = (correction * wb) / weight;
      p[a] += dx * ca;
      p[a + 1] += dy * ca;
      p[a + 2] += dz * ca;
      p[b] -= dx * cb;
      p[b + 1] -= dy * cb;
      p[b + 2] -= dz * cb;
    }
  }

  private collide(withFriction: boolean): void {
    const p = this.pos;
    const q = this.prev;
    const { rail, floorY } = SCENE;
    const reach2 = RUNG_REACH * RUNG_REACH;

    for (let i = 0; i < this.count; i += 1) {
      if (this.pinned[i]) {
        continue;
      }
      const o = i * 3;

      if (p[o + 2] < WALL_Z) {
        p[o + 2] = WALL_Z;
        if (withFriction) {
          q[o + 2] = p[o + 2];
          q[o] += (p[o] - q[o]) * 0.25;
          q[o + 1] += (p[o + 1] - q[o + 1]) * 0.25;
        }
      } else if (p[o + 2] > FRONT_Z) {
        p[o + 2] = FRONT_Z;
      }

      if (p[o] > rail.left - 4 && p[o] < rail.right + 4) {
        for (let r = 0; r < rail.rungs.length; r += 1) {
          let dy = p[o + 1] - rail.rungs[r];
          let dz = p[o + 2] - rail.z;
          const d2 = dy * dy + dz * dz;
          if (d2 >= reach2) {
            continue;
          }
          let d = Math.sqrt(d2);
          if (d < 1e-4) {
            dy = -1;
            dz = 0;
            d = 1;
          }
          p[o + 1] = rail.rungs[r] + (dy / d) * RUNG_REACH;
          p[o + 2] = rail.z + (dz / d) * RUNG_REACH;
          if (withFriction) {
            q[o] += (p[o] - q[o]) * 0.55;
            q[o + 1] += (p[o + 1] - q[o + 1]) * 0.45;
            q[o + 2] += (p[o + 2] - q[o + 2]) * 0.45;
          }
        }
      }

      if (p[o + 1] > floorY - 2) {
        p[o + 1] = floorY - 2;
        if (withFriction) {
          q[o] += (p[o] - q[o]) * 0.8;
          q[o + 2] += (p[o + 2] - q[o + 2]) * 0.8;
        }
      }

      if (p[o] < -700) p[o] = -700;
      if (p[o] > 1300) p[o] = 1300;
      if (p[o + 1] < -500) p[o + 1] = -500;
    }
  }

  centre(): { x: number; y: number; z: number } {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < this.count; i += 1) {
      x += this.pos[i * 3];
      y += this.pos[i * 3 + 1];
      z += this.pos[i * 3 + 2];
    }
    return { x: x / this.count, y: y / this.count, z: z / this.count };
  }

  evaluate(): PlacementReport {
    if (this.isGrabbed || this.hooked) {
      return NOT_ON_RAIL;
    }

    const { rail } = SCENE;
    const p = this.pos;
    const contactLimit = (RUNG_REACH + 3.5) ** 2;
    const counts = rail.rungs.map(() => 0);

    for (let i = 0; i < this.count; i += 1) {
      const o = i * 3;
      if (p[o] < rail.left - 4 || p[o] > rail.right + 4) {
        continue;
      }
      rail.rungs.forEach((rungY, r) => {
        const dy = p[o + 1] - rungY;
        const dz = p[o + 2] - rail.z;
        if (dy < -RUNG_REACH * 0.35 && dy * dy + dz * dz < contactLimit) {
          counts[r] += 1;
        }
      });
    }

    let rung = -1;
    let best = 0;
    counts.forEach((count, r) => {
      if (count > best) {
        best = count;
        rung = r;
      }
    });

    if (rung < 0 || best < this.cols * 0.5) {
      return NOT_ON_RAIL;
    }

    const rungY = rail.rungs[rung];
    const foldRows: number[] = [];
    let missingColumns = 0;
    let foldX = 0;

    for (let c = 0; c < this.cols; c += 1) {
      let sum = 0;
      let n = 0;
      for (let r = 0; r < this.rows; r += 1) {
        const o = this.index(c, r) * 3;
        const dy = p[o + 1] - rungY;
        const dz = p[o + 2] - rail.z;
        if (p[o] > rail.left - 4 && p[o] < rail.right + 4 && dy < -RUNG_REACH * 0.35 && dy * dy + dz * dz < contactLimit) {
          sum += r;
          n += 1;
          foldX += p[o];
        }
      }
      if (n === 0) {
        missingColumns += 1;
      } else {
        foldRows.push(sum / n);
      }
    }

    const report = (issue: PlacementIssue | null): PlacementReport => ({
      onRail: true,
      clean: issue === null,
      issue,
      rung,
      foldX: best > 0 ? foldX / best : rail.left,
      foldY: rungY - RUNG_REACH,
    });

    if (missingColumns > 1 || foldRows.length === 0) {
      return report("slipping");
    }

    const meanFold = foldRows.reduce((total, row) => total + row, 0) / foldRows.length;
    const spread = Math.max(...foldRows) - Math.min(...foldRows);
    let front = 0;
    let back = 0;
    let centreX = 0;
    for (let i = 0; i < this.count; i += 1) {
      const z = p[i * 3 + 2];
      centreX += p[i * 3];
      if (z > rail.z + 2) front += 1;
      else if (z < rail.z - 2) back += 1;
    }
    centreX /= this.count;

    const balance = meanFold / (this.rows - 1);
    if (balance < 0.36 || balance > 0.64 || Math.min(front, back) < this.count * 0.24) {
      return report("lopsided");
    }
    if (spread > 3.5) {
      return report("crooked");
    }
    if (Math.abs(centreX - (rail.left + rail.right) / 2) > 20) {
      return report("off-centre");
    }
    return report(null);
  }
}
