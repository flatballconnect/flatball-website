// Behind every page's blue header: a warm-up seen from above, the same one
// the app plays behind its tabs. Four players at each end throw three discs
// to each other; a receiver calls for a disc and runs to meet it, and the
// rest wander near their end. The camera drifts a little now and then.
// Everything is slow on purpose: it is a backdrop, not something to watch.
//
// Without this script, or when the visitor asks for less motion, the
// header keeps its still drawing (the hero's SVG, page-art.svg). It stops
// while the header is off screen or the tab is hidden.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var heads = document.querySelectorAll('.hero, .page-hero');
  if (!heads.length || !window.requestAnimationFrame) return;

  var PACE = 1 / 3.5; // share of real time: slow and floaty
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function Warmup(head) {
    var canvas = document.createElement('canvas');
    canvas.className = 'warmup';
    canvas.setAttribute('aria-hidden', 'true');
    head.insertBefore(canvas, head.firstChild);
    head.classList.add('playing');
    this.head = head;
    this.canvas = canvas;
    this.W = 1000;
    // The field's height follows the header's shape (see draw).
    this.H = head.clientWidth ? 1000 * head.clientHeight / head.clientWidth : 600;
    // The ends: left and right, away from the words in the middle.
    this.ends = [[30, 230], [770, 970]];
    this.players = [];
    for (var e = 0; e < 2; e++) {
      for (var i = 0; i < 4; i++) {
        var x = rnd(this.ends[e][0], this.ends[e][1]), y = rnd(70, this.H - 70);
        this.players.push({ e: e, x: x, y: y, tx: x, ty: y, next: rnd(0, 4), busy: false, run: null });
      }
    }
    var self = this;
    this.discs = [0, 4, 1].map(function (h) {
      self.players[h].busy = true;
      return { holder: h, wait: self.hold(), call: null, f: null, trail: [] };
    });
    this.cam = { x: 0, y: 0, r: 0, z: 1, tx: 0, ty: 0, tr: 0, tz: 1, next: 2 };
    this.visible = true;
  }

  Warmup.prototype.hold = function () { return rnd(0.5, 2.9) * PACE; };

  Warmup.prototype.wander = function (p) {
    var x0 = this.ends[p.e][0], x1 = this.ends[p.e][1];
    var out = p.e === 0 ? -25 : 25;
    p.tx = Math.max(x0, Math.min(x1, p.x + rnd(-80, 80) + out));
    p.ty = Math.max(70, Math.min(this.H - 70, p.y + rnd(-100, 100)));
    p.next = rnd(3, 7);
  };

  Warmup.prototype.callFor = function (d) {
    var P = this.players, a = P[d.holder], open = [];
    for (var i = 0; i < P.length; i++) {
      if (!P[i].busy && (P[i].e !== a.e || Math.random() < 0.15)) open.push(i);
    }
    if (!open.length) { d.wait = 0.5 * PACE; return; }
    var j = open[Math.floor(Math.random() * open.length)], r = P[j];
    r.busy = true;
    // The receiver comes to meet it: toward the thrower, a little aside.
    var dx = a.x - r.x, dy = a.y - r.y, L = Math.hypot(dx, dy) || 1;
    var lead = rnd(70, 140), side = rnd(-60, 60);
    var cx = r.x + dx / L * lead - dy / L * side;
    var cy = Math.max(60, Math.min(this.H - 60, r.y + dy / L * lead + dx / L * side));
    d.call = { to: j, cx: cx, cy: cy };
    r.run = { sx: r.x, sy: r.y, cx: cx, cy: cy, t: 0, dur: 0 };
  };

  Warmup.prototype.release = function (d) {
    var a = this.players[d.holder], c = d.call, r = this.players[c.to];
    var L = Math.hypot(c.cx - a.x, c.cy - a.y), s = Math.random() < 0.5 ? 1 : -1;
    var bend = rnd(0.06, 0.2) * s, mx = (a.x + c.cx) / 2, my = (a.y + c.cy) / 2;
    d.trail = [];
    d.f = {
      to: c.to, ax: a.x, ay: a.y, bx: c.cx, by: c.cy,
      kx: mx - (c.cy - a.y) * bend, ky: my + (c.cx - a.x) * bend,
      p: 0, dur: 0.9 + L / 520, lift: rnd(0.6, 1)
    };
    r.run.sx = r.x; r.run.sy = r.y; r.run.t = 0; r.run.dur = d.f.dur * 0.97;
    a.busy = false; a.next = rnd(0.4, 1.5);
    d.holder = -1; d.call = null;
  };

  function at(f, t) {
    var u = 1 - t;
    return [u * u * f.ax + 2 * u * t * f.kx + t * t * f.bx, u * u * f.ay + 2 * u * t * f.ky + t * t * f.by];
  }

  Warmup.prototype.step = function (real) {
    var dt = real * PACE, self = this;
    this.players.forEach(function (p) {
      if (p.run) {
        if (p.run.dur > 0) {
          p.run.t += dt;
          var k = ease(Math.min(1, p.run.t / p.run.dur));
          p.x = p.run.sx + (p.run.cx - p.run.sx) * k;
          p.y = p.run.sy + (p.run.cy - p.run.sy) * k;
        } else {
          p.x += (p.run.cx - p.x) * dt * 0.25;
          p.y += (p.run.cy - p.y) * dt * 0.25;
        }
        return;
      }
      p.next -= dt;
      if (p.next <= 0 && !p.busy) self.wander(p);
      var e = Math.min(1, dt * 0.9);
      p.x += (p.tx - p.x) * e;
      p.y += (p.ty - p.y) * e;
    });
    this.discs.forEach(function (d) {
      if (d.f) {
        d.f.p += dt / d.f.dur;
        var pt = at(d.f, Math.min(1, d.f.p));
        d.trail.push({ x: pt[0], y: pt[1], a: 1 });
        if (d.f.p >= 1) {
          var r = self.players[d.f.to];
          r.run = null; r.tx = r.x; r.ty = r.y; r.next = rnd(1.5, 3);
          d.holder = d.f.to; d.f = null; d.wait = self.hold();
        }
      } else {
        d.wait -= dt;
        if (!d.call && d.wait < 0.8 * PACE) self.callFor(d);
        if (d.wait <= 0 && d.call) self.release(d);
      }
      d.trail.forEach(function (t) { t.a -= dt * 0.7; });
      d.trail = d.trail.filter(function (t) { return t.a > 0; });
    });
    var c = this.cam;
    c.next -= dt;
    if (c.next <= 0) {
      c.tx = rnd(-30, 30); c.ty = rnd(-20, 20); c.tr = rnd(-0.03, 0.03); c.tz = rnd(0.97, 1.04);
      c.next = rnd(5, 9);
    }
    var k = Math.min(1, dt * 0.35);
    c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k; c.r += (c.tr - c.r) * k; c.z += (c.tz - c.z) * k;
  };

  Warmup.prototype.draw = function () {
    var cv = this.canvas, w = cv.clientWidth, h = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var x = cv.getContext('2d'), c = this.cam;
    // The field fills the header; its height follows the header's shape,
    // so players and throws keep their size on a short header.
    this.H = 1000 * h / w;
    var sc = w / 1000 * c.z, px = 1 / sc;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    x.save();
    x.translate(w / 2, h / 2);
    x.rotate(c.r);
    x.scale(sc, sc);
    x.translate(-500 + c.x, -this.H / 2 + c.y);
    var unit = Math.max(1, Math.min(1.6, w / 900));
    this.discs.forEach(function (d) {
      d.trail.forEach(function (t, i) {
        if (i % 3) return;
        x.fillStyle = 'rgba(255,255,255,' + (0.45 * t.a) + ')';
        x.beginPath(); x.arc(t.x, t.y, 1.6 * unit * px, 0, 7); x.fill();
      });
    });
    this.players.forEach(function (p) {
      if (p.run && p.run.dur > 0) {
        x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1.4 * unit * px;
        x.setLineDash([4 * unit * px, 7 * unit * px]);
        x.beginPath(); x.moveTo(p.run.sx, p.run.sy); x.lineTo(p.x, p.y); x.stroke();
        x.setLineDash([]);
      }
      x.strokeStyle = 'rgba(255,255,255,' + (p.run ? 0.5 : 0.36) + ')';
      x.lineWidth = 2.4 * unit * px;
      x.beginPath(); x.arc(p.x, p.y, 8 * unit * px, 0, 7); x.stroke();
    });
    var self = this;
    this.discs.forEach(function (d) {
      var dx, dy, hg = 0;
      if (d.f) {
        var p = Math.min(1, d.f.p), pt = at(d.f, p);
        dx = pt[0]; dy = pt[1]; hg = Math.sin(Math.PI * p) * d.f.lift;
      } else {
        var hp = self.players[d.holder];
        dx = hp.x + 7 * unit * px; dy = hp.y - 7 * unit * px;
      }
      x.fillStyle = 'rgba(0,0,0,.2)';
      x.beginPath(); x.arc(dx + hg * 16 * unit * px, dy + hg * 22 * unit * px, (6 + hg * 1.5) * unit * px, 0, 7); x.fill();
      x.fillStyle = '#E2B25C'; x.strokeStyle = '#fff'; x.lineWidth = 2 * unit * px;
      x.beginPath(); x.arc(dx, dy, (5.5 + hg * 1.3) * unit * px, 0, 7); x.fill(); x.stroke();
    });
    x.restore();
  };

  var plays = [];
  heads.forEach(function (head) { plays.push(new Warmup(head)); });

  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        plays.forEach(function (w) { if (w.head === en.target) w.visible = en.isIntersecting; });
      });
    });
    plays.forEach(function (w) { seen.observe(w.head); });
  }

  var last = 0;
  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!document.hidden) {
      plays.forEach(function (w) {
        if (!w.visible) return;
        w.step(dt);
        w.draw();
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
