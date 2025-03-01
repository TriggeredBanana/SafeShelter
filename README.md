# SafeShelter - Gruppe 6

## Gruppemedlemmer:
- Sigurd Munk Brekke - sigurdmb@uia.no
- Daniel Danvik Møgster - danieldm@uia.no
- Ole Bjørk Olsen - danielbj@uia.no
- Emil Stokken Kaasa - emilsk@uia.no
- Sigurd Bøthun Mæland - sigurdbm@uia.no
- Henrik Sæverud Lorentzen - henriksl@uia.no

## Prosjektbeskrivelse
Et interaktivt kartprosjekt for å lokalisere tilfluktsrom og brannstasjoner i krisesituasjoner som brann eller flom.

---

## **Innholdsfortegnelse**

- [Oversikt](#Oversikt)
- [Problemstilling](#Problemstilling)
- [Teknologivalg og Arkitektur](#teknologivalg-og-arkitektur)
- [Datakilder og Databehandling](#datakilder-og-databehandling)
- [Backend/API-Implementasjon](#backendapi-implementasjon)
- [Frontend og Visualisering](#frontend-og-visualisering)
- [Hovedfunksjoner](#hovedfunksjoner)
- [Installasjon og Oppsett](#installasjon-og-oppsett)
- [Tekniske detaljer](#tekniske-detaljer)
- [Fremtidige Forbedringer](#fremtidige-forbedringer)

---

## **Oversikt**

Dette prosjektet er en del av et universitetsoppdrag hvor studenter utvikler en interaktiv kartapplikasjon ved hjelp av Leaflet. Prosjektet integrerer åpne data, backend-APIer og visualiseringer for å håndtere en spesifikk tematisk problemstilling: Hvordan lokalisere og få tilgang til tilfluktsrom i tilfelle nødsituasjoner som brann eller flom.

---

## **Problemstilling**

- Visualisere plasseringen av tilfluktsrom og brannstasjoner, og hvordan man kan nå dem under en krisesituasjon
- Beregne og vise faktiske kjøreruter til nærmeste tilfluktsrom basert på brukerens posisjon
- Visualisere spesielt utsatte områder for kriser som flom og brann
- Vise flom- og brannrisikoområder basert på meteorologiske data

---

## **Teknologivalg og Arkitektur**

- **Frontend:** 
  - Leaflet.js for kartvisualisering
  - HTML/CSS og JavaScript for brukergrensesnitt
  - OSRM (Open Source Routing Machine) for ruteberegninger
  
- **Backend:** 
  - Supabase som database og serverløs backend
  - Express.js for API-endepunkter
  
- **Databehandling:** 
  - QGIS for håndtering av geospatiale data
  - Python for datatransformasjon
  
- **Datakilder:** 
  - GeoNorge

---

## **Datakilder og Databehandling**

- **Datasett:**
    - [Brannstasjoner](https://kartkatalog.geonorge.no/metadata/brannstasjoner/0ccce81d-a72e-46ca-8bd9-57b362376485?search=Brannstasjoner)
    - [Flomsoner](https://kartkatalog.geonorge.no/metadata/flomsoner/e95008fc-0945-4d66-8bc9-e50ab3f50401)
    - [TilfluktsromOffentlige](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8?search=Tilfluk)
    - Alle filene er lagret i PostGIS-format i Supabase

- **Databehandlingsverktøy:**
    - QGIS for geospatial analyse og filkonvertering
    - Python-skript for rengjøring og transformasjon av datasett
    - Proj4js for koordinattransformasjoner i nettleseren

---

## **Backend/API-Implementasjon**

Backend-en er implementert ved hjelp av Supabase som database, som gir enkel tilgang til tabeller og data. Express.js brukes for å håndtere API-forespørsler og fungere som en mellomtjeneste mellom frontend og Supabase.

### **Viktige API-endepunkter:**

| Endepunkt | Metode | Beskrivelse |
|---|---|---|
| `/api/tilfluktsrom` | GET | Henter tilfluktsromdata fra Supabase |
| `/api/brannstasjoner_agder` | GET | Henter brannstasjonsdata fra Supabase |

---

## **Frontend og Visualisering**

Frontend bruker Leaflet.js for interaktive kartvisualiseringer og HTML/CSS/JavaScript for grensesnitt og interaktivitet. Vi har implementert flere lag som kan aktiveres/deaktiveres, og et responsivt design som fungerer på tvers av enheter.

### **Visuelle funksjoner:**

- Dynamiske markører for tilfluktsrom og brannstasjoner
- Flere kartlag (gater, satellitt og terreng)
- Interaktive popups med informasjon
- Animerte rutevisualiseringer
- Markørklynger for bedre ytelse med mange datapunkter
- Mørk modus for nattbruk

---

## **Hovedfunksjoner**

### **1. Finn nærmeste tilfluktsrom**
- Brukerens posisjon hentes via nettleserens geolokalisering
- Avstand beregnes til alle tilfluktsrom i databasen
- Nærmeste tilfluktsrom identifiseres
- Faktisk kjørerute beregnes ved hjelp av OSRM API
- Ruten vises på kartet med distanse og estimert kjøretid

### **2. Kartsøk**
- Adressesøk med autofullføring
- Resultater vises på kartet
- Koordinattransformasjon fra ulike projeksjoner til WGS84

### **3. Informasjonspanel**
- Detaljert informasjon om valgte tilfluktsrom eller brannstasjoner
- Kapasitetsdata for tilfluktsrom
- Kontaktinformasjon for brannstasjoner

### **4. Kartilpasninger**
- Bytte mellom ulike kartlag
- Aktivere/deaktivere markørlag
- Visning av flomsoner (når tilgjengelig)
- Fullskjermsmodus
- Logo-klikk for rask tilbakestilling av kartet

---

## **Installasjon og Oppsett**

1. **Forutsetninger:**
   ```
   npm version 6.x eller nyere
   Node.js version 14.x eller nyere
   ```

2. **Installer avhengigheter:**
   ```bash
   npm install
   ```

3. **Konfigurer miljøvariabler:**
   Opprett en .env-fil i rotmappen med følgende innhold:
   ```
   SUPABASE_URL=https://din-supabase-url.supabase.co
   SUPABASE_KEY=din-supabase-nøkkel
   ```

4. **Start serveren:**
   ```bash
   node server.js
   ```

5. **Åpne applikasjonen:**
   Åpne index.html i en nettleser eller bruk en lokal server som Live Server i VS Code.

---

## **Tekniske detaljer**

### Kodestruktur:
- mapoverlay.js: Håndterer kartgrensesnitt og interaktivitet
- script.js: Hovedlogikk for datahåndtering og kartvisualisering
- ui.js: Brukergrensesnitt-kontrollfunksjoner
- style.css: Stilmaler for applikasjonen
- index.html: Hovedstruktur for applikasjonen
- server.js: Backend API-endepunkter

### Ruteberegning:
- `getRoadDistanceAndRoute()` i mapoverlay.js bruker OSRM API for å beregne faktiske kjøreruter
- Fallback til luftlinjeavstand hvis OSRM ikke er tilgjengelig

---

## **Fremtidige Forbedringer**

### **Planlagte oppdateringer:**
- Fullstendig oversettelse av grensesnitt til norsk
- Støtte for alternative transportmetoder (gange, kollektivtransport)
- Offline-modus med lokal datalagring for bruk i nødsituasjoner
- Forbedret håndtering av store datasett med avanserte klyngeteknikker
- Forbedret mobilresponsivitet for bruk i felt under nødsituasjoner
- Utvidede tilgjengelighetsalternativer for brukere med ulike behov

### **Utvidelse av datasett:**
- Integrering av sanntidsdata for pågående krisehendelser
- Historiske data for tidligere nødsituasjoner for bedre risikopredikering
- Tilleggsdata om tilfluktsrom som fasiliteter og begrensninger

### **Tekniske forbedringer:**
- Optimaliseringsarbeid for raskere lasting av kart og data
- Implementasjon for live-oppdateringer
- Forbedring av rutealgoritmer med flere faktorer (trafikk, veiarbeid)