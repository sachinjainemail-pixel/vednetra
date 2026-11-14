#!/usr/bin/env node
/* Self test for event_rank.js on Kundali 2, 3 May 2021. node suj_engine/tests/rank_selftest.js */
const { rank } = require("../tools/event_rank");
const r = rank({ gender: "female", date: "1991-11-07", time: "10:50:00", tz: 5.5, lat: 28.6139, lon: 77.2090, on: "2021-05-03", events: ["marriage", "child_birth", "health_crisis", "mother_in_law_loss"] });
let pass = 0, n = 0;
const ok = (name, c) => { n++; if (c) pass++; else console.log("FAIL " + name); };
ok("four levels of dasha lords, no Prana", r.lords.length === 4 && r.lords.map(x => x.level).join(" ") === "MD AD PD SD");
ok("every event has four per level rows", r.rows.every(x => x.per.length === 4));
ok("a planet's shares across the events never add to more than one", ["Mercury", "Venus", "Sun"].every(p => r.rows.reduce((a, x) => a + x.per.filter(q => q.lord === p).reduce((b, q) => b + q.share, 0), 0) / r.rows[0].per.filter(q => q.lord === p).length <= 1.0001));
ok("rows are sorted by score", r.rows.every((x, i) => i === 0 || r.rows[i - 1].score >= x.score));
ok("Mercury links to child birth through D7 house 5", r.rows.find(x => x.event === "child_birth").per.some(q => q.lord === "Mercury" && q.why.some(w => /D7 house 5/.test(w))));
console.log(pass + " of " + n + " passed");
process.exit(pass === n ? 0 : 1);
