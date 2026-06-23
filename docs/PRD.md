# Slotify — Product Requirements Document (PRD)

> Verzija: 1.0 (MVP)
> Status: Draft za potvrdu
> Jezik proizvoda (UI): Engleski

---

## 1. Pregled proizvoda

**Slotify** je multi-tenant SaaS aplikacija za online zakazivanje termina (booking).
Omogućava različitim biznisima (frizerski saloni, kozmetički saloni, barbershopovi,
privatne prakse i sl.) da:

- naprave svoj profil i javnu booking stranicu,
- definišu usluge, cijene, trajanje i zaposlene,
- automatski izračunavaju slobodne termine,
- prime online rezervacije od klijenata bez obaveze pravljenja naloga,
- upravljaju svojim rasporedom kroz dashboard.

Svaki biznis je potpuno izolovan — jedan biznis nikada ne vidi podatke drugog.

### 1.1 Svrha / Problem koji rješava

Mali i srednji uslužni biznisi i dalje primaju rezervacije telefonom, što vodi do:
- duplih rezervacija i propuštenih poziva,
- gubitka vremena na ručnu koordinaciju,
- nepostojanja pregleda i statistike.

Slotify automatizuje cijeli proces zakazivanja i daje vlasniku jedinstven pregled.

### 1.2 Ciljevi MVP-a

- Kompletan tok od kraja do kraja: registracija biznisa → setup → javna booking stranica → dashboard.
- Pouzdan sistem dostupnosti koji nikada ne dozvoljava duple rezervacije.
- Jednostavno, mobilno-prvo iskustvo za klijenta (bez naloga).
- Osnovna statistika i pregled za vlasnika.

### 1.3 Nije u obimu MVP-a (Out of scope)

- Online plaćanje / depozit (struktura ostaje proširiva).
- SMS i push notifikacije (samo email u MVP-u).
- Prijava zaposlenih u sistem (samo vlasnik upravlja).
- Super-admin nad svim biznisima (platform admin).
- SaaS naplata biznisima (pretplate) — MVP je besplatan.
- Recenzije/ocjene, lista čekanja (waitlist), grupni termini.

---

## 2. Ciljni korisnici (Persone)

### 2.1 Vlasnik biznisa (Owner)
Vodi salon/praksu. Tehnički nije napredan korisnik. Treba brz setup i jasan dnevni pregled.
Primarno koristi **desktop** za upravljanje.

### 2.2 Klijent (Client / Guest)
Krajnji korisnik koji rezerviše uslugu. **Ne mora praviti nalog.** Dolazi preko javnog linka,
najčešće sa **mobilnog telefona**. Treba brzo i bez frikcije do potvrde.

### 2.3 Zaposleni (Employee / Staff)
Pruža usluge. U MVP-u **nema svoj login** — vlasnik upravlja njegovim rasporedom i terminima.
(Model podataka je spreman da se login zaposlenih doda kasnije.)

---

## 3. Korisničke uloge i dozvole

| Uloga | Pristup | Opis |
|------|---------|------|
| Owner | Autentifikovan (email + lozinka) | Pun pristup podacima i postavkama SVOG biznisa |
| Client / Guest | Bez naloga | Javna booking stranica + upravljanje vlastitom rezervacijom preko sigurnog linka |
| Employee | Bez naloga (MVP) | Postoji kao resurs u sistemu, kojim upravlja Owner |

> Napomena: izolacija podataka po biznisu sprovodi se na nivou baze (Row Level Security).
> Detalji u `DB.md` i `Tech.md`.

---

## 4. Glavne funkcionalnosti

### 4.1 Vlasnik biznisa
- [F-O1] Registracija naloga (email + lozinka) i kreiranje profila biznisa.
- [F-O2] Setup wizard pri prvom ulasku (osnovni podaci, prva usluga, prvi zaposleni, radno vrijeme).
- [F-O3] Upravljanje uslugama: naziv, opis, kategorija, cijena, trajanje.
- [F-O4] Upravljanje zaposlenima.
- [F-O5] Dodjela usluga zaposlenima, uz mogućnost **različite cijene/trajanja po zaposlenom**.
- [F-O6] Postavljanje radnog vremena (default na nivou biznisa, override po zaposlenom).
- [F-O7] Blokiranje neradnih dana, praznika i pauza.
- [F-O8] Pregled svih rezervacija (kalendar dan/sedmica + lista).
- [F-O9] Potvrda, pomjeranje (reschedule) i otkazivanje termina.
- [F-O10] Označavanje termina kao završen (i no-show).
- [F-O11] Ručno dodavanje rezervacije (telefonski / walk-in).
- [F-O12] Pregled osnovnih podataka o klijentima (CRM-lite).
- [F-O13] Podešavanje politika biznisa (auto/ručna potvrda, rok otkazivanja, lead time, timezone, valuta, branding).

### 4.2 Klijent
- [F-C1] Otvaranje javne stranice biznisa (`/{business-slug}`).
- [F-C2] Pregled usluga, opisa i cijena (grupisano po kategorijama).
- [F-C3] Izbor usluge.
- [F-C4] Izbor zaposlenog (ili "bilo koji dostupni" ako biznis to dozvoljava).
- [F-C5] Izbor datuma i slobodnog termina (automatski izračunat).
- [F-C6] Unos imena, emaila i telefona.
- [F-C7] Kreiranje rezervacije.
- [F-C8] Potvrda na ekranu + email potvrda (preko Resend).
- [F-C9] Otkazivanje ili izmjena rezervacije preko sigurnog linka (token u emailu).

### 4.3 Sistem dostupnosti (Availability engine)
Automatski računa slobodne termine na osnovu:
- radnog vremena zaposlenog (uz nasljeđivanje od biznisa),
- trajanja izabrane usluge (specifično za kombinaciju zaposleni × usluga),
- postojećih rezervacija,
- pauza,
- blokiranih termina i neradnih dana,
- buffera (priprema/čišćenje) definisanog po usluzi,
- lead time pravila (min. najava i max. horizont).

Granularnost slotova: **15 minuta**.
**Garancija: dvije rezervacije ne mogu zauzeti isti slot kod istog zaposlenog** (DB ograničenje + transakcija).

### 4.4 Dashboard
Vlasnik dobija pregled:
- današnjih termina,
- narednih rezervacija,
- rezervacija po zaposlenom,
- broja potvrđenih / otkazanih / završenih / no-show termina,
- broja klijenata,
- osnovne statistike (fokus: danas + ova sedmica).

### 4.5 Multi-tenant
- Svaki biznis ima svoje usluge, zaposlene, klijente, rezervacije i javnu stranicu.
- Stroga izolacija podataka (RLS po `business_id`).

---

## 5. Korisnički tokovi (User Flows)

### 5.1 Onboarding vlasnika
```
Registracija (email+lozinka) → Verifikacija → Setup wizard:
  1) Podaci biznisa (naziv, slug, timezone, valuta, logo, boja)
  2) Prva usluga (naziv, trajanje, cijena, kategorija)
  3) Prvi zaposleni + dodjela usluga
  4) Radno vrijeme
→ Dashboard
```

### 5.2 Rezervacija (klijent)
```
Otvori /{slug} → Izbor usluge → Izbor zaposlenog (ili "bilo koji")
→ Izbor datuma → Sistem prikaže slobodne slotove
→ Izbor slota → Unos (ime, email, telefon)
→ Potvrdi → [auto-confirm ILI pending zavisno od biznisa]
→ Potvrda na ekranu + email sa sigurnim linkom za upravljanje
```

### 5.3 Izmjena/otkazivanje (klijent)
```
Klik na siguran link iz emaila (token) → Prikaz rezervacije
→ Otkaži (ako je unutar dozvoljenog roka) ILI Pomjeri (ponovni izbor slota)
→ Potvrda + email
```

### 5.4 Upravljanje terminom (vlasnik)
```
Dashboard/Kalendar → Otvori termin
→ Potvrdi / Pomjeri / Otkaži / Označi završeno / Označi no-show
```

---

## 6. Poslovna pravila (Business Rules)

- **BR-1** Slug biznisa je jedinstven na nivou platforme i koristi se u URL-u (`/{slug}`).
- **BR-2** Slot granularnost je 15 minuta; početak slota se poravnava sa radnim vremenom.
- **BR-3** Termin je validan samo ako cijelo trajanje (usluga + buffer) staje unutar radnog vremena i ne preklapa pauzu, blok, neradni dan ili drugu rezervaciju istog zaposlenog.
- **BR-4** Isti zaposleni ne može imati dvije aktivne rezervacije koje se preklapaju (DB nivo).
- **BR-5** Potvrda rezervacije je podesiva po biznisu: `auto` (odmah `confirmed`) ili `manual` (`pending` → `confirmed`).
- **BR-6** Klijent može otkazati/pomjeriti samo unutar roka definisanog po biznisu (npr. do 24h prije). Nakon roka — samo vlasnik.
- **BR-7** Lead time: rezervacija mora biti najmanje X (min. najava) i najviše Y (horizont) u budućnosti; X i Y su podesivi po biznisu.
- **BR-8** Klijenti se automatski grupišu unutar biznisa po (email ili telefon) — isti klijent = isti zapis u tom biznisu.
- **BR-9** Svi prikazi vremena koriste timezone biznisa.
- **BR-10** Sigurni link sadrži neproziran token; pristup rezervaciji moguć je samo uz validan token.

---

## 7. Statusi rezervacije

| Status | Značenje |
|--------|----------|
| `pending` | Čeka potvrdu vlasnika (samo kod ručne potvrde) |
| `confirmed` | Potvrđen termin |
| `cancelled` | Otkazan (od klijenta ili vlasnika) |
| `completed` | Termin obavljen |
| `no_show` | Klijent se nije pojavio |

---

## 8. Nefunkcionalni zahtjevi

- **Performanse:** izračun dostupnosti za jedan dan/zaposlenog < 300ms.
- **Pouzdanost:** nula duplih rezervacija (garantovano na DB nivou).
- **Sigurnost:** RLS izolacija po biznisu; tokeni za goste; bez izlaganja tuđih podataka.
- **Pristupačnost / UX:** mobilno-prvo za klijentski tok, desktop-optimizovano za vlasnika.
- **i18n:** UI na engleskom, struktura ostavlja prostor za buduće prijevode.
- **Privatnost:** minimalno prikupljanje podataka klijenta (ime, email, telefon).

---

## 9. Pretpostavke (preskočena pitanja — podrazumijevane vrijednosti za MVP)

Sljedeće stavke nisu eksplicitno potvrđene; usvojene su razumne MVP vrijednosti i lako su izmjenjive:

- Jedna usluga po rezervaciji (bez kombinovanja više usluga u jednom terminu).
- Kapacitet termina = 1 klijent (bez grupnih termina).
- Bez super-admin uloge i bez SaaS naplate u MVP-u.
- Rok otkazivanja: podesiv po biznisu (default npr. 24h).
- Email podsjetnik 24h prije termina.
- Status `no_show` uključen.
- Obavezna polja klijenta: ime + email + telefon.
- Neradni dani/praznici: na nivou biznisa i pojedinačnog zaposlenog.
- Vlasnik može ručno kreirati rezervaciju.
- Bez recenzija/ocjena u MVP-u.
- Usluge se grupišu u kategorije.
- Valuta: USD (podesivo po biznisu kasnije).

---

## 10. Kriteriji uspjeha (MVP "Definition of Done")

- Biznis se može registrovati i kroz wizard doći do žive javne stranice.
- Klijent može rezervisati termin sa ispravno izračunatom dostupnošću.
- Dupla rezervacija je nemoguća (potvrđeno testom konkurentnosti).
- Vlasnik vidi i upravlja terminima i ima osnovni dashboard.
- Podaci jednog biznisa nisu vidljivi drugom (potvrđeno RLS testom).
