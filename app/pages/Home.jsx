import './home.css';

const newsletters = [
  {
    category: 'TECHNOLOGY',
    title: 'The Next Wave',
    description: 'Thoughtful takes on the technology shaping tomorrow.',
    tone: 'blue',
    initials: 'NW',
  },
  {
    category: 'BUSINESS',
    title: 'The Daily Ledger',
    description: 'The business stories worth understanding today.',
    tone: 'gold',
    initials: 'DL',
  },
  {
    category: 'CULTURE',
    title: 'Culture Notes',
    description: 'Ideas, art, and the conversations moving culture.',
    tone: 'rose',
    initials: 'CN',
  },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow_icon">
      <path d="M4 10h11m-4-4 4 4-4 4" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="home_page" id="home">
      <header className="site_header">
        <a className="brand" href="#home" aria-label="Briefly home">
          <span className="brand_mark" aria-hidden="true">
            b
          </span>
          <span>briefly</span>
        </a>

        <nav className="main_nav" aria-label="Main navigation">
          <a className="nav_link active" href="#home">
            Home
          </a>
          <a className="nav_link" href="/newsletters">
            My newsletters
          </a>
          <a className="nav_link" href="#recommendations">
            Recommendations
          </a>
          <a className="nav_link" href="#create">
            Create
          </a>
          <a className="nav_link" href="#settings">
            Settings
          </a>
        </nav>

        <a className="sign_in_link" href="#subscribe">
          Log in <ArrowIcon />
        </a>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero_glow hero_glow_one" aria-hidden="true" />
          <div className="hero_glow hero_glow_two" aria-hidden="true" />
          <div className="hero_copy">
            <p className="eyebrow">
              <span className="eyebrow_dot" />
              Your inbox, with intention
            </p>
            <h1 id="hero-title">
              Your custom
              <br />
              newsletter.
            </h1>
            <p className="hero_description">
              The stories you care about, gathered into one thoughtful brief.
              Made for you, delivered on your terms.
            </p>

            <form className="subscribe_form" id="subscribe">
              <label className="visually_hidden" htmlFor="email">
                Your email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
              />
              <button type="button">
                Subscribe <ArrowIcon />
              </button>
            </form>
            <p className="form_note">A little more signal. A lot less noise.</p>

            <a className="create_link" id="create" href="#recommendations">
              Or create a custom newsletter <ArrowIcon />
            </a>
          </div>

          <div className="brief_preview" aria-label="Example newsletter preview">
            <div className="preview_topline">
              <span className="preview_brand">
                <span className="preview_brand_mark">b</span>
                briefly
              </span>
              <span className="preview_date">YOUR MONDAY BRIEF</span>
            </div>
            <div className="preview_art">
              <span className="art_sun" />
              <span className="art_hill art_hill_back" />
              <span className="art_hill art_hill_front" />
              <span className="art_label">THE BIG PICTURE</span>
            </div>
            <div className="preview_content">
              <p className="preview_kicker">A fresh perspective, every day</p>
              <h2>A better way to keep up.</h2>
              <p className="preview_summary">
                The important ideas, without the endless scroll.
              </p>
              <div className="preview_footer">
                <span>5 stories · 4 min read</span>
                <span className="preview_read" aria-hidden="true">
                  ↗
                </span>
              </div>
            </div>
            <span className="preview_stamp" aria-hidden="true">
              MADE FOR YOU
            </span>
          </div>
        </section>

        <section className="newsletter_section" id="newsletters">
          <div className="section_heading">
            <div>
              <p className="section_eyebrow">A good place to start</p>
              <h2 id="recommendations">Newsletters to explore</h2>
              <p className="section_description">
                Handpicked reads for curious minds.
              </p>
            </div>
            <a className="view_all_link" href="#newsletters">
              View all <ArrowIcon />
            </a>
          </div>

          <div className="newsletter_grid">
            {newsletters.map((newsletter) => (
              <article className="newsletter_card" key={newsletter.title}>
                <div className={`newsletter_art ${newsletter.tone}`}>
                  <span className="card_art_orbit" aria-hidden="true" />
                  <span className="card_initials">{newsletter.initials}</span>
                  <span className="card_category">{newsletter.category}</span>
                </div>
                <div className="card_content">
                  <p className="card_kicker">{newsletter.category}</p>
                  <h3>{newsletter.title}</h3>
                  <p className="card_description">{newsletter.description}</p>
                  <button className="card_subscribe" type="button">
                    Subscribe <ArrowIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <a className="more_button" href="#recommendations">
            More newsletters <ArrowIcon />
          </a>
        </section>
      </main>

      <footer className="site_footer" id="settings">
        <a className="brand footer_brand" href="#home">
          <span className="brand_mark" aria-hidden="true">
            b
          </span>
          <span>briefly</span>
        </a>
        <p>Make room for what matters.</p>
        <span className="footer_note">© 2026 Briefly</span>
      </footer>
    </div>
  );
}
