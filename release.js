// The latest Android test build, from GitHub's public API (no key; 60
// requests an hour per visitor, plenty for a page view). Fills in any
// element marked data-release="version" (0.14.2), "date" (3 November 2026)
// or "notes" (the release's What's new, as a list, at most data-max items),
// and shows anything marked data-release="box" once it has something to
// show. A failed request leaves the page as written.
(function () {
  var boxes = document.querySelectorAll('[data-release]');
  if (!boxes.length) return;
  fetch('https://api.github.com/repos/flatballconnect/flatball-releases/releases/latest', {
    headers: { Accept: 'application/vnd.github+json' }
  }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(fill)
    .catch(function () {});

  // What's new: the "- " lines of the notes, which tool/release-android.sh
  // copies from the changelog, without their Markdown.
  function changes(body) {
    var start = body.indexOf("**What's new**");
    var lines = (start < 0 ? body : body.slice(start)).split('\n');
    var items = [], current = null;
    lines.forEach(function (line) {
      if (/^- /.test(line)) { current = line.slice(2); items.push(current); }
      else if (current !== null && /^\s+\S/.test(line)) { items[items.length - 1] += ' ' + line.trim(); }
      else { current = null; }
    });
    return items.map(function (t) { return t.replace(/\*\*|`/g, ''); });
  }

  function fill(release) {
    var version = (release.tag_name || '').replace(/^v/, '');
    if (!version) return;
    var date = new Date(release.published_at).toLocaleDateString('en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' });
    var notes = changes(release.body || '');
    boxes.forEach(function (el) {
      var what = el.getAttribute('data-release');
      if (what === 'version') el.textContent = version;
      else if (what === 'date') el.textContent = date;
      else if (what === 'notes') {
        var max = parseInt(el.getAttribute('data-max') || '99', 10);
        el.textContent = '';
        notes.slice(0, max).forEach(function (t) {
          var li = document.createElement('li');
          li.textContent = t;
          el.appendChild(li);
        });
        if (notes.length > max) {
          var more = document.createElement('li');
          more.className = 'muted';
          more.textContent = 'and ' + (notes.length - max) + ' more';
          el.appendChild(more);
        }
      } else if (what === 'box') el.hidden = false;
    });
  }
})();
