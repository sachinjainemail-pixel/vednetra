# Udu procedure for the SARVA engine

Working summary of UDU-METHODOLOGY.pdf, the owner's 34 page document on the Shree Ganesha Blessed Udu project, also
called Shri Ganesha Blessed Udu and UduDaya, dated 16 November 2026. The document is the authority and this summary is
the English map. The text is in UDU-METHODOLOGY.txt and its heading index with line numbers in
UDU-METHODOLOGY.index.tsv. For every question read the document sections named here, do not work from this summary alone.

## What Udu is

A nakshatra and pada based Vedic engine that answers only from its own rule corpus. 11,683 rules from 7 books in 9
corpus files, Lahiri ayanamsa only, because any other ayanamsa shifts the 3 degree 20 minute pada boundary and silently
spoils the heaviest rules. The corpus is not stored in this repository, see README.md in this folder.

Books. Ram Babu Sao part 1 (RBS-1, 2,274 rules, partial 67 percent), Avasthi (AVA-2, 2,252, partial 37), Ashok Sharma
(ASH, 2,037), Ram Babu Sao part 2 (RBS-2, 1,718, partial 59), Prash Trivedi (TRI, 1,331), Tamhankar (TAM-RA, 1,091),
Natarajan (NAT, 980). The three partial books thin out in their later pages, silence there is extraction, not astrology.

Rule record. id (book code and four digits, for example ASH-1467, TRI-0919, RBS-1-0943), book and page, cat, subj (the
nakshatra), pada, graha, house or sign trigger, cond, eff, pol (benefic, malefic, mixed), conf (classical, stated,
inferred). Contradictions between books are kept, never merged.

## Pipeline (document section 1)

1 UduDaya report of the chart, 2 route the question to the right corpus file, 3 apply the corpus rules by domain, 4 weigh by
polarity, confidence and specificity, 5 Law 2 chain, 6 Law 3 dasha and transit gate, 7 final verdict.

## The seven laws (sections 3 to 10, summary in section 16)

Law 0, every claim carries a rule ID. 0a read each rule to its last word, every or alternative and the tail clause. 0b write
the full karaka list of every house touched. 0c write both poles of a nakshatra. If the corpus is silent say so, reason from
the nearest rules and say that this is what you do. A fabricated rule is the one real failure of the engine.
Law 1, direct meaning first. Direct lordship before derived. Natural nature never overrides functional lordship.
Expenditure buys something, loss buys nothing.
Law 2, a chain is built by the necessity test, not by resemblance. A link is in only if it is a prerequisite or the same
substance. Income is not in the profession chain. The trade karaka graha is the spine of the profession chain.
Law 3, promise and delivery are two things. The period test is a gate and adds no weight. Strong promise with the delivering
period passed means it happened, strong promise with the period not yet come means it has not happened, weak promise with the
period passed means reduced or missed, weak and not yet means not and unlikely. A weak promise still delivers if the dasha
lords and the transit all line up.
Law 4, a bare date is the weakest mode, seven steps, an age gate, never name death as the face of a date.
Law 5, rectify birth time only from Lagna derived evidence, at least three, and answer as a window.
Law 6, the transit ladder, a transit on the same nakshatra and the same pada is heaviest.

Routing (section 5). Marriage and relations UDU-vivah-sambandh. Career, wealth, property UDU-karya-dhan. Health, body, longevity
UDU-arogya-ayu. Nature and education UDU-vidya-swabhav. Children, parents, siblings UDU-santan-parivar. Dharma and remedy
UDU-dharma-upay. When, dasha, muhurta UDU-samay-muhurat. Travel, foreign, enemies, litigation UDU-yatra-shatru. Core nakshatra
nature UDU-mool-tattva. Read UDU-REF-coverage.md before any answer. Inside a file read the Moon nakshatra section, then the
section of the graha that drives the question, then _general. Open every category of the file, especially muhurta.

## Weighing (section 11)

Weight equals polarity times confidence times specificity. Polarity benefic +1, malefic minus 1, mixed 0. Confidence classical
1.2, stated 1.0, inferred 0.7. Specificity pada 1.5, graha in nakshatra 1.3, nakshatra alone 1.0, house or sign 0.6. Only rules
of the governing house and of links that passed the necessity test are summed. Bands, total +3 or more yes certain, +1 to +3 yes
with a condition, minus 1 to +1 mixed, minus 1 to minus 3 difficult, minus 3 or less no. The document notes that it does not say
where exactly +1 and minus 1 fall, show the neighbouring band. A pada rule overrules a house rule and the overruled rule is named.
Structure facts and the score are kept apart. Rules that nearly fired are named and left out of the sum. Show the arithmetic.

## Timing (sections 8 and 12)

The corpus has no Vimshottari arithmetic. Dasha dates come from the UduDaya report of the vednetra-ududaya skill, the pratyantar
is the engine's own count and is said so. A date window is never tighter than the rule supports. Gender and a birth time are
required, the corpus has sex specific rules. A past event is read by recasting the chart on the event date as the enquiry date.

## Style (sections 13 and 14)

Direct, no maybe and no disclaimer paragraph, no question is dodged. The only refusal is naming death as the face of a bare date.
Errors are admitted by naming the method. Check the 13 listed past mistakes before every answer, and the 16 item checklist of
section 16.

## How SARVA reconciles Udu with the SARVA contract

1. Udu's bands include mixed and difficult. The SARVA Udu cell is still one option. Pick the option with the highest weighted sum
   from the arithmetic, show the sums for each option, and name the band. A tie goes to the option that has the pada level rule.
2. Udu's own style rules of no disclaimer apply inside the Udu block. The LIMITS line of the SARVA intake still states the
   honest limits once for the whole reply.
3. Udu reports no measured accuracy in the document. Say in the EVIDENCE line that no accuracy has been measured for the Udu column.
4. Udu does not read another SARVA methodology's verdict.

## Not supplied

The 9 corpus files, the 4 reference files UDU-REF-coverage, UDU-REF-source-defects, UDU-REF-schema, UDU-REF-taxonomy, and
UDU-000-MANIFEST.md. The document says it did not read the other seven corpus files line by line either, and takes counts from the
manifest. It also leaves out rule IDs for the Mula poles and the bright pole of Purvabhadrapada because the project instructions
gave none.
