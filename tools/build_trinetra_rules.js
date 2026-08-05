#!/usr/bin/env node
/*
 * TRINETRA rule builder — parses the classical rule .md files (Promise eye) and
 * the Sutton nakshatra file (Star eye) into a compact, browser-loadable dataset,
 * compiling each rule's prose Condition/Apply into machine-evaluable predicate
 * clauses where the phrasing is unambiguous. Rules that don't compile are kept
 * as reference (compiled=null) and shown by area/sub-event, never asserted.
 *
 * Usage: node build_trinetra_rules.js <out.js> <ruleFile1> [ruleFile2 ...]
 * Output: window.TRINETRA_RULES = [ {id, area, sub, name, cond, apply, result,
 *          prio, cancel, timing, sys, src, clauses|null} ... ]
 */
const fs = require("fs");

// ---------- vocab ----------
const PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
const PLANET_ALT = "sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu";
const PLANET_RE = "("+PLANET_ALT+")";
// gap between a planet and its placement that must NOT cross another planet name
// (so "Saturn in the lagna, Mars in the 7th" never binds Saturn to the 7th).
const GAP = "(?:(?!(?:"+PLANET_ALT+"))[^.;]){0,18}?";
const SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
// English + Sanskrit sign names -> index (these texts use both, e.g. "Mesha (Aries)")
const SIGN_SYN = { aries:0,mesha:0, taurus:1,vrishabha:1,vrisha:1,vrishab:1, gemini:2,mithuna:2, cancer:3,karka:3,kataka:3,karkata:3, leo:4,simha:4,sinha:4, virgo:5,kanya:5, libra:6,tula:6,thula:6, scorpio:7,vrishchika:7,vrischika:7, sagittarius:8,dhanu:8,dhanus:8,dhanush:8, capricorn:9,makara:9,makar:9, aquarius:10,kumbha:10,kumbh:10, pisces:11,meena:11,mina:11 };
const SIGN_RE = Object.keys(SIGN_SYN).sort((a,b)=>b.length-a.length).join("|");
function signIdx(w){ return SIGN_SYN[w.toLowerCase()]; }
const NAKSHATRAS = ["ashwini","bharani","krittika","rohini","mrigashira","ardra","punarvasu","pushya","ashlesha","magha","purva phalguni","uttara phalguni","hasta","chitra","swati","vishakha","anuradha","jyeshtha","mula","purva ashadha","uttara ashadha","shravana","dhanishta","shatabhisha","purva bhadrapada","uttara bhadrapada","revati"];
const WORD_ORD = {first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12};
// a single ordinal token, digit ("7th") or word ("seventh")
const ORD_RE = "(?:\\d{1,2}(?:st|nd|rd|th)|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)";
function ordToHouse(tok){ tok=tok.toLowerCase(); if(/^\d/.test(tok)){ var n=parseInt(tok,10); return (n>=1&&n<=12)?n:null; } return WORD_ORD[tok]||null; }
function ordsIn(run){ var out=[], m, re=new RegExp(ORD_RE,"gi"); while((m=re.exec(run))){ var h=ordToHouse(m[0]); if(h) out.push(h); } return out; }
function cap(w){ return w.charAt(0).toUpperCase()+w.slice(1); }
function planetCanon(w){ return cap(w.toLowerCase()); }

// ordinal token -> house number (digit "7th" or word "seventh")
function ordHouses(str){
  const out = new Set();
  let m, re1=/\b(\d{1,2})(?:st|nd|rd|th)\b/gi;
  while((m=re1.exec(str))){ const n=+m[1]; if(n>=1&&n<=12) out.add(n); }
  for(const w in WORD_ORD){ if(new RegExp("\\b"+w+"\\b","i").test(str)) out.add(WORD_ORD[w]); }
  return out;
}

// ---------- parser: split a rule file into rule blocks ----------
function parseRules(text, srcTag){
  const lines = text.split(/\r?\n/);
  const rules = [];
  let cur=null, area=srcTag;
  const idRe = /^#{2,4}\s+([A-Z]{1,6}-[A-Za-z0-9][A-Za-z0-9-]*)\b\s*(?:[—-]\s*(.*))?$/;
  const fldRe = /^\s*-\s*\*{0,2}([A-Za-z][A-Za-z /-]*?)\*{0,2}:\*{0,2}\s*(.*)$/;
  function push(){ if(cur) rules.push(cur); }
  for(const raw of lines){
    const mh = raw.match(idRe);
    if(mh){ push(); cur={ id:mh[1], area:area, name:(mh[2]||"").trim(), fields:{} }; continue; }
    if(cur){
      const mf = raw.match(fldRe);
      if(mf){ const k=mf[1].trim().toLowerCase().replace(/\s+/g,""); cur.fields[k]=(mf[2]||"").trim(); cur._last=k; }
      else if(cur._last && raw.trim()){ cur.fields[cur._last]+=" "+raw.trim(); }
    }
  }
  push();
  return rules;
}

// ---------- condition compiler (PRECISION FIRST) ----------
// Strip illustrative examples & parentheticals so "(e.g., Sun in Aries)" and
// enumerations don't compile into false conditions. Only assert a clause when
// the phrasing is an unambiguous astrological placement/relationship.
function preclean(s){
  return (s||"")
    .replace(/\be\.?g\.?[^.;)]*/gi," ")     // drop "e.g. ..." example clauses first
    .replace(/\bi\.?e\.?[^.;)]*/gi," ")
    // parentheticals: keep the INNER text when it carries houses (has a digit),
    // e.g. "Trika (6th/8th/12th)"; drop purely-textual ones (usually examples).
    .replace(/\(([^)]*)\)/g, function(_,inner){ return /\d/.test(inner)? " "+inner+" " : " "; })
    .replace(/\s+/g," ");
}
// A rule compiles to AND-of-OR-groups: clauses about the SAME subject+attribute
// (e.g. "Moon in Scorpio/Virgo/Taurus/Leo") are OR-alternatives in one group;
// clauses about DIFFERENT subjects (Saturn-house vs Moon-house vs Mars-house)
// are separate groups that must ALL be satisfied. Fires only when every group hits.
function slotKey(c){
  switch(c.t){
    case "planetInHouse": return "P"+c.p+"H";
    case "planetHouseFrom": return "P"+c.p+"HF"+c.ref;
    case "planetInSign": return "P"+c.p+"S";
    case "planetInNak": return "P"+c.p+"N";
    case "dignity": return "P"+c.p+"D";
    case "lordInHouse": return "L"+c.of+"H";
    case "lordInSign": return "L"+c.of+"S";
    case "lordHouseFrom": return "L"+c.of+"HF"+c.ref;
    case "assoc": return "A"+[c.a,c.b].sort().join("");
    case "aspectsHouse": return "AS"+c.p+c.h;
    case "nakOccupied": return "NK"+c.n;
  }
  return JSON.stringify(c);
}
function compile(cond, apply){
  const text = preclean(((cond||"")+" ; "+(apply||"")));
  const low = text.toLowerCase();
  const bySlot = {};
  function add(c){ const k=slotKey(c); const arr=bySlot[k]||(bySlot[k]=[]); const kk=JSON.stringify(c); if(!arr.some(x=>JSON.stringify(x)===kk)) arr.push(c); }

  // reference frame after a house: "... from the Moon/Venus/lagna"
  const REF = "(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu|lagna|ascendant|asc)";
  function refOf(s){ if(!s) return null; s=s.toLowerCase(); if(s==="lagna"||s==="ascendant"||s==="asc") return "Lagna"; return planetCanon(s); }

  // lord of the Nth ... in the Mth house [from <ref>]    (lordInHouse / lordHouseFrom)
  let re, m;
  re=new RegExp("lord of (?:the )?(\\d{1,2})(?:st|nd|rd|th)[^.;]{0,60}?\\bin (?:the )?(\\d{1,2})(?:st|nd|rd|th) house(?:\\s+from (?:the )?"+REF+")?","gi");
  while((m=re.exec(low))){ const a=+m[1],b=+m[2],r=refOf(m[3]); if(a<=12&&b<=12){ if(r&&r!=="Lagna") add({t:"lordHouseFrom",of:a,h:b,ref:r}); else add({t:"lordInHouse",of:a,h:b}); } }
  // Nth lord in the Mth house [from <ref>]
  re=new RegExp("(\\d{1,2})(?:st|nd|rd|th) lord[^.;]{0,50}?\\bin (?:the )?(\\d{1,2})(?:st|nd|rd|th) house(?:\\s+from (?:the )?"+REF+")?","gi");
  while((m=re.exec(low))){ const a=+m[1],b=+m[2],r=refOf(m[3]); if(a<=12&&b<=12){ if(r&&r!=="Lagna") add({t:"lordHouseFrom",of:a,h:b,ref:r}); else add({t:"lordInHouse",of:a,h:b}); } }
  // lord of the Nth ... in <sign>   (lordInSign)
  re=new RegExp("lord of (?:the )?(\\d{1,2})(?:st|nd|rd|th)[^.;]{0,60}?\\bin ("+SIGN_RE+")\\b","gi");
  while((m=re.exec(low))){ const a=+m[1],s=signIdx(m[2]); if(a<=12&&s!=null) add({t:"lordInSign",of:a,s}); }

  // planet-LIST sharing one placement: "Sun, Mars and Saturn in the lagna",
  // "Rahu and Jupiter (together) in the lagna, the 4th or the 6th house".
  // Every listed planet must hold the placement (AND across planets); the houses
  // listed are OR-alternatives within each planet's slot. This stops a compound
  // condition from firing on just one of its planets.
  re=new RegExp("((?:(?:"+PLANET_ALT+")[ ,]+(?:and |or |& )?){1,}(?:"+PLANET_ALT+"))\\s+(?:are |all |both |together |conjoined |placed |posited |situated |)*in (?:the )?([^.;]{0,60}?house|lagna|ascendant)","gi");
  while((m=re.exec(low))){
    var plist=(m[1].match(new RegExp(PLANET_ALT,"gi"))||[]).map(planetCanon);
    var place=m[2], houses=ordsIn(place);
    if(/\blagna\b|\bascendant\b/.test(place) && houses.indexOf(1)<0) houses.unshift(1);
    if(plist.length>=2 && houses.length){ plist.forEach(function(pp){ houses.forEach(function(hh){ add({t:"planetInHouse",p:pp,h:hh}); }); }); }
  }
  // <planet> in the Nth house [from <ref>] — captures a full ordinal RUN so
  // "in the 5th, the 7th or the 9th house" and word ordinals ("seventh") all
  // parse; multiple houses become OR-alternatives in the planet's slot.
  re=new RegExp(PLANET_RE+GAP+"\\bin (?:the )?("+ORD_RE+"(?:[ ,]+(?:or |and |the )*"+ORD_RE+")*)\\s+house(?:s)?(?:\\s+from (?:the )?"+REF+")?","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]), hs=ordsIn(m[1+1]), r=refOf(m[3]); if(!/lord of/.test(low.slice(Math.max(0,m.index-12),m.index))){ hs.forEach(function(h){ if(r&&r!=="Lagna") add({t:"planetHouseFrom",p,h,ref:r}); else add({t:"planetInHouse",p,h}); }); } }
  // <planet> in the lagna / ascendant  -> house 1
  re=new RegExp(PLANET_RE+GAP+"\\bin (?:the )?(?:lagna|ascendant|asc\\b)","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]); if(!/lord of/.test(low.slice(Math.max(0,m.index-12),m.index))) add({t:"planetInHouse",p,h:1}); }
  // <planet> in <sign>
  re=new RegExp(PLANET_RE+GAP+"\\bin ("+SIGN_RE+")\\b","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]),s=signIdx(m[2]); if(s!=null) add({t:"planetInSign",p,s}); }
  // <planet> in <nakshatra>
  re=new RegExp(PLANET_RE+GAP+"\\bin ("+NAKSHATRAS.join("|")+")\\b","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]),n=NAKSHATRAS.indexOf(m[2]); if(n>=0) add({t:"planetInNak",p,n}); }

  // <planet> in a HOUSE-GROUP word (trika/dusthana/kendra/trikona/upachaya) -> OR over the group
  const HGROUP = { trika:[6,8,12], dusthana:[6,8,12], dushthana:[6,8,12], kendra:[1,4,7,10], angle:[1,4,7,10], angular:[1,4,7,10], quadrant:[1,4,7,10], trikona:[1,5,9], trine:[1,5,9], trinal:[1,5,9], upachaya:[3,6,10,11], panapara:[2,5,8,11], apoklima:[3,6,9,12] };
  const HGROUP_RE = "trika|dushthana|dusthana|kendra|angular|angle|quadrant|trikona|trinal|trine|upachaya|panapara|apoklima";
  re=new RegExp(PLANET_RE+GAP+"\\bin (?:an?|the )?\\s*("+HGROUP_RE+")\\b","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]), grp=HGROUP[m[2].toLowerCase()]; if(grp && !/lord of/.test(low.slice(Math.max(0,m.index-12),m.index))) grp.forEach(function(h){ add({t:"planetInHouse",p,h}); }); }
  // "<Nth/lagna> lord in a <group> house"  ->  lordInHouse OR over the group
  re=new RegExp("(?:(\\d{1,2})(?:st|nd|rd|th)|lagna|ascendant) lord[^.;]{0,40}?\\bin (?:an?|the )?\\s*("+HGROUP_RE+")\\b","gi");
  while((m=re.exec(low))){ const of=m[1]?+m[1]:1, grp=HGROUP[m[2].toLowerCase()]; if(grp) grp.forEach(function(h){ add({t:"lordInHouse",of,h}); }); }

  // conjunction / association / mutual aspect of two planets — STRONG verbs only.
  re=new RegExp(PLANET_RE+"\\s*(?:conjoins?|conjunct(?:ed)?(?: with)?|in conjunction with|associated with|associates? with|joined with|joins\\b|yuti(?: with)?|combust with|aspect(?:s|ed by|ing)?)\\s*(?:by |the )?"+PLANET_RE,"gi");
  while((m=re.exec(low))){ const a=planetCanon(m[1]),b=planetCanon(m[2]); if(a!==b) add({t:"assoc",a,b}); }

  // <planet> aspects the Nth [and Mth] house(s) — capture the full ordinal run (each aspected house ANDs)
  re=new RegExp(PLANET_RE+"[^.;]{0,20}?aspect(?:s|ing)?[^.;]{0,10}?("+ORD_RE+"(?:[ ,]+(?:or |and |the )*"+ORD_RE+")*)\\s+house(?:s)?","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]); ordsIn(m[1+1]).forEach(function(h){ add({t:"aspectsHouse",p,h}); }); }

  // dignities — planet BEFORE or AFTER the dignity word ("Venus debilitated" / "debilitated Venus")
  const DIGW="(exalt\\w*|debilitat\\w*|own sign|own house|swakshetra|moolatrikona|mooltrikona|retrograde|combust)";
  function digVal(w){ w=w.toLowerCase(); if(w.indexOf("exalt")===0)return"Exalted"; if(w.indexOf("debilitat")===0)return"Debilitated"; if(w.indexOf("own")===0||w==="swakshetra")return"Own"; if(w.indexOf("mool")===0)return"Moolatrikona"; if(w==="retrograde")return"Retro"; if(w==="combust")return"Combust"; return null; }
  re=new RegExp(PLANET_RE+"\\s+(?:is |being |and |)?"+DIGW,"gi");     // planet then dignity
  while((m=re.exec(low))){ const p=planetCanon(m[1]),d=digVal(m[2]); if(d) add({t:"dignity",p,d}); }
  re=new RegExp(DIGW+"\\s+"+PLANET_RE,"gi");                            // dignity then planet
  while((m=re.exec(low))){ const d=digVal(m[1]),p=planetCanon(m[2]); if(d) add({t:"dignity",p,d}); }

  // COMPLETENESS GUARD (enforces "fire only when ALL conditions hold"): if the
  // Condition names a planet for which we captured no clause, the extraction is
  // incomplete -> return null (reference-only) rather than fire on a fragment.
  const condPlanets = new Set(((preclean(cond)||"").toLowerCase().match(new RegExp(PLANET_ALT,"gi"))||[]).map(planetCanon));
  const clausePlanets = new Set();
  Object.keys(bySlot).forEach(function(k){ bySlot[k].forEach(function(c){ if(c.p) clausePlanets.add(c.p); if(c.a){clausePlanets.add(c.a); clausePlanets.add(c.b);} }); });
  var complete = true;
  condPlanets.forEach(function(p){ if(!clausePlanets.has(p)) complete=false; });
  if(!complete) return null;
  // QUALIFIER GUARD: the condition contains an attribute we can't verify from
  // placement alone (strength, negation, paksha/day-night, benefic/malefic
  // aspect). Don't auto-fire on the structural part — route to reference.
  var lowCond = (preclean(cond)||"").toLowerCase();
  if(/\b(afflicted|unafflicted|weak|weakened|strong|strength|powerful|without|unless|free from|except|waning|waxing|paksha|shukla|krishna|daytime|by day|by night|hemmed|kartari|papakartari|malefic|malefics|benefic|benefics|papa|shubha)\b/.test(lowCond)) return null;
  // special reference frames / divisional placements we don't evaluate here
  if(/\b(karakamsha|karakamsa|arudha|upapada|indu lagna|navamsa|navamsha|drekkana|dwadasamsa|dashamsa|karakamsha lagna)\b/.test(lowCond)) return null;
  // LORD GUARD: the condition names a house-lord ("lagna lord", "7th lord",
  // "lord of the 2nd") but we captured no lord clause -> uncaptured condition.
  if(/\blord\b/.test(lowCond)){
    var hasLord=false; Object.keys(bySlot).forEach(function(k){ bySlot[k].forEach(function(c){ if(c.t==="lordInHouse"||c.t==="lordInSign"||c.t==="lordHouseFrom") hasLord=true; }); });
    if(!hasLord) return null;
  }
  const groups = Object.keys(bySlot).map(k=>bySlot[k]);
  return groups.length? groups : null;
}

// ---------- main ----------
const [,,outFile,...files] = process.argv;
if(!outFile||!files.length){ console.error("usage: build_trinetra_rules.js <out.js> <ruleFile...>"); process.exit(1); }
const AREA_FROM_NAME = f => (f.match(/RULES\d+([a-z]+)/i)||[,f])[1].replace(/\.md$/,"");
let all=[]; const perArea={};
for(const f of files){
  const txt = fs.readFileSync(f,"utf8");
  const area = /nakshatra/i.test(f)?"Nakshatra":cap(AREA_FROM_NAME(f));
  const rules = parseRules(txt, area);
  perArea[area]={total:0,compiled:0};
  for(const r of rules){
    const F=r.fields;
    const cond=F.condition||"", apply=F.apply||"";
    // Nakshatra dictums (Sutton): per-nakshatra IDs S-Nnn compile to "that nakshatra
    // is occupied by some point"; S-CH technique dictums fall back to the prose compiler.
    let g;
    const nm = area==="Nakshatra" && /^S-N(\d{2})/.exec(r.id);
    if(nm){ const idx=(+nm[1])-1; g = (idx>=0&&idx<=26)? [[{t:"nakOccupied",n:idx}]] : compile(cond,apply); }
    else g = compile(cond, apply);
    // compact record: g = AND-of-OR-groups (all groups must hit to fire)
    const rec={ id:r.id, area, sub:(F["sub-event"]||F.subtopic||F.topic||""),
      cond, result:F.result||F.effect||"", src:F.source||F.page||"", g };
    all.push(rec); perArea[area].total++; if(g) perArea[area].compiled++;
  }
}
// stats
const clHist={};
all.forEach(r=>(r.g||[]).forEach(gr=>gr.forEach(c=>{clHist[c.t]=(clHist[c.t]||0)+1;})));
console.log("=== TRINETRA rule build ===");
for(const a in perArea){ const p=perArea[a]; console.log(`  ${a}: ${p.total} rules, ${p.compiled} compiled (${(100*p.compiled/p.total).toFixed(1)}% auto-matchable), ${p.total-p.compiled} reference`); }
console.log("  clause-type histogram:", JSON.stringify(clHist));
console.log("\n=== 8 sample compiled rules ===");
all.filter(r=>r.g).slice(0,8).forEach(r=>{
  console.log(`  [${r.id}] ${r.cond.slice(0,80)}`);
  console.log(`      -> AND${JSON.stringify(r.g)}`);
});
// write dataset
fs.writeFileSync(outFile, "window.TRINETRA_RULES=(window.TRINETRA_RULES||[]).concat("+JSON.stringify(all)+");\n","utf8");
console.log("\n[written] "+outFile+"  ("+all.length+" rules, "+(fs.statSync(outFile).size/1024).toFixed(0)+" KB)");
