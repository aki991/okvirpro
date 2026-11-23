// OkvirPro logo: stilizovan okvir prozora sa dijagonalom otvaranja (kip) i mesinganom ručicom.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--brand)" />
      <rect x="8" y="7" width="16" height="18" rx="1.5" stroke="#fff" strokeWidth="2.2" />
      <path d="M8.5 24.5 16 7.8 23.5 24.5" stroke="#fff" strokeOpacity=".45" strokeWidth="1.3" strokeDasharray="2 1.6" />
      <rect x="20.2" y="14" width="2.4" height="5" rx="1.2" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-foreground"}`}>
        Okvir<span className="text-accent">Pro</span>
      </span>
    </span>
  );
}
