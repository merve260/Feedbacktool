# 📊 FeedbackTool – Umfrage- und Feedback-System

Ein modernes Angular 19.2.12 Projekt mit Firebase Integration.  
Das Tool ermöglicht es, **Umfragen zu erstellen**, **Links zu teilen** und **Antworten in Echtzeit zu speichern und auszuwerten**.

---

## 📑 Inhaltsverzeichnis
1. [Überblick](#-überblick)
2. [Technologien](#-technologien)
3. [Projektstruktur](#-projektstruktur)
4. [Wichtige Komponenten](#-wichtige-komponenten)
  - [Survey Builder](#survey-builder)
  - [Survey Publish](#survey-publish)
  - [Survey Viewer](#survey-viewer)
  - [Survey Edit](#survey-edit)
  - [Admin-Dashboard](#admin-dashboard)
  - [Auth-Dialog](#auth-dialog)
5. [Services & Adapter](#-services--adapter)
6. [Styling & UI-Konzept](#-styling--ui-konzept)
7. [Guards & Sicherheit](#-guards--sicherheit)
8. [Deployment](#-deployment)
9. [Fazit & Ausblick](#-fazit--ausblick)

---

## 1. Überblick
Das **FeedbackTool** ist ein webbasiertes System für Umfragen und Feedback.  
Admins können über eine **Drag & Drop Oberfläche** Fragen erstellen, mit verschiedenen Typen konfigurieren und veröffentlichen.  
Teilnehmer:innen greifen über einen **öffentlichen Link** zu und beantworten die Umfrage Schritt für Schritt.

---

## 2. Technologien
- Angular CLI v19.2.12 (Standalone Components)
- Angular Material (MDC)
- Firebase (Auth, Firestore, Hosting)
- TypeScript
- SCSS
- Chart.js (Auswertungen)
- Shell-Skripte für Deployment

---

## 3. Projektstruktur
```bash
src/
├── app/
│   ├── core/             # Auth, Guards, Models, Services
│   ├── features/         # Hauptfeatures
│   │   ├── survey/       # Builder, Viewer, Publish, Edit
│   │   ├── admin/        # Dashboard, Analyse, Profil
│   │   └── shared/       # Modals, Dialoge, Auth
│   ├── infra/            # Firebase Adapter, Backend-Ports
│   └── styles/           # Globale Styles & Theme
├── assets/               # Icons, Bilder
└── public/               # Favicon, statische Dateien
```
## 4. Wichtige Komponenten

### 4.1 Survey Builder
- **Drag & Drop Oberfläche** mit `CdkDragDrop`
- Unterstützte Fragetypen:
  - Multiple Choice
  - Single Choice (Radio)
  - Slider (Skala)
  - Sterne-Bewertung
  - Freitext
- Bearbeiten & Löschen über Icon-Buttons
- Validierung: Titel, Zeitraum, mindestens eine Frage muss vorhanden sein
- Vorschau-Funktion in Modal eingebunden

---

### 4.2 Survey Publish
- Buttons: **„Entwurf speichern“** und **„Umfrage veröffentlichen“**
- Validierungen:
  - Startdatum & Enddatum nicht in der Vergangenheit
  - Zeitraum konsistent (Start < Ende)
  - Mindestens eine Frage im Builder
- Generiert einen Teilnehmer-Link (`/survey/:id`)
- Link kann direkt geöffnet oder kopiert werden
- Parent-Component wird über `@Output() published` benachrichtigt

---

### 4.3 Survey Viewer
- Teilnehmer-Oberfläche mit **Progress-Bar**
- Schritt-für-Schritt Navigation (Zurück / Weiter / Speichern)
- Fragetypen unterstützt:
  - Multiple Choice
  - Radio
  - Slider
  - Sterne
  - Freitext
- Ergebnisse werden in **Firestore Subcollection `antworten`** gespeichert
- Responsive Design (Mobile & Desktop)

---

### 4.4 Survey Edit
- Admins können eine Umfrage erneut laden
- Fragen per Modal anpassen
- Preview-Funktion für geänderte Fragen
- Änderungen werden mit `updateSurveyWithQuestions` in Firestore gespeichert

---

### 4.5 Admin-Dashboard
- Übersicht aller eigenen Umfragen (Status: Entwurf / Veröffentlicht)
- Detailansicht mit:
  - Metadaten (Titel, Zeitraum, Status, Anzahl Antworten)
  - Ergebnisse in Diagrammen (Chart.js)
- Export-Funktion (Excel)
- Profilseite für Benutzereinstellungen

---

### 4.6 Auth-Dialog
- Firebase Authentication mit E-Mail/Passwort
- Zwei Tabs:
  - **Login**
  - **Registrierung**
- `MatDialog` mit Reactive Forms
- Validierung: Pflichtfelder & Passwort-Mindestlänge
- Fehlerbehandlung (SnackBar-Meldungen)

---
## 5. Services & Adapter

### 5.1 SurveyService
- Zentraler Service für alle CRUD-Operationen von Umfragen
- Nutzt intern unterschiedliche Adapter (Firebase oder CMS)
- Methoden:
  - `createDraft(survey: Survey)`
  - `publish(survey: Survey)`
  - `updateSurveyWithQuestions(surveyId: string, questions: Question[])`
  - `listQuestions(surveyId: string)`
  - `submitResponse(surveyId: string, response: Response)`

---

### 5.2 FirebaseSurveyAdapter
- Standardadapter für die Firestore-Integration
- Verantwortlich für alle Datenoperationen in `umfragen/{id}/fragen`
- Enthält u. a. folgende Methoden:
  - `createDraft()` – erstellt ein neues Dokument mit `status: 'draft'`
  - `publish()` – setzt den Status auf `published` und generiert den Teilnehmerlink
  - `updateSurveyWithQuestions()` – speichert Fragen als Subcollection
  - `listQuestions()` – lädt alle Fragen einer Umfrage
  - `submitResponse()` – speichert Teilnehmerantworten in Subcollection `antworten`
- Nutzt `omitUndefined<T>()` Utility, um Firestore-Fehler durch `undefined` Felder zu vermeiden

---

### 5.3 CmsSurveyAdapter
- Platzhalter für zukünftige CMS-Integration (z. B. Polario CMS)
- Interface-konform zum `SurveyBackend`
- Enthält leere Methoden (Stub), die später durch echte Implementierung ersetzt werden

---

### 5.4 Abstraktion: SurveyBackend
- Port/Interface, das von allen Adaptern implementiert wird
- Vorteil: einfache Austauschbarkeit des Backends
- Ermöglicht sowohl Firebase als auch CMS als Datenquelle
- Unterstützt Dependency Injection für maximale Flexibilität

---
## 6. Styling & UI-Konzept

### 6.1 Farbkonzept
- Hauptfarbe: **Lila (#6b4cff)**
- Unterstützende Farben:
  - `--brand-border: #e6e2f3`
  - `--brand-soft: #f4f1fb`
- Hintergrund: Weiß für klare Lesbarkeit
- Kontraste: Dunkle Schrift auf hellem Hintergrund

---

### 6.2 UI-Richtlinien
- **Minimalistisch & modern**
- **Abgerundete Ecken (border-radius: 10–16px)** für Karten, Dialoge, Buttons
- **Schatteneffekte** für Karten (`box-shadow` → sanft, nicht überladen)
- **Hover-Effekte nur lokal** (z. B. Buttons, Karten), kein global-hover auf Toolbar

---

### 6.3 Komponenten-Design
- **Toolbar**
  - Enthält Logo, Navigation, Suchfeld
  - Suchfeld: abgerundet, dezente Border
- **Karten (Cards)**
  - Nutzt `MatCard` + SCSS-Customizing
  - Einheitliches Padding & margin
  - Titel klar hervorgehoben
- **Modals**
  - Einheitliche Vorschau-Box in grauem Hintergrund
  - Buttons: rechtsbündig, primär (Lila) + sekundär (Grau)
- **Progress-Bar**
  - Lila Balken mit weißem Hintergrund
  - Zeigt numerischen Fortschritt (z. B. *Frage 3 von 10*)

---

### 6.4 Responsive Design
- Mobile-First Ansatz
- Breakpoints:
  - **≤ 768px (Smartphones):**
    - Toolbar gestapelt
    - Karten 1-spaltig
    - Dialoge im Vollbild
  - **≥ 769px (Desktop/Tablet):**
    - Toolbar horizontal
    - Karten 2–3 spaltig
    - Dialoge mittig mit max-width

---

### 6.5 Typografie
- Basis-Schrift: *Roboto* (über Angular Material vorinstalliert)
- Überschriften (h1–h3): kräftiger, Lila (#2e236d)
- Fließtext: dunkelgrau (#444)
- Kleine Labels (z. B. „Vorschau“, „Fragetitel“): grau (#777), disabled-Look

---
## 7. Guards & Sicherheit

### 7.1 AuthGuard
Der **AuthGuard** schützt alle administrativen Bereiche im Angular-Frontend.  
Er prüft, ob ein Benutzer eingeloggt ist. Falls nicht, wird automatisch zur Login-Seite weitergeleitet.  
Dadurch ist sichergestellt, dass nur authentifizierte Nutzer:innen Zugriff auf das Admin-Dashboard und die Umfrageverwaltung haben.

---

### 7.2 UnsavedChangesGuard
Der **UnsavedChangesGuard** verhindert, dass Nutzer:innen eine Seite verlassen, wenn noch ungespeicherte Änderungen vorhanden sind.  
Beim Versuch die Seite zu wechseln, öffnet sich ein Bestätigungsdialog mit der Wahl:
- „Im Formular bleiben“
- „Seite verlassen“

So wird ein versehentliches Verlieren von Eingaben verhindert.

---

### 7.3 Firestore Security Rules
Die Sicherheit wird zusätzlich durch **Firestore Security Rules** gewährleistet.  
Die Regeln sind wie folgt gestaltet:
- **Besitzer:innen** (ownerId) dürfen ihre eigenen Umfragen und Fragen lesen, bearbeiten und löschen.
- **Admins** haben volle Rechte und können alle Umfragen und Antworten verwalten.
- **Teilnehmer:innen** dürfen Umfragen nur lesen, wenn diese veröffentlicht sind, und Antworten einreichen.
- Antworten sind für alle nutzbar, werden aber nur vom Besitzer oder Admin eingesehen und verwaltet.

Damit wird ein klarer Unterschied zwischen normalen Benutzer:innen, Admins und anonymen Teilnehmer:innen geschaffen.

---

### 7.4 Rollen & Authentifizierung
- **Authentifizierung** erfolgt über Firebase Authentication (E-Mail & Passwort).
- **Rollenverwaltung** (Admin/User) wird über eine eigene Collection in Firestore gepflegt.
- Nur Admins haben Zugriff auf alle Daten, während normale User:innen nur ihre eigenen Umfragen sehen und bearbeiten können.
- **Teilnehmer:innen** benötigen kein Login, um eine Umfrage auszufüllen.

---

### 7.5 Datenschutz (DSGVO)
- Es werden nur die für den Betrieb notwendigen Daten gespeichert: Umfragen, Fragen und Antworten.
- Teilnehmer:innen können ihre Antworten anonym abgeben (Standardname: „Anonym“).
- Es werden **keine IP-Adressen oder Browserdaten** gespeichert.
- Alle Daten werden verschlüsselt über **HTTPS** übertragen.
- Durch Firestore Security Rules wird sichergestellt, dass keine unbefugten Zugriffe stattfinden.

---
## 8. Deployment

### 8.1 Lokale Entwicklung
Für die lokale Entwicklung wird das Projekt mit **Angular CLI** gestartet.  
Dabei stehen folgende Ziele im Vordergrund:
- Einfaches Testen neuer Features
- Nutzung der Firebase Emulator Suite (optional)
- Hot-Reloading durch `ng serve`

Dadurch können Entwickler:innen schnell Änderungen überprüfen, bevor sie ins Deployment gehen.

---

### 8.2 Deployment auf Firebase
Das Projekt ist auf **Firebase Hosting** ausgelegt.  
Der Ablauf für ein Deployment umfasst:
1. **Build** mit Angular im Produktionsmodus
2. **Deployment** auf Firebase Hosting mit automatischer HTTPS-Absicherung
3. Optional: Einbindung eines eigenen Domains mit SSL-Zertifikat

Firebase Hosting stellt sicher, dass die App weltweit skalierbar und performant ausgeliefert wird.

---

### 8.3 Bekannte Limitierungen
Aktuell bestehen folgende Einschränkungen:
- **Kein Offline-Modus**: Das Tool benötigt eine aktive Internetverbindung, da Daten ausschließlich in Firestore gespeichert werden.
- **Einfache Rollenverwaltung**: Bisher werden nur „User“ und „Admin“ unterschieden. Eine feinere Rechteverwaltung fehlt noch.
- **CMS-Adapter**: Der vorbereitete Adapter ist noch ein Platzhalter und enthält keine Logik.
- **UI-Bindung an Angular Material**: Ein Wechsel auf andere UI-Libraries (z. B. Tailwind-only) erfordert Anpassungen.
- **Analytics**: Die Auswertungen sind aktuell noch einfach und könnten durch detailliertere Analysen ergänzt werden.

---

### 8.4 Sicherheit & Datenschutz
- **Authentifizierung** ausschließlich über Firebase Auth
- **Security Rules** kontrollieren den Zugriff auf Umfragen, Fragen und Antworten
- **Datenschutz nach DSGVO**:
  - Es werden keine IP-Adressen gespeichert
  - Teilnehmer:innen können Umfragen anonym ausfüllen
  - Daten werden ausschließlich verschlüsselt übertragen
- **Zugriffskontrolle**:
  - Nur Besitzer:innen und Admins dürfen Umfragen und Antworten verwalten
  - Teilnehmer:innen können nur Antworten hinzufügen

---

### 8.5 Herausforderungen & Grenzen
- **Technische Grenzen**: Firestore hat ein 1 MB Limit pro Dokument, was bei sehr umfangreichen Umfragen erreicht werden kann.
- **Skalierung**: Bei sehr vielen gleichzeitigen Zugriffen können Lese-/Schreiboperationen kurzzeitig langsamer sein.
- **Entwicklungsaufwand**: Drag & Drop und unterschiedliche Fragetypen erfordern komplexe Logik.
- **UX-Aspekte**: Fehlermeldungen sind teilweise noch textbasiert und nicht überall visuell eingebettet.
- **Organisatorisch**: Backups und Langzeitarchivierung von Ergebnissen sind bisher nicht definiert.

---

## 9. Fazit & Ausblick

### 9.1 Zusammenfassung
Das Projekt **FeedbackTool** zeigt, wie mit einer modernen Angular-Architektur, Firebase-Integration und klar definierten Komponenten ein leistungsfähiges Umfrage- und Feedback-System realisiert werden kann.  
Admins können Umfragen per Drag & Drop erstellen, veröffentlichen und auswerten, während Teilnehmer:innen unkompliziert und anonym Feedback geben können.  
Durch die Kombination aus **Realtime-Datenbank**, **Security Rules** und **modularem Aufbau** entsteht eine flexible Grundlage für zukünftige Erweiterungen.

---

### 9.2 Stärken
- **Moderne Angular-Technologien** (Standalone Components, Reactive Forms)
- **Echtzeit-Speicherung** mit Firebase Firestore
- **Skalierbare Sicherheit** durch rollenbasierte Zugriffsregeln
- **Klares UI/UX-Konzept** mit responsivem Design
- **Saubere Architektur** durch Adapter-Pattern (Firebase & CMS)

---

### 9.3 Herausforderungen
- Umsetzung verschiedener Fragetypen und deren konsistente Darstellung im Builder und Viewer
- Verwaltung von ungespeicherten Änderungen (Dirty-Check mit ConfirmDialog)
- Vereinheitlichung der Modals für unterschiedliche Frageformate
- Erste Version der Rollenverwaltung ist funktional, aber noch nicht fein granular

---

### 9.4 Ausblick
- Einführung einer erweiterten **Rollen- und Rechteverwaltung** (z. B. Admin, Redakteur, Viewer)
- Unterstützung weiterer **Fragetypen** (Matrix-Fragen, Datei-Upload, Ranking-Systeme)
- Ausbau der **Analytics** mit Chart.js oder D3.js für detailliertere Auswertungen
- Einführung von **Mehrsprachigkeit (i18n)** für internationale Teams
- Optionale Integration eines **CMS** über den CmsSurveyAdapter
- Erweiterung um **Automatisierte Backups** und **Archivierung** von Umfragen

---

### 9.5 Persönliche Reflexion
Dieses Projekt hat gezeigt, dass ich in der Lage bin, eine **komplette Webapplikation** von Grund auf zu planen, zu entwickeln und bereitzustellen.  
Ich habe meine Kenntnisse in **Angular, Firebase, TypeScript und SCSS** praxisnah vertieft und in einem realistischen Szenario angewendet.  
Besonders wertvoll war die Arbeit mit **Security Rules, Guards und modularen Komponenten**, da sie mich sowohl technisch als auch konzeptionell herausgefordert haben.  
Das FeedbackTool ist für mich ein Beleg, dass ich in der Lage bin, komplexe Anforderungen in eine **skalierbare, sichere und benutzerfreundliche Lösung** umzusetzen.

---
