import { Sidebar } from "@/components/Sidebar";

// Raspored aplikacije (sa bočnim menijem). Javne strane (npr. /kalkulator) su van ove grupe.
// Na telefonu je meni gornja traka sa dugmetom, a na širem ekranu stalni bočni meni.
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
