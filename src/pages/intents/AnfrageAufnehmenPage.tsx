/**
 * Anfrage aufnehmen — 4-Schritt-Wizard.
 * Steps: 1) Kunden auswählen → 2) Anfrage & Kundenanforderungen erfassen → 3) Verantwortlicher, Priorität, Zieltermin
 *        → 4) Erste Quelle (optional) → Prüfen & anlegen.
 * Reads: kunden. Writes: kundenanfragen, informationsquellen (via useAnfrageAufnehmenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText } from '@/lib/journey';
import { useAnfrageAufnehmenFlow } from '@/lib/journey/flows/AnfrageAufnehmen';
import { tx } from '@/i18n';

export default function AnfrageAufnehmenPage() {
  const [step, setStep] = useState(1);
  const flow = useAnfrageAufnehmenFlow({
    steps: {
      kunde: 1,
      eingangskanal: 2, kundenreferenz: 2, produkt_oder_produktfamilie: 2, produktvariante: 2,
      gewuenschte_menge: 2, gewuenschter_liefertermin: 2, anfragebeschreibung: 2, urspruengliche_kundenanforderungen: 2,
      prioritaet: 3, verantwortlicher: 3, zieltermin_klaerung: 3,
      quellentyp: 4, titel: 4, link_oder_referenz: 4, absender_oder_urheber: 4, quellendatum: 4,
    },
    items: {
      kunde: k => {
        const kontakt = fieldText(k, 'ansprechpartner_nachname');
        const nummer = fieldText(k, 'kundennummer');
        return {
          id: k.id,
          title: fieldText(k, 'firmenname'),
          subtitle: [nummer, kontakt].filter(Boolean).join(' · '),
        };
      },
    },
    messages: {
      kunde: tx('Bitte zuerst einen Kunden bzw. die zugehörige Anfrage auswählen.'),
    },
  });
  const qf = flow.forms.kundenanfragen;
  const sf = flow.forms.informationsquellen;

  return (
    <IntentWizardShell
      title={tx('Anfrage aufnehmen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine neue Kundenanfrage erfassen und die erste Quelle zuordnen.'),
        needs: [tx('Kunde'), tx('Beschreibung der Anfrage'), tx('Ursprüngliche Kundenanforderungen')],
      }}
    >
      <WizardStep label={tx('Kunde')} description={tx('Für welchen Kunden kommt die Anfrage?')}>
        <EntitySelectStep
          {...flow.picks.kunde.select}
          {...flow.pick('kunde')}
          searchPlaceholder={tx('Firmenname oder Kundennummer …')}
        />
      </WizardStep>

      <WizardStep
        label={tx('Anfrage')}
        description={tx('Beschreibe die Anfrage und halte die Kundenanforderungen im Original fest.')}
        needs={['kunde']}
      >
        <div className="space-y-4">
          <Bound form={qf} name="eingangskanal" />
          <Bound form={qf} name="kundenreferenz" />
          <Bound form={qf} name="produkt_oder_produktfamilie" />
          <Bound form={qf} name="produktvariante" />
          <Bound form={qf} name="gewuenschte_menge" />
          <Bound form={qf} name="gewuenschter_liefertermin" />
          <Bound form={qf} name="anfragebeschreibung" rows={4} />
          <Bound form={qf} name="urspruengliche_kundenanforderungen" rows={5} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => flow.validateStep(2)}
            nextStepLabel={tx('Zuständigkeit')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Zuständigkeit')}
        description={tx('Wer kümmert sich darum, wie dringend ist es und bis wann soll es geklärt sein?')}
        needs={['kunde']}
      >
        <div className="space-y-4">
          <Bound form={qf} name="prioritaet" />
          <Bound form={qf} name="verantwortlicher" />
          <Bound form={qf} name="zieltermin_klaerung" />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Erste Quelle')}
          />
        </div>
      </WizardStep>

      <WizardStep
        label={tx('Erste Quelle')}
        description={tx('Optional: Woher stammt die Anfrage? Leer lassen, wenn es noch keine Quelle gibt.')}
        needs={['kunde']}
      >
        <div className="space-y-4">
          <Bound form={sf} name="quellentyp" />
          <Bound form={sf} name="titel" />
          <Bound form={sf} name="link_oder_referenz" />
          <Bound form={sf} name="absender_oder_urheber" />
          <Bound form={sf} name="quellendatum" />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'status', label: tx('Status'), value: tx('Neu') },
              { key: 'vollstaendigkeit', label: tx('Vollständigkeit'), value: tx('Ungeprüft') },
            ]}
            whatHappensNext={tx('Die Anfrage wird angelegt; die Anfragenummer vergibt das System.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Anforderungen erfassen'), href: '#/intents/anforderungen-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Als Nächstes erfasst du die technischen Anforderungen zu dieser Anfrage.')}
        />
      )}
    </IntentWizardShell>
  );
}
