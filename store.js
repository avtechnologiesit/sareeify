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
  const CATALOG = [
    { handle:"banarasi-silk-saree", title:"Banarasi Silk Saree", cat:"Sarees", price:2499, compare:3999, rating:5, badge:"NEW",
      img:"https://source.unsplash.com/500x650/?banarasi,saree", imgs:["https://source.unsplash.com/500x650/?banarasi,saree","https://source.unsplash.com/500x650/?silk,saree","https://source.unsplash.com/500x650/?indian,saree,woman"],
      desc:"Handwoven Banarasi silk saree with intricate zari work. Comes with an unstitched blouse piece. Dispatched within 24 hours." },
    { handle:"royal-wedding-lehenga", title:"Royal Wedding Lehenga", cat:"Wedding Collection", price:8999, compare:12999, rating:5, badge:"-30%",
      img:"https://source.unsplash.com/500x650/?wedding,lehenga,indian", imgs:["https://source.unsplash.com/500x650/?wedding,lehenga,indian","https://source.unsplash.com/500x650/?bridal,lehenga","https://source.unsplash.com/500x650/?indian,bride"],
      desc:"A regal bridal lehenga with heavy embroidery and sequin detailing. Includes lehenga, choli and dupatta." },
    { handle:"printed-anarkali-set", title:"Printed Anarkali Set", cat:"Printed Pret", price:3299, compare:0, rating:4, badge:"",
      img:"https://source.unsplash.com/500x650/?anarkali,gown,indian", imgs:["https://source.unsplash.com/500x650/?anarkali,gown,indian","https://source.unsplash.com/500x650/?indian,gown","https://source.unsplash.com/500x650/?printed,dress"],
      desc:"Flowy printed Anarkali with a flattering silhouette. Perfect for daytime functions and festive brunches." },
    { handle:"sequin-cocktail-lehenga", title:"Sequin Cocktail Lehenga", cat:"Lengha Choli", price:6499, compare:8999, rating:5, badge:"BESTSELLER",
      img:"https://source.unsplash.com/500x650/?sequin,lehenga,cocktail", imgs:["https://source.unsplash.com/500x650/?sequin,lehenga,cocktail","https://source.unsplash.com/500x650/?cocktail,gown","https://source.unsplash.com/500x650/?party,lehenga"],
      desc:"Shimmer all night in this sequin-saturated cocktail lehenga. Lightweight and designed to move." },
    { handle:"classic-kanjivaram", title:"Classic Kanjivaram Saree", cat:"Sarees", price:4799, compare:5999, rating:5, badge:"",
      img:"https://source.unsplash.com/500x650/?kanjivaram,saree", imgs:["https://source.unsplash.com/500x650/?kanjivaram,saree","https://source.unsplash.com/500x650/?south,indian,saree","https://source.unsplash.com/500x650/?traditional,saree"],
      desc:"Pure Kanjivaram silk with a contrast border and temple motifs. A timeless heirloom piece." },
    { handle:"pastel-festive-lehenga", title:"Pastel Festive Lehenga", cat:"Wedding Collection", price:7299, compare:9499, rating:4, badge:"",
      img:"https://source.unsplash.com/500x650/?pastel,lehenga", imgs:["https://source.unsplash.com/500x650/?pastel,lehenga","https://source.unsplash.com/500x650/?festive,lehenga","https://source.unsplash.com/500x650/?indian,festive"],
      desc:"Soft pastel tones with delicate thread embroidery. Made for mehendi and haldi celebrations." },
    { handle:"georgette-printed-saree", title:"Georgette Printed Saree", cat:"Printed Pret", price:1799, compare:2499, rating:4, badge:"-28%",
      img:"https://source.unsplash.com/500x650/?georgette,saree", imgs:["https://source.unsplash.com/500x650/?georgette,saree","https://source.unsplash.com/500x650/?printed,saree","https://source.unsplash.com/500x650/?light,saree"],
      desc:"Easy-drape georgette saree with a contemporary print. Your go-to for work and casual outings." },
    { handle:"velvet-bridal-choli", title:"Velvet Bridal Lehenga Choli", cat:"Lengha Choli", price:11999, compare:15999, rating:5, badge:"PREMIUM",
      img:"https://source.unsplash.com/500x650/?velvet,bridal,lehenga", imgs:["https://source.unsplash.com/500x650/?velvet,bridal,lehenga","https://source.unsplash.com/500x650/?velvet,lehenga","https://source.unsplash.com/500x650/?heavy,lehenga"],
      desc:"Opulent velvet bridal lehenga choli with hand-embroidered detailing and a grand dupatta." },
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