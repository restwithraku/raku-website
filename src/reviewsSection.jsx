import React, { useEffect, useState } from 'react';
import { Check, MessageCircle, Send, Star } from 'lucide-react';
import { reviews as localReviews } from './reviews.js';
import { REVIEWS_ENDPOINT } from './config.js';
import { productGroups } from './products.js';

// Design preview only: on the local dev server, add ?demo-reviews to the address to see sample cards.
// They are clearly labelled and never included in the production build (import.meta.env.DEV is false there).
const DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo-reviews');
const demoReviews = DEMO ? [
  { name: 'Sample name', city: 'City', product: 'Bed mattress · 4″', rating: 5, text: 'Sample review text, shown only in the local design preview. Replace with a genuine customer review.', date: '2026-11', source: 'Sample' },
  { name: 'Sample name', city: 'City', product: 'PU foam mattress · Custom', rating: 4, text: 'A second sample card so the layout can be checked with more than one review.', date: '2026-10', source: 'Sample' },
  { name: 'Sample name', city: 'City', product: 'Foam pillow', rating: 5, text: 'A third sample card to check how three reviews sit in a row.', date: '2026-10', source: 'Sample' }
] : [];
const productChoices = productGroups.flatMap(g => g.categories.map(c => c.title));
// Apps Script web apps accept a plain-text body without a CORS preflight; the JSON inside is parsed by doPost.
const postReview = body => fetch(REVIEWS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(r => r.json());

const monthName = d => { const [y, m] = String(d).split('-').map(Number); return y && m ? new Date(y, m - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' }) : ''; };
const Stars = ({ value, size = 15 }) => <span className="stars" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={size} className={n <= Math.round(value) ? 'on' : ''}/>)}</span>;
const SHOW = 6;
const EMPTY = { text: '', name: '', city: '', product: '', website: '' };

export function ReviewsSection({ whatsapp }) {
  // Approved reviews from the Google Sheet (if connected), plus any added by hand in reviews.js
  const [sheetReviews, setSheetReviews] = useState([]);
  useEffect(() => {
    if (!REVIEWS_ENDPOINT) return;
    let live = true;
    fetch(REVIEWS_ENDPOINT).then(r => r.json()).then(d => { if (live && Array.isArray(d.reviews)) setSheetReviews(d.reviews.filter(r => r && r.text && r.rating)); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const real = [...sheetReviews, ...localReviews].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const list = real.length ? real : demoReviews;
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(0), [hover, setHover] = useState(0);
  const [form, setForm] = useState(EMPTY), [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const set = key => e => setForm({ ...form, [key]: e.target.value });
  const average = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  const ready = rating > 0 && form.text.trim().length >= 5 && (consent || !REVIEWS_ENDPOINT);
  const whatsappLink = () => {
    const who = [form.name.trim(), form.city.trim()].filter(Boolean).join(', ');
    const msg = `Hi Raku, here is my review.\nRating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)${form.product ? `\nProduct: ${form.product}` : ''}\n${form.text.trim()}${who ? `\n— ${who}` : ''}`;
    return `${whatsapp}?text=${encodeURIComponent(msg)}`;
  };
  const submit = async e => {
    e.preventDefault();
    if (!ready) return;
    if (!REVIEWS_ENDPOINT) { window.open(whatsappLink(), '_blank', 'noopener,noreferrer'); return; }
    setStatus('sending');
    try {
      const res = await postReview({ rating, review: form.text, name: form.name, city: form.city, product: form.product, consent, website: form.website });
      if (!res.ok) throw new Error(res.error);
      setStatus('sent'); setForm(EMPTY); setRating(0); setConsent(false);
    } catch { setStatus('error'); }
  };
  return <section className="reviews-section section-pad reveal" id="reviews">
    <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> CUSTOMER REVIEWS</div><h2>What our<br/><em>customers say.</em></h2></div>
      {list.length > 0 && <div className="review-summary"><strong>{average.toFixed(1)}</strong><Stars value={average} size={18}/><span>from {list.length} review{list.length === 1 ? '' : 's'}</span></div>}</div>
    {DEMO && !real.length && <p className="demo-note">Design preview with sample cards. These are not shown on the live site.</p>}
    {list.length > 0 && <>
      <div className="review-grid">{(showAll ? list : list.slice(0, SHOW)).map((r, i) => <article className="review-card" key={i}>
        <Stars value={r.rating}/>
        <p>“{r.text}”</p>
        <div className="review-meta"><span className="review-avatar">{(r.name || 'R').trim()[0]}</span><div><strong>{r.name}{r.city ? `, ${r.city}` : ''}</strong><small>{[r.product, monthName(r.date), r.source && `via ${r.source}`].filter(Boolean).join(' · ')}</small></div></div>
      </article>)}</div>
      {list.length > SHOW && <button className="text-button review-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer reviews' : `Show all ${list.length} reviews`}</button>}
    </>}
    <div className={`review-invite ${list.length ? '' : 'first'}`}>
      <div className="review-invite-copy">
        <h3>{list.length ? 'Share your experience.' : 'Be one of our first reviewers.'}</h3>
        <p>Sleeping on a Raku mattress, or using our pillows or foam? Tell us how it’s going. We read every review before it appears here.</p>
      </div>
      {status === 'sent'
        ? <div className="review-thanks" role="status"><span><Check size={22}/></span><strong>Thank you for your review.</strong><p>It will appear on this page once our team has checked it.</p><button className="text-button" onClick={() => setStatus('idle')}>Write another review</button></div>
        : <form className="review-form" onSubmit={submit}>
          <div className="star-picker" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(n => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= (hover || rating) ? 'on' : ''} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}><Star size={26}/></button>)}
            <span>{['Tap to rate', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][hover || rating]}</span>
          </div>
          <textarea rows="3" value={form.text} onChange={set('text')} placeholder="What do you like about it? How are you sleeping?" maxLength={600} required/>
          <div className="review-row"><input value={form.name} onChange={set('name')} placeholder="Your name (e.g. Ritu S.)" maxLength={60}/><input value={form.city} onChange={set('city')} placeholder="City" maxLength={40}/></div>
          <select value={form.product} onChange={set('product')} aria-label="Product you bought"><option value="">Product you bought (optional)</option>{productChoices.map(p => <option key={p}>{p}</option>)}</select>
          {/* Hidden from people; only bots fill it in, and the Sheet script drops those reviews */}
          <input className="review-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} name="website"/>
          {REVIEWS_ENDPOINT && <label className="review-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/> I agree that Raku may show my review, first name and city on this website.</label>}
          <div className="review-submit">
            <button className="button button-dark" type="submit" disabled={!ready || status === 'sending'}>{REVIEWS_ENDPOINT ? <><Send size={16}/> {status === 'sending' ? 'Sending…' : 'Submit review'}</> : <><MessageCircle size={17}/> Send review on WhatsApp</>}</button>
            {REVIEWS_ENDPOINT && <a className="text-button" href={ready ? whatsappLink() : undefined} target="_blank" rel="noreferrer" aria-disabled={!ready}>or send on WhatsApp</a>}
          </div>
          {status === 'error' && <p className="review-error" role="alert">Sorry, your review couldn’t be sent just now. Please try again, or send it on WhatsApp.</p>}
        </form>}
    </div>
  </section>;
}
