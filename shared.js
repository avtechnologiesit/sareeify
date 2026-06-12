/* Injects shared header + footer and provides product-card helpers.
   Depends on store.js (loaded first) for window.SF. */
(function () {
  const headerHTML = `
  <div class="topbar"><div class="wrap"><div class="promo">Pay Online &amp; GET 10% OFF on your Purchase. USE CODE: PREPAID</div></div></div>
  <header>
    <div class="wrap header-grid">
      <nav><ul>
        <li data-menu="SHOP">SHOP <svg class="caret" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></li>
        <li data-menu="SAREES">SAREES <svg class="caret" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></li>
        <li data-menu="COLLECTIONS">COLLECTIONS <svg class="caret" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></li>
        <li><a href="/collections?cat=Lengha%20Choli">LENGHA CHOLI</a></li>
      </ul></nav>
      <a class="logo" href="/"><div class="name"><b>S</b>areeify</div><div class="sub">FASHION</div></a>
      <div class="icons">
        <div class="ic" data-search-toggle title="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div>
        <a class="ic" href="/account" title="Account"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></a>
        <a class="ic" href="/account" title="Wishlist"><svg viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/></svg></a>
        <a class="ic" href="/cart" title="Cart"><svg viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg><span class="badge" data-cart-count>0</span></a>
      </div>
    </div>
    <div class="searchbar" data-search-bar>
      <div class="searchbar-inner">
        <input type="text" placeholder="Search for sarees, lehengas, collections...">
        <button>Search</button>
      </div>
    </div>
  </header>`;

  const footerHTML = `
  <footer><div class="wrap">
    <div class="cols">
      <div>
        <div class="logo"><div class="name">Sareeify</div><div class="sub">FASHION</div></div>
        <p style="margin-top:16px;color:#aaa;line-height:1.7">Curated ethnic wear for every celebration — sarees, lehengas and more, dispatched within 24 hours.</p>
      </div>
      <div><h4>Shop</h4><ul><li><a href="/collections?cat=Sarees">Sarees</a></li><li><a href="/collections?cat=Lengha%20Choli">Lengha Choli</a></li><li><a href="/collections?cat=Wedding%20Collection">Wedding Collection</a></li><li><a href="/collections">All Products</a></li></ul></div>
      <div><h4>Help</h4><ul><li>Track Order</li><li>Shipping &amp; Returns</li><li>Size Guide</li><li>Contact Us</li></ul></div>
      <div class="news"><h4>Newsletter</h4><p style="color:#aaa;margin-bottom:14px">Get 10% off your first order.</p><input type="email" placeholder="Your email address"><button>SUBSCRIBE</button></div>
    </div>
    <div class="copy">© 2026 Sareeify Fashion. All rights reserved.</div>
  </div></footer>`;

  const h = document.getElementById('header'); if (h) h.outerHTML = headerHTML;
  const f = document.getElementById('footer'); if (f) f.outerHTML = footerHTML;

  // re-run store.js header wiring (it ran on DOMContentLoaded before header existed)
  if (window.SF) {
    window.SF.syncBadges();
    // dropdowns
    document.querySelectorAll('[data-menu]').forEach(li=>{
      const items = window.SF.MENU[li.getAttribute('data-menu')]; if(!items) return;
      const panel=document.createElement('div'); panel.className='submenu';
      panel.innerHTML=items.map(t=>`<a href="/collections?cat=${encodeURIComponent(t)}">${t}</a>`).join('');
      li.appendChild(panel);
      li.addEventListener('click',e=>{ if(window.matchMedia('(max-width:760px)').matches){e.preventDefault();li.classList.toggle('open');}});
    });
    // search
    const si=document.querySelector('[data-search-toggle]'), sb=document.querySelector('[data-search-bar]');
    if(si&&sb){ si.addEventListener('click',()=>{sb.classList.toggle('open'); if(sb.classList.contains('open'))sb.querySelector('input').focus();});
      const inp=sb.querySelector('input'), go=()=>{const q=inp.value.trim(); if(q)location.href='/search?q='+encodeURIComponent(q);};
      sb.querySelector('button').addEventListener('click',go); inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
    }
  }
})();

/* ---------- product card + grid wiring (global) ---------- */
function SF_card(p){
  const tag = p.badge ? `<span class="tag${p.badge.startsWith('-')?' sale':''}">${p.badge}</span>` : '';
  const stars = '★★★★★☆☆☆☆☆'.slice(5-p.rating,10-p.rating);
  const price = `${SF.money(p.price)} ${p.compare?`<s>${SF.money(p.compare)}</s>`:''}`;
  return `<div class="pitem">
    <a class="pimg" href="/product?h=${p.handle}">${tag}
      <span class="wish" data-wish="${p.handle}"><svg viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/></svg></span>
      <img src="${p.img}" alt="${p.title}">
      <div class="quick" data-add="${p.handle}">ADD TO CART</div>
    </a>
    <a class="pname" href="/product?h=${p.handle}">${p.title}</a>
    <div class="rate">${stars}</div>
    <div class="price">${price}</div>
  </div>`;
}
function wireGrid(grid){
  if(!grid) return;
  grid.addEventListener('click', e=>{
    const add=e.target.closest('[data-add]');
    if(add){ e.preventDefault(); SF.Cart.add(add.getAttribute('data-add')); toast('Added to cart'); return; }
    const w=e.target.closest('[data-wish]');
    if(w){ e.preventDefault(); w.classList.toggle('on'); toast(w.classList.contains('on')?'Added to wishlist':'Removed'); }
  });
}
let _tt;
function toast(m){
  let t=document.getElementById('sfToast');
  if(!t){ t=document.createElement('div'); t.id='sfToast'; document.body.appendChild(t); }
  t.textContent=m; requestAnimationFrame(()=>{t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';});
  clearTimeout(_tt); _tt=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(14px)';},1800);
}