/**
 * useAntwortZuordnenFlow — the plumbing of the flow « Antwort zuordnen », generated from the plan.
 *
 * Writes `rueckfragen_und_kommunikation`: asks `bezieht_sich_auf`, `weitere_offene_punkte`, `quelle`, `kanal`, `absender`, `betreff`, `inhalt`, `antwortstatus`, `anfrage`; sets `kommunikationstyp`, `antwort_erhalten_am`, `versandstatus` itself.
Writes `aufgaben` (only when the person fills it): asks `titel`, `verantwortlicher`, `faellig_am`, `anfrage`; sets `aufgabentyp`, `status` itself.
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
 *   const flow = useAntwortZuordnenFlow({
 *     steps: { bezieht_sich_auf: 1, weitere_offene_punkte: 2, quelle: 3, anfrage: 5, kanal: 6, absender: 6, betreff: 6, inhalt: 6, antwortstatus: 6, titel: 6, verantwortlicher: 6, faellig_am: 6 },
 *     items: { bezieht_sich_auf: r => ({ id: r.id, title: fieldText(r, 'betreff') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.bezieht_sich_auf.select} {...flow.pick('bezieht_sich_auf')} />
 *     <EntitySelectStep {...flow.picks.weitere_offene_punkte.select} {...flow.pickMany('weitere_offene_punkte')} />
 *     <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} />
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     <EntitySelectStep {...flow.picks.aufgaben_anfrage.select} {...flow.pick('anfrage')} />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="kanal" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="absender" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="betreff" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="inhalt" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="antwortstatus" />
 *     <Bound form={flow.forms.aufgaben} name="titel" />
 *     <Bound form={flow.forms.aufgaben} name="verantwortlicher" />
 *     <Bound form={flow.forms.aufgaben} name="faellig_am" />
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
export type AntwortZuordnenFieldKey = 'absender' | 'anfrage' | 'antwortstatus' | 'betreff' | 'bezieht_sich_auf' | 'faellig_am' | 'inhalt' | 'kanal' | 'quelle' | 'titel' | 'verantwortlicher' | 'weitere_offene_punkte';

export interface AntwortZuordnenForms {
  rueckfragen_und_kommunikation: StepForm<'rueckfragen_und_kommunikation'>;
  aufgaben: StepForm<'aufgaben'>;
}

// Alias so the option generics stay readable.
type Key = AntwortZuordnenFieldKey;

export interface AntwortZuordnenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    bezieht_sich_auf?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    weitere_offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    quelle?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgaben_anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"absender": 6, "anfrage": 5, "antwortstatus": 6, "betreff": 6, "bezieht_sich_auf": 1, "faellig_am": 6, "inhalt": 6, "kanal": 6, "quelle": 3, "titel": 6, "verantwortlicher": 6, "weitere_offene_punkte": 2};
export const ANTWORTZUORDNEN_REVIEW_STEP = 7;

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

export function useAntwortZuordnenFlow(options: AntwortZuordnenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const rueckfragen_und_kommunikation = useStepForm('rueckfragen_und_kommunikation', {
    fields: ["bezieht_sich_auf", "weitere_offene_punkte", "quelle", "kanal", "absender", "betreff", "inhalt", "antwortstatus", "anfrage"],
    steps: only(steps, ["bezieht_sich_auf", "weitere_offene_punkte", "quelle", "kanal", "absender", "betreff", "inhalt", "antwortstatus", "anfrage"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["bezieht_sich_auf", "weitere_offene_punkte", "quelle", "kanal", "absender", "betreff", "inhalt", "antwortstatus", "anfrage"]),
    messages: only(options.messages as Record<string, string> | undefined, ["bezieht_sich_auf", "weitere_offene_punkte", "quelle", "kanal", "absender", "betreff", "inhalt", "antwortstatus", "anfrage"]),
  });
  const aufgaben = useStepForm('aufgaben', {
    fields: ["titel", "verantwortlicher", "faellig_am", "anfrage"],
    steps: only(steps, ["titel", "verantwortlicher", "faellig_am", "anfrage"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["titel", "verantwortlicher", "faellig_am", "anfrage"]),
    messages: only(options.messages as Record<string, string> | undefined, ["titel", "verantwortlicher", "faellig_am", "anfrage"]),
  });
  const forms: AntwortZuordnenForms = { rueckfragen_und_kommunikation, aufgaben };
  const formList: StepForm[] = [rueckfragen_und_kommunikation, aufgaben];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    bezieht_sich_auf: useRecordSearch(servicePort, 'rueckfragen_und_kommunikation', withPickPolicy('bezieht_sich_auf', {
      searchFields: ["betreff", "empfaenger"] as never,
      filter: "r.v_versandstatus == 'versendet' and r.v_antwortstatus in ['offen', 'teilweise_beantwortet']",
      where: (r: JourneyRecord) => (fieldLookup(r, "versandstatus")?.key ?? null) === "versendet" && ["offen", "teilweise_beantwortet"].includes(fieldLookup(r, "antwortstatus")?.key ?? ''),
      toItem: options.items?.bezieht_sich_auf as never,
    })),
    weitere_offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('weitere_offene_punkte', {
      searchFields: ["kurztitel"] as never,
      toItem: options.items?.weitere_offene_punkte as never,
    })),
    quelle: useRecordSearch(servicePort, 'informationsquellen', withPickPolicy('quelle', {
      searchFields: ["titel"] as never,
      toItem: options.items?.quelle as never,
    })),
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfrage_ansprechpartner"] as never,
      toItem: options.items?.anfrage as never,
    })),
    aufgaben_anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('aufgaben_anfrage', {
      searchFields: ["anfrage_ansprechpartner"] as never,
      toItem: options.items?.aufgaben_anfrage as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:antwort-zuordnen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:antwort-zuordnen:write:${entity}.${field}`,
  });
  const picks = {
    bezieht_sich_auf: { ...searches.bezieht_sich_auf, select: { ...searches.bezieht_sich_auf.select, create: false as boolean, hint: hintFor('bezieht_sich_auf', 'rueckfragen_und_kommunikation', {"conditions": [{"field": "versandstatus", "op": "eq", "value": "versendet"}, {"field": "antwortstatus", "op": "in", "value": ["offen", "teilweise_beantwortet"]}], "mode": "all"} as PickWhere | null) } },
    weitere_offene_punkte: { ...searches.weitere_offene_punkte, select: { ...searches.weitere_offene_punkte.select, create: false as boolean, hint: hintFor('weitere_offene_punkte', 'offene_punkte', null as PickWhere | null) } },
    quelle: { ...searches.quelle, select: { ...searches.quelle.select, create: false as boolean, hint: hintFor('quelle', 'informationsquellen', null as PickWhere | null) } },
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
    aufgaben_anfrage: { ...searches.aufgaben_anfrage, select: { ...searches.aufgaben_anfrage.select, create: false as boolean, hint: hintFor('aufgaben_anfrage', 'kundenanfragen', null as PickWhere | null) } },
  };

  const aufgabenFilled = hasValues(aufgaben);
  const plan: PlanStep[] = [
    {
      key: 'rueckfragen_und_kommunikation', entity: 'rueckfragen_und_kommunikation', form: rueckfragen_und_kommunikation, primary: true,
      values: (): FormValues => ({
        kommunikationstyp: policyFixedValue('rueckfragen_und_kommunikation', 'kommunikationstyp') ?? "antwort",
        antwort_erhalten_am: policyFixedValue('rueckfragen_und_kommunikation', 'antwort_erhalten_am') ?? nowIso(),
        versandstatus: policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "nicht_erforderlich",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('rueckfragen_und_kommunikation', 'kommunikationstyp', policyFixedValue('rueckfragen_und_kommunikation', 'kommunikationstyp') ?? "antwort"), setting('rueckfragen_und_kommunikation', 'versandstatus', policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "nicht_erforderlich")],
    },
    ...(aufgabenFilled ? [{
      key: 'aufgaben', entity: 'aufgaben', form: aufgaben,
      values: (): FormValues => ({
        aufgabentyp: policyFixedValue('aufgaben', 'aufgabentyp') ?? "informationspruefung",
        status: policyFixedValue('aufgaben', 'status') ?? "offen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('aufgaben', 'aufgabentyp', policyFixedValue('aufgaben', 'aufgabentyp') ?? "informationspruefung"), setting('aufgaben', 'status', policyFixedValue('aufgaben', 'status') ?? "offen")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'antwort-zuordnen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AntwortZuordnenFieldKey) => {
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
  const pickMany = (field: AntwortZuordnenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'antwort-zuordnen' as const,
    draftKey: 'antwort-zuordnen' as const,
    entity: 'rueckfragen_und_kommunikation' as const,
    form: rueckfragen_und_kommunikation,
    forms, formList, picks, submit, steps,    reviewStep: ANTWORTZUORDNEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AntwortZuordnenFlow = ReturnType<typeof useAntwortZuordnenFlow>;
