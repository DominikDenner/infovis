# Informationsvisualisierung: Google Trends im Kontext von Corona

**Pages link**: https://dominikdenner.github.io/infovis/

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

## EEG-Analyse

Die folgende Auswertung fasst die EEG-Phasen der Testaufnahme in Bezug auf Alpha- und Beta-Aktivität zusammen. Ziel ist es, die Abschnitte mit eher ruhiger Wahrnehmung und solche mit stärkerer kognitiver Belastung oder Aufmerksamkeit voneinander abzugrenzen.

**Kurzüberblick der Segmente mit Alpha-/Beta-Einschätzung:**

1. Segment 1 (30-150): Das Bild wird betrachtet und zunächst ein Datensatz ausgewählt. Alpha liegt mit 30.15% deutlich über Beta mit 18.84% – die Daten stützen hier die Einschätzung einer eher ruhigen, kontrollierten Wahrnehmung.
2. Segment 2 (150-630): Es folgt eine längere Phase der Datensatz-Auswahl und des Abspielens der Sequenz. Alpha bleibt mit 27.98% dominant, Beta liegt bei 18.98% – gegenüber Segment 1 praktisch unverändert, ein deutlicher Beta-Anstieg lässt sich in den Daten nicht bestätigen.
3. Segment 3 (660-850): In diesem Abschnitt wird ein anderer Datensatz ausgewählt und ähnlich analysiert. Beta legt leicht auf 22.08% zu, bleibt aber weiterhin unter Alpha (30.52%) – die zielgerichtete Auswahl- und Analysephase zeigt sich also nicht als Beta-dominant.
4. Segment 4 (970-1329): Dieses kurze Segment lässt sich am ehesten mit der Erklärung der Aufgabe nach dem Start in Verbindung bringen. Hier steigt zwar Beta auf 21.53%, gleichzeitig steigt aber auch Alpha auf den höchsten Wert aller Segmente (33.75%) – von "besonders starker Beta-Aktivität" kann bei diesen Zahlen nicht die Rede sein.

**Allgemein**: Ein wesentlicher Einschränkungsfaktor ist die fehlende Audiospur der bereitgestellten Aufnahme. Dadurch ist die Zuordnung einzelner Handlungen zu den EEG-Signalen nur teilweise zuverlässig. Zusätzlich zeigen die Min-/Max-/Mittelwert-Tabellen pro Wavetype über alle Segmente hinweg nahezu identische Mittelwerte (~32.700–33.000), da diese Rohwerte im Wesentlichen die Signal-Baseline widerspiegeln und nicht direkt zwischen den Wavetypes unterscheiden; die eigentliche Differenzierung liegt in den prozentualen Anteilen, nicht in der Signalamplitude.

**Fazit**: Über alle vier Segmente hinweg liegt der Alpha-Anteil durchgehend über dem Beta-Anteil, auch in den Phasen, die inhaltlich mit aktiver Auswahl, Analyse und Erklärung verbunden sind. Die erwartete Verschiebung hin zu stärkerer Beta-Aktivität in kognitiv anspruchsvolleren Abschnitten zeigt sich in den Daten nicht; stattdessen steigen Alpha- und Beta-Anteil in den späteren Segmenten leicht gemeinsam an, auf Kosten der nicht eindeutig zugeordneten Anteile (Wavetype 0). Die Aussagekraft bleibt durch die fehlende Audio- und Kontextinformation sowie durch die eher grobe, schwellenwertbasierte Wavetype-Klassifizierung eingeschränkt.

**Zusätzliche Statistik pro Segment und Wavetype**:

Kurz erklärt: Wavetype 1 entspricht Alpha-Wellen (ruhiger, entspannter Zustand), Wavetype 2 entspricht Beta-Wellen (aktive Konzentration bis Stress), während Wavetype 0 die übrigen bzw. nicht eindeutig zugeordneten Anteile beschreibt. Min/Max/Mittelwert beziehen sich auf die geglätteten Rohwerte (`smoothed_values` aus `eeg_tests/data/df_frontal.csv`).

**Wavetype 0**

| Segment              |       Min |       Max | Mittelwert |
| -------------------- | --------: | --------: | ---------: |
| Segment 1 (30-150)   |  7263.889 | 55126.641 |  32917.942 |
| Segment 2 (150-630)  |  3285.009 | 55090.135 |  32688.496 |
| Segment 3 (660-850)  | 13915.014 | 48983.282 |  33027.717 |
| Segment 4 (970-1329) |  -697.006 | 66937.499 |  32897.195 |

**Wavetype 1**

| Segment              |       Min |       Max | Mittelwert |
| -------------------- | --------: | --------: | ---------: |
| Segment 1 (30-150)   |  2335.169 | 53689.733 |  32529.628 |
| Segment 2 (150-630)  |  -146.177 | 54982.376 |  32974.981 |
| Segment 3 (660-850)  |  -105.444 | 51123.894 |  32652.136 |
| Segment 4 (970-1329) | -6760.770 | 69352.707 |  32809.180 |

**Wavetype 2**

| Segment              |      Min |       Max | Mittelwert |
| -------------------- | -------: | --------: | ---------: |
| Segment 1 (30-150)   | 8789.779 | 54528.995 |  32790.503 |
| Segment 2 (150-630)  | 8584.062 | 54374.043 |  32886.380 |
| Segment 3 (660-850)  | 9141.911 | 52530.348 |  32617.787 |
| Segment 4 (970-1329) | 6521.999 | 66384.187 |  32729.012 |

**Prozentuale Anteile pro Segment**

| Segment              | Wavetype 0 | Wavetype 1 | Wavetype 2 |
| -------------------- | ---------: | ---------: | ---------: |
| Segment 1 (30-150)   |     51.01% |     30.15% |     18.84% |
| Segment 2 (150-630)  |     53.04% |     27.98% |     18.98% |
| Segment 3 (660-850)  |     47.40% |     30.52% |     22.08% |
| Segment 4 (970-1329) |     44.72% |     33.75% |     21.53% |
