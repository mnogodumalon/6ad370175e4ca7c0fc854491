// Auto-generated. Per-entity form-enhancements config for "Kundenanfragen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["anfragenummer", "kunde", {"row": ["eingangsdatum", "eingangskanal"], "cols": "1fr 1fr"}, "anfragebeschreibung", "urspruengliche_kundenanforderungen", {"row": ["status", "prioritaet"], "cols": "1fr 1fr"}, {"row": ["anfrage_ansprechpartner", "anfrage_kontakt"], "cols": "1fr 1fr"}, "kundenreferenz", {"row": ["produkt_oder_produktfamilie", "produktvariante"], "cols": "1fr 1fr"}, {"row": ["gewuenschte_menge", "gewuenschter_liefertermin"], "cols": "1fr 1fr"}, "verantwortlicher", {"row": ["technischer_klaeraufwand", "vollstaendigkeit"], "cols": "1fr 1fr"}, "zieltermin_klaerung", "aktive_bearbeitungszeit_stunden", {"row": ["wartezeit_kunde_stunden", "wartezeit_intern_stunden"], "cols": "1fr 1fr"}, {"row": ["anzahl_nacharbeiten", "anzahl_nachtraegliche_aenderungen"], "cols": "1fr 1fr"}],
  defaults: {
    'eingangsdatum': { kind: 'today' },
    'zieltermin_klaerung': { kind: 'todayOffset', days: 14 },
    'status': { kind: 'lookup', key: 'neu', label: 'Neu' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
