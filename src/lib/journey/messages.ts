/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - kunden: firmenname (Firmenname)
 *   - kundenanfragen: kunde (Kunde), eingangsdatum (Eingangsdatum), anfragebeschreibung (Anfragebeschreibung), urspruengliche_kundenanforderungen (Ursprüngliche Kundenanforderungen)
 *   - technischer_abschluss: anfrage (Anfrage (nur ein Abschluss je Anfrage))
 *   - technische_anforderungen: anfrage (Anfrage), bezeichnung (Bezeichnung), beschreibung (Beschreibung)
 *   - informationsquellen: anfrage (Anfrage), titel (Titel)
 *   - offene_punkte: anfrage (Anfrage), kurztitel (Kurztitel), beschreibung (Beschreibung und Grund), verantwortlicher (Verantwortlicher)
 *   - aufgaben: anfrage (Anfrage), titel (Titel), verantwortlicher (Verantwortlicher)
 *   - beurteilungen: anfrage (Anfrage), beurteilungsgegenstand (Beurteilungsgegenstand), fachliche_begruendung (Fachliche Begründung)
 *   - rueckfragen_und_kommunikation: anfrage (Anfrage), betreff (Betreff), inhalt (Inhalt (Entwurf ist kein Versand))
 *   - entscheidungen: anfrage (Anfrage), titel (Titel), entscheidungsgegenstand (Entscheidungsgegenstand), entscheidung (Entscheidung), begruendung (Begründung), entscheidungsverantwortlicher (Entscheidungsverantwortlicher)
 *   - erfahrungen_und_erkenntnisse: ursprungs_anfrage (Ursprüngliche Anfrage), titel (Titel), sachverhalt (Sachverhalt)
 *   - wiederverwendung_von_erfahrungen: erfahrung (Erfahrung), ziel_anfrage (Spätere Anfrage)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "kunden": "strasse" | "hausnummer" | "plz" | "ort" | "branche" | "kundennummer" | "firmenname" | "ansprechpartner_vorname" | "ansprechpartner_nachname" | "e_mail" | "telefon" | "interne_bemerkung" | "aktiv";
  "kundenanfragen": "kunde" | "anfrage_ansprechpartner" | "anfrage_kontakt" | "eingangsdatum" | "eingangskanal" | "kundenreferenz" | "produkt_oder_produktfamilie" | "produktvariante" | "gewuenschte_menge" | "gewuenschter_liefertermin" | "anfragebeschreibung" | "anfragenummer" | "urspruengliche_kundenanforderungen" | "prioritaet" | "verantwortlicher" | "status" | "technischer_klaeraufwand" | "zieltermin_klaerung" | "vollstaendigkeit" | "aktive_bearbeitungszeit_stunden" | "wartezeit_kunde_stunden" | "wartezeit_intern_stunden" | "anzahl_nacharbeiten" | "anzahl_nachtraegliche_aenderungen";
  "technischer_abschluss": "anfrage" | "pruefdatum" | "geprueft_von" | "anforderungen_geprueft" | "kritische_punkte_geklaert" | "erforderliche_entscheidungen_vorhanden" | "erforderliche_freigaben_vorhanden" | "verbleibende_abweichungen" | "verbleibende_risiken" | "offene_restpunkte" | "uebergabeempfaenger" | "uebergabestatus" | "uebergabedatum" | "zusammenfassung" | "freigabestatus";
  "technische_anforderungen": "anfrage" | "bezeichnung" | "beschreibung" | "anforderungstyp" | "ursprung" | "sollwert" | "einheit" | "vergleichsoperator" | "min_wert" | "max_wert" | "ist_pflichtanforderung" | "pruefstatus" | "begruendung_pruefstatus" | "verantwortlicher" | "gueltig_ab" | "gueltig_bis" | "erneute_pruefung_erforderlich" | "grund_erneute_pruefung" | "hauptquelle" | "weitere_quellen";
  "informationsquellen": "ersetzt_quelle" | "anfrage" | "quellentyp" | "titel" | "link_oder_referenz" | "absender_oder_urheber" | "quellendatum" | "eingangsdatum" | "versionskennung" | "quellenstatus" | "inhaltliche_zusammenfassung" | "extraktionsstatus" | "pruefung_durch" | "pruefung_am" | "erneute_pruefung_erforderlich" | "bemerkung";
  "offene_punkte": "betroffene_anforderungen" | "betroffene_quellen" | "anfrage" | "kurztitel" | "beschreibung" | "punktetyp" | "prioritaet" | "auswirkung" | "zustaendige_rolle" | "verantwortlicher" | "faellig_am" | "status" | "erledigungskriterium" | "loesung_oder_ergebnis" | "abgeschlossen_am" | "abschluss_durch" | "erneute_pruefung_erforderlich" | "grund_erneute_pruefung";
  "aufgaben": "anfrage" | "titel" | "beschreibung" | "aufgabentyp" | "verantwortlicher" | "mitwirkende" | "prioritaet" | "status" | "blockierungsgrund" | "faellig_am" | "ergebnis" | "abgeschlossen_am" | "offener_punkt" | "vorgaengeraufgabe";
  "beurteilungen": "betroffene_anforderungen" | "betroffene_offene_punkte" | "zugrunde_liegende_quellen" | "anfrage" | "beurteilungsgegenstand" | "beurteilungsart" | "einschaetzung" | "fachliche_begruendung" | "annahmen" | "unsicherheiten" | "alternativen" | "empfehlung" | "ist_ki_vorschlag" | "erstellt_von" | "erstellt_am" | "pruefstatus" | "geprueft_von" | "geprueft_am" | "erneute_pruefung_erforderlich" | "grund_erneute_pruefung";
  "rueckfragen_und_kommunikation": "anfrage" | "kommunikationstyp" | "kanal" | "absender" | "empfaenger" | "betreff" | "inhalt" | "versandstatus" | "versanddatum" | "antwort_erwartet_bis" | "antwort_erhalten_am" | "antwortstatus" | "notizen" | "offener_punkt" | "weitere_offene_punkte" | "bezieht_sich_auf" | "quelle";
  "entscheidungen": "betroffene_anforderungen" | "betroffene_offene_punkte" | "zugrunde_liegende_beurteilungen" | "ersetzt_durch_entscheidung" | "anfrage" | "titel" | "entscheidungsgegenstand" | "entscheidungstyp" | "alternativen" | "entscheidung" | "begruendung" | "entscheidungsverantwortlicher" | "entscheidungskompetenz_geprueft" | "entscheidungsstatus" | "entscheidungsdatum" | "auflagen" | "gueltig_bis" | "ergebnis";
  "erfahrungen_und_erkenntnisse": "ursprungs_anfrage" | "titel" | "sachverhalt" | "erfahrungstyp" | "produkt_oder_produktfamilie" | "anforderungstyp_suche" | "schlagwoerter" | "urspruengliches_problem" | "vorgehen" | "beobachtetes_ergebnis" | "erkenntnis" | "belegabschluesse" | "gueltigkeitsbedingungen" | "bekannte_grenzen" | "risiko_der_uebertragung" | "bestaetigungsstatus" | "bestaetigt_von" | "bestaetigt_am" | "gueltig_ab" | "gueltig_bis" | "wiederverwendungsstatus" | "kommentar_zur_wiederverwendung" | "belegquellen" | "belegbeurteilungen" | "belegentscheidungen";
  "wiederverwendung_von_erfahrungen": "erfahrung" | "ziel_anfrage" | "abrufdatum" | "abrufgrund" | "aehnlichkeitseinschaetzung" | "kontextunterschiede" | "gueltigkeit_geprueft" | "geprueft_von" | "verwendungsergebnis" | "begruendung" | "beobachteter_nutzen" | "aufwandsersparnis_schaetzung" | "tatsaechliche_aufwandsersparnis" | "negative_folgen" | "bewertet_am";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  kunden: { firmenname: "Bitte den Firmennamen eingeben." },
  kundenanfragen: { kunde: "Bitte einen Kunden auswählen.", eingangsdatum: "Bitte das Eingangsdatum wählen.", anfragebeschreibung: "Bitte die Anfrage kurz beschreiben.", urspruengliche_kundenanforderungen: "Bitte die Kundenanforderungen eintragen." },
  technischer_abschluss: { anfrage: "Bitte eine Anfrage auswählen." },
  technische_anforderungen: { anfrage: "Bitte eine Anfrage auswählen.", bezeichnung: "Bitte eine Bezeichnung eingeben.", beschreibung: "Bitte die Anforderung beschreiben." },
  informationsquellen: { anfrage: "Bitte eine Anfrage auswählen.", titel: "Bitte einen Titel eingeben." },
  offene_punkte: { anfrage: "Bitte eine Anfrage auswählen.", kurztitel: "Bitte einen Kurztitel eingeben.", beschreibung: "Bitte Beschreibung und Grund eintragen.", verantwortlicher: "Bitte einen Verantwortlichen eintragen." },
  aufgaben: { anfrage: "Bitte eine Anfrage auswählen.", titel: "Bitte einen Titel eingeben.", verantwortlicher: "Bitte einen Verantwortlichen eintragen." },
  beurteilungen: { anfrage: "Bitte eine Anfrage auswählen.", beurteilungsgegenstand: "Bitte den Beurteilungsgegenstand eingeben.", fachliche_begruendung: "Bitte die fachliche Begründung eintragen." },
  rueckfragen_und_kommunikation: { anfrage: "Bitte eine Anfrage auswählen.", betreff: "Bitte einen Betreff eingeben.", inhalt: "Bitte den Nachrichtentext eintragen." },
  entscheidungen: { anfrage: "Bitte eine Anfrage auswählen.", titel: "Bitte einen Titel eingeben.", entscheidungsgegenstand: "Bitte den Entscheidungsgegenstand beschreiben.", entscheidung: "Bitte die Entscheidung eintragen.", begruendung: "Bitte die Begründung eintragen.", entscheidungsverantwortlicher: "Bitte den Entscheidungsverantwortlichen eintragen." },
  erfahrungen_und_erkenntnisse: { ursprungs_anfrage: "Bitte die ursprüngliche Anfrage auswählen.", titel: "Bitte einen Titel eingeben.", sachverhalt: "Bitte den Sachverhalt beschreiben." },
  wiederverwendung_von_erfahrungen: { erfahrung: "Bitte eine Erfahrung auswählen.", ziel_anfrage: "Bitte die spätere Anfrage auswählen." },
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
