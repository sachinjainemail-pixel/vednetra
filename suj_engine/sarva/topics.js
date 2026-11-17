"use strict";
/* SARVA question classifier and date reader. Reads the owner's own wording, Hindi or English, and never rewrites it. */
const MONTHS = {
  jan: 1, january: 1, "जनवरी": 1, feb: 2, february: 2, "फरवरी": 2, "फ़रवरी": 2, mar: 3, march: 3, "मार्च": 3, apr: 4, april: 4, "अप्रैल": 4, may: 5, "मई": 5,
  jun: 6, june: 6, "जून": 6, jul: 7, july: 7, "जुलाई": 7, aug: 8, august: 8, "अगस्त": 8, sep: 9, sept: 9, september: 9, "सितंबर": 9, "सितम्बर": 9,
  oct: 10, october: 10, "अक्टूबर": 10, nov: 11, november: 11, "नवंबर": 11, "नवम्बर": 11, dec: 12, december: 12, "दिसंबर": 12, "दिसम्बर": 12
};
const HI = "०१२३४५६७८९";
const norm = s => String(s || "").replace(/[०-९]/g, c => HI.indexOf(c)).replace(/\s+/g, " ").trim();

/** A calendar date inside a question text, or null. Handles 10 December 2024, 10 दिसंबर 2024, 10.12.2024, 2024-12-10. */
function dateIn(text) {
  const t = norm(text).toLowerCase();
  let m = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = t.match(/\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\b/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = t.match(/\b(\d{1,2})\s*(?:th|st|nd|rd)?\s*([^\d\s.,]+)\s*,?\s*(\d{4})\b/);
  if (m && MONTHS[m[2]]) return iso(+m[3], MONTHS[m[2]], +m[1]);
  return null;
}
function iso(y, mo, d) { return y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }

const RULES = [
  { key: "dated", label: "Dated event", test: q => !!dateIn(q.text) && /(घटना|घटी|क्या हुआ|हुआ\?|happen|event|what occurred)/i.test(q.text) },
  { key: "education", label: "Education", rx: /शिक्षा|education|degree|पढ़ाई|qualification|योग्यता/i },
  { key: "marriage", label: "Marriage", rx: /विवाह|शादी|marriage|marital|वैवाहिक/i },
  { key: "children", label: "Children", rx: /संतान|children|child|बच्च/i },
  { key: "work", label: "Work", rx: /काम ?धंधा|व्यवसाय|career|profession|occupation|\bwork\b|नौकरी|आजीविका|कार्यक्षेत्र|livelihood/i },
  { key: "residence", label: "Residence", rx: /रहता|रहती|निवास|residence|\blives?\b|reside|वर्तमान में कहां/i },
  { key: "siblings", label: "Siblings", rx: /भाई|बहन|sibling/i },
  { key: "parents", label: "Parents", rx: /माता|पिता|parents|mother|father/i }
];

/** Classify one question {text, options}. A question that names a date and asks what happened is dated whatever else its text says. */
function classify(q) {
  for (const r of RULES) {
    if (r.test ? r.test(q) : r.rx.test(q.text)) return { key: r.key, label: r.label, date: r.key === "dated" ? dateIn(q.text) : null };
  }
  return { key: "other", label: "Question", date: null };
}

const FAMILY = {
  poddar: { education: "education", marriage: "marriage", children: "children", work: "career", residence: "residence", siblings: "siblings", parents: "parents" },
  kp: { education: "education", marriage: "marital", children: "children", work: "work", residence: "residence", siblings: "siblings", parents: "parents" }
};

/** Characters the owner does not want in a reply. Display text only, the options themselves are never altered for the engines. */
const STYLE = /[()!;:—“”‘\/\-#*~]/g;
const display = s => String(s).replace(/\+/g, " ").replace(STYLE, " ").replace(/\s+/g, " ").trim();

module.exports = { classify, dateIn, norm, display, FAMILY, STYLE, MONTHS };
