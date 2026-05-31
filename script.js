/* =============================================================
   MATÍAS PARFUM V2 — script.js
   Complemento externo del index.html
   Todas las funciones referenciadas desde el HTML están aquí,
   con fallback seguro si el inline ya las declaró primero.
   ============================================================= */

'use strict';

// ─────────────────────────────────────────────────────────────
// 0. CONSTANTES GLOBALES
// ─────────────────────────────────────────────────────────────
const WA_NUMBER = '50683674466';

// ─────────────────────────────────────────────────────────────
// 1. WHATSAPP
// ─────────────────────────────────────────────────────────────

/**
 * Abre WhatsApp con mensaje pre-cargado para un perfume específico.
 * @param {string} nombre - Nombre completo del perfume.
 */
function consultarPerfume(nombre) {
  const msg =
    `Hola, me gustaría recibir información sobre el perfume "${nombre}", ` +
    `incluyendo disponibilidad y precio. Muchas gracias.`;
  window.open(
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

/**
 * Abre WhatsApp con mensaje general de consulta.
 */
function consultarGeneral() {
  const msg =
    'Hola, me gustaría recibir información sobre sus perfumes, ' +
    'disponibilidad y precios. Quedo atento. Muchas gracias.';
  window.open(
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`,
    '_blank',
    'noopener,noreferrer'
  );
}

// ─────────────────────────────────────────────────────────────
// 2. NAVBAR — SCROLL + MOBILE MENU
// ─────────────────────────────────────────────────────────────
(function initNav() {
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!nav || !hamburger || !mobileMenu) return;

  // Navbar scrolled state
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Hamburger toggle
  hamburger.addEventListener('click', function () {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu when pressing Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMobile();
    }
  });
})();

/**
 * Cierra el menú móvil. Llamado desde los links del menú vía onclick.
 */
function closeMobile() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!mobileMenu) return;
  mobileMenu.classList.remove('open');
  if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ─────────────────────────────────────────────────────────────
// 3. HERO PARALLAX — sólo desktop, RAF-based, sin jank
// ─────────────────────────────────────────────────────────────
(function initParallax() {
  const heroBg = document.getElementById('heroBg');
  if (!heroBg) return;

  let rafPending = false;

  function applyParallax() {
    if (window.innerWidth > 768 && window.scrollY < window.innerHeight) {
      heroBg.style.transform = `translateY(${window.scrollY * 0.22}px)`;
    } else if (window.scrollY >= window.innerHeight) {
      heroBg.style.transform = 'translateY(0)';
    }
    rafPending = false;
  }

  window.addEventListener('scroll', function () {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(applyParallax);
    }
  }, { passive: true });
})();

// ─────────────────────────────────────────────────────────────
// 4. SCROLL REVEAL — IntersectionObserver
// ─────────────────────────────────────────────────────────────
(function initReveal() {
  // Secciones con clase .reveal
  const revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObs.observe(el);
  });

  // Cards con stagger escalonado (grupos de 6)
  const cardObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentNode.children);
        const idx      = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${(idx % 6) * 55}ms`;
        entry.target.classList.add('in');
        cardObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.card').forEach(function (el) {
    cardObs.observe(el);
  });
})();

// ─────────────────────────────────────────────────────────────
// 5. FILTROS DEL CATÁLOGO
// ─────────────────────────────────────────────────────────────

// Estado global de filtros
var activeFilters = {
  tipo:    'Todos',
  marca:   'Todos',
  precio:  'Todos',
  familia: 'Todos',
  query:   ''
};

/**
 * Normaliza texto para comparación insensible a mayúsculas y acentos.
 */
function normStr(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrae el precio numérico de una card a partir de su elemento .precio.
 * @param {HTMLElement} card
 * @returns {number|null}
 */
function getPrecioNum(card) {
  const el = card.querySelector('.precio');
  if (!el) return null;
  const digits = (el.textContent || '').replace(/[^\d]/g, '');
  const n = parseInt(digits, 10);
  return isNaN(n) ? null : n;
}

/**
 * Aplica todos los filtros activos al catálogo y actualiza contadores.
 */
function aplicarFiltros() {
  var cards  = document.querySelectorAll('.card');
  var counts = { Hombre: 0, Mujer: 0, Unisex: 0, total: 0 };

  cards.forEach(function (card) {
    var nombre  = normStr(card.dataset.nombre  || '');
    var tipo    = (card.dataset.tipo    || '').trim();
    var brand   = (card.dataset.brand   || '').trim();
    var familia = (card.dataset.familia || '').trim();

    var okQuery  = !activeFilters.query ||
                   nombre.includes(normStr(activeFilters.query));
    var okTipo   = activeFilters.tipo   === 'Todos' || tipo   === activeFilters.tipo;
    var okMarca  = activeFilters.marca  === 'Todos' || brand  === activeFilters.marca;
    var okFam    = activeFilters.familia === 'Todos' ||
                   normStr(familia).includes(normStr(activeFilters.familia));

    var okPrecio = true;
    if (activeFilters.precio !== 'Todos') {
      var pn = getPrecioNum(card);
      if (pn === null) {
        okPrecio = false;
      } else {
        var parts = activeFilters.precio.split('-').map(Number);
        okPrecio  = pn >= parts[0] && pn <= parts[1];
      }
    }

    var visible = okQuery && okTipo && okMarca && okFam && okPrecio;
    card.style.display = visible ? '' : 'none';
    if (visible) {
      counts[tipo] = (counts[tipo] || 0) + 1;
      counts.total++;
    }
  });

  // Actualizar visibilidad de secciones y estados vacíos
  ['Hombre', 'Mujer', 'Unisex'].forEach(function (t) {
    var sec     = document.querySelector('[data-seccion="' + t + '"]');
    var empty   = document.getElementById('empty'   + t);
    var countEl = document.getElementById('count'   + t);
    if (!sec) return;

    var hidden = (activeFilters.tipo !== 'Todos' && activeFilters.tipo !== t);
    sec.style.display = hidden ? 'none' : '';

    var n = counts[t] || 0;
    if (empty)   empty.classList.toggle('show', n === 0 && !hidden);
    if (countEl) countEl.textContent = n > 0
      ? n + ' fragancia' + (n !== 1 ? 's' : '')
      : '';
  });

  // Contador global
  var countEl = document.getElementById('filterCount');
  if (countEl) {
    var t = counts.total;
    countEl.textContent = t + ' fragancia' + (t !== 1 ? 's' : '');
  }
}

// Debounce para el buscador
var _searchTimer;
/**
 * Disparado en keyup del input de búsqueda.
 */
function filtrarPerfumes() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function () {
    var buscador = document.getElementById('buscador');
    activeFilters.query = buscador ? buscador.value : '';
    aplicarFiltros();
  }, 150);
}

/**
 * Filtra por tipo (Todos / Hombre / Mujer / Unisex).
 * Llamado desde los botones del filter-bar via onclick="filtrarTipo('X', event)".
 * @param {string} tipo
 * @param {Event}  event
 */
function filtrarTipo(tipo, event) {
  activeFilters.tipo = tipo;

  // Actualizar estado visual de los botones
  document.querySelectorAll('.filter-types button').forEach(function (btn) {
    var isActive = (btn.textContent.trim() === tipo) ||
                   (tipo === 'Todos' && btn.textContent.trim() === 'Todos');
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  aplicarFiltros();

  // Scroll suave a la primera sección visible
  setTimeout(function () {
    var firstVisible = document.querySelector(
      '.catalogue:not([style*="display: none"])'
    );
    if (firstVisible) firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

/**
 * Filtra por marca desde el <select> del filter-bar.
 * @param {string} val - Valor del select.
 */
function filtrarMarcaSelect(val) {
  activeFilters.marca = val;
  // Sincronizar botones del brand strip
  document.querySelectorAll('.brand-btn').forEach(function (btn) {
    btn.classList.toggle('active',
      btn.dataset.brand === val ||
      (val === 'Todos' && btn.dataset.brand === 'Todos')
    );
  });
  aplicarFiltros();
}

/**
 * Filtra por marca desde el brand strip (botones).
 * Llamado con onclick="filtrarMarca(this)".
 * @param {HTMLButtonElement} btn
 */
function filtrarMarca(btn) {
  var val = btn.dataset.brand || 'Todos';
  activeFilters.marca = val;

  document.querySelectorAll('.brand-btn').forEach(function (b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');

  var sel = document.getElementById('filtroMarca');
  if (sel) sel.value = val;

  aplicarFiltros();
  document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Filtra por rango de precio.
 * @param {string} val - "0-30000" | "30001-50000" | etc.
 */
function filtrarPrecio(val) {
  activeFilters.precio = val;
  aplicarFiltros();
}

/**
 * Filtra por familia aromática.
 * @param {string} val
 */
function filtrarFamilia(val) {
  activeFilters.familia = val;
  aplicarFiltros();
}

/**
 * Limpia todos los filtros y resetea la UI.
 */
function limpiarFiltros() {
  activeFilters = { tipo: 'Todos', marca: 'Todos', precio: 'Todos', familia: 'Todos', query: '' };

  var buscador = document.getElementById('buscador');
  if (buscador) buscador.value = '';

  ['filtroMarca', 'filtroPrecio', 'filtroFamilia'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = 'Todos';
  });

  document.querySelectorAll('.filter-types button').forEach(function (btn, i) {
    btn.classList.toggle('active', i === 0);
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
  });

  document.querySelectorAll('.brand-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.brand === 'Todos');
  });

  aplicarFiltros();
}

// ─────────────────────────────────────────────────────────────
// 6. POPULADO DEL SELECT DE MARCAS
// ─────────────────────────────────────────────────────────────
(function populateMarcaSelect() {
  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('filtroMarca');
    if (!sel) return;

    var brands = new Set();
    document.querySelectorAll('.card').forEach(function (card) {
      var b = (card.dataset.brand || '').trim();
      if (b && b !== 'Otra') brands.add(b);
    });

    Array.from(brands).sort().forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      sel.appendChild(opt);
    });

    // Estado inicial: mostrar todo
    aplicarFiltros();
  });
})();

// ─────────────────────────────────────────────────────────────
// 7. COMPARADOR DE PERFUMES
// ─────────────────────────────────────────────────────────────
var compItems = [];

/**
 * Agrega o quita un perfume del comparador al hacer clic en ⊕.
 * @param {HTMLElement} card
 */
function toggleComparar(card) {
  var nombre = card.dataset.nombre;
  var idx    = compItems.findIndex(function (c) { return c.nombre === nombre; });

  if (idx > -1) {
    // Ya está — quitar
    compItems.splice(idx, 1);
    card.classList.remove('en-comparador');
  } else {
    // Agregar (máx 2, reemplaza el más antiguo si ya hay 2)
    if (compItems.length >= 2) {
      var oldest = document.querySelector('[data-nombre="' + compItems[0].nombre + '"]');
      if (oldest) oldest.classList.remove('en-comparador');
      compItems.shift();
    }
    var img = card.querySelector('img');
    compItems.push({
      nombre:    card.dataset.nombre    || '',
      brand:     card.dataset.brand     || '',
      img:       img ? img.src          : '',
      precio:    (card.querySelector('.precio')       || {}).textContent || '',
      href:      (card.querySelector('.card-image-wrap') || {}).href    || '#',
      familia:   card.dataset.familia   || '',
      intensidad:parseInt(card.dataset.intensidad, 10) || 3,
      duracion:  parseInt(card.dataset.duracion,   10) || 7
    });
    card.classList.add('en-comparador');
  }
  _updateComparadorBar();
}

function _updateComparadorBar() {
  var bar  = document.getElementById('comparadorBar');
  var cta  = document.getElementById('compCta');
  var hint = document.getElementById('compHint');
  if (!bar) return;

  ['compSlot1', 'compSlot2'].forEach(function (id, i) {
    var slot = document.getElementById(id);
    if (!slot) return;
    var item = compItems[i];
    if (item) {
      slot.classList.add('filled');
      var short = item.nombre.length > 28
        ? item.nombre.substring(0, 28) + '…'
        : item.nombre;
      slot.innerHTML =
        '<span class="comp-slot-name">' + short + '</span>' +
        '<span class="comp-slot-remove" onclick="quitarDeComparador(' + i + ')" ' +
        'aria-label="Quitar del comparador" role="button" tabindex="0">×</span>';
    } else {
      slot.classList.remove('filled');
      slot.innerHTML = '<span class="comp-slot-name">Elige un perfume…</span>';
    }
  });

  var n = compItems.length;
  bar.classList.toggle('show', n > 0);
  if (cta) cta.disabled = n < 2;
  if (hint) {
    hint.textContent = n === 0
      ? 'Selecciona hasta 2 fragancias para comparar'
      : n === 1
        ? 'Selecciona un perfume más para comparar'
        : '¡Listos para comparar!';
  }
}

/**
 * Quita un producto del comparador por su índice.
 * @param {number} idx
 */
function quitarDeComparador(idx) {
  if (!compItems[idx]) return;
  var card = document.querySelector('[data-nombre="' + compItems[idx].nombre + '"]');
  if (card) card.classList.remove('en-comparador');
  compItems.splice(idx, 1);
  _updateComparadorBar();
}

/**
 * Oculta la barra del comparador y limpia la selección.
 */
function cerrarComparadorBar() {
  compItems.forEach(function (c) {
    var card = document.querySelector('[data-nombre="' + c.nombre + '"]');
    if (card) card.classList.remove('en-comparador');
  });
  compItems = [];
  _updateComparadorBar();
}

/**
 * Abre el modal con la comparación de los 2 perfumes seleccionados.
 */
function abrirComparador() {
  if (compItems.length < 2) return;

  var modal = document.getElementById('compModal');
  var cols  = document.getElementById('compCols');
  if (!modal || !cols) return;

  function renderDots(n, max) {
    max = max || 5;
    var html = '';
    for (var i = 0; i < max; i++) {
      html += '<span class="comp-dot' + (i < n ? ' lit' : '') +
              '" aria-hidden="true"></span>';
    }
    return html;
  }

  cols.innerHTML = compItems.map(function (p) {
    var safeName = (p.nombre || '').replace(/'/g, "\\'");
    return [
      '<div class="comp-col">',
      '  <div class="comp-col-img">',
      '    <img src="' + p.img + '" alt="' + p.nombre + '" loading="lazy"',
      '         style="max-width:70%;max-height:180px;object-fit:contain">',
      '  </div>',
      '  <div class="comp-col-brand">' + p.brand + '</div>',
      '  <h3 class="comp-col-name">' + p.nombre + '</h3>',
      '  <div class="comp-row-attr">',
      '    <span class="comp-attr-label">Familia</span>',
      '    <span class="comp-attr-val">' + (p.familia || '—') + '</span>',
      '  </div>',
      '  <div class="comp-row-attr">',
      '    <span class="comp-attr-label">Precio</span>',
      '    <span class="comp-attr-val gold">' + p.precio + '</span>',
      '  </div>',
      '  <div class="comp-row-attr">',
      '    <span class="comp-attr-label">Intensidad</span>',
      '    <span class="comp-attr-val">',
      '      <span class="comp-dots">' + renderDots(p.intensidad) + '</span>',
      '    </span>',
      '  </div>',
      '  <div class="comp-row-attr">',
      '    <span class="comp-attr-label">Duración estimada</span>',
      '    <span class="comp-attr-val">' + p.duracion + '+ horas</span>',
      '  </div>',
      '  <div class="comp-actions">',
      '    <button class="comp-wa-btn" onclick="consultarPerfume(\'' + safeName + '\')"',
      '            aria-label="Consultar ' + p.nombre + ' por WhatsApp">',
      '      Consultar por WhatsApp →',
      '    </button>',
      '    <a href="' + p.href + '" class="comp-wa-btn"',
      '       style="background:transparent;border:1px solid var(--line);color:var(--stone-dim)">',
      '      Ver perfume →',
      '    </a>',
      '  </div>',
      '</div>'
    ].join('\n');
  }).join('');

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Focus trap: foco al botón de cerrar
  var closeBtn = modal.querySelector('.comp-close');
  if (closeBtn) closeBtn.focus();
}

/**
 * Cierra el modal del comparador.
 */
function cerrarModal() {
  var modal = document.getElementById('compModal');
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// Cerrar modal al hacer clic en el fondo o con Escape
(function initComparadorModal() {
  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('compModal');
    if (!modal) return;

    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        cerrarModal();
      }
    });
  });
})();

// Inyectar botón ⊕ en cada card
(function injectCompareButtons() {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.card').forEach(function (card) {
      // Evitar duplicar si ya existe
      if (card.querySelector('.comp-add-btn')) return;

      var btn = document.createElement('button');
      btn.className = 'comp-add-btn';
      btn.setAttribute('aria-label', 'Agregar al comparador');
      btn.setAttribute('title', 'Comparar');
      btn.textContent = '⊕';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleComparar(card);
      });

      var body = card.querySelector('.card-body');
      if (body) body.appendChild(btn);
    });
  });
})();

// ─────────────────────────────────────────────────────────────
// 8. FINDER — Encuentra tu perfume ideal
// ─────────────────────────────────────────────────────────────
var finderState = {};

/**
 * Registra la selección del usuario en el Finder y avanza al siguiente paso.
 * Llamado con onclick="selectFinder(this)" desde cada .finder-opt.
 * @param {HTMLElement} el
 */
function selectFinder(el) {
  var key = el.dataset.key;
  var val = el.dataset.val;

  // Deseleccionar opciones del mismo grupo
  var siblings = el.parentNode.querySelectorAll('.finder-opt');
  siblings.forEach(function (opt) { opt.classList.remove('selected'); });
  el.classList.add('selected');

  finderState[key] = val;

  // Progresar pasos
  if (key === 'ocasion') {
    var step2 = document.getElementById('step2');
    if (step2) step2.classList.add('active');
  }

  if (key === 'familia') {
    _mostrarRecomendaciones();
  }
}

function _mostrarRecomendaciones() {
  var ocasion = finderState.ocasion || 'diario';
  var familia = finderState.familia || 'Fresco';

  // Buscar cards que coincidan con la familia
  var allCards = Array.from(document.querySelectorAll('.card'));
  var matches  = allCards.filter(function (card) {
    var cf = (card.dataset.familia || '').toLowerCase();
    return cf.includes(normStr(familia));
  });

  // Si no hay matches suficientes, usar todas
  if (matches.length < 3) matches = allCards;

  // Mezclar y tomar 3
  matches = matches
    .slice()
    .sort(function () { return Math.random() - 0.5; })
    .slice(0, 3);

  var result   = document.getElementById('finderResult');
  var grid     = document.getElementById('finderResultGrid');
  var titleEl  = document.getElementById('finderResultTitle');
  var descEl   = document.getElementById('finderResultDesc');

  if (!result || !grid) return;

  var ocasionLabels = {
    diario:   'uso diario',
    noche:    'salidas nocturnas',
    especial: 'ocasiones especiales'
  };
  var ocasionLabel = ocasionLabels[ocasion] || ocasion;

  if (titleEl) titleEl.textContent = 'Fragancias recomendadas para ti';
  if (descEl)  descEl.textContent  =
    'Para ' + ocasionLabel + ', con notas ' + familia.toLowerCase() +
    '. Perfecto para tu perfil aromático.';

  grid.innerHTML = matches.map(function (card) {
    var img    = card.querySelector('img');
    var nombre = card.dataset.nombre || '';
    var precio = (card.querySelector('.precio') || {}).textContent || '';
    var href   = (card.querySelector('.card-image-wrap') || {}).href || '#';
    var safeName = nombre.replace(/'/g, "\\'");

    return [
      '<div class="finder-result-card">',
      '  <a href="' + href + '">',
      '    <img src="' + (img ? img.src : '') + '" alt="' + nombre + '" loading="lazy">',
      '  </a>',
      '  <span class="finder-result-name">' + nombre + '</span>',
      '  <span class="finder-result-price">' + precio + '</span>',
      '  <button class="consultar-btn" onclick="consultarPerfume(\'' + safeName + '\')">',
      '    Consultar',
      '  </button>',
      '</div>'
    ].join('\n');
  }).join('');

  result.classList.add('show');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Alias público (por si algún onclick lo llama directamente)
var mostrarRecomendaciones = _mostrarRecomendaciones;

// ─────────────────────────────────────────────────────────────
// 9. BANNER ESTACIONAL (Valentine's Day — heredado del original)
// ─────────────────────────────────────────────────────────────
(function checkSeason() {
  var hoy   = new Date();
  var marzo = new Date(hoy.getFullYear(), 2, 1);
  if (hoy >= marzo) {
    var banner = document.getElementById('hero-valentin');
    if (banner) banner.style.display = 'none';
  }
})();

// ─────────────────────────────────────────────────────────────
// 10. UTILIDADES DE ACCESIBILIDAD
// ─────────────────────────────────────────────────────────────

// Permite activar botones con Enter/Space cuando tienen role="button"
document.addEventListener('keydown', function (e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
    e.preventDefault();
    e.target.click();
  }
});

// ─────────────────────────────────────────────────────────────
// 11. SMOOTH SCROLL para links de navegación con ancla
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href').slice(1);
      var target   = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
