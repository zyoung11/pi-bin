// Contract-sidecar fixture (ask 2): every declaration order below is
// deliberately ANTI-ALPHABETICAL — type names, record fields, enum
// members, union arms, msg arms, and helper declarations. A sorter
// anywhere in the projection (checker property enumeration, canonical IR
// storage leaking through) reorders something here and the harness's
// exact-order assertions catch it. The exported consts at the bottom are
// the ratified unbound/channel declaration conventions.

export type Zone = "west" | "north" | "east";

export interface Waypoint {
  zone: Zone;
  note?: string;
  label: string;
  id: number;
}

export type Shift = {
  offsetY: number;
  offsetX: number;
};

export type Route =
  | { kind: "warp"; target: Waypoint }
  | { kind: "step"; delta: Shift }
  | { kind: "idle" }
  | { kind: "annotate"; note: string };

export interface Model {
  waypoints: Waypoint[];
  title: string;
  speed: number;
  route: Route;
  home: Waypoint | null;
  active: boolean;
}

export type Msg =
  | { kind: "zoom"; level: number }
  | { kind: "teleport"; to: Waypoint }
  | { kind: "rename"; value: string }
  | { kind: "poll_done"; status: number; body: string }
  | { kind: "flip"; on: boolean }
  | { kind: "route_set"; route: Route }
  | { kind: "zone_set"; zone: Zone }
  | { kind: "blob_tag"; body: string; status: number }
  | { kind: "nudge"; dy: number; dx: number }
  | { kind: "reset" }
  | { kind: "endpoint_set"; value: string }
  | { kind: "appearance"; s: Shift };

export function init(): Model {
  return {
    waypoints: [
      { zone: "west", note: "origin", label: "start", id: 1 },
      { zone: "east", label: "finish", id: 2 },
    ],
    title: "atlas",
    speed: 1,
    route: { kind: "idle" },
    home: null,
    active: true,
  };
}

export function update(m: Model, msg: Msg): Model {
  switch (msg.kind) {
    case "zoom":
      return { waypoints: m.waypoints, title: m.title, speed: msg.level, route: m.route, home: m.home, active: m.active };
    case "teleport":
      return { waypoints: m.waypoints, title: m.title, speed: m.speed, route: m.route, home: msg.to, active: m.active };
    case "rename":
      return { waypoints: m.waypoints, title: msg.value, speed: m.speed, route: m.route, home: m.home, active: m.active };
    case "route_set":
      return { waypoints: m.waypoints, title: m.title, speed: m.speed, route: msg.route, home: m.home, active: m.active };
    case "reset":
      return init();
    default:
      return m;
  }
}

// Helpers (model-first exported functions), declared non-alphabetically:
// the array index in the sidecar is the ABI call index, so this order is
// contract too.
export function waypointsOf(m: Model): Waypoint[] {
  return m.waypoints;
}

export function headline(m: Model): string {
  return m.title + "!";
}

export function waypointCount(m: Model): number {
  return m.waypoints.length;
}

// An inline-record return: the synthesized name is two-part like every
// other (`<Container>_<member>`) — container `helpers`, member the helper
// name — so this tables `helpers_extent`, never a `_return` suffix.
export function extent(m: Model): { span: number; first: string } {
  return { span: m.speed, first: m.title };
}

// The ratified exported-const conventions (under an embedder's profile a
// generated facade emits these; nothing here is host code).
export const modelUnbound = ["title", "waypointCount"];
export const msgUnbound = ["poll_done", "endpoint_set"];
export const appearanceMsg = "appearance";
export const envMsgs = [{ env: "APP_ENDPOINT", msg: "endpoint_set" }];

/* ── the profile-mapped ABI surface ── */

let state: Model = init();

export function boot(): void {
  state = init();
}

export function send(tag: number, level: number): void {
  let msg: Msg;
  if (tag === 0) msg = { kind: "zoom", level };
  else if (tag === 1) msg = { kind: "rename", value: "wp-" + String(level) };
  else msg = { kind: "reset" };
  state = update(state, msg);
}

export function commandMsg(value: string): void {
  state = update(state, { kind: "rename", value });
}

export function title(): string {
  return state.title;
}

export function helperProbe(i: number): string {
  if (i === 0) return headline(state);
  return String(waypointCount(state)) + "/" + String(waypointsOf(state).length);
}

export function boom(i: number): number {
  const a = [1, 2, 3];
  return a[i]!;
}

console.log("contract ready");
