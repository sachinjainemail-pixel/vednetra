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
const PLANET_RE = "(sun|moon|mars|mercury|jupiter|venus|saturn|rahu|ketu)";
const SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
const SIGN_RE = SIGNS.join("|");
const NAKSHATRAS = ["ashwini","bharani","krittika","rohini","mrigashira","ardra","punarvasu","pushya","ashlesha","magha","purva phalguni","uttara phalguni","hasta","chitra","swati","vishakha","anuradha","jyeshtha","mula","purva ashadha","uttara ashadha","shravana","dhanishta","shatabhisha","purva bhadrapada","uttara bhadrapada","revati"];
const WORD_ORD = {first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12};
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
    .replace(/\([^)]*\)/g," ")            // drop parentheticals (often examples)
    .replace(/\be\.?g\.?[^.;]*/gi," ")     // drop "e.g. ..." example clauses
    .replace(/\bi\.?e\.?[^.;]*/gi," ")
    .replace(/\s+/g," ");
}
function compile(cond, apply){
  const text = preclean(((cond||"")+" ; "+(apply||"")));
  const low = text.toLowerCase();
  const clauses = [];
  const seen = new Set();
  function add(c){ const k=JSON.stringify(c); if(!seen.has(k)){ seen.add(k); clauses.push(c); } }

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
  while((m=re.exec(low))){ const a=+m[1],s=SIGNS.indexOf(m[2]); if(a<=12&&s>=0) add({t:"lordInSign",of:a,s}); }

  // <planet> in the Nth house [from <ref>]   (planetInHouse / planetHouseFrom) — avoid "lord of the Nth"
  re=new RegExp(PLANET_RE+"[^.;]{0,25}?\\bin (?:the )?(\\d{1,2})(?:st|nd|rd|th) house(?:\\s+from (?:the )?"+REF+")?","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]),h=+m[2],r=refOf(m[3]); if(h<=12 && !/lord of/.test(low.slice(Math.max(0,m.index-12),m.index))){ if(r&&r!=="Lagna") add({t:"planetHouseFrom",p,h,ref:r}); else add({t:"planetInHouse",p,h}); } }
  // <planet> in <sign>
  re=new RegExp(PLANET_RE+"[^.;]{0,20}?\\bin ("+SIGN_RE+")\\b","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]),s=SIGNS.indexOf(m[2]); if(s>=0) add({t:"planetInSign",p,s}); }
  // <planet> in <nakshatra>
  re=new RegExp(PLANET_RE+"[^.;]{0,20}?\\bin ("+NAKSHATRAS.join("|")+")\\b","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]),n=NAKSHATRAS.indexOf(m[2]); if(n>=0) add({t:"planetInNak",p,n}); }

  // conjunction / association of two planets — STRONG verbs only (never bare
  // "and"/","/"with", which catch significator/malefic enumerations).
  re=new RegExp(PLANET_RE+"\\s*(?:conjoins?|conjunct(?:ed)?(?: with)?|in conjunction with|associated with|associates? with|joined with|joins\\b|yuti(?: with)?|combust with|aspects?)\\s*(?:the )?"+PLANET_RE,"gi");
  while((m=re.exec(low))){ const a=planetCanon(m[1]),b=planetCanon(m[2]); if(a!==b) add({t:"assoc",a,b}); }

  // <planet> aspects the Nth house
  re=new RegExp(PLANET_RE+"[^.;]{0,25}?aspect(?:s|ing)?[^.;]{0,15}?(\\d{1,2})(?:st|nd|rd|th) house","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]),h=+m[2]; if(h<=12) add({t:"aspectsHouse",p,h}); }

  // dignities
  const digs=[["exalt","Exalted"],["debilitat","Debilitated"],["own sign","Own"],["own house","Own"],["moolatrikona","Moolatrikona"],["retrograde","Retro"],["combust","Combust"]];
  re=new RegExp(PLANET_RE+"[^.;]{0,20}?\\b(exalt\\w*|debilitat\\w*|own sign|own house|moolatrikona|retrograde|combust)","gi");
  while((m=re.exec(low))){ const p=planetCanon(m[1]); let d=null; for(const [k,v] of digs){ if(m[2].indexOf(k)===0||m[2].indexOf(k)>=0){ d=v; break; } } if(d) add({t:"dignity",p,d}); }

  return clauses.length? clauses : null;
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
    let clauses;
    const nm = area==="Nakshatra" && /^S-N(\d{2})/.exec(r.id);
    if(nm){ const idx=(+nm[1])-1; clauses = (idx>=0&&idx<=26)? [{t:"nakOccupied",n:idx}] : compile(cond,apply); }
    else clauses = compile(cond, apply);
    // compact record: only what the app needs to match + display
    const rec={ id:r.id, area, sub:(F["sub-event"]||F.subtopic||F.topic||""),
      cond, result:F.result||F.effect||"", src:F.source||F.page||"", clauses };
    all.push(rec); perArea[area].total++; if(clauses) perArea[area].compiled++;
  }
}
// stats
const clHist={};
all.forEach(r=>(r.clauses||[]).forEach(c=>{clHist[c.t]=(clHist[c.t]||0)+1;}));
console.log("=== TRINETRA rule build ===");
for(const a in perArea){ const p=perArea[a]; console.log(`  ${a}: ${p.total} rules, ${p.compiled} compiled (${(100*p.compiled/p.total).toFixed(1)}% auto-matchable), ${p.total-p.compiled} reference`); }
console.log("  clause-type histogram:", JSON.stringify(clHist));
console.log("\n=== 8 sample compiled rules ===");
all.filter(r=>r.clauses).slice(0,8).forEach(r=>{
  console.log(`  [${r.id}] ${r.cond.slice(0,80)}`);
  console.log(`      -> ${JSON.stringify(r.clauses)}`);
});
// write dataset
fs.writeFileSync(outFile, "window.TRINETRA_RULES=(window.TRINETRA_RULES||[]).concat("+JSON.stringify(all)+");\n","utf8");
console.log("\n[written] "+outFile+"  ("+all.length+" rules, "+(fs.statSync(outFile).size/1024).toFixed(0)+" KB)");
