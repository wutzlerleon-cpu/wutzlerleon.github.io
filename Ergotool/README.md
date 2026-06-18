# Ergotherapie Spielfinder

Ein vollständiges System zur Verwaltung und Empfehlung von Ergotherapie-Spielen basierend auf Diagnosen.

## 🎯 Features

✅ **Zwei separate "Datenbanken"** (lokal im Browser gespeichert)
- Diagnosen-Datenbank (ADHS, Demenz, Schlaganfall, etc.)
- Spiele-Datenbank (Memory, Jenga, Activity, etc.)

✅ **Admin-Panel** zur Datenverwaltung
- Diagnosen hinzufügen/bearbeiten/löschen
- Spiele hinzufügen/bearbeiten/löschen
- Export/Import von Daten als JSON

✅ **Spielfinder-Interface**
- Diagnose auswählen
- Automatische Berechnung der passendsten Spiele
- Score-basiertes Matching

✅ **Offline-Funktionalität**
- Funktioniert vollständig ohne Server
- Daten werden im Browser gespeichert (localStorage)
- Persistent über Browser-Neustarts

## 🚀 Verwendung

### 1. Datei öffnen
Öffne einfach `public/index.html` im Browser oder nutze einen lokalen Webserver:

**Mit Live Server (VS Code Extension):**
- Right-Click auf `public/index.html` → "Open with Live Server"

**Oder manuell:**
- Öffne `public/index.html` direkt im Browser (Datei → Öffnen)

### 2. Spielfinder verwenden
- Klicke oben rechts auf "📋 Admin-Panel"
- Füge Diagnosen und Spiele hinzu
- Kehre zur Hauptseite zurück
- Wähle eine Diagnose und klicke "Passende Spiele finden"

### 3. Daten verwalten (Admin-Panel)
- **Diagnosen-Tab:** Neue Diagnosen hinzufügen/bearbeiten/löschen
- **Spiele-Tab:** Neue Spiele hinzufügen/bearbeiten/löschen
- **Export/Import:** Daten als JSON speichern/laden

### 4. GitHub Pages bereitstellen
- Erstelle ein neues GitHub-Repository und lade den Ordner `Ergotool` dort hoch.
- Falls du nur die statische Seite brauchst, reicht es, den Inhalt von `public/` in `docs/` zu speichern.
- Aktiviere in GitHub unter `Settings → Pages` den Zweig `main` (oder `master`) und den Ordner `/docs`.
- Die Website ist dann erreichbar unter `https://<dein-nutzername>.github.io/<repo-name>/`.

**Kosten:** GitHub Pages ist für öffentliche Repositories kostenlos. Du kannst deine Seite also ohne zusätzliche Hosting-Gebühren veröffentlichen.

## 📁 Struktur

```
## 📁 Struktur

```
Ergotool/
├── README.md              # Diese Datei
└── public/
    ├── index.html         # Spielfinder (Hauptseite)
    └── admin.html         # Admin-Panel für Datenverwaltung
```

## 💾 Datenspeicherung

Die Daten werden im **Browser localStorage** gespeichert:
- **Diagnosen** → `key: "ergotool_diagnosen"`
- **Spiele** → `key: "ergotool_spiele"`

Format: JSON Arrays

## 🎮 Beispiel-Daten

Beim ersten Start sind folgende Beispieldaten vorgeladen:

**Diagnosen:**
- ADHS (Aufmerksamkeit: 5)
- Demenz (Gedächtnis: 5)
- Schlaganfall (Feinmotorik: 5)

**Spiele:**
- Dobble (Aufmerksamkeit: 5)
- Memory (Gedächtnis: 5)
- Jenga (Feinmotorik: 5)
- Activity (Sozial: 5)
- Halli Galli (Aufmerksamkeit: 5)

## 🧮 Matching-Algorithmus

Der Spielfinder berechnet einen Score basierend auf Ähnlichkeit:

```
Score = Σ (5 - |Spiel_Wert - Diagnose_Wert|) für alle 4 Fähigkeiten
```

Je näher die Werte beieinander liegen, desto höher der Score.

## 📊 Fähigkeitswerte

Die Werte 1-5 repräsentieren:
- **1** = Sehr niedrig
- **3** = Mittel
- **5** = Sehr hoch

Verfügbare Fähigkeiten:
- **Aufmerksamkeit** - Konzentrationsfähigkeit
- **Gedächtnis** - Merkfähigkeit
- **Feinmotorik** - Präzisionsbewegungen
- **Sozial** - Soziale Interaktion

## 💡 Tipps

- **Daten sichern:** Nutze Export-Funktion im Admin-Panel als Backup
- **Daten löschen:** Daten werden nur gelöscht, wenn Sie manuell gelöscht werden
- **Browser wechseln:** Beim Wechsel des Browsers ist ein erneuter Import nötig
- **Private Browsing:** Daten gehen verloren nach dem Schließen des Fensters

## ⚙️ Technologie

- HTML5 + CSS3 + JavaScript (Vanilla)
- Browser localStorage API
- Kein Server erforderlich
- Funktioniert in allen modernen Browsern
