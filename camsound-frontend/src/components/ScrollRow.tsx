import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ScrollRowProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  cardWidth?: number;
}

export const ScrollRow: React.FC<ScrollRowProps> = ({
  title,
  subtitle,
  icon = 'fa-music',
  iconBg,
  iconColor,
  actionButton,
  children,
  className = '',
  cardWidth = 220,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [children, checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, cardWidth * 2);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Mouse drag-to-scroll support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftPos(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className={`fan-section scroll-row-section ${className}`} style={{ marginBottom: 32 }}>
      {/* Header with Title and Scroll Controls */}
      <div className="fan-section-header-premium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="fan-section-label" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="fan-section-icon-badge"
            style={{
              background: iconBg || undefined,
              color: iconColor || undefined,
            }}
          >
            <i className={`fas ${icon}`} />
          </div>
          <div>
            <div className="fan-section-title-premium">{title}</div>
            {subtitle && <div className="fan-section-subtitle-premium">{subtitle}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actionButton}

          {/* Left/Right Smooth Scroll Arrows */}
          <div className="scroll-row-controls" style={{ display: 'flex', gap: 6 }}>
            <button
              className={`scroll-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              type="button"
            >
              <i className="fas fa-chevron-left" />
            </button>
            <button
              className={`scroll-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              type="button"
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Track Wrapper */}
      <div className="scroll-track-wrapper" style={{ position: 'relative' }}>
        {/* Left fade gradient edge */}
        <div className={`scroll-edge-fade scroll-edge-left ${canScrollLeft ? 'visible' : ''}`} />

        <div
          ref={scrollRef}
          className={`scroll-row-track ${isDragging ? 'is-dragging' : ''}`}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {children}
        </div>

        {/* Right fade gradient edge */}
        <div className={`scroll-edge-fade scroll-edge-right ${canScrollRight ? 'visible' : ''}`} />
      </div>
    </section>
  );
};

export default ScrollRow;
