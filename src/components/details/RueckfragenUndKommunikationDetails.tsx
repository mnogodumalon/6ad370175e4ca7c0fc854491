import type { RueckfragenUndKommunikation, Kundenanfragen, OffenePunkte, Informationsquellen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { usePermissions } from '@/lib/permissions';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface RueckfragenUndKommunikationDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: RueckfragenUndKommunikation;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** N:1-Ziel „OffenePunkte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  offenePunkteList: OffenePunkte[];
  /** Klick auf die OffenePunkte-Relation → overlay.push auf dessen Detail. */
  onOpenOffenePunkte?: (record: OffenePunkte) => void;
  /** N:1-Ziel „RueckfragenUndKommunikation": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  rueckfragenUndKommunikationList: RueckfragenUndKommunikation[];
  /** Klick auf die RueckfragenUndKommunikation-Relation → overlay.push auf dessen Detail. */
  onOpenRueckfragenUndKommunikation?: (record: RueckfragenUndKommunikation) => void;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Klick auf die Informationsquellen-Relation → overlay.push auf dessen Detail. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
}

export function RueckfragenUndKommunikationDetails({
  record,
  kundenanfragenList,
  onOpenKundenanfragen,
  offenePunkteList,
  onOpenOffenePunkte,
  rueckfragenUndKommunikationList,
  onOpenRueckfragenUndKommunikation,
  informationsquellenList,
  onOpenInformationsquellen,
}: RueckfragenUndKommunikationDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  const offener_punktTarget = offenePunkteList.find(r => r.record_id === extractRecordId(record.fields.offener_punkt));
  const bezieht_sich_aufTarget = rueckfragenUndKommunikationList.find(r => r.record_id === extractRecordId(record.fields.bezieht_sich_auf));
  const quelleTarget = informationsquellenList.find(r => r.record_id === extractRecordId(record.fields.quelle));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'kommunikationstyp')} value={record.fields.kommunikationstyp} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'kanal')} value={record.fields.kanal} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'absender')} value={record.fields.absender} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'empfaenger')} value={record.fields.empfaenger} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'betreff')} value={record.fields.betreff} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'inhalt')} value={record.fields.inhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'versandstatus')} value={record.fields.versandstatus} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'versanddatum')} value={record.fields.versanddatum} format="datetime" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'antwort_erwartet_bis')} value={record.fields.antwort_erwartet_bis} format="date" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'antwort_erhalten_am')} value={record.fields.antwort_erhalten_am} format="datetime" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'antwortstatus')} value={record.fields.antwortstatus} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'weitere_offene_punkte')} value={Array.isArray(record.fields.weitere_offene_punkte) ? record.fields.weitere_offene_punkte.map((u: unknown) => offenePunkteList.find(t => t.record_id === extractRecordId(u))?.fields.kurztitel ?? '—').join(', ') : null} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'anfrage')}
          name={anfrageTarget?.fields.anfrage_ansprechpartner ?? '—'}
          meta={[anfrageTarget?.fields.anfrage_kontakt, anfrageTarget?.fields.kundenreferenz].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'offener_punkt')}
          name={offener_punktTarget?.fields.kurztitel ?? '—'}
          meta={[offener_punktTarget?.fields.zustaendige_rolle, offener_punktTarget?.fields.verantwortlicher].filter(Boolean).join(' · ') || undefined}
          onClick={offener_punktTarget && onOpenOffenePunkte ? () => onOpenOffenePunkte!(offener_punktTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'bezieht_sich_auf')}
          name={bezieht_sich_aufTarget?.fields.absender ?? '—'}
          meta={[bezieht_sich_aufTarget?.fields.empfaenger, bezieht_sich_aufTarget?.fields.betreff].filter(Boolean).join(' · ') || undefined}
          onClick={bezieht_sich_aufTarget && onOpenRueckfragenUndKommunikation ? () => onOpenRueckfragenUndKommunikation!(bezieht_sich_aufTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'quelle')}
          name={quelleTarget?.fields.titel ?? '—'}
          meta={[quelleTarget?.fields.link_oder_referenz, quelleTarget?.fields.absender_oder_urheber].filter(Boolean).join(' · ') || undefined}
          onClick={quelleTarget && onOpenInformationsquellen ? () => onOpenInformationsquellen!(quelleTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.RUECKFRAGEN_UND_KOMMUNIKATION} recordId={record.record_id} readOnly={!perms.canWrite('rueckfragen_und_kommunikation')} />
    </>
  );
}
