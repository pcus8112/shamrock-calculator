'use strict';

(() => {
  const abs = n => n < 0n ? -n : n;
  function gcd(a, b) {
    a = abs(a);
    b = abs(b);
    while (b) {
      [a, b] = [b, a % b];
    }
    return a || 1n;
  }
  function rational(n, d = 1n) {
    if (!d) throw Error('division');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    return {
      n: n / g,
      d: d / g
    };
  }
  function decimal(s) {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) throw Error('syntax');
    const neg = s[0] === '-';
    s = s.replace(/^[+-]/, '');
    let [a, b = ''] = s.split('.');
    return rational(BigInt((a || '0') + b) * (neg ? -1n : 1n), 10n ** BigInt(b.length));
  }
  function format(a, max = 20) {
    const negative = a.n < 0n,
      n = abs(a.n);
    let whole = (n / a.d).toString(),
      rem = n % a.d,
      frac = '';
    if (whole.length > max) throw Error('overflow');
    while (rem && whole.length + frac.length < max) {
      rem *= 10n;
      frac += (rem / a.d).toString();
      rem %= a.d;
    }
    return {
      text: (negative ? '-' : '') + whole + (frac ? '.' + frac : ''),
      approx: rem !== 0n
    };
  }
  function root(a) {
    if (a.n < 0n) throw Error('root');
    const isqrt = n => {
      if (n < 2n) return n;
      let x = n,
        y = (x + 1n) / 2n;
      while (y < x) {
        x = y;
        y = (x + n / x) / 2n;
      }
      return x;
    };
    const n = isqrt(a.n),
      d = isqrt(a.d);
    if (n * n === a.n && d * d === a.d) return {
      value: rational(n, d),
      approx: false
    };
    const scale = 10n ** 20n;
    return {
      value: rational(isqrt(a.n * scale * scale / a.d), scale),
      approx: true
    };
  }
  const zero = () => rational(0n);
  const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
  const div = (a, b) => rational(a.n * b.d, a.d * b.n);
  const ops = {
    '+': add,
    '−': sub,
    '×': mul,
    '÷': div
  };
  class Vega {
    constructor(mode = 'classic') {
      this.mode = mode;
      this.on = true;
      this.remainderMode = false;
      this.reset();
    }
    reset() {
      this.S = zero();
      this.K = zero();
      this.M = zero();
      this.display = '0';
      this.fresh = true;
      this.pending = null;
      this.last = null;
      this.approx = false;
      this.error = '';
      this.hasOperand = false;
      this.divisionPair = null;
    }
    show(v) {
      const f = format(v);
      this.display = f.text;
      this.approx = f.approx;
      this.fresh = true;
      return v;
    }
    input(v) {
      if (!this.on || this.error) return;
      if (this.fresh && !this.pending) this.last = null;
      let next = this.fresh ? v === '.' ? '0.' : v : this.display + v;
      if (v === '.' && !this.fresh && this.display.includes('.')) return;
      if (next.replace(/[-.]/g, '').length > 20) throw Error('overflow');
      this.K = decimal(next);
      this.display = next;
      this.fresh = false;
      this.approx = false;
      this.hasOperand = true;
      this.divisionPair = null;
    }
    operator(op) {
      if (this.mode === 'vega') {
        if (op === '+') this.S = add(this.S, this.K);
        if (op === '−') this.S = sub(this.S, this.K);
        if (op === '×') {
          this.S = add(this.S, mul(this.K, this.M));
          this.K = zero();
        }
        if (op === '÷') this.S = div(this.S, this.K);
        this.show(this.S);
        this.hasOperand = false;
        return;
      }
      if (this.pending && this.hasOperand) this.S = ops[this.pending](this.S, this.K);else if (!this.pending) this.S = decimal(this.display);
      this.show(this.S);
      this.pending = op;
      this.hasOperand = false;
      this.last = null;
    }
    equals() {
      if (this.mode === 'vega') {
        this.show(this.S);
        return;
      }
      if (this.pending) {
        const b = this.hasOperand ? this.K : this.S;
        this.S = ops[this.pending](this.S, b);
        this.last = {
          op: this.pending,
          b
        };
        this.pending = null;
        this.K = this.S;
        this.hasOperand = false;
        this.show(this.S);
      } else if (this.last) {
        this.S = ops[this.last.op](this.S, this.last.b);
        this.K = this.S;
        this.show(this.S);
      }
    }
    key(k) {
      if (k === 'power') {
        this.on = !this.on;
        this.reset();
        return;
      }
      if (!this.on) return;
      if (k === 'start') {
        this.reset();
        return;
      }
      if (k === 'СС') {
        this.S = zero();
        this.pending = null;
        this.last = null;
        this.error = '';
        this.show(this.S);
        if (this.mode === 'classic') this.K = zero();
        this.hasOperand = false;
        return;
      }
      if (this.error) return;
      if (ops[k]) {
        this.operator(k);
        return;
      }
      if (k === 'equals') {
        this.equals();
        return;
      }
      if (k === 'РС') {
        let t = this.display.slice(0, -1);
        if (!t || t === '-') t = '0';
        this.display = t;
        this.K = decimal(t);
        this.fresh = false;
        this.hasOperand = true;
        this.approx = false;
        return;
      }
      if (k === 'sign') {
        this.K = rational(-this.K.n, this.K.d);
        this.display = this.display.startsWith('-') ? this.display.slice(1) : '-' + this.display;
        this.fresh = false;
        this.hasOperand = true;
        return;
      }
      if (k === '√') {
        const original = this.K,
          r = root(original);
        this.S = r.value;
        this.show(this.S);
        this.approx ||= r.approx;
        this.pending = null;
        this.last = null;
        if (this.mode === 'vega') {
          this.M = original;
          this.K = decimal('2');
        } else this.K = this.S;
        return;
      }
      if (k === 'КМ') {
        this.M = this.K;
        this.fresh = true;
        return;
      }
      if (k === 'МК') {
        this.K = this.M;
        this.show(this.K);
        this.hasOperand = true;
        return;
      }
      if (k === 'СК') {
        this.K = this.S;
        this.show(this.K);
        this.hasOperand = true;
        return;
      }
      if (k === 'МС') {
        this.S = this.M;
        this.show(this.S);
        return;
      }
      if (k === 'ДК') {
        this.show(this.K);
        return;
      }
      if (k === 'ДС') {
        if (this.mode === 'classic' && this.pending) this.equals();else this.show(this.S);
        return;
      }
      if (k === 'ПД') {
        const p = mul(this.K, this.M);
        this.S = rational(p.n / p.d);
        this.K = sub(p, this.S);
        this.show(this.S);
        return;
      }
      if (k === '÷Ц') {
        const q = div(this.S, this.K);
        const whole = rational(q.n / q.d);
        const rem = sub(this.S, mul(whole, this.K));
        this.S = whole;
        this.divisionPair = {
          q: whole,
          r: rem
        };
        this.show(this.remainderMode ? rem : whole);
        return;
      }
      if (k === 'remainder') {
        this.remainderMode = !this.remainderMode;
        if (this.divisionPair) this.show(this.remainderMode ? this.divisionPair.r : this.divisionPair.q);
        return;
      }
    }
  }
  const entries = [{
    "code": "345",
    "word": "SHE",
    "origin": "en",
    "factors": [3, 5, 23],
    "en": "she",
    "fr": "elle",
    "de": "sie"
  }, {
    "code": "09",
    "word": "GO",
    "origin": "en",
    "factors": [3, 3],
    "en": "go",
    "fr": "aller",
    "de": "gehen"
  }, {
    "code": "918",
    "word": "BIG",
    "origin": "en",
    "factors": [2, 3, 3, 3, 17],
    "en": "big",
    "fr": "grand / grande",
    "de": "groß"
  }, {
    "code": "3773",
    "word": "ELLE",
    "origin": "fr",
    "factors": [7, 7, 7, 11],
    "en": "she",
    "fr": "elle",
    "de": "sie"
  }, {
    "code": "15",
    "word": "SI",
    "origin": "fr",
    "factors": [3, 5],
    "en": "if",
    "fr": "si",
    "de": "wenn"
  }, {
    "code": "735",
    "word": "SEL",
    "origin": "fr",
    "factors": [3, 5, 7, 7],
    "en": "salt",
    "fr": "sel",
    "de": "Salz"
  }, {
    "code": "315",
    "word": "SIE",
    "origin": "de",
    "factors": [3, 3, 5, 7],
    "en": "she",
    "fr": "elle",
    "de": "sie"
  }, {
    "code": "05",
    "word": "SO",
    "origin": "de",
    "factors": [5],
    "en": "so",
    "fr": "ainsi",
    "de": "so"
  }, {
    "code": "513",
    "word": "EIS",
    "origin": "de",
    "factors": [3, 3, 3, 19],
    "en": "ice",
    "fr": "glace",
    "de": "Eis"
  }];
  const dictionary = new Map(entries.map(entry => [entry.code, entry]));
  const $ = s => document.querySelector(s);
  const copy = {
    de: {
      eyebrow: 'DIE MAGIE EINER ANDEREN PERSPEKTIVE',
      heading: 'Zahlen. Auf den Kopf gestellt.',
      intro: 'Rechne, drehe die Anzeige und entdecke die Wörter dahinter.',
      edition: 'FREIE NACHGESTALTUNG',
      reverse: 'Reverse · Anzeige drehen',
      discovery: 'DAS WORT HINTER DER ZAHL',
      emptyTitle: 'Ein kleiner Perspektivwechsel.',
      emptyText: 'Drücke nach deiner Rechnung auf Reverse. Bekannte Wörter erscheinen hier mit ihren Übersetzetzungen.'.replace('Übersetzetzungen', 'Übersetzungen'),
      dictionaryNote: 'Vorschau mit 9 gespeicherten Zahlencodes. Unbekannte Zahlen lassen sich ebenfalls drehen.',
      try: 'PROBIER ES AUS',
      padding: 'Mindestanzahl Ziffern',
      paddingHint: 'Für Wörter mit führenden Nullen.',
      keyboardHelp: 'Auch mit Tastatur: Enter = Ergebnis · R = Reverse · Esc = Löschen',
      historyTitle: 'Die historische Inspiration',
      manual: 'Technische Dokumentation des Vega (1970) ↗',
      footer: 'Rechnen. Entdecken. Verstehen.',
      unknown: 'Noch kein Wörterbucheintrag.',
      unknownText: 'Diese Ziffern lassen sich drehen, sind aber nicht in dieser Wortliste gespeichert.',
      errors: {
        division: 'Division durch null',
        syntax: 'Eingabe prüfen',
        limit: 'Eingabe zu lang',
        overflow: 'Mehr als 20 Stellen',
        power: 'Ganzzahliger Exponent von −100 bis 100',
        root: 'Keine reelle Wurzel'
      },
      history: 'Der sowjetische Tischrechner Vega (Вега), ab 1964 in Serie gefertigt, gehört zu den frühesten belegten Rechnern mit Sieben-Segment-Anzeige. Entwickelt wurde er von einem Team um W. B. Marachowski, E. A. Kanewski und G. I. Menderskaja in Leningrad. Tastenanordnung und kyrillische Legenden folgen Abbildung 20 der technischen Dokumentation von 1970. Die beige Gestaltung, der Stern und die Beschriftung von 2026 sind Gestaltungsvorgaben dieses Nachbaus. Klassische Eingabe, Reverse und Wörterbuch sind moderne Ergänzungen. Der Registermodus bildet die dokumentierten Grundoperationen nach; eine vollständige Hardware-Emulation ist dies nicht.'
    },
    en: {
      eyebrow: 'THE MAGIC OF A DIFFERENT PERSPECTIVE',
      heading: 'Numbers. Turned into discoveries.',
      intro: 'Calculate, turn the display and discover the words within.',
      edition: 'FREE REINTERPRETATION',
      reverse: 'Reverse · Turn the display',
      discovery: 'THE WORD BEHIND THE NUMBER',
      emptyTitle: 'A little change of perspective.',
      emptyText: 'Press Reverse after your calculation. Recognised words appear here with their translations.',
      dictionaryNote: 'Preview with 9 stored number codes. You can turn other numbers too.',
      try: 'GIVE IT A TRY',
      padding: 'Minimum digit count',
      paddingHint: 'For words with leading zeroes.',
      keyboardHelp: 'Keyboard: Enter = result · R = Reverse · Esc = clear',
      historyTitle: 'The historical inspiration',
      manual: 'Vega technical documentation (1970) ↗',
      footer: 'Calculate. Discover. Understand.',
      unknown: 'No dictionary entry yet.',
      unknownText: 'You can turn these digits, but they are not in this word list.',
      errors: {
        division: 'Cannot divide by zero',
        syntax: 'Check your expression',
        limit: 'Expression too long',
        overflow: 'More than 20 digits',
        power: 'Integer exponent from −100 to 100',
        root: 'No real square root'
      },
      history: 'The Soviet Vega (Вега) desktop calculator, produced in series from 1964, is among the earliest documented calculators with a seven-segment display. It was developed in Leningrad by a team including V. B. Marakhovsky, E. A. Kanevsky and G. I. Menderskaya. Key positions and Cyrillic legends follow figure 20 of the 1970 technical documentation. The beige finish, star and 2026 inscription belong to this reproduction. Classic entry, Reverse and the dictionary are modern additions. Register mode models the documented basic operations; this is not a complete hardware emulator.'
    },
    fr: {
      eyebrow: 'LA MAGIE D’UN AUTRE POINT DE VUE',
      heading: 'Les chiffres changent de sens.',
      intro: 'Calculez, retournez l’affichage et découvrez les mots cachés.',
      edition: 'RÉINTERPRÉTATION LIBRE',
      reverse: 'Reverse · Retourner l’affichage',
      discovery: 'LE MOT DERRIÈRE LE NOMBRE',
      emptyTitle: 'Un petit changement de perspective.',
      emptyText: 'Appuyez sur Reverse après le calcul. Les mots reconnus apparaîtront ici avec leurs traductions.',
      dictionaryNote: 'Aperçu avec 9 codes enregistrés. Les autres nombres peuvent aussi être retournés.',
      try: 'À VOUS DE JOUER',
      padding: 'Nombre minimal de chiffres',
      paddingHint: 'Pour les mots commençant par des zéros.',
      keyboardHelp: 'Clavier : Entrée = résultat · R = Reverse · Échap = effacer',
      historyTitle: 'L’inspiration historique',
      manual: 'Documentation technique de Vega (1970) ↗',
      footer: 'Calculer. Découvrir. Comprendre.',
      unknown: 'Aucune entrée pour le moment.',
      unknownText: 'Ces chiffres peuvent être retournés, mais ne figurent pas dans ce lexique.',
      errors: {
        division: 'Division par zéro',
        syntax: 'Vérifiez la saisie',
        limit: 'Saisie trop longue',
        overflow: 'Plus de 20 chiffres',
        power: 'Exposant entier de −100 à 100',
        root: 'Pas de racine réelle'
      },
      history: 'La calculatrice de bureau soviétique Vega (Вега), produite en série dès 1964, compte parmi les premières calculatrices documentées à affichage à sept segments. Elle a été développée à Leningrad par une équipe comprenant V. B. Marakhovski, E. A. Kanevski et G. I. Menderskaïa. La disposition des touches et leurs légendes suivent la figure 20 de la documentation technique de 1970. La finition beige, l’étoile et la mention 2026 appartiennent à cette reproduction. La saisie classique, Reverse et le lexique sont des ajouts modernes. Le mode registres reproduit les opérations de base documentées, sans émuler tout le matériel.'
    }
  };
  Object.assign(copy.de, {
    modeLabel: 'Rechenweise',
    classic: 'Klassisch',
    registers: 'Vega-Register',
    classicNote: 'Klassisch: Zahl → Rechenzeichen → Zahl → =. ДС zeigt das Ergebnis. Die nächste Ziffer beginnt eine neue Eingabe.',
    registerNote: 'Vega-Register: К = Eingabe, М = Multiplikator, С = Summe. Beispiel: 3 КМ → 5 × → 15. Enter / ДС zeigt С. Пуск setzt alles zurück.'
  });
  Object.assign(copy.en, {
    modeLabel: 'Calculation mode',
    classic: 'Classic',
    registers: 'Vega registers',
    classicNote: 'Classic: number → operator → number → =. ДС shows the result. The next digit starts a fresh entry.',
    registerNote: 'Vega registers: К = entry, М = multiplier, С = sum. Example: 3 КМ → 5 × → 15. Enter / ДС displays С. Пуск resets all registers.'
  });
  Object.assign(copy.fr, {
    modeLabel: 'Mode de calcul',
    classic: 'Classique',
    registers: 'Registres Vega',
    classicNote: 'Classique : nombre → opération → nombre → =. ДС affiche le résultat. Le chiffre suivant commence une nouvelle saisie.',
    registerNote: 'Registres Vega : К = saisie, М = multiplicateur, С = somme. Exemple : 3 КМ → 5 × → 15. Entrée / ДС affiche С. Пуск remet tout à zéro.'
  });
  Object.assign(copy.en, {
    "heading": "Vega Word Calculator",
    "intro": "Three languages. Three calculations. One meaning.",
    "try": "Nine word puzzles",
    "exerciseHint": "Choose a calculation, enter its factors, then press Reverse.",
    "emptyText": "Press Reverse to reveal the word.",
    "dictionaryNote": "For 9 and 5, Reverse adds the leading zero.",
    "translation": "Word translation",
    "equals": "Result",
    "language": "Language"
  });
  Object.assign(copy.fr, {
    "heading": "Calculatrice de mots Vega",
    "intro": "Trois langues. Trois calculs. Un même sens.",
    "try": "Neuf calculs à décoder",
    "exerciseHint": "Choisissez un calcul, entrez ses facteurs, puis appuyez sur Reverse.",
    "emptyText": "Appuyez sur Reverse pour révéler le mot.",
    "dictionaryNote": "Pour 9 et 5, Reverse ajoute le zéro initial.",
    "translation": "Traduction du mot",
    "equals": "Résultat",
    "language": "Langue"
  });
  Object.assign(copy.de, {
    "heading": "Vega-Wortrechner",
    "intro": "Drei Sprachen. Drei Rechnungen. Eine Bedeutung.",
    "try": "Neun Wortrechnungen",
    "exerciseHint": "Wähle eine Rechnung, gib die Faktoren ein und drücke Reverse.",
    "emptyText": "Drücke Reverse, um das Wort zu entdecken.",
    "dictionaryNote": "Bei 9 und 5 ergänzt Reverse die führende Null.",
    "translation": "Wortübersetzung",
    "equals": "Ergebnis",
    "language": "Sprache"
  });
  let lang = 'de',
    turned = false,
    approx = false,
    error = '';
  const machine = new Vega();
  const segs = {
    0: 'abcdef',
    1: 'bc',
    2: 'abdeg',
    3: 'abcdg',
    4: 'bcfg',
    5: 'acdfg',
    6: 'acdefg',
    7: 'abc',
    8: 'abcdefg',
    9: 'abcdfg',
    '-': 'g',
    E: 'adefg'
  };
  // Thin electroluminescent bars. Inactive segments are not drawn at all.
  const shapes = {
    a: '7,3 28,3 30,5 28,7 7,7 5,5',
    b: '29,8 32,6 32,30 29,33 28,30 28,10',
    c: '29,37 32,40 32,64 29,67 28,64 28,40',
    d: '7,67 27,67 29,69 27,71 7,71 5,69',
    e: '3,37 6,40 6,64 3,67 2,64 2,40',
    f: '3,8 6,10 6,30 3,33 2,30 2,10',
    g: '7,34 27,34 29,36 27,38 7,38 5,36'
  };
  function shown() {
    const value = machine.display;
    if (!/^\d+$/.test(value)) return value;
    const minWidth = Number($('#padding').value) || 1;
    const autoWidth = turned && !machine.approx && (value === '9' || value === '5') ? 2 : 1;
    return value.padStart(Math.max(minWidth, autoWidth), '0');
  }
  function renderDigits() {
    approx = machine.approx;
    error = machine.error;
    const s = error ? 'E' : shown();
    $('#digits').replaceChildren();
    if (machine.on) for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if (char === '.') continue;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 40 76');
      svg.classList.add('digit');
      for (const key of segs[char] || '') {
        const poly = document.createElementNS(svg.namespaceURI, 'polygon');
        poly.setAttribute('points', shapes[key]);
        poly.setAttribute('class', 'segment on');
        svg.append(poly);
      }
      if (s[i + 1] === '.') {
        const dot = document.createElementNS(svg.namespaceURI, 'circle');
        dot.setAttribute('cx', '37');
        dot.setAttribute('cy', '69');
        dot.setAttribute('r', '2');
        dot.setAttribute('class', 'decimal');
        svg.append(dot);
      }
      $('#digits').append(svg);
    }
    $('#digits').classList.toggle('rotated', turned);
    $('#accessible-display').textContent = machine.on ? error ? copy[lang].errors[error] || error : s : '—';
    $('#approx').textContent = machine.on && approx ? 'П' : '';
    $('#error').textContent = error ? copy[lang].errors[error] || error : '';
    $('#reverse').setAttribute('aria-pressed', String(turned));
    $('.instrument').classList.toggle('off', !machine.on);
    $('[data-key="power"]').setAttribute('aria-pressed', String(machine.on));
    $('[data-key="remainder"]').setAttribute('aria-pressed', String(machine.remainderMode));
    $('#equals').hidden = machine.mode === 'vega';
    renderWord();
  }
  function element(tag, text, cls) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function renderWord() {
    const c = copy[lang],
      box = $('#word-content');
    box.replaceChildren();
    if (!turned || error) {
      box.append(element('div', '↻', 'empty-symbol'), element('h2', c.emptyTitle), element('p', c.emptyText));
      return;
    }
    const word = approx ? null : dictionary.get(shown());
    if (!word) {
      box.append(element('h2', c.unknown), element('p', c.unknownText));
      return;
    }
    const title = element('div', word.word, 'word-big');
    title.lang = locale[word.origin];
    box.append(title, element('div', names[word.origin], 'word-origin'));
    if (word.origin !== lang) {
      const translation = element('dl', '', 'translations');
      const row = element('div', '');
      row.append(element('dt', lang === 'fr' ? 'FR-CA' : lang.toUpperCase()), element('dd', word[lang]));
      translation.append(row);
      box.append(translation);
    }
  }
  const names = {
    en: 'English',
    fr: 'Français (Canada)',
    de: 'Deutsch'
  };
  const locale = {
    en: 'en',
    fr: 'fr-CA',
    de: 'de'
  };
  function buildExercises() {
    for (const origin of ['en', 'fr', 'de']) {
      const group = element('section', '');
      group.append(element('h3', names[origin]));
      for (const entry of entries.filter(item => item.origin === origin)) {
        const button = element('button', '');
        button.dataset.exercise = entry.code;
        button.setAttribute('aria-pressed', 'false');
        button.append(element('span', entry.factors.join(' × ')), element('span', '↗'));
        button.addEventListener('click', () => {
          machine.mode = 'classic';
          machine.on = true;
          machine.reset();
          turned = false;
          $('#operation-mode').value = 'classic';
          $('#padding').value = '1';
          document.querySelectorAll('[data-exercise]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
          setLang(lang);
          const prompt = $('#active-exercise');
          prompt.hidden = false;
          prompt.textContent = entry.factors.join(' × ') + ' → Reverse';
          prompt.scrollIntoView({
            block: 'start'
          });
        });
        group.append(button);
      }
      $('#exercises').append(group);
    }
  }
  function setLang(l) {
    lang = l;
    document.documentElement.lang = locale[l];
    document.title = copy[l].heading + ' · Singer Shamrock';
    $('#equals').setAttribute('aria-label', copy[l].equals);
    $('nav').setAttribute('aria-label', copy[l].language);
    $('.instrument').setAttribute('aria-label', copy[l].heading);
    $('#padding').setAttribute('aria-label', copy[l].padding);
    try {
      localStorage.setItem('vega-language', l);
    } catch {}
    document.querySelectorAll('[data-t]').forEach(el => el.textContent = copy[l][el.dataset.t]);
    document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === l)));
    $('#history-copy').textContent = copy[l].history;
    $('#mode-note').textContent = copy[l][machine.mode === 'classic' ? 'classicNote' : 'registerNote'];
    renderDigits();
  }
  function press(k) {
    try {
      if (k === 'reverse') {
        if (!machine.on || machine.error) return;
        if (!turned && machine.pending) machine.equals();
        turned = !turned;
      } else {
        turned = false;
        if (/^\d+$/.test(k) || k === '.') machine.input(k);else machine.key(k);
      }
    } catch (e) {
      machine.error = e.message;
    }
    renderDigits();
  }
  for (let i = 1; i <= 20; i++) {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = i;
    $('#padding').append(o);
  }
  $('#padding').addEventListener('change', renderDigits);
  document.querySelectorAll('[data-key]').forEach(b => b.addEventListener('click', () => press(b.dataset.key)));
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#operation-mode').addEventListener('change', e => {
    machine.mode = e.target.value;
    machine.reset();
    $('#active-exercise').hidden = true;
    document.querySelectorAll('[data-exercise]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    turned = false;
    setLang(lang);
  });
  $('#reverse').addEventListener('click', () => press('reverse'));
  $('#equals').addEventListener('click', () => press('equals'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('button, summary, a') || e.target.tagName === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
    const map = {
      Enter: 'equals',
      '=': 'equals',
      Escape: 'start',
      Backspace: 'РС',
      r: 'reverse',
      R: 'reverse',
      '*': '×',
      '/': '÷',
      '-': '−',
      ',': '.'
    };
    const k = map[e.key] || e.key;
    if (map[e.key] || /^[\d.+]$/.test(k)) {
      e.preventDefault();
      press(k);
    }
  });
  buildExercises();
  let preferred = (navigator.language || 'en').slice(0, 2);
  try {
    preferred = localStorage.getItem('vega-language') || preferred;
  } catch {}
  setLang(Object.hasOwn(copy, preferred) ? preferred : 'en');
})();
