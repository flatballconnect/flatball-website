// The home page: the features' phone and the screenshots.
// Without this script the page still reads: the phone stays on its first
// screen and the screenshots scroll by hand.
(function () {
  // Choosing a feature shows its screen. On a phone the screen is above the
  // list and may be off the top, so a tap brings it back into view.
  var stage = document.querySelector('#stage img');
  var features = document.querySelectorAll('button.feature');
  function choose(feature) {
    features.forEach(function (f) {
      var on = f === feature;
      f.classList.toggle('on', on);
      f.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (stage.getAttribute('src') !== feature.dataset.screen) stage.src = feature.dataset.screen;
    stage.alt = feature.dataset.alt;
  }
  features.forEach(function (feature) {
    feature.addEventListener('mouseenter', function () { choose(feature); });
    feature.addEventListener('focus', function () { choose(feature); });
    feature.addEventListener('click', function () {
      choose(feature);
      var top = stage.getBoundingClientRect().top;
      if (top < 60) stage.parentNode.scrollIntoView({ block: 'start' });
    });
  });

  // The screenshots: arrows and dots over a strip that scrolls by itself.
  var track = document.querySelector('.track');
  var phones = track.querySelectorAll('.phone');
  var prev = document.querySelector('.arrow.prev');
  var next = document.querySelector('.arrow.next');
  var dotsBox = document.querySelector('.dots');
  var dots = [];
  phones.forEach(function () {
    var dot = document.createElement('i');
    dotsBox.appendChild(dot);
    dots.push(dot);
  });
  function step() {
    return phones.length > 1 ? phones[1].offsetLeft - phones[0].offsetLeft : 1;
  }
  function refresh() {
    var i = Math.round(track.scrollLeft / step());
    var end = track.scrollWidth - track.clientWidth;
    // At the end of the strip the last screen is the one in view.
    if (track.scrollLeft >= end - 2) i = phones.length - 1;
    dots.forEach(function (d, n) { d.classList.toggle('on', n === i); });
    prev.hidden = track.scrollLeft <= 2;
    next.hidden = track.scrollLeft >= end - 2;
  }
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function scroll(by) { track.scrollBy({ left: by, behavior: calm ? 'auto' : 'smooth' }); }
  prev.addEventListener('click', function () { scroll(-step()); });
  next.addEventListener('click', function () { scroll(step()); });
  track.addEventListener('scroll', refresh, { passive: true });
  window.addEventListener('resize', refresh);
  refresh();
})();
