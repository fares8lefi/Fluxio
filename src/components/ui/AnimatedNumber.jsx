import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { EASE_OUT } from '@/lib/motion';

// First number in a French-formatted string: "12 345,678", "-3,5", "42"
const NUMBER_PATTERN = /-?\d{1,3}(?:[\s  ]\d{3})*(?:,\d+)?|-?\d+(?:,\d+)?/;

function parse(text) {
  const match = String(text ?? '').match(NUMBER_PATTERN);
  if (!match) return null;
  const raw = match[0];
  const decimals = raw.includes(',') ? raw.split(',')[1].length : 0;
  const value = Number(raw.replace(/[\s  ]/g, '').replace(',', '.'));
  return Number.isFinite(value) ? { raw, value, decimals, index: match.index } : null;
}

function format(n, decimals) {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * AnimatedNumber — counts up to a value already formatted for display.
 * Accepts the final string ("12 345,500", "87 %", "3 j") and animates only its
 * number, keeping the text around it. Non-numeric values render as-is.
 * Screen readers always get the final value.
 *
 * @param {string|number} value
 * @param {number} [duration=0.9] seconds
 */
export function AnimatedNumber({ value, duration = 0.9 }) {
  const text = String(value ?? '');
  const parsed = parse(text);
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(parsed && !reduce ? 0 : parsed?.value ?? 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!parsed || reduce) return;
    const controls = animate(fromRef.current, parsed.value, {
      duration,
      ease: EASE_OUT,
      onUpdate: setDisplay,
    });
    fromRef.current = parsed.value; // next change animates from here, not from 0
    return () => controls.stop();
  }, [parsed?.value, reduce, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!parsed) return text;

  const shown = reduce ? parsed.raw : format(display, parsed.decimals);
  return (
    <>
      <span aria-hidden="true">
        {text.slice(0, parsed.index)}
        {shown}
        {text.slice(parsed.index + parsed.raw.length)}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}
