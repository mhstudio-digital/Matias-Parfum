/* Buscador instantáneo — Matías Parfum */
(function () {
  var INDEX_URL = '/search-index.json';
  var cache = null;
  var loading = null;

  function norm(s) {
    return (s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function fmt(v) {
    return '₡' + v.toLocaleString('es-CR');
  }

  function loadIndex() {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch(INDEX_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cache = data.map(function (it) {
          return {
            n: it.n, t: it.t, m: it.m, h: it.h, i: it.i, p: it.p,
            _n: norm(it.n), _m: norm(it.m)
          };
        });
        return cache;
      })
      .catch(function () { cache = []; return cache; });
    return loading;
  }

  function search(items, q) {
    var nq = norm(q).trim();
    if (!nq) return [];
    var terms = nq.split(/\s+/).filter(Boolean);
    return items.filter(function (it) {
      return terms.every(function (t) {
        return it._n.indexOf(t) !== -1 || it._m.indexOf(t) !== -1;
      });
    }).slice(0, 8);
  }

  function renderResults(container, results, query) {
    if (!query.trim()) {
      container.innerHTML = '<p class="search-hint">Escribí el nombre de un perfume o una marca…</p>';
      return;
    }
    if (!results.length) {
      container.innerHTML = '<p class="search-empty">No encontramos nada para "' + escapeHtml(query) + '". Probá con otro término o marca.</p>';
      return;
    }
    var html = results.map(function (it) {
      return '<a class="search-result-item" href="' + it.h + '">' +
        '<img src="' + it.i + '" alt="" loading="lazy">' +
        '<div class="search-result-info">' +
          '<div class="search-result-name">' + escapeHtml(it.n) + '</div>' +
          '<div class="search-result-brand">' + escapeHtml(it.m) + '</div>' +
        '</div>' +
        '<span class="search-result-price">' + fmt(it.p) + '</span>' +
      '</a>';
    }).join('');
    html += '<a class="search-viewall" href="/catalogo.html?buscar=' + encodeURIComponent(query) + '">Ver todos los resultados para "' + escapeHtml(query) + '" →</a>';
    container.innerHTML = html;
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function initGlobalSearch() {
    var btn = document.getElementById('navSearchBtn');
    var panel = document.getElementById('searchPanel');
    var input = document.getElementById('globalSearchInput');
    var results = document.getElementById('searchResults');
    if (!btn || !panel || !input || !results) return;

    var items = null;
    var debounceTimer = null;

    function open() {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(function () { input.focus(); }, 50);
      if (!items) {
        loadIndex().then(function (data) { items = data; });
      }
      renderResults(results, [], '');
    }

    function close() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      input.value = '';
    }

    function toggle() {
      if (panel.classList.contains('open')) close(); else open();
    }

    window.toggleSearch = toggle;
    btn.addEventListener('click', toggle);

    input.addEventListener('input', function () {
      var q = input.value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        loadIndex().then(function (data) {
          items = data;
          renderResults(results, search(data, q), q);
        });
      }, 120);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = input.value.trim();
        if (q) window.location.href = '/catalogo.html?buscar=' + encodeURIComponent(q);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && !panel.classList.contains('open')) {
        e.preventDefault();
        open();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalSearch);
  } else {
    initGlobalSearch();
  }
})();
