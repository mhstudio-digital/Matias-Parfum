/* ══ Matías Parfum: Favoritos + Comparador + helper de carrito ══
   Usado en index.html, catalogo.html y las fichas de producto.
   No reemplaza la lógica de carrito propia de index.html/catalogo.html
   (que ya vive inline en esas páginas) — solo agrega favoritos,
   comparador, y para las fichas de producto sueltas, una forma de
   sumar al mismo carrito (localStorage 'mpCarritoV2') sin duplicar
   el modal completo. */
(function () {
  var FAV_KEY = 'mpFavoritosV1';
  var CART_KEY = 'mpCarritoV2';
  var COMPARE_KEY = 'mpCompararV1';
  var COMPARE_MAX = 3;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─── Favoritos ─────────────────────────────────────────── */
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

  /* ─── Carrito (helper para fichas de producto) ──────────── */
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

    if (typeof fbq === 'function') {
      fbq('track', 'AddToCart', {
        content_name: nombre,
        content_category: brand,
        content_ids: [location.pathname],
        content_type: 'product',
        value: precio * qty,
        currency: 'CRC'
      });
    }
  };

  /* ─── Comparador ─────────────────────────────────────────── */
  function getCompare() {
    try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveCompare(arr) {
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(arr)); } catch (e) {}
    syncCompareUI();
  }

  function syncCompareUI() {
    var list = getCompare();
    var hrefs = list.map(function (i) { return i.href; });
    document.querySelectorAll('.compare-btn[data-href]').forEach(function (btn) {
      btn.classList.toggle('is-compare', hrefs.indexOf(btn.dataset.href) > -1);
    });
    var n = list.length;
    document.querySelectorAll('[data-compare-count]').forEach(function (el) {
      el.textContent = n;
      el.classList.toggle('show', n > 0);
    });
    var modal = document.getElementById('compareModalBg');
    if (modal && modal.classList.contains('show')) renderCompareModal();
  }

  // btn: el botón clickeado (necesita data-href). item: datos del producto.
  window.mpToggleCompare = function (btn, item) {
    var list = getCompare();
    var idx = list.findIndex(function (i) { return i.href === item.href; });
    if (idx > -1) {
      list.splice(idx, 1);
      showToast('Quitado de comparar');
    } else {
      if (list.length >= COMPARE_MAX) {
        showToast('Máximo ' + COMPARE_MAX + ' productos para comparar');
        return;
      }
      list.push(item);
      showToast('Agregado a comparar ⇄');
    }
    saveCompare(list);
  };

  // Para fichas de producto sueltas: arma el item de comparación leyendo
  // el propio DOM de la página (título, marca, imagen, precio, specs).
  window.mpToggleCompareFromPage = function (btn) {
    var href = btn.dataset.href;
    if (!href) return;
    var titleEl = document.querySelector('.pp-title');
    var brandEl = document.querySelector('.pp-brand');
    var imgEl = document.querySelector('.pp-img');
    var priceEl = document.getElementById('priceDisplay');
    var nombre = titleEl ? titleEl.textContent.trim() : '';
    var brand = brandEl ? brandEl.textContent.trim() : '';
    var img = imgEl ? imgEl.getAttribute('src') : '';
    var precio = priceEl ? (parseInt(priceEl.dataset.price, 10) || 0) : 0;
    var familia = '', intensidad = '', duracion = '';
    document.querySelectorAll('.pp-spec').forEach(function (spec) {
      var lbl = spec.querySelector('.pp-spec-lbl');
      if (!lbl) return;
      var t = lbl.textContent.trim().toLowerCase();
      var val = spec.querySelector('.pp-spec-val');
      if (t === 'familia') {
        familia = val ? val.textContent.trim() : '';
      } else if (t.indexOf('duraci') === 0) {
        duracion = val ? val.textContent.trim() : '';
      } else if (t === 'intensidad') {
        var dots = spec.querySelector('.pp-dots');
        var label = dots ? dots.getAttribute('aria-label') : '';
        var m = label && label.match(/(\d+)/);
        intensidad = m ? m[1] : '';
      }
    });
    window.mpToggleCompare(btn, {
      href: href, nombre: nombre, brand: brand, img: img,
      precio: precio, familia: familia, intensidad: intensidad, duracion: duracion
    });
  };

  function renderCompareModal() {
    var body = document.getElementById('compareModalBody');
    var foot = document.getElementById('compareModalFooter');
    if (!body) return;
    var list = getCompare();
    if (!list.length) {
      body.innerHTML = '<div class="modal-empty"><p>No agregaste productos para comparar. Tocá el ícono ⇄ en cualquier producto (hasta ' + COMPARE_MAX + ').</p></div>';
      if (foot) foot.style.display = 'none';
      return;
    }
    if (foot) foot.style.display = '';

    var rows = [
      { key: 'img', label: '' },
      { key: 'nombre', label: 'Producto' },
      { key: 'brand', label: 'Marca' },
      { key: 'precio', label: 'Precio' },
      { key: 'familia', label: 'Familia' },
      { key: 'intensidad', label: 'Intensidad' },
      { key: 'duracion', label: 'Duración' }
    ];
    var html = '<table class="compare-table"><tbody>';
    rows.forEach(function (row) {
      html += '<tr><th>' + esc(row.label) + '</th>';
      list.forEach(function (item, i) {
        var val;
        if (row.key === 'img') {
          val = '<a href="' + esc(item.href) + '"><img src="' + esc(item.img) + '" alt="' + esc(item.nombre) + '" loading="lazy"></a>' +
                '<button type="button" class="compare-remove" onclick="mpRemoveCompare(' + i + ')" aria-label="Quitar ' + esc(item.nombre) + ' de comparar">Quitar ✕</button>';
        } else if (row.key === 'precio') {
          val = '₡' + (item.precio || 0).toLocaleString('es-CR');
        } else if (row.key === 'intensidad') {
          val = item.intensidad ? item.intensidad + '/5' : '—';
        } else if (row.key === 'nombre') {
          val = '<a href="' + esc(item.href) + '">' + esc(item.nombre) + '</a>';
        } else {
          val = esc(item[row.key]) || '—';
        }
        html += '<td>' + val + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    body.innerHTML = html;
  }

  window.mpRemoveCompare = function (idx) {
    var list = getCompare();
    list.splice(idx, 1);
    saveCompare(list);
  };
  window.mpClearCompare = function () {
    saveCompare([]);
  };
  window.mpAbrirCompareModal = function () {
    renderCompareModal();
    var bg = document.getElementById('compareModalBg');
    if (bg) { bg.classList.add('show'); document.body.style.overflow = 'hidden'; }
  };
  window.mpCerrarCompareModal = function () {
    var bg = document.getElementById('compareModalBg');
    if (bg) { bg.classList.remove('show'); document.body.style.overflow = ''; }
  };
  window.mpGetCompare = getCompare;

  /* ─── Toast ──────────────────────────────────────────────── */
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
    syncCompareUI();
    var p = new URLSearchParams(location.search);
    if (p.get('comparar') === '1' && typeof window.mpAbrirCompareModal === 'function') {
      window.mpAbrirCompareModal();
    }
  });
})();
