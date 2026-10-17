import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconClockHour4, IconChecks, IconMessageQuestion } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { KanbanWidget, type KanbanCard } from '@/components/widgets/KanbanWidget';
import { Button } from '@/components/ui/button';
import { LivingAppsService } from '@/services/livingAppsService';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import type { OffenePunkte, Aufgaben, Kundenanfragen } from '@/types/app';
import { formatDate, lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';

const OP_CLOSED = ['erledigt', 'entschieden_akzeptiert', 'nicht_mehr_relevant'];
const OP_NEXT: Record<string, string> = {
  neu: 'zugewiesen',
  zugewiesen: 'in_bearbeitung',
  in_bearbeitung: 'zur_entscheidung',
  wartet_auf_kunde: 'in_bearbeitung',
  wartet_intern: 'in_bearbeitung',
};
const TASK_NEXT: Record<string, string> = {
  offen: 'in_bearbeitung',
  in_bearbeitung: 'erledigt',
  blockiert: 'in_bearbeitung',
  wartet_auf_antwort: 'in_bearbeitung',
};
const TASK_CLOSED = ['erledigt', 'abgebrochen'];

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { setOffenePunkte, setAufgaben, setKundenanfragen, fetchAll } = data;
  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');
  const [focus, setFocus] = useState<'all' | 'overdue'>('all');

  // ---- shared write helpers (one write path for hero, lists, board, overlay) ----
  const patchOP = async (r: OffenePunkte, key: string, msg: string) => {
    const prev = r.fields.status;
    const set = (v: { key: string; label: string } | undefined) =>
      setOffenePunkte(list => list.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, status: v } } : x));
    set(lookupOption('offene_punkte', 'status', key));
    try {
      await LivingAppsService.updateOffenePunkteEntry(r.record_id, { status: key });
      undoToast(msg, () => {
        set(prev);
        LivingAppsService.updateOffenePunkteEntry(r.record_id, { status: prev?.key }).catch(() => fetchAll());
      });
    } catch {
      fetchAll();
    }
  };
  const advanceOP = (r: OffenePunkte) => {
    const next = OP_NEXT[lookupKey(r.fields.status) ?? ''];
    if (!next) return;
    const label = lookupOption('offene_punkte', 'status', next).label;
    patchOP(r, next, tx`${r.fields.kurztitel ?? ''} — ${label}`);
  };
  const advanceTask = async (r: Aufgaben) => {
    const next = TASK_NEXT[lookupKey(r.fields.status) ?? ''];
    if (!next) return;
    const prev = r.fields.status;
    const prevDone = r.fields.abgeschlossen_am;
    const done = next === 'erledigt' ? today : undefined;
    const set = (v: { key: string; label: string } | undefined, d: string | undefined) =>
      setAufgaben(list => list.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, status: v, abgeschlossen_am: d } } : x));
    set(lookupOption('aufgaben', 'status', next), done ?? prevDone);
    try {
      await LivingAppsService.updateAufgabenEntry(r.record_id, done ? { status: next, abgeschlossen_am: done } : { status: next });
      const label = lookupOption('aufgaben', 'status', next).label;
      undoToast(tx`${r.fields.titel ?? ''} — ${label}`, () => {
        set(prev, prevDone);
        LivingAppsService.updateAufgabenEntry(r.record_id, { status: prev?.key, abgeschlossen_am: prevDone }).catch(() => fetchAll());
      });
    } catch {
      fetchAll();
    }
  };
  const startAnfrage = async (r: Kundenanfragen) => {
    const prev = r.fields.status;
    const set = (v: { key: string; label: string } | undefined) =>
      setKundenanfragen(list => list.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, status: v } } : x));
    set(lookupOption('kundenanfragen', 'status', 'in_pruefung'));
    try {
      await LivingAppsService.updateKundenanfragenEntry(r.record_id, { status: 'in_pruefung' });
      undoToast(tx`Anfrage übernommen — in Prüfung`, () => {
        set(prev);
        LivingAppsService.updateKundenanfragenEntry(r.record_id, { status: prev?.key }).catch(() => fetchAll());
      });
    } catch {
      fetchAll();
    }
  };

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'offenePunkte') {
        const next = OP_NEXT[lookupKey(top.record.fields.status) ?? ''];
        return next ? { label: tx('Nächster Schritt'), onClick: () => advanceOP(top.record) } : undefined;
      }
      if (top.type === 'aufgaben') {
        const next = TASK_NEXT[lookupKey(top.record.fields.status) ?? ''];
        return next ? { label: tx('Nächster Schritt'), onClick: () => advanceTask(top.record) } : undefined;
      }
      if (top.type === 'kundenanfragen' && lookupKey(top.record.fields.status) === 'neu') {
        return { label: tx('Anfrage übernehmen'), onClick: () => startAnfrage(top.record) };
      }
      return undefined;
    },
  });
  const anfragen = crud.enriched.kundenanfragen;
  const punkte = crud.enriched.offenePunkte;
  const aufgaben = crud.enriched.aufgaben;
  const anforderungen = crud.enriched.technischeAnforderungen;
  const komm = crud.enriched.rueckfragenUndKommunikation;
  const entscheidungen = crud.enriched.entscheidungen;
  const erfahrungen = crud.enriched.erfahrungenUndErkenntnisse;

  const dayOf = (s?: string) => (s ? s.slice(0, 10) : '');
  const isOverdue = (s?: string) => !!s && dayOf(s) < today;

  const openPunkte = useMemo(() => punkte.filter(p => !OP_CLOSED.includes(lookupKey(p.fields.status) ?? '')), [punkte]);
  const critical = openPunkte.filter(p => lookupKey(p.fields.prioritaet) === 'kritisch');
  const overduePunkte = openPunkte.filter(p => isOverdue(p.fields.faellig_am));
  const openTasks = aufgaben.filter(a => !TASK_CLOSED.includes(lookupKey(a.fields.status) ?? ''));
  const overdueTasks = openTasks.filter(a => isOverdue(a.fields.faellig_am));
  const neu = anfragen.filter(a => lookupKey(a.fields.status) === 'neu');
  const pendingAnswers = komm.filter(k => lookupKey(k.fields.versandstatus) === 'versendet'
    && ['offen', 'teilweise_beantwortet', 'unklar', 'widerspruechlich'].includes(lookupKey(k.fields.antwortstatus) ?? 'offen'));
  const drafts = komm.filter(k => ['entwurf', 'zur_pruefung', 'freigegeben'].includes(lookupKey(k.fields.versandstatus) ?? ''));
  const openDecisions = entscheidungen.filter(e => ['vorbereitung', 'zur_entscheidung'].includes(lookupKey(e.fields.entscheidungsstatus) ?? ''));
  const badReqs = anforderungen.filter(r => ['unklar', 'widerspruechlich', 'nicht_erfuellt'].includes(lookupKey(r.fields.pruefstatus) ?? '') || r.fields.erneute_pruefung_erforderlich);
  const reusable = erfahrungen.filter(e => ['fachlich_bestaetigt', 'wiederholt_bestaetigt'].includes(lookupKey(e.fields.bestaetigungsstatus) ?? '')
    && ['verfuegbar', 'nur_hinweis'].includes(lookupKey(e.fields.wiederverwendungsstatus) ?? ''));
  const doneCount = punkte.length - openPunkte.length;

  const columns = (LOOKUP_OPTIONS['offene_punkte']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label }));
  const boardPunkte = focus === 'overdue' ? overduePunkte : punkte;
  const cards: KanbanCard[] = [...boardPunkte]
    .sort((a, b) => (a.fields.faellig_am ?? '9999').localeCompare(b.fields.faellig_am ?? '9999'))
    .map(p => {
      const closed = OP_CLOSED.includes(lookupKey(p.fields.status) ?? '');
      const late = !closed && isOverdue(p.fields.faellig_am);
      const parts = [
        p.fields.prioritaet?.label,
        p.fields.verantwortlicher || tx('Ohne Verantwortliche/n'),
        p.fields.faellig_am ? formatDate(p.fields.faellig_am) : '',
        p.betroffene_anforderungenName,
      ].filter(Boolean).join(' · ');
      return {
        id: `op:${p.record_id}`,
        column: lookupKey(p.fields.status) ?? 'neu',
        title: p.fields.kurztitel ?? '—',
        subtitle: parts,
        tone: late ? 'destructive' : 'default',
      };
    });

  const moveCard = (cardId: string, col: string): string | void => {
    const rec = punkte.find(p => p.record_id === cardId.split(':')[1]);
    if (!rec) return;
    if (['erledigt', 'entschieden_akzeptiert'].includes(col) && !rec.fields.loesung_oder_ergebnis?.trim()) {
      return tx('Zum Abschluss ist ein dokumentiertes Ergebnis nötig — bitte im Detail eintragen.');
    }
    const label = lookupOption('offene_punkte', 'status', col).label;
    patchOP(rec, col, tx`${rec.fields.kurztitel ?? ''} — ${label}`);
  };

  const empty = anfragen.length === 0 && punkte.length === 0;

  // context line — names in every branch
  let context: string;
  if (neu.length > 0) {
    const n = namen(neu.map(a => a.kundeName ?? ''));
    context = tx`Neu eingegangen: ${n}.`;
  } else if (overdueTasks.length > 0) {
    const n = namen(overdueTasks.map(a => a.fields.titel ?? ''));
    context = tx`Überfällige Aufgaben: ${n}.`;
  } else if (openPunkte.length > 0) {
    const n = namen(openPunkte.slice(0, 3).map(p => p.fields.kurztitel ?? ''));
    context = tx`Gerade in Klärung: ${n}.`;
  } else {
    context = tx`Alles geklärt — Zeit, Erfahrungen zu sichern.`;
  }

  const canNew = crud.kundenanfragen.canWrite;
  const newAnfrage = () => crud.kundenanfragen.openCreate({ status: 'neu', eingangsdatum: today });

  const hero = empty ? (
    <HeroBanner icon={<IconPlus size={18} />} action={{ label: tx('Erste Anfrage aufnehmen'), onClick: newAnfrage }}>
      {tx('Noch keine Anfrage vorhanden — starte mit der ersten Kundenanfrage.')}
    </HeroBanner>
  ) : critical.length > 0 ? (
    <HeroBanner
      icon={<IconAlertTriangle size={18} />}
      action={{
        label: OP_NEXT[lookupKey(critical[0].fields.status) ?? ''] ? tx('Nächsten Schritt setzen') : tx('Öffnen'),
        onClick: () => OP_NEXT[lookupKey(critical[0].fields.status) ?? '']
          ? advanceOP(critical[0])
          : crud.offenePunkte.openDetail(critical[0]),
      }}
    >
      <b>{namen(critical.map(p => p.fields.kurztitel ?? ''))}</b> {tx('— kritische offene Punkte blockieren den Abschluss.')}
    </HeroBanner>
  ) : undefined;

  const statusWord = (label?: string, bad?: boolean) => (
    <span className={bad ? 'font-medium text-destructive' : 'font-medium'}>{label ?? '—'}</span>
  );
  const dateBit = (s?: string) => (s ? <span className="text-muted-foreground"> · {formatDate(s)}</span> : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {canNew && (
          <Button onClick={newAnfrage} className="shrink-0">
            <IconPlus size={16} className="shrink-0" />
            <span>{tx('Neue Anfrage')}</span>
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={hero}
        kpis={empty ? undefined : (
          <StatStrip>
            <StatStripItem
              title={tx('Überfällige Fristen')}
              value={overduePunkte.length + overdueTasks.length}
              icon={<IconClockHour4 size={16} />}
              tone={overduePunkte.length + overdueTasks.length > 0 ? 'warning' : 'default'}
              onClick={() => setFocus(f => (f === 'overdue' ? 'all' : 'overdue'))}
              active={focus === 'overdue'}
            />
            <StatStripItem
              title={tx('Antworten ausstehend')}
              value={pendingAnswers.length}
              icon={<IconMessageQuestion size={16} />}
            />
            <StatStripItem
              title={tx('Punkte geklärt')}
              value={`${doneCount} / ${punkte.length}`}
              icon={<IconChecks size={16} />}
              tone={punkte.length > 0 && doneCount === punkte.length ? 'success' : 'default'}
            />
          </StatStrip>
        )}
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={OP_CLOSED}
            onCardClick={c => {
              const rec = punkte.find(p => p.record_id === c.id.split(':')[1]);
              if (rec) crud.offenePunkte.openDetail(rec);
            }}
            onCardMove={crud.offenePunkte.canWrite ? moveCard : undefined}
            onAddCard={crud.offenePunkte.canWrite ? (col => crud.offenePunkte.openCreate({ status: col })) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Neue Anfragen')}
              items={neu.map(a => ({
                id: a.record_id,
                title: a.kundeName || a.fields.anfragenummer || '—',
                secondLine: <>{statusWord(a.fields.prioritaet?.label, lookupKey(a.fields.prioritaet) === 'kritisch')}<span className="text-muted-foreground"> · {a.fields.produkt_oder_produktfamilie ?? tx('Produkt offen')}</span></>,
                action: { label: tx('Übernehmen'), onClick: () => startAnfrage(a) },
              }))}
              onItemClick={id => { const r = anfragen.find(a => a.record_id === id); if (r) crud.kundenanfragen.openDetail(r); }}
              empty={{ text: tx('Keine neuen Anfragen — alles übernommen.') }}
              max={5}
            />
            <WorkList
              title={tx('Offene Aufgaben')}
              items={[...openTasks]
                .sort((a, b) => (a.fields.faellig_am ?? '9999').localeCompare(b.fields.faellig_am ?? '9999'))
                .map(a => {
                  const late = isOverdue(a.fields.faellig_am);
                  const blocked = lookupKey(a.fields.status) === 'blockiert';
                  return {
                    id: a.record_id,
                    title: a.fields.titel ?? '—',
                    secondLine: <>
                      {statusWord(late ? tx('Überfällig') : a.fields.status?.label, late || blocked)}
                      {dateBit(a.fields.faellig_am)}
                      <span className="text-muted-foreground"> · {a.fields.verantwortlicher ?? tx('nicht zugewiesen')}</span>
                      {blocked && a.fields.blockierungsgrund && <span className="text-muted-foreground"> · {a.fields.blockierungsgrund}</span>}
                    </>,
                    action: TASK_NEXT[lookupKey(a.fields.status) ?? ''] ? { label: lookupKey(a.fields.status) === 'in_bearbeitung' ? tx('Erledigt') : tx('Weiter'), onClick: () => advanceTask(a) } : undefined,
                  };
                })}
              onItemClick={id => { const r = aufgaben.find(a => a.record_id === id); if (r) crud.aufgaben.openDetail(r); }}
              empty={{ text: tx('Keine offenen Aufgaben.') }}
              max={5}
            />
            <WorkList
              title={tx('Kundenantworten ausstehend')}
              items={pendingAnswers.map(k => ({
                id: k.record_id,
                title: k.fields.betreff ?? '—',
                secondLine: <>{statusWord(k.fields.antwortstatus?.label ?? tx('Offen'), ['unklar', 'widerspruechlich'].includes(lookupKey(k.fields.antwortstatus) ?? ''))}{dateBit(k.fields.antwort_erwartet_bis)}<span className="text-muted-foreground"> · {k.fields.empfaenger ?? ''}</span></>,
              }))}
              onItemClick={id => { const r = komm.find(k => k.record_id === id); if (r) crud.rueckfragenUndKommunikation.openDetail(r); }}
              empty={{ text: tx('Keine offene Antwort erwartet.') }}
              max={5}
            />
            <WorkList
              title={tx('Entwürfe — nicht versendet')}
              items={drafts.map(k => ({
                id: k.record_id,
                title: k.fields.betreff ?? '—',
                secondLine: <>{statusWord(k.fields.versandstatus?.label)}<span className="text-muted-foreground"> · {k.fields.empfaenger ?? ''}</span></>,
              }))}
              onItemClick={id => { const r = komm.find(k => k.record_id === id); if (r) crud.rueckfragenUndKommunikation.openDetail(r); }}
              empty={{ text: tx('Keine unversendeten Entwürfe.') }}
              max={5}
            />
            <WorkList
              title={tx('Offene Entscheidungen')}
              items={openDecisions.map(e => ({
                id: e.record_id,
                title: e.fields.titel ?? '—',
                secondLine: <>{statusWord(e.fields.entscheidungsstatus?.label)}<span className="text-muted-foreground"> · {e.fields.entscheidungsverantwortlicher ?? tx('nicht zugewiesen')}</span></>,
              }))}
              onItemClick={id => { const r = entscheidungen.find(e => e.record_id === id); if (r) crud.entscheidungen.openDetail(r); }}
              empty={{ text: tx('Keine Entscheidung ausstehend.') }}
              max={5}
            />
            <WorkList
              title={tx('Anforderungen mit Klärungsbedarf')}
              items={badReqs.map(r => ({
                id: r.record_id,
                title: r.fields.bezeichnung ?? '—',
                secondLine: <>{statusWord(r.fields.erneute_pruefung_erforderlich ? tx('Erneute Prüfung erforderlich') : r.fields.pruefstatus?.label, true)}<span className="text-muted-foreground"> · {r.anfrageName}</span></>,
              }))}
              onItemClick={id => { const r = anforderungen.find(x => x.record_id === id); if (r) crud.technischeAnforderungen.openDetail(r); }}
              empty={{ text: tx('Keine unklaren oder widersprüchlichen Anforderungen.') }}
              max={5}
            />
            <WorkList
              title={tx('Bestätigte Erfahrungen')}
              items={reusable.map(e => ({
                id: e.record_id,
                title: e.fields.titel ?? '—',
                secondLine: <>{statusWord(e.fields.bestaetigungsstatus?.label)}<span className="text-muted-foreground"> · {tx('Gültigkeit vor Nutzung prüfen')}</span></>,
              }))}
              onItemClick={id => { const r = erfahrungen.find(e => e.record_id === id); if (r) crud.erfahrungenUndErkenntnisse.openDetail(r); }}
              empty={{ text: tx('Noch keine bestätigte Erfahrung zur Wiederverwendung.') }}
              max={5}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
