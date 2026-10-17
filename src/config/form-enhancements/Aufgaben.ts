// Auto-generated. Per-entity form-enhancements config for "Aufgaben".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "anfrage", {"row": ["verantwortlicher", "mitwirkende"], "cols": "1fr 1fr"}, {"row": ["aufgabentyp", "prioritaet"], "cols": "1fr 1fr"}, {"row": ["status", "faellig_am"], "cols": "1fr 1fr"}, "offener_punkt", "vorgaengeraufgabe", "abgeschlossen_am", "beschreibung", "blockierungsgrund", "ergebnis"],
  defaults: {
    'status': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'prioritaet': { kind: 'lookup', key: 'normal', label: 'Normal' },
    'faellig_am': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
