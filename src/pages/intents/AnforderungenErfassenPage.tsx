/**
 * Anforderungen erfassen — 4-Schritt-Wizard.
 * Steps: 1) Anfrage wählen → 2) Quelle wählen → 3) Anforderung mit Typ, Sollwert und Ursprung erfassen → 4) Prüfen & anlegen.
 * Reads: kundenanfragen, informationsquellen. Writes: technische_anforderungen (Prüfstatus „ungeprüft“ vom Ablauf gesetzt);
 * die gewählte Anfrage wird vom Ablauf auf „In Prüfung“ gesetzt, sobald der Hook das vorsieht.
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
 * Hook: useAnforderungenErfassenFlow.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup } from '@/lib/journey';
import { useAnforderungenErfassenFlow } from '@/lib/journey/flows/AnforderungenErfassen';
import { tx } from '@/i18n';

export default function AnforderungenErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnforderungenErfassenFlow({
    steps: {
      anfrage: 1, kundenanfragen: 1,
      hauptquelle: 2, weitere_quellen: 2,
      bezeichnung: 3, beschreibung: 3, anforderungstyp: 3, ursprung: 3, sollwert: 3, einheit: 3,
      vergleichsoperator: 3, min_wert: 3, max_wert: 3, ist_pflichtanforderung: 3, verantwortlicher: 3,
    },
    items: {
      anfrage: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'anfragenummer') || ctx.ref('kunde') || tx('Anfrage ohne Nummer'),
        subtitle: ctx.ref('kunde'),
        status: fieldLookup(r, 'status') ?? undefined,
      }),
      hauptquelle: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'quellentyp')?.label }),
      weitere_quellen: r => ({ id: r.id, title: fieldText(r, 'titel'), subtitle: fieldLookup(r, 'quellentyp')?.label }),
    },
  });
  const f = flow.forms.technische_anforderungen;

  // One tap on the inquiry sets the requirement's inquiry AND marks it as the record the flow moves to „In Prüfung“.
  const anfrageProps = flow.pick('anfrage');
  const pickAnfrage = (id: string) => {
    anfrageProps.onSelect(id);
    flow.targets.kundenanfragen.onSelect(id);
  };

  return (
    <IntentWizardShell
      title={tx('Anforderungen erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine technische Anforderung mit Herkunft und Quelle sauber anlegen.'),
        needs: [tx('Die zugehörige Anfrage'), tx('Bezeichnung und Beschreibung'), tx('Sollwert, falls bekannt')],
      }}
    >
      <WizardStep label={tx('Anfrage')} description={tx('Zu welcher Anfrage gehört die Anforderung?')}>
        <EntitySelectStep
          {...flow.picks.anfrage.select}
          selectedId={anfrageProps.selectedId}
          onSelect={pickAnfrage}
          searchPlaceholder={tx('Anfragenummer suchen …')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Quelle')}
        description={tx('Woher stammt die Anforderung? Hauptquelle und weitere Quellen sind optional.')}
        needs={['anfrage']}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{tx('Hauptquelle')}</h3>
            <EntitySelectStep
              {...flow.picks.hauptquelle.select}
              {...flow.pick('hauptquelle')}
              searchPlaceholder={tx('Titel der Quelle …')}
            />
          </div>
          <Field form={f} name="weitere_quellen">
            <EntitySelectStep {...flow.picks.weitere_quellen.select} {...flow.pickMany('weitere_quellen')} />
          </Field>
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Anforderung erfassen')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Anforderung')}
        description={tx('Was wird gefordert, und wie genau ist es festgelegt?')}
        needs={['anfrage']}
      >
        <div className="space-y-4">
          <Bound form={f} name="bezeichnung" />
          <Bound form={f} name="beschreibung" rows={3} />
          <Bound form={f} name="anforderungstyp" />
          <Bound form={f} name="ursprung" />
          <Bound form={f} name="vergleichsoperator" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Bound form={f} name="sollwert" />
            <Bound form={f} name="einheit" />
            <Bound form={f} name="min_wert" />
            <Bound form={f} name="max_wert" />
          </div>
          <Bound form={f} name="ist_pflichtanforderung" />
          <Bound form={f} name="verantwortlicher" />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Anforderung wird als „ungeprüft“ angelegt und der Anfrage zugeordnet.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Offenen Punkt anlegen'), href: '#/intents/offenen-punkt-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
