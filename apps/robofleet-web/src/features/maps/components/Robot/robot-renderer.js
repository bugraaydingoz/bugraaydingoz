/* eslint-disable no-unused-vars -- Preserve the supplied renderer and its shared illustration helpers. */
// Colorfigures geometry, isolated per render: no globals, DOM access, or animation loops.
export const ROBOT_CAMERA_PITCH = 24;

/** Convert map heading to camera yaw so the robot's local +X front follows the route. */
export function robotCameraYaw(heading, groundRatio = 0.5) {
  if (!Number.isFinite(heading) || !Number.isFinite(groundRatio) || groundRatio <= 0)
    throw new TypeError("Robot heading and ground ratio must be finite, with a positive ratio");

  const radians = (heading * Math.PI) / 180;
  const projectedX = Math.cos(radians) - Math.sin(radians);
  const projectedY = (Math.cos(radians) + Math.sin(radians)) * groundRatio;
  const pitch = (ROBOT_CAMERA_PITCH * Math.PI) / 180;

  return (Math.atan2(projectedX * Math.sin(pitch), projectedY) * 180) / Math.PI;
}

export function renderRobot(color, yaw = 30, wheelAngle = 0) {
  if (!/^#[0-9a-f]{6}$/i.test(color))
    throw new TypeError("Robot color must be a six-digit hex value");
  if (!Number.isFinite(yaw) || !Number.isFinite(wheelAngle))
    throw new TypeError("Robot angles must be finite");
  const INK_REF_VB = 585;
  let INK_K = 0.65;
  const PALS = {
    mustard: { l: "#f4b829", m: "#d49c1f", d: "#4e4a18" },
    tomato: { l: "#ef6a4c", m: "#cf5038", d: "#4a2219" },
    mint: { l: "#93d3b0", m: "#71b693", d: "#1f4034" },
    cobalt: { l: "#76a0e2", m: "#5a82c6", d: "#1c2948" },
    blush: { l: "#f3a6bb", m: "#d8869c", d: "#4b2430" },
  };
  const METAL = { l: "#eef0f0", m: "#c6ccce", d: "#8f989b" };
  const CLEAR = { l: "#e4f2f4", m: "#c4dfe4", d: "#97b9c0" };
  const CERAMIC = { l: "#fbfaf3", m: "#e3e0d2", d: "#bdb8a6" };
  const DARK = { l: "#55504a", m: "#3d3935", d: "#272421" };
  const INK = "#231e16";
  const SHADOW = "#41538f";

  /* ---------- projection (x = depth toward viewer-right, y = toward viewer-left, z = up) ---------- */
  const C = Math.cos(Math.PI / 6),
    S = Math.sin(Math.PI / 6);
  let OX = 0,
    OY = 0;
  /* Free orthographic camera (internal names start with CAM_ / cam so they never clash with a figure's own names). YAW turns the viewer around the vertical axis (45° = the classic front-left view),
   PITCH is how far it looks down (35.26° = true isometric). At the defaults P() is exactly the old isometric
   projection, so every figure drawn for it still lines up. Drag the figure to orbit; double-click to reset.
   rotV(n) maps a world direction into the default view's frame, so vis / tone / any "sum of rotV > 0" test keep
   working at every angle: the viewer is always (1,1,1) and the light stays put relative to the viewer. */
  let VIEW = 0,
    RC = [0, 0],
    RCZ = 0;
  const VIEW_NAMES = ["front", "left side", "back", "right side"];
  const TURNS = [0, 2];
  const YAW0 = 45,
    PITCH0 = (Math.atan(1 / Math.SQRT2) * 180) / Math.PI,
    CAM_K = Math.sqrt(1.5);
  let YAW = YAW0,
    PITCH = PITCH0,
    CAM_R,
    CAM_U,
    CAM_V,
    CAM_D; // right, up, toward viewer, screen-down
  const camBasis = (yaw, pitch) => {
    const t = (yaw * Math.PI) / 180,
      p = (pitch * Math.PI) / 180,
      ct = Math.cos(t),
      st = Math.sin(t),
      cp = Math.cos(p),
      sp2 = Math.sin(p);
    return { R: [st, -ct, 0], U: [-sp2 * ct, -sp2 * st, cp], V: [cp * ct, cp * st, sp2] };
  };
  const CAM_B0 = camBasis(YAW0, PITCH0);
  // CAM_LIM: how far (deg) the camera may turn either side of the front view; null = all the way round (set per figure)
  let CAM_LIM = null;
  function setCam(yaw, pitch) {
    YAW = CAM_LIM == null ? yaw : Math.max(YAW0 - CAM_LIM, Math.min(YAW0 + CAM_LIM, yaw));
    PITCH = CAM_LIM == null ? Math.max(6, Math.min(78, pitch)) : Math.max(15, Math.min(62, pitch));
    const b = camBasis(YAW, PITCH);
    CAM_R = b.R;
    CAM_U = b.U;
    CAM_V = b.V;
    CAM_D = CAM_U.map((v) => -v);
  }
  setCam(YAW0, PITCH0);
  const camDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rotV = (n) => {
    const r = camDot(n, CAM_R),
      u = camDot(n, CAM_U),
      v = camDot(n, CAM_V);
    return [0, 1, 2].map((i) => CAM_B0.R[i] * r + CAM_B0.U[i] * u + CAM_B0.V[i] * v);
  };
  // the light's ground direction turns with the viewer's yaw only (shadows always fall toward the lower left of the screen)
  const yawTurn = ([x, y]) => {
    const t = ((YAW - YAW0) * Math.PI) / 180,
      c = Math.cos(t),
      s = Math.sin(t);
    return [x * c - y * s, x * s + y * c];
  };
  const rotXY = (x, y) => [x, y]; // kept for old callers
  const P0 = (x, y, z) => [(x - y) * C + OX, (x + y) * S - z + OY]; // raw iso
  const P = (x, y, z) => {
    const q = [x - RC[0], y - RC[1], z - RCZ];
    return [
      CAM_K * camDot(q, CAM_R) + (RC[0] - RC[1]) * C + OX,
      CAM_K * camDot(q, CAM_D) + (RC[0] + RC[1]) * S - RCZ + OY,
    ];
  };
  const Dv = (x, y, z) => [CAM_K * camDot([x, y, z], CAM_R), CAM_K * camDot([x, y, z], CAM_D)];
  // distance toward the viewer: draw parts with smaller depth first
  const depthOf = (p) => camDot(p, CAM_V);
  // sort [{at:[x,y,z], svg}] back-to-front for the current camera. A part may also give box:[[x0,y0,z0],[x1,y1,z1]]:
  // when two boxes are separated along x, y or z, the one on the viewer's side goes last (a centre point alone gets long
  // or wrapping parts wrong: a pole beside a row of keys, a spout reaching past a cup).
  const boxMid = (b) => [0, 1, 2].map((k) => (b[0][k] + b[1][k]) / 2);
  const sepOrder = (p, q) => {
    if (!p.box || !q.box) return 0;
    for (let k = 0; k < 3; k++) {
      if (p.box[1][k] <= q.box[0][k] + 1e-6) return CAM_V[k] >= 0 ? -1 : 1;
      if (q.box[1][k] <= p.box[0][k] + 1e-6) return CAM_V[k] >= 0 ? 1 : -1;
    }
    return 0;
  };
  const byDepth = (parts) =>
    parts
      .filter(Boolean)
      .sort(
        (p, q) => sepOrder(p, q) || depthOf(p.at || boxMid(p.box)) - depthOf(q.at || boxMid(q.box)),
      )
      .map((p) => p.svg)
      .join("");
  // the half of a vertical ring that faces the viewer / is turned away, as [from, to] angles in degrees (0 = +x, 90 = +y)
  const nearHalf = () => [YAW - 90, YAW + 90],
    farHalf = () => [YAW + 90, YAW + 270];
  // an open container (cup, bin, cone, drum) between two rings: far inner wall, then its contents, then the near outer wall
  const openShell = (A, B, colour, contents = "") =>
    loft(A, B, colour, true) + contents + loft(A, B, colour);
  const f = (v) => v.toFixed(1);
  const pd = (pts, close = true) =>
    "M" +
    pts
      .map((p) => {
        const q = P(p[0], p[1], p[2]);
        return f(q[0]) + " " + f(q[1]);
      })
      .join("L") +
    (close ? "Z" : "");
  const sp = (pts) => "M" + pts.map((q) => f(q[0]) + " " + f(q[1])).join("L") + "Z";

  /* ---------- 2D shapes in a plane's (u,v) coords (v up), mapped to 3D by a plane ---------- */
  const arcUV = (cu, cv, r, a0, a1, n = 7) => {
    const o = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      o.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
    }
    return o;
  };
  const rrUV = (u0, v0, u1, v1, r, n = 7) =>
    r <= 0
      ? rectUV(u0, v0, u1, v1)
      : [
          ...arcUV(u1 - r, v0 + r, r, -90, 0, n),
          ...arcUV(u1 - r, v1 - r, r, 0, 90, n),
          ...arcUV(u0 + r, v1 - r, r, 90, 180, n),
          ...arcUV(u0 + r, v0 + r, r, 180, 270, n),
        ];
  const rectUV = (u0, v0, u1, v1) => [
    [u0, v0],
    [u1, v0],
    [u1, v1],
    [u0, v1],
  ];
  const ellUV = (cu, cv, ru, rv, n = 24) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI;
      return [cu + ru * Math.cos(a), cv + rv * Math.sin(a)];
    });
  const PX =
    (x) =>
    ([u, v]) => [x, u, v]; // front-facing plane x = const   (u = y, v = z)
  const PY =
    (y) =>
    ([u, v]) => [u, y, v]; // side plane y = const           (u = x, v = z)
  const PZ =
    (z) =>
    ([u, v]) => [u, v, z]; // horizontal plane z = const     (u = x, v = y)
  const on = (plane, uv) => uv.map(plane);

  /* ---------- vectors + shading ---------- */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const norm = (a) => {
    const l = Math.hypot(...a) || 1;
    return a.map((v) => v / l);
  };
  const avg = (ps) =>
    ps.reduce(
      (s, p) => [s[0] + p[0] / ps.length, s[1] + p[1] / ps.length, s[2] + p[2] / ps.length],
      [0, 0, 0],
    );
  const vis = (n) => {
    const r = rotV(n);
    return r[0] + r[1] + r[2] > 1e-6;
  }; // viewer looks from (+1,+1,+1) after the turn
  const facing = vis; // readable alias: is this face toward the viewer?
  const SHADOW_K = 0.85,
    AZ_MIN = 20,
    AZ_MAX = 160;
  // cast shadows are drawn shorter than the shading light implies (0.45 × height instead of 0.85 ×): long shadows of tall
  // parts on thin supports (a lamp shade, a fan head) land far from the object and read as separate blobs
  const SHADOW_LEN = 0.45;
  let L = [0, 0, 1],
    SH = [0, 0];
  function setLight(deg) {
    const a = (deg * Math.PI) / 180;
    SH = [SHADOW_K * Math.cos(a), SHADOW_K * Math.sin(a)];
    L = norm([-SH[0], -SH[1], 1]);
  }
  const LIN = norm([0.6, 0.2, 1]); // fixed light for interiors / small props
  // Three flat tones, but blended across a narrow band at each step, so a face that turns past a threshold while the
  // figure rotates fades between tones instead of snapping (at rest almost every face still sits on a pure tone).
  const SOFT = 0.18;
  const step3 = (d, hi, lo, m) => {
    const ss = (a, b, x) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    const a = ss(hi - SOFT, hi + SOFT, d),
      b = ss(lo - SOFT, lo + SOFT, d);
    return a >= 1 ? m.l : b <= 0 ? m.d : a > 0 ? mix(m.m, m.l, a) : b < 1 ? mix(m.d, m.m, b) : m.m;
  };
  const tone = (n, m) => step3(dot(rotV(n), L), -0.15, -0.45, m); // exterior, follows the sun
  const toneI = (n, m) => step3(dot(rotV(n), LIN), 0.6, 0.05, m); // interior / props
  const mix = (a, b, t) =>
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  const matOf = (hex) => ({ l: hex, m: mix(hex, "#000000", 0.16), d: mix(hex, "#000000", 0.42) });
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /* ---------- drawing primitives (all return SVG strings) ---------- */
  const ink = (d, w = 1.0) =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const fill = (d, c, extra = "") => `<path d="${d}" fill="${c}" ${extra}/>`;
  const face = (d, c) =>
    `<path d="${d}" fill="${c}" stroke="${c}" stroke-width=".7" stroke-linejoin="round"/>`;
  const shape = (pts, c, w = 0.9) => fill(pd(pts), c) + (w ? ink(pd(pts), w) : "");
  const line = (pts, w = 0.9) => ink(pd(pts, false), w);
  // Loft between two rings of equal length (closed). colour(n) picks each strip's fill; flip = seen from inside.
  function loft(A, B, colour, flip = false) {
    const n = A.length,
      cen = avg(A.concat(B));
    let s = "";
    for (let i = 0; i < n; i++) {
      const a0 = A[i],
        a1 = A[(i + 1) % n],
        b1 = B[(i + 1) % n],
        b0 = B[i];
      let nr = norm(cross(sub(a1, a0), sub(b0, a0)));
      if (!isFinite(nr[0])) continue;
      if (dot(nr, sub(avg([a0, a1, b1, b0]), cen)) < 0) nr = nr.map((v) => -v);
      if (flip) nr = nr.map((v) => -v);
      if (vis(nr)) s += face(pd([a0, a1, b1, b0]), colour(nr));
    }
    return s;
  }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [],
      up = [];
    for (const p of pts) {
      while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (const p of pts.reverse()) {
      while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
      up.push(p);
    }
    lo.pop();
    up.pop();
    return lo.concat(up);
  }
  // Silhouette ink, weighted by how thick the part is on screen (like a hand inker): the w you pass is the most it gets.
  // Thickness = 2 × area / perimeter of the outline (a rod's diameter, about half a box's width), as a share of the
  // frame width. A long thin rod, a handle or a knob stays light (~1–1.5); a grinder, kettle or machine body gets the
  // heavy ~2.4–2.8. Thin parts stay thin and parts keep air between them.
  const hullInk = (pts3, w = 1.4) => {
    const h = hull(pts3.map((p) => P(...p)));
    let a = 0,
      per = 0;
    for (let i = 0; i < h.length; i++) {
      const p = h[i],
        q = h[(i + 1) % h.length];
      a += p[0] * q[1] - q[0] * p[1];
      per += Math.hypot(q[0] - p[0], q[1] - p[1]);
    }
    const thick = per ? Math.abs(a) / per / (INK_K * INK_REF_VB) : 0;
    return ink(sp(h), Math.min(w, 0.9 + 20 * thick));
  };
  // Axis-aligned box: three visible faces, shaded, each outlined. shade = tone (sunlit) or toneI (interior).
  function box(x0, y0, z0, x1, y1, z1, m, shade = toneI, w = 0.9) {
    // all six faces, drawn only when they face the viewer (sides first, then top) — correct in every VIEW
    const F = [
      [
        [0, 1, 0],
        [
          [x0, y1, z0],
          [x1, y1, z0],
          [x1, y1, z1],
          [x0, y1, z1],
        ],
      ],
      [
        [1, 0, 0],
        [
          [x1, y0, z0],
          [x1, y1, z0],
          [x1, y1, z1],
          [x1, y0, z1],
        ],
      ],
      [
        [0, -1, 0],
        [
          [x0, y0, z0],
          [x1, y0, z0],
          [x1, y0, z1],
          [x0, y0, z1],
        ],
      ],
      [
        [-1, 0, 0],
        [
          [x0, y0, z0],
          [x0, y1, z0],
          [x0, y1, z1],
          [x0, y0, z1],
        ],
      ],
      [
        [0, 0, 1],
        [
          [x0, y0, z1],
          [x1, y0, z1],
          [x1, y1, z1],
          [x0, y1, z1],
        ],
      ],
    ];
    return F.filter(([n]) => vis(n))
      .map(([n, q]) => shape(q, shade(n, m), w))
      .join("");
  }
  // Rounded-profile extrusion: profile (u=y, v=z) swept along x from x0 to x1. Body of most machines.
  function extrude(profileUV, x0, x1, m, shade = tone) {
    return loft(on(PX(x0), profileUV), on(PX(x1), profileUV), (n) => shade(n, m));
  }
  // Vertical cylinder (axis z) centred (x,y), radius r from z0 to z1, with top cap.
  function cyl(x, y, z0, z1, r, m, shade = toneI, w = 1.2, n = 24) {
    const A = on(PZ(z0), ellUV(x, y, r, r, n)),
      B = on(PZ(z1), ellUV(x, y, r, r, n));
    return (
      loft(A, B, (nr) => shade(nr, m)) +
      fill(pd(B), shade([0, 0, 1], m)) +
      hullInk([...A, ...B], w) +
      ink(pd(B), w * 0.8)
    );
  }
  // Cylinder lying along x (e.g. a knob or dial sticking out of a front face): centred (y,z), from x0 to x1.
  function cylX(x0, x1, y, z, r, m, shade = toneI, w = 1.1, n = 20) {
    const A = on(PX(x0), ellUV(y, z, r, r, n)),
      B = on(PX(x1), ellUV(y, z, r, r, n));
    // cap on whichever end faces the viewer (the +x end in VIEW 0)
    const capB = vis([1, 0, 0]),
      cap = capB ? B : A,
      cn = capB ? [1, 0, 0] : [-1, 0, 0];
    return (
      loft(A, B, (nr) => shade(nr, m)) +
      (vis(cn) ? fill(pd(cap), shade(cn, m)) : "") +
      hullInk([...A, ...B], w) +
      (vis(cn) ? ink(pd(cap), w * 0.8) : "")
    );
  }
  // Cylinder between any two 3D points a and b (a lamp arm, a rod, a pipe at an angle, a handle bar), radius r.
  // The end facing the viewer gets a cap. For a tapered part (a cone, a lamp shade) pass r1 for the radius at b.
  function rod(a, b, r, m, shade = toneI, w = 1, r1 = r, n = 16) {
    const d = norm(sub(b, a)),
      u = norm(cross(d, Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])),
      v = cross(d, u);
    const ring = (p, rr) =>
      Array.from({ length: n }, (_, i) => {
        const t = (i / n) * 2 * Math.PI,
          c = Math.cos(t) * rr,
          s2 = Math.sin(t) * rr;
        return [
          p[0] + u[0] * c + v[0] * s2,
          p[1] + u[1] * c + v[1] * s2,
          p[2] + u[2] * c + v[2] * s2,
        ];
      });
    const A = ring(a, r),
      B = ring(b, r1),
      capB = vis(d),
      cap = capB ? B : A,
      cn = capB ? d : d.map((x) => -x);
    return (
      loft(A, B, (nr) => shade(nr, m)) +
      (Math.max(r, r1) > 0 ? fill(pd(cap), shade(cn, m)) + ink(pd(cap), w * 0.8) : "") +
      hullInk([...A, ...B], w)
    );
  }
  setCam(30, 24);
  setLight(110);
  OX = 120;
  OY = 177;
  INK_K = 0.65;
  const botCream = matOf("#f6e6bd"),
    botJoint = matOf("#677273"),
    botVisor = matOf("#293d42");
  function botRender(col, yaw = 30, wheelAngle = 0) {
    setCam(yaw, ROBOT_CAMERA_PITCH);
    const bm = matOf(col),
      bits = [];
    const put = (a, b, s) => bits.push({ box: [a, b], svg: s });
    const rounded = (a, b, r, m, detail = "") => {
      const pr = rrUV(a[1], a[2], b[1], b[2], r, 5),
        ap = on(PX(a[0]), pr),
        bp = on(PX(b[0]), pr);
      let s = extrude(pr, a[0], b[0], m, toneI);
      if (vis([1, 0, 0])) s += shape(bp, toneI([1, 0, 0], m), 1.1) + detail;
      if (vis([-1, 0, 0])) {
        s += shape(ap, toneI([-1, 0, 0], m), 1.1);
        if (a[2] === 49) {
          s += shape(
            on(PX(a[0] - 0.1), rrUV(-15, 58, 15, 79, 3)),
            toneI([-1, 0, 0], botJoint),
            0.8,
          );
          for (let z = 63; z <= 74; z += 4)
            s += line(
              [
                [a[0] - 0.2, -9, z],
                [a[0] - 0.2, 9, z],
              ],
              0.8,
            );
        }
      }
      s += hullInk([...ap, ...bp], 2.3);
      put(a, b, s);
    };
    const panel = (x, y0, z0, y1, z1, r, c, w = 1) =>
      shape(on(PX(x), rrUV(y0, z0, y1, z1, r)), c, w);
    // One wide rubber monowheel; the fork connects its axle to the body.
    put(
      [-22, -10, 0],
      [22, 10, 44],
      rod([0, -10, 22], [0, 10, 22], 22, matOf("#394344"), toneI, 1.7, 22, 32),
    );
    put([-13, 10, 9], [13, 12, 35], rod([0, 10, 22], [0, 12, 22], 13, botJoint, toneI, 1.2));
    put(
      [-6, 12, 16],
      [6, 14, 28],
      rod([0, 12, 22], [0, 14, 22], 6, botCream, toneI, 1) +
        (vis([0, 1, 0])
          ? Array.from({ length: 3 }, (_, n) => {
              const a = wheelAngle + (n * Math.PI * 2) / 3;
              return line(
                [
                  [Math.cos(a) * 2, 14.2, 22 + Math.sin(a) * 2],
                  [Math.cos(a) * 4.9, 14.2, 22 + Math.sin(a) * 4.9],
                ],
                0.65,
              );
            }).join("")
          : ""),
    );
    rounded([-5, 14, 22], [5, 19, 49], 2, bm);
    rounded([-8, -19, 44], [10, 19, 51], 3, bm);
    let chest = panel(15.1, -16, 61, 16, 79, 3, "#f6e6bd", 1.1);
    chest += panel(15.3, -10, 67, 3, 73, 1, "#435e62", 0.8);
    for (const yy of [9, 13])
      chest += shape(
        on(PX(15.4), ellUV(yy, 70, 1.1, 1.1, 12)),
        yy === 9 ? "#e27952" : "#e7b83e",
        0.5,
      );
    for (const yy of [-20, 20]) chest += shape(on(PX(15.2), ellUV(yy, 55, 1, 1, 12)), INK, 0);
    rounded([-12, -25, 49], [15, 25, 89], 7, bm, chest);
    for (const side of [-1, 1]) {
      const yy = side * 32;
      put(
        [-6, Math.min(side * 24, side * 38), 74],
        [7, Math.max(side * 24, side * 38), 85],
        rod([0, side * 24, 80], [0, side * 38, 80], 5.5, botJoint, toneI, 1.3),
      );
      rounded([-7, yy - 7, 60], [8, yy + 7, 81], 4, bm);
      put([-7, yy - 6, 55], [8, yy + 6, 65], cylX(-7, 8, yy, 60, 5.5, botJoint, toneI, 1.2));
      rounded([-6, yy - 7, 42], [10, yy + 7, 56], 3, botCream);
      rounded(
        [-4, yy - 7, 34],
        [11, yy + 7, 44],
        3,
        bm,
        panel(11.1, yy - 3, 34, yy + 3, 39, 1, "#293d42", 0.8),
      );
    }
    put([-6, -9, 89], [8, 9, 98], cyl(1, 0, 87, 98, 8, botCream, toneI, 1.2));
    let faceplate = panel(20.1, -23, 105, 23, 123, 6, "#293d42", 1.4);
    for (const yy of [-12, 12])
      faceplate += panel(20.3, yy - 3, 110, yy + 3, 118, 2.5, "#fff1bf", 0.6);
    faceplate += line(
      [
        [20.3, -6, 101],
        [20.3, 6, 101],
      ],
      1.4,
    );
    rounded([-13, -29, 96], [20, 29, 131], 8, bm, faceplate);
    for (const side of [-1, 1])
      put(
        [-3, Math.min(side * 28, side * 34), 107],
        [8, Math.max(side * 28, side * 34), 120],
        rod([2, side * 28, 114], [2, side * 34, 114], 6, botCream, toneI, 1.5),
      );
    put([-4, -2, 130], [0, 2, 142], rod([-2, 0, 130], [-2, 0, 141], 1.4, botJoint, toneI, 0.8));
    put([-6, -4, 139], [2, 4, 147], cylX(-5, 1, 0, 143, 3.6, botCream, toneI, 1));
    // A single quiet contact ellipse, fixed on the ground beneath the wheel.
    const shadow = '<ellipse cx="120" cy="178" rx="29" ry="8" fill="#41538f" opacity=".26"/>';
    return `<svg viewBox="0 0 260 235" role="img" aria-label="${col} enamel robot"><g stroke-linecap="round" stroke-linejoin="round">${shadow + byDepth(bits)}</g></svg>`;
  }
  return botRender(color, yaw, wheelAngle);
}
