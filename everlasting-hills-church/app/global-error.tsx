"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. Must render
 * its own <html>/<body> because it replaces the root layout when it fires.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>
          Something went wrong
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", maxWidth: 420 }}>
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            background: "#87102C",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px 28px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
