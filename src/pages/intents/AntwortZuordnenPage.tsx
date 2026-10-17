/**
 * Antwort zuordnen — 4-Schritt-Wizard.
 * Steps: 1) Rückfrage wählen → 2) Antwort erfassen und Quelle verknüpfen → 3) Antwortstatus bewerten
 *        → 4) Folgeaufgabe zur Prüfung anlegen (optional) → Prüfen & anlegen.
 * Reads: rueckfragen_und_kommunikation, kundenanfragen, offene_punkte, informationsquellen.
 * Writes: rueckfragen_und_kommunikation (Antwort), aufgaben (nur bei Bedarf) — über useAntwortZuordnenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Button } from '@/components/ui/button';
import { fieldText, fieldLookup, fieldRef } from '@/lib/journey';
import { useAntwortZuordnenFlow } from '@/lib/journey/flows/AntwortZuordnen';
import { tx } from '@/i18n';

export default function AntwortZuordnenPage() {
  const [step, setStep] = useState(1);
  const [withTask, setWithTask] = useState(false);

  const flow = useAntwortZuordnenFlow({
    steps: {
      bezieht_sich_auf: 1, anfrage: 1,
      weitere_offene_punkte: 2, quelle: 2, kanal: 2, absender: 2, betreff: 2, inhalt: 2,
      antwortstatus: 3,
      titel: 4, verantwortlicher: 4, faellig_am: 4,
    },
    messages: { anfrage: tx('Bitte zuerst einen Kunden bzw. die zugehörige Anfrage auswählen.') },
    items: {
      bezieht_sich_auf: r => ({ id: r.id, title: fieldText(r, 'betreff'), subtitle: fieldText(r, 'empfaenger') }),
      anfrage: (r, ctx) => ({ id: r.id, title: ctx.ref('kunde') ?? fieldText(r, 'anfrage_ansprechpartner'), subtitle: fieldText(r, 'anfrage_ansprechpartner') }),
      weitere_offene_punkte: r => ({ id: r.id, title: fieldText(r, 'kurztitel'), subtitle: fieldLookup(r, 'status')?.label }),
      quelle: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldText(r, 'absender_oder_urheber') }),
    },
  });

  const komm = flow.forms.rueckfragen_und_kommunikation;
  const aufgabe = flow.forms.aufgaben;
  const anfrageId = typeof komm.get('anfrage') === 'string' ? (komm.get('anfrage') as string) : '';
  const aufgabeAnfrageId = typeof aufgabe.get('anfrage') === 'string' ? (aufgabe.get('anfrage') as string) : '';

  // the follow-up task always belongs to the same inquiry as the answer
  useEffect(() => {
    if (withTask && anfrageId && aufgabeAnfrageId !== anfrageId) {
      aufgabe.set('anfrage', anfrageId, flow.picks.anfrage.labelOf(anfrageId) ?? '');
    }
  }, [withTask, anfrageId, aufgabeAnfrageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickRueckfrage = (id: string) => {
    komm.set('bezieht_sich_auf', id, flow.picks.bezieht_sich_auf.labelOf(id) ?? '');
    const rec = flow.picks.bezieht_sich_auf.recordOf(id);
    const ref = rec ? fieldRef(rec, 'anfrage') : null;
    if (ref) komm.set('anfrage', ref, flow.picks.anfrage.labelOf(ref) ?? '');
  };

  const toggleTask = (on: boolean) => {
    setWithTask(on);
    if (!on) aufgabe.reset();
  };

  const forms = withTask ? flow.formList : [komm];
  const answered = komm.get('bezieht_sich_auf') as string | undefined;

  return (
    <IntentWizardShell
      title={tx('Antwort zuordnen')}
      currentStep={step} onStepChange={setStep}
      forms={forms} draftKey={flow.draftKey}
      intro={{
        description: tx('Eine eingegangene Antwort erfassen, zuordnen und bewerten.'),
        needs: [tx('Die Rückfrage, auf die geantwortet wurde'), tx('Absender und Inhalt der Antwort')],
      }}
    >
      <WizardStep label={tx('Rückfrage')} heading={tx('Rückfrage wählen')} description={tx('Auf welche versendete Rückfrage kam die Antwort? Die Anfrage wird daraus übernommen.')}>
        <div className="space-y-6">
          <EntitySelectStep {...flow.picks.bezieht_sich_auf.select} selectedId={answered ?? null} onSelect={pickRueckfrage}
            searchPlaceholder={tx('Betreff oder Empfänger …')} />
          <Field form={komm} name="anfrage">
            <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} searchPlaceholder={tx('Ansprechpartner …')} />
          </Field>
          <StepNav onNext={() => komm.validate(['anfrage'])} nextStepLabel={tx('Antwort erfassen')} hideBack />
        </div>
      </WizardStep>

      <WizardStep label={tx('Antwort')} heading={tx('Antwort erfassen und Quelle verknüpfen')} description={tx('Was wurde geantwortet, und welche offenen Punkte betrifft es?')}>
        <div className="space-y-6">
          <Field form={komm} name="weitere_offene_punkte">
            <EntitySelectStep {...flow.picks.weitere_offene_punkte.select} {...flow.pickMany('weitere_offene_punkte')} searchPlaceholder={tx('Offenen Punkt suchen …')} />
          </Field>
          <Field form={komm} name="quelle">
            <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} searchPlaceholder={tx('Quelle suchen …')} />
          </Field>
          <Bound form={komm} name="kanal" />
          <Bound form={komm} name="absender" />
          <Bound form={komm} name="betreff" />
          <Bound form={komm} name="inhalt" rows={5} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Status bewerten')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Status')} heading={tx('Antwortstatus bewerten')} description={tx('Wie vollständig beantwortet die Antwort die Rückfrage? Der offene Punkt bleibt dabei offen.')}>
        <div className="space-y-6">
          <Bound form={komm} name="antwortstatus" />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Folgeaufgabe')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Folgeaufgabe')} heading={tx('Folgeaufgabe zur Prüfung anlegen')} description={tx('Muss die Antwort noch geprüft werden? Dann lege hier eine Aufgabe an.')}>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={tx('Folgeaufgabe')}>
            <Button type="button" role="radio" aria-checked={!withTask} variant={withTask ? 'outline' : 'default'} onClick={() => toggleTask(false)}>
              {tx('Keine Folgeaufgabe')}
            </Button>
            <Button type="button" role="radio" aria-checked={withTask} variant={withTask ? 'default' : 'outline'} onClick={() => toggleTask(true)}>
              {tx('Folgeaufgabe anlegen')}
            </Button>
          </div>
          {withTask && (
            <div className="space-y-4">
              <Bound form={aufgabe} name="titel" />
              <Bound form={aufgabe} name="verantwortlicher" />
              <Bound form={aufgabe} name="faellig_am" />
            </div>
          )}
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => (withTask ? aufgabe.validate(['titel', 'verantwortlicher', 'faellig_am', 'anfrage']) : true)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep forms={forms} submit={flow.submit}
            whatHappensNext={tx('Die Antwort wird gespeichert. Der zugehörige offene Punkt wird dadurch nicht erledigt.')} />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep result={flow.submit.result} forms={forms} submit={flow.submit}
          next={[
            { label: tx('Entscheidung dokumentieren'), href: '#/intents/entscheidung-dokumentieren' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]} />
      )}
    </IntentWizardShell>
  );
}
