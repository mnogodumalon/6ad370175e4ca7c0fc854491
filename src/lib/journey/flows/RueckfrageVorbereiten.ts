/**
 * useRueckfrageVorbereitenFlow — the plumbing of the flow « Rückfrage vorbereiten », generated from the plan.
 *
 * Writes `rueckfragen_und_kommunikation`: asks `offener_punkt`, `weitere_offene_punkte`, `kommunikationstyp`, `kanal`, `absender`, `empfaenger`, `betreff`, `inhalt`, `antwort_erwartet_bis`, `anfrage`; sets `versandstatus`, `antwortstatus` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 5)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useRueckfrageVorbereitenFlow({
 *     steps: { offener_punkt: 1, weitere_offene_punkte: 2, anfrage: 3, kommunikationstyp: 4, kanal: 4, absender: 4, empfaenger: 4, betreff: 4, inhalt: 4, antwort_erwartet_bis: 4 },
 *     items: { offener_punkt: r => ({ id: r.id, title: fieldText(r, 'kurztitel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.offener_punkt.select} {...flow.pick('offener_punkt')} />
 *     <EntitySelectStep {...flow.picks.weitere_offene_punkte.select} {...flow.pickMany('weitere_offene_punkte')} />
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="kommunikationstyp" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="kanal" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="absender" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="empfaenger" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="betreff" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="inhalt" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="antwort_erwartet_bis" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type RueckfrageVorbereitenFieldKey = 'absender' | 'anfrage' | 'antwort_erwartet_bis' | 'betreff' | 'empfaenger' | 'inhalt' | 'kanal' | 'kommunikationstyp' | 'offener_punkt' | 'weitere_offene_punkte';

export interface RueckfrageVorbereitenForms {
  rueckfragen_und_kommunikation: StepForm<'rueckfragen_und_kommunikation'>;
}

// Alias so the option generics stay readable.
type Key = RueckfrageVorbereitenFieldKey;

export interface RueckfrageVorbereitenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    offener_punkt?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    weitere_offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"absender": 4, "anfrage": 3, "antwort_erwartet_bis": 4, "betreff": 4, "empfaenger": 4, "inhalt": 4, "kanal": 4, "kommunikationstyp": 4, "offener_punkt": 1, "weitere_offene_punkte": 2};
export const RUECKFRAGEVORBEREITEN_REVIEW_STEP = 5;

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

export function useRueckfrageVorbereitenFlow(options: RueckfrageVorbereitenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const rueckfragen_und_kommunikation = useStepForm('rueckfragen_und_kommunikation', {
    fields: ["offener_punkt", "weitere_offene_punkte", "kommunikationstyp", "kanal", "absender", "empfaenger", "betreff", "inhalt", "antwort_erwartet_bis", "anfrage"],
    steps: only(steps, ["offener_punkt", "weitere_offene_punkte", "kommunikationstyp", "kanal", "absender", "empfaenger", "betreff", "inhalt", "antwort_erwartet_bis", "anfrage"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["offener_punkt", "weitere_offene_punkte", "kommunikationstyp", "kanal", "absender", "empfaenger", "betreff", "inhalt", "antwort_erwartet_bis", "anfrage"]),
    messages: only(options.messages as Record<string, string> | undefined, ["offener_punkt", "weitere_offene_punkte", "kommunikationstyp", "kanal", "absender", "empfaenger", "betreff", "inhalt", "antwort_erwartet_bis", "anfrage"]),
  });
  const forms: RueckfrageVorbereitenForms = { rueckfragen_und_kommunikation };
  const formList: StepForm[] = [rueckfragen_und_kommunikation];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    offener_punkt: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('offener_punkt', {
      searchFields: ["kurztitel", "verantwortlicher"] as never,
      filter: "r.v_status not in ['erledigt', 'entschieden_akzeptiert', 'nicht_mehr_relevant']",
      where: (r: JourneyRecord) => !["erledigt", "entschieden_akzeptiert", "nicht_mehr_relevant"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.offener_punkt as never,
    })),
    weitere_offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('weitere_offene_punkte', {
      searchFields: ["kurztitel", "verantwortlicher"] as never,
      filter: "r.v_status not in ['erledigt', 'entschieden_akzeptiert', 'nicht_mehr_relevant']",
      where: (r: JourneyRecord) => !["erledigt", "entschieden_akzeptiert", "nicht_mehr_relevant"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.weitere_offene_punkte as never,
    })),
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfrage_ansprechpartner"] as never,
      toItem: options.items?.anfrage as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:rueckfrage-vorbereiten:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:rueckfrage-vorbereiten:write:${entity}.${field}`,
  });
  const picks = {
    offener_punkt: { ...searches.offener_punkt, select: { ...searches.offener_punkt.select, create: false as boolean, hint: hintFor('offener_punkt', 'offene_punkte', {"conditions": [{"field": "status", "op": "not_in", "value": ["erledigt", "entschieden_akzeptiert", "nicht_mehr_relevant"]}], "mode": "all"} as PickWhere | null) } },
    weitere_offene_punkte: { ...searches.weitere_offene_punkte, select: { ...searches.weitere_offene_punkte.select, create: false as boolean, hint: hintFor('weitere_offene_punkte', 'offene_punkte', {"conditions": [{"field": "status", "op": "not_in", "value": ["erledigt", "entschieden_akzeptiert", "nicht_mehr_relevant"]}], "mode": "all"} as PickWhere | null) } },
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'rueckfragen_und_kommunikation', entity: 'rueckfragen_und_kommunikation', form: rueckfragen_und_kommunikation, primary: true,
      values: (): FormValues => ({
        versandstatus: policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "entwurf",
        antwortstatus: policyFixedValue('rueckfragen_und_kommunikation', 'antwortstatus') ?? "offen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('rueckfragen_und_kommunikation', 'versandstatus', policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "entwurf"), setting('rueckfragen_und_kommunikation', 'antwortstatus', policyFixedValue('rueckfragen_und_kommunikation', 'antwortstatus') ?? "offen")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'rueckfrage-vorbereiten' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: RueckfrageVorbereitenFieldKey) => {
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
  const pickMany = (field: RueckfrageVorbereitenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'rueckfrage-vorbereiten' as const,
    draftKey: 'rueckfrage-vorbereiten' as const,
    entity: 'rueckfragen_und_kommunikation' as const,
    form: rueckfragen_und_kommunikation,
    forms, formList, picks, submit, steps,    reviewStep: RUECKFRAGEVORBEREITEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type RueckfrageVorbereitenFlow = ReturnType<typeof useRueckfrageVorbereitenFlow>;
