import { useEffect } from "react";
import content from "./website-content.json";
import "./website.css";

export function Website() {
  useEffect(() => {
    document.title = "SpatialEMU";
  }, []);

  return (
    <main className="emuShell">
      <header className="emuNav" aria-label="Primary">
        <a className="emuBrand" href="/?website=1" aria-label="SpatialEMU preview">
          <span className="emuMark" aria-hidden="true" />
          <span>{content.brand}</span>
        </a>
        <nav className="emuNavLinks">
          {content.nav.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}>
              {item}
            </a>
          ))}
        </nav>
        <a className="emuNavAction" href="#library">
          View library
        </a>
      </header>

      <section className="emuHero">
        <div className="emuHeroCopy">
          <h1>{content.hero.title}</h1>
          <p>{content.hero.subtitle}</p>
          <div className="emuHeroActions">
            <a className="emuPrimaryButton" href="#gameplay">
              {content.hero.primaryCta}
            </a>
            <a className="emuSecondaryButton" href="#library">
              {content.hero.secondaryCta}
            </a>
          </div>
          <div className="emuSourcePill">{content.librarySource.label}</div>
        </div>

        <HeroStage />
      </section>

      <section className="emuProofRow" aria-label="SpatialEMU highlights">
        <article>
          <span>01</span>
          <h2>Vision Pro play</h2>
          <p>Large spatial screen, focused controls, and quick access to the current game shelf.</p>
        </article>
        <article>
          <span>02</span>
          <h2>iPad library</h2>
          <p>Browse covers, filter platforms, and launch portable sessions from the same library.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Your own games</h2>
          <p>FolioSpace provides the personal library source; SpatialEMU handles gameplay.</p>
        </article>
      </section>

      <section className="emuGallery" id="library">
        <div className="emuSectionCopy">
          <p>Game library management</p>
          <h2>{content.gallery.title}</h2>
          <span>{content.gallery.body}</span>
        </div>
        <div className="emuPlatformChips" aria-label="Supported platform filters">
          {content.gallery.platforms.map((platform) => (
            <span key={platform}>{platform}</span>
          ))}
        </div>
        <div className="emuScreenshotGrid">
          {content.gallery.screenshots.map((shot, index) => (
            <figure className={index === 0 ? "featured" : undefined} key={shot.label}>
              <img src={shot.image} alt={`${shot.label} screenshot`} />
              <figcaption>{shot.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="emuSplitSection" id="gameplay">
        <div className="emuDarkPanel">
          <div className="emuSpatialScreen">
            <img src="/website/game-video.png" alt="Vision Pro spatial gameplay preview" />
          </div>
          <div className="emuControllerBar">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <article>
          <p>Vision Pro</p>
          <h2>{content.sections.spatial.title}</h2>
          <span>{content.sections.spatial.body}</span>
        </article>
      </section>

      <section className="emuSystemSection" id="systems">
        <div>
          <p>What can it play?</p>
          <h2>{content.sections.systems.title}</h2>
          <span>{content.sections.systems.body}</span>
        </div>
        <ul>
          {content.sections.systems.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="emuSourceSection">
        <article>
          <p>{content.librarySource.label}</p>
          <h2>{content.sections.files.title}</h2>
          <span>{content.sections.files.body}</span>
        </article>
        <div className="emuSourceCard">
          <strong>SpatialEMU</strong>
          <span>Gameplay, controls, launching</span>
          <i />
          <strong>FolioSpace</strong>
          <span>Personal game library source</span>
        </div>
      </section>
    </main>
  );
}

function HeroStage() {
  return (
    <div className="emuHeroStage" aria-label="SpatialEMU product preview">
      <div className="emuStageBackdrop" aria-hidden="true" />
      <figure className="emuSpatialHero">
        <img src="/website/game-video.png" alt="Vision Pro spatial gameplay screenshot" />
      </figure>
      <figure className="emuIpadHero">
        <img src="/website/home.png" alt="iPad game library screenshot" />
      </figure>
      <div className="emuLibraryDrawer" aria-label="Game library drawer preview">
        <header>
          <strong>Library</strong>
          <span>FolioSpace</span>
        </header>
        <div className="emuGameTiles">
          {content.gallery.platforms.slice(0, 6).map((platform) => (
            <span key={platform}>{platform}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
