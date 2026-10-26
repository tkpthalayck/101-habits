/* 101 Habits funnel analytics (GA4: G-MHJTQ8CBP0)
   Loaded on every page. Page role comes from <body data-funnel-step="...">.
   Exclude your own visits: open any page once with ?notrack=1 (undo with ?notrack=0). */
(function () {
  var GA_ID = 'G-MHJTQ8CBP0';

  // ---- 1. Own-traffic opt-out (stored per browser) ----
  var qs = new URLSearchParams(location.search);
  try {
    if (qs.get('notrack') === '1') localStorage.setItem('fh_notrack', '1');
    if (qs.get('notrack') === '0') localStorage.removeItem('fh_notrack');
  } catch (e) {}
  var internal = false;
  try { internal = localStorage.getItem('fh_notrack') === '1'; } catch (e) {}

  // ---- 2. Funnel / product map ----
  var STEPS = {
    sales:    { step: 1, item_id: 'nc2ly7', item_name: '101 Habits eBook (789 pages)',      price: 17, label: 'Front end' },
    oto1:     { step: 2, item_id: 'nb30c3', item_name: 'Habit Implementation Toolkit',      price: 27, label: 'OTO1' },
    downsell: { step: 3, item_id: 'xdbf2t', item_name: 'Printable Habit Card Deck',         price: 12, label: 'Downsell' },
    oto2:     { step: 4, item_id: 'lktknf', item_name: 'Resell Rights Licence',             price: 47, label: 'OTO2' },
    jv:       { step: 0, label: 'JV page' },
    legal:    { step: 0, label: 'Legal' }
  };
  var page = (document.body && document.body.getAttribute('data-funnel-step')) || 'other';
  var info = STEPS[page] || { step: 0, label: page };
  var item = info.item_id ? [{ item_id: info.item_id, item_name: info.item_name, price: info.price, quantity: 1, item_category: 'ebook', item_brand: 'SKYMAXX Publishers' }] : undefined;

  // Affiliate / campaign capture (WarriorPlus and common params)
  var aff = qs.get('aff') || qs.get('affid') || qs.get('aff_id') || qs.get('a') || qs.get('w_aff') || '';
  try {
    if (aff) sessionStorage.setItem('fh_aff', aff); else aff = sessionStorage.getItem('fh_aff') || '';
  } catch (e) {}

  // ---- 3. gtag bootstrap ----
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('set', 'user_properties', { visitor_type: internal ? 'internal' : 'public' });
  gtag('config', GA_ID, {
    funnel_step: page,
    funnel_step_number: info.step,
    affiliate_id: aff || '(none)',
    traffic_type: internal ? 'internal' : undefined
  });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  function ev(name, params) {
    params = params || {};
    params.funnel_step = page;
    params.affiliate_id = aff || '(none)';
    gtag('event', name, params);
  }

  // Step-specific event names (fe_view, fe_buy_click, oto1_view, ...) so funnels can be built from event names alone
  var KEY = { sales: 'fe', oto1: 'oto1', downsell: 'ds', oto2: 'oto2' }[page];

  // ---- 4. Page-level funnel events ----
  if (item) {
    ev('view_item', { currency: 'USD', value: info.price, items: item, offer: info.label });
    ev(KEY + '_view', { offer: info.label, value: info.price, currency: 'USD' });
  }

  // Reaching an upsell page means the previous step was bought or declined (WarriorPlus redirects).
  // Fired once per browser per page so reloads do not double count.
  function once(key) {
    try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, '1'); } catch (e) {}
    return true;
  }
  if (page === 'oto1' && once('fh_reach_oto1')) ev('funnel_frontend_completed', { currency: 'USD', value: 17 });
  if (page === 'downsell' && once('fh_reach_ds')) ev('funnel_oto1_declined', {});
  if (page === 'oto2' && once('fh_reach_oto2')) ev('funnel_reached_oto2', {});

  // ---- 5. Clicks ----
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var text = (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (/warriorplus\.com\/o2?\/buy\//.test(href)) {
      // which buy button on the page (1st, 2nd, ...) tells you which section converts
      var all = Array.prototype.slice.call(document.querySelectorAll('a[href*="/buy/"]'));
      ev('begin_checkout', { currency: 'USD', value: info.price || 0, items: item, offer: info.label, button_text: text, button_position: all.indexOf(a) + 1 });
      if (KEY) ev(KEY + '_buy_click', { offer: info.label, value: info.price || 0, currency: 'USD', button_position: all.indexOf(a) + 1 });
    } else if (/warriorplus\.com\/o\/nothanks\//.test(href)) {
      ev('decline_offer', { offer: info.label, value: info.price || 0, currency: 'USD', button_text: text });
      if (KEY) ev(KEY + '_no_thanks', { offer: info.label });
    } else if (/warriorplus\.com\/aff-offer\//.test(href)) {
      ev('affiliate_link_request', { button_text: text });
    } else if (/^mailto:/.test(href)) {
      ev('contact_support', { link_text: text });
    } else if (/legal\.html/.test(href)) {
      ev('view_policy', { policy: (href.split('#')[1] || 'legal') });
    } else if (/jv\.html/.test(href)) {
      ev('view_jv_link', {});
    }
  }, true);

  // Copy buttons (JV email swipes) and any other buttons
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    var t = (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (/copy/i.test(t)) {
      var card = b.closest('section,article,div');
      var h = card && card.querySelector('h3,h4,strong,b');
      ev('copy_swipe', { swipe: h ? h.textContent.trim().slice(0, 60) : t });
    }
  }, true);

  // Table-of-contents parts opened on the sales page (<details>)
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.tagName === 'DETAILS' && d.open) {
      var sum = d.querySelector('summary');
      ev('toc_part_open', { part: sum ? sum.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) : 'unknown' });
    }
  }, true);

  // ---- 6. Section views (which parts of the page people actually reach) ----
  function initSections() {
    if (!('IntersectionObserver' in window)) return;
    var seen = {};
    var heads = document.querySelectorAll('h1, h2');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var name = en.target.textContent.trim().replace(/\s+/g, ' ').slice(0, 80);
        if (!name || seen[name]) return;
        seen[name] = 1;
        ev('section_view', { section: name });
        io.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    heads.forEach(function (h) { io.observe(h); });
  }

  // ---- 7. Scroll depth 25/50/75/100 ----
  var marks = [25, 50, 75, 100], hit = {};
  function onScroll() {
    var h = document.documentElement;
    var pct = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
    marks.forEach(function (m) {
      if (!hit[m] && pct >= m - 1) { hit[m] = 1; ev('scroll_depth', { percent: m }); }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- 8. Engaged-time milestones (only while the tab is visible) ----
  var secs = 0, timeMarks = [15, 30, 60, 120, 300, 600], tHit = {};
  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    secs++;
    timeMarks.forEach(function (m) {
      if (!tHit[m] && secs >= m) { tHit[m] = 1; ev('engaged_time', { seconds: m }); }
    });
  }, 1000);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSections);
  else initSections();
})();
