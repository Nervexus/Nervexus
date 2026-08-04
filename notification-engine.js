/* ============================================================================
   notification-engine.js — the ONLY Notification & Reminder System.

   Every feature in the app must route every notification through this module's
   single entry point, NotificationManager.notify(event, host). No feature is
   allowed to create or schedule a notification any other way — index.html's
   addNotif()/_fireOSNotif()/showToast() are still here, but only as low-level
   primitives this module's Delivery Engine calls through the host bridge; UI
   code no longer calls them directly (see index.html's _notifHost()).

   Pipeline (mirrors the required architecture):

     Application Event -> Rules Engine -> Priority Engine -> Reminder Engine
       -> Notification Manager -> Delivery Engine -> Analytics & History

   Independent module, host-bridge pattern — same shape as
   voice-assistant-engine.js. It never touches app state directly; every
   mutation/read goes through the `host` object index.html builds.

   Host contract:
     prefs()                    -> object (state.prefs)
     isFocusMode()               -> boolean
     inApp.toast(event, prio)    push an in-app banner
     inApp.upsertList(event, prio, dedupeKey) -> id   add/merge a Notification Centre entry
     inApp.playSound(prio)       play the notification sound if enabled
     inApp.setBadge(count)       update the app badge count
     push.send(event, prio)      -> Promise   deliver to every registered device (APNs/FCM via Web Push)
     email.send(event, prio)     -> Promise   deliver via the email channel, if enabled
     history.insert(record)      -> Promise<id>   Analytics & History (Supabase `notifications` row)
     history.updateStatus(id, patch) -> Promise
     checklists.listDue()        -> [{id,title,category,priority,openCount,totalCount,lastReminderText,lastRemindedAt}]
     checklists.openChecklist(id)
     checklists.markComplete(id)
     checklists.snooze(id, minutes)
     vibrate(pattern)
   ============================================================================ */
(function (root) {
  'use strict';

  // ---- Categories (every category must be configurable) --------------------
  // Unknown/future categories fall back to DEFAULT_CATEGORY below, so adding a
  // new category anywhere in the app never requires a code change here.
  var CATEGORIES = {
    mission:      { label: 'Mission',      defaultPriority: 'normal',   channels: ['inapp', 'push'] },
    finance:      { label: 'Finance',      defaultPriority: 'normal',   channels: ['inapp', 'push'] },
    fitness:      { label: 'Fitness',      defaultPriority: 'normal',   channels: ['inapp', 'push'] },
    health:       { label: 'Health',       defaultPriority: 'normal',   channels: ['inapp', 'push'] },
    checklist:    { label: 'Checklist',    defaultPriority: 'normal',   channels: ['inapp', 'push'] },
    calendar:     { label: 'Calendar',     defaultPriority: 'high',     channels: ['inapp', 'push', 'email'] },
    weather:      { label: 'Weather',      defaultPriority: 'low',      channels: ['inapp', 'push'] },
    travel:       { label: 'Travel',       defaultPriority: 'high',     channels: ['inapp', 'push'] },
    news:         { label: 'News',         defaultPriority: 'low',      channels: ['inapp'] },
    ai_assistant: { label: 'AI Assistant', defaultPriority: 'normal',   channels: ['inapp', 'push'] },
    security:     { label: 'Security',     defaultPriority: 'critical', channels: ['inapp', 'push', 'email'] },
    system:       { label: 'System',       defaultPriority: 'normal',   channels: ['inapp'] }
  };
  var DEFAULT_CATEGORY = { label: 'General', defaultPriority: 'normal', channels: ['inapp', 'push'] };
  function categoryOf(type) { return CATEGORIES[type] || DEFAULT_CATEGORY; }

  var PRIORITIES = ['critical', 'high', 'normal', 'low', 'silent'];
  var PRIORITY_RANK = { critical: 4, high: 3, normal: 2, low: 1, silent: 0 };

  // Keep in sync with reminder-tick/index.ts's FREQUENCY_MINUTES — this is the
  // client-side mirror used while the app is open, so in-app cadence matches
  // the server's out-of-app cadence exactly.
  var FREQUENCY_MINUTES = { '15min': 15, '30min': 30, hourly: 60, '2hour': 120, '4hour': 240, daily: 1440 };
  var MIN_COOLDOWN_MS = 60 * 1000; // hard anti-spam floor regardless of frequency: never twice in the same minute

  /* ---- small helpers -------------------------------------------------- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function now() { return Date.now(); }

  function defaultDedupeKey(event) {
    if (event.dedupeKey) return event.dedupeKey;
    if (event.source && event.source.type && event.source.id) return event.source.type + ':' + event.source.id;
    return event.type + '::' + (event.title || '');
  }

  function defaultActionsFor(event) {
    if (event.actions) return event.actions;
    if (event.source && event.source.type === 'checklist') {
      return [
        { action: 'open', title: 'Open Checklist' },
        { action: 'complete', title: 'Mark Complete' },
        { action: 'snooze15', title: 'Snooze 15 Minutes' },
        { action: 'snooze60', title: 'Snooze 1 Hour' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    }
    return [{ action: 'dismiss', title: 'Dismiss' }];
  }

  /* ---- module state (per session — history persistence is the source of
     truth across sessions; this is just what's needed to keep a single
     running session spam-free) ------------------------------------------- */
  var lastSentAt = {};   // dedupeKey -> timestamp, for cooldown
  var lastSentText = {}; // dedupeKey -> body text, for "never repeat identical text"
  var listEntries = {};  // dedupeKey -> in-app list id, for "merge similar reminders"
  var snoozeTimers = {}; // checklistId -> setTimeout handle, for client-side snooze re-fire while app stays open

  /* ===================== 1. Rules Engine =============================== */
  // Decides whether this event may be delivered at all right now — category
  // toggle, focus mode, quiet hours, weekend behaviour, and the anti-spam
  // dedupe/cooldown/merge checks.
  function applyRules(event, host) {
    var prefs = host.prefs() || {};
    if (prefs.notifsEnabled === false) return { allow: false, reason: 'notifications disabled' }; // existing app-wide master toggle
    if (host.isFocusMode && host.isFocusMode()) return { allow: false, reason: 'focus mode' };

    var cat = categoryOf(event.type);
    var cats = prefs.notifCategories || {};
    if (cats[event.type] === false) return { allow: false, reason: 'category disabled: ' + event.type };

    var dedupeKey = defaultDedupeKey(event);
    var priority = resolvePriority(event, cat, prefs);
    var bypassesQuiet = priority === 'critical' && prefs.notifCriticalBypassSilent !== false;

    if (!bypassesQuiet && inQuietHours(prefs)) return { allow: false, reason: 'quiet hours', dedupeKey: dedupeKey, priority: priority, merge: true };
    if (!bypassesQuiet && weekendSkipped(prefs)) return { allow: false, reason: 'weekend behaviour', dedupeKey: dedupeKey, priority: priority, merge: true };

    var t = now();
    var last = lastSentAt[dedupeKey];
    if (last != null) {
      var cooldownMs = Math.max(MIN_COOLDOWN_MS, (FREQUENCY_MINUTES[prefs.notifFrequency || 'hourly'] || 60) * 60000 * (event.respectFrequency ? 1 : 0.02));
      // Reminder-type events (checklist/mission ticks) respect the full configured
      // frequency as their cooldown; one-off feature events only need the hard floor
      // (2% of the frequency window, i.e. effectively MIN_COOLDOWN_MS) so a burst of
      // unrelated app activity can't spam the same dedupe key twice in one tick.
      if (!bypassesQuiet && t - last < cooldownMs) return { allow: false, reason: 'cooldown', dedupeKey: dedupeKey, priority: priority, merge: true };
    }

    return { allow: true, dedupeKey: dedupeKey, priority: priority };
  }

  function inQuietHours(prefs) {
    var qh = prefs.notifQuietHours;
    if (!qh || !qh.enabled || qh.start == null || qh.end == null) return false;
    var hour = new Date().getHours();
    var start = +qh.start, end = +qh.end;
    if (start === end) return false;
    return start < end ? (hour >= start && hour < end) : (hour >= start || hour < end);
  }
  function weekendSkipped(prefs) {
    if (prefs.notifWeekendBehavior !== 'skip') return false;
    var d = new Date().getDay();
    return d === 0 || d === 6;
  }

  /* ===================== 2. Priority Engine ============================= */
  function resolvePriority(event, cat, prefs) {
    var p = event.priority;
    if (p && PRIORITIES.indexOf(p) === -1) p = null;
    if (!p) {
      var overrides = prefs.notifCategoryPriority || {};
      p = overrides[event.type] || cat.defaultPriority || 'normal';
    }
    return p;
  }

  /* ===================== 3. Reminder Engine ============================= */
  // (a) Pipeline stage: nothing to gate here beyond what Rules already did —
  //     reminders and one-off events share the same anti-spam path. Kept as
  //     its own named stage to match the required architecture and as the
  //     place snooze-aware suppression would extend if a reminder needs
  //     mid-flight cancellation (handled today via snoozed_until server-side
  //     and snoozeTimers client-side instead, see action() below).
  // (b) Autonomous producer: tick() scans checklists on an interval and turns
  //     "still has open items" into Application Events fed back into notify().
  var ReminderEngine = {
    _timer: null,
    _lastTickHour: null,

    start: function (host) {
      if (this._timer) return;
      var self = this;
      // Checks once a minute (cheap) but only actually scans checklists when a
      // user's configured frequency interval has elapsed — matches the spec's
      // "check every hour of every day" default while still supporting finer
      // opt-in frequencies without a finer setInterval.
      this._timer = setInterval(function () { self._maybeTick(host); }, 60000);
      this._maybeTick(host); // also check once immediately on start, e.g. app just opened
    },
    stop: function () { if (this._timer) { clearInterval(this._timer); this._timer = null; } },

    _maybeTick: function (host) {
      var prefs = host.prefs() || {};
      var freqMin = FREQUENCY_MINUTES[prefs.notifFrequency || 'hourly'] || 60;
      var t = now();
      if (this._lastTickAt && t - this._lastTickAt < freqMin * 60000 - 30000) return; // 30s tolerance
      this._lastTickAt = t;
      this.tick(host);
    },

    // Does the user have incomplete checklist items? YES -> send reminder. NO -> do nothing.
    // Never sends for a completed (or empty) list; immediately stops once completed because
    // listDue() simply won't return it anymore (checklists.markComplete clears/completes items).
    tick: function (host) {
      var due;
      try { due = host.checklists.listDue() || []; } catch (e) { due = []; }
      due.forEach(function (c) {
        if (!c.openCount) return; // nothing open -> nothing to say
        var text = pickChecklistText(c);
        NotificationManager.notify({
          type: c.category || 'checklist',
          title: c.title,
          body: text,
          priority: c.priority,
          source: { type: 'checklist', id: c.id },
          dedupeKey: 'checklist:' + c.id,
          respectFrequency: true
        }, host);
      });
    }
  };

  // Natural-language, non-repeating checklist reminder copy — same "never say
  // the exact same thing twice" goal as notif-engine.js's `seen`-tracked
  // generator, scoped to one checklist's last line (passed in via listDue()).
  function pickChecklistText(c) {
    var open = c.openCount, total = c.totalCount || open;
    var pct = total > 0 ? open / total : 1;
    var pool = [];
    if (open === 1) {
      pool.push('Only one task left on ' + c.title + ' today.', 'One item stands between you and a finished ' + c.title + '.', 'Last one — finish ' + c.title + '.');
    } else {
      pool.push(
        'You still have ' + open + ' items remaining.',
        'Your ' + c.title + ' checklist still needs attention.',
        open + ' items open on ' + c.title + '. A few minutes closes it out.'
      );
    }
    if (pct <= 0.34 && open > 1) pool.push('You’re close to finishing today’s checklist.');
    if (pct >= 0.8) pool.push(c.title + ' is barely started — ' + open + ' items waiting.');
    var last = c.lastReminderText;
    var fresh = pool.filter(function (t) { return t !== last; });
    return pick(fresh.length ? fresh : pool);
  }

  /* ===================== 5. Delivery Engine ============================== */
  function deliver(event, priority, host) {
    var cat = categoryOf(event.type);
    var prefs = host.prefs() || {};
    var channels = (event.channels || cat.channels || ['inapp']).slice();
    var used = [];

    if (channels.indexOf('inapp') !== -1) {
      host.inApp.toast(event, priority);
      if (priority !== 'silent') { try { host.inApp.playSound(priority); } catch (e) {} if (host.vibrate && prefs.notifVibration !== false) try { host.vibrate(priority === 'critical' ? [200, 100, 200] : [120]); } catch (e) {} }
      used.push('inapp');
    }

    var outOfApp = channels.filter(function (c) { return c === 'push' || c === 'email'; });
    var promises = [];
    if (outOfApp.indexOf('push') !== -1 && prefs.pushEnabled) {
      promises.push(Promise.resolve(host.push.send(event, priority)).then(function () { used.push('push'); }).catch(function () {}));
    }
    if (outOfApp.indexOf('email') !== -1 && prefs.reminderEmailEnabled && prefs.reminderEmailAddr) {
      promises.push(Promise.resolve(host.email.send(event, priority)).then(function () { used.push('email'); }).catch(function () {}));
    }
    return Promise.all(promises).then(function () { return used; });
  }

  /* ===================== 6. Analytics & History =========================== */
  function recordHistory(event, priority, dedupeKey, channelsUsed, host) {
    var record = {
      title: event.title || '', body: event.body || '', cat: event.type || 'system',
      priority: priority, status: 'sent', channels: channelsUsed,
      sourceType: event.source && event.source.type, sourceId: event.source && event.source.id,
      dedupeKey: dedupeKey, actions: defaultActionsFor(event)
    };
    var p = Promise.resolve(host.history.insert(record));
    return p;
  }

  /* ===================== Notification Manager (entry point) =============== */
  var NotificationManager = {
    CATEGORIES: CATEGORIES,
    PRIORITIES: PRIORITIES,
    FREQUENCY_MINUTES: FREQUENCY_MINUTES,
    ReminderEngine: ReminderEngine,

    // THE single entry point every feature must call. Returns a Promise resolving
    // to {allow, dedupeKey, priority, id} — id is the in-app list entry id (for
    // callers, e.g. tests, that want to reference it immediately).
    notify: function (event, host) {
      event = event || {};
      var rules = applyRules(event, host);
      if (!rules.allow) {
        // "Merge similar reminders": even when suppressed, keep the visible list
        // entry fresh (bump timestamp/text) instead of adding a duplicate.
        if (rules.merge && rules.dedupeKey && listEntries[rules.dedupeKey] != null) {
          try { host.inApp.upsertList(event, rules.priority, rules.dedupeKey); } catch (e) {}
        }
        return Promise.resolve({ allow: false, reason: rules.reason });
      }

      var dedupeKey = rules.dedupeKey, priority = rules.priority;
      lastSentAt[dedupeKey] = now();
      lastSentText[dedupeKey] = event.body;

      var id = null;
      try { id = host.inApp.upsertList(event, priority, dedupeKey); listEntries[dedupeKey] = id; } catch (e) {}

      return deliver(event, priority, host).then(function (channelsUsed) {
        return Promise.resolve(recordHistory(event, priority, dedupeKey, channelsUsed, host)).then(function () {
          return { allow: true, dedupeKey: dedupeKey, priority: priority, id: id };
        });
      });
    },

    // Reminder actions (Open Checklist / Mark Complete / Snooze 15m / Snooze 1h / Dismiss),
    // shared by the in-app Notification Centre and the OS push action buttons (relayed
    // through the service worker -> host bridge -> here).
    action: function (actionName, notif, host) {
      var patch = { actionTaken: actionName };
      switch (actionName) {
        case 'open':
          if (notif.sourceType === 'checklist' && notif.sourceId) host.checklists.openChecklist(notif.sourceId);
          patch.status = 'opened'; patch.openedAt = new Date().toISOString();
          break;
        case 'complete':
          if (notif.sourceType === 'checklist' && notif.sourceId) host.checklists.markComplete(notif.sourceId);
          patch.status = 'completed'; patch.completedAt = new Date().toISOString();
          break;
        case 'snooze15': case 'snooze60': {
          var mins = actionName === 'snooze15' ? 15 : 60;
          if (notif.sourceType === 'checklist' && notif.sourceId) {
            host.checklists.snooze(notif.sourceId, mins);
            clearTimeout(snoozeTimers[notif.sourceId]);
            snoozeTimers[notif.sourceId] = setTimeout(function () { ReminderEngine.tick(host); }, mins * 60000 + 2000);
          }
          patch.status = 'snoozed'; patch.snoozedUntil = new Date(now() + mins * 60000).toISOString();
          break;
        }
        case 'dismiss':
        default:
          patch.status = 'dismissed'; patch.dismissedAt = new Date().toISOString();
          break;
      }
      if (notif.id) try { host.history.updateStatus(notif.id, patch); } catch (e) {}
      return patch;
    },

    markOpened: function (notif, host) { return this.action('open', notif, host); },
    markDismissed: function (notif, host) { return this.action('dismiss', notif, host); }
  };

  root.NotificationManager = NotificationManager;
  if (typeof module !== 'undefined' && module.exports) module.exports = NotificationManager;
})(typeof window !== 'undefined' ? window : this);
