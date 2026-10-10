import { useState } from 'react';

export default function ShareBox({ url, cardUrl, text, heading = 'Share it' }) {
  const [copied, setCopied] = useState(false);
  const pretty = url.replace(/^https?:\/\//, '');
  const enc = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link:', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    try {
      const blob = await fetch(cardUrl).then((r) => r.blob());
      const file = new File([blob], 'my-result.png', { type: 'image/png' });
      const data = { title: text, text, url };
      if (navigator.canShare?.({ files: [file] })) data.files = [file];
      await navigator.share(data);
    } catch {
      /* closed the sheet */
    }
  }

  const links = [
    ['X', `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`],
    ['WhatsApp', `https://wa.me/?text=${enc(`${text} ${url}`)}`],
    ['Reddit', `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
  ];

  return (
    <section className="share">
      <h2 className="share-heading">{heading}</h2>
      {cardUrl && (
        <a href={cardUrl} target="_blank" rel="noreferrer" className="share-card">
          <img src={cardUrl} alt="Your share card" width="1200" height="630" />
        </a>
      )}
      <div className="share-link">
        <span className="share-url" title={url}>
          {pretty}
        </span>
        <button className="btn btn-small btn-ink" onClick={copy}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <div className="share-buttons">
        {typeof navigator !== 'undefined' && navigator.share && (
          <button className="chip chip-solid" onClick={nativeShare}>
            Share…
          </button>
        )}
        {links.map(([name, href]) => (
          <a key={name} className="chip" href={href} target="_blank" rel="noreferrer">
            {name}
          </a>
        ))}
        {cardUrl && (
          <a className="chip" href={cardUrl} download="my-result.png">
            Save image
          </a>
        )}
      </div>
    </section>
  );
}
