import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function AnimatedCounter({ value, suffix = "", label, note, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let frame;
    const start = performance.now();
    const duration = 1300;

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <div ref={ref} className={className}>
      <div className="fl-condensed text-[38px] uppercase leading-none tracking-[-0.02em] text-white">
        {current}{suffix}
      </div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f0183d]">{label}</div>
      {note && <p className="mt-2 text-xs leading-5 text-white/48">{note}</p>}
    </div>
  );
}