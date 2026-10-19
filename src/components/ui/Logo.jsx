/**
 * Fluxio mark: three stock bars at falling levels, the last one under its
 * alert threshold (amber). `ink` = drawn on a dark petrol background.
 */
export function Logo({ small = false, ink = false }) {
  const bar = ink ? '#72c2c8' : '#0f5a63';
  return (
    <span
      className={`flex items-center gap-2 font-semibold tracking-tight ${small ? 'text-base' : 'text-lg'}`}
      style={{ fontStretch: '125%' }}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className={small ? 'size-5' : 'size-6'}>
        <rect x="1" y="3" width="4.5" height="15" rx="1" fill={bar} />
        <rect x="7.75" y="7" width="4.5" height="11" rx="1" fill={bar} />
        <rect x="14.5" y="13" width="4.5" height="5" rx="1" fill="#e8a33d" />
      </svg>
      <span className={ink ? 'text-white' : 'text-cyan-950'}>Fluxio</span>
    </span>
  );
}

export default Logo;
