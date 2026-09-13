/* Botón "Compartir" en fichas de producto — Matías Parfum */
(function () {
  function fmtPrice(n) {
    return '₡' + n.toLocaleString('es-CR');
  }

  function init() {
    var btn = document.getElementById('btnShare');
    if (!btn) return;

    var canonical = document.querySelector('link[rel="canonical"]');
    var url = canonical ? canonical.href : window.location.href;

    var brandEl = document.querySelector('.pp-brand');
    var titleEl = document.querySelector('.pp-title');
    var name = (brandEl ? brandEl.textContent.trim() + ' ' : '') + (titleEl ? titleEl.textContent.trim() : document.title);

    var priceEl = document.getElementById('priceDisplay');
    var priceRaw = priceEl && priceEl.dataset.price ? parseInt(priceEl.dataset.price, 10) : null;
    var priceText = priceRaw ? fmtPrice(priceRaw) : '';

    var shareText = 'Mirá este perfume en Matías Parfum: ' + name + (priceText ? ' — ' + priceText : '');
    var label = btn.querySelector('.pp-share-label');

    function flash(text, ms) {
      if (!label) return;
      var original = label.textContent;
      btn.classList.add('is-done');
      label.textContent = text;
      setTimeout(function () {
        btn.classList.remove('is-done');
        label.textContent = original;
      }, ms || 1800);
    }

    function copyFallback() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          flash('¡Link copiado!');
        }).catch(function () {
          window.prompt('Copiá el link:', url);
        });
      } else {
        window.prompt('Copiá el link:', url);
      }
    }

    btn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: name, text: shareText, url: url }).catch(function () {});
      } else {
        copyFallback();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
