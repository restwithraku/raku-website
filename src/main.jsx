import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, X, Phone, ArrowUpRight, ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { IsoBadge } from './brand.jsx';
import { productGroups } from './products.js';
import { PressTest, RoomPlanner, CustomSizeFields, tidyCustom, customText } from './interactive.jsx';
import { ReviewsSection } from './reviewsSection.jsx';
import './styles.css';

// Everything below comes from the Raku packaging, label and brand guidelines (brand-assets folder).
const claims = [
  { icon: 'brand/icons/icon-balanced-comfort.png', title: 'Balanced comfort', text: 'Soft cushioning and steady support, working together through the night.' },
  { icon: 'brand/icons/icon-pressure-relief.png', title: 'Pressure relief', text: 'Eases pressure on the shoulders, hips and back as you settle in.' },
  { icon: 'brand/icons/icon-breathable-design.png', title: 'Breathable design', text: 'Lets air move through the mattress so it stays fresh and comfortable.' }
];
const photo = (name) => `brand/photos/${name}.jpg`;
// Every mattress thickness option in the range that has a listed feel, for the Find your fit tool
const mattressGroup = productGroups.find(g => g.id === 'mattresses');
const mattressOptions = mattressGroup.categories.flatMap(cat => cat.variants.map((v, vIndex) => ({ ...v, cat, vIndex }))).filter(m => m.feelScore);
// Quick facts for the Our range intro, counted from the product data
const rangeFacts = [
  [productGroups.reduce((n, g) => n + g.categories.length, 0), 'categories'],
  [productGroups.reduce((n, g) => n + g.categories.reduce((m, c) => m + c.variants.length, 0), 0), 'products'],
  ['Any size', 'made to order'],
  ['ISO', '9001:2015 certified']
];
// Our story: the symbol's concept (brand guideline page 5) and the maker's details (label and IndiaMART profile)
const concept = [
  { src: 'brand/concept/concept-sun.png', label: 'Rising sun' },
  { src: 'brand/concept/concept-roof.png', label: 'Roof' },
  { src: 'brand/concept/concept-r.png', label: 'Letter R' },
  { src: 'brand/concept/concept-symbol.png', label: 'Raku' }
];
const handling = [
  { src: 'brand/icons/handling-this-side-up.png', label: 'This side up', text: 'Marked so it travels the right way round.' },
  { src: 'brand/icons/handling-recyclable.png', label: 'Recyclable carton', text: 'The packaging can go for recycling after unboxing.' },
  { src: 'brand/icons/handling-keep-dry.png', label: 'Keep dry', text: 'Marked to stay protected from moisture in transit.' }
];
const makerFacts = [
  ['Shree Hari Har Comfort', 'Kutail, Karnal, Haryana'],
  ['Since 2019', 'manufacturing mattresses and foam'],
  ['TrustSEAL', 'verified on IndiaMART · GST registered']
];
const fitFeels =[...new Map(mattressOptions.map(m => [m.feelScore, m.feel])).entries()].sort((a, b) => a[0] - b[0]);
// Contact details as printed on the product label
const PHONE = { label: '+91 92155 24440', href: 'tel:+919215524440', whatsapp: 'https://wa.me/919215524440' };
const MAKER = 'Shree Hari Har Comfort, Kutail, Haryana';
// FAQ: only answers Raku has confirmed. Policies not yet confirmed (trial, returns, delivery times, COD/EMI) are left out.
const faqs = [
  ['How do I order?', `Choose a product and size on this site and send an enquiry, call ${PHONE.label} or message us on WhatsApp. Our team will confirm the details and share a price. There is no online checkout.`],
  ['Which size should I choose?', 'Measure your bed frame and choose the size that matches it. Use Find your fit to see the bed to scale in your room, or send us the measurements and we will help.'],
  ['Can you make a custom size?', 'Yes. Every Raku product can be made to your measurements. Choose Custom on any product card, or use “Make it fit my room” in Find your fit.'],
  ['Why don’t you show prices?', 'Prices depend on the product, size, thickness and quantity. Send an enquiry with what you need and we will share a quote.'],
  ['Do you take bulk orders?', 'Yes. We supply mattresses in bulk for hotels, hostels, PGs and guest houses, and pillows and foam sheets for businesses and manufacturers. Tell us the products, sizes and quantities you need.'],
  ['What warranty do the mattresses have?', 'The warranty depends on the mattress. Where a warranty is listed, it is shown on the product card. Ask us to confirm the warranty for the product you choose.'],
  ['How do I care for my mattress?', 'Use a supportive bed base, protect the mattress with a suitable cover and follow the care guidance supplied with it.'],
  ['Do you deliver to my area?', 'Tell us your city or pincode when you enquire, and we will confirm delivery to your area.']
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', type: 'My home', message: '' });
  // Standard bed sizes (length × width, inches); every product can also be made to a custom size
  const fitSizes = mattressGroup.categories[0].sizes.map(([name, dims]) => { const [l, w] = dims.match(/\d+/g).map(Number); return { name, dims, l, w }; });
  const sizeOf = (name, custom) => { if (name !== 'Custom') return fitSizes.find(s => s.name === name); const c = tidyCustom(custom); return { name: 'Custom', l: c.l, w: c.w, t: c.t, dims: customText(c) }; };
  const [groupId, setGroupId] = useState(productGroups[0].id);
  const group = productGroups.find(g => g.id === groupId);
  // Selected thickness (variant index), size and custom measurements per category card
  const [picks, setPicks] = useState({});
  const pickOf = (c) => ({ v: 0, size: c.sizes ? 'Queen' : 'Standard', custom: c.sizes ? { l: 78, w: 60, t: '' } : { l: 72, w: 36, t: '' }, ...picks[c.id] });
  const setPick = (c, change) => setPicks(prev => ({ ...prev, [c.id]: { ...pickOf(c), ...prev[c.id], ...change } }));
  const askAboutCategory = (c) => {
    const { v, size, custom } = pickOf(c), variant = c.variants[v], cu = tidyCustom(custom);
    // A custom thickness replaces the selected one, so the message never gives two thicknesses
    if (size === 'Custom') return enquire(`I'd like details on ${c.title}, made to a custom size: ${customText(cu)}${cu.t ? '' : `, ${variant.label}${variant.thickness ? ' thick' : ''}`}. (Closest IndiaMART listing: ${variant.listing})`);
    const sizeText = c.sizes ? `, ${size} size (${c.sizes.find(s => s[0] === size)[1]})` : '';
    enquire(`I'd like details on ${c.title}: ${variant.label}${variant.thickness ? ' thick' : ''}${sizeText}. (IndiaMART listing: ${variant.listing})`);
  };
  // Find your fit: the room plan (bed to scale in the room), a bed size and feel, and the mattresses that match
  const [fitSize, setFitSize] = useState('Queen');
  const [fitCustom, setFitCustom] = useState({ l: 78, w: 60, t: '' });
  const [fitFeel, setFitFeel] = useState(5);
  const [room, setRoom] = useState({ l: 12, w: 10 });
  const fit = sizeOf(fitSize, fitCustom);
  const roomText = `${room.l} ft × ${room.w} ft room`;
  const fitMatches = mattressOptions.map(m => ({ ...m, gap: Math.abs(m.feelScore - fitFeel) })).sort((a, b) => a.gap - b.gap || parseFloat(a.label) - parseFloat(b.label)).slice(0, 4);
  const showInRange = (m) => { setGroupId('mattresses'); setPick(m.cat, { v: m.vIndex, size: fitSize, custom: fitCustom }); go('products'); };
  const sizeName = s => s.name === 'Custom' ? 'custom' : s.name;
  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };
  // The contact form sends its details as a WhatsApp message (the site has no mail server)
  const submit = (e) => {
    e.preventDefault();
    const lines = [`Enquiry for: ${form.type}`, form.city.trim() && `City / pincode: ${form.city.trim()}`, form.message.trim(), form.name.trim() && `— ${form.name.trim()}`].filter(Boolean);
    whatsappTo(lines.join('\n'));
    setSubmitted(true);
  };
  useEffect(() => {
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  // Every enquiry button opens WhatsApp with the details already written
  const whatsappTo = (message) => window.open(`${PHONE.whatsapp}?text=${encodeURIComponent(`Hi Raku,\n${message}`)}`, '_blank', 'noopener,noreferrer');
  const enquire = whatsappTo;
  return <div className="site">
    <div className="announcement">Where comfort comes to rest. <span>Thoughtfully made in India.</span></div>
    <header className="header">
      <a className="brand" href="#" aria-label="Raku home"><img src="brand/raku-logo-maroon.png" alt="Raku" width="1299" height="391"/></a>
      <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
        <button onClick={() => go('products')}>Products</button>
        <button onClick={() => go('fit')}>Find your fit</button>
        <button onClick={() => go('promise')}>Why Raku</button>
        <button onClick={() => go('craft')}>Our story</button>
        <button onClick={() => go('faq')}>FAQ</button>
        <button className="mobile-contact" onClick={() => { setMenuOpen(false); whatsappTo('I’d like to know more about your products.'); }}>Talk to us on WhatsApp <MessageCircle size={16}/></button>
      </nav>
      <button className="header-cta" onClick={() => whatsappTo('I’d like to know more about your products.')}><MessageCircle size={16}/> Talk to us</button>
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> MATTRESSES MADE IN INDIA</div>
          <h1>Come home<br/>to <em>comfort.</em></h1>
          <p>Raku mattresses balance soft comfort with steady support, in a breathable design made for everyday rest.</p>
          <div className="hero-actions"><button className="button button-dark" onClick={() => go('products')}>See our range <ArrowRight size={17}/></button><button className="text-button" onClick={() => go('craft')}>The Raku story <ArrowUpRight size={16}/></button></div>
          <div className="hero-proof"><IsoBadge className="iso-badge hero-iso"/><div><strong>ISO 9001:2015 certified</strong><small>Made to a certified quality-management standard.</small></div></div>
        </div>
        <div className="hero-visual">
          <img src={photo('raku-bedroom')} alt="A Raku mattress, still in its labelled cover, on a bed in a warm bedroom"/>
          <div className="hero-image-note"><img className="note-icon" src="brand/raku-mark.png" alt=""/><span><strong>Made to your size.</strong><small>Every product, any size.</small></span></div>
          <div className="vertical-note">WHERE COMFORT COMES TO REST</div>
        </div>
        <div className="hero-bottom"><span>MADE FOR EVERYDAY REST</span><span className="scroll-cue">SCROLL TO EXPLORE <span>↓</span></span></div>
      </section>

      <section className="claims-band reveal" id="promise">
        <div className="claims-intro">Where comfort<br/><em>comes to rest.</em></div>
        {/* The one place the three packaging claims are listed in full */}
        <div className="claims-pill">{claims.map(c => <div className="claim" key={c.title}><img src={c.icon} alt=""/><div><strong>{c.title}</strong><span>{c.text}</span></div></div>)}</div>
      </section>

      <section className="products section-pad reveal" id="products">
        <div className="products-intro">
          <div className="mattress-media"><img src={photo('raku-mattress-tag')} alt="Close-up of the Raku label stitched onto the side of the mattress" loading="lazy"/></div>
          <div className="products-intro-copy">
            <div className="eyebrow"><span className="eyebrow-line"/> OUR RANGE</div>
            <h2>Mattresses, pillows<br/><em>and foam.</em></h2>
            <p>Made in Karnal, Haryana. Mattresses for homes, hostels and hotels, plus pillows and foam sheets, and every one can be made to your size.</p>
            <dl className="range-facts">{rangeFacts.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
            <button className="text-button" onClick={() => whatsappTo('I’d like to ask about one of your products.')}>Ask about a product on WhatsApp <MessageCircle size={16}/></button>
          </div>
        </div>
        <div className="product-tabs" role="tablist" aria-label="Product categories">{productGroups.map(g => <button key={g.id} role="tab" aria-selected={g.id === groupId} className={g.id === groupId ? 'active' : ''} onClick={() => setGroupId(g.id)}>{g.title}<span>{g.categories.length}</span></button>)}</div>
        <div className="product-group" key={group.id} role="tabpanel">
          <p className="group-intro">{group.intro}</p>
          <div className="cat-grid">{group.categories.map((c, i) => { const pick = pickOf(c), variant = c.variants[pick.v]; return <article className="cat-card" key={c.id}>
            <div className="cat-head">
              <span className="cat-tag">{c.tag}</span>
              <span className="cat-number">{String(i + 1).padStart(2, '0')}</span>
              <div className="cat-measure"><small>{variant.thickness ? 'THICKNESS' : 'WEIGHT'}</small><strong key={variant.label}>{variant.label}</strong></div>
            </div>
            <div className="cat-body">
              <h3>{c.title}</h3>
              <p className="cat-desc">{c.description}</p>
              {/* Every card shows the same blocks in the same order, so cards line up across a row */}
              <div className="firmness-title"><span>FEEL</span><strong className={variant.feelScore ? '' : 'not-listed'}>{variant.feelScore ? variant.feel : 'Not listed'}</strong></div>
              <div className="firmness-bars" aria-hidden="true">{Array.from({ length: 10 }, (_, j) => <span key={j} className={j < (variant.feelScore || 0) ? 'filled' : ''}/>)}</div>
              <div className="soft-firm"><span>SOFT</span><span>FIRM</span></div>
              <div className="option-block"><div className="option-label">{variant.thickness ? 'THICKNESS (INCHES)' : 'WEIGHT'}</div>
                <div className="thickness-options">{c.variants.map((v, j) => <button key={v.listing} className={pick.v === j ? 'active' : ''} onClick={() => setPick(c, { v: j })}>{v.label}</button>)}</div></div>
              <div className="option-block"><div className="option-label">SIZE (INCHES)</div>
                {c.sizes
                  ? <div className="size-options with-custom">{c.sizes.map(([s, d]) => <button key={s} className={pick.size === s ? 'active' : ''} onClick={() => setPick(c, { size: s })}><b>{s}</b><small>{d}</small></button>)}<button className={pick.size === 'Custom' ? 'active' : ''} onClick={() => setPick(c, { size: 'Custom' })}><b>Custom</b><small>Your size</small></button></div>
                  : <div className="size-options two">{[['Standard', variant.specs.find(s => s[0] === 'Size')?.[1] || 'As listed'], ['Custom', 'Your size']].map(([s, d]) => <button key={s} className={pick.size === s ? 'active' : ''} onClick={() => setPick(c, { size: s })}><b>{s}</b><small>{d}</small></button>)}</div>}
                {pick.size === 'Custom' && <CustomSizeFields value={pick.custom} onChange={custom => setPick(c, { custom })} withThickness/>}</div>
              <dl className="cat-specs" key={variant.listing}>{variant.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <button className="button button-dark card-enquire" onClick={() => askAboutCategory(c)}>{pick.size === 'Custom' ? (tidyCustom(pick.custom).t ? 'Enquire about a custom size' : `Enquire about ${variant.label} · Custom`) : `Enquire about ${variant.label}${c.sizes ? ` · ${pick.size}` : ''}`} <MessageCircle size={17}/></button>
            </div>
          </article>; })}</div>
        </div>
      </section>

      <section className="press-section section-pad reveal" id="press">
        <div className="press-intro"><div className="eyebrow"><span className="eyebrow-line"/> TRY IT · THE PRESS TEST</div><h2>Press down.<br/><em>Feel it spread.</em></h2><p>Pressure relief is one of the three things every Raku product is designed around. Press and hold the mattress to see how it spreads your weight, then compare it with a hard surface.</p></div>
        <PressTest/>
      </section>

      <section className="fit section-pad reveal" id="fit">
        <div className="fit-head">
          <div className="eyebrow"><span className="eyebrow-line"/> FIND YOUR FIT</div>
          <h2>Plan your room.<br/><em>Find your feel.</em></h2>
          <p>Enter your room size, then pick a bed size and the feel you like. We’ll show the bed to scale in your room and the Raku mattresses that match. Any mattress can also be made to fit your room.</p>
        </div>
        <div className="fit-plan">
          <RoomPlanner sizes={fitSizes} bed={fit} room={room} setRoom={setRoom} onPickSize={setFitSize}
            onMakeCustom={c => { setFitCustom(c); setFitSize('Custom'); }}
            onEnquire={() => enquire(`I'm looking for a ${sizeName(fit)} mattress (${fit.dims}) for a ${roomText}. Please share the details.`)}/>
        </div>
        <div className="fit-copy">
          <div className="option-block"><div className="option-label">1 · BED SIZE (INCHES)</div>
            <div className="size-options with-custom">{fitSizes.map(s => <button key={s.name} className={fitSize === s.name ? 'active' : ''} onClick={() => setFitSize(s.name)}><b>{s.name}</b><small>{s.dims}</small></button>)}<button className={fitSize === 'Custom' ? 'active' : ''} onClick={() => setFitSize('Custom')}><b>Custom</b><small>Your size</small></button></div>
            {fitSize === 'Custom' && <CustomSizeFields value={fitCustom} onChange={setFitCustom}/>}</div>
          <div className="option-block"><div className="option-label">2 · FEEL</div>
            <div className="thickness-options">{fitFeels.map(([score, feel]) => <button key={score} className={fitFeel === score ? 'active' : ''} onClick={() => setFitFeel(score)}>{feel}</button>)}</div>
            <div className="firmness-bars" aria-hidden="true">{Array.from({ length: 10 }, (_, j) => <span key={j} className={j < fitFeel ? 'filled' : ''}/>)}</div>
            <div className="soft-firm"><span>SOFT</span><span>FIRM</span></div></div>
          <div className="option-label">YOUR MATCHES</div>
          <ul className="fit-results" key={`${fitSize}-${fitFeel}`}>{fitMatches.map(m => <li key={m.listing}>
            <div><strong>{m.cat.title} · {m.label}</strong><span>{m.feel} feel{m.gap === 0 ? '' : ' · closest match'}</span></div>
            <div className="fit-actions"><button className="text-button" onClick={() => showInRange(m)}>View in range <ArrowUpRight size={15}/></button><button className="text-button fit-enquire" onClick={() => enquire(`I'd like a ${sizeName(fit)} size (${fit.dims}) mattress with a ${m.feel.toLowerCase()} feel, for a ${roomText}: ${m.cat.title}, ${m.label} thick. (IndiaMART listing: ${m.listing})`)}>Enquire <MessageCircle size={15}/></button></div>
          </li>)}</ul>
        </div>
      </section>

      <section className="craft reveal" id="craft">
        <div className="craft-image"><img src={photo('raku-hand-mattress')} alt="A hand resting on the quilted surface of a mattress" loading="lazy"/><div className="craft-stamp">MADE WITH<br/><em>care</em><img src="brand/raku-mark.png" alt=""/></div></div>
        <div className="craft-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> OUR STORY</div>
          <h2>Comfort for<br/><em>everyday living.</em></h2>
          <p>Raku is a mattress brand centred on the comfort of everyday living. We pay attention to every detail, from the feel of the surface to the support beneath it.</p>
          {/* The symbol's concept, from brand guideline page 5 */}
          <div className="concept">
            <div className="concept-row" aria-label="The rays of a rising sun, plus a house roof, plus the letter R, make the Raku symbol">
              {concept.map((c, i) => <React.Fragment key={c.label}>{i > 0 && <span className="concept-op" aria-hidden="true">{i === concept.length - 1 ? '=' : '+'}</span>}<figure className={i === concept.length - 1 ? 'concept-result' : ''} style={{ '--i': i }}><img src={c.src} alt=""/><figcaption>{c.label}</figcaption></figure></React.Fragment>)}
            </div>
            <p>The roof stands for the comfort of home. The rising sun stands for the fresh start that follows a restful night.</p>
          </div>
          <div className="maker">
            <div className="option-label">WHO MAKES RAKU</div>
            <dl>{makerFacts.map(([value, label]) => <div key={value}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
          </div>
          <div className="craft-signoff">Sleep well, and wake up to a better morning. <span>— Team Raku</span></div>
        </div>
      </section>

      <section className="delivery section-pad reveal">
        <div className="delivery-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> TO YOUR DOOR</div>
          <h2>Packed with care,<br/><em>ready to unbox.</em></h2>
          <p>Every Raku order ships in a Raku carton, marked for careful handling, so it reaches your home ready to open and settle in.</p>
          {/* The handling marks printed on the Raku carton (packaging artwork, box 3) */}
          <ul className="handling">{handling.map(h => <li key={h.label}><img src={h.src} alt=""/><div><strong>{h.label}</strong><span>{h.text}</span></div></li>)}</ul>
        </div>
        <div className="delivery-collage">
          <img className="collage-main" src={photo('raku-box')} alt="A Raku shipping carton printed with the Raku symbol" loading="lazy"/>
          <figure className="collage-inset"><img src={photo('raku-unboxing')} alt="A parent and child unpacking a Raku delivery at home" loading="lazy"/><figcaption>Unboxing at home</figcaption></figure>
        </div>
      </section>

      <section className="quote-section reveal" id="journal"><span className="quote-mark" aria-hidden="true" style={{ WebkitMaskImage: 'url(brand/raku-mark.png)', maskImage: 'url(brand/raku-mark.png)' }}/><blockquote>Better sleep<br/>makes for <em>better days.</em></blockquote><div className="quote-rule"/><p>Make room for rest.</p></section>

      <ReviewsSection whatsapp={PHONE.whatsapp}/>

      <section className="faq section-pad reveal" id="faq">
        <div className="faq-intro"><div className="eyebrow"><span className="eyebrow-line"/> BEFORE YOU CHOOSE</div><h2>Frequently asked<br/><em>questions.</em></h2><p>Answers to common questions about choosing and caring for your mattress.</p><button className="text-button" onClick={() => whatsappTo('I have a question.')}>Ask us on WhatsApp <MessageCircle size={16}/></button></div>
        <div className="faq-list">{faqs.map(([q,a],i)=><div className={`faq-item ${faqOpen===i?'faq-active':''}`} key={q}><button onClick={() => setFaqOpen(faqOpen===i?-1:i)}><span>{q}</span><ChevronDown size={19}/></button>{faqOpen===i&&<p>{a}</p>}</div>)}</div>
      </section>

      <section className="contact" id="contact">
        <div className="contact-copy"><div className="eyebrow"><span className="eyebrow-line"/> TALK TO US</div><h2>Tell us<br/><em>what you need.</em></h2><p>A mattress for your home, a bulk order for a hotel or business, or a custom size. Message us and our team will help you choose.</p><div className="contact-details"><img src="brand/raku-mark.png" alt=""/><div><strong>Real people. Helpful answers.</strong><small>Reach out for product information and guidance.</small></div></div>
          <div className="contact-lines"><a href={PHONE.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15}/> Chat on WhatsApp</a><a href={PHONE.href}><Phone size={15}/> Call {PHONE.label}</a></div></div>
        <form className="contact-form" onSubmit={submit}><h3>Send an enquiry.</h3><p>Fill this in and it opens WhatsApp with your message ready to send.</p>{submitted
          ? <div className="success-message" role="status"><span><MessageCircle size={20}/></span><strong>WhatsApp is open with your enquiry.</strong><p>Press send in WhatsApp to reach our team. If it didn’t open, use the button below.</p><div className="success-actions"><button type="button" className="button button-dark" onClick={submit}><MessageCircle size={16}/> Open WhatsApp again</button><button type="button" className="text-button" onClick={() => setSubmitted(false)}>Edit my enquiry</button></div></div>
          : <><div className="enquiry-type" role="radiogroup" aria-label="Enquiry for">{['My home', 'Bulk / business'].map(t => <button type="button" role="radio" aria-checked={form.type === t} key={t} className={form.type === t ? 'active' : ''} onClick={() => setForm({ ...form, type: t })}>{t}</button>)}</div>
            <label>Your name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="What should we call you?"/></label>
            <label>City or pincode<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="So we can confirm delivery"/></label>
            <label>What can we help with?<textarea required rows="3" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder={form.type === 'Bulk / business' ? 'Products, sizes and quantities you need…' : 'I’m looking for…'}/></label>
            <button className="button button-dark form-submit" type="submit"><MessageCircle size={17}/> Send on WhatsApp</button><small className="form-note">Opens WhatsApp to +91 92155 24440. Nothing is sent until you press send there.</small></>}</form>
      </section>
    </main>

    <footer className="footer"><div className="footer-main"><div className="footer-brand"><a className="brand brand-footer" href="#" aria-label="Raku home"><img src="brand/raku-logo-cream.png" alt="Raku" width="1298" height="391"/></a><p>Where comfort comes to rest.</p></div>
      <nav className="footer-nav" aria-label="Footer">{[['Products', 'products'], ['Find your fit', 'fit'], ['Our story', 'craft'], ['Reviews', 'reviews'], ['FAQ', 'faq'], ['Contact', 'contact']].map(([t, id]) => <button key={id} onClick={() => go(id)}>{t}</button>)}</nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Raku. Manufactured by {MAKER}.</span><span>Thoughtfully made in India.</span><button onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>BACK TO TOP ↑</button></div></footer>
    <a className="whatsapp" href={`${PHONE.whatsapp}?text=${encodeURIComponent("Hi Raku, I'd like to know more about your mattresses.")}`} target="_blank" rel="noreferrer" aria-label="Chat with Raku on WhatsApp"><MessageCircle size={22}/></a>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
