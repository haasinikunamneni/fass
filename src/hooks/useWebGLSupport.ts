"use client";

import { useEffect, useState } from "react";

/** null while unknown (SSR / first paint), then true or false. */
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl2") ||
        canvas.getContext("webgl")) as WebGLRenderingContext | null;
      setSupported(!!gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
