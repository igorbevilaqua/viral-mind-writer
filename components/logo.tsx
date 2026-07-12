export default function Logo({ size = 27 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="CODEX - Viral Mind">
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="#171310" stroke="rgba(201,163,92,.55)" />
      <path
        d="M23.8 7.2c-6.4.6-11.2 5.2-13.2 12.4l-.9 3.2 3.2-1c6.9-2.1 10.7-7.6 10.9-14.6Z"
        fill="rgba(201,163,92,.16)"
        stroke="#c9a35c"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M20.8 10.6 11 20.4M10.6 21.9 8.4 24.6" stroke="#c9a35c" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M25.6 4.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" fill="#e8dcc3" />
    </svg>
  );
}
