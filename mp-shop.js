/* ══ Matías Parfum: Favoritos + helper de carrito (compartido) ══
   Usado en index.html, catalogo.html y las fichas de producto.
   No reemplaza la lógica de carrito propia de index.html/catalogo.html
   (que ya vive inline en esas páginas) — solo agrega favoritos y,
   para las fichas de producto sueltas, una forma de sumar al mismo
   carrito (localStorage 'mpCarritoV2') sin duplicar el modal completo. */
(function () {
  var FAV_KEY = 'mpFavoritosV1';
  var CART_KEY = 'mpCarritoV2';

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveFavs(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
    syncFavUI();
  }
  function isFav(href) {
    return getFavs().indexOf(href) > -1;
  }

  function syncFavUI() {
    var favs = getFavs();
    var btns = document.querySelectorAll('.fav-btn[data-href]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('is-fav', favs.indexOf(btns[i].dataset.href) > -1);
      btns[i].setAttribute('aria-pressed', favs.indexOf(btns[i].dataset.href) > -1 ? 'true' : 'false');
    }
    var n = favs.length;
    var counts = document.querySelectorAll('[data-fav-count]');
    for (var j = 0; j < counts.length; j++) {
      counts[j].textContent = n;
      counts[j].classList.toggle('show', n > 0);
    }
  }

  // Toggle de favorito. btn debe tener data-href con la URL del producto.
  window.mpToggleFav = function (btn) {
    var href = btn.dataset.href;
    if (!href) return;
    var favs = getFavs();
    var idx = favs.indexOf(href);
    if (idx > -1) {
      favs.splice(idx, 1);
      showToast('Quitado de favoritos');
    } else {
      favs.push(href);
      showToast('Agregado a favoritos ❤');
    }
    saveFavs(favs);
    if (typeof window.mpOnFavChange === 'function') window.mpOnFavChange();
  };
  window.mpIsFav = isFav;
  window.mpGetFavs = getFavs;

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveCart(arr) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(arr)); } catch (e) {}
    syncCartBadges();
  }
  function syncCartBadges() {
    var cart = getCart();
    var qty = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var counts = document.querySelectorAll('[data-cart-count]');
    for (var i = 0; i < counts.length; i++) {
      counts[i].textContent = qty;
      counts[i].classList.toggle('show', qty > 0);
    }
  }

  // Para fichas de producto sueltas: agrega el producto de la página
  // (leído del JSON-LD Product ya presente en el <head>) al mismo
  // carrito que usan catalogo.html/index.html.
  window.mpAddToCartFromPage = function (qty) {
    qty = qty || 1;
    var ld = document.querySelector('script[type="application/ld+json"]');
    if (!ld) return;
    var data;
    try { data = JSON.parse(ld.textContent); } catch (e) { return; }
    if (!data || data['@type'] !== 'Product') return;

    var nombre = data.name || '';
    var brand = (data.brand && data.brand.name) || '';
    var img = (data.image || '').replace('https://matiasparfum.com', '');
    var precio = parseInt((data.offers && data.offers.price) || 0, 10) || 0;

    var cart = getCart();
    var idx = cart.findIndex(function (i) { return i.nombre === nombre && i.brand === brand; });
    if (idx > -1) cart[idx].qty += qty;
    else cart.push({ nombre: nombre, brand: brand, img: img, precio: precio, qty: qty });
    saveCart(cart);
    showToast('Agregado al carrito 🛒');
  };

  var toastTimer = null;
  window.showToast = function (msg) {
    var el = document.getElementById('mpToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mpToast';
      el.className = 'mp-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  };

  document.addEventListener('DOMContentLoaded', function () {
    syncFavUI();
    syncCartBadges();
  });
})();
