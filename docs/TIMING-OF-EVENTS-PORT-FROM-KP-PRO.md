# Porting the KP PRO timing spine to the other astrology projects

**Purpose.** "SHRI GANESHA BLESSED KP PRO" dates events more accurately than the
sibling projects. This document extracts *why*, states it as a system-neutral
spine, and then gives a ready-to-paste **replacement block** for each of the
other projects, written in that project's own vocabulary and against the data
its own VedNetra export actually carries.

**How to use it.** Open each project, find its existing timing/prediction
section, delete it, paste the block from Part 2 in its place. Where a project
has no timing section, append the block at the end of the project instructions.
Part 1 is the shared spine; paste Part 1 once into every project too, above the
project-specific block, or splice the two if you prefer a single section.

---

## Part 0 — Why KP PRO dates better, in one page

KP is not more accurate because of Placidus cusps or the Krishnamurti ayanamsha.
It is more accurate because of the **order of operations** and because every
stage is **falsifiable before the next one runs**. Five things do the work:

1. **Promise is a gate, not a score.** The cuspal sub-lord decides whether the
   matter can happen at all. If it denies, KP produces no date. Most wrong dates
   in the sibling systems come from timing a matter that was never promised: the
   engine finds a strong dasha, finds a transit, and manufactures a window for an
   event the chart never carried.

2. **The list of deliverers is closed before the calendar is opened.** KP fixes
   the significators in four ranked steps first. Nothing outside that closed list
   may be cited later to justify a date. This single discipline removes post-hoc
   fitting, which is the largest source of fake precision in every other system.

3. **There is a second-order veto.** The star lord says *what* will be given;
   the sub-lord says *whether it is favourable*. A planet that is a textbook-
   strong significator is still rejected when its sub-lord signifies the negation
   houses. Systems without an explicit veto organ over-predict: they fire on
   strength alone.

4. **Period and trigger are different questions, answered separately.** The dasha
   ladder answers "which stretch of life". The transit answers "on what date
   inside that stretch". Transits never create an event, they release one already
   promised and already due. Engines that sum period evidence and transit evidence
   into one count produce confident dates from incoherent evidence.

5. **Convergence is counted over INDEPENDENT instruments, and the answer carries
   its own resolution.** Five instruments pointing at five different years is not
   agreement. KP PRO narrows only as far as the evidence and the birth-time
   accuracy permit, and says so.

Everything below is these five rules, made portable.

---

## Part 1 — THE SHARED TIMING SPINE

> Paste this into every project, above the project-specific block.

### G0. Judgment setup, before anything else

1. Fix the **judgment moment**. When the question is about a specific date, the
   chart data must be generated with `enquiryDate` set to that date. Default is
   "now", which silently produces the wrong transits while the export still looks
   complete. State the judgment moment in the answer.
2. Record the **judgment-moment fingerprint** now, before any date is computed,
   and show it in the answer. It is five items, computable from any of the
   exports: day lord, Moon nakshatra lord, Moon sign lord, Lagna nakshatra lord,
   Lagna sign lord at the judgment moment, plus Rahu or Ketu when either sits in
   the sign or star of one of those five. This is the KP "ruling planets" layer.
   It is recorded *before* the dates precisely so it cannot be fitted to them. A
   candidate window whose period lords intersect this fingerprint is stronger than
   one that does not, and the strength claim is only legitimate because the
   fingerprint was written down first.
3. Record the **birth-time confidence** and the export's own sensitivity flag.
   This caps the final resolution band and nothing later may raise the cap.
4. Ask for, or read from the ledger, the **dated past events**. Minimum three.
   Below three the clock is UNVERIFIED and every forward answer is capped at R4.

### G1. PROMISE GATE — no promise, no date

Run the project's promise organ for the matter asked. Output one of three
verdicts and honour it absolutely:

- **PROMISED** — proceed to G2.
- **CONDITIONAL** — the matter is promised only under a stated condition. Name the
  condition, proceed, and carry the condition into the final answer.
- **DENIED** — stop. Report the denial and the arithmetic behind it. Do **not**
  soften a denial into a distant or vague window. A window quoted after a failed
  promise gate is the single most damaging output this system can produce.

The promise verdict is a **gate**, not a number to be averaged into a later score.

### G2. CLOSE THE SIGNIFICATOR SET

Before opening any calendar, write out the closed, ranked list of bodies that may
deliver this matter, using the project's own four-step equivalent. Rank them.
Print the list in the answer.

**Rule:** any body not on this list may never be cited as the reason for a date.
If, later, a beautiful transit belongs to a body outside the list, it is
discarded, not promoted.

Nodes rule, in every system: Rahu and Ketu act for the bodies they represent, in
this order — the planet conjoined with them, then their sign lord, then the
planets aspecting them. When they so act, they act **more strongly** than the
body they stand for, and they are inserted into the list at that body's rank.

### G3. THE VETO LAYER

For every body on the G2 list, run the project's second-order check. Mark each
body CLEAR or VETOED. A VETOED body stays on the list for the record but cannot
open a window, however strong it is at the first order. Print the veto column.

A system with no veto organ over-predicts. Every block in Part 2 names an
explicit veto organ for its project. Do not run the block without it.

### G4. PERIOD CLOCK — the coarse when

Walk the period ladder in order, narrowing one level at a time:
Mahadasha, Antardasha, Pratyantardasha, Sookshma, Prana.

- A level qualifies only when its lord is on the G2 list **and** is CLEAR at G3.
- **Every level in the chain must qualify independently.** A qualified Mahadasha
  under a non-qualified Antardasha does not deliver. This is the rule that most
  often separates a correct window from a plausible one.
- Stop narrowing at the level where a lord fails. The band you reached is the
  resolution the period clock alone supports.
- When the project also carries a conditional or alternative dasha test, run the
  system-selection test **first** and time on the selected system. Timing on the
  wrong dasha system costs a whole resolution level and is invisible in the output.

### G5. TRANSIT TRIGGER — the fine when

Only inside a period window that passed G4. Four instruments, each answering a
different granularity, never summed:

1. **Slow bodies** — Saturn and Jupiter over the sensitive points of the G2 list,
   in the project's own terms. These set the window, weeks to months.
2. **Sun** — gives the month.
3. **Moon** — gives the day, by transiting the trigger point or its trines.
4. **Lagna** — gives the hour, only when the day is already fixed and the birth
   time is exact.

Retrograde handling, which materially changes the date: when a slow body crosses
a trigger point three times, enumerate all three passes with their dates and the
station dates between them. The event most often lands on the **direct pass after
the station**, not the first contact. Quote all three, name the favoured one.

### G6. CONVERGENCE AND RESOLUTION

Cluster the overlapping candidate stretches. Grade each cluster by the count of
**independent** instruments landing on it. Two instruments that read the same
underlying fact are one instrument, not two.

Then declare the resolution band. This is the shared scale across all projects,
matching the R-scale already used in Udu Kaal Nirnay:

| Band | Width | Requires |
|---|---|---|
| **R1** | a day | exact birth time, verified ledger, full ladder to Prana, Moon trigger fixed |
| **R2** | a week | exact birth time, verified ledger, ladder to Sookshma |
| **R3** | a month | verified ledger, ladder to Pratyantardasha, Sun trigger fixed |
| **R4** | a quarter | ladder to Pratyantardasha, slow-body window only |
| **R5** | six to twelve months | ladder to Antardasha, no fixed trigger |
| **R6** | a dasha span, direction only | promise clear, clock unverified or lagna unusable |

Hard caps, none of which may be overridden by a strong-looking convergence:

- Fewer than three verified past events in the ledger, cap **R4**.
- Birth time uncertain by more than the export's own sensitivity figure, cap **R4**.
- Birth time unknown, or the Lagna dropped, cap **R5** and disable every
  lagna-dependent instrument.
- The project's mandatory gate section absent from the export, cap **R5** and name
  what is missing.

Window width is whatever the instruments give. **Never quote a fixed plus or
minus six months.** A fabricated width is a false precision claim.

Ranking: score candidates on convergence **and** proximity, so that a tidy window
a decade away cannot outrank a well-supported one months away. Use a declared
proximity penalty, stated in the answer, not an unstated preference.

### G7. LEDGER VERIFICATION — earn the forward claim

Before any forward window is quoted, re-derive at least three **dated past
events** from the ledger using G1 to G5 unchanged. Report, honestly:

- how many were re-derived inside the band claimed,
- which instrument fired for each,
- which past events the engine cannot reproduce.

Clock grade: **VERIFIED** three or more reproduced, **PARTIAL** one or two,
**UNVERIFIED** none or no ledger. The grade caps the forward band per G6. Never
present a forward window from an UNVERIFIED clock as a forecast. Say it is the
next converged window on this instrument, which is a different claim.

### G8. OUTPUT CONTRACT — the fixed answer shape

Answer in exactly this order, every time:

```
JUDGMENT MOMENT  : <date, time, place> | fingerprint: <five lords>
PROMISE          : PROMISED / CONDITIONAL <condition> / DENIED  + the arithmetic
SIGNIFICATORS    : ranked closed list, with the veto column
PERIOD           : the qualifying MD / AD / PD / Sookshma chain, with dates
                   and the level at which qualification stopped
PRIMARY WINDOW   : <start date> to <end date> | convergence n of m | band Rx
                   the instruments that fired, named one by one
ALTERNATE WINDOW : <start date> to <end date> | convergence n of m | band Rx
CLOCK GRADE      : VERIFIED / PARTIAL / UNVERIFIED, with the ledger result
FALSIFIERS       : what, if observed, would void this window
LIMITS           : missing sections, birth-time sensitivity, out-of-system lanes
BOTTOM LINE      : one sentence carrying the date range and the confidence word
```

### G9. Standing prohibitions

1. No date without a passed promise gate.
2. No instrument outside the closed G2 list may justify a date.
3. Never sum period evidence and transit evidence into one score.
4. Never average two instruments that disagree. Report both, say they disagree,
   and say which one the ledger has historically backed for this native.
5. No anti-anchoring: scan every event group, not only the one the native hopes
   for. Report a strong signal for an unasked matter when the scan finds it.
6. Never substitute a missing lane with a lane from another system silently. Name
   the substitution, mark it out-of-system, and let it corroborate only, never
   originate a window.
7. Never quote a date of death, and never convert a maraka window into an end-of-
   life claim. Longevity output is a band, with the health routing attached.
8. State every approximation, especially assumed coordinates and rounded birth
   times, and what they would change.

---

## Part 2 — REPLACEMENT BLOCKS, ONE PER PROJECT

Each block below assumes Part 1 is already present in that project.

---

### 2.1 — Shree Ganesh Ji Blessed Ashtakvarga Pro

**REPLACEMENT BLOCK, TIMING OF EVENTS**

Input contract. The reading runs on the ASHTAKAVARGA EXPORT, not on SAV totals.
Required: prastara matrices, degrees within the sign, all three reduction states
(ashodhita, trikona-shodhita, ekadhipatya-shodhita), karana and shodhya pinda,
and `transits.current` built at the asked date. Any missing item makes the reading
PARTIAL. Name the gap, never estimate it. The checksum line is a gate: Sun 48,
Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, SAV 337. A failure
voids the reading entirely, before promise.

**G1 promise organ.** Route the question to its governing house and karaka. Then:
`PROMISE = (SAV of the house minus 14) divided by 28, times 100`, inverted and
capped for the 6th, 8th and 12th. Apply the minimum modifier and the hani-sthana
check. Declare a **floor** and honour it: below the floor the verdict is DENIED
and no window is emitted, whatever the transits look like. The existing
MAGNITUDE, CAPACITY, DELIVERED and VERDICT percent arithmetic stays exactly as it
is, but VERDICT is now a gate first and a score second.

**G2 closed significator set**, ranked:
1. the karaka of the governing house,
2. the lord of the governing house,
3. the planets contributing bindus to that house in their own bhinnashtakavarga,
4. the kaksha donors of that sign, in kaksha order.

**G3 veto organ — the reduction states and the kaksha donor.** A body whose
contribution disappears under trikona or ekadhipatya reduction is VETOED for
origination and may only corroborate. Separately, at trigger time, a transiting
body standing in a kaksha whose donor gave **zero** bindu is vetoed for that pass,
however good the period looks. This is the Ashtakavarga analogue of the KP
sub-lord and it is what stops this project firing on raw SAV height.

**G4 period clock.** Three lanes, each stating its own resolution, never summed:
khanda life-third, Sudarshan age-year, Ashtakavarga dasha. VedNetra carries no
Ashtakavarga dasha lane. Declare that lane UNAVAILABLE. Vimshottari may be shown
as an explicitly labelled **out-of-system corroborator** only, and may never
originate a window in this project.

**G5 transit trigger.** Three independent dated instruments:
1. a slow graha over the governing sign, resolved to the **kaksha** it occupies,
2. a slow graha over the **pinda nakshatra**, the karaka's shodhya pinda modulo 27,
3. a slow graha over the karaka's nakshatra and its two trines.

Kaksha resolution is what makes this project able to name a date rather than a
mood: one kaksha is 3 degrees 45 minutes, so Saturn crosses one in roughly 3.5
months and Jupiter in roughly 1.5 months. That arithmetic, not a guess, sets the
window width. The month and day witness is read at the **centre of the quoted
window**, never at the moment of enquiry.

**G6.** Scan the whole life plus 25 years, backwards as well as forwards. Cluster
overlapping spells. Grade on independent instruments only. Achievable bands with
a full export and a verified ledger: **R3 to R4**. Claim R2 only when the kaksha
window, the pinda nakshatra crossing and the karaka trine crossing agree to within
a month and the ledger is VERIFIED.

**G7.** Backtest with `av-timing-backtest.js` against the dated event ledger. Read
the **skill** column, engine minus a uniform null model over the same eligible
range, not the raw hit rate. If the engine does not also beat the **soonest**
null model, say plainly that the instruments are adding nothing the calendar
already supplied. Until this has run on real data, state that the timing lane's
accuracy is unquantified and that the window is the next converged window rather
than a validated forecast.

**Grave verdicts** keep the four-fire gate: all four must fire, otherwise the
output is CANDIDATE, never asserted.

---

### 2.2 — Shree Ganesha Blessed Udu, the UduDaya nakshatra project

**REPLACEMENT BLOCK, TIMING OF EVENTS**

Input contract. The VEDNETRA UDUDAYA REPORT, sections 1 to 13. Section 3 must
carry the **pada column** on every graha, section 6 the dated Vimshottari to
Pratyantardasha, section 7 all 101 rows of the age-activation grid, section 8
Tara Bala counted from the **natal** Moon. The age grid prints in two columns,
ages 0 to 50 on the left and 51 to 100 on the right; read both. A missing pada
column disables the heaviest-weighted layer and caps everything at R5.

**G1 promise organ.** The matter is promised when the nakshatra and pada of the
karaka, and of the lord of the governing house, carry the corpus rules for it,
with the Lagna nakshatra as the third witness. Gandanta, Mula and Panchak flags
are read here as conditions, not as timing. Declare a floor. Below it, DENIED.

**G2 closed significator set**, ranked, the nakshatra analogue of KP's four steps:
1. planets tenanted in the nakshatras owned by the matter's karaka,
2. planets tenanted in the nakshatras owned by the governing house lord,
3. the karaka itself,
4. the governing house lord.

**G3 veto organ — pada plus Tara Bala.** Two checks, both blocking:
- **Pada.** The pada fixes the navamsa, and pada rules carry the heaviest weight
  in this corpus. A significator whose pada falls in a hostile navamsa is VETOED
  for origination.
- **Tara Bala from the natal Moon.** A period lord standing in Vipat, Pratyari or
  Naidhana tara is VETOED for delivery in that period, however well it signifies.
This pair is this project's sub-lord. Without it the nakshatra layer fires on
star ownership alone and over-predicts badly.

**G4 period clock.** Vimshottari Mahadasha, Antardasha, Pratyantardasha, each
level qualifying independently against the G2 list and the G3 vetoes. Then cross
it against the **age-activation grid**: where a corpus rule says "after N years of
age", a window may open only where the age rule and the running dasha lord agree.
Where they disagree, report both and open no window.

**G5 transit trigger.** Jupiter and Saturn crossing the natal nakshatra of a CLEAR
significator, or its two trinal nakshatras. The Sun's nakshatra ingress gives the
month. The Moon's return to the trigger nakshatra gives the day. Sade Sati and
Saturn or Jupiter over the natal Moon, from section 12, are read as **conditions
on the quality** of the window, never as the window itself.

**G6.** Achievable bands: **R2 to R4** with a verified ledger and an exact birth
time. Without the pada column, or with an uncertain birth time, this project is
honestly an **R5 to R6** instrument. Say so rather than quoting a month.

**G7.** Re-derive three dated past events before quoting forward. The Udu-only
route is the fallback path: promise is strong, timing is weaker than the merged
Kaal Nirnay engine. When both are available and they disagree, report both and
do not average.

---

### 2.3 — Shree Ganesh Ji blessed Udu Kaal Nirnay

**REPLACEMENT BLOCK, TIMING OF EVENTS**

This project already has the strongest timing spine of the non-KP set. The
changes make its gates explicit and blocking, and add the two things it lacks.

Input contract. The UKN REPORT, sections 0 to 25, from VedNetra v1.124 or newer,
Lahiri only. Hard gates, each of which stops the reading rather than degrading it
silently: section 3 pada and nakshatra, section 6 the influence matrix, section 7
D-9, section 10 the longevity band, section 14 Vimshottari, section 15 the
conditional-dasha tests, section 16 Yogini and Tribhagi. Soft gates, which
degrade with a named cost: section 21 the forward calendar, cap R5; section 13
SAV, the mandatory Ashtakavarga gate is skipped; section 24 the relatives map.

**G0 additions.** Record the judgment-moment fingerprint of Part 1 before any
window is computed. This project has no ruling-planets layer today; adding it is
the single largest available gain, because it is an independent instrument that
cannot be fitted after the fact. Section 0's dated event ledger sets the clock
grade, and the clock grade caps the band: below three verified events, cap R4.

**G1 promise organ.** The UDU promise layer over section 3, weighted with pada at
1.5, gated by the mandatory Ashtakavarga check from section 13. Make it blocking:
a failed promise ends the reading with a denial and its arithmetic.

**G2 closed significator set.** Take it from the **six routes of the section 6
influence matrix** and from nothing else. Rank the routes as the corpus ranks
them and print the ranked list. Kernel 1 cannot be scored without this section,
so an absent section 6 is a stop, not a degrade.

**G3 veto organ — BT1 and BT2.** Run the break tests in D-1 and D-9 against every
candidate. BT2, the corpus's own most valuable and most forgotten test, is
mandatory: an absent section 7 disables it and therefore stops the reading. A
candidate failing a break test is VETOED for origination.

**G4 period clock.** Run the **conditional-dasha tests of section 15 first** and
time on the system they select. Assuming Vimshottari because section 15 is absent
costs exactly one resolution level, and that cost must be stated in the answer.
Then walk the selected ladder with independent qualification at each level.
Section 16, Yogini and Tribhagi, is the **independent corroborator**, not a
tiebreaker to be averaged. Without it every verdict drops to Indicative.

**G5 transit trigger.** Kernel 2 over the section 21 forward calendar, with the
three-pass retrograde enumeration of Part 1 G5. Where section 10's longevity band
puts the window near a maraka stretch, the output is a health-and-caution window
with medical routing, never an end-of-life claim, and both longevity methods must
have agreed before that stretch is even discussed.

**G6.** Achievable bands: **R2 to R3** with a VERIFIED clock, an exact birth time
and all hard gates passed. R1 only with the Prana level reached and the Moon
trigger fixed. Every soft-gate absence lowers the ceiling by its stated cost.

**G7.** Section 0 is the ledger. Re-derive three or more of its events through
Kernel 1 and Kernel 2 unchanged, report which instrument fired for each, and name
the events the engine cannot reproduce. Report the clock grade in the answer.

---

### 2.4 — MediAstro, the medical project

**REPLACEMENT BLOCK, TIMING OF EVENTS**

Safety clause first, and it outranks every other rule in this block. This is not
a diagnosis and not medical advice. Never name a disease as a fact, never quote a
date of death, never advise stopping or changing treatment. Every window that
touches a grave matter is routed to a named clinician alongside the reading. A
maraka window is a caution window, never an end.

Input contract. The MEDICAL ASTROLOGY DEEP ANALYSIS export, all fifteen sections:
positions to the arc-second with nakshatra, pada, sub-lord, retrograde, combustion
and dignity; Gulika and Mandi; Placidus cusps; the four medical vargas D-9, D-3,
D-30 and D-6; Vimshottari to Pratyantardasha with the full dated Mahadasha
sequence; Shadbala; Bhinnashtakavarga and Sarvashtakavarga; yogas; transits at the
asked date.

**G1 promise organ.** A condition is promised only when three witnesses agree:
the 6th, 8th and 12th complex in D-1; the karaka of the body part and its house;
and the D-6 Shashthamsa with the D-30 Trimshamsa. Two witnesses out of three is
CONDITIONAL, and the condition is named. One witness is DENIED. No onset date is
ever computed from a single varga.

**G2 closed significator set**, ranked:
1. the planets afflicting the governing house and its karaka,
2. the nakshatra lords of those afflictors,
3. the D-6 lord and the D-30 lord of the afflicted point,
4. Gulika and Mandi where they touch the same complex.

**G3 veto organ — Shadbala floor, dignity, combustion, retrogression.** Declare a
Shadbala floor. An afflictor below the floor is VETOED for an acute onset and may
only indicate a chronic or subclinical tendency. A combust or deeply debilitated
afflictor is likewise demoted. This is the difference between predicting an event
and predicting a susceptibility, and this project must always say which of the two
it is predicting.

**G4 period clock.** Vimshottari Mahadasha, Antardasha and Pratyantardasha of the
CLEAR afflictors, each level qualifying independently. Run the birth-dasha test
first: the dasha running at birth conditions which lane the body follows. The
Ashtakavarga lane is the strength witness for the window, not its origin.

**G5 transit trigger.** Slow bodies over the **afflicted natal degrees** to the
arc-minute and over the natal Moon; the Sun for the month; the Moon for the day.
Report the three-pass enumeration where a slow body is retrograde over the point,
because for health matters the first contact frequently shows the investigation
and the direct pass the event.

**G6.** Achievable bands: **R3 to R4**. Do not quote R1 or R2 for a health onset,
even when the arithmetic permits it, because a dated day-level health claim causes
harm out of proportion to its accuracy. Quote the month or the quarter, and
attach the caution.

**G7.** Backtest on the native's own dated medical history before any forward
window. Illnesses are the best-recorded events most natives have, so a PARTIAL
grade here is usually avoidable. Name the episodes the engine cannot reproduce.

---

### 2.5 — Bhrigu Nandi Nadi, the BNN project

**REPLACEMENT BLOCK, TIMING OF EVENTS**

Input contract. The BNN CHART EXPORT. Sex is mandatory and load-bearing, because
BNN swaps karakas by sex. Block B is the chart itself: without it nothing can be
read. **Block E2 is the dating block: without it no dating is possible at all**,
and the correct output is then what and why, never when. Block H1 is the
Vimshottari lane: without it the answer is transit-only and the resolution drops
to weeks or months rather than days. Set `enquiryDate` to the asked date or every
transit in the export is for today.

**G1 promise organ.** The karaka chain. A matter is promised when its karaka
stands in a readable chain, with the Rahu and Ketu arc taken into account and the
parivartana effective positions used rather than the nominal ones. An **isolated**
karaka, by the export's own isolation grade, with no chain, is DENIED. This is the
cleanest promise gate in the whole set and it must be blocking.

**G2 closed significator set**, ranked:
1. the karaka of the matter, at its effective position after exchanges,
2. bodies in the karaka's degree neighbourhood, by the export's flank definition,
3. bodies in its trines,
4. the chain partners the export enumerates for it.

**G3 veto organ — isolation grade and the direction group.** A candidate whose
isolation grade marks it cut off, or whose direction group places it against the
matter, is VETOED for origination. In BNN, timing derives meaning from the karaka
lexicon and dates from the transits, so an unvetted karaka produces a confidently
dated wrong event.

**G4 period clock.** Two lanes, kept apart:
- the **Jupiter clock**, one sign per year, which is this system's native coarse
  clock and is what makes BNN readable without a birth time,
- the **Vimshottari lane** from block H1, which supplies the finer ladder when a
  birth time exists.
Where the two lanes disagree, report both and open no window. Never average them.

**G5 transit trigger.** Block E2 is the instrument: exact crossing dates, pass
numbers, stations, and the windows it computes. Apply the three-pass rule
explicitly, because BNN windows are dominated by retrograde triple contacts. Quote
the pass number for every date given.

**G6.** Achievable bands: **R2 to R3** with block E2 and block H1 both present and
an exact birth time. Transit-only, with H1 absent, the honest ceiling is **R4**.
Without E2, there is no band, because there is no date.

**G7.** BNN is exceptionally checkable against a ledger because its crossings are
exact. Re-derive at least three past events by pass number before quoting forward,
and name the pass that fired for each.

---

### 2.6 — Trinetra, Triveni and the Consolidated Master Run

**REPLACEMENT BLOCK, TIMING OF EVENTS**

This project already carries the right three lanes, Promise, Star and Time. The
change is to make Promise **gate** Time, to close the Star list, and to give the
project an explicit veto organ, which it currently lacks.

Input contract. The Consolidated Master Run on Lahiri, whole sign, covering
Mehta and Sutton VAPM, Trinetra Promise-Star-Time, Umesh Puri and Triveni, with
section I-H, the 37-pointer weighted three-frame Sudarshan BALA scored out of 100.
Pass `birthTimeConfidence`, because section I-H depends on it.

**G1 promise organ.** The **Promise lane**, gating everything. The Time lane may
not run until Promise returns PROMISED or CONDITIONAL. This is the single change
that most improves this project's dating: today the Time lane can produce a window
for a matter the Promise lane never carried.

**G2 closed significator set.** The **Star lane**, written out as a ranked closed
list before any date is opened. Rank as the lane ranks, print it, and cite nothing
outside it thereafter.

**G3 veto organ — the 37-pointer Sudarshan BALA, with a declared floor.** Section
I-H is the capacity measure this project already computes and does not currently
use as a gate. Declare a floor out of 100. A significator below the floor is
VETOED for origination and may only corroborate. Second veto: the **three-frame
Sudarshan agreement** itself. Where the Lagna frame, the Moon frame and the Sun
frame disagree on a candidate, that candidate cannot originate a window.

**G4 period clock.** The **Time lane**, walked with independent qualification at
every level against the G2 list and the G3 vetoes. Auspiciousness remains decided
by the Promise and Star lanes, never by the dasha alone.

**G5 transit trigger.** Slow bodies over the Star lane's sensitive points, Sun for
the month, Moon for the day. The **VAPM lane is the independent corroborator** for
the window and must not be merged into the Time lane's count.

**G6.** Achievable bands: **R3 to R4**. This is a whole-sign consolidated
instrument, so it is honest at the month and quarter and should not claim the
week. Where a week-level claim is wanted, route the native to the KP PRO project
and say why.

**G7.** Because four sub-systems run here, report per-lane agreement in the
answer: which of the four independently landed on the quoted window. Four lanes
agreeing is the strongest convergence statement any project in this set can make.
Four lanes disagreeing is a genuine result and must be reported as such, not
resolved by majority vote.

---

## Part 3 — Pasting and verification

1. Paste **Part 1** into each project first, then the project's own block from
   Part 2 immediately after it.
2. Then run this drill on each project before trusting it, using one native whose
   events you already know:
   - Ask a question whose answer the chart should **deny**. A correct build now
     returns a denial with arithmetic and **no window at all**. If it still quotes
     a date, the promise gate is not blocking and the paste has not taken.
   - Ask a dated past event. A correct build re-derives it and names the
     instrument that fired.
   - Ask a forward question with fewer than three ledger events supplied. A
     correct build caps itself at R4 and says why.
   - Check that the answer arrives in the G8 shape, with the fingerprint line
     printed **before** the window.
3. Keep the ledger with each native. Clock grade is per native, not per project,
   and it is the input that most improves accuracy over time.

## Part 4 — Honest note on this document

The KP PRO project instructions were not available when this was written, so the
spine in Part 1 was reconstructed from KP method itself and from what VedNetra's
own KP System Report exposes for a project to consume: the A0 sensitivity flag,
the A1 cuspal sub-lords with their own sub-lords, the A2 planet star, sub and
sub-sub columns, the A6 stability roll-up, the A3 four-level Vimshottari, the
B1 to B4 significators, ruling planets and CSL promise board, the B5 event-group
scan, the C1 transit snapshot and the C2 event-date Prana ladder. A KP PRO
project can only be timing on those blocks, which is what makes the
reconstruction tight rather than speculative. If you paste the actual KP PRO
timing section back, the mapping tables in Part 2 can be aligned to its exact
wording, weights and thresholds.
