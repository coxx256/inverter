export function RecommendationsSection() {
  return (
    <section className="mini-section">
      <h2 className="section-title">Recommendations</h2>
      <textarea
        className="ruled short-area"
        name="recommendations"
        placeholder="Recommended corrective actions, parts to replace or follow-up visit…"
      />
    </section>
  );
}
