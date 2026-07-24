"use client";

import { useEffect, useRef, useState } from "react";

/*
  Reveal — gently fades its children up as they scroll into view.
  Degrades safely: with no JS (or no IntersectionObserver) the content
  is simply visible from the start. Honors prefers-reduced-motion via CSS.
*/
export default function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [state, setState] = useState("idle"); // idle (visible) -> hidden -> in

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Already on-screen at mount? reveal immediately, no pre-hide flash.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      setState("in");
      return;
    }
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${state === "in" ? "reveal-in" : ""}`.trim()}
      style={{
        ...(state === "hidden" ? { opacity: 0 } : null),
        ...(delay ? { animationDelay: `${delay}ms` } : null),
      }}
    >
      {children}
    </div>
  );
}
