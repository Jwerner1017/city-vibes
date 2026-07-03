import React, { useState, useRef } from "react";

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  // Only this element's own scroll counts as "at top" — if it isn't actually
  // scrollable (page/body handles scrolling instead), skip pull-to-refresh
  // entirely so touch gestures pass straight through to native scrolling.
  const isSelfScrollable = () => {
    const el = containerRef.current;
    return el && el.scrollHeight > el.clientHeight + 1;
  };

  const handleTouchStart = (e) => {
    if (isSelfScrollable() && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && containerRef.current.scrollTop <= 0) {
      setPullDistance(Math.min(diff * 0.5, 90));
    } else {
      pulling.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
    pulling.current = false;
  };

  const indicatorHeight = refreshing ? 48 : pullDistance;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`overflow-y-auto ${className}`}
      style={{ overscrollBehavior: "none" }}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: indicatorHeight }}
      >
        {(refreshing || pullDistance > 0) && (
          <div
            className={`w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full ${
              refreshing || pullDistance > 60 ? "animate-spin" : ""
            }`}
          />
        )}
      </div>
      {children}
    </div>
  );
}