# Informationsvisualisierung: Google Trends im Kontext von Corona

Dieses Projekt ist Teil des Moduls Informationsvisualisierungen und untersucht, wie Suchanfragen im Zeitverlauf variieren und wie sich außergewöhnliche Ereignisse wie die COVID-19-Pandemie auf das Suchverhalten auswirken. Dazu werden Google-Trends-Daten mit einer 3D-Visualisierung kombiniert und in Bezug zu Corona-Referenzdaten gesetzt.

## Welche Daten sind visualisiert worden?

Die Visualisierung basiert auf zwei Datenquellen:

- Google Trends-Daten, abgerufen über die Python-Bibliothek pytrends
- Corona-Referenzdaten aus dem Datensatz in data/COVID_Germany_weekly_2018_2022.csv

Die analysierten Themenbereiche umfassen unter anderem:

- saisonale Themen wie Sonnenschutz, Eiscreme, heiße Schokolade und Weihnachten
- mentale Gesundheit und Wohlbefinden
- Arbeit und Homeoffice
- Selbstoptimierung und Vorsätze
- Shopping und Alltag
- Reisen und Freizeit
- Unterhaltung und Streaming

## Warum?

Ziel des Projekts ist es, Muster im Suchverhalten sichtbar zu machen. Besonders interessant sind:

- saisonale und zyklische Trends
- langfristige Veränderungen im Interesse an bestimmten Themen
- plötzliche Verschiebungen durch die COVID-19-Pandemie

Die Visualisierung soll helfen, Zusammenhänge zwischen gesellschaftlichen Ereignissen und digitalen Suchinteressen zu erkennen.

## Wie sind die Daten gemappt worden?

Die Google-Trends-Werte werden als zeitliche Zeitreihen dargestellt. In der interaktiven 3D-Ansicht werden die einzelnen Themen als Säulen abgebildet:

- die Höhe einer Säule repräsentiert den Suchinteresse-Wert
- unterschiedliche Farben markieren verschiedene Themenbereiche
- ein Zeit-Schieberegler steuert den betrachteten Zeitpunkt
- die Corona-Intensität beeinflusst visuelle Elemente wie Licht, Ringeffekte und Hintergrundfarbe
- saisonale Muster werden über warme bzw. kalte Beleuchtung und saisonale Zustände sichtbar gemacht

Damit werden quantitative Trends nicht nur als Linie, sondern räumlich und in einem thematischen Kontext dargestellt.

## Wie ist die Interaktion?

Die Visualisierung kann direkt im Browser interaktiv erkundet werden. Zu den Funktionen gehören:

- Verschieben der Zeitachse über einen Slider
- Abspielen der Zeitreihen mit Play/Pause
- Auswahl verschiedener Themen-Datensätze
- Aktivieren oder Deaktivieren saisonaler Effekte
- Betrachtung der Legende und der aktuellen Werte

Eine freie Suche oder ein Filter nach Einzelbegriffen ist in der aktuellen Version nicht als eigenständige Suchfunktion umgesetzt; stattdessen wird über die Datensatz-Auswahl und die Zeitsteuerung navigiert.

## XR

Eine XR-Umsetzung ist aktuell nicht Teil der Visualisierung. Das Projekt ist als browserbasierte 3D-Interaktion umgesetzt und kann als Grundlage für spätere immersive Erweiterungen dienen.

## Lokale Ausführung

Für die Ausführung werden Python- und Web-Abhängigkeiten benötigt.

```bash
pip install -r requirements.txt
```

Anschließend kann die Visualisierung lokal über einen einfachen Webserver geöffnet werden, zum Beispiel:

```bash
python -m http.server 8000
```

Danach im Browser unter http://localhost:8000/ öffnen.

Pages link: https://dominikdenner.github.io/infovis/
