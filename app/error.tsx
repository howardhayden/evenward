"use client";

export default function ErrorState({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="cadence-app system-state">
      <section className="system-state__card" role="alert">
        <span className="brand__mark" aria-hidden="true">E</span>
        <h1>The studio paused unexpectedly.</h1>
        <p>No practice reflection or incidental avatar was saved.</p>
        <button className="primary-button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
