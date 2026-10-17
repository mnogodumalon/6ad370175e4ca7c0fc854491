/**
 * Offenen Punkt anlegen — 5-Schritt-Wizard.
 * Steps: 1) Anfrage wählen → 2) Betroffene Anforderungen und Quellen → 3) Punkt beschreiben →
 * 4) Verantwortlichen und Fälligkeit → 5) Aufgabe ableiten (optional) → Prüfen & anlegen.
 * Reads: kundenanfragen, technische_anforderungen, informationsquellen. Writes: offene_punkte, aufgaben (optional).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldDate } from '@/lib/journey';
import { useOffenenPunktAnlegenFlow } from '@/lib/journey/flows/OffenenPunktAnlegen';
import { tx } from '@/i18n';

export default function OffenenPunktAnlegenPage() {
  const [step, setStep] = useState(1);
  const [withTask, setWithTask] = useState(false);

  const flow = useOffenenPunktAnlegenFlow({
    steps: {
      anfrage: 1, betroffene_anforderungen: 2, betroffene_quellen: 2,
      kurztitel: 3, beschreibung: 3, punktetyp: 3, prioritaet: 3, auswirkung: 3,
      zustaendige_rolle: 4, verantwortlicher: 4, faellig_am: 4, erledigungskriterium: 4,
      titel: 5, aufgabentyp: 5,
    },
    items: {
      anfrage: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('kunde') ?? fieldText(r, 'anfrage_ansprechpartner'),
        subtitle: [fieldText(r, 'produkt_oder_produktfamilie'), fieldDate(r, 'eingangsdatum')].filter(Boolean).join(' · '),
        status: fieldLookup(r, 'status') ?? undefined,
      }),
      betroffene_anforderungen: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        status: fieldLookup(r, 'pruefstatus') ?? undefined,
      }),
      betroffene_quellen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        status: fieldLookup(r, 'quellenstatus') ?? undefined,
      }),
    },
  });

  const op = flow.forms.offene_punkte;
  const task = flow.forms.aufgaben;

  // The task inherits the request (and the person in charge) of the open point.
  const syncTask = () => {
    const anfrageId = op.get('anfrage');
    if (typeof anfrageId === 'string' && anfrageId) {
      task.set('anfrage', anfrageId, flow.picks.anfrage.labelOf(anfrageId));
    }
  };
  const toggleTask = (on: boolean) => {
    setWithTask(on);
    if (on) syncTask();
    else task.reset();
  };

  const taskRow = withTask && task.get('titel')
    ? [{ key: 'task', label: tx('Aufgabe'), value: String(task.get('titel')) }]
    : [{ key: 'task', label: tx('Aufgabe'), value: tx('Keine Aufgabe ableiten') }];

  return (
    <IntentWizardShell
      title={tx('Offenen Punkt anlegen')}
      currentStep={step} onStepChange={setStep}
      forms={flow.formList} draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Lücke, einen Widerspruch oder ein Risiko mit Verantwortlichem festhalten.'),
        needs: [tx('Die zugehörige Anfrage'), tx('Name des Verantwortlichen')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Zu welcher Kundenanfrage gehört der offene Punkt?')}>
        <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')}
          searchPlaceholder={tx('Ansprechpartner suchen …')} avatar="none" />
      </WizardStep>

      <WizardStep label={tx('Betroffenes')} description={tx('Welche Anforderungen und Quellen sind betroffen? Beides ist optional.')}>
        <div className="space-y-6">
          <Field form={op} name="betroffene_anforderungen">
            <EntitySelectStep {...flow.picks.betroffene_anforderungen.select} {...flow.pickMany('betroffene_anforderungen')}
              searchPlaceholder={tx('Anforderung suchen …')} avatar="none" />
          </Field>
          <Field form={op} name="betroffene_quellen">
            <EntitySelectStep {...flow.picks.betroffene_quellen.select} {...flow.pickMany('betroffene_quellen')}
              searchPlaceholder={tx('Quelle suchen …')} avatar="none" />
          </Field>
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Beschreibung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Beschreibung')} description={tx('Was fehlt, widerspricht sich oder ist riskant — und warum?')}>
        <div className="space-y-4">
          <Bound form={op} name="kurztitel" />
          <Bound form={op} name="beschreibung" rows={4} />
          <Bound form={op} name="punktetyp" />
          <Bound form={op} name="prioritaet" />
          <Bound form={op} name="auswirkung" />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Verantwortlicher')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Verantwortung')} description={tx('Wer kümmert sich bis wann — und wann gilt der Punkt als erledigt?')}>
        <div className="space-y-4">
          <Bound form={op} name="verantwortlicher" />
          <Bound form={op} name="zustaendige_rolle" />
          <Bound form={op} name="faellig_am" />
          <Bound form={op} name="erledigungskriterium" rows={3} />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Aufgabe')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Aufgabe')} description={tx('Optional: Gleich eine Aufgabe zum offenen Punkt ableiten.')}>
        <div className="space-y-4">
          <label className="flex items-center gap-3 rounded-xl border bg-card p-4 cursor-pointer">
            <Checkbox checked={withTask} onCheckedChange={v => toggleTask(v === true)} />
            <span className="text-sm font-medium">{tx('Aufgabe zu diesem Punkt anlegen')}</span>
          </label>
          {withTask && (
            <div className="space-y-4">
              <Bound form={task} name="titel" />
              <Bound form={task} name="beschreibung" rows={3} />
              <Bound form={task} name="aufgabentyp" />
              <Bound form={task} name="verantwortlicher" />
              <Bound form={task} name="prioritaet" />
              <Bound form={task} name="faellig_am" />
            </div>
          )}
          <StepNav
            onBack={() => setStep(4)}
            onNext={() => { if (!withTask) return true; syncTask(); return flow.validateStep(5); }}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep forms={flow.formList} submit={flow.submit} items={taskRow}
            whatHappensNext={tx('Der offene Punkt wird mit Status „zugewiesen“ angelegt und dem Verantwortlichen zugeordnet.')} />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit}
          next={[
            { label: tx('Rückfrage vorbereiten'), href: '#/intents/rueckfrage-vorbereiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Für Klärungsbedarf beim Kunden kannst du jetzt eine Rückfrage vorbereiten.')} />
      )}
    </IntentWizardShell>
  );
}
