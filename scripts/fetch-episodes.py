#!/usr/bin/env python3
"""
Build data/episode-order.json: a map of episode title (lower-cased) → global canonical order
across the classic continuity, from each episode page's infobox
("overall episode number franchise canonical", falling back to airing / series numbers).
Also writes research/episodes.json with series/season/number per episode for auditing.

  python3 scripts/fetch-episodes.py
"""
import json, os, re, time, urllib.parse, urllib.request

API = "https://ben10.fandom.com/api.php"
UA = "Mozilla/5.0 (compatible; Ben10VaultResearch/1.0)"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATS = {
    "os": "Category:Ben 10 Episodes",
    "af": "Category:Ben 10: Alien Force Episodes",
    "ua": "Category:Ben 10: Ultimate Alien Episodes",
    "ov": "Category:Ben 10: Omniverse Episodes",
}
SERIES_BASE = {"os": 0, "af": 1000, "ua": 2000, "ov": 3000}


def api(params):
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{API}?{q}", headers={"User-Agent": UA})
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except Exception:
            time.sleep(1.5 * (i + 1))
    return {}


def field(text, name):
    m = re.search(r"^\|\s*" + re.escape(name) + r"\s*=\s*([^\n{<]*)", text, flags=re.M)
    return m.group(1).strip() if m else ""


def main():
    episodes = []
    for sid, cat in CATS.items():
        cont = {}
        while True:
            d = api({
                "action": "query", "generator": "categorymembers", "gcmtitle": cat, "gcmlimit": 50,
                "gcmnamespace": 0, "prop": "revisions", "rvprop": "content", "rvslots": "main",
                "format": "json", **cont,
            })
            for p in d.get("query", {}).get("pages", {}).values():
                text = p.get("revisions", [{}])[0].get("slots", {}).get("main", {}).get("*", "")
                if "EpisodeInfoBox" not in text and "Infobox Episode" not in text:
                    continue
                def num(*names):
                    for n in names:
                        v = field(text, n)
                        m = re.search(r"\d+", v)
                        if m:
                            return int(m.group(0))
                    return None
                episodes.append({
                    "title": p["title"],
                    "series": sid,
                    "season": num("season"),
                    "episode": num("episode number"),
                    "canonical": num("overall episode number franchise canonical"),
                    "airing": num("overall episode number franchise airing", "overall episode number airing"),
                    "overall": num("overall episode number canonical", "overall episode number"),
                })
            if "continue" in d:
                cont = d["continue"]
                time.sleep(0.2)
            else:
                break
        print(sid, len([e for e in episodes if e["series"] == sid]), "episodes")

    # Consistent key: series base + season*100 + episode (the wiki's per-series canonical
    # season/episode numbering). Movies/specials without numbers are placed by hand below.
    order = {}
    for e in episodes:
        if e["season"] is None or e["episode"] is None:
            continue
        key = SERIES_BASE[e["series"]] + e["season"] * 100 + e["episode"]
        order[e["title"].lower()] = key
        base = re.sub(r"\s*\((Episode|episode)\)$", "", e["title"]).lower()
        order.setdefault(base, key)
    MOVIES = {
        "ben 10: secret of the omnitrix": 350,      # aired Aug 2007, between OS S3 and S4
        "ben 10: race against time": 360,           # Nov 2007 (alternate timeline)
        "ben 10: destroy all aliens": 499,          # 2012, set at the end of the OS timeframe
        "ben 10: alien swarm": 1210,                # Nov 2009, mid AF (wiki season 2)
        "ben 10-generator rex: heroes united": 2310,# Nov 2011, mid UA season 3
    }
    for k, v in MOVIES.items():
        order[k] = v
    # spelling aliases used in research text
    for alias, target in {"gone fishin": "gone fishin'", "ben 10/generator rex: heroes united": "ben 10-generator rex: heroes united", "heroes united": "ben 10-generator rex: heroes united"}.items():
        if target in order:
            order[alias] = order[target]
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    with open(os.path.join(ROOT, "data", "episode-order.json"), "w") as f:
        json.dump(dict(sorted(order.items(), key=lambda kv: kv[1])), f, indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, "research", "episodes.json"), "w") as f:
        json.dump(sorted(episodes, key=lambda e: (e["series"], e["season"] or 0, e["episode"] or 0)), f, indent=1, ensure_ascii=False)
    print("wrote", len(order), "episode keys")


if __name__ == "__main__":
    main()
