// The top bar's menu on a phone, on every page: it closes when a link in it
// is followed, or on a tap elsewhere.
(function () {
  var menu = document.querySelector('.menu');
  if (!menu) return;
  document.addEventListener('click', function (e) {
    if (menu.open && (!menu.contains(e.target) || e.target.closest('a'))) menu.open = false;
  });
})();
