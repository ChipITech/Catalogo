const WHATSAPP="573176274048"; 
const MERCADOLIBRE_URL="https://listado.mercadolibre.com.co/_CustId_588678241";

let products = [];

const grid=document.getElementById("grid"), search=document.getElementById("search"), cat=document.getElementById("cat"), sort=document.getElementById("sort");

function money(n){return "$ "+n.toLocaleString("es-CO")}
function wa(t){return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`}

function driveImageUrl(raw){
  if(!raw) return "";
  const url = raw.trim();
  const looksLikeBareId = /^[a-zA-Z0-9_-]{20,}$/.test(url);
  if(!/drive\.google\.com/.test(url) && !looksLikeBareId) return url;

  let id = "";
  let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if(m) id = m[1];
  if(!id){ m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/); if(m) id = m[1]; }
  if(!id && looksLikeBareId) id = url;
  if(!id) return url; // formato no reconocido: se usa tal cual, por si acaso

  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

function thumb(p){
  const src = driveImageUrl(p.image);
  if(src){
    return `<img src="${src}" alt="${p.name}" class="prod-img" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'icon-emoji',textContent:'${p.icon||"📦"}'}))">`;
  }
  return `<span class="icon-emoji">${p.icon||"📦"}</span>`;
}

function populateCategories(){
  cat.innerHTML = '<option value="all">Todas las categorías</option>';
  [...new Set(products.map(p=>p.cat))].forEach(c=>cat.innerHTML+=`<option>${c}</option>`);
}

/** ¿El producto tiene stock? Acepta número (0, 5...) o texto viejo ("En stock"/"Agotado"). */
function inStock(p){
  if(p.stock===null || p.stock===undefined || p.stock==="") return true;
  if(!isNaN(Number(p.stock))) return Number(p.stock)>0;
  return !/agotado|sin stock|no disponible/i.test(String(p.stock));
}
function stockLabel(p){
  if(!isNaN(Number(p.stock)) && p.stock!=="" && p.stock!==null){
    return inStock(p) ? `${p.stock} disponibles` : "Agotado";
  }
  return p.stock || (inStock(p) ? "En stock" : "Agotado");
}

function esSeminuevo(p){ return /seminuevo/i.test(String(p.condicion||"")); }
function destacados(){ return products.filter(p=>!esSeminuevo(p)); }
function seminuevos(){ return products.filter(p=>esSeminuevo(p)); }

function cardHtml(p,i){
  const sinStock = !inStock(p);
  return `
 <article class="card${sinStock?' out-of-stock':''}" style="animation-delay:${Math.min(i,9)*0.045}s"><div class="pic"><span class="tag">${p.brand}</span>${thumb(p)}</div>
 <div class="body"><div class="cat">${p.cat}</div><div class="name">${p.name}</div><div class="spec">${p.spec}</div>
 <div class="row"><div class="price">${money(p.price)}</div><div class="stock${sinStock?' out':''}">● ${stockLabel(p)}</div></div>
 <div class="actions"><button class="detail" onclick="details(${p.id})">Ver detalles</button><button class="quote" onclick="quote(${p.id})" ${sinStock?'disabled style="opacity:.5;cursor:not-allowed"':''}>Cotizar</button></div></div></article>`;
}

/** Ordena dejando siempre los productos sin stock al final del listado. */
function sortWithOutOfStockLast(a){
  return a.map((p,i)=>({p,i})).sort((x,y)=>{
    const xOut = !inStock(x.p), yOut = !inStock(y.p);
    if(xOut!==yOut) return xOut?1:-1;
    return x.i-y.i; // conserva el orden ya aplicado (precio, alfabético, etc.)
  }).map(x=>x.p);
}

function applyFilters(list){
 let a=[...list],q=search.value.toLowerCase();
 if(q)a=a.filter(p=>(p.name+" "+p.brand+" "+p.spec+" "+p.cat).toLowerCase().includes(q));
 if(cat.value!="all")a=a.filter(p=>p.cat==cat.value);
 if(sort.value=="low")a.sort((x,y)=>x.price-y.price);
 if(sort.value=="high")a.sort((x,y)=>y.price-x.price);
 if(sort.value=="az")a.sort((x,y)=>x.name.localeCompare(y.name));
 return sortWithOutOfStockLast(a);
}

function render(){
 const a=applyFilters(destacados());
 document.getElementById("count").textContent=a.length+" productos";
 document.getElementById("count").classList.remove("pulse");
 void document.getElementById("count").offsetWidth;
 document.getElementById("count").classList.add("pulse");
 grid.innerHTML=a.length?a.map((p,i)=>cardHtml(p,i)).join(""):`<div style="grid-column:1/-1;text-align:center;padding:50px;color:#4E6562">No encontramos productos con esos filtros.</div>`;
 renderSeminuevos();
}

function renderSeminuevos(){
 const wrap=document.getElementById("gridSeminuevos");
 const section=document.getElementById("seminuevos");
 if(!wrap||!section) return;
 const todos=seminuevos();
 if(!todos.length){ section.style.display="none"; return; }
 section.style.display="";
 const list=applyFilters(todos);
 wrap.innerHTML=list.length?list.map((p,i)=>cardHtml(p,i)).join(""):`<div style="grid-column:1/-1;text-align:center;padding:50px;color:#4E6562">No encontramos productos usados con esos filtros.</div>`;
}

function details(id){
  let p=products.find(x=>x.id==id);
  const miWrap=document.getElementById("mi");
  miWrap.innerHTML = thumb(p);
  document.getElementById("mn").textContent=p.name;
  document.getElementById("ms").textContent=p.spec+" Marca: "+p.brand+". Disponibilidad: "+stockLabel(p)+".";
  document.getElementById("mp").textContent=money(p.price);
  document.getElementById("mw").href=wa("Hola chipIT. Estoy interesado en "+p.name+". ¿Me confirman disponibilidad?");
  document.getElementById("modal").classList.add("open");
}
function closeModal(){document.getElementById("modal").classList.remove("open")}
function quote(id){let p=products.find(x=>x.id==id);window.open(wa("Hola chipIT. Quiero cotizar: "+p.name+". ¿Sigue disponible?"),"_blank")}
function shareCatalog(){if(navigator.share)navigator.share({title:"Catálogo chipIT",text:"Mira el catálogo de chipIT.",url:location.href});else navigator.clipboard?.writeText(location.href).then(()=>alert("Enlace copiado."))}

function animateFilters(){
 const controls=[document.querySelector('.tools .search'),cat,sort];
 controls.forEach((el,i)=>{el.style.animation='none'; void el.offsetWidth; el.style.animation=`filterIn .36s ${i*.06}s ease both`;});
}


async function loadProducts(){
  const sheetsMode = !!(typeof CONFIG !== 'undefined' && CONFIG.SHEET_API_URL && CONFIG.SHEET_API_URL.trim());
  if(sheetsMode){
    try{
      const resp = await fetch(CONFIG.SHEET_API_URL);
      if(!resp.ok) throw new Error('HTTP '+resp.status);
      const rows = await resp.json();
      if(Array.isArray(rows) && rows.length){
        return rows.map(r=>({...r, id:Number(r.id), price:Number(r.price),
          stock: (r.stock!==null && r.stock!=="" && !isNaN(Number(r.stock))) ? Number(r.stock) : r.stock}));
      }
    }catch(e){
      console.error('No se pudo leer Google Sheets, usando copia local:', e);
    }
  }
  try{
    const resp = await fetch('data/products.json');
    return await resp.json();
  }catch(e){
    console.error('No se pudo cargar data/products.json', e);
    return [];
  }
}

(async function init(){
  products = await loadProducts();
  populateCategories();
  render();

  document.getElementById("heroWa").href=wa("Holaa, quiero conocer el catálogo.");
  document.getElementById("mlBtn").href=MERCADOLIBRE_URL;

  search.addEventListener("input",()=>{render(); animateFilters()});
  cat.addEventListener("change",()=>{render(); animateFilters()});
  sort.addEventListener("change",()=>{render(); animateFilters()});
  document.getElementById("modal").addEventListener("click",e=>{if(e.target.id=="modal")closeModal()});

  /* --- Mejoras de animación --- */
  const header=document.querySelector("header");
  window.addEventListener("scroll",()=>{
   header.classList.toggle("scrolled", window.scrollY>10);
  },{passive:true});

  const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!prefersReducedMotion && "IntersectionObserver" in window){
   const revealObserver=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
     if(entry.isIntersecting){
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
     }
    });
   },{threshold:.25});
   document.querySelectorAll(".feature").forEach((el,i)=>{
    el.style.transitionDelay=(i*0.08)+"s";
    revealObserver.observe(el);
   });
  }else{
   document.querySelectorAll(".feature").forEach(el=>el.classList.add("in-view"));
  }

  document.addEventListener("keydown",(e)=>{
   if(e.key==="Escape" && document.getElementById("modal").classList.contains("open")) closeModal();
  });
})();