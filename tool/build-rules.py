#!/usr/bin/env python3
"""Builds the site's rules pages from the app's own content, so the two never
disagree:

  rules/                  the 12 Quick Reference calls and the hand signals
  rules/<call>/           one call: what happens, step by step, its signal and
                          the WFDF rules behind it, word for word
  rules/hand-signals/     WFDF's 24 hand signals, with the app's drawings
  sitemap.xml             every page worth finding: these, home, install,
                          privacy and account deletion (game/ is not one)

    tool/build-rules.py [path to the app's repo]      # default ../flatball
    tool/build-rules.py --check [path]                # fails if anything is stale

Reads the app's assets/content/rulebook.json, hand_signals.json and
glossary.json, and copies its icons/signals pictures at 480 px (macOS sips).
Never edit the generated pages by hand: change the app's content and rerun.
The rules and signals are WFDF's (CC BY 4.0, credited on every page); the
calls in plain words, their steps and the USA Ultimate notes are the app's.
"""

from __future__ import annotations

import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
ORIGIN = 'https://flatballconnect.app'
DOWNLOAD = 'https://github.com/flatballconnect/flatball-releases/releases/latest/download/flatball.apk'
SIGNAL_WIDTH = 480

args = [a for a in sys.argv[1:] if a != '--check']
check = '--check' in sys.argv[1:]
APP = Path(args[0]).resolve() if args else (SITE.parent / 'flatball')
CONTENT = APP / 'assets' / 'content'

rulebook = json.loads((CONTENT / 'rulebook.json').read_text())
signals_file = json.loads((CONTENT / 'hand_signals.json').read_text())
glossary = {t['id']: t for t in json.loads((CONTENT / 'glossary.json').read_text())['terms']}
rules = {r['id']: r for s in rulebook['sections'] for r in s['rules']}
situations = rulebook['situations']
signals = signals_file['signals']

e = html.escape
TERM = re.compile(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]')


def plain(text: str) -> str:
    """The app's glossary markup as plain words: [[pick]] is "pick",
    [[vertical-stack|the vert]] is "the vert" (core/rich_text.dart)."""
    return TERM.sub(lambda m: m.group(2) or m.group(1).replace('-', ' '), text)


def terms_in(*texts: str) -> list[str]:
    found: list[str] = []
    for text in texts:
        for m in TERM.finditer(text):
            if m.group(1) in glossary and m.group(1) not in found:
                found.append(m.group(1))
    return found


def page(*, path: str, title: str, description: str, back: tuple[str, str] | None,
         eyebrow: str, heading: str, lead: str, body: str, depth: int) -> str:
    up = '../' * depth
    canonical = f'{ORIGIN}/{path}'
    crumb = ''
    if back:
        crumb = (f'<a class="crumb" href="{back[0]}"><i class="icon" style="--src:url({up}icons/back.svg)"></i>'
                 f'{e(back[1])}</a>')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Flatball Connect">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{ORIGIN}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F4F3EF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1B1B1D" media="(prefers-color-scheme: dark)">
<link rel="icon" href="{up}logo.svg" type="image/svg+xml">
<link rel="icon" href="{up}icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="{up}apple-touch-icon.png">
<link rel="stylesheet" href="{up}style.css">
</head>
<body class="page">
<header class="topbar">
  <a class="brand" href="{up}">
    <img class="logo-light" src="{up}logo.svg" alt="">
    <img class="logo-dark" src="{up}logo-dark.svg" alt="">
    Flatball Connect
  </a>
  <nav class="topnav" aria-label="Main">
    <a href="{up}#features">Features</a>
    <a href="{up}#screens">Screenshots</a>
    <a href="{up}rules/" aria-current="page">Rules</a>
    <a href="{up}#help">Help</a>
    <a class="pill" href="{up}install/">Get the app</a>
  </nav>
  <details class="menu">
    <summary aria-label="Menu"><span></span><span></span><span></span></summary>
    <nav aria-label="Menu">
      <a href="{up}#features">Features</a>
      <a href="{up}#screens">Screenshots</a>
      <a href="{up}rules/">Rules</a>
      <a href="{up}#help">Help</a>
      <a href="{up}install/">Get the app</a>
    </nav>
  </details>
</header>

<main>
  <section class="page-hero">
    {crumb}
    <p class="eyebrow">{e(eyebrow)}</p>
    <h1>{e(heading)}</h1>
    <p class="lead">{lead}</p>
  </section>
{body}
{app_band(up)}
</main>

<footer class="site">
  <nav>
    <a href="{up}">Home</a>
    <a href="{up}rules/">Rules</a>
    <a href="{up}install/">Install</a>
    <a href="{up}privacy/">Privacy policy</a>
    <a href="mailto:support@flatballconnect.app">support@flatballconnect.app</a>
  </nav>
  <p>The rules quoted are the WFDF Rules of Ultimate 2025-2028, and the hand signals are
  from its Appendix F, redrawn for Flatball Connect: © World Flying Disc Federation, used
  under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. The official
  rules are at <a href="https://rules.wfdf.sport/">rules.wfdf.sport</a>. The calls in plain
  words, their steps and the USA Ultimate notes are Flatball Connect's own summary; the rules
  are what count.</p>
  <p>© 2026 Bala Malaivendan</p>
</footer>
<script src="{up}menu.js"></script>
</body>
</html>
'''


def app_band(up: str) -> str:
    return f'''  <section class="download flat">
    <h2>In the app</h2>
    <p class="lines">Flatball Connect has all 12 calls, the full WFDF rulebook with its official
    examples, the 24 hand signals and a daily rules quiz, offline and free, with no ads.</p>
    <div class="buttons">
      <a class="button" href="{DOWNLOAD}">Download for Android</a>
      <a class="button soft" href="{up}install/">How to install</a>
    </div>
    <p class="small">iPhone: coming soon.</p>
  </section>'''


def signal_picture(signal: dict, up: str, size: int) -> str:
    sid = signal['id']
    return (f'<picture><source srcset="{up}rules/hand-signals/img/{sid}-dark.jpg" '
            f'media="(prefers-color-scheme: dark)">'
            f'<img src="{up}rules/hand-signals/img/{sid}.jpg" width="{size}" height="{size}" '
            f'loading="lazy" alt="The {e(signal["name"])} hand signal: {e(signal["text"])}"></picture>')


def rule_block(rule_id: str) -> str:
    rule = rules[rule_id]
    head = e(rule['number'])
    if rule.get('heading'):
        head += f' <span class="muted">{e(rule["heading"])}</span>'
    parts = [f'<div class="rule"><p class="rule-head">{head}</p>']
    if rule.get('text'):
        parts.append(f'<p>{e(rule["text"])}</p>')
    for clause in rule.get('clauses', []):
        indent = max(0, clause.get('indent', 1) - 1)
        parts.append(f'<p class="clause" style="--indent:{indent}">'
                     f'<span class="num">{e(clause["number"])}</span> {e(clause["text"])}</p>')
    usau = (rule.get('notes') or {}).get('usau')
    if usau:
        parts.append(f'<p class="usau"><strong>How USA Ultimate differs.</strong> {e(usau)}</p>')
    parts.append('</div>')
    return ''.join(parts)


def call_page(index: int, situation: dict) -> str:
    sid = situation['id']
    up = '../../'
    steps = ''.join(f'<li>{e(plain(step))}</li>' for step in situation['steps'])
    what = [
        '      <div class="card callout"><p class="eyebrow">What happens</p>'
        f'<p>{e(plain(situation["verdict"]))}</p></div>',
        '      <h2 class="section">Step by step</h2>',
        f'      <div class="card"><ol class="steps">{steps}</ol></div>',
    ]
    notes = situation.get('notes') or {}
    if notes.get('usau'):
        lines = ''.join(f'<p>{e(notes[k])}</p>' for k in ('wfdf', 'usau') if notes.get(k))
        what.append('      <h2 class="section">WFDF and USA Ultimate</h2>')
        what.append(f'      <div class="card">{lines}</div>')
    aside = []
    shown = [s for s in signals if sid in s.get('situations', [])]
    if shown:
        aside.append('      <h2 class="section">The hand signal</h2>')
        aside.append('      <div class="signals">' + ''.join(
            f'<a class="signal" href="{up}rules/hand-signals/#{s["id"]}">{signal_picture(s, up, SIGNAL_WIDTH)}'
            f'<strong>{e(s["name"])}</strong><span>{e(s["text"])}</span></a>' for s in shown) + '</div>')
    used = terms_in(*situation['steps'], situation['verdict'])
    if used:
        aside.append('      <h2 class="section">Terms</h2>')
        aside.append('      <div class="rows">' + ''.join(
            f'<div class="row"><strong>{e(glossary[t]["term"])}</strong>'
            f'<p class="why muted">{e(plain(glossary[t]["definition"]))}</p></div>' for t in used) + '</div>')
    why = [
        '      <h2 class="section">The rules</h2>',
        '      <p class="muted">From the WFDF Rules of Ultimate 2025-2028, word for word.</p>',
        '      <div class="card rules">' + ''.join(
            rule_block(r) for r in situation['relatedRuleIDs'] if r in rules) + '</div>',
    ]
    previous = situations[index - 1] if index > 0 else None
    following = situations[index + 1] if index + 1 < len(situations) else None
    nav = '    <div class="pager">'
    nav += (f'<a href="../{previous["id"]}/"><span class="small">Previous</span>{e(previous["title"])}</a>'
            if previous else '<span></span>')
    nav += (f'<a class="next" href="../{following["id"]}/"><span class="small">Next</span>{e(following["title"])}</a>'
            if following else '<span></span>')
    nav += '</div>'
    # The aside comes before the rules so that on a phone the signal does too.
    body = ('  <div class="page-body wide">\n    <div class="split">\n'
            '    <div class="what">\n' + '\n'.join(what) + '\n    </div>\n'
            '    <div class="aside">\n' + '\n'.join(aside) + '\n    </div>\n'
            '    <div class="why">\n' + '\n'.join(why) + '\n    </div>\n'
            '    </div>\n' + nav + '\n  </div>')
    description = f'{situation["title"]} in ultimate: {plain(situation["verdict"])}'
    return page(path=f'rules/{sid}/', title=f'{situation["title"]}: ultimate rules · Flatball Connect',
                description=description, back=('../', 'Rules'),
                eyebrow=f'Quick Reference · {index + 1} of {len(situations)}',
                heading=situation['title'], lead=e(situation['prompt']), body=body, depth=2)


def index_page() -> str:
    up = '../'
    cards = ''.join(
        f'<a class="nav-card" href="{s["id"]}/"><div class="badge"><span class="number">{i + 1}</span></div>'
        f'<div class="text"><strong>{e(s["title"])}</strong><span>{e(s["prompt"])}</span></div>'
        f'<i class="icon chevron" style="--src:url({up}icons/forward.svg)"></i></a>'
        for i, s in enumerate(situations))
    # A taste of the signals: WFDF's first four.
    preview = ''.join(
        f'<a class="signal" href="hand-signals/#{s["id"]}">{signal_picture(s, up, SIGNAL_WIDTH)}'
        f'<strong>{e(s["name"])}</strong></a>' for s in signals[:4])
    body = f'''  <section class="band">
    <h2>Quick Reference</h2>
    <div class="nav-cards">{cards}</div>
  </section>
  <section class="band tint">
    <h2>Hand signals</h2>
    <p class="intro">All {len(signals)} WFDF signals, drawn.</p>
    <div class="signals">{preview}</div>
    <div class="buttons"><a class="button" href="hand-signals/">See all {len(signals)} signals</a></div>
    <p class="small">The full rules are WFDF's, at
    <a href="https://rules.wfdf.sport/">rules.wfdf.sport</a>, and in the app, searchable.</p>
  </section>'''
    return page(path='rules/', title='Ultimate rules, quickly · Flatball Connect',
                description=f'The {len(situations)} most common calls in ultimate frisbee resolved '
                            'step by step, with the WFDF rules behind them and the 24 hand signals.',
                back=(up, 'Home'), eyebrow='Rules', heading="Ultimate's calls, quickly.",
                lead=f'The {len(situations)} calls that come up most, each resolved step by step, '
                     'with the WFDF rules behind them word for word.',
                body=body, depth=1)


def signals_page() -> str:
    up = '../../'
    about = ''.join(f'<p><span class="muted">{e(part["number"])}</span> {e(part["text"])}</p>'
                    for part in signals_file['about'])
    cards = ''.join(
        f'<div class="signal" id="{s["id"]}">{signal_picture(s, up, SIGNAL_WIDTH)}'
        f'<strong>{s["number"]}. {e(s["name"])}</strong>'
        # The calls only when they say more than the name ("Foul" is just Foul).
        + (f'<span class="calls">{e(" · ".join(s["calls"]))}</span>'
           if s['calls'] and s['calls'] != [s['name']] else '')
        + f'<span>{e(s["text"])}</span></div>'
        for s in signals)
    body = f'''  <div class="page-body wide">
    <div class="card">{about}</div>
    <div class="signals all">{cards}</div>
  </div>'''
    return page(path='rules/hand-signals/', title='Ultimate hand signals · Flatball Connect',
                description=f'All {len(signals)} WFDF hand signals for ultimate frisbee, drawn, '
                            'with what each one means and how it is made.',
                back=('../', 'Rules'), eyebrow='Rules', heading='Hand signals',
                lead=f"All {len(signals)} of WFDF's hand signals, drawn.", body=body, depth=2)


def sitemap() -> str:
    paths = ['', 'install/', 'rules/', 'rules/hand-signals/',
             *(f'rules/{s["id"]}/' for s in situations), 'privacy/', 'delete-account/']
    urls = ''.join(f'  <url><loc>{ORIGIN}/{p}</loc></url>\n' for p in paths)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f'{urls}</urlset>\n')


def build(out: Path) -> None:
    (out / 'sitemap.xml').write_text(sitemap())
    (out / 'rules').mkdir(parents=True)
    (out / 'rules' / 'index.html').write_text(index_page())
    for i, situation in enumerate(situations):
        folder = out / 'rules' / situation['id']
        folder.mkdir()
        (folder / 'index.html').write_text(call_page(i, situation))
    img = out / 'rules' / 'hand-signals' / 'img'
    img.mkdir(parents=True)
    (out / 'rules' / 'hand-signals' / 'index.html').write_text(signals_page())
    for signal in signals:
        for suffix in ('', '-dark'):
            name = f'{signal["id"]}{suffix}.jpg'
            subprocess.run(['sips', '-Z', str(SIGNAL_WIDTH), str(APP / 'icons' / 'signals' / name),
                            '--out', str(img / name)], check=True, capture_output=True)


def pages(root: Path) -> dict[str, str]:
    found = {str(p.relative_to(root)): p.read_text()
             for p in sorted((root / 'rules').rglob('*.html'))} if (root / 'rules').exists() else {}
    if (root / 'sitemap.xml').exists():
        found['sitemap.xml'] = (root / 'sitemap.xml').read_text()
    return found


with tempfile.TemporaryDirectory() as tmp:
    fresh = Path(tmp)
    build(fresh)
    if check:
        if pages(fresh) != pages(SITE):
            sys.exit('rules/ or sitemap.xml is stale: run tool/build-rules.py')
        print('rules/ and sitemap.xml are up to date')
        sys.exit(0)
    shutil.rmtree(SITE / 'rules', ignore_errors=True)
    shutil.copytree(fresh / 'rules', SITE / 'rules')
    shutil.copy(fresh / 'sitemap.xml', SITE / 'sitemap.xml')
    count = len(list((SITE / 'rules').rglob('*.html')))
    print(f'{count} pages written to rules/')
