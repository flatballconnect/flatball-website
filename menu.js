// The top bar's menu on a phone, on every page: it closes when a link in it
// is followed, or on a tap elsewhere.
(function () {
  var menu = document.querySelector('.menu');
  if (!menu) return;
  document.addEventListener('click', function (e) {
    if (menu.open && (!menu.contains(e.target) || e.target.closest('a'))) menu.open = false;
  });
})();

// The warm-up behind the blue header (warmup.js), loaded from beside this
// file, so every page has it without a script tag of its own.
(function () {
  var me = document.currentScript;
  if (!me) return;
  var s = document.createElement('script');
  s.src = me.src.replace(/menu\.js(\?.*)?$/, 'warmup.js');
  s.defer = true;
  document.head.appendChild(s);
})();
