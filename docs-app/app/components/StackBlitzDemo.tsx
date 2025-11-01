"use client";

import sdk from "@stackblitz/sdk";
import { useEffect, useRef } from "react";

export function StackBlitzDemo() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      sdk.embedGithubProject(containerRef.current, "mixelburg/usemuiform", {
        openFile: "demo/App.tsx",
        view: "preview",
        height: 600,
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "600px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
}
