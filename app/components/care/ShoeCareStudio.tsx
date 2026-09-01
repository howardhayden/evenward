"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CARE_MOTION_MODES,
  CARE_CONTACTS,
  CARE_REGIONS,
  CARE_SHOES,
  CARE_UNAVAILABLE_REASONS,
  careTarget,
  createCarePublicSnapshot,
  describeCareState,
  nextCareRunId,
  type CareContact,
  type CareEvent,
  type CareMotionMode,
  type CareRegion,
  type CareShoe,
  type CareState,
  type CareUnavailableReason,
} from "../../domain/footwear-care";
import { LeatherFootwearRenderer } from "./LeatherFootwearRenderer";

type ShoeCareStudioProps = {
  state: CareState;
  rejection: string | null;
  onEvent: (event: CareEvent) => void;
  onRendererContactLoss: () => void;
  onCancelAtReleasedBoundary: () => void;
  motionReductionRequired: boolean;
};

const STAGES = [
  ["compatibility", "Compatibility"],
  ["prepare", "Prepare"],
  ["apply", "Apply"],
  ["work", "Work"],
  ["water", "Water"],
  ["set", "Set"],
  ["finish", "Finish"],
  ["complete", "Complete"],
] as const;

const UNAVAILABLE_LABELS: Readonly<Record<CareUnavailableReason, string>> = {
  "unknown-material": "Material is unknown",
  suede: "Suede",
  nubuck: "Nubuck",
  "patent-leather": "Patent leather",
  "shell-cordovan": "Shell cordovan",
  "exotic-leather": "Exotic leather",
  "oiled-leather": "Oiled leather",
  "damaged-finish": "Damaged finish",
  "synthetic-material": "Synthetic material",
  "incompatible-product": "Different or incompatible product",
  "maker-does-not-permit-wax-glazing": "Maker does not permit wax glazing",
};

const MODE_LABELS: Readonly<Record<CareMotionMode, string>> = {
  normal: "Normal demonstration",
  reduced: "Reduced demonstration",
  still: "Still presentation",
};

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase());
}

export function restartMotionForRequirement(
  requestedMotion: CareMotionMode,
  motionReductionRequired: boolean,
): CareMotionMode {
  return motionReductionRequired && requestedMotion === "normal"
    ? "reduced"
    : requestedMotion;
}

const RENDERER_FAILURE_ANNOUNCEMENT =
  "The 3D reference is unavailable. Do not begin or resume contact. Use the written state description while the reference is unavailable.";

export function studioAlertMessage(
  rendererAvailable: boolean | null,
  stateError: string | null,
  rejection: string | null,
) {
  if (stateError) return stateError;
  if (rendererAvailable === false) return RENDERER_FAILURE_ANNOUNCEMENT;
  return rejection;
}

export function rendererContactActionPolicy(
  rendererAvailable: boolean | null,
  contact: CareContact,
): "continue" | "wait" | "release" {
  if (rendererAvailable === true) return "continue";
  return contact === "approach" || contact === "contact" ? "release" : "wait";
}

export function ShoeCareStudio({
  state,
  rejection,
  onEvent,
  onRendererContactLoss,
  onCancelAtReleasedBoundary,
  motionReductionRequired,
}: ShoeCareStudioProps) {
  const snapshot = useMemo(() => createCarePublicSnapshot(state), [state]);
  const description = useMemo(() => describeCareState(state), [state]);
  const compatibilityScope = `${state.runId}:${state.revision}:${state.shoe}:${state.region}:compatibility`;
  const emptyCompatibility = {
    blackSmoothFinishedLeather: false,
    productLabelPermitsWaxGlazing: false,
    hiddenAreaTestCompleted: false,
  };
  const [compatibilityEntry, setCompatibilityEntry] = useState({
    scope: compatibilityScope,
    values: emptyCompatibility,
  });
  const compatibility =
    compatibilityEntry.scope === compatibilityScope
      ? compatibilityEntry.values
      : emptyCompatibility;
  const preparationScope = `${state.runId}:${state.revision}:${state.shoe}:${state.region}:prepare`;
  const emptyPreparation = { lacesAndDebrisCleared: false, leatherDry: false };
  const [preparationEntry, setPreparationEntry] = useState({
    scope: preparationScope,
    values: emptyPreparation,
  });
  const preparation =
    preparationEntry.scope === preparationScope
      ? preparationEntry.values
      : emptyPreparation;
  const [unavailableReason, setUnavailableReason] =
    useState<CareUnavailableReason>("unknown-material");
  const waterScope = `${state.runId}:${state.revision}:${state.shoe}:${state.region}:water`;
  const [waterEntry, setWaterEntry] = useState({ scope: waterScope, checked: false });
  const waterPermitted = waterEntry.scope === waterScope && waterEntry.checked;
  const waterChoiceScope = `${state.runId}:${state.revision}:${state.shoe}:${state.region}:work-water-choice`;
  const emptyWaterChoice = { labelPermits: false, resistanceFelt: false };
  const [waterChoiceEntry, setWaterChoiceEntry] = useState({
    scope: waterChoiceScope,
    values: emptyWaterChoice,
  });
  const waterChoice =
    waterChoiceEntry.scope === waterChoiceScope
      ? waterChoiceEntry.values
      : emptyWaterChoice;
  const waitScope = `${state.runId}:${state.revision}:${state.shoe}:${state.region}:set`;
  const [waitEntry, setWaitEntry] = useState({ scope: waitScope, checked: false });
  const waitComplete = waitEntry.scope === waitScope && waitEntry.checked;
  const [announcement, setAnnouncement] = useState(state.message);
  const announcementClock = useRef(0);
  const announcementTimer = useRef<number | null>(null);
  const descriptionPulse = useRef(false);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const focusPrimaryOnNextRevision = useRef(false);
  const [rendererAvailable, setRendererAvailable] = useState<boolean | null>(null);

  const submit = (event: CareEvent) => onEvent(event);
  const submitAndRefocusPrimary = (event: CareEvent) => {
    focusPrimaryOnNextRevision.current = true;
    onEvent(event);
  };
  const cancelAndRefocusPrimary = () => {
    focusPrimaryOnNextRevision.current = true;
    onCancelAtReleasedBoundary();
  };

  useEffect(() => {
    if (state.error) return;
    if (announcementTimer.current !== null) window.clearTimeout(announcementTimer.current);
    const now = window.performance.now();
    const delay = Math.max(0, 1_000 - (now - announcementClock.current));
    const publish = () => {
      announcementClock.current = window.performance.now();
      setAnnouncement(state.message);
      announcementTimer.current = null;
    };
    if (delay === 0) publish();
    else announcementTimer.current = window.setTimeout(publish, delay);
    return () => {
      if (announcementTimer.current !== null) {
        window.clearTimeout(announcementTimer.current);
        announcementTimer.current = null;
      }
    };
  }, [state.error, state.message, state.revision, state.runId]);

  const revision = state.revision;
  const eventIdentity = {
    expectedRevision: revision,
    expectedRunId: state.runId,
  } as const;
  const handleRendererCapabilityChange = useCallback(
    (available: boolean) => {
      setRendererAvailable(available);
      if (
        available ||
        !(state.contact === "approach" || state.contact === "contact") ||
        state.status !== "active"
      ) {
        return;
      }
      onRendererContactLoss();
    },
    [onRendererContactLoss, state],
  );
  const contactNeedsRelease = state.contact === "approach" || state.contact === "contact";
  const atSafeBoundary = !contactNeedsRelease;
  const selectedAmount = snapshot.selectedCareAmount;
  const statusTerminal =
    state.status === "complete" ||
    state.status === "cancelled" ||
    state.status === "unavailable";
  const targetLocked = state.targetLocked;
  const rendererRecoveryRequired =
    state.status === "paused" &&
    state.error?.startsWith("The presentation became unavailable") === true;
  const alertMessage = studioAlertMessage(
    rendererAvailable,
    state.error,
    rejection,
  );
  const stillScope = `${state.runId}:${state.revision}:${state.stage}:${state.tool}:${state.contact}:still`;
  const canonicalStillIndex = CARE_CONTACTS.indexOf(state.contact);
  const [stillEntry, setStillEntry] = useState({ scope: stillScope, index: canonicalStillIndex });
  const stillIndex = stillEntry.scope === stillScope ? stillEntry.index : canonicalStillIndex;
  const representativeContact = CARE_CONTACTS[stillIndex] ?? state.contact;
  const restartEvent = (): CareEvent => ({
    type: "RESTART",
    ...eventIdentity,
    runId: nextCareRunId(state.runId, revision),
    motion: restartMotionForRequirement(
      state.requestedMotion,
      motionReductionRequired,
    ),
  });
  const primaryAction: Readonly<{
    label: string;
    disabled: boolean;
    event: CareEvent;
  }> | null = (() => {
    if (statusTerminal) {
      return { label: "Start a new in-memory run", disabled: false, event: restartEvent() };
    }
    if (state.status === "paused") {
      return {
        label:
          rendererRecoveryRequired && rendererAvailable !== true
            ? "Resume when the 3D reference is available"
            : "Resume this stage",
        disabled: rendererRecoveryRequired && rendererAvailable !== true,
        event: { type: "RESUME", ...eventIdentity },
      };
    }
    if (state.stage === "compatibility" && state.status === "checking") {
      return {
        label: "Confirm compatibility and continue",
        disabled: !Object.values(compatibility).every(Boolean),
        event: {
          type: "CONFIRM_COMPATIBILITY",
          ...eventIdentity,
          confirmations: { ...compatibility, productProfile: "saphir-amiral-gloss" },
        },
      };
    }
    if (state.stage === "prepare" && state.status === "ready") {
      return {
        label: "Confirm preparation and continue",
        disabled: !Object.values(preparation).every(Boolean),
        event: { type: "CONFIRM_PREPARATION", ...eventIdentity, confirmations: preparation },
      };
    }
    if (state.stage === "apply" && state.status === "active") {
      return {
        label: `Thin amount placed on ${state.shoe} ${state.region}`,
        disabled: false,
        event: { type: "PLACE_THIN_AMOUNT", ...eventIdentity },
      };
    }
    if (state.stage === "water" && state.status === "active") {
      return {
        label: "Declare one clean-water drop and return to work",
        disabled: !waterPermitted,
        event: {
          type: "CONTINUE_WITH_ONE_WATER_DROP",
          ...eventIdentity,
          productLabelPermitsOneDrop: true,
        },
      };
    }
    if (state.stage === "set" && state.status === "active") {
      return {
        label: "Confirm product-directed wait complete",
        disabled: !waitComplete,
        event: {
          type: "CONFIRM_WAIT_COMPLETE",
          ...eventIdentity,
          productDirectedWaitCompleted: true,
        },
      };
    }
    if (
      state.status === "active" &&
      (state.stage === "work" || state.stage === "finish")
    ) {
      const rendererContactPolicy = rendererContactActionPolicy(
        rendererAvailable,
        state.contact,
      );
      if (rendererContactPolicy === "release") {
        return {
          label:
            state.contact === "approach"
              ? "Withdraw while the 3D reference is unavailable"
              : "Release while the 3D reference is unavailable",
          disabled: false,
          event: { type: "RELEASE", ...eventIdentity },
        };
      }
      if (rendererContactPolicy === "wait") {
        return {
          label: "Approach when the 3D reference is available",
          disabled: true,
          event: { type: "APPROACH", ...eventIdentity },
        };
      }
      if (state.contact === "approach") {
        return {
          label: `Confirm ${titleCase(state.tool)} contact`,
          disabled: false,
          event: { type: "BEGIN_CONTACT", ...eventIdentity },
        };
      }
      if (state.contact === "contact") {
        if (state.stage === "finish") {
          return {
            label: "Finish light non-brush pass and release",
            disabled: false,
            event: { type: "FINISH_PASS_RELEASED", ...eventIdentity },
          };
        }
        return selectedAmount < 1
          ? {
              label: "Record one modeled contact cycle and release",
              disabled: false,
              event: { type: "RECORD_CONTACT_CYCLE", ...eventIdentity },
            }
          : {
              label: "Release at modeled upper bound",
              disabled: false,
              event: { type: "RELEASE", ...eventIdentity },
            };
      }
      return {
        label: `Approach ${state.shoe} ${state.region} with ${titleCase(state.tool)}`,
        disabled: false,
        event: { type: "APPROACH", ...eventIdentity },
      };
    }
    return null;
  })();

  useEffect(() => {
    if (!focusPrimaryOnNextRevision.current) return;
    focusPrimaryOnNextRevision.current = false;
    primaryActionRef.current?.focus();
  }, [state.revision, state.runId]);

  useEffect(() => {
    if (rejection) focusPrimaryOnNextRevision.current = false;
  }, [rejection]);

  return (
    <section
      className="care-studio"
      data-care-surface="true"
      data-care-revision={state.revision}
      aria-labelledby="care-title"
    >
      <div className="care-studio__intro">
        <div>
          <p className="eyebrow">Footwear care · reference sequence</p>
          <h1 id="care-title">Black leather shoe care</h1>
          <p className="lede">
            This sequence supports only confirmed black, smooth, finished leather and
            the registered Saphir Amiral Gloss profile. The product&apos;s current label
            and warnings govern physical use.
          </p>
        </div>
        <div className="care-boundary" role="note">
          <strong>Pre-production reference</strong>
          <span>
            The visual is an unrated procedural model. It does not verify a physical shoe,
            measure polish, or satisfy the production footwear evidence gate.
          </span>
        </div>
      </div>

      <ol className="care-wayfinder" aria-label="Care stages">
        {STAGES.map(([id, label], index) => {
          const currentIndex = STAGES.findIndex(([stage]) => stage === state.stage);
          const optionalWaterWithoutHistory = id === "water" && index < currentIndex;
          const stageState = index === currentIndex
            ? "current"
            : optionalWaterWithoutHistory
              ? "optional-unrecorded"
              : index < currentIndex
                ? "past"
                : "future";
          const stageLabel = id === "water"
            ? optionalWaterWithoutHistory
              ? "Water (optional; visit not recorded)"
              : "Water (optional)"
            : label;
          return (
            <li key={id} data-stage-state={stageState} aria-current={stageState === "current" ? "step" : undefined}>
              <span aria-hidden="true">{index + 1}</span>
              <span>{stageLabel}</span>
            </li>
          );
        })}
      </ol>

      <div className="care-layout">
        <div className="care-visual-card">
          <LeatherFootwearRenderer
            shoe={state.shoe}
            region={state.region}
            careAmount={state.careAmount}
            motionMode={state.presentedMotion}
            contact={state.contact}
            representativeContact={
              state.presentedMotion === "still" ? representativeContact : state.contact
            }
            stage={state.stage}
            tool={state.tool}
            domainFailureAcknowledged={
              state.status === "paused" &&
              state.error?.startsWith("The presentation became unavailable") === true
            }
            onCapabilityChange={handleRendererCapabilityChange}
          />
          <div className="care-visual-card__caption">
            <span>
              {titleCase(state.shoe)} shoe · {titleCase(state.region)} · {titleCase(state.contact)}
            </span>
            <span>
              3D reference {rendererAvailable === null ? "checking" : rendererAvailable ? "available" : "unavailable"}
            </span>
          </div>
        </div>

        <div className="care-control-card">
          <div className="care-status-row">
            <div>
              <span>Status</span>
              <strong>{titleCase(state.status)}</strong>
            </div>
            <div>
              <span>Stage</span>
              <strong>{titleCase(state.stage)}</strong>
            </div>
            <div>
              <span>Tool</span>
              <strong>{titleCase(state.tool)}</strong>
            </div>
            <div>
              <span>Modeled value</span>
              <strong>{selectedAmount.toFixed(3)}</strong>
            </div>
          </div>

          <div className="care-instruction" aria-labelledby="care-instruction-title">
            <p className="eyebrow">Current instruction</p>
            <h2 id="care-instruction-title">{snapshot.operativeCopy.title}</h2>
            <p>{snapshot.operativeCopy.instruction}</p>
            <p className="care-modeled-notice">{snapshot.operativeCopy.modeledStateNotice}</p>
            <p className="care-recovery"><strong>Recovery:</strong> {snapshot.operativeCopy.recovery}</p>
          </div>

          {state.stage === "compatibility" && state.status === "checking" && (
            <div className="care-step-panel">
              <fieldset>
                <legend>Confirm every compatibility fact</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={compatibility.blackSmoothFinishedLeather}
                    onChange={(event) => setCompatibilityEntry({
                      scope: compatibilityScope,
                      values: { ...compatibility, blackSmoothFinishedLeather: event.target.checked },
                    })}
                  />
                  The footwear maker identifies this as black, smooth, finished leather.
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={compatibility.productLabelPermitsWaxGlazing}
                    onChange={(event) => setCompatibilityEntry({
                      scope: compatibilityScope,
                      values: { ...compatibility, productLabelPermitsWaxGlazing: event.target.checked },
                    })}
                  />
                  The current Saphir Amiral Gloss label permits wax glazing on this rigid region.
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={compatibility.hiddenAreaTestCompleted}
                    onChange={(event) => setCompatibilityEntry({
                      scope: compatibilityScope,
                      values: { ...compatibility, hiddenAreaTestCompleted: event.target.checked },
                    })}
                  />
                  An inconspicuous-area test has been completed without an observed problem.
                </label>
              </fieldset>
              <div className="care-unavailable">
                <label htmlFor="care-unavailable-reason">If any fact cannot be confirmed, choose the reason</label>
                <div>
                  <select
                    id="care-unavailable-reason"
                    value={unavailableReason}
                    onChange={(event) => setUnavailableReason(event.target.value as CareUnavailableReason)}
                  >
                    {CARE_UNAVAILABLE_REASONS.map((reason) => (
                      <option value={reason} key={reason}>{UNAVAILABLE_LABELS[reason]}</option>
                    ))}
                  </select>
                  <button
                    className="care-secondary-button"
                    onClick={() => submitAndRefocusPrimary({
                      type: "DECLARE_UNAVAILABLE",
                      ...eventIdentity,
                      reason: unavailableReason,
                    })}
                  >
                    Stop this sequence
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.stage === "prepare" && state.status === "ready" && (
            <div className="care-step-panel">
              <fieldset>
                <legend>Confirm preparation</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={preparation.lacesAndDebrisCleared}
                    onChange={(event) => setPreparationEntry({
                      scope: preparationScope,
                      values: { ...preparation, lacesAndDebrisCleared: event.target.checked },
                    })}
                  />
                  Laces are removed or secured and loose debris is removed.
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={preparation.leatherDry}
                    onChange={(event) => setPreparationEntry({
                      scope: preparationScope,
                      values: { ...preparation, leatherDry: event.target.checked },
                    })}
                  />
                  The leather is dry.
                </label>
              </fieldset>
            </div>
          )}

          {state.stage === "apply" && state.status === "active" && (
            <div className="care-step-panel">
              <p>Use a cotton cloth. Place a thin amount only on the selected rigid region. Keep flex, seams, welt, and sole clear.</p>
            </div>
          )}

          {state.stage === "work" && state.status === "active" && (
            <div className="care-step-panel">
              <div className="care-action-grid">
                {contactNeedsRelease && (
                  <button className="care-secondary-button" onClick={() => submit({ type: "RELEASE", ...eventIdentity })}>
                    Release without modeled progress
                  </button>
                )}
              </div>
              {atSafeBoundary && state.cycleRecordedThisPass && (
                <div className="care-action-grid care-action-grid--split">
                  {selectedAmount < 1 && (
                    <fieldset className="care-water-choice">
                      <legend>Optional water gate for this pass</legend>
                      <label>
                        <input
                          type="checkbox"
                          checked={waterChoice.resistanceFelt}
                          onChange={(event) => setWaterChoiceEntry({
                            scope: waterChoiceScope,
                            values: { ...waterChoice, resistanceFelt: event.target.checked },
                          })}
                        />
                        Resistance is presently felt; this screen does not infer it.
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={waterChoice.labelPermits}
                          onChange={(event) => setWaterChoiceEntry({
                            scope: waterChoiceScope,
                            values: { ...waterChoice, labelPermits: event.target.checked },
                          })}
                        />
                        The current Saphir Amiral Gloss label permits one clean-water drop now.
                      </label>
                      <button
                        className="care-secondary-button"
                        disabled={!waterChoice.resistanceFelt || !waterChoice.labelPermits}
                        onClick={() => submit({
                          type: "CHOOSE_WATER",
                          ...eventIdentity,
                          productLabelPermitsOneDrop: true,
                          resistanceFelt: true,
                        })}
                      >
                        Declare resistance and current-label permission; continue to one drop
                      </button>
                    </fieldset>
                  )}
                  <button className="care-secondary-button" onClick={() => submit({ type: "CHOOSE_SET", ...eventIdentity })}>
                    Continue to the product-directed wait
                  </button>
                </div>
              )}
            </div>
          )}

          {state.stage === "water" && state.status === "active" && (
            <div className="care-step-panel">
              <label className="care-check-row">
                <input
                  type="checkbox"
                  checked={waterPermitted}
                  onChange={(event) => setWaterEntry({ scope: waterScope, checked: event.target.checked })}
                />
                The registered product&apos;s current label permits one drop of clean water at this point.
              </label>
            </div>
          )}

          {state.stage === "set" && state.status === "active" && (
            <div className="care-step-panel">
              <label className="care-check-row">
                <input
                  type="checkbox"
                  checked={waitComplete}
                  onChange={(event) => setWaitEntry({ scope: waitScope, checked: event.target.checked })}
                />
                The reviewed profile&apos;s 30-minute final dry without brushing is complete,
                and the current physical label still gives that direction. Every cloth and brush stayed clear.
              </label>
            </div>
          )}

          {state.stage === "finish" && state.status === "active" && (
            <div className="care-step-panel">
              <div className="care-action-grid">
                {contactNeedsRelease && (
                  <button className="care-secondary-button" onClick={() => submit({ type: "RELEASE", ...eventIdentity })}>
                    Release without completing
                  </button>
                )}
              </div>
            </div>
          )}

          {state.status === "paused" && (
            <div className="care-step-panel care-step-panel--state">
              <p>The run is paused at a safe contact boundary. No timer or animation can advance it.</p>
              <button
                className="care-secondary-button"
                onClick={() => submitAndRefocusPrimary(restartEvent())}
              >
                Restart from compatibility
              </button>
            </div>
          )}

          {statusTerminal && (
            <div className="care-step-panel care-step-panel--state">
              <p>{state.message}</p>
              {state.status === "complete" && (
                <div className="care-completion-report">
                  <p>Physical finish: not measured or declared by this reference.</p>
                  <table>
                    <caption>In-memory modeled values at final release</caption>
                    <thead>
                      <tr><th scope="col">Target</th><th scope="col">Modeled value</th><th scope="col">Modeled run status</th></tr>
                    </thead>
                    <tbody>
                      {CARE_SHOES.flatMap((shoe) => CARE_REGIONS.map((region) => {
                        const amount = state.careAmount[careTarget(shoe, region)];
                        return (
                          <tr key={careTarget(shoe, region)}>
                            <th scope="row">{titleCase(shoe)} {titleCase(region)}</th>
                            <td>{amount.toFixed(3)}</td>
                            <td>{amount > 0 ? "Recorded" : "Not treated"}</td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                  <p>Flex, seams, welt, sole, and every unlisted material region were excluded from treatment.</p>
                </div>
              )}
            </div>
          )}

          {primaryAction && (
            <div className="care-primary-action-slot">
              <button
                ref={primaryActionRef}
                className="primary-button"
                aria-disabled={primaryAction.disabled}
                onClick={() => {
                  if (primaryAction.disabled) return;
                  submit(primaryAction.event);
                }}
              >
                {primaryAction.label}
              </button>
            </div>
          )}

          {alertMessage && (
            <p className="care-alert" role="alert">{alertMessage}</p>
          )}
        </div>
      </div>

      {state.presentedMotion === "still" && (
        <section className="care-still-controls" aria-labelledby="care-still-title">
          <div>
            <p className="eyebrow">Still presentation</p>
            <h2 id="care-still-title">Representative phase controls</h2>
            <p>
              Representative phase {titleCase(representativeContact)} is visual only.
              Canonical contact remains {titleCase(state.contact)} and modeled progress cannot change here.
            </p>
          </div>
          <div className="care-action-grid" role="group" aria-label="Still presentation controls">
            <button
              className="care-secondary-button"
              disabled={stillIndex === 0}
              onClick={() => setStillEntry({ scope: stillScope, index: Math.max(0, stillIndex - 1) })}
            >
              Previous phase
            </button>
            <button
              className="care-secondary-button"
              disabled={stillIndex === CARE_CONTACTS.length - 1}
              onClick={() => setStillEntry({
                scope: stillScope,
                index: Math.min(CARE_CONTACTS.length - 1, stillIndex + 1),
              })}
            >
              Next phase
            </button>
            <button
              className="care-secondary-button"
              onClick={() => {
                if (announcementTimer.current !== null) {
                  window.clearTimeout(announcementTimer.current);
                  announcementTimer.current = null;
                }
                announcementClock.current = window.performance.now();
                descriptionPulse.current = !descriptionPulse.current;
                setAnnouncement(
                  `${description} Still representative phase ${representativeContact}; canonical contact ${state.contact}.${
                    descriptionPulse.current ? "\u2060" : "\u2060\u2060"
                  }`,
                );
              }}
            >
              Describe current state
            </button>
            <button
              className="care-secondary-button"
              disabled={contactNeedsRelease}
              onClick={() => submitAndRefocusPrimary(restartEvent())}
            >
              Restart this in-memory run
            </button>
          </div>
        </section>
      )}

      <section className="care-settings" aria-labelledby="care-settings-title">
        <div>
          <p className="eyebrow">Target and presentation</p>
          <h2 id="care-settings-title">Change only at a released boundary</h2>
          <p>Choose the shoe and rigid region only during Compatibility or Prepare. Confirming preparation locks that target for the rest of this reference run.</p>
        </div>
        <fieldset className="care-setting-group">
          <legend>Shoe</legend>
          <div className="care-segmented care-segmented--two">
            {CARE_SHOES.map((shoe: CareShoe) => (
              <button
                key={shoe}
                aria-pressed={shoe === state.shoe}
                disabled={contactNeedsRelease || state.status === "paused" || statusTerminal || targetLocked}
                onClick={() => submit({ type: "SELECT_SHOE", ...eventIdentity, shoe })}
              >
                {titleCase(shoe)} shoe
                <small>
                  Toe {state.careAmount[careTarget(shoe, "toe")].toFixed(3)} · heel {state.careAmount[careTarget(shoe, "heel")].toFixed(3)}
                </small>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="care-setting-group">
          <legend>Rigid care region</legend>
          <div className="care-segmented care-segmented--two">
            {CARE_REGIONS.map((region: CareRegion) => (
              <button
                key={region}
                aria-pressed={region === state.region}
                disabled={contactNeedsRelease || state.status === "paused" || statusTerminal || targetLocked}
                onClick={() => submit({ type: "SELECT_REGION", ...eventIdentity, region })}
              >
                {titleCase(region)}
                <small>{state.careAmount[careTarget(state.shoe, region)].toFixed(3)} modeled</small>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="care-setting-group">
          <legend>Motion presentation</legend>
          <div className="care-segmented">
            {CARE_MOTION_MODES.map((motion) => (
              <button
                key={motion}
                aria-pressed={state.presentedMotion === motion}
                aria-disabled={state.presentedMotion === motion}
                disabled={
                  contactNeedsRelease ||
                  statusTerminal ||
                  (motionReductionRequired && motion === "normal")
                }
                onClick={() => {
                  if (state.presentedMotion === motion) return;
                  submit({ type: "SET_MOTION_MODE", ...eventIdentity, mode: motion });
                }}
              >
                {MODE_LABELS[motion]}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="care-description" aria-labelledby="care-description-title">
        <div>
          <p className="eyebrow">Complete nonvisual state</p>
          <h2 id="care-description-title">Current state description</h2>
        </div>
        <p>{description}</p>
      </section>

      {!statusTerminal && (
        <div className="care-run-controls" role="group" aria-label="Care run controls">
          <button
            className="care-secondary-button"
            disabled={contactNeedsRelease || state.stage === "compatibility" || state.status === "paused"}
            onClick={() => submit({ type: "BACK", ...eventIdentity })}
          >
            Back to preceding safe boundary
          </button>
          <button
            className="care-secondary-button"
            disabled={contactNeedsRelease || state.status === "paused"}
            onClick={() => submit({ type: "PAUSE", ...eventIdentity })}
          >
            Pause
          </button>
          <button
            className="care-secondary-button care-secondary-button--danger"
            onClick={cancelAndRefocusPrimary}
          >
            Cancel and discard modeled values
          </button>
        </div>
      )}

      {contactNeedsRelease && (
        <p className="care-release-note">
          Release contact before changing the target, mode, stage, or pause state.
          Cancel first withdraws or releases contact, then discards the modeled values.
        </p>
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </section>
  );
}

export default ShoeCareStudio;
