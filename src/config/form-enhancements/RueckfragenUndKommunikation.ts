// Auto-generated. Per-entity form-enhancements config for "Rückfragen und Kommunikation".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["anfrage", "betreff", {"row": ["kommunikationstyp", "kanal"], "cols": "1fr 1fr"}, {"row": ["absender", "empfaenger"], "cols": "1fr 1fr"}, {"row": ["versandstatus", "versanddatum"], "cols": "1fr 1fr"}, {"row": ["antwort_erwartet_bis", "antwort_erhalten_am"], "cols": "1fr 1fr"}, "antwortstatus", "offener_punkt", "weitere_offene_punkte", "bezieht_sich_auf", "quelle", "inhalt", "notizen"],
  defaults: {
    'versandstatus': { kind: 'lookup', key: 'entwurf', label: 'Entwurf (nicht versendet)' },
    'antwortstatus': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'antwort_erwartet_bis': { kind: 'todayOffset', days: 3 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
