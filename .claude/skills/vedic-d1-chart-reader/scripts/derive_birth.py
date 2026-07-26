#!/usr/bin/env python3
"""
derive_birth.py  --  Reverse-derive birth date & tentative time from a Vedic D1 chart.

Given the sidereal (Lahiri) sign + whole-degree of the planets and the Lagna
that were read off a North Indian D1/Rashi chart image, this searches real
ephemeris history for the single moment that reproduces the whole chart, using
the classical "slow planets fix the year, fast planets fix the day, Moon/Lagna
fix the time" logic.

Method (mirrors the 8 manual steps):
  1-4  Find every window where Jupiter and Saturn are simultaneously in the
       signs shown on the chart  ->  narrows to a few candidate years.
  5    Keep only windows where the Sun is in its charted sign, then pick the
       exact DAY by matching Sun + Mars + Mercury + Venus whole-degrees.
  6    Confirm the day with the Moon's sign/degree.
  7    Find the tentative TIME by locating when the charted Lagna degree rises
       (Ascendant depends on birthplace, so this is per-location & approximate).
  8    Print a full verification table: computed vs charted sign / degree /
       house / condition (retrograde, combust), so the fit can be judged.

Requires: pip install pyswisseph   (uses the built-in Moshier ephemeris; no
data files needed. Lahiri ayanamsha, sidereal.)

Usage:
    python derive_birth.py chart.json
    python derive_birth.py            # runs the bundled worked example

Degree convention: astrology software almost always TRUNCATES (floors) the
degree it prints (e.g. 20.86 deg -> "20"), so a charted "20" means the true
value is in [20, 21). This script matches on the floor by default; pass
--round if a particular chart is known to round instead.

See references/birth-derivation-method.md for the full rationale and caveats.
"""
import sys, json, argparse

try:
    import swisseph as swe
except ImportError:
    sys.exit("Missing dependency. Install with:  pip install pyswisseph")

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra",
         "Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
SIGN_IDX = {s.lower(): i for i, s in enumerate(SIGNS)}
# common alternate / Sanskrit names -> canonical
ALIASES = {
    "mesha":"aries","mesh":"aries","vrishabha":"taurus","vrishabh":"taurus","vrsabha":"taurus",
    "mithuna":"gemini","mithun":"gemini","karka":"cancer","kark":"cancer","kataka":"cancer",
    "simha":"leo","sinha":"leo","kanya":"virgo","tula":"libra","thula":"libra",
    "vrishchika":"scorpio","vrishchik":"scorpio","vrischika":"scorpio","dhanu":"sagittarius",
    "dhanus":"sagittarius","makara":"capricorn","makar":"capricorn","kumbha":"aquarius",
    "kumbh":"aquarius","meena":"pisces","meen":"pisces",
}
PLANET_ID = {
    "Sun":swe.SUN,"Moon":swe.MOON,"Mars":swe.MARS,"Mercury":swe.MERCURY,
    "Jupiter":swe.JUPITER,"Venus":swe.VENUS,"Saturn":swe.SATURN,
    "Uranus":swe.URANUS,"Neptune":swe.NEPTUNE,"Pluto":swe.PLUTO,
}
# max separation from Sun (deg) inside which a planet is treated as combust (asta)
COMBUST_LIMIT = {"Mercury":14,"Venus":10,"Mars":17,"Jupiter":11,"Saturn":15}

FL = swe.FLG_SIDEREAL | swe.FLG_SWIEPH | swe.FLG_SPEED


def sign_index(name):
    n = str(name).strip().lower()
    n = ALIASES.get(n, n)
    if n not in SIGN_IDX:
        raise ValueError(f"Unknown sign: {name!r}")
    return SIGN_IDX[n]


def setup():
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)


def lon_speed(jd, pid):
    r = swe.calc_ut(jd, pid, FL)
    return r[0][0], r[0][3]


def rahu_lon(jd):
    return swe.calc_ut(jd, swe.MEAN_NODE, FL)[0][0]


def asc_lon(jd, lat, lon):
    return swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)[1][0]


def sd(lon):
    return SIGNS[int(lon // 30)], lon % 30


def ymd_hm(jd):
    y, m, d, h = swe.revjul(jd)
    hh = int(h); mm = int(round((h - hh) * 60))
    if mm == 60:
        hh += 1; mm = 0
    return y, m, d, hh, mm


# ---------------------------------------------------------------- windows
def sign_windows(pid, target_sign_idx, y0, y1, step_days=5):
    """Contiguous date windows where planet `pid` is in the target sign."""
    setup()
    jd = swe.julday(y0, 1, 1, 12.0)
    end = swe.julday(y1, 12, 31, 12.0)
    out, cur = [], None
    while jd < end:
        s = int(lon_speed(jd, pid)[0] // 30)
        if s == target_sign_idx:
            cur = [jd, jd] if cur is None else [cur[0], jd]
        else:
            if cur:
                out.append(cur); cur = None
        jd += step_days
    if cur:
        out.append(cur)
    return out


def overlaps(a, b):
    out = []
    for wa in a:
        for wb in b:
            lo, hi = max(wa[0], wb[0]), min(wa[1], wb[1])
            if lo < hi:
                out.append([lo, hi])
    return out


# ---------------------------------------------------------------- day search
def find_day(window, chart, floor=True):
    """Within a Jup/Sat window, find the DAY whose Sun+Mars+Mercury+Venus best
    match the chart. We gate on the Sun being in its charted sign (the month),
    then minimise the total angular error to the charted degree-bins. We do NOT
    demand an exact floor-match here: the time of day is still unknown, so a
    noon sample can sit up to ~1 deg from the true instant and flip a floor. The
    exact instant (and floor agreement) is settled later by the Lagna in step 7
    and confirmed in step 8. Returns (jd_noon, score); lower score = better."""
    setup()
    fast = ["Sun", "Mars", "Mercury", "Venus"]
    targets = {p: (sign_index(chart["planets"][p]["sign"]),
                   int(chart["planets"][p]["degree"])) for p in fast if p in chart["planets"]}
    sun_si = sign_index(chart["planets"]["Sun"]["sign"])
    best = None
    jd = window[0]
    while jd <= window[1] + 1:
        if int(lon_speed(jd, swe.SUN)[0] // 30) == sun_si:   # month gate
            score = 0.0
            for p, (tsi, tdeg) in targets.items():
                lon = lon_speed(jd, PLANET_ID[p])[0]
                tgt = tsi * 30 + tdeg + 0.5                   # middle of the bin
                score += abs((lon - tgt + 180) % 360 - 180)
            if best is None or score < best[1]:
                best = (jd, score)
        jd += 1.0
    return best


# ---------------------------------------------------------------- time search
def find_time(y, m, d, asc_sign_idx, asc_deg, lat, lon):
    """UT (as jd) when the Ascendant reaches the middle of the charted Lagna
    degree-bin at (lat, lon). Bisection over the day."""
    setup()
    target = asc_sign_idx * 30 + asc_deg + 0.3   # aim just inside the bin
    lo, hi = swe.julday(y, m, d, 0.0), swe.julday(y, m, d, 23.999)
    # ensure target is bracketed (Ascendant wraps 0..360 once per day)
    # sample to find the crossing interval
    prev_j = lo; prev = asc_lon(prev_j, lat, lon)
    cross = None
    steps = 24 * 6
    for i in range(1, steps + 1):
        j = lo + (hi - lo) * i / steps
        a = asc_lon(j, lat, lon)
        # detect entering the target sign band moving forward (handle wrap)
        if _passes(prev, a, target):
            cross = (prev_j, j); break
        prev_j, prev = j, a
    if cross is None:
        return None
    a_lo, a_hi = cross
    for _ in range(50):
        mid = (a_lo + a_hi) / 2
        if _lt_cyc(asc_lon(mid, lat, lon), target):
            a_lo = mid
        else:
            a_hi = mid
    return (a_lo + a_hi) / 2


def _lt_cyc(a, target):
    return ((target - a) % 360) < 180


def _passes(prev, cur, target):
    # did we cross `target` going forward (increasing) between prev and cur?
    d_prev = (target - prev) % 360
    d_cur = (target - cur) % 360
    return d_prev <= (cur - prev) % 360 + 1e-9 and d_prev > 0 and d_cur > d_prev - 30


# ---------------------------------------------------------------- verify
def verify(jd, chart, lat, lon, floor=True):
    setup()
    sun = lon_speed(jd, swe.SUN)[0]
    rows, all_ok = [], True
    lag_idx = int(asc_lon(jd, lat, lon) // 30)

    def house(lonv):
        return ((int(lonv // 30) - lag_idx) % 12) + 1

    order = ["Ascendant","Sun","Moon","Mars","Mercury","Jupiter","Venus",
             "Saturn","Rahu","Ketu","Uranus","Neptune","Pluto"]
    for name in order:
        if name == "Ascendant":
            lonv, spd = asc_lon(jd, lat, lon), 1.0
        elif name == "Rahu":
            lonv, spd = rahu_lon(jd), -1.0
        elif name == "Ketu":
            lonv, spd = (rahu_lon(jd) + 180) % 360, -1.0
        else:
            if name not in chart["planets"]:
                continue
            lonv, spd = lon_speed(jd, PLANET_ID[name])
        si, deg = int(lonv // 30), lonv % 30
        cond = []
        if name not in ("Ascendant", "Sun") and spd < 0:
            cond.append("Retrograde")
        if name in COMBUST_LIMIT:
            sep = abs((lonv - sun + 180) % 360 - 180)
            if sep < COMBUST_LIMIT[name]:
                cond.append("Combust")
        # charted target
        if name == "Ascendant":
            tgt = chart["ascendant"]
        elif name in ("Rahu", "Ketu"):
            tgt = chart["planets"].get(name)
        else:
            tgt = chart["planets"][name]
        if tgt is None:
            continue
        tsi, tdeg = sign_index(tgt["sign"]), int(tgt["degree"])
        fdeg = int(deg) if floor else int(round(deg)) % 30
        ok = (si == tsi and fdeg == tdeg)
        all_ok &= ok
        rows.append((name, SIGNS[si], int(deg), deg, house(lonv) if name != "Ascendant" else 1,
                     ",".join(cond) or "-", tgt["sign"], tdeg, ok))
    return rows, all_ok


# ---------------------------------------------------------------- driver
def derive(chart, floor=True):
    y0 = chart.get("search_from_year", 1900)
    y1 = chart.get("search_to_year", 2025)
    locs = chart.get("reference_locations") or [
        ["New Delhi", 28.61, 77.21], ["Mumbai", 19.08, 72.88],
        ["Kolkata", 22.57, 88.36], ["Chennai", 13.08, 80.27],
        ["Ahmedabad", 23.03, 72.58], ["Bengaluru", 12.97, 77.59],
    ]
    jup = sign_index(chart["planets"]["Jupiter"]["sign"])
    sat = sign_index(chart["planets"]["Saturn"]["sign"])
    sun = sign_index(chart["planets"]["Sun"]["sign"])

    print(f"Searching {y0}-{y1} (Lahiri sidereal, Moshier ephemeris)")
    print(f"  Jupiter -> {SIGNS[jup]} | Saturn -> {SIGNS[sat]} | Sun -> {SIGNS[sun]}\n")

    print("STEP 1-4  Jupiter & Saturn simultaneously in charted signs:")
    win = overlaps(sign_windows(swe.JUPITER, jup, y0, y1),
                   sign_windows(swe.SATURN, sat, y0, y1))
    for w in win:
        print(f"   {fmt(w[0])}  ->  {fmt(w[1])}")
    if not win:
        print("   (none - re-check the Jupiter/Saturn signs)"); return

    # Timezone for reporting local civil date/time (default India Standard Time).
    tz = chart.get("timezone_offset", 5.5)
    tzname = chart.get("timezone_name", "IST")

    print("\nSTEP 5-6  Day (Sun+Mars+Mercury+Venus best-fit), Moon confirms:")
    hits = []
    for w in win:
        best = find_day(w, chart, floor)
        if best:
            hits.append(best)
    if not hits:
        print("   (no matching day - the chart signs/degrees may be misread)"); return
    hits.sort(key=lambda t: t[1])
    jd_day = hits[0][0]
    y, m, d, _, _ = ymd_hm(jd_day)              # UT reference day for the Lagna search
    ms, md = sd(lon_speed(jd_day, swe.MOON)[0])
    print(f"   candidate day (UT ref): {y:04d}-{m:02d}-{d:02d}   Moon {ms} {int(md)}deg\n")

    print(f"STEP 7  Time - when Lagna {int(chart['ascendant']['degree'])}deg "
          f"{chart['ascendant']['sign']} rises (local {tzname}):")
    asc_i = sign_index(chart["ascendant"]["sign"])
    asc_d = int(chart["ascendant"]["degree"])
    times = []
    for city, la, lo in locs:
        jt = find_time(y, m, d, asc_i, asc_d, la, lo)
        if jt is None:
            continue
        ly, lm, ld, lhh, lmi = ymd_hm(jt + tz / 24.0)   # birthplace-local instant
        moon = sd(lon_speed(jt, swe.MOON)[0])
        times.append((city, jt, ly, lm, ld, lhh, lmi, moon, la, lo))
        print(f"   {city:11s} {ly:04d}-{lm:02d}-{ld:02d} {lhh:02d}:{lmi:02d} {tzname}"
              f"   (Moon {moon[0]} {int(moon[1])}deg)")
    if not times:
        print("   (no Lagna time solved - check the Ascendant reading)")
        y2, m2, d2 = ymd_hm(jd_day + tz / 24.0)[:3]
        print(f"\n   => DATE OF BIRTH: {y2:04d}-{m2:02d}-{d2:02d}  (time unresolved)")
        return

    # STEP 8: pick the birthplace/time that best fits the WHOLE chart. The
    # time-dependent bodies (Moon, Lagna) only reconcile for the right longitude,
    # so the best-fitting city is itself a clue to the birth region.
    scored = []
    for (city, jt, ly, lm, ld, lhh, lmi, _, la, lo) in times:
        rows, ok = verify(jt, chart, la, lo, floor)
        nmatch = sum(1 for r in rows if r[-1])
        scored.append((nmatch, ok, city, jt, ly, lm, ld, lhh, lmi, la, lo, rows))
    scored.sort(key=lambda t: (t[0], t[1]), reverse=True)
    nmatch, ok, city, jt, ly, lm, ld, lhh, lmi, la, lo, rows = scored[0]

    print(f"\nSTEP 8  Full verification (computed vs chart) @ {city} "
          f"{ly:04d}-{lm:02d}-{ld:02d} {lhh:02d}:{lmi:02d} {tzname}:")
    print(f"   {'Body':10s}{'Computed':22s}{'Hs':3s}{'Condition':13s}{'Chart':14s}OK")
    print("   " + "-" * 66)
    for nm, s, ideg, deg, hs, cond, csign, cdeg, k in rows:
        comp = f"{s} {ideg:02d}deg ({deg:.2f})"
        print(f"   {nm:10s}{comp:22s}{hs:<3d}{cond:13s}{csign+' '+str(cdeg)+'deg':14s}{'OK' if k else 'X'}")
    print("   " + "-" * 66)
    print(f"   FULL CHART MATCH: {ok}")

    # Final answer: date + tentative time range, both in birthplace-local time.
    dates = sorted(set((t[2], t[3], t[4]) for t in times))
    mins = [t[5] * 60 + t[6] for t in times]
    lo_m, hi_m = min(mins), max(mins)
    print("\n================ RESULT ================")
    if len(dates) == 1:
        yy, mm, dd = dates[0]
        print(f"  DATE OF BIRTH : {yy:04d}-{mm:02d}-{dd:02d}   (certain)")
    else:
        ds = ", ".join(f"{a:04d}-{b:02d}-{c:02d}" for a, b, c in dates)
        print(f"  DATE OF BIRTH : {ds}  (near local midnight - depends on exact place)")
    print(f"  TENTATIVE TIME: ~{lo_m//60:02d}:{lo_m%60:02d}-{hi_m//60:02d}:{hi_m%60:02d} "
          f"{tzname}  (pin exactly with the birthplace)")
    if len(locs) > 1:
        print(f"  BEST-FIT PLACE: near {city} (~{lo:.0f}deg E longitude)")
    print("========================================")


def fmt(jd):
    y, m, d, _, _ = ymd_hm(jd); return f"{y:04d}-{m:02d}-{d:02d}"


EXAMPLE = {
    "ascendant": {"sign": "Leo", "degree": 28},
    "planets": {
        "Sun": {"sign": "Aquarius", "degree": 20},
        "Moon": {"sign": "Cancer", "degree": 21},
        "Mars": {"sign": "Aries", "degree": 25},
        "Mercury": {"sign": "Aquarius", "degree": 20, "conditions": ["combust"]},
        "Jupiter": {"sign": "Leo", "degree": 20, "conditions": ["retrograde"]},
        "Venus": {"sign": "Aries", "degree": 4},
        "Saturn": {"sign": "Gemini", "degree": 12, "conditions": ["retrograde"]},
        "Rahu": {"sign": "Aries", "degree": 20, "conditions": ["retrograde"]},
        "Ketu": {"sign": "Libra", "degree": 20, "conditions": ["retrograde"]},
        "Uranus": {"sign": "Aquarius", "degree": 9},
        "Neptune": {"sign": "Capricorn", "degree": 20},
        "Pluto": {"sign": "Scorpio", "degree": 28},
    },
    "search_from_year": 1950,
    "search_to_year": 2025,
}


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Reverse-derive birth date & time from a Vedic D1 chart.")
    ap.add_argument("chart", nargs="?", help="path to chart JSON (default: bundled example)")
    ap.add_argument("--round", action="store_true", help="chart rounds degrees instead of truncating")
    args = ap.parse_args()
    if args.chart:
        with open(args.chart) as f:
            data = json.load(f)
    else:
        print("(no chart file given - running the bundled worked example)\n")
        data = EXAMPLE
    derive(data, floor=not args.round)
