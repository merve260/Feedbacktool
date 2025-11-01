# FeedbackTool – Umfrage- und Feedback-System

Ein **Angular 19** Projekt mit **Firebase-Integration** (Auth + Firestore + Hosting).  
Das Tool ermöglicht es, **Umfragen zu erstellen**, **Teilnehmer-Links zu teilen** und **Antworten in Echtzeit zu speichern und auszuwerten**.

---

## Inhaltsverzeichnis
1. [ Überblick](#-überblick)
2. [ Technologien](#️-technologien)
3. [ Projektstruktur](#-projektstruktur)
4. [ Wichtige Komponenten](#-wichtige-komponenten)
  - [Survey Builder](#survey-builder)
  - [Survey Publish](#survey-publish)
  - [Survey Viewer](#survey-viewer)
  - [Survey Edit](#survey-edit)
  - [Admin-Dashboard](#admin-dashboard)
  - [Auth-Dialog](#auth-dialog)
5. [ Services & Adapter](#️-services--adapter)
6. [ Styling & UI-Konzept](#-styling--ui-konzept)
7. [ Guards & Sicherheit](#-guards--sicherheit)
8. [ Deployment](#️-deployment)
9.  Fazit & Ausblick](#-fazit--ausblick)

---

## 1. Überblick

Das **FeedbackTool** ist ein webbasiertes **Umfrage- und Feedback-System**, entwickelt für Admin- und Teilnehmer-Ansichten.  
Admins können per **Drag & Drop** Fragen erstellen, Fragetypen wählen und Umfragen veröffentlichen.  
Teilnehmer:innen greifen über einen öffentlichen Link auf die Umfrage zu und geben Antworten in Echtzeit ab.

---

## 2. Technologien

| Technologie | Beschreibung |
|-------------|---------------|
| **Angular 19 (Standalone)** | Moderne Architektur |
| **Angular Material (MDC)** | UI-Komponenten im Material-Design |
| **Firebase (Auth + Firestore )** | Authentifizierung, Datenhaltung |
| **TypeScript 5+** | Typsichere Sprache für sauberen Code |
| **RxJS + Reactive Forms** | Reaktive Datenflüsse & Validierungen |
| **Chart.js / XLSX** | Statistik-Visualisierung & Datenexport |
| **Jest** | Unit-Tests für Services & Komponenten |
| **SCSS** | Modulare & themenfähige Styles |

---

## 3. Projektstruktur

```bash
src/
├── app/
│   ├── core/             # Auth, Guards, Services, Models
│   ├── features/
│   │   ├── survey/       # Builder, Viewer, Publish, Edit
│   │   ├── admin/        # Dashboard, Analytics, Profil
│   │   └── shared/       # Modals, Dialogs, Auth-Components
│   ├── infra/            # Firebase-Adapter & Schnittstellen
│   └── styles/           # Globale Themes & Variablen
├── assets/               # Icons, Logos, Bilder
└── environments/         # dev / prod Konfigurationen

 ```
# 4. Wichtige Komponenten

## 4.1 Survey Builder
- Drag & Drop Oberfläche mit `cdkDropList`
- Fragetypen: Multiple, Radio, Slider, Sterne, Freitext
- Modale Dialoge mit integriertem Vorschau-Bereich
- Validierungen: Titel, Zeitraum, mindestens eine Frage erforderlich
- Speicherung: Als Entwurf oder veröffentlichte Umfrage

---

## 4.2 Survey Publish
- Buttons: „Entwurf speichern“ und „Umfrage veröffentlichen“
- Validierungen: Titel, Start- und Enddatum, Fragenanzahl
- Generiert kopierbaren Teilnehmer-Link
- Navigation: Nach Speicherung Weiterleitung zu `/admin/surveys`

---

## 4.3 Survey Viewer
- Stepper-Interface mit Fortschrittsanzeige (Progress-Bar)
- Unterstützte Fragetypen: Multiple, Radio, Slider, Sterne, Freitext
- Echtzeit-Speicherung der Antworten in Firestore
- Responsive Design für Desktop und Mobile

---

## 4.4 Survey Edit
- Lädt bestehende Umfragen inklusive Fragen
- Modal-Dialoge für Änderungen mit Vorschau
- Prüft ungespeicherte Änderungen (Dirty-Check + ConfirmDialog)

---

## 4.5 Admin-Dashboard
- Übersicht aller Umfragen mit Status (Entwurf / Veröffentlicht)
- Analyse der Ergebnisse mit Chart.js-Diagrammen
- Exportfunktion in Excel (XLSX)
- Profilverwaltung mit Avatar- und Logo-Upload

---

## 4.6 Auth-Dialog
- Login und Registrierung über Firebase Authentication
- MatDialog mit Tabs („Login“ und „Registrieren“)
- Validierung der Eingaben und visuelles Feedback
- Automatische Weiterleitung nach erfolgreichem Login

---

# 5. Services & Adapter

## 5.1 SurveyService
- Verantwortlich für CRUD-Operationen: `create`, `update`, `delete`, `list`
- Nutzt eine SurveyBackend-Abstraktion zur Trennung von Logik und Datenzugriff
- Führt Validierungen vor der Speicherung durch
- Verwendet RxJS Observables für reaktive Datenflüsse

---

## 5.2 FirebaseSurveyAdapter
- Hauptadapter für die Firestore-Integration
- Enthält folgende Methoden:
  - `createDraft` – erstellt eine Entwurfsumfrage
  - `publish` – setzt den Status auf „published“
  - `updateSurveyWithQuestions` – aktualisiert Umfrage und Fragen
  - `listQuestions` – ruft Fragen aus der Unterkollektion ab
  - `submitResponse` – speichert Teilnehmerantworten
- Sicherheitsprüfung: `ownerId == auth.uid`
  Nur Besitzer:innen dürfen eigene Umfragen bearbeiten oder löschen

---

## 5.3 CmsSurveyAdapter (Stub)
- Platzhalter-Adapter für zukünftige Integration in das Polario-CMS
- Enthält aktuell nur Dummy-Methoden
- Ziel: Erweiterung für CMS-spezifische Datenschnittstellen

Beispielhafte Implementierung:

```typescript
export class CmsSurveyAdapter implements SurveyBackend {
  createDraft(): Promise<void> {
    console.log('CMS Adapter Stub');
    return Promise.resolve();
  }
}
```
# 6. Styling & UI-Konzept
Das Styling des FeedbackTools basiert auf einem hellen, minimalistischen Design mit klarer Typografie und weichen Schatten.
Das Ziel war eine moderne Benutzeroberfläche mit hoher Lesbarkeit und klaren visuellen Hierarchien.

## Merkmale
- Farbdefinition über CSS-Variablen (zentrale Steuerung im :root-Bereich)
- Runde Kanten und Soft-Shadows für alle interaktiven Elemente
- Einheitliches SCSS-System für Buttons, Dialoge und Formulare
- Kein globaler Hover-Effekt auf der Toolbar (bewusstes Design)
- Responsives Grid-Layout für Karten, Formulare und Dialoge
- Optimierung für Desktop- und Mobile-Ansichten

## Farbkonzept
Das Projekt verwendet ein automatisch generiertes Angular Material Farb-Theme,
das auf den Primärfarben #b47ac7 und #996dda basiert.

Zusätzlich werden eigene CSS-Variablen definiert, um ein einheitliches Branding
und sanfte Farbverläufe im gesamten UI sicherzustellen.

Die Material-Paletten (primary, secondary, tertiary, neutral, error)
werden durch das Skript
ng generate @angular/material:theme-color
erzeugt und enthalten abgestufte Helligkeitswerte von 0–100,
um konsistente Farbabstufungen für alle Komponenten zu gewährleisten.
---

# 7. Guards & Sicherheit

## 7.1 AuthGuard
Schützt alle administrativen Bereiche der Anwendung.
Überprüft, ob ein Benutzer authentifiziert ist, und leitet bei fehlender Session auf die Login-Seite weiter.

## 7.2 UnsavedChangesGuard
Verhindert das unbeabsichtigte Verlassen einer Seite mit ungespeicherten Änderungen.
Beim Navigationsversuch wird ein Bestätigungsdialog geöffnet, der die Optionen „Bleiben“ oder „Verlassen“ anbietet.

## 7.3 Firestore Security Rules
- Nur der Besitzer einer Umfrage (ownerId == auth.uid) darf sie ändern oder löschen.
- Teilnehmer:innen dürfen ausschließlich Antworten speichern.
- Öffentlich geteilte Links (/survey/:id) erlauben nur das Lesen und Beantworten von Umfragen.

---

# 8. Deployment

## 8.1 Lokale Entwicklung
Zur lokalen Entwicklung wird die Anwendung über Angular CLI gestartet.

npm install  
ng serve

Alternativ über Shell-Skript:

./dev.sh


## 8.3 Deployment auf All-inkl Hosting
- Ordner dist/feedback-tool zippen
- Per FTP in das Root-Verzeichnis / hochladen
- .htaccess für Angular-Routing konfigurieren
- HTTPS und SSL automatisch aktiv

---

# 8.3 Sicherheit und Datenschutz
- Firebase Authentication: Nur eingeloggte Nutzer:innen mit gültiger Session
- Security Rules: Zugriff nur auf eigene Dokumente
- Datenschutz (DSGVO): Keine IP- oder Browserdaten, anonyme Teilnahme möglich
- Transportverschlüsselung: Alle Verbindungen über HTTPS
- Bekannte Lücken: keine 2FA, manuelles Löschen von Antworten erforderlich

---

# 8.4 Grenzen und Herausforderungen

## Technisch
Firestore-Dokumentlimit von 1 MB, keine Joins, kein Offline-Modus.

## Entwicklung
Komplexe Drag-and-Drop-Logik, Wiederholungen bei Modal-Komponenten.

## UX / UI
Mobile Dialoge noch verbesserungsfähig.

## Organisation
Noch keine Backups oder Langzeitarchivierung, CMS-Integration geplant.

---

# 9. Fazit und Ausblick

## 9.1 Zusammenfassung
Das FeedbackTool wurde mit Angular 19, Firebase und Angular Material entwickelt.
Es umfasst folgende Kernfunktionen:
- Erstellung von Umfragen per Drag-and-Drop
- Schritt-für-Schritt-Beantwortung über den Survey Viewer
- Validierte Veröffentlichung mit Link-Generierung
- Echtzeitauswertung der Ergebnisse im Admin-Dashboard
- Speicherung der Daten in Firestore

## 9.2 Technische Stärken
- Verwendung von Standalone Components
- Nutzung von Reactive Forms und Validators
- Integration von Firebase Security Rules und Authentication
- Responsives, barrierearmes Design
- Klare Trennung zwischen View-, Service- und Datenebene

## 9.3 Herausforderungen
- Flexible Datenstruktur für unterschiedliche Fragetypen
- Implementierung der Dirty-Check-Logik
- Konsistentes UI/UX Design über alle Komponenten
- Aufbau einer einheitlichen Teststrategie mit Jest

## 9.4 Ausblick
- Einführung eines Rollen- und Rechtekonzepts (Admin, Nutzer)
- Erweiterung um neue Fragetypen (Matrix, Upload, Ranking)
- Mehrsprachigkeit (i18n) für internationale Nutzung
- Erweiterte Analysen mit Chart.js und D3.js
- Anbindung an Polario-CMS über den CmsSurveyAdapter

## 9.5 Persönliche Reflexion
Dieses Projekt zeigt meine Fähigkeit, eine vollständige Webapplikation von der Konzeption bis zum Deployment umzusetzen.
Ich habe moderne Frameworks wie Angular, Firebase und Material Design eingesetzt und durch den gezielten Einsatz von Reactive Forms, Dependency Injection und Utility Types sauberen, wartbaren und erweiterbaren Code erstellt.
Darüber hinaus konnte ich meine Kenntnisse in UX-Design, Datensicherheit und Projektorganisation praktisch anwenden und vertiefen.

---

# Autorin
Merve Koc

# Projekt
IHK Abschlussprojekt 2025 - Entwicklung eines Feedback- und Umfragetools mit Angular

# Unternehmen
Plazz AG, Erfurt

# Projektzeitraum
06.-17. Oktober 2025

