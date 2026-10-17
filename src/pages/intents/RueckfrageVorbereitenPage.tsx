/**
 * Rückfrage vorbereiten — 5-Schritt-Wizard, erstellt einen Nachrichtenentwurf (kein Versand).
 * Steps: 1) Offene Punkte wählen → 2) Empfänger und Kanal → 3) Betreff und Inhalt → 4) Antwortfrist → 5) Prüfen & als Entwurf speichern.
 * Reads: offene_punkte, kundenanfragen. Writes: rueckfragen_und_kommunikation (Versandstatus „Entwurf“, Antwortstatus „offen“ setzt der Hook).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, Field, StepNav, SummaryStep, SuccessStep.
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
import { useRueckfrageVorbereitenFlow } from '@/lib/journey/flows/RueckfrageVorbereiten';
import { tx } from '@/i18n';

export default function RueckfrageVorbereitenPage() {
  const [step, setStep] = useState(1);
  const flow = useRueckfrageVorbereitenFlow({
    steps: {
      offener_punkt: 1, weitere_offene_punkte: 1, anfrage: 1,
      kommunikationstyp: 2, kanal: 2, absender: 2, empfaenger: 2,
      betreff: 3, inhalt: 3,
      antwort_erwartet_bis: 4,
    },
    items: {
      offener_punkt: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: [fieldLookup(r, 'prioritaet')?.label, fieldLookup(r, 'status')?.label, fieldText(r, 'verantwortlicher')].filter(Boolean).join(' · '),
      }),
      weitere_offene_punkte: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: [fieldLookup(r, 'prioritaet')?.label, fieldLookup(r, 'status')?.label].filter(Boolean).join(' · '),
      }),
      anfrage: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('kunde') ?? tx('Ohne Kunde'),
        subtitle: fieldText(r, 'anfrage_ansprechpartner'),
      }),
    },
    messages: {
      anfrage: tx('Bitte zuerst einen Kunden bzw. die zugehörige Anfrage auswählen.'),
    },
  });
  const f = flow.forms.rueckfragen_und_kommunikation;

  return (
    <IntentWizardShell
      title={tx('Rückfrage vorbereiten')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Aus offenen Punkten einen Nachrichtenentwurf erstellen — nichts wird versendet.'),
        needs: [tx('Mindestens ein offener Punkt'), tx('Zugehörige Anfrage des Kunden')],
      }}
    >
      <WizardStep label={tx('Offene Punkte')} description={tx('Welcher offene Punkt soll geklärt werden? Weitere Punkte kannst du in dieselbe Nachricht aufnehmen.')}>
        <div className="space-y-6">
          <Field form={f} name="offener_punkt">
            <EntitySelectStep {...flow.picks.offener_punkt.select} {...flow.pick('offener_punkt')} />
          </Field>
          <Field form={f} name="weitere_offene_punkte">
            <EntitySelectStep {...flow.picks.weitere_offene_punkte.select} {...flow.pickMany('weitere_offene_punkte')} />
          </Field>
          <Field form={f} name="anfrage">
            <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} searchPlaceholder={tx('Ansprechpartner suchen …')} />
          </Field>
          <StepNav onNext={() => flow.validateStep(1)} nextStepLabel={tx('Empfänger und Kanal')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Empfänger und Kanal')} description={tx('An wen geht die Nachricht und auf welchem Weg?')}>
        <div className="space-y-4">
          <Bound form={f} name="kommunikationstyp" />
          <Bound form={f} name="kanal" />
          <Bound form={f} name="absender" />
          <Bound form={f} name="empfaenger" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Betreff und Inhalt')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Betreff und Inhalt')} description={tx('Formuliere die Rückfrage so, dass sie ohne Kontext verständlich ist.')}>
        <div className="space-y-4">
          <Bound form={f} name="betreff" />
          <Bound form={f} name="inhalt" rows={8} />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Antwortfrist')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Antwortfrist')} description={tx('Bis wann erwartest du eine Antwort?')}>
        <div className="space-y-4">
          <Bound form={f} name="antwort_erwartet_bis" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[
              { key: 'versandstatus', label: tx('Versandstatus'), value: tx('Entwurf') },
              { key: 'antwortstatus', label: tx('Antwortstatus'), value: tx('Offen') },
            ]}
            whatHappensNext={tx('Die Nachricht wird nur als Entwurf gespeichert und nicht versendet.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          title={tx('Entwurf gespeichert')}
          whatHappensNext={tx('Der Punkt wartet jetzt auf den Kunden bzw. intern, bis eine Antwort eingeht.')}
          next={[
            { label: tx('Antwort zuordnen'), href: '#/intents/antwort-zuordnen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
