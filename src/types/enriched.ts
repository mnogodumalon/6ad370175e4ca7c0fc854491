import type { Aufgaben, Beurteilungen, Entscheidungen, ErfahrungenUndErkenntnisse, Informationsquellen, Kundenanfragen, OffenePunkte, RueckfragenUndKommunikation, TechnischeAnforderungen, TechnischerAbschluss, WiederverwendungVonErfahrungen } from './app';

export type EnrichedKundenanfragen = Kundenanfragen & {
  kundeName: string;
};

export type EnrichedTechnischerAbschluss = TechnischerAbschluss & {
  anfrageName: string;
};

export type EnrichedTechnischeAnforderungen = TechnischeAnforderungen & {
  anfrageName: string;
  hauptquelleName: string;
  weitere_quellenName: string;
};

export type EnrichedInformationsquellen = Informationsquellen & {
  ersetzt_quelleName: string;
  anfrageName: string;
};

export type EnrichedOffenePunkte = OffenePunkte & {
  betroffene_anforderungenName: string;
  betroffene_quellenName: string;
  anfrageName: string;
};

export type EnrichedAufgaben = Aufgaben & {
  anfrageName: string;
  offener_punktName: string;
  vorgaengeraufgabeName: string;
};

export type EnrichedBeurteilungen = Beurteilungen & {
  betroffene_anforderungenName: string;
  betroffene_offene_punkteName: string;
  zugrunde_liegende_quellenName: string;
  anfrageName: string;
};

export type EnrichedRueckfragenUndKommunikation = RueckfragenUndKommunikation & {
  anfrageName: string;
  offener_punktName: string;
  weitere_offene_punkteName: string;
  bezieht_sich_aufName: string;
  quelleName: string;
};

export type EnrichedEntscheidungen = Entscheidungen & {
  betroffene_anforderungenName: string;
  betroffene_offene_punkteName: string;
  zugrunde_liegende_beurteilungenName: string;
  ersetzt_durch_entscheidungName: string;
  anfrageName: string;
};

export type EnrichedErfahrungenUndErkenntnisse = ErfahrungenUndErkenntnisse & {
  ursprungs_anfrageName: string;
  belegabschluesseName: string;
  belegquellenName: string;
  belegbeurteilungenName: string;
  belegentscheidungenName: string;
};

export type EnrichedWiederverwendungVonErfahrungen = WiederverwendungVonErfahrungen & {
  erfahrungName: string;
  ziel_anfrageName: string;
};
