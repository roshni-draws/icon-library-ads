/// <reference types="vite/client" />

/** Every Material Symbols Rounded name in @material-symbols/svg-400 that has both a line and a -fill file. */
declare module 'virtual:symbol-index' {
  const names: string[];
  export default names;
}
/** name -> [line markup, fill markup] for every name the data files use (viewBox 0 -960 960 960). */
declare module 'virtual:symbol-pack' {
  const pack: Record<string, [string, string]>;
  export default pack;
}
/** Snapshot of ../library (index.json + every SVG) taken at build time; dev reads /api/library instead. */
declare module 'virtual:library' {
  const lib: { index: { version: number; style: string; icons: unknown[] }; svgs: { line: Record<string, string>; filled: Record<string, string> } };
  export default lib;
}
/** Snapshot of ../library/primary (index + SVG text + which Lottie files exist) taken at build time; dev reads /api/primary. */
declare module 'virtual:primary' {
  const primary: { present: boolean; error: string; index: { version: number; icons: unknown[] }; svgs: Record<string, string>; lottie: Record<string, Partial<Record<string, boolean>>> };
  export default primary;
}
