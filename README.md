# Vega-Wortrechner

Öffne nach dem Entpacken die Datei index.html im Browser. Alle zum Rechnen benötigten Dateien liegen im Paket.

## Veröffentlichung unter calculator.singershamrock.com

1. Erstelle bei GitHub im Konto pcus8112 ein öffentliches Repository, beispielsweise vega-calculator. Lade index.html, CNAME, README.md und den Ordner assets direkt ins Hauptverzeichnis des Branches main hoch. Beim Hochladen über die Website kannst du Dateien und Ordner gemeinsam ins Upload-Feld ziehen. Bestätige mit „Commit changes“.
2. Öffne im neuen Repository Settings → Pages. Wähle „Deploy from a branch“, dann main und /(root). Klicke auf Save.
3. Trage unter Custom domain den Namen calculator.singershamrock.com ein und speichere ihn. Wenn er bereits übernommen wurde, überprüfe die Schreibweise.
4. Unter Namecheap → Domain List → Manage → Nameservers siehst du, wer die DNS-Einträge verwaltet. Bei Namecheap BasicDNS, PremiumDNS oder FreeDNS öffnest du dort Advanced DNS → Host Records → Add New Record. Bei Nameservern mit der Endung ns.cloudflare.com öffnest du bei Cloudflare die Zone singershamrock.com und wählst DNS → Records → Add record.
5. Verwende den Typ CNAME, den Host calculator und das Ziel pcus8112.github.io. Die TTL kann auf Automatic bzw. Auto stehen. Bei Cloudflare wählst du DNS only (graue Wolke). Alle Einstellungen beziehen sich ausschließlich auf den neuen Host calculator.
6. Warte unter GitHub → Settings → Pages auf die erfolgreiche DNS-Prüfung und das Zertifikat. Aktiviere Enforce HTTPS und öffne https://calculator.singershamrock.com.

## Funktionstest

Wähle Deutsch, gib im klassischen Modus 3 × 3 ein und drücke =. Es erscheint 9. Reverse dreht die Ziffernfolge 09 zu GO. Darunter steht „gehen“. Schalte bei gedrehter Anzeige auf Français (Canada). Jetzt steht darunter „aller“. Auf Englisch erscheint das Originalwort ohne weitere Übersetzungszeile.

Die neun Rechnungen sind nach Ursprungssprache gruppiert. Das Anklicken einer Aufgabe setzt die Eingabe zurück, aktiviert den klassischen Modus und zeigt die Faktoren zum Selberrechnen an. Für den Vega-Registermodus findest du die ersten Bedienschritte direkt unter dem Rechner.
