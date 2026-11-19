#!/usr/bin/env node
'use strict';
const assert = require('assert');
const A = require('../ashtottari-dasha.js');
const W = 40/3;
// Lord boundaries: Ardra, Magha, Hasta, Anuradha, Purva Ashadha,
// Dhanishtha, Uttara Bhadrapada, Rohini.
[[5*W,'Sun'],[9*W,'Moon'],[12*W,'Mars'],[16*W,'Mercury'],[19*W,'Saturn'],
 [22*W,'Jupiter'],[25*W,'Rahu'],[3*W,'Venus']].forEach(([lon,lord]) => assert.equal(A.starting(lon+1e-6).lord,lord));
// Abhijit consumes the last quarter of Uttara Ashadha and 1/15 of Shravana.
assert.equal(A.starting(276+40/60-1e-6).starIndex,20);
assert.equal(A.starting(276+40/60+1e-6).starIndex,21);
assert.equal(A.starting(280+53/60+20/3600+1e-6).starIndex,22);
// Equal star shares: midpoint of second of Sun's four stars = 37.5% elapsed.
assert(Math.abs(A.starting(6.5*W).fractionElapsed-0.375)<1e-10);
const birth = new Date('2000-01-01T00:00:00Z');
const res = A.calculate(6.5*W,birth,birth);
assert.equal(res.current.mahadasha.lord,'Sun');
assert.equal(res.current.antardasha.lord,'Mercury'); // already elapsed at birth
assert(Math.abs((res.periods[0].end-res.birth)/(365.25*864e5)-3.75)<1e-8);
for (const p of res.periods) {
  const sub=A.subperiods(p,p.index);
  assert.equal(sub[0].start,p.start); assert.equal(sub[7].end,p.end);
  for(let i=1;i<8;i++) assert.equal(sub[i-1].end,sub[i].start);
}
const boundary=res.periods[0].end;
assert.equal(A.calculate(6.5*W,birth,new Date(boundary)).current.mahadasha.lord,'Moon');
assert.throws(()=>A.calculate(0,birth,new Date('1999-12-31T00:00:00Z')));
assert.throws(()=>A.starting(NaN));
console.log('Ashtottari self-test passed: groups, Abhijit, birth balance, subperiods, boundaries, invalid input');
