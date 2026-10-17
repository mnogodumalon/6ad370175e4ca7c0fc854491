/**
 * useEntscheidungDokumentierenFlow — the plumbing of the flow « Entscheidung dokumentieren », generated from the plan.
 *
 * Writes `entscheidungen`: asks `anfrage`, `betroffene_anforderungen`, `betroffene_offene_punkte`, `zugrunde_liegende_beurteilungen`, `titel`, `entscheidungsgegenstand`, `entscheidungstyp`, `alternativen`, `entscheidung`, `begruendung`, `entscheidungsverantwortlicher`, `entscheidungskompetenz_geprueft`, `auflagen`, `gueltig_bis`; sets `entscheidungsstatus`, `entscheidungsdatum` itself.
Changes `entscheidungen` (only when the person fills it): the record to change is picked (`flow.pick('entscheidungen2')`), the form is prefilled with its values; ; sets `entscheidungsstatus` itself; links `ersetzt_durch_entscheidung` ← the created `entscheidungen`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 7)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useEntscheidungDokumentierenFlow({
 *     steps: { entscheidungen2: 1, anfrage: 2, betroffene_anforderungen: 3, betroffene_offene_punkte: 4, zugrunde_liegende_beurteilungen: 5, titel: 6, entscheidungsgegenstand: 6, entscheidungstyp: 6, alternativen: 6, entscheidung: 6, begruendung: 6, entscheidungsverantwortlicher: 6, entscheidungskompetenz_geprueft: 6, auflagen: 6, gueltig_bis: 6 },
 *     items: { anfrage: r => ({ id: r.id, title: fieldText(r, 'anfrage_ansprechpartner') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     <EntitySelectStep {...flow.picks.betroffene_anforderungen.select} {...flow.pickMany('betroffene_anforderungen')} />
 *     <EntitySelectStep {...flow.picks.betroffene_offene_punkte.select} {...flow.pickMany('betroffene_offene_punkte')} />
 *     <EntitySelectStep {...flow.picks.zugrunde_liegende_beurteilungen.select} {...flow.pickMany('zugrunde_liegende_beurteilungen')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.entscheidungen2.select} {...flow.pick('entscheidungen2')} />
 *     <Bound form={flow.forms.entscheidungen} name="titel" />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidungsgegenstand" />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidungstyp" />
 *     <Bound form={flow.forms.entscheidungen} name="alternativen" />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidung" />
 *     <Bound form={flow.forms.entscheidungen} name="begruendung" />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidungsverantwortlicher" />
 *     <Bound form={flow.forms.entscheidungen} name="entscheidungskompetenz_geprueft" />
 *     <Bound form={flow.forms.entscheidungen} name="auflagen" />
 *     <Bound form={flow.forms.entscheidungen} name="gueltig_bis" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type EntscheidungDokumentierenFieldKey = 'alternativen' | 'anfrage' | 'auflagen' | 'begruendung' | 'betroffene_anforderungen' | 'betroffene_offene_punkte' | 'entscheidung' | 'entscheidungen2' | 'entscheidungsgegenstand' | 'entscheidungskompetenz_geprueft' | 'entscheidungstyp' | 'entscheidungsverantwortlicher' | 'gueltig_bis' | 'titel' | 'zugrunde_liegende_beurteilungen';

export interface EntscheidungDokumentierenForms {
  entscheidungen: StepForm<'entscheidungen'>;
  entscheidungen2: StepForm<'entscheidungen'>;
}

// Alias so the option generics stay readable.
type Key = EntscheidungDokumentierenFieldKey;

export interface EntscheidungDokumentierenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betroffene_anforderungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betroffene_offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    zugrunde_liegende_beurteilungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    entscheidungen2?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"alternativen": 6, "anfrage": 2, "auflagen": 6, "begruendung": 6, "betroffene_anforderungen": 3, "betroffene_offene_punkte": 4, "entscheidung": 6, "entscheidungen2": 1, "entscheidungsgegenstand": 6, "entscheidungskompetenz_geprueft": 6, "entscheidungstyp": 6, "entscheidungsverantwortlicher": 6, "gueltig_bis": 6, "titel": 6, "zugrunde_liegende_beurteilungen": 5};
export const ENTSCHEIDUNGDOKUMENTIEREN_REVIEW_STEP = 7;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useEntscheidungDokumentierenFlow(options: EntscheidungDokumentierenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [entscheidungen2TargetId, setEntscheidungen2TargetId] = useState<string | null>(null);
  const entscheidungen = useStepForm('entscheidungen', {
    fields: ["anfrage", "betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_beurteilungen", "titel", "entscheidungsgegenstand", "entscheidungstyp", "alternativen", "entscheidung", "begruendung", "entscheidungsverantwortlicher", "entscheidungskompetenz_geprueft", "auflagen", "gueltig_bis"],
    steps: only(steps, ["anfrage", "betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_beurteilungen", "titel", "entscheidungsgegenstand", "entscheidungstyp", "alternativen", "entscheidung", "begruendung", "entscheidungsverantwortlicher", "entscheidungskompetenz_geprueft", "auflagen", "gueltig_bis"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["anfrage", "betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_beurteilungen", "titel", "entscheidungsgegenstand", "entscheidungstyp", "alternativen", "entscheidung", "begruendung", "entscheidungsverantwortlicher", "entscheidungskompetenz_geprueft", "auflagen", "gueltig_bis"]),
    messages: only(options.messages as Record<string, string> | undefined, ["anfrage", "betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_beurteilungen", "titel", "entscheidungsgegenstand", "entscheidungstyp", "alternativen", "entscheidung", "begruendung", "entscheidungsverantwortlicher", "entscheidungskompetenz_geprueft", "auflagen", "gueltig_bis"]),
  });
  const entscheidungen2 = useStepForm('entscheidungen', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: EntscheidungDokumentierenForms = { entscheidungen, entscheidungen2 };
  const formList: StepForm[] = [entscheidungen, entscheidungen2];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfrage_ansprechpartner"] as never,
      toItem: options.items?.anfrage as never,
    })),
    betroffene_anforderungen: useRecordSearch(servicePort, 'technische_anforderungen', withPickPolicy('betroffene_anforderungen', {
      searchFields: ["bezeichnung"] as never,
      toItem: options.items?.betroffene_anforderungen as never,
    })),
    betroffene_offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('betroffene_offene_punkte', {
      searchFields: ["kurztitel"] as never,
      filter: "r.v_status == 'zur_entscheidung'",
      where: (r: JourneyRecord) => (fieldLookup(r, "status")?.key ?? null) === "zur_entscheidung",
      toItem: options.items?.betroffene_offene_punkte as never,
    })),
    zugrunde_liegende_beurteilungen: useRecordSearch(servicePort, 'beurteilungen', withPickPolicy('zugrunde_liegende_beurteilungen', {
      searchFields: ["beurteilungsgegenstand"] as never,
      filter: "r.v_pruefstatus in ['fachlich_geprueft', 'bestaetigt']",
      where: (r: JourneyRecord) => ["fachlich_geprueft", "bestaetigt"].includes(fieldLookup(r, "pruefstatus")?.key ?? ''),
      toItem: options.items?.zugrunde_liegende_beurteilungen as never,
    })),
    entscheidungen2: useRecordSearch(servicePort, 'entscheidungen', withPickPolicy('entscheidungen2', {
      searchFields: ["titel"] as never,
      toItem: options.items?.entscheidungen2 as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:entscheidung-dokumentieren:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:entscheidung-dokumentieren:write:${entity}.${field}`,
  });
  const picks = {
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
    betroffene_anforderungen: { ...searches.betroffene_anforderungen, select: { ...searches.betroffene_anforderungen.select, create: false as boolean, hint: hintFor('betroffene_anforderungen', 'technische_anforderungen', null as PickWhere | null) } },
    betroffene_offene_punkte: { ...searches.betroffene_offene_punkte, select: { ...searches.betroffene_offene_punkte.select, create: false as boolean, hint: hintFor('betroffene_offene_punkte', 'offene_punkte', {"conditions": [{"field": "status", "op": "eq", "value": "zur_entscheidung"}], "mode": "all"} as PickWhere | null) } },
    zugrunde_liegende_beurteilungen: { ...searches.zugrunde_liegende_beurteilungen, select: { ...searches.zugrunde_liegende_beurteilungen.select, create: false as boolean, hint: hintFor('zugrunde_liegende_beurteilungen', 'beurteilungen', {"conditions": [{"field": "pruefstatus", "op": "in", "value": ["fachlich_geprueft", "bestaetigt"]}], "mode": "all"} as PickWhere | null) } },
    entscheidungen2: { ...searches.entscheidungen2, select: { ...searches.entscheidungen2.select, create: false as boolean, hint: hintFor('entscheidungen2', 'entscheidungen', null as PickWhere | null) } },
  };

  const entscheidungen2Filled = hasValues(entscheidungen2);
  const plan: PlanStep[] = [
    {
      key: 'entscheidungen', entity: 'entscheidungen', form: entscheidungen, primary: true,
      values: (): FormValues => ({
        entscheidungsstatus: policyFixedValue('entscheidungen', 'entscheidungsstatus') ?? "entschieden",
        entscheidungsdatum: policyFixedValue('entscheidungen', 'entscheidungsdatum') ?? nowIso(),
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('entscheidungen', 'entscheidungsstatus', policyFixedValue('entscheidungen', 'entscheidungsstatus') ?? "entschieden")],
    },
    ...(entscheidungen2Filled ? [{
      key: 'entscheidungen2', entity: 'entscheidungen', form: entscheidungen2,
      updates: () => entscheidungen2TargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => entscheidungen2TargetId
        ? { key: 'target:entscheidungen2', label: entityLabel('entscheidungen'), value: picks.entscheidungen2.labelOf(entscheidungen2TargetId) ?? entscheidungen2TargetId, step: steps.entscheidungen2 }
        : undefined,      needs: ['entscheidungen'],
      link: { ersetzt_durch_entscheidung: 'entscheidungen' },

      values: (): FormValues => ({
        entscheidungsstatus: policyFixedValue('entscheidungen', 'entscheidungsstatus') ?? "ersetzt",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('entscheidungen', 'entscheidungsstatus', policyFixedValue('entscheidungen', 'entscheidungsstatus') ?? "ersetzt")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'entscheidung-dokumentieren' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    entscheidungen2: {
      selectedId: entscheidungen2TargetId,
      onSelect: (id: string) => {
        setEntscheidungen2TargetId(id);
        const rec = picks.entscheidungen2.recordOf(id);
        if (rec) entscheidungen2.reset({ });
      },
      get record(): JourneyRecord | undefined { return entscheidungen2TargetId ? picks.entscheidungen2.recordOf(entscheidungen2TargetId) : undefined; },
    },
  };
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: EntscheidungDokumentierenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: EntscheidungDokumentierenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setEntscheidungen2TargetId(null); };

  return {
    slug: 'entscheidung-dokumentieren' as const,
    draftKey: 'entscheidung-dokumentieren' as const,
    entity: 'entscheidungen' as const,
    form: entscheidungen,
    forms, formList, picks, submit, steps, targets,    reviewStep: ENTSCHEIDUNGDOKUMENTIEREN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type EntscheidungDokumentierenFlow = ReturnType<typeof useEntscheidungDokumentierenFlow>;
