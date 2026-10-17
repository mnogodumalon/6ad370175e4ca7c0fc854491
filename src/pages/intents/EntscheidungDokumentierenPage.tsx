/**
 * Entscheidung dokumentieren — 5-Schritt-Wizard + Prüfen.
 * Steps: 1) Anfrage und betroffene Punkte wählen → 2) Beurteilungen wählen → 3) Entscheidung, Begründung, Auflagen
 *        → 4) Verantwortlichen und Kompetenzprüfung → 5) Vorherige Entscheidung ersetzen (optional) → 6) Prüfen & anlegen.
 * Reads: kundenanfragen, technische_anforderungen, offene_punkte, beurteilungen, entscheidungen.
 * Writes: entscheidungen (neu, Status „entschieden“) und optional entscheidungen (alte → „ersetzt“) via useEntscheidungDokumentierenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, Field, Bound, StepNav, SummaryStep, SuccessStep.
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
import { useEntscheidungDokumentierenFlow } from '@/lib/journey/flows/EntscheidungDokumentieren';
import { tx } from '@/i18n';

export default function EntscheidungDokumentierenPage() {
  const [step, setStep] = useState(1);
  const flow = useEntscheidungDokumentierenFlow({
    steps: {
      anfrage: 1, betroffene_anforderungen: 1, betroffene_offene_punkte: 1,
      zugrunde_liegende_beurteilungen: 2,
      titel: 3, entscheidungsgegenstand: 3, entscheidungstyp: 3, alternativen: 3, entscheidung: 3, begruendung: 3, auflagen: 3, gueltig_bis: 3,
      entscheidungsverantwortlicher: 4, entscheidungskompetenz_geprueft: 4,
      entscheidungen2: 5,
    },
    items: {
      anfrage: (r, ctx) => ({
        id: r.id,
        title: fieldText(r, 'anfrage_ansprechpartner') || ctx.ref('kunde') || tx('Anfrage'),
        subtitle: [fieldText(r, 'anfragenummer'), ctx.ref('kunde')].filter(Boolean).join(' · '),
      }),
      betroffene_anforderungen: r => ({
        id: r.id,
        title: fieldText(r, 'bezeichnung'),
        subtitle: fieldLookup(r, 'pruefstatus')?.label ?? '',
      }),
      betroffene_offene_punkte: r => ({
        id: r.id,
        title: fieldText(r, 'kurztitel'),
        subtitle: [fieldLookup(r, 'prioritaet')?.label, fieldLookup(r, 'status')?.label].filter(Boolean).join(' · '),
      }),
      zugrunde_liegende_beurteilungen: r => ({
        id: r.id,
        title: fieldText(r, 'beurteilungsgegenstand'),
        subtitle: [fieldLookup(r, 'einschaetzung')?.label, fieldLookup(r, 'pruefstatus')?.label].filter(Boolean).join(' · '),
      }),
      entscheidungen2: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldLookup(r, 'entscheidungsstatus')?.label ?? '',
      }),
    },
  });
  const f = flow.forms.entscheidungen;

  return (
    <IntentWizardShell
      title={tx('Entscheidung dokumentieren')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Eine Entscheidung mit Begründung festhalten und mit Anforderungen verknüpfen.'),
        needs: [tx('Zugehörige Anfrage'), tx('Entscheidung und Begründung'), tx('Name des Verantwortlichen')],
      }}
    >
      <WizardStep label={tx('Anfrage')} heading={tx('Anfrage und betroffene Punkte wählen')} description={tx('Wähle die Anfrage und, falls vorhanden, die betroffenen Anforderungen und offenen Punkte.')}>
        <div className="space-y-6">
          <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} searchPlaceholder={tx('Ansprechpartner oder Nummer …')} />
          <Field form={f} name="betroffene_anforderungen">
            <EntitySelectStep {...flow.picks.betroffene_anforderungen.select} {...flow.pickMany('betroffene_anforderungen')} />
          </Field>
          <Field form={f} name="betroffene_offene_punkte">
            <EntitySelectStep {...flow.picks.betroffene_offene_punkte.select} {...flow.pickMany('betroffene_offene_punkte')} />
          </Field>
          <StepNav onNext={() => flow.validateStep(1)} nextStepLabel={tx('Beurteilungen')} hideBack />
        </div>
      </WizardStep>

      <WizardStep label={tx('Beurteilungen')} description={tx('Auf welchen Beurteilungen beruht die Entscheidung?')} needs={['anfrage']}>
        <div className="space-y-4">
          <Field form={f} name="zugrunde_liegende_beurteilungen">
            <EntitySelectStep {...flow.picks.zugrunde_liegende_beurteilungen.select} {...flow.pickMany('zugrunde_liegende_beurteilungen')} />
          </Field>
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Entscheidung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Entscheidung')} description={tx('Halte fest, was entschieden wurde und warum.')}>
        <div className="space-y-4">
          <Bound form={f} name="titel" />
          <Bound form={f} name="entscheidungsgegenstand" rows={3} />
          <Bound form={f} name="entscheidungstyp" />
          <Bound form={f} name="alternativen" rows={3} />
          <Bound form={f} name="entscheidung" rows={3} />
          <Bound form={f} name="begruendung" rows={4} />
          <Bound form={f} name="auflagen" rows={3} />
          <Bound form={f} name="gueltig_bis" />
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Verantwortlicher')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Verantwortlicher')} description={tx('Wer entscheidet, und ist die Entscheidungskompetenz geprüft?')}>
        <div className="space-y-4">
          <Bound form={f} name="entscheidungsverantwortlicher" />
          <Bound form={f} name="entscheidungskompetenz_geprueft" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Vorherige Entscheidung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Ersetzen')} heading={tx('Vorherige Entscheidung ersetzen')} description={tx('Optional: Wähle eine frühere Entscheidung, die durch diese ersetzt wird.')}>
        <div className="space-y-4">
          <EntitySelectStep {...flow.picks.entscheidungen2.select} {...flow.pick('entscheidungen2')} searchPlaceholder={tx('Titel suchen …')} />
          <StepNav onBack={() => setStep(4)} onNext={() => flow.validateStep(5)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Entschieden') }]}
            whatHappensNext={tx('Die Entscheidung wird als entschieden gespeichert; eine gewählte frühere Entscheidung gilt danach als ersetzt.')}
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
            { label: tx('Rückfrage vorbereiten'), href: '#/intents/rueckfrage-vorbereiten' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
