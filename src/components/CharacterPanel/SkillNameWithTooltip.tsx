/**
 * SkillNameWithTooltip - Wraps skill name text with a hover/focus tooltip
 * showing skill stats from the skill registry.
 *
 * Renders a portal-positioned tooltip with a 150ms appear delay.
 * Accessible via keyboard (focus/blur) and dismissible with Escape.
 */

import { useState, useRef, useId, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { getSkillDefinition } from "../../engine/skill-registry";
import type { SkillDefinition } from "../../engine/skill-registry";
import styles from "./SkillNameWithTooltip.module.css";

interface SkillNameWithTooltipProps {
  skillId: string;
  children?: React.ReactNode;
  className?: string;
}

const APPEAR_DELAY = 150;
const GAP = 4;
const MARGIN = 8;

export function SkillNameWithTooltip({
  skillId,
  children,
  className,
}: SkillNameWithTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const fullTooltipId = `skill-tooltip-${tooltipId}`;

  const skillDef = getSkillDefinition(skillId);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, APPEAR_DELAY);
  };

  const hide = () => {
    clearTimer();
    setIsVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      hide();
    }
  };

  useLayoutEffect(() => {
    if (isVisible && anchorRef.current && tooltipRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = anchorRect.bottom + GAP;
      let left = anchorRect.left;

      // Flip above if no room below
      if (top + tooltipRect.height + MARGIN > window.innerHeight) {
        top = anchorRect.top - GAP - tooltipRect.height;
      }

      // Horizontal clamp
      left = Math.max(
        MARGIN,
        Math.min(left, window.innerWidth - tooltipRect.width - MARGIN),
      );

      setPosition({ top, left });
    }
  }, [isVisible]);

  // If no skill definition, render children without tooltip
  if (!skillDef) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={0}
        className={className}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={handleKeyDown}
        aria-describedby={fullTooltipId}
      >
        {children}
      </span>
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={fullTooltipId}
            role="tooltip"
            className={styles.tooltip}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
            }}
          >
            <TooltipContent skillDef={skillDef} />
          </div>,
          document.body,
        )}
    </>
  );
}

function TooltipContent({ skillDef }: { skillDef: SkillDefinition }) {
  return (
    <>
      <div className={styles.statRow}>
        <span className={styles.label}>Action</span>
        <span className={styles.value}>{skillDef.actionType}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.label}>Tick Cost</span>
        <span className={styles.value}>{skillDef.tickCost} ticks</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.label}>Range</span>
        <span className={styles.value}>{skillDef.range}</span>
      </div>
      {skillDef.damage !== undefined && (
        <div className={styles.statRow}>
          <span className={styles.label}>Damage</span>
          <span className={styles.value}>{skillDef.damage}</span>
        </div>
      )}
      {skillDef.healing !== undefined && (
        <div className={styles.statRow}>
          <span className={styles.label}>Healing</span>
          <span className={styles.value}>{skillDef.healing}</span>
        </div>
      )}
      {skillDef.distance !== undefined && (
        <div className={styles.statRow}>
          <span className={styles.label}>Distance</span>
          <span className={styles.value}>{skillDef.distance}</span>
        </div>
      )}
      {skillDef.cooldown !== undefined && (
        <div className={styles.statRow}>
          <span className={styles.label}>Cooldown</span>
          <span className={styles.value}>{skillDef.cooldown} ticks</span>
        </div>
      )}
      {skillDef.behaviors.length > 0 && (
        <div className={styles.statRow}>
          <span className={styles.label}>Behaviors</span>
          <span className={styles.value}>{skillDef.behaviors.join(", ")}</span>
        </div>
      )}
    </>
  );
}
