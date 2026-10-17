// Auto-generated. Per-entity form-enhancements config for "Technische Anforderungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", "anfrage", {"row": ["anforderungstyp", "ursprung"], "cols": "1fr 1fr"}, {"row": ["sollwert", "einheit"], "cols": "2fr 1fr"}, "vergleichsoperator", {"row": ["min_wert", "max_wert"], "cols": "1fr 1fr"}, "pruefstatus", "verantwortlicher", {"row": ["gueltig_ab", "gueltig_bis"], "cols": "1fr 1fr"}, "hauptquelle", "weitere_quellen", "ist_pflichtanforderung", "erneute_pruefung_erforderlich", "beschreibung", "begruendung_pruefstatus", "grund_erneute_pruefung"],
  defaults: {
    'gueltig_ab': { kind: 'today' },
    'pruefstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
