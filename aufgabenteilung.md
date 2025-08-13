Kooperationsbeschreibung – Frontend & Backend im Umfrage-Tool
Projektaufteilung
Das Projekt wurde modular entwickelt und in zwei Hauptbereiche aufgeteilt:

Frontend (meine Verantwortung)

Umsetzung der UI für die Umfrage-Erstellung (Drag & Drop, Modals, Validierung).

Umsetzung des Publish-Workflows (Start- und Enddatum, Anzeige des Links).

Entwicklung eines Adapters (SurveyService), um Datenquellen flexibel anzubinden
(z. B. aktuell Firebase, später Firmen-CMS).

Implementierung des Dashboards mit Charts zur Anzeige der Ergebnisse in Echtzeit.

Fehler- und Statusmeldungen (Error-Handling bei 400, 401/403, 409).

Backend (Kooperationspartner)

Speicherung der Daten in einer persistenten Datenbank ( Firestore).

Implementierung von REST-API Endpoints:

POST /surveys – neue Umfrage anlegen

GET /surveys/:id – Umfrage-Daten abrufen

POST /surveys/:id/publish – Veröffentlichung starten

POST /surveys/:id/responses – Antworten speichern

GET /surveys/:id/aggregates – Auswertungen abrufen

Authentifizierung und Autorisierung (JWT, Owner-Token, Public-Link).

Aggregation und Berechnung von Statistiken (z. B. Ja/Nein-Zählung, Slider-Durchschnitt).

Gemeinsame Arbeit
API-Contract gemeinsam definiert:

Request- und Response-Struktur (JSON)

Statuscodes (400, 401, 403, 409, 422)

Versionierung: /api/v1/...

Testen mit Postman und automatisierten Unit-Tests.

Klare Trennung: Frontend konsumiert nur API, Backend implementiert die Logik.

Vorteil der Architektur
Durch den Adapter-Ansatz im Frontend kann die Datenquelle leicht gewechselt werden.

Für die Integration in ein Firmen-CMS muss nur die Endpoint-URL angepasst werden – keine Änderungen am restlichen Code.

Skalierbar und wartbar, auch bei zukünftigen Anforderungen.

