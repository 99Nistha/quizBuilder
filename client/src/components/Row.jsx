import { useEffect, useRef, useState } from 'react';

// One line of tiles that scrolls sideways: four across on a laptop, a peek of
// the next one on a phone so it's obvious there's more.
export default function Row({ children, label }) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  function update() {
    const el = track.current;
    if (!el) return;
    const next = { start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 };
    // only re-render when something actually changed
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }

  // re-check when the tiles change (they arrive after loading) and on resize
  const count = Array.isArray(children) ? children.length : 1;
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [count]);

  const nudge = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: 'smooth' });

  return (
    <div className="row">
      <div className="row-track" ref={track} onScroll={update} aria-label={label}>
        {children}
      </div>
      {!edges.start && (
        <button type="button" className="row-arrow row-prev" onClick={() => nudge(-1)} aria-label="Scroll back">
          ‹
        </button>
      )}
      {!edges.end && (
        <button type="button" className="row-arrow row-next" onClick={() => nudge(1)} aria-label="Scroll for more">
          ›
        </button>
      )}
    </div>
  );
}
