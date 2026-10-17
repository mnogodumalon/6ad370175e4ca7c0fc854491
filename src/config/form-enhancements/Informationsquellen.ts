// Auto-generated. Per-entity form-enhancements config for "Informationsquellen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "anfrage", {"row": ["quellentyp", "quellenstatus"], "cols": "1fr 1fr"}, "absender_oder_urheber", {"row": ["quellendatum", "eingangsdatum"], "cols": "1fr 1fr"}, "versionskennung", "link_oder_referenz", "ersetzt_quelle", "extraktionsstatus", {"row": ["pruefung_durch", "pruefung_am"], "cols": "1fr 1fr"}, "erneute_pruefung_erforderlich", "inhaltliche_zusammenfassung", "bemerkung"],
  defaults: {
    'eingangsdatum': { kind: 'today', withTime: true },
    'extraktionsstatus': { kind: 'lookup', key: 'nicht_verarbeitet', label: 'Nicht verarbeitet' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
