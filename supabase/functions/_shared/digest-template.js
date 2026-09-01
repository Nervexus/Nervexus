/* One email, not five.
   =====================================================================================
   Nervexus used to send a separate email per concern: a missions/checklist digest, a
   calendar heads-up, a Performance Terminal nudge, a version announcement and a wellness
   check-in — five independent senders, each with its own subject line, all landing in the
   same inbox within minutes of each other. This module is the single place that turns
   everything outstanding into ONE message.

   Deliberately a .js file rather than .ts: Deno loads it unchanged in the edge function,
   and Node loads it unchanged in the test suite. A rendering layer nobody can run outside
   production is a rendering layer nobody checks.

   Nothing here talks to a database, a mail provider or the network. Given a list of items
   it returns { subject, text, html } and nothing else, which is what makes it testable. */

/* Sections in the order they appear in the email. Anything the Performance Terminal has to
   say comes first because it is the only category with a deadline attached to it. */
var SECTIONS = [
  { key: 'performance', label: 'Performance Terminal' },
  { key: 'tasks',       label: 'Tasks & Missions' },
  { key: 'calendar',    label: 'Calendar' },
  { key: 'logs',        label: 'Logs' },
  { key: 'update',      label: 'App Update' },
];

var RANK = { critical: 0, high: 1, normal: 2, low: 3 };

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* The subject line is the one part of an email most people ever read, so it names the most
   urgent thing outright and then counts the rest, rather than saying "you have 5 updates"
   and making them open it to find out whether any of them mattered. */
function buildSubject(name, items) {
  var who = name ? name + ' — ' : '';
  if (!items.length) return who + 'Nothing outstanding';
  var sorted = items.slice().sort(function (a, b) { return (RANK[a.priority] || 2) - (RANK[b.priority] || 2); });
  var lead = sorted[0];
  var rest = items.length - 1;
  var head = lead.subject || lead.line;
  if (!rest) return who + head;
  return who + head + ' (+' + rest + ' more)';
}

function groupBySection(items) {
  var out = [];
  for (var i = 0; i < SECTIONS.length; i++) {
    var sec = SECTIONS[i];
    var mine = items.filter(function (it) { return it.section === sec.key; });
    if (mine.length) out.push({ key: sec.key, label: sec.label, items: mine });
  }
  /* An item with an unknown section is a bug in the caller, but losing it silently would be
     a worse one — it goes in an "Other" block where it can be seen and fixed. */
  var known = {};
  SECTIONS.forEach(function (s) { known[s.key] = true; });
  var orphans = items.filter(function (it) { return !known[it.section]; });
  if (orphans.length) out.push({ key: 'other', label: 'Other', items: orphans });
  return out;
}

function buildText(name, groups, signoff) {
  var lines = [];
  lines.push(name ? 'Morning ' + name + ',' : 'Hello,');
  lines.push('');
  groups.forEach(function (g) {
    lines.push(g.label.toUpperCase());
    g.items.forEach(function (it) { lines.push('  - ' + it.line); });
    lines.push('');
  });
  var body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return body + (signoff || '');
}

/* Table-based, fully inline-styled, no external stylesheet and no web fonts. Email clients
   are not browsers: Outlook drops flexbox and grid entirely, Gmail strips <style> blocks in
   some contexts, and a linked font silently falls back to Times. Every rule here is on the
   element that needs it, and the layout survives being reduced to a single column. */
function buildHtml(name, groups, opts) {
  var o = opts || {};
  var appUrl = o.appUrl || 'https://nervexus.vercel.app';
  var ink = '#1B1B1F', muted = '#6E6E76', line = '#E2DED4', ground = '#F7F4EC', card = '#FFFFFF';
  var accent = '#8A7B4F';

  var rows = groups.map(function (g) {
    var items = g.items.map(function (it) {
      var flag = (it.priority === 'critical' || it.priority === 'high')
        ? '<span style="display:inline-block; font:600 10px/1 Consolas,Menlo,monospace; letter-spacing:.08em; text-transform:uppercase; color:#8A3B2A; border:1px solid #E0B8AC; border-radius:4px; padding:3px 6px; margin-right:8px; vertical-align:middle;">' + esc(it.priority) + '</span>'
        : '';
      return ''
        + '<tr><td style="padding:9px 0; border-bottom:1px solid ' + line + ';">'
        +   '<div style="font:400 15px/1.5 Georgia,\'Times New Roman\',serif; color:' + ink + ';">' + flag + esc(it.line) + '</div>'
        +   (it.meta ? '<div style="font:400 12px/1.5 Consolas,Menlo,monospace; color:' + muted + '; margin-top:3px;">' + esc(it.meta) + '</div>' : '')
        + '</td></tr>';
    }).join('');
    return ''
      + '<tr><td style="padding:26px 0 0 0;">'
      +   '<div style="font:600 11px/1 Consolas,Menlo,monospace; letter-spacing:.16em; text-transform:uppercase; color:' + accent + '; padding-bottom:6px;">' + esc(g.label) + '</div>'
      +   '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' + items + '</table>'
      + '</td></tr>';
  }).join('');

  return ''
+ '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:' + ground + '; margin:0; padding:0;">'
+ '<tr><td align="center" style="padding:28px 14px;">'
+   '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px; background:' + card + '; border:1px solid ' + line + '; border-radius:14px;">'
+     '<tr><td style="padding:30px 30px 0 30px;">'
+       '<div style="font:400 22px/1 Georgia,\'Times New Roman\',serif; letter-spacing:.14em; color:' + ink + ';">NERVEXUS</div>'
+       '<div style="font:400 12px/1 Consolas,Menlo,monospace; letter-spacing:.1em; color:' + muted + '; padding-top:7px;">' + esc(o.dateLabel || '') + '</div>'
+     '</td></tr>'
+     '<tr><td style="padding:22px 30px 0 30px;">'
+       '<div style="font:400 17px/1.5 Georgia,\'Times New Roman\',serif; color:' + ink + ';">' + esc(name ? 'Morning ' + name + ',' : 'Hello,') + '</div>'
+       '<div style="font:400 14px/1.6 Georgia,\'Times New Roman\',serif; color:' + muted + '; padding-top:6px;">Here is everything outstanding, in one place.</div>'
+     '</td></tr>'
+     '<tr><td style="padding:0 30px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' + rows + '</table></td></tr>'
+     '<tr><td style="padding:26px 30px 30px 30px;">'
+       '<a href="' + esc(appUrl) + '" style="display:inline-block; font:600 13px/1 Consolas,Menlo,monospace; letter-spacing:.06em; color:#FFFFFF; background:' + ink + '; border-radius:9px; padding:13px 22px; text-decoration:none;">OPEN NERVEXUS</a>'
+     '</td></tr>'
+     '<tr><td style="padding:0 30px 26px 30px; border-top:1px solid ' + line + ';">'
+       '<div style="font:400 12px/1.6 Georgia,\'Times New Roman\',serif; color:' + muted + '; padding-top:16px;">' + esc(o.signoffLine || 'Best, Ultra X management team') + '</div>'
+       '<div style="font:400 11px/1.6 Consolas,Menlo,monospace; color:' + muted + '; padding-top:8px;">Turn these off in Settings &rarr; Notifications.</div>'
+     '</td></tr>'
+   '</table>'
+ '</td></tr></table>';
}

/* The one entry point. items: [{ section, line, subject?, meta?, priority }] */
function buildDigest(input) {
  var o = input || {};
  var items = (o.items || []).filter(function (it) { return it && it.line; });
  var groups = groupBySection(items);
  return {
    count: items.length,
    subject: buildSubject(o.name, items),
    text: buildText(o.name, groups, o.signoff),
    html: buildHtml(o.name, groups, o),
  };
}

export { buildDigest, buildSubject, groupBySection, SECTIONS };
