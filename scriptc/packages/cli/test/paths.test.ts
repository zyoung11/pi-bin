import { join, resolve } from "node:path";
import { buildTargetPlatform } from "@scriptc/compiler";
import { expect, test } from "vitest";
import { defaultExecutableName, wasiEnvironment, wasiPreopens } from "../src/paths.js";

test("default executable names use the Windows PE suffix", () => {
  expect(defaultExecutableName("main", "win32")).toBe("main.exe");
  expect(defaultExecutableName("main", "linux")).toBe("main");
  expect(defaultExecutableName("main", "darwin")).toBe("main");
  expect(defaultExecutableName("main", "wasi")).toBe("main.wasm");
});

test("WASI cross-builds use the WebAssembly suffix", () => {
  const platform = buildTargetPlatform({
    SCRIPTC_CC: "zigcc",
    SCRIPTC_TARGET: "wasm32-wasi",
  });
  expect(platform).toBe("wasi");
  expect(defaultExecutableName("main", platform)).toBe("main.wasm");
});

test("WASI preopens map guest /tmp to the host platform temp directory", () => {
  expect(wasiPreopens("C:\\work\\repo", "C:\\Users\\runner\\AppData\\Local\\Temp")).toEqual({
    "/": "C:\\work\\repo",
    "/tmp": "C:\\Users\\runner\\AppData\\Local\\Temp",
  });
});

test("WASI environment paths name guest-visible capabilities", () => {
  const cwd = resolve("work/repo");
  const hostTmp = resolve("host/tmp");
  const outside = resolve("elsewhere");

  expect(wasiEnvironment({
    KEEP: "yes",
    PWD: cwd,
    HOME: outside,
    TMPDIR: hostTmp,
    TMP: hostTmp,
    TEMP: hostTmp,
    USERPROFILE: outside,
    OLDPWD: outside,
    INIT_CWD: join(cwd, "package"),
  }, cwd, hostTmp)).toEqual({
    KEEP: "yes",
    PWD: "/",
    HOME: "/",
    TMPDIR: "/tmp",
    TMP: "/tmp",
    TEMP: "/tmp",
    USERPROFILE: "/",
    INIT_CWD: "/package",
  });
});

test("Windows cross-builds use the PE suffix on a non-Windows host", () => {
  const platform = buildTargetPlatform({
    SCRIPTC_CC: "zigcc",
    SCRIPTC_TARGET: "x86_64-windows-gnu",
  });
  expect(platform).toBe("win32");
  expect(defaultExecutableName("main", platform)).toBe("main.exe");
});
