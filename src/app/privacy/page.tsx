export const metadata = { title: "Privacy · COSME" };

// Plain-language summary of how COSME handles kids' data. Have a lawyer review before launch.
export default function PrivacyPage() {
  return (
    <div className="narrow stack-lg" style={{ paddingBottom: 48 }}>
      <h1>Privacy</h1>
      <p className="notice notice-info">Draft: to be reviewed by a lawyer before COSME launches.</p>
      <div className="stack">
        <h2 style={{ fontSize: 24 }}>Parents own every account</h2>
        <p className="muted">Only adults sign in. Kids under 13 play under a parent&apos;s account, and a parent gives permission before any photo is used.</p>
      </div>
      <div className="stack">
        <h2 style={{ fontSize: 24 }}>Photos are never saved</h2>
        <p className="muted">When you make a hero, the photo is sent to our cartoon maker to draw a cartoon, then thrown away. We keep only the cartoon.</p>
      </div>
      <div className="stack">
        <h2 style={{ fontSize: 24 }}>Community cards are anonymous</h2>
        <p className="muted">If a parent chooses to share a hero, the card shows only the cartoon, name and powers. Nobody can look up who made a card. There are no messages and no locations.</p>
      </div>
      <div className="stack">
        <h2 style={{ fontSize: 24 }}>What we store</h2>
        <p className="muted">The parent&apos;s email, the date permission was given, your heroes and cartoons, and your orders. Payments and shipping addresses are handled by Stripe.</p>
      </div>
      <div className="stack">
        <h2 style={{ fontSize: 24 }}>Delete everything any time</h2>
        <p className="muted">From the parent area you can take a hero out of packs or delete your whole account and all its data.</p>
      </div>
    </div>
  );
}
