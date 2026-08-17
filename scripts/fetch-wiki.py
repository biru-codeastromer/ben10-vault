#!/usr/bin/env python3
"""
Fetch raw wikitext for Ben 10 wiki pages (ben10.fandom.com, MediaWiki API) into a
local cache and mechanically extract infobox facts.

Usage:
  python3 scripts/fetch-wiki.py            # fetch default candidate pages
  python3 scripts/fetch-wiki.py "Page A" "Page B"   # fetch specific pages (added to extract)

Outputs:
  research/wiki-cache/<title>.wikitext     raw wikitext (one file per page)
  research/wiki-extract.json               parsed infobox data per page

This is a *research aid*. Nothing here is presented in the UI directly; the
curated dataset in data/ is authored from this + human/agent judgment.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

API = "https://ben10.fandom.com/api.php"
UA = "Mozilla/5.0 (compatible; Ben10VaultResearch/1.0; local research tool)"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "research", "wiki-cache")
EXTRACT = os.path.join(ROOT, "research", "wiki-extract.json")

# Ben-continuity transformation pages (classic continuity). Non-Ben forms
# (Ben 23 dimension aliens, Nemetrix predators, Albedo-only forms, Gwen 10 forms)
# are intentionally NOT listed here except where they are needed for context.
DEFAULT_PAGES = [
    # --- Original Series debut ---
    "Heatblast (Classic)", "Wildmutt", "Diamondhead (Classic)", "XLR8 (Classic)",
    "Grey Matter (Classic)", "Four Arms (Classic)", "Stinkfly (Classic)", "Ripjaws (Classic)",
    "Upgrade (Classic)", "Ghostfreak", "Cannonbolt (Classic)", "Wildvine (Classic)",
    "Blitzwolfer", "Snare-Oh", "Frankenstrike", "Upchuck", "Ditto", "Eye Guy",
    "Way Big (Classic)", "Spitter", "Buzzshock (Classic)", "Arctiguana",
    "Eon (Transformation)", "Stink Arms", "Diamond Matter", "Heat Jaws",
    # --- Alien Force debut ---
    "Swampfire", "Echo Echo", "Humungousaur (Classic)", "Jetray (Classic)", "Big Chill (Classic)",
    "Chromastone (Classic)", "Brainstorm", "Spidermonkey (Classic)", "Goop (Classic)",
    "Alien X (Classic)", "Lodestar", "Rath (Classic)", "Nanomech",
    "Ultimate Swampfire", "Ultimate Humungousaur",
    # --- Ultimate Alien debut ---
    "Waterhazard", "Terraspin", "NRG", "Armodrillo", "Ampfibian (Classic)",
    "Fasttrack", "Chamalien", "Eatle", "Clockwork", "Juryrigg", "Shocksquatch",
    "Ultimate Big Chill", "Ultimate Cannonbolt", "Ultimate Echo Echo", "Ultimate Spidermonkey",
    "Ultimate Way Big", "Ultimate Wildmutt", "Ultimate Ben",
    # --- Omniverse debut (Ben Prime) ---
    "Feedback", "Bloxx (Classic)", "Gravattack", "Crashhopper", "Ball Weevil", "Kickin' Hawk",
    "Walkatrout", "Pesky Dust", "Mole-Stache", "The Worst", "Astrodactyl", "Bullfrag",
    "Toepick", "Atomix", "Gutrot", "Whampire",
    "Ultimate Arctiguana", "Ultimate Gravattack", "Ultimate Rath", "Ultimate Albedo",
    # --- Omniverse Ben 10,000 fusions (Biomnitrix) ---
    "Fourmungousaur", "Humungoopsaur", "Big Chuck", "Crashocker", "Uprigg", "Atomic-X",
    # --- Device / meta pages ---
    "Omnitrix (Original)", "Ultimatrix (Original)", "Omnitrix (Omniverse)", "Biomnitrix",
    "Ultimate Forms", "Combinations (Classic)",
    # --- Ben versions ---
    "Ben Tennyson (Classic)", "Ben 10,000 (Classic)", "Ben 10,000 (Ultimate Alien)",
    "Ben 10,000 (Omniverse)", "Ben 23", "Mad Ben", "Bad Ben", "Nega Ben", "Benzarro",
    "No Watch Ben", "Ben Tennyson (Gwen 10)", "Ben Tennyson (Race Against Time)",
    "Ben Tennyson (Alternate Future)", "Ben Tennyson (Dimension 23)", "Ben Prime",
    "Ben Tennyson (Original)", "Eon", "Albedo (Classic)", "Ben Tennyson (Alien Force)",
]


def api(params: dict) -> dict:
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{API}?{q}", headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))
    return {}


def safe_name(title: str) -> str:
    return re.sub(r"[^A-Za-z0-9._()' ,-]", "_", title).strip()


def fetch_wikitext(title: str) -> str | None:
    d = api({"action": "parse", "page": title, "prop": "wikitext", "format": "json", "redirects": 1})
    if "error" in d:
        return None
    return d["parse"]["wikitext"]["*"]


# ---------- parsing helpers ----------

def strip_markup(s: str) -> str:
    s = re.sub(r"\{\{Refn\|.*?\}\}", "", s, flags=re.S)
    s = re.sub(r"<ref[^>]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"<small>(.*?)</small>", r" (\1)", s, flags=re.S)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"'''?", "", s)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    return re.sub(r"\s+", " ", s).strip()


def split_infobox_fields(box: str) -> dict:
    """Split '|key = value' at depth 0 (ignoring nested {{ }} and [[ ]])."""
    fields = {}
    if box.startswith("{{") and box.endswith("}}"):
        box = box[2:-2]
    depth_t = depth_l = 0
    cur = []
    parts = []
    i = 0
    while i < len(box):
        if box.startswith("<gallery", i):
            end = box.find("</gallery>", i)
            end = len(box) if end == -1 else end + len("</gallery>")
            cur.append(box[i:end]); i = end; continue
        if box.startswith("<ref", i) and not box.startswith("<ref>", i) is None:
            # keep <ref ...>...</ref> or <ref .../> intact
            m = re.match(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>", box[i:], flags=re.S)
            if m:
                cur.append(m.group(0)); i += len(m.group(0)); continue
        two = box[i:i + 2]
        if two == "{{":
            depth_t += 1; cur.append(two); i += 2; continue
        if two == "}}":
            depth_t -= 1; cur.append(two); i += 2; continue
        if two == "[[":
            depth_l += 1; cur.append(two); i += 2; continue
        if two == "]]":
            depth_l -= 1; cur.append(two); i += 2; continue
        ch = box[i]
        if ch == "|" and depth_t == 0 and depth_l == 0:
            parts.append("".join(cur)); cur = []
        else:
            cur.append(ch)
        i += 1
    parts.append("".join(cur))
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            fields[k.strip().lower()] = v.strip()
    return fields


def find_infobox(text: str) -> str | None:
    m = re.search(r"\{\{Infobox[ _](?:Alien|Character|Ultimate|Fusion|Omnitrix|Device)[^\n]*", text)
    if not m:
        m = re.search(r"\{\{Infobox[^\n]*", text)
    if not m:
        return None
    start = m.start()
    depth = 0
    i = start
    while i < len(text):
        if text.startswith("{{", i):
            depth += 1; i += 2; continue
        if text.startswith("}}", i):
            depth -= 1; i += 2
            if depth == 0:
                return text[start:i]
            continue
        i += 1
    return None


def parse_gallery_images(value: str) -> list[dict]:
    imgs = []
    for m in re.finditer(r"<gallery[^>]*>(.*?)</gallery>", value, flags=re.S):
        for line in m.group(1).splitlines():
            line = line.strip()
            if not line:
                continue
            fn, _, label = line.partition("|")
            fn = fn.replace("File:", "").strip()
            imgs.append({"file": fn, "label": strip_markup(label)})
    if not imgs:
        v = value.strip()
        if v and not v.startswith("<"):
            fn = re.sub(r"^\[\[File:|\]\]$", "", v).split("|")[0].strip()
            if fn:
                imgs.append({"file": fn, "label": ""})
    return imgs


def parse_list_field(value: str) -> list[str]:
    v = re.sub(r"\{\{Scroll\|(.*)\}\}$", r"\1", value.strip(), flags=re.S)
    v = re.sub(r"\{\{Refn\|.*?\}\}", "", v, flags=re.S)
    v = re.sub(r"<ref[^>]*/>", "", v)
    v = re.sub(r"<ref[^>]*>.*?</ref>", "", v, flags=re.S)
    items = re.split(r"<br\s*/?>|\n\*|\n", v)
    out = []
    for it in items:
        it = strip_markup(it)
        it = it.strip(" *")
        if it:
            out.append(it)
    return out


def sections_of(text: str) -> list[dict]:
    secs = []
    for m in re.finditer(r"^(={2,5})\s*(.+?)\s*\1\s*$", text, flags=re.M):
        secs.append({"level": len(m.group(1)), "title": strip_markup(m.group(2)), "pos": m.start()})
    return secs


def section_text(text: str, title_regex: str) -> str:
    """Return body of the first level-2 section whose title matches regex."""
    secs = sections_of(text)
    for idx, s in enumerate(secs):
        if s["level"] == 2 and re.search(title_regex, s["title"], flags=re.I):
            end = len(text)
            for s2 in secs[idx + 1:]:
                if s2["level"] <= 2:
                    end = s2["pos"]; break
            return text[s["pos"]:end]
    return ""


def extract(title: str, text: str) -> dict:
    box = find_infobox(text) or ""
    fields = split_infobox_fields(box) if box else {}
    entry = {
        "title": title,
        "infobox_type": (re.match(r"\{\{(Infobox[^|\n]*)", box).group(1).strip() if box else None),
        "name": strip_markup(fields.get("name", "")),
        "species": strip_markup(fields.get("species", "")),
        "home_planet": strip_markup(fields.get("home-planet", fields.get("home planet", fields.get("homeworld", "")))),
        "body": strip_markup(fields.get("body", "")),
        "powers": parse_list_field(fields.get("power", fields.get("powers", ""))),
        "first_appearance": strip_markup(fields.get("1st-appearance", fields.get("first-appearance", fields.get("first appearance", "")))),
        "ultimate_form": strip_markup(fields.get("ultimate form", fields.get("ultimate", ""))),
        "base_form": strip_markup(fields.get("base form", fields.get("regular form", fields.get("original form", "")))),
        "alternate_counterparts": parse_list_field(fields.get("alternate counterparts", "")),
        "fusion": parse_list_field(fields.get("fusion", "")),
        "predator": strip_markup(fields.get("predator", "")),
        "prey": strip_markup(fields.get("prey", "")),
        "voice": strip_markup(fields.get("voice", "")),
        "images": parse_gallery_images(fields.get("image", "") or fields.get("complex", "") or fields.get("image1", "")),
        "sections": [f"{'#'*s['level']} {s['title']}" for s in sections_of(text)],
        "appearances_headings": [
            f"{'#'*s['level']} {s['title']}" for s in sections_of(section_text(text, r"^Appearances$"))
        ],
        "raw_infobox_keys": sorted(fields.keys()),
    }
    return entry


def main(argv: list[str]) -> None:
    os.makedirs(CACHE, exist_ok=True)
    pages = argv[1:] or DEFAULT_PAGES
    existing = {}
    if os.path.exists(EXTRACT):
        with open(EXTRACT, encoding="utf-8") as f:
            existing = {e["title"]: e for e in json.load(f)}
    missing = []
    for i, title in enumerate(pages):
        path = os.path.join(CACHE, safe_name(title) + ".wikitext")
        if os.path.exists(path) and os.path.getsize(path) > 0:
            text = open(path, encoding="utf-8").read()
        else:
            text = fetch_wikitext(title)
            if text is None:
                missing.append(title)
                print(f"[{i+1}/{len(pages)}] MISSING {title}")
                continue
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
            time.sleep(0.25)
        existing[title] = extract(title, text)
        print(f"[{i+1}/{len(pages)}] ok {title} imgs={len(existing[title]['images'])}")
    with open(EXTRACT, "w", encoding="utf-8") as f:
        json.dump(sorted(existing.values(), key=lambda e: e["title"]), f, indent=2, ensure_ascii=False)
    print(f"\nwrote {EXTRACT} ({len(existing)} pages)")
    if missing:
        print("missing pages:", missing)


if __name__ == "__main__":
    main(sys.argv)
