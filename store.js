/* ============================================================
   Sareeify store engine — shared across all pages.
   Cart persists in-memory + mirrored to a global so it survives
   navigation within the session. When Supabase is wired, replace
   CATALOG with a fetch() and CART with server-backed calls.
   NOTE: Artifacts/preview block localStorage; we use an in-page
   cookie fallback so the cart survives page navigation on Vercel.
   ============================================================ */
(function () {
  // ---------- CATALOG (demo data; swap for Supabase later) ----------
  // Stable Unsplash CDN images (images.unsplash.com) — these load reliably in browsers.
  const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=780&q=80`;
  const CATALOG = [
    { handle:"banarasi-silk-saree", title:"Banarasi Silk Saree", cat:"Sarees", price:2499, compare:3999, rating:5, badge:"NEW",
      img:U('1610030469983-98e550d6193c'), imgs:[U('1610030469983-98e550d6193c'),U('1583391733956-6c78276477e2'),U('1614886137372-9b6c4d3a5a3e')],
      desc:"Handwoven Banarasi silk saree in a rich jewel tone, finished with intricate gold zari work along the border and pallu. Comes with an unstitched blouse piece. Lightweight drape, dispatched within 24 hours." },
    { handle:"royal-wedding-lehenga", title:"Royal Wedding Lehenga", cat:"Wedding Collection", price:8999, compare:12999, rating:5, badge:"-30%",
      img:U('1583391733975-b6a8b4d2e1f0'), imgs:[U('1583391733975-b6a8b4d2e1f0'),U('1610189000061-8c6c0c0e0e0e'),U('1594736797933-d0401ba2fe65')],
      desc:"A regal bridal lehenga with heavy hand-embroidery and sequin detailing across the skirt. Set includes a flared lehenga, embellished choli, and a net dupatta. Made for your big day." },
    { handle:"printed-anarkali-set", title:"Printed Anarkali Set", cat:"Printed Pret", price:3299, compare:4499, rating:4, badge:"",
      img:U('1617059477332-1a18cea22f6c'), imgs:[U('1617059477332-1a18cea22f6c'),U('1583391733981-5b2e2d0a4d8e'),U('1595777216528-071e0127ccbf')],
      desc:"Flowy printed Anarkali with a flattering floor-length silhouette and a soft, breathable fabric. Perfect for daytime functions, festive brunches and casual celebrations." },
    { handle:"sequin-cocktail-lehenga", title:"Sequin Cocktail Lehenga", cat:"Lengha Choli", price:6499, compare:8999, rating:5, badge:"BESTSELLER",
      img:U('1595341888016-a392ef81b7de'), imgs:[U('1595341888016-a392ef81b7de'),U('1610030469983-98e550d6193c'),U('1583391733956-6c78276477e2')],
      desc:"Shimmer all night in this fully sequin-saturated cocktail lehenga. Lightweight, designed to move, and cut for a modern fit. Includes lehenga, choli and dupatta." },
    { handle:"classic-kanjivaram", title:"Classic Kanjivaram Saree", cat:"Sarees", price:4799, compare:5999, rating:5, badge:"",
      img:U('1614886137372-9b6c4d3a5a3e'), imgs:[U('1614886137372-9b6c4d3a5a3e'),U('1610030469983-98e550d6193c'),U('1583391733975-b6a8b4d2e1f0')],
      desc:"Pure Kanjivaram silk with a striking contrast border and traditional temple motifs woven in gold. A timeless heirloom-quality piece for weddings and grand occasions." },
    { handle:"pastel-festive-lehenga", title:"Pastel Festive Lehenga", cat:"Wedding Collection", price:7299, compare:9499, rating:4, badge:"",
      img:U('1594736797933-d0401ba2fe65'), imgs:[U('1594736797933-d0401ba2fe65'),U('1595341888016-a392ef81b7de'),U('1617059477332-1a18cea22f6c')],
      desc:"Soft pastel tones with delicate thread embroidery and a feather-light feel. Made for mehendi, haldi and daytime celebrations where you want elegance without the weight." },
    { handle:"georgette-printed-saree", title:"Georgette Printed Saree", cat:"Printed Pret", price:1799, compare:2499, rating:4, badge:"-28%",
      img:U('1583391733981-5b2e2d0a4d8e'), imgs:[U('1583391733981-5b2e2d0a4d8e'),U('1617059477332-1a18cea22f6c'),U('1595777216528-071e0127ccbf')],
      desc:"Easy-drape georgette saree with a contemporary digital print. Your go-to for work, casual outings and last-minute plans. Comes with a matching blouse piece." },
    { handle:"velvet-bridal-choli", title:"Velvet Bridal Lehenga Choli", cat:"Lengha Choli", price:11999, compare:15999, rating:5, badge:"PREMIUM",
      img:U('1610189000061-8c6c0c0e0e0e'), imgs:[U('1610189000061-8c6c0c0e0e0e'),U('1583391733975-b6a8b4d2e1f0'),U('1595341888016-a392ef81b7de')],
      desc:"Opulent velvet bridal lehenga choli with dense hand-embroidered detailing and a grand, fully worked dupatta. Our most premium piece, reserved for the main event." },
  ];

  // ---------- menu structure (sub-categories) ----------
  const MENU = {
    SHOP:        ["New Arrivals","Best Sellers","24 Hr Dispatch","Sale"],
    SAREES:      ["Banarasi Silk","Kanjivaram","Georgette","Printed Pret"],
    COLLECTIONS: ["Wedding Collection","Festive Edit","Party Wear","Bridal Couture"],
  };

  // ---------- cart store (cookie-mirrored so it survives navigation) ----------
  function readCart(){
    try{
      const m = document.cookie.match(/(?:^|; )sf_cart=([^;]*)/);
      return m ? JSON.parse(decodeURIComponent(m[1])) : [];
    }catch(e){ return []; }
  }
  function writeCart(c){
    document.cookie = "sf_cart=" + encodeURIComponent(JSON.stringify(c)) + "; path=/; max-age=" + 60*60*24*7;
  }
  const Cart = {
    items(){ return readCart(); },
    count(){ return readCart().reduce((s,i)=>s+i.qty,0); },
    total(){ return readCart().reduce((s,i)=>s+i.qty*i.price,0); },
    add(handle, qty=1){
      const p = CATALOG.find(x=>x.handle===handle); if(!p) return;
      const c = readCart(); const ex = c.find(i=>i.handle===handle);
      if(ex) ex.qty += qty; else c.push({handle, title:p.title, price:p.price, img:p.img, qty});
      writeCart(c); syncBadges();
    },
    setQty(handle, qty){
      let c = readCart(); const it = c.find(i=>i.handle===handle);
      if(it){ it.qty = qty; if(it.qty<=0) c = c.filter(i=>i.handle!==handle); }
      writeCart(c); syncBadges();
    },
    remove(handle){ writeCart(readCart().filter(i=>i.handle!==handle)); syncBadges(); },
    clear(){ writeCart([]); syncBadges(); }
  };

  const money = n => "₹" + Number(n||0).toLocaleString("en-IN");

  function syncBadges(){
    document.querySelectorAll("[data-cart-count]").forEach(el=>{ el.textContent = Cart.count(); });
  }

  // expose globally
  window.SF = { CATALOG, MENU, Cart, money, syncBadges };

  // ---------- wire header behaviours once DOM is ready ----------
  document.addEventListener("DOMContentLoaded", () => {
    syncBadges();

    // dropdown menus (hover on desktop, tap on mobile)
    document.querySelectorAll("[data-menu]").forEach(li=>{
      const key = li.getAttribute("data-menu");
      const items = MENU[key]; if(!items) return;
      const panel = document.createElement("div");
      panel.className = "submenu";
      panel.innerHTML = items.map(t=>`<a href="/collections?cat=${encodeURIComponent(t)}">${t}</a>`).join("");
      li.appendChild(panel);
      li.addEventListener("click",(e)=>{ // mobile tap toggles
        if(window.matchMedia("(max-width:760px)").matches){ e.preventDefault(); li.classList.toggle("open"); }
      });
    });

    // search toggle
    const searchIcon = document.querySelector("[data-search-toggle]");
    const searchBar  = document.querySelector("[data-search-bar]");
    if(searchIcon && searchBar){
      searchIcon.addEventListener("click", ()=>{
        searchBar.classList.toggle("open");
        if(searchBar.classList.contains("open")) searchBar.querySelector("input").focus();
      });
      const input = searchBar.querySelector("input");
      const go = ()=>{ const q=input.value.trim(); if(q) location.href="/search?q="+encodeURIComponent(q); };
      searchBar.querySelector("button").addEventListener("click", go);
      input.addEventListener("keydown", e=>{ if(e.key==="Enter") go(); });
    }
  });
})();