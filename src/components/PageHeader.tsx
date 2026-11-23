export function PageHeader({
  naslov,
  opis,
  akcije,
}: {
  naslov: string;
  opis?: string;
  akcije?: React.ReactNode;
}) {
  return (
    <header className="no-print sticky top-14 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:top-0 lg:px-8 lg:py-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">{naslov}</h1>
        {opis && <p className="text-sm text-muted">{opis}</p>}
      </div>
      {akcije && <div className="flex flex-wrap items-center gap-2">{akcije}</div>}
    </header>
  );
}
