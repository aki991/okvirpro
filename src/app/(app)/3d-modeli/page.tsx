import { PageHeader } from "@/components/PageHeader";
import { PROFILI_3D } from "@/lib/profili-3d";
import { ProfilPrikaz } from "./ProfilPrikaz";

export const metadata = { title: "3D modeli – OkvirPro" };

export default function TriDModeli() {
  return (
    <>
      <PageHeader naslov="3D modeli" opis="Vežbanje crtanja profila – 3D šipka i poprečni presek" />
      <div className="p-4 sm:p-6 lg:p-8">
        <ProfilPrikaz profili={PROFILI_3D} />
      </div>
    </>
  );
}
