export default function SubscriptionSettingsPage() {
  return (
    <section className="settings_panel subscription_panel" aria-labelledby="subscription-title">
      <div className="settings_page_heading">
        <p className="settings_eyebrow">YOUR PLAN</p>
        <h1 id="subscription-title">Subscription</h1>
        <p>Manage your Briefly plan and billing details.</p>
      </div>
      <div className="subscription_coming_soon">
        <span aria-hidden="true">✳</span>
        <h2>Coming Soon</h2>
        <p>Subscription management will be available here soon.</p>
      </div>
    </section>
  );
}
