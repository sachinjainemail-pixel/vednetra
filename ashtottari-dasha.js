/* Ashtottari: Ardra start, 28 stars including Abhijit; equal star shares.
 * Sources and variants are documented in README. Pure calculation, no prediction. */
(function (root) {
  'use strict';
  var LORDS = ['Sun','Moon','Mars','Mercury','Saturn','Jupiter','Rahu','Venus'];
  var YEARS = [6,15,8,17,10,19,12,21];
  var GROUPS = [4,3,4,3,4,3,4,3];
  var YEAR = 365.25 * 86400000;
  var WIDTH = 40 / 3;
  // Standard 27-star boundaries with Abhijit carved out of Uttarashadha
  // and Shravana: 276°40' through 280°53'20".
  var bounds = [];
  for (var n = 0; n <= 27; n++) bounds.push(n * WIDTH);
  bounds.push(276 + 40 / 60, 280 + 53 / 60 + 20 / 3600);
  bounds.sort(function (a,b) { return a-b; });
  // The regular 280° boundary lies inside Abhijit, not a separate star.
  bounds = bounds.filter(function (v) { return Math.abs(v - 280) > 1e-8; });
  function starting(moon) {
    if (!Number.isFinite(moon)) throw new Error('Moon longitude must be finite');
    var lon = ((moon % 360) + 360) % 360;
    var i = 0;
    while (i + 1 < bounds.length && lon >= bounds[i + 1]) i++;
    var ordinal = (i - 5 + 28) % 28, group = 0, offset = ordinal;
    while (offset >= GROUPS[group]) { offset -= GROUPS[group]; group++; }
    var fraction = (lon - bounds[i]) / (bounds[i+1] - bounds[i]);
    return { lord: LORDS[group], index: group, starIndex: i,
      fractionElapsed: (offset + fraction) / GROUPS[group] };
  }
  function subperiods(parent, index) {
    var out = [], cursor = parent.start;
    for (var k=0;k<8;k++) {
      var j = (index+k)%8;
      var end = k === 7 ? parent.end : cursor + (parent.end-parent.start)*YEARS[j]/108;
      out.push({lord:LORDS[j], index:j, start:cursor, end:end}); cursor=end;
    }
    return out;
  }
  function at(parent, index, when) {
    return subperiods(parent,index).find(function (x) { return x.start <= when && when < x.end; });
  }
  function calculate(moon, birth, when) {
    birth = +new Date(birth); when = +new Date(when);
    if (!Number.isFinite(birth) || !Number.isFinite(when)) throw new Error('Invalid birth or as-of date');
    if (when < birth) throw new Error('As-of date precedes birth');
    var init=starting(moon), firstStart=birth-init.fractionElapsed*YEARS[init.index]*YEAR;
    var t=firstStart, periods=[], current=null;
    // Two complete cycles after birth; enough for every date within 108 years of birth.
    for (var k=0;k<17;k++) {
      var idx=(init.index+k)%8, end=t+YEARS[idx]*YEAR;
      var md={lord:LORDS[idx],index:idx,start:t,end:end}; periods.push(md);
      if (t <= when && when < end) {
        var ad=at(md,idx,when), pd=at(ad,ad.index,when);
        current={mahadasha:md,antardasha:ad,pratyantar:pd};
      }
      t=end;
    }
    if (!current) throw new Error('As-of date outside computed two-cycle range');
    return { initial:init, birth:birth, asOf:when, periods:periods, current:current };
  }
  function markdown(chart,input) {
    var moon=(chart.planets||[]).find(function(p){return p.name==='Moon';});
    if (!moon) throw new Error('Moon missing from chart');
    var birth=input.birthInstant || chart.date, when=input.asOfInstant || new Date();
    var result=calculate(moon.lon,birth,when), c=result.current;
    function fmt(t){return new Date(t).toISOString().replace('T',' ').replace('.000Z',' UTC').replace('Z',' UTC');}
    var out=['# Ashtottari Dasha — '+(input.nativeName||'Native'),'','Calculation only; applicability is conditional and is not asserted.',
      'Convention: Ardra start, 28 stars with Abhijit, equal star shares in each lord’s group; 365.25-day year. Alternative conventions exist.',
      'Birth UTC: '+fmt(result.birth)+'; as of UTC: '+fmt(result.asOf),
      'Birth Moon longitude: '+moon.lon.toFixed(6)+'°; initial lord: '+result.initial.lord+'; elapsed: '+(result.initial.fractionElapsed*100).toFixed(4)+'%.',
      'Birth balance: '+((result.periods[0].end-result.birth)/YEAR).toFixed(6)+' years.','','## Running periods','','| Level | Lord | Start UTC | End UTC |','|---|---|---|---|'];
    [['Mahadasha',c.mahadasha],['Antardasha',c.antardasha],['Pratyantar',c.pratyantar]].forEach(function(row){out.push('| '+row[0]+' | '+row[1].lord+' | '+fmt(row[1].start)+' | '+fmt(row[1].end)+' |');});
    out.push('','## Mahadashas','','| Lord | Start UTC | End UTC |','|---|---|---|');
    result.periods.forEach(function(p){out.push('| '+p.lord+' | '+fmt(p.start)+' | '+fmt(p.end)+' |');});
    return out.join('\n');
  }
  root.VNAshtottari={starting:starting,calculate:calculate,subperiods:subperiods,markdown:markdown};
  if (typeof module !== 'undefined') module.exports=root.VNAshtottari;
})(typeof globalThis !== 'undefined' ? globalThis : this);
