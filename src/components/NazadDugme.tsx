import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function NazadDugme({ href }: { href: string }) {
  return (
    <Link href={href} className="btn-secondary">
      <ArrowLeft size={16} /> Nazad
    </Link>
  );
}
