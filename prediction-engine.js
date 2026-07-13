/*
 * VedNetra Prediction Engine
 * Operationalizes the back-tested methodology in VEDNETRA_PREDICTION_METHODOLOGY.md.
 * Consumes a chart built by window.VedicCore.buildChart(...) (Raman ayanamsha) and
 * returns per-topic predictions with a confidence tier and the reasons that fired.
 *
 * Every rule here traces to the 55-chart back-test. Confidence tiers reflect the
 * measured hit-rates: High (residence, health-binary, sibling-existence, timing themes),
 * Medium (marriage family, career service/business, education band), Low (exact counts,
 * parents loss, sibling gender) — surface them so the user knows how hard to lean.
 */
(function () {
  "use strict";

  var SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  var LORD = {Aries:"Mars",Taurus:"Venus",Gemini:"Mercury",Cancer:"Moon",Leo:"Sun",Virgo:"Mercury",Libra:"Venus",Scorpio:"Mars",Sagittarius:"Jupiter",Capricorn:"Saturn",Aquarius:"Saturn",Pisces:"Jupiter"};
  var EXALT = {Sun:"Aries",Moon:"Taurus",Mars:"Capricorn",Mercury:"Virgo",Jupiter:"Cancer",Venus:"Pisces",Saturn:"Libra"};
  var DEBIL = {Sun:"Libra",Moon:"Scorpio",Mars:"Cancer",Mercury:"Pisces",Jupiter:"Capricorn",Venus:"Virgo",Saturn:"Aries"};
  var OWN = {Sun:["Leo"],Moon:["Cancer"],Mars:["Aries","Scorpio"],Mercury:["Gemini","Virgo"],Jupiter:["Sagittarius","Pisces"],Venus:["Taurus","Libra"],Saturn:["Capricorn","Aquarius"]};
  var COMBUST = {Moon:12,Mars:17,Mercury:14,Jupiter:11,Venus:10,Saturn:15};
  var BENEFICS = ["Jupiter","Venus","Mercury","Moon"];
  var MALEFICS = ["Saturn","Mars","Rahu","Ketu","Sun"];

  function sidx(name){ return SIGNS.indexOf(name); }

  // ---- chart accessor built once per prediction ----
  function wrap(chart){
    var P = {};
    chart.planets.forEach(function(p){ P[p.name] = p; });
    var sun = P.Sun;
    var sunLon = sidx(sun.signName)*30 + sun.deg;

    function dignity(name){
      var p = P[name]; if(!p || name==="Rahu" || name==="Ketu") return "";
      if(p.signName===EXALT[name]) return "exalted";
      if(p.signName===DEBIL[name]) return "debilitated";
      if((OWN[name]||[]).indexOf(p.signName)>=0) return "own";
      return "";
    }
    function combust(name){
      if(!(name in COMBUST)) return false;
      var p=P[name]; var d=Math.abs((sidx(p.signName)*30+p.deg)-sunLon); d=Math.min(d,360-d);
      return d < COMBUST[name] && name!=="Sun";
    }
    function houseLord(h){ var hh=chart.houses[h-1]; return hh?hh.lord:null; }
    function lordHouse(h){ var l=houseLord(h); return (l&&P[l])?P[l].house:null; }
    function occupants(h){ return chart.planets.filter(function(p){return p.house===h;}).map(function(p){return p.name;}); }
    // houses a planet in house ph aspects
    function aspectsFrom(name){
      var ph=P[name].house; var res=[nth(ph,7)];
      if(name==="Mars"){ res.push(nth(ph,4),nth(ph,8)); }
      else if(name==="Jupiter"){ res.push(nth(ph,5),nth(ph,9)); }
      else if(name==="Saturn"){ res.push(nth(ph,3),nth(ph,10)); }
      else if(name==="Rahu"||name==="Ketu"){ res.push(nth(ph,5),nth(ph,9)); }
      return res;
    }
    function nth(from,n){ return ((from-1+n-1)%12)+1; }
    function planetsAspecting(h){ return chart.planets.filter(function(p){ return aspectsFrom(p.name).indexOf(h)>=0; }).map(function(p){return p.name;}); }
    function moonIsBenefic(){
      var m=P.Moon; var comp=occupants(m.house).filter(function(n){return n!=="Moon";});
      var afflicted = comp.some(function(n){return ["Saturn","Mars","Rahu","Ketu","Sun"].indexOf(n)>=0;}) || dignity("Moon")==="debilitated";
      return !afflicted;
    }
    function beneficOnHouse(h){
      // benefic occupying OR aspecting house h (Moon only if benefic)
      var list=[];
      occupants(h).forEach(function(n){ if(BENEFICS.indexOf(n)>=0 && (n!=="Moon"||moonIsBenefic())) list.push(n+" in "+ord(h)); });
      planetsAspecting(h).forEach(function(n){ if(BENEFICS.indexOf(n)>=0 && (n!=="Moon"||moonIsBenefic()) && P[n].house!==h) list.push(n+" aspects "+ord(h)); });
      return list;
    }
    function maleficOnHouse(h){
      var list=[];
      occupants(h).forEach(function(n){ if(MALEFICS.indexOf(n)>=0) list.push(n+" in "+ord(h)); });
      planetsAspecting(h).forEach(function(n){ if(MALEFICS.indexOf(n)>=0 && P[n].house!==h) list.push(n+" aspects "+ord(h)); });
      return list;
    }
    function conj(a,b){ return P[a]&&P[b]&&P[a].house===P[b].house; }
    function inHouses(name,arr){ return P[name] && arr.indexOf(P[name].house)>=0; }

    return {chart:chart,P:P,dignity:dignity,combust:combust,houseLord:houseLord,lordHouse:lordHouse,
      occupants:occupants,planetsAspecting:planetsAspecting,beneficOnHouse:beneficOnHouse,
      maleficOnHouse:maleficOnHouse,conj:conj,inHouses:inHouses,moonIsBenefic:moonIsBenefic,nth:nth};
  }

  function ord(n){ return n+({1:"st",2:"nd",3:"rd"}[n]||"th"); }
  function dignTag(c,name){ var d=c.dignity(name); var cb=c.combust(name); var r=c.P[name]&&c.P[name].retrograde;
    var t=[]; if(d)t.push(d); if(cb)t.push("combust"); if(r)t.push("retro"); return t.length?" ("+t.join(", ")+")":""; }
  function place(c,name){ var p=c.P[name]; if(!p) return name+"?"; return name+" in "+p.signName+" "+ord(p.house)+dignTag(c,name); }

  // ============ TOPIC PREDICTORS ============

  function education(c){
    var reasons=[]; var S=0;
    // J
    var jd=c.dignity("Jupiter");
    if(jd==="exalted"||jd==="own"){ S+=3; reasons.push("+3 Jupiter "+jd); }
    else if(jd==="debilitated"){ S-=3; reasons.push("−3 Jupiter debilitated (strong negative filter)"); }
    if(c.combust("Jupiter")){ S-=1; reasons.push("−1 Jupiter combust"); }
    // M
    var md=c.dignity("Mercury"), mc=c.combust("Mercury"), mr=c.P.Mercury.retrograde;
    if((md==="exalted"||md==="own") && !mc){ S+=2; reasons.push("+2 Mercury "+md+" & not combust"); }
    else if(md==="debilitated" || (mc&&mr)){ S-=2; reasons.push("−2 Mercury "+(md==="debilitated"?"debilitated":"combust+retro")); }
    else if(mc){ S-=1; reasons.push("−1 Mercury combust"); }
    // L (5th lord)
    var l5=c.houseLord(5);
    if(l5 && l5!=="Jupiter"){
      var d5=c.dignity(l5), h5=c.P[l5].house;
      if(d5==="exalted"||d5==="own"){ S+=2; reasons.push("+2 5th-lord "+l5+" "+d5); }
      else if(d5==="debilitated"){ S-=2; reasons.push("−2 5th-lord "+l5+" debilitated"); }
      if([5,9].indexOf(h5)>=0){ S+=1; reasons.push("+1 5th-lord in "+ord(h5)); }
      else if([6,8,12].indexOf(h5)>=0 || c.combust(l5)){ S-=1; reasons.push("−1 5th-lord in dusthana/combust"); }
    }
    // Boosters (cap +2)
    var B=0;
    var l9=c.houseLord(9);
    if(l9 && (c.dignity(l9)==="exalted"||c.dignity(l9)==="own")){ B++; reasons.push("+1 booster: 9th-lord strong"); }
    var occ5=c.occupants(5);
    if(occ5.some(function(n){return c.dignity(n)==="exalted";}) || occ5.indexOf("Jupiter")>=0 || occ5.indexOf("Moon")>=0){ B++; reasons.push("+1 booster: strong planet/Jupiter/Moon in 5th"); }
    // Bhadra yoga: Mercury exalted/own in a kendra
    if((c.dignity("Mercury")==="exalted"||c.dignity("Mercury")==="own") && [1,4,7,10].indexOf(c.P.Mercury.house)>=0){ B++; reasons.push("+1 booster: Bhadra yoga (Mercury dignified in kendra)"); }
    B=Math.min(B,2); S+=B;

    var ans, conf;
    if(S<=-1){ ans="Below graduate (up to 12th / diploma)"; }
    else if(S<=1){ ans="Graduate (BA / BCom / BSc / BBA)"; }
    else { ans="Professional or higher (BTech/BE, MBA, CA, MA/MSc, PhD, law, medicine)"; }
    conf = (S>=2||S<=-2)?"Medium-High":"Medium";
    reasons.push("Education strength score S = "+S);
    if(S>=0 && S<=1) reasons.push("Note: the 'graduate' middle band is intrinsically fuzzy — treat as within-one-band.");
    return {answer:ans, confidence:conf, reasons:reasons};
  }

  function career(c, gender){
    var reasons=[]; var ans, conf="Medium";
    var sunH=c.P.Sun.house;
    var ll=c.houseLord(1), llH=c.P[ll]?c.P[ll].house:null, llDeg=c.P[ll]?c.P[ll].deg:null;
    // 1 Government
    if(sunH===10 || (c.conj("Sun","Saturn") && [1,4,7,10].indexOf(sunH)>=0)){
      ans="Government / authority job"; conf="Medium-High";
      reasons.push(sunH===10?"Sun in the 10th (authority)":"Sun–Saturn conjunct in a kendra");
      return {answer:ans,confidence:conf,reasons:reasons};
    }
    // 2 Not working / homemaker
    var llAfflicted = ll && (c.dignity(ll)==="debilitated" || c.combust(ll) || (llDeg!==null&&llDeg<1) || [6,8,12].indexOf(llH)>=0);
    var dusthanaCluster = [6,8,12].some(function(h){ return c.occupants(h).filter(function(n){return c.dignity(n)==="debilitated"||c.combust(n);}).length>=2; });
    var loaded7 = (gender==="female") && c.occupants(7).length>=2 && c.occupants(7).some(function(n){return MALEFICS.indexOf(n)>=0;});
    if(llAfflicted && (dusthanaCluster || loaded7)){
      ans="Likely not working / homemaker"; conf="Medium-High";
      reasons.push("Lagna-lord "+place(c,ll)+" is weak/afflicted");
      if(dusthanaCluster) reasons.push("cluster of weak planets in a dusthana (6/8/12)");
      if(loaded7) reasons.push("7th house loaded with a malefic (female chart)");
      return {answer:ans,confidence:conf,reasons:reasons};
    }
    // 3 Own business
    var marsKendra = (c.dignity("Mars")==="own"||c.dignity("Mars")==="exalted") && [1,4,7,10].indexOf(c.P.Mars.house)>=0;
    var l7=c.houseLord(7), l7H=c.P[l7]?c.P[l7].house:null, l7dig=l7?c.dignity(l7):"";
    var l6=c.houseLord(6), l6strong = l6 && c.P[l6].house===6;
    if((marsKendra || l7H===10 || ((l7dig==="own"||l7dig==="exalted") && [6,8,12].indexOf(l7H)<0)) && !l6strong){
      ans="Own business / independent work"; conf="Medium";
      if(marsKendra) reasons.push("Mars "+c.dignity("Mars")+" in a kendra");
      if(l7H===10) reasons.push("7th-lord "+l7+" in the 10th");
      if(l7dig==="own"||l7dig==="exalted") reasons.push("7th-lord "+l7+" "+l7dig+", outside dusthanas");
      reasons.push("Caveat: the service↔business boundary is the weakest edge (~73%); check D-10 to confirm.");
      return {answer:ans,confidence:"Medium",reasons:reasons};
    }
    // 4 Self-employed professional
    if(ll==="Sun" && l7 && (c.dignity(l7)==="debilitated"||c.combust(l7)||[6,8,12].indexOf(l7H)>=0)){
      ans="Self-employed professional (own practice / consulting / teaching)"; conf="Low-Medium";
      reasons.push("Leo lagna (Sun) with a weak 7th-lord → independent practice over partnership");
      return {answer:ans,confidence:conf,reasons:reasons};
    }
    // 5 default private
    ans="Private / salaried job (service)";
    if(l6strong) reasons.push("6th-lord strong in the 6th → service");
    reasons.push("Default service outcome (no clear business or government signature).");
    return {answer:ans,confidence:"Medium",reasons:reasons};
  }

  function marriage(c, gender){
    var reasons=[]; var karaka = (gender==="female")?"Jupiter":"Venus";
    var l7=c.houseLord(7), l7H=c.P[l7]?c.P[l7].house:null;
    var kH=c.P[karaka]?c.P[karaka].house:null, kDig=c.dignity(karaka), kWithKetu=c.conj(karaka,"Ketu");
    var mars=c.P.Mars, manglik=[1,2,4,7,8,12].indexOf(mars.house)>=0;
    var benefic7=c.beneficOnHouse(7), malefic7=c.maleficOnHouse(7);
    var karakaAfflicted = kWithKetu || (kH===12 && kDig!=="own" && kDig!=="exalted") || kDig==="debilitated" || c.combust(karaka) || c.conj(karaka,"Ketu") || c.conj(karaka,"Rahu");
    // 7th-lord afflicted = in dusthana, debilitated, combust, OR conjunct a node (Ketu/Rahu) — the latter is the
    // documented top-signal case (e.g. 7th-lord Venus with Ketu → unmarried).
    var l7weak = l7 && ([6,8,12].indexOf(l7H)>=0 || c.dignity(l7)==="debilitated" || c.combust(l7) || c.conj(l7,"Ketu") || c.conj(l7,"Rahu"));

    // 1 widow screen (weak, flagged)
    var widowFlag = (kH===12 && kDig!=="own" && kDig!=="exalted") || kWithKetu;
    // 2 unmarried
    if(l7weak && benefic7.length===0 && karakaAfflicted){
      reasons.push("7th-lord "+place(c,l7)+" afflicted (dusthana / debilitated / combust / with a node)");
      reasons.push("no benefic in/aspecting the 7th");
      reasons.push("marriage karaka "+place(c,karaka)+" afflicted"+(kWithKetu?" (with Ketu)":""));
      return {answer:"Likely unmarried / no formal marriage (possibly live-in or affair)", confidence:"Medium", reasons:reasons};
    }
    // 3 divorce/separation
    if(manglik && malefic7.length>0 && benefic7.length===0){
      reasons.push("Manglik (Mars in "+ord(mars.house)+")");
      reasons.push("malefic on the 7th with no benefic there: "+malefic7.join(", "));
      return {answer:"Married but high risk of divorce / separation", confidence:"Medium", reasons:reasons};
    }
    // benefic-in-7 cancellation note if manglik but benefic present
    if(manglik && benefic7.length>0){ reasons.push("Manglik, BUT benefic in/aspecting 7th ("+benefic7.join(", ")+") cancels the damage — marriage tends to hold."); }
    // 4 love vs arranged
    var l5=c.houseLord(5), l5H=c.P[l5]?c.P[l5].house:null;
    var loveSignal = (kH===5) || (l7H===5) || ([5].indexOf(l5H)>=0 && (c.dignity(l5)==="own"||c.dignity(l5)==="exalted")) || (gender==="female" && c.P.Jupiter.house===5);
    var base = "Married (stable)";
    if(loveSignal){
      var extra = (gender==="female" && c.P.Jupiter.house===5) ? "Jupiter in the 5th (for a woman → love marriage, 4/4 in data)" : "karaka/7th-lord/5th-lord tied to the 5th house";
      reasons.push("5th-house link → love marriage: "+extra);
      return {answer:"Married — likely a love / self-chosen marriage", confidence:"Low-Medium", reasons:reasons};
    }
    // 4b Obstruction/delay screen: weak 7th-lord + no benefic on the 7th, even without an afflicted karaka.
    // In the data these charts are usually currently-unmarried (often young natives) — call it honestly, not "stable".
    if(l7weak && benefic7.length===0){
      reasons.push("7th-lord "+place(c,l7)+" weak (dusthana/debilitated/combust/node) and no benefic supports the 7th.");
      reasons.push("Karaka "+place(c,karaka)+" is not itself afflicted, so this reads as delay/obstruction rather than outright denial.");
      return {answer:"Marriage delayed or obstructed — may currently be unmarried (or a late / difficult marriage)", confidence:"Low-Medium", reasons:reasons};
    }
    if(widowFlag) reasons.push("(Weak signal: karaka weak in 12th / with Ketu — a small widowhood risk exists but is largely unreadable from D-1.)");
    reasons.push("7th-lord "+place(c,l7)+"; karaka "+place(c,karaka)+"; no strong spoiler → stable arranged marriage.");
    return {answer:"Married (stable, likely arranged)", confidence:"Medium", reasons:reasons};
  }

  function children(c, gender, marriageAns){
    var reasons=[];
    // 1 marriage gate
    if(/unmarried|no formal/i.test(marriageAns)){
      reasons.push("Marriage gate: native looks unmarried → childless follows directly (the dominant pattern in the data).");
      return {answer:"Likely no children (follows from unmarried status)", confidence:"Medium", reasons:reasons};
    }
    // 2 debilitated Jupiter cap
    if(c.dignity("Jupiter")==="debilitated"){
      reasons.push("Jupiter debilitated → low progeny (≤1 child) — 7/8 in data.");
      return {answer:"Few children — likely childless or one child", confidence:"Medium", reasons:reasons};
    }
    // 3 count from 5th
    var occ5=c.occupants(5);
    var benefic5 = occ5.some(function(n){return BENEFICS.indexOf(n)>=0;});
    var jStrong = c.dignity("Jupiter")==="exalted"||c.dignity("Jupiter")==="own";
    var l5=c.houseLord(5), l5dig=l5?c.dignity(l5):"", l5H=c.P[l5]?c.P[l5].house:null;
    // 4 three+
    var maleficCluster5 = (occ5.indexOf("Saturn")>=0 && occ5.indexOf("Rahu")>=0) || occ5.indexOf("Mars")>=0;
    if(maleficCluster5 && l5H===8){
      reasons.push("malefic cluster in the 5th (Sat+Rahu / Mars) with 5th-lord in the 8th → large family (both 3-child charts).");
      return {answer:"Three or more children", confidence:"Low", reasons:reasons};
    }
    if(benefic5 || jStrong || l5dig==="own" || l5dig==="exalted"){
      if(benefic5) reasons.push("benefic in the 5th");
      if(jStrong) reasons.push("Jupiter "+c.dignity("Jupiter"));
      if(l5dig==="own"||l5dig==="exalted") reasons.push("5th-lord "+l5+" "+l5dig);
      var sex = sexOfChild(c);
      return {answer:"Around two children"+(sex?" ("+sex+")":""), confidence:"Low-Medium", reasons:reasons};
    }
    reasons.push("no strong 5th-house support → modest progeny.");
    return {answer:"Likely one child", confidence:"Low", reasons:reasons};
  }
  function sexOfChild(c){
    var occ5=c.occupants(5);
    var fifthSign=c.chart.houses[4].signName;
    var female=["Cancer","Scorpio","Pisces","Taurus","Virgo","Capricorn"].indexOf(fifthSign)>=0;
    if(female && occ5.indexOf("Sun")<0 && occ5.indexOf("Mars")<0 && (occ5.indexOf("Jupiter")>=0)) return "possibly daughters";
    return "at least one son likely (91% base)";
  }

  function foreign(c){
    var reasons=[];
    var ll=c.houseLord(1);
    // 1 home
    if((c.dignity(ll)==="exalted") && [1,4,7,10].indexOf(c.P[ll].house)>=0){
      reasons.push("Lagna-lord "+ll+" exalted in a kendra → settled, stays home.");
      return {answer:"Lives in home city / native place", confidence:"High", reasons:reasons};
    }
    // 2 tenant in 12th
    var occ12=c.occupants(12);
    var tenant12 = occ12.indexOf("Rahu")>=0 || occ12.indexOf(ll)>=0 || occ12.some(function(n){return c.dignity(n)==="exalted";});
    if(tenant12){ reasons.push("Tenant in the 12th ("+occ12.join(", ")+") → abroad (3/3 in data)."); return {answer:"Likely settled / working abroad", confidence:"High", reasons:reasons}; }
    // 3 Rahu 9/11/12
    if([9,11,12].indexOf(c.P.Rahu.house)>=0){ reasons.push("Rahu in the "+ord(c.P.Rahu.house)+" → abroad."); return {answer:"Likely abroad", confidence:"Medium-High", reasons:reasons}; }
    // 4 Rahu/Ketu 4-10 + weak 12th lord
    var l12=c.houseLord(12);
    var axis410 = [4,10].indexOf(c.P.Rahu.house)>=0 || [4,10].indexOf(c.P.Ketu.house)>=0;
    if(axis410 && l12 && (c.dignity(l12)==="debilitated")){ reasons.push("Rahu/Ketu on the 4–10 axis with a weak 12th-lord → abroad."); return {answer:"Likely abroad", confidence:"Medium", reasons:reasons}; }
    // 5 other-state
    if(c.occupants(9).length>0 || c.P.Ketu.house===4 || [4,10].indexOf(c.P.Rahu.house)>=0){
      reasons.push("9th house occupied or Ketu-in-4th / Rahu on 4–10 axis → left birthplace, settled in another city/state.");
      return {answer:"Lives in another city / state (within country)", confidence:"Medium", reasons:reasons};
    }
    reasons.push("no displacement signal → stays near home.");
    return {answer:"Lives in home city / native place", confidence:"Medium", reasons:reasons};
  }

  function health(c){
    var reasons=[];
    var ll=c.houseLord(1);
    var llClean = c.dignity(ll)!=="debilitated" && [6,8,12].indexOf(c.P[ll].house)<0 && !c.combust(ll);
    var moon=c.P.Moon; var moonComp=c.occupants(moon.house).filter(function(n){return n!=="Moon";});
    var moonWithMarsNode = moonComp.some(function(n){return ["Mars","Rahu","Ketu"].indexOf(n)>=0;});
    var moonClean = c.dignity("Moon")!=="debilitated" && [6,8,12].indexOf(moon.house)<0 && !moonWithMarsNode && !c.combust("Moon");
    if(llClean && moonClean){
      reasons.push("Both Lagna-lord ("+place(c,ll)+") and Moon are clean — not debilitated, not in 6/8/12, not with Mars/nodes.");
      return {answer:"Broadly healthy — no major chronic affliction indicated", confidence:"High", reasons:reasons};
    }
    // mental signature
    if(c.conj("Moon","Mars") && (c.conj("Moon","Rahu")||c.conj("Moon","Ketu"))){
      reasons.push("Moon + Mars + a node together → mental / psychological stress signature.");
      return {answer:"Health flag: psychological / mental-stress vulnerability", confidence:"Medium", reasons:reasons};
    }
    var l8=c.houseLord(8);
    var serious = (c.dignity(ll)==="debilitated"||c.combust(ll)|| (l8&&c.dignity(l8)==="debilitated")) && ([8,12].indexOf(moon.house)>=0 || moonWithMarsNode);
    if(serious){ reasons.push("Lagna/8th lord afflicted AND Moon in 8/12 or on a Rahu–Ketu axis → risk of a serious/chronic ailment."); return {answer:"Health flag: risk of a serious or chronic illness (organ/disease not specifiable from D-1)", confidence:"Medium", reasons:reasons}; }
    reasons.push("Lagna-lord or Moon carries some affliction → watch health, but no strong major-illness stack.");
    return {answer:"Generally okay; minor health vulnerabilities possible", confidence:"Low-Medium", reasons:reasons};
  }

  function parents(c){
    var reasons=[]; var flags=0; var why=[];
    if(c.dignity("Sun")==="debilitated"){ flags++; why.push("Sun debilitated"); }
    if(c.conj("Sun","Saturn")){ flags++; why.push("Sun conjunct Saturn"); }
    if(c.conj("Sun","Rahu")||c.conj("Sun","Ketu")){ flags++; why.push("Sun conjunct a node"); }
    if(c.P.Saturn && c.nth(c.P.Saturn.house,7)===c.P.Sun.house){ flags++; why.push("Saturn exactly opposite Sun"); }
    if(c.lordHouse(9)===8){ flags++; why.push("9th-lord in the 8th"); }
    if(flags>=2){
      reasons.push("Father-loss stack (≥2 signals): "+why.join(", ")+".");
      reasons.push("(High precision but low recall — use only when the stack is clear.)");
      return {answer:"Father may not be alive (mother likely alive)", confidence:"Low-Medium", reasons:reasons};
    }
    reasons.push("No strong Sun / 9th-lord affliction stack — default to both parents alive (safest; this topic is close to base-rate).");
    if(why.length) reasons.push("(Single weak signal seen: "+why.join(", ")+" — not enough on its own.)");
    return {answer:"Both parents likely alive", confidence:"Low-Medium", reasons:reasons};
  }

  function siblings(c){
    var reasons=[];
    var occ = c.occupants(3).concat(c.occupants(11));
    var male=0, female=0;
    occ.forEach(function(n){ if(["Sun","Mars","Jupiter"].indexOf(n)>=0)male++; if(["Moon","Venus","Mercury"].indexOf(n)>=0)female++; });
    var skew = male>female?"more brothers likely":(female>male?"more sisters likely":"brother-lean (default)");
    reasons.push("Existence is the reliable part: a brother (~91%) and a sister (~79%) very likely exist.");
    reasons.push("Gender skew from planets in the 3rd+11th: "+male+" male vs "+female+" female → "+skew+" (weak, ~50%).");
    reasons.push("Exact count is near-unpredictable from the chart — give a range, not a number.");
    return {answer:"Has sibling(s) — almost certainly at least a brother, probably a sister; "+skew, confidence:"High (existence), Low (count/gender)", reasons:reasons};
  }

  function timingContext(c, VedicCore){
    var reasons=[];
    var stack=[];
    try { stack = VedicCore.findDashaStack(c.chart.vimshottari.timeline, new Date()); } catch(e){}
    if(!stack.length){ return {answer:"(dasha unavailable)", confidence:"", reasons:[]}; }
    var md=stack[0], ad=stack[1];
    reasons.push("Running dasha now: "+stack.map(function(x){return x.lord;}).slice(0,3).join(" / ")+".");
    // which houses does the MD lord signify (lord of, occupant of)
    function themes(lord){
      var t=[];
      for(var h=1;h<=12;h++){ if(c.houseLord(h)===lord) t.push(ord(h)+"-lord"); }
      if(c.P[lord]) t.push("in "+ord(c.P[lord].house));
      return t;
    }
    reasons.push("Mahadasha lord "+md.lord+": "+themes(md.lord).join(", ")+" → these life-areas are activated now.");
    if(ad) reasons.push("Antardasha lord "+ad.lord+": "+themes(ad.lord).join(", ")+".");
    reasons.push("Rule: an event fires when the dasha lord is the lord/occupant/karaka/aspector of that event's house (87% in data). Match the question's house to the active lords above to time it.");
    return {answer:"See active themes below", confidence:"High (theme), not polarity", reasons:reasons};
  }

  // ============ MAIN ============
  function predict(chart, gender, VedicCore){
    var c = wrap(chart);
    var out = {};
    out.chartSummary = summary(c, VedicCore);
    out.education = education(c);
    out.career = career(c, gender);
    var m = marriage(c, gender); out.marriage = m;
    out.children = children(c, gender, m.answer);
    out.foreign = foreign(c);
    out.health = health(c);
    out.parents = parents(c);
    out.siblings = siblings(c);
    out.timing = timingContext(c, VedicCore);
    return out;
  }

  function summary(c, VedicCore){
    var order=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
    var planets = order.map(function(n){ var p=c.P[n]; return {name:n, sign:p.signName, house:p.house, deg:Math.round(p.deg*100)/100, retro:!!p.retrograde, dignity:c.dignity(n), combust:c.combust(n), nak:p.nakshatra, pada:p.pada}; });
    var houses = c.chart.houses.map(function(h){ return {house:h.house, sign:h.signName, lord:h.lord}; });
    var bal = c.chart.vimshottari?c.chart.vimshottari.balanceLord:null;
    var dashaNow=[]; try{ dashaNow=VedicCore.findDashaStack(c.chart.vimshottari.timeline,new Date()).map(function(x){return x.lord;}); }catch(e){}
    var manglik=[1,2,4,7,8,12].indexOf(c.P.Mars.house)>=0;
    return {lagna:c.chart.ascendant.signName, lagnaDeg:Math.round(c.chart.ascendant.deg*100)/100, lagnaLord:c.houseLord(1),
      manglik:manglik, planets:planets, houses:houses, balanceLord:bal, dashaNow:dashaNow};
  }

  window.VedPredict = { predict: predict };
})();
