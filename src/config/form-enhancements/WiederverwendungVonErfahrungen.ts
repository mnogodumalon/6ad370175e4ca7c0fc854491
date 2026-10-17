// Auto-generated. Per-entity form-enhancements config for "Wiederverwendung von Erfahrungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["erfahrung", "ziel_anfrage", {"row": ["abrufdatum", "aehnlichkeitseinschaetzung"], "cols": "1fr 1fr"}, {"row": ["gueltigkeit_geprueft", "geprueft_von"], "cols": "1fr 2fr"}, {"row": ["verwendungsergebnis", "bewertet_am"], "cols": "1fr 1fr"}, {"row": ["aufwandsersparnis_schaetzung", "tatsaechliche_aufwandsersparnis"], "cols": "1fr 1fr"}, "abrufgrund", "kontextunterschiede", "begruendung", "beobachteter_nutzen", "negative_folgen"],
  defaults: {
    'abrufdatum': { kind: 'today', withTime: true },
    'bewertet_am': { kind: 'today' },
  },
  computed: {},
  numberFields: {
    'aufwandsersparnis_schaetzung': { allowNegative: true },
    'tatsaechliche_aufwandsersparnis': { allowNegative: true },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
