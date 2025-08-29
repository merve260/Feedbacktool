# 📊 FeedbackTool – Umfrage- und Feedback-System

Ein modernes Angular CLI version 19.2.12 Projekt mit Firebase Integration.  
Dieses Tool erlaubt es, **Umfragen zu erstellen**, **Teilnehmer-Links zu teilen** und **Antworten in Echtzeit zu speichern und auszuwerten**.

---

##  Inhaltsverzeichnis
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
5. [Services & Adapter](#️-services--adapter)
6. [Styling & UI-Konzept](#-styling--ui-konzept)
7. [Guards & Sicherheit](#-guards--sicherheit)
8. [Deployment](#️-deployment)
9. [Fazit](#-fazit)

---

# 1. Überblick
Das **FeedbackTool** ist ein webbasiertes Umfrage-System.  
Admins können Fragen per **Drag & Drop** erstellen, verschiedene Antworttypen konfigurieren und die Umfrage anschließend veröffentlichen.  
Teilnehmer greifen über einen **öffentlichen Link** auf die Umfrage zu und senden ihre Antworten.

---

# 2. Technologien
- Angular CLI version 19.2.12 (Standalone Components)
- Angular Material (MDC)
- Firebase (Auth, Firestore Database, Hosting)
- TypeScript
- SCSS
- Shell-Skripte für Deployment

---


## Projektstruktur

```bash
src/
├── app/
│   ├── core/             # Auth, Services, Models, Guards
│   ├── features/         # Hauptfeatures
│   │   ├── survey/       # Builder, Viewer, Publish, Edit
│   │   ├── admin/        # Dashboard, Analytics, Profil
│   │   └── shared/       # Modals, Dialogs, Auth
│   ├── infra/            # Firebase Adapter
│   └── styles/           # Globale Styles & Theme
├── assets/               # Icons, Bilder
└── public/               # Favicon, statische Dateien

```

# 4. Wichtige Komponenten

## 4.1 Survey Builder
- Drag & Drop Oberfläche mit **cdkDropList**  
- Fragetypen: Multiple, Radio, Slider, Sterne, Freitext  
- Bearbeiten und Löschen über Icon-Buttons  
- Validierung: Titel, Zeitraum, mindestens eine Frage  

## 4.2 Survey Publish
- Buttons: „Entwurf speichern“ und „Umfrage veröffentlichen“  
- Validierungen: Startdatum, Enddatum, Fragenanzahl  
- Generiert Teilnehmer-Link  
- Link kann kopiert oder direkt geöffnet werden  

## 4.3 Survey Viewer
- Teilnehmer-Oberfläche  
- Schritt-für-Schritt Navigation mit Progress-Bar  
- Unterstützt:
  - Multiple Choice  
  - Radio  
  - Slider  
  - Sternebewertung  
  - Freitext  
- Ergebnisse werden in Firestore gespeichert  

## 4.4 Survey Edit
- Admin kann eine Umfrage laden, ändern und speichern  
- Modale Vorschau vor dem Speichern  

## 4.5 Admin-Dashboard
- Übersicht aller Umfragen  
- Ergebnisse und Analytics mit Diagrammen  
- Profilseite für Benutzerverwaltung  

## 4.6 Auth-Dialog
- Login und Registrierung in Tabs  
- Firebase Authentication integriert  
- MatDialog mit zwei Tabs: Login und Registrieren  

---

# 5. Services & Adapter

## 5.1 SurveyService
- Enthält Methoden für CRUD-Operationen  
- Nutzt verschiedene Adapter für Backends  

## 5.2 FirebaseSurveyAdapter
- Hauptadapter für Firestore  
- Enthält Methoden wie:  
  - createDraft  
  - publish  
  - updateSurveyWithQuestions  
  - listQuestions  
  - submitResponse  

## 5.3 CmsSurveyAdapter
- Platzhalter (Stub)  
- Später vom CMS-Team mit echter Logik gefüllt  

---

# 6. Styling & UI-Konzept
- Farbschema (CSS Variablen):  
  ```scss
  --brand-primary: #996dda;
  --brand-border:  #e6e2f3;
  --brand-soft:    #efeaf3;

# 7. Guards & Sicherheit

## 7.1 AuthGuard
- Schützt alle Admin-Routen  
- Prüft, ob ein Benutzer eingeloggt ist  
- Weiterleitung auf **/login**, wenn keine Session vorhanden ist  

## 7.2 UnsavedChangesGuard
- Warnt den Nutzer vor Verlassen einer Seite, wenn Änderungen nicht gespeichert wurden  
- Öffnet ein Bestätigungs-Dialogfenster  
- Option: „Im Dialog bleiben“ oder „Verlassen“  

## 7.3 Firestore Security Rules
- Nur der Besitzer (ownerId == auth.uid) darf eine eigene Umfrage ändern oder löschen  
- Nur Admin-User können öffentliche Events erstellen oder freigeben  
- Antworten werden anonymisiert gespeichert, aber mit Zeitstempel  

---

# 8. Deployment

## 8.1 Lokale Entwicklung
```bash
./dev.sh
# Startet: ng serve
 ```
## 8.2 Deployment auf Firebase

```bash
./deploy.sh
# Enthält:
# 1) ng build --configuration production
# 2) firebase deploy --only hosting
```
## 8.3 Bekannte Limitierungen

1. **Kein Offline-Modus**  
   Das Tool funktioniert nur mit einer stabilen Internetverbindung, da alle Daten direkt in Firestore gespeichert werden.

2. **Einfache Rollenverwaltung**  
   Zurzeit wird nur die **OwnerId** geprüft. Ein komplexeres Rollen- und Rechtekonzept (z. B. Admin, User, Viewer) ist nicht implementiert.

3. **CMS-Adapter nur als Stub**  
   Der Adapter `CmsSurveyAdapter` existiert, enthält jedoch nur leere Methoden. Eine echte Integration in ein CMS muss später ergänzt werden.

4. **UI teilweise an Angular Material gebunden**  
   Die Oberfläche basiert auf Angular Material. Ein Wechsel zu einem reinen **TailwindCSS**- oder anderen Designsystem erfordert Anpassungen.

5. **Begrenzte Analysen**  
   Die aktuellen Auswertungen sind einfach gehalten. Erweiterte Analytics 

## 8.4 Sicherheit & Datenschutz

1. **Firebase Authentication**  
   Der Zugang zu Admin-Funktionen ist nur für registrierte Nutzer:innen mit gültigem Login möglich.  
   Zusätzlich prüft der Firestore-Sicherheitsregel `ownerId == auth.uid`, ob nur der Besitzer seine eigenen Umfragen bearbeiten darf.

2. **Firestore Security Rules**
  - Nur authentifizierte Nutzer:innen dürfen auf ihre eigenen Dokumente zugreifen.
  - Teilnehmer:innen können nur Antworten (`antworten`) schreiben, aber keine Umfragen oder Fragen ändern.
  - Öffentlich geteilte Links (`/survey/:id`) erlauben nur das Lesen der Umfrage und das Schreiben von Antworten.

3. **Datenschutz (DSGVO)**
  - Gespeicherte Daten: Umfragen, Fragen, Antworten.
  - Optionaler Teilnehmername („Anonym“ als Default).
  - Keine Speicherung von IP-Adressen oder Browserdaten in Firestore.

4. **Transportverschlüsselung**  
   Alle Verbindungen laufen über HTTPS (von Firebase Hosting automatisch bereitgestellt).

5. **Bekannte Lücken**
  - Kein vollständiges **Role-Based Access Control (RBAC)**.
  - Keine **Zwei-Faktor-Authentifizierung** implementiert.
  - Keine explizite Datenlöschfunktion für Teilnehmerantworten (muss ggf. manuell ergänzt werden).  
## 8.5 Grenzen & Herausforderungen

1. **Technische Grenzen**
  - Firestore hat ein **Dokumentenlimit** von 1 MB pro Dokument. Sehr große Umfragen mit vielen Fragen/Antworten könnten dieses Limit erreichen.
  - Bei **gleichzeitigen Zugriffen** kann es zu kurzen Verzögerungen kommen, da Firestore keine echten „Joins“ unterstützt.
  - Das **Angular-Frontend** basiert auf Client-Side-Rendering (CSR). Ohne Internetverbindung funktioniert die App nicht.

2. **Entwicklungsaufwand**
  - Die Implementierung von **Drag & Drop** mit `CdkDragDrop` war komplex, da Fragen unterschiedlich behandelt werden müssen.
  - Die **Modal-Komponenten** benötigen viele Wiederholungen (Freitext, Radio, Multiple, Slider, Star). Eine Vereinheitlichung wäre möglich.
  - Testabdeckung ist noch niedrig (nur Basis-Tests vorhanden).

3. **UX-Herausforderungen**
  - Nutzer:innen könnten Schwierigkeiten beim Verständnis der **Preview-Funktion** haben.
  - Fehlermeldungen (z. B. falsches Datum) sind aktuell nur als Text (`alert` oder `errorMsg`) umgesetzt, nicht als visuelle Hinweise im Formular.
  - Mobilgeräte: einige Dialoge sind noch nicht vollständig responsive.

4. **Organisatorische Aspekte**
  - Noch keine Integration in ein externes **CMS** (dafür ist ein separater Adapter `CmsSurveyAdapter` vorbereitet).
  - Für den produktiven Betrieb fehlen **Backups** und ein Konzept für **Langzeitarchivierung** von Ergebnissen.  

# 9. Fazit & Ausblick

## 9.1 Zusammenfassung
- Das Projekt **FeedbackTool** wurde mit **Angular 17**, **Firebase** und **Angular Material** umgesetzt.
- Zentrale Funktionen:
  - **Survey Builder** (Drag & Drop, Modals für Fragetypen)
  - **Survey Viewer** (Schritt-für-Schritt Beantwortung, Progress-Bar)
  - **Survey Publish** (Link generieren, Validierung von Start- und Enddatum)
  - **Admin-Dashboard** (Umfragen verwalten, Antworten analysieren)
- Durch die Verwendung von **Firestore** sind Daten in Echtzeit verfügbar und skalierbar.

## 9.2 Technische Stärken
- **Standalone Components** → moderne Angular-Architektur.
- **Reactive Forms & Validators** → saubere Validierung im Builder.
- **Security Rules** in Firestore → Schutz der Daten.
- **Responsive Design** → optimiert für Desktop und Mobile.
- **Modularer Aufbau** → einfache Erweiterbarkeit.

## 9.3 Herausforderungen
- Unterschiedliche **Fragetypen** erforderten eine flexible Datenstruktur.
- Umgang mit **ungespeicherten Änderungen** (Dirty-Check + ConfirmDialog) war komplex.
- Umsetzung einer konsistenten **UI/UX** mit Material Design und eigenen SCSS-Themes.

## 9.4 Ausblick
- **Rollen- & Rechteverwaltung** (Admins, normale Nutzer:innen).
- **Erweiterte Fragetypen** (z. B. Matrix, Datei-Upload, Ranking).
- **Mehrsprachigkeit (i18n)** für internationale Nutzung.
- **Analytics-Module** mit erweiterten Diagrammen (z. B. Chart.js, D3.js).
- **Deployment-Strategien** → Ausbau zu Multi-Umgebungen (Staging, Production).
- Integration mit externem **CMS** über den `CmsSurveyAdapter`.

## 9.5 Persönliche Reflexion
- Dieses Projekt zeigt, dass ich in der Lage bin, eine **vollständige Web-Applikation** von Grund auf zu konzipieren, zu implementieren und bereitzustellen.
- Ich habe dabei **Angular**, **Firebase**, **TypeScript** und **Material Design** intensiv angewendet.
- Durch den Einsatz moderner Methoden wie **Reactive Forms, Dependency Injection und Utility Types** habe ich nicht nur Funktionalität, sondern auch **sauberen, wartbaren Code** erreicht.  

