function irProductos(){

  document.getElementById("productos").scrollIntoView({
    behavior:"smooth"
  });

}

function toggleCategorias(){

  const menu = document.getElementById("dropdownCategorias");
  const btn = document.getElementById("btnCategorias");

  if(menu.style.display === "block"){
    menu.style.display = "none";
    if(btn) btn.setAttribute('aria-expanded','false');
    if(menu) menu.setAttribute('aria-hidden','true');
  }else{
    menu.style.display = "block";
    if(btn) btn.setAttribute('aria-expanded','true');
    if(menu) menu.setAttribute('aria-hidden','false');
  }

}

document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('btnCategorias');
  const ver = document.getElementById('btnVerProductos');

  if(btn) btn.addEventListener('click', toggleCategorias);
  if(ver) ver.addEventListener('click', irProductos);

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e){
    const menu = document.getElementById('dropdownCategorias');
    const btn = document.getElementById('btnCategorias');
    if(!menu || !btn) return;
    if(menu.style.display === 'block' && !menu.contains(e.target) && !btn.contains(e.target)){
      menu.style.display = 'none';
      btn.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-hidden','true');
    }
  });

  // --- Shopping cart: inject UI and handlers ---
  initCart();
});

// Cart implementation (persistent via localStorage)
const CART_KEY = 'glowbeauty_cart_v1';
const SHIPPING_KEY = 'glowbeauty_shipping_v1';
const SHIPPING_COST = 2990; // in CLP

function initCart(){
  injectCartUI();
  renderCart();

  // add-to-cart buttons (delegation)
  document.body.addEventListener('click', function(e){
    const t = e.target;
    if(t.classList && t.classList.contains('add-to-cart')){
      const name = t.getAttribute('data-name');
      const price = parseInt(t.getAttribute('data-price'),10) || 0;
      addToCart({name, price, qty:1});
    }
  });
}

function getCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }catch(e){
    return [];
  }
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(item){
  const cart = getCart();
  // try to find same item by name
  const idx = cart.findIndex(c => c.name === item.name);
  if(idx > -1){
    cart[idx].qty += item.qty;
  }else{
    cart.push(item);
  }
  saveCart(cart);
}

function removeFromCart(index){
  const cart = getCart();
  if(index >=0 && index < cart.length){
    cart.splice(index,1);
    saveCart(cart);
  }
}

function updateQty(index, qty){
  const cart = getCart();
  if(index >=0 && index < cart.length){
    cart[index].qty = Math.max(1, parseInt(qty,10)||1);
    saveCart(cart);
  }
}

function formatCurrency(n){
  return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getShippingEnabled(){
  return localStorage.getItem(SHIPPING_KEY) === '1';
}

function setShippingEnabled(val){
  localStorage.setItem(SHIPPING_KEY, val ? '1' : '0');
  renderCart();
}

function injectCartUI(){
  if(document.getElementById('glow-cart')) return;
  const html = `
    <div id="glow-cart" aria-live="polite">
      <button id="glow-cart-toggle" aria-expanded="false">🛒 <span id="glow-cart-count">0</span></button>
      <div id="glow-cart-panel" role="dialog" aria-hidden="true">
        <h4>Tu carrito</h4>
        <div id="glow-cart-items"></div>
        <div id="glow-cart-summary">
          <label><input type="checkbox" id="glow-shipping"> Envío (${formatCurrency(SHIPPING_COST)})</label>
          <div>Subtotal: <span id="glow-subtotal">$0</span></div>
          <div>Total: <strong id="glow-total">$0</strong></div>
        </div>
        <div id="glow-cart-actions">
          <button id="glow-clear">Vaciar</button>
          <button id="glow-checkout">Pagar por WhatsApp</button>
        </div>
      </div>
    </div>
  `;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);

  // Styles are provided in style.css (GlowBeauty theme).

  // toggle
  const toggle = document.getElementById('glow-cart-toggle');
  const panel = document.getElementById('glow-cart-panel');
  toggle.addEventListener('click', function(){
    const opened = panel.style.display === 'block';
    panel.style.display = opened ? 'none' : 'block';
    toggle.setAttribute('aria-expanded', opened ? 'false' : 'true');
    panel.setAttribute('aria-hidden', opened ? 'true' : 'false');
  });

  // actions
  document.getElementById('glow-clear').addEventListener('click', function(){
    localStorage.removeItem(CART_KEY);
    renderCart();
  });

  document.getElementById('glow-checkout').addEventListener('click', function(){
    checkoutViaWhatsApp();
  });

  document.getElementById('glow-shipping').addEventListener('change', function(e){
    setShippingEnabled(e.target.checked);
  });

  // delegate remove and qty change
  document.getElementById('glow-cart-items').addEventListener('click', function(e){
    if(e.target.classList.contains('glow-remove')){
      const idx = parseInt(e.target.getAttribute('data-idx'),10);
      removeFromCart(idx);
    }
  });
  document.getElementById('glow-cart-items').addEventListener('change', function(e){
    if(e.target.classList.contains('glow-qty')){
      const idx = parseInt(e.target.getAttribute('data-idx'),10);
      updateQty(idx, e.target.value);
    }
  });
}

function renderCart(){
  const cart = getCart();
  const count = cart.reduce((s,i) => s + (i.qty||0),0);
  const countEl = document.getElementById('glow-cart-count');
  if(countEl) countEl.textContent = count;

  const itemsEl = document.getElementById('glow-cart-items');
  if(!itemsEl) return;
  itemsEl.innerHTML = '';
  let subtotal = 0;
  cart.forEach((it,idx) =>{
    const line = document.createElement('div');
    line.className = 'glow-cart-item';
    const lineHtml = `
      <div>
        <div style="font-weight:bold">${it.name}</div>
        <div style="color:#666">${formatCurrency(it.price)}</div>
      </div>
      <div>
        <input class="glow-qty" data-idx="${idx}" type="number" min="1" value="${it.qty}">
        <div style="text-align:right;margin-top:6px"><button class="glow-remove" data-idx="${idx}">Quitar</button></div>
      </div>
    `;
    line.innerHTML = lineHtml;
    itemsEl.appendChild(line);
    subtotal += (it.price * it.qty);
  });

  const shippingOn = getShippingEnabled();
  const shippingCheckbox = document.getElementById('glow-shipping');
  if(shippingCheckbox) shippingCheckbox.checked = shippingOn;

  const subtotalEl = document.getElementById('glow-subtotal');
  const totalEl = document.getElementById('glow-total');
  const total = subtotal + (shippingOn ? SHIPPING_COST : 0);
  if(subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if(totalEl) totalEl.textContent = formatCurrency(total);
}

function checkoutViaWhatsApp(){
  const cart = getCart();
  if(cart.length === 0){
    alert('El carrito está vacío');
    return;
  }
  let message = 'Hola, quiero hacer un pedido:%0A';
  cart.forEach(it =>{
    message += `- ${it.name} x${it.qty} = ${formatCurrency(it.price * it.qty)}%0A`;
  });
  const shippingOn = getShippingEnabled();
  const subtotal = cart.reduce((s,i)=> s + i.price * i.qty,0);
  if(shippingOn){
    message += `%0AEnvío: ${formatCurrency(SHIPPING_COST)}%0A`;
  }
  message += `%0ATotal: ${formatCurrency(subtotal + (shippingOn ? SHIPPING_COST : 0))}`;
  const phone = '56983814763';
  const url = `https://wa.me/${phone}?text=${message}`;
  window.open(url, '_blank');
};