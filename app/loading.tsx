export default function Loading() {
  return (
    <main className="cadence-app system-state" aria-busy="true" aria-live="polite">
      <section className="system-state__card">
        <span className="brand__mark" aria-hidden="true">E</span>
        <h1>Opening the studio…</h1>
        <p>Your saved browser settings will be applied when the interface is ready.</p>
      </section>
    </main>
  );
}
