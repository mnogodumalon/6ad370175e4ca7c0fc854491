/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - kunden: no date pair, no references
 *   - kundenanfragen: applookups kunde→kunden · lookups eingangskanal[email|webformular|telefon|persoenliches_gespraech|bestandskunde|sonstiger_kanal], prioritaet[niedrig|normal|hoch|kritisch], status[neu|in_pruefung|rueckfragen_offen|fachliche_pruefung|entscheidungsbedarf|technisch_geklaert|freigegeben|abgelehnt|zurueckgestellt], technischer_klaeraufwand[klein|mittel|hoch|unbekannt], vollstaendigkeit[ungeprueft|unvollstaendig|in_klaerung|vollstaendig_geprueft]
 *   - technischer_abschluss: applookups anfrage→kundenanfragen · lookups uebergabestatus[nicht_vorbereitet|bereit_zur_uebergabe|uebergeben|zurueckgewiesen], freigabestatus[nicht_freigegeben|freigegeben|freigabe_verweigert|zurueckgestellt]
 *   - technische_anforderungen: applookups anfrage→kundenanfragen, hauptquelle→informationsquellen, weitere_quellen→informationsquellen · lookups anforderungstyp[material|leistung|funktion|schnittstelle|norm|sicherheit|umweltbedingung|qualitaet|abmessung|liefertermin|dokumentation|sonstiges], ursprung[explizite_kundenangabe|kundenunterlage|interne_vorgabe|technische_ableitung|erfahrungswissen|ki_vorschlag], vergleichsoperator[gleich|groesser_als|groesser_gleich|kleiner_als|kleiner_gleich|zwischen], pruefstatus[ungeprueft|zu_pruefen|bestaetigt|unklar|widerspruechlich|nicht_erfuellt|nicht_anwendbar]
 *   - informationsquellen: applookups ersetzt_quelle→informationsquellen, anfrage→kundenanfragen · lookups quellentyp[email|pdf|office_dokument|bild|zeichnung|cad_dokument|webadresse|gespraechsnotiz|erp_datensatz|manuelle_eingabe|sonstige_quelle], quellenstatus[aktuell|ersetzt|ungeprueft|strittig|ungueltig], extraktionsstatus[nicht_verarbeitet|in_bearbeitung|extrahiert|manuell_geprueft|fehler]
 *   - offene_punkte: applookups betroffene_anforderungen→technische_anforderungen, betroffene_quellen→informationsquellen, anfrage→kundenanfragen · lookups punktetyp[fehlende_information|widerspruch|technische_pruefung|normenpruefung|machbarkeit|risiko|rueckfrage|freigabe|sonstiges], prioritaet[niedrig|normal|hoch|kritisch], auswirkung[qualitaet|sicherheit|funktion|kosten|termin|herstellbarkeit|normenkonformitaet|sonstiges], status[neu|zugewiesen|in_bearbeitung|wartet_auf_kunde|wartet_intern|zur_entscheidung|erledigt|entschieden_akzeptiert|nicht_mehr_relevant]
 *   - aufgaben: applookups anfrage→kundenanfragen, offener_punkt→offene_punkte, vorgaengeraufgabe→aufgaben · lookups aufgabentyp[informationspruefung|technische_bewertung|kundenrueckfrage|interne_rueckfrage|normenpruefung|machbarkeitspruefung|dokumentation|entscheidung_vorbereiten|freigabepruefung|sonstiges], prioritaet[niedrig|normal|hoch|kritisch], status[offen|in_bearbeitung|blockiert|wartet_auf_antwort|erledigt|abgebrochen]
 *   - beurteilungen: applookups betroffene_anforderungen→technische_anforderungen, betroffene_offene_punkte→offene_punkte, zugrunde_liegende_quellen→informationsquellen, anfrage→kundenanfragen · lookups beurteilungsart[technische_machbarkeit|vollstaendigkeit|risiko|qualitaet|normenkonformitaet|termin|kostenwirkung|herstellbarkeit|sonstiges], einschaetzung[positiv|bedingt_positiv|negativ|unklar|nicht_anwendbar], pruefstatus[entwurf|fachlich_geprueft|bestaetigt|ueberholt]
 *   - rueckfragen_und_kommunikation: applookups anfrage→kundenanfragen, offener_punkt→offene_punkte, weitere_offene_punkte→offene_punkte, bezieht_sich_auf→rueckfragen_und_kommunikation, quelle→informationsquellen · lookups kommunikationstyp[kundenrueckfrage|interne_anfrage|antwort|information|eskalation|gespraechsprotokoll], kanal[email|telefon|besprechung|chat|persoenliches_gespraech|sonstiges], versandstatus[entwurf|zur_pruefung|freigegeben|versendet|fehlgeschlagen|nicht_erforderlich], antwortstatus[offen|teilweise_beantwortet|beantwortet|unklar|widerspruechlich]
 *   - entscheidungen: applookups betroffene_anforderungen→technische_anforderungen, betroffene_offene_punkte→offene_punkte, zugrunde_liegende_beurteilungen→beurteilungen, ersetzt_durch_entscheidung→entscheidungen, anfrage→kundenanfragen · lookups entscheidungstyp[technische_freigabe|abweichung_akzeptieren|alternative_auswaehlen|anforderung_aendern|risiko_akzeptieren|rueckfrage_abschliessen|ablehnung|eskalation|sonstiges], entscheidungsstatus[vorbereitung|zur_entscheidung|entschieden|zurueckgestellt|ersetzt]
 *   - erfahrungen_und_erkenntnisse: applookups ursprungs_anfrage→kundenanfragen, belegabschluesse→technischer_abschluss, belegquellen→informationsquellen, belegbeurteilungen→beurteilungen, belegentscheidungen→entscheidungen · lookups erfahrungstyp[beobachtung|erfahrung|experiment|wirkung|bewaehrte_vorgehensweise|annahme], risiko_der_uebertragung[niedrig|mittel|hoch|unbekannt], bestaetigungsstatus[ungeprueft|vorlaeufig|fachlich_bestaetigt|wiederholt_bestaetigt|widerlegt|ueberholt], wiederverwendungsstatus[nicht_geprueft|verfuegbar|nur_hinweis|nicht_mehr_verwenden]
 *   - wiederverwendung_von_erfahrungen: applookups erfahrung→erfahrungen_und_erkenntnisse, ziel_anfrage→kundenanfragen · lookups aehnlichkeitseinschaetzung[hoch|mittel|niedrig|unklar], verwendungsergebnis[verwendet|teilweise_verwendet|nicht_verwendet|als_ungeeignet_erkannt]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
