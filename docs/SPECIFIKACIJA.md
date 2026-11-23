# OkvirPro – Specifikacija funkcionalnosti

Funkcionalna specifikacija aplikacije za proizvođače PVC i ALU stolarije.
Funkcionalnost je preuzeta posmatranjem referentne aplikacije; ime, logo, tekstovi i dizajn su naši.

Status: **v0.1 – mapiranje modula** (23.11.2026). Formule proračuna za sve modele dopunjavaju se u Fazi 2.

---

## 1. Navigacija (bočni meni)

| Stavka | Ruta |
|---|---|
| Pregled | `/` |
| Ponude | `/ponude`, `/ponude/nova`, `/ponude/[id]`, `/ponude/[id]/izmeni` |
| Klijenti | `/klijenti` |
| Finansijski prikaz | `/finansije` |
| Reklamacije | `/reklamacije` |
| Avansi | `/avansi`, `/avansi/[id]` |
| Profili | `/profili` |
| Okov | `/okov` |
| Modeli | `/modeli` |
| Paneli | `/paneli` |
| Radni nalozi | `/radni-nalozi`, `/radni-nalozi/[id]` |
| Porudžbenice ▸ Staklo, Roletne, Komarnici, Okov, Profil, Daske i okapnice | `/porudzbenice/[vrsta]`, `/porudzbenice/[vrsta]/[id]` |
| Krojne liste | `/krojne-liste`, `/krojne-liste/[id]` |
| Magacin | `/magacin` |
| Računi | `/racuni`, `/racuni/[id]` |
| Podešavanja | `/podesavanja` |

Dokumenti (radni nalog, krojna lista, ugovor, račun, porudžbenice) postoje za svaku **potvrđenu** ponudu i koriste isti ID kao ponuda.

---

## 2. Podešavanja

- **Podaci firme** (zaglavlje svih dokumenata): naziv, adresa, PIB, matični broj, email, telefon, web, tekući račun, logo, zastupnik (ime korisnika), mesto izdavanja.
- **Marža:** podrazumevana marža u % (primer 50).
- **Montaža:** cena montaže po m² u € (primer 12).
- **Kurs EUR→RSD:** srednji kurs NBS (primer 117,5); kasnije automatsko preuzimanje.
- **Cenovnici** (lista naziv + cena, €/m² ili €/m¹, sa dodavanjem i brisanjem):
  - Staklo (npr. 4-16-4 Low-E + Argon 28; 4-12-4-12-4 Troslojno Solar 42; 4-16-4 Peskirano 35; 6-14-6 Kaljeno 55)
  - Roletne (ALU Standard 35; ALU sa izolacijom 45)
  - Komarnici (Fiksni 22; Rolo 45; Plise 65)
  - Unutrašnje daske (PVC bela 150/200/250 mm: 8/10/12)
  - Spoljašnje okapnice (ALU bela 100/150/200 mm: 7/9/11)
- **Dodatni okov za ulazna vrata:** rukohvati po dužini (400, 600, 800, 1200, 1500, 1800 mm: 45/55/65/85/110/130 €), elektro prihvatnik 25 €, automat/pumpa 48 €.
- **Javni kalkulator:** javni link i embed kod; klijent sam pravi proračun, a rezultat ulazi u ponude kao Nacrt. Marža se ne prikazuje. *(Faza 5)*
- **Uslovi i garancija:** tekst koji se štampa na ponudi i računu.

## 3. Profili (šifarnik)

Dve grupe: **PVC** i **ALU**. Svaki sistem (npr. „PVC Salamander BE92“, „ALU Alumil S77“) ima naziv, redosled (drag & drop) i tabelu stavki:

| Stavka | Dužina šipke (mm) | Unutrašnja visina (mm) | Širina/odbitak (mm) | Cena (€/m ili kom) |
|---|---|---|---|---|
| Ram | 6500 | 45 | | 12,5 |
| Krilo prozora | 6500 | 56 | | 14,2 |
| Krilo vrata | 6500 | 88 | | 18,5 |
| Čelično ojačanje rama* | 6000 | | | 4,5 |
| Čelično ojačanje krila* | 6000 | | | 5,2 |
| Čelično ojačanje krila vrata* | 6000 | | | 7,8 |
| Lajsna | 6500 | | | 2,8 |
| Prečka | 6500 | | 42 | 11,5 |
| Lažna prečka | 6500 | | 70 | 10,8 |
| Prag | 6000 | 20 | | 9,5 |
| Proširenje | 6000 | 40 | | 8,5 |
| Podštok | 6000 | 30 | | 3,5 |
| Spojnica prečke | | | | kom |
| Poklopac štulpa | | | | kom |

\* Samo za PVC. ALU sistem nema čelična ojačanja.

## 4. Okov

- **Metoda obračuna za prozore:** *Detaljno (po elementu)* ili *Paušalno (po m²)*. Paušalna metoda sama prepoznaje broj krila.
- **PSK klizni:** cena kompletnog mehanizma po krilu.
- **Okretno-nagibni prozorski okov:** gornji ugao, donji ugao, brava/zatvarač (€/m), nosač makaze (€/m), makaza, leđna šina (€/m), donja šarka, ručica, nosač gornje šarke, nosač donje šarke, kip prihvatnik, prihvatnik zatvarača.
- **Pomoćno krilo (štulp):** gornja šarka, donja šarka, rigla gore, rigla dole, klin (zatezač), prihvatnici na štulpu, nosači šarki na ramu, prihvatnik klina, prihvatnik rigle gore, prihvatnik rigle dole.
- **Vrata (glavno krilo):** vratna brava, cilindar, kvake/ručke set, šarka (po komadu), prihvatnici brave, prihvatna ploča.

Elementi „po m“ množe se sa visinom ili obimom krila.

## 5. Modeli (katalog)

Kartice „Prozori“, „Vrata“ i „Moji modeli“, plus „Kreiraj novi model“. Svaki model ima šifru, naziv i SVG crtež.

Prozori:
`P-FIX` fiksni · `P-FIX-V` vertikalna podela · `P-FIX-V2` dve vertikalne · `P-FIX-H` horizontalna · `P-FIX-H2` dve horizontalne ·
`P-JK-L` / `P-JK-R` jednokrilni okretno-nagibni L/D · `P-JK-KIP` samo kip ·
`P-JK-L-FIX-R` levo krilo + desno fiksno · `P-FIX-L-JK-R` levo fiksno + desno krilo ·
`P-PSK-L` / `P-PSK-R` PSK klizni · `P-HST-L` / `P-HST-R` HST podizno-klizni ·
`P-JK-L-S` / `P-JK-R-S` jednokrilni sa nadsvetlom ·
`P-DK-STULP-L` / `P-DK-STULP-R` dvokrilni štulp · `P-DK-FULL` oba krila okretno-nagibna ·
`P-DK-L-FIX-R` · `P-FIX-L-DK-R` · `P-DK-STULP-L-S` / `P-DK-STULP-R-S` štulp sa nadsvetlom ·
`P-DK-FIX-S` dvokrilni sa stubom i podeljenim nadsvetlom ·
`P-TK-F-K-F` · `P-TK-K-F-K` · `P-TK-3JK` · `P-TK-DK-JK` · `P-TK-JK-DK` trokrilni ·
`P-BV-JK` / `P-BV-JK-R` balkonska jednokrilna · `P-BV-DK` / `P-BV-DK-R` balkonska dvokrilna.

Vrata: katalog se dopunjuje u Fazi 2.

## 6. Paneli (dekorativni paneli za vrata)

Lista panela: naziv, šifra (ID), slika i cena sa PDV-om u €. Primeri: Inox Central 3 (240), Inox Central V (265), Inox Centric 4 (290), Classic Arch 5 (180), Classic Luna 5 (210), Classic Twin 6 (195), Inox Offset 7 (280), Linearis 5 (230), Linearis Full 5 (245), Linearis Trio Low (275), Inox Luna 5 (320), Inox Quadra 4L (255), Inox Vision 5 (310).

## 7. Klijenti

Polja: ime ili naziv firme, tip (fizičko ili pravno lice), adresa, email, telefon. Za pravno lice dodatno PIB i MB (i APR pretraga u Fazi 5).
Akcije: Dodaj, Uredi, Prikaži ponude (broj ponuda).

## 8. Ponude

### Lista
Kolone: broj ponude (`P-GGGG-NNNN`), kupac, iznos (EUR), status (**Nacrt** / **Potvrđeno**; finansije koriste još i **Čekanje** / **Realizovano**), datum kreiranja. Paginacija i sortiranje.
Akcije po redu: Pogledaj detalje, Izmeni ponudu, Ugovor o avansu, Račun (faktura), Pošalji e-mail, Obriši.

### Kreiranje i izmena
- **Kupac:** novi ili postojeći; fizičko ili pravno lice; ime/naziv, email, adresa, telefon; **rok isporuke** (datum).
- **Stavke** (više stavki, sklopive kartice sa naslovom „N. Kx Vrsta ŠxV mm – Stavka: X €“):
  - Vrsta: Prozor / Vrata / Roletna / Komarnik / Daska / Okapnica
  - Širina, visina (mm), količina
  - Sistem (profil iz šifarnika), staklo (iz cenovnika)
  - Marža % (podrazumevano iz podešavanja)
  - Ručni unos cene (prekidač)
  - Model iz kataloga (modal sa crtežima), panel kod vrata
  - Opcije pozicije: Podštok, Proširenje L, Proširenje D, Spoj levo, Spoj desno
  - Napomena za radionicu/montažu
  - Ukloni poziciju
- **Donja traka:** prekidači *Bez PDV-a*, *Montaža u cenu*, *Bez montaže*; ukupan iznos; Dodaj stavku; Sačuvaj ponudu.

### Obračun (potvrđeno na primeru)
```
cena_stavke        = (trošak materijala) × (1 + marža%)     → bez PDV-a
ukupno_bez_pdv     = Σ cena_stavke × količina
pdv                = ukupno_bez_pdv × 20 %
ukupno_sa_pdv      = ukupno_bez_pdv + pdv
montaža            = Σ (š × v u m²) × cena_montaže_po_m²    (bez PDV-a)
ukupno_za_naplatu  = ukupno_sa_pdv + montaža
RSD protivvrednost = ukupno_za_naplatu × kurs
```
Primer: prozor 1200×1400, stavka 226,65 € → PDV 45,33 → 271,97 € + montaža 1,68 m² × 12 = 20,16 € → **292,13 €** (34.326 RSD po kursu 117,5).

### Prikaz i PDF ponude
Zaglavlje firme, broj i datum, status, podaci kupca, mesto izdavanja, rok isporuke. Tabela: #, opis (crtež modela, naziv „Prozor 1200x1400mm“, model, profil, staklo, opcije, napomena), količina, cena/kom, ukupno. Ispod toga zbirovi kao gore, RSD protivvrednost, garancija i uslovi (ponuda važi 7 dana itd.). Dugmad: Izmeni, Štampaj / Sačuvaj PDF.

## 9. Radni nalog (po ponudi)
Jedna strana po poziciji (POZ 1, 2...): broj naloga, sistem, kupac, vrsta, profil, staklo, opcije (npr. SPOJ LEVO), napomena, količina, dimenzije, crtež.
Sekcije:
- **Sečenje profila (mm):** element, mera, kom
- **Čelično ojačanje:** element, mera, kom
- **Staklo i ispuna:** dimenzije stakla, kom
- **Okov i dodaci:** model ID, okov

### Formule – potvrđeno za `P-FIX`, PVC, 1200×1400, podštok + proširenje levo
| Element | Formula | Primer |
|---|---|---|
| Podštok | Š | 1200 |
| Proširenje levo | V − podštok(30) | 1370 |
| Ram Š (gore/dole) ×2 | Š − proširenje(40) + 2×3 (var) | 1166 |
| Ram V ×2 | V − podštok(30) + 2×3 (var) | 1376 |
| Čelik rama | dužina rama − 120 | 1046 / 1256 |
| Fiks lajsna Š ×2 | (Š_rama_neto) − 2×unutr.visina rama(45) | 1070 |
| Fiks lajsna V ×2 | (V_rama_neto) − 2×45 | 1280 |
| Staklo | lajsna − 8 | 1062 × 1272 |

### Krila, štulp, prečke – potvrđeno na 6 referentnih radnih naloga (PVC)
| Element | Formula | Primer (P-JK-L 1200×1400) |
|---|---|---|
| Krilo Š/V | svetli otvor polja + 22 (16 preklop + 6 varenje) | 1132 / 1332 |
| Krilo lajsna | krilo − 6 − 2 × 56 | 1014 / 1214 |
| Čelik krila | krilo − 160 | 972 / 1172 |
| Staklo | lajsna − 8 | 1006 × 1206 |
| Štulp: svako krilo Š | (svetli otvor + 22) / 2 | 1280 L+D → 566 |
| Štulp (lažna prečka) | visina krila − 70 | 1272 → 1202 |
| Poklopac štulpa | 2 kom po štulpu | |
| Prečka | puna visina/širina svetlog otvora; osa na proporcionalnom mestu, svako polje gubi ½ širine prečke | 3916 |
| Čelik prečke | = dužina prečke | 2010 |

ALU: bez dodatka za varenje i bez čelika; dodatak krila 16 mm je **pretpostavka** (nema primera sa krilom). Trokrilni modeli: ±1 mm u odnosu na referencu.
P-FIX-V2 / P-FIX-H2: prvo podela na pola, pa desna (donja) polovina na dva (1418 / 689 / 689).

## 10. Krojne liste (optimizacija sečenja)
Po ponudi, grupisano po profilu (npr. „LAJSNA – PVC Salamander BE92“). Za svaku grupu: broj punih šipki i broj iskorišćenih ostataka. Za svaku šipku: oznaka (`OST` = ostatak iz magacina, `#N` = nova šipka), rezovi (oznaka pozicije npr. `P1V`/`P1H` i dužina) i ostatak, uz traku iskorišćenosti.
Algoritam: 1D bin-packing, prvo koristi ostatke iz magacina (>400 mm), pa nove šipke.
Dugme **„Proknjiži utrošak“** (jednom po nalogu): skida cele šipke i iskorišćene ostatke iz magacina i vraća nove ostatke duže od 400 mm.

## 11. Magacin profila
Tabela: profil, kategorija (stavka), broj punih šipki (unos), lista ostataka (>400 mm). Dugme „Sačuvaj stanje“.

## 12. Porudžbenice
Po potvrđenoj ponudi, za svaku vrstu: **Staklo, Roletne, Komarnici, Okov, Profil, Daske i okapnice**. Svaka je specifikacija za dobavljača (dimenzije, količine, nazivi), spremna za štampu.

## 13. Avansi (ugovor o kapari)
Po ponudi: unos iznosa avansa u €. Generiše „Ugovor o avansu (kapari)“ br. `P-xxxx/AV`: datum, mesto, podaci prodavca (sa zastupnikom) i kupca, tekst ugovora sa iznosom, potpisi (M.P.). U listi se prikazuje iznos avansa ako je unet.

## 14. Računi
Po ponudi: račun br. `P-xxxx/GGGG`. Poreski status je **PDV 20%** ili **Bez PDV-a (čl. 33)**. Polja: mesto, datum izdavanja, datum prometa (= rok isporuke), rok plaćanja (izdavanje + 3 dana). Stavke su u **RSD** (cena × kurs): naziv, kol., cena, osnovica, pa ukupna osnovica, PDV i ukupno za uplatu. Napomene (kurs, reklamacije u roku od 3 dana), garancija, potpisi.

## 15. Reklamacije
Zapisnik br. `REK-GGGG-NNNN`: kupac, vezan ugovor (ponuda), datum, opis, status (Otvoreno / Rešeno), detalji i štampa zapisnika.

## 16. Finansijski prikaz
- Kartice: troškovi materijala (nabavka potvrđenih poslova), ukupan prihod (sa PDV-om i montažom), čista zarada i prosečna marža.
- Grafikon po mesecima: prihod i neto zarada.
- **Čekanje na naplatu** za tekući mesec: dospele isporuke, buduće isporuke, ukupno očekivano.
- **Board ponuda:** kartica po potvrđenoj ponudi sa ukupnom vrednošću, troškom materijala, neto profitom, % trošak/zarada, rokom i statusom (Čekanje / Realizovano).

## 17. Pregled (kontrolna tabla)
Kartice: ukupno ponuda, potvrđeno (% od ukupno), prosečna ponuda (€), stopa uspešnosti (%). Grafikon prometa po mesecima (poslednjih 3–6 meseci, potvrđene ponude). Top 5 kupaca po vrednosti. Blok „Brzi savet“.

## 18. Kasnije (Faza 5)
Prijava i nalozi (Supabase), više firmi u sistemu, paketi Pro i Reseller, javni kalkulator, slanje ponude e-mailom, AI asistent za tehničke opise, APR pretraga, prezentacioni sajt.

---

## Tehnička odluka
- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Baza:** Prisma ORM + SQLite lokalno (`prisma/dev.db`). Prelazak na Supabase (PostgreSQL) je kasnije samo promena `provider`-a i `DATABASE_URL`.
- **Bez prijave** u ovoj fazi: jedan lokalni korisnik i jedna firma.
