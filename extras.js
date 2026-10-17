/* Annonces, calendrier, tickets et centre admin.
   Les données vivent dans Firestore (collections announcements, events, tickets)
   et arrivent en temps réel : l'admin publie, tout le monde voit sans republier le site.
   Utilise les globales du script principal : main, S, esc, M, buildSide. */
(function () {
  const D = { ann: [], ev: [], tk: [], st: { ann: "loading", ev: "loading", tk: "loading" } };
  const TYPES = { exam: "Examen", rendu: "Rendu / devoir", cours: "Cours / TD", info: "Info" };
  const CATS = ["Problème technique", "Erreur dans une fiche", "Suggestion", "Autre"];
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
  const ICON = {
    annonces: '<svg viewBox="0 0 24 24"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    calendrier: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    tickets: '<svg viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5z"/><path d="M14 5v14" stroke-dasharray="2 2"/></svg>',
    admin: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>'
  };
  let view = null, LIVE = [];
  let calMonth = null, calSel = null, tkFilter = "ouvert";
  let edAnn = null, edEv = null;            // id en cours de modification (admin)

  /* ---------- Outils ---------- */
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const today = () => ymd(new Date());
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDay = (s, o) => parse(s).toLocaleDateString("fr-FR", o || { weekday: "long", day: "numeric", month: "long" });
  const fmtTs = t => t ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " à " + new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
  const txt = s => esc(s || "").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, "<br>");
  const courseName = id => { const c = M.courses.find(x => x.id === id); return c ? c.short : ""; };
  const isAdmin = () => !!(window.FB && FB.isAdmin);
  const annSorted = () => D.ann.slice().sort((a, b) => (!!b.pinned - !!a.pinned) || (b.ts || 0) - (a.ts || 0));
  const evSorted = () => D.ev.slice().sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const evOn = d => evSorted().filter(e => e.date === d);
  const upcoming = n => evSorted().filter(e => e.date >= today()).slice(0, n);
  const unseen = () => { const s = S.get("hub-ann-seen", 0) || 0; return D.ann.filter(a => (a.ts || 0) > s).length; };
  const openTk = () => D.tk.filter(t => t.status !== "traite").length;
  function errMsg(e) { return e && e.code === "permission-denied" ? "Refusé par Firebase : les règles Firestore ne sont pas à jour (voir regles-firestore.txt)." : "Erreur : " + ((e && (e.code || e.message)) || "inconnue"); }
  function stateBox(k, empty) {
    if (D.st[k] === "loading") return '<p class="x-empty">Chargement…</p>';
    if (D.st[k] === "denied") return '<p class="x-empty">Cette rubrique n’est pas encore activée.</p>';
    if (D.st[k] === "error") return '<p class="x-empty">Impossible de charger pour le moment.</p>';
    return '<p class="x-empty">' + empty + '</p>';
  }
  function live(id, deps, fn) { LIVE.push({ id, deps, fn }); return '<div id="' + id + '">' + fn() + "</div>"; }
  function refresh(k) {
    if (view === "annonces" && k === "ann") S.set("hub-ann-seen", Date.now());
    LIVE.forEach(l => { if (l.deps.includes(k)) { const el = document.getElementById(l.id); if (el) l.fn(el); } });
    updateNav();
  }
  /* fn(el) re-rend dans el ; fn() renvoie le HTML initial */
  function part(render, keep) {
    return el => {
      if (!el) return render();
      const drafts = keep ? keep(el) : null;
      el.innerHTML = render();
      if (drafts) drafts(el);
    };
  }

  /* ---------- Navigation ---------- */
  const NAV = [["annonces", "Annonces"], ["calendrier", "Calendrier"], ["tickets", "Tickets"]];
  function badge(key) {
    const n = key === "annonces" ? unseen() : key === "admin" ? openTk() : 0;
    return '<span class="xbadge" data-badge="' + key + '"' + (n ? "" : " hidden") + ">" + n + "</span>";
  }
  function navLinks(cur) {
    const items = NAV.concat(isAdmin() ? [["admin", "Centre admin"]] : []);
    return '<div class="xnav">' + items.map(([k, l]) => '<a class="homelink xlink' + (k === "admin" ? " xadmin" : "") + '" href="#' + k + '"' + (cur === k ? ' aria-current="page"' : "") + ">" + '<span class="xi">' + ICON[k] + "</span>" + l + badge(k) + "</a>").join("") + "</div>";
  }
  function updateNav() {
    document.querySelectorAll("[data-badge]").forEach(b => {
      const n = b.dataset.badge === "annonces" ? unseen() : b.dataset.badge === "admin" ? openTk() : 0;
      b.textContent = n; b.hidden = !n;
    });
  }
  function opts(cur) {
    return NAV.concat(isAdmin() ? [["admin", "Centre admin"]] : []).map(([k, l]) => '<option value="' + k + '"' + (cur === k ? " selected" : "") + ">" + l + "</option>").join("");
  }
  function page(id, title, html) {
    document.documentElement.dataset.course = "home";
    document.title = title + " · Fiches de révision";
    main.innerHTML = '<div class="xpage">' + html + "</div>";
    buildSide(id);
    window.scrollTo(0, 0);
  }

  /* ---------- Rendus communs ---------- */
  function annCard(a, full) {
    return '<article class="ann' + (a.important ? " imp" : "") + '"><header>' +
      (a.pinned ? '<span class="tag pin">Épinglé</span>' : "") + (a.important ? '<span class="tag impt">Important</span>' : "") +
      "<h3>" + esc(a.title) + '</h3><time>' + fmtTs(a.ts) + "</time></header>" +
      (a.body ? '<div class="ann-b' + (full ? "" : " clamp") + '">' + txt(a.body) + "</div>" : "") + "</article>";
  }
  function evItem(e, withDay) {
    const meta = [TYPES[e.type] || "Info", courseName(e.course), e.time].filter(Boolean).join(" · ");
    return '<li class="evi t-' + (e.type || "info") + '">' + (withDay ? '<span class="evd">' + fmtDay(e.date, { weekday: "short", day: "numeric", month: "short" }) + "</span>" : "") +
      '<div><b>' + esc(e.title) + '</b><span class="evm">' + esc(meta) + "</span>" + (e.note ? '<p>' + txt(e.note) + "</p>" : "") + "</div></li>";
  }
  function grid(y, m, compact) {
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), off = (first.getDay() + 6) % 7, t = today();
    let h = '<div class="cal' + (compact ? " compact" : "") + '"><div class="cal-g">' + JOURS.map(j => '<span class="cal-w">' + j + "</span>").join("");
    for (let i = 0; i < off; i++) h += '<span class="cal-x"></span>';
    for (let d = 1; d <= days; d++) {
      const ds = y + "-" + pad(m + 1) + "-" + pad(d), evs = evOn(ds);
      h += '<button type="button" class="cal-d' + (ds === t ? " today" : "") + (ds === calSel && !compact ? " sel" : "") + (evs.length ? " has" : "") + (ds < t ? " past" : "") + '" data-d="' + ds + '" aria-label="' + fmtDay(ds) + (evs.length ? ", " + evs.length + " évènement" + (evs.length > 1 ? "s" : "") : "") + '"><span class="n">' + d + "</span>" +
        (compact ? '<span class="dots">' + evs.slice(0, 3).map(e => '<i class="t-' + (e.type || "info") + '"></i>').join("") + "</span>"
                 : evs.slice(0, 3).map(e => '<span class="chip t-' + (e.type || "info") + '">' + esc(e.title) + "</span>").join("") + (evs.length > 3 ? '<span class="more">+' + (evs.length - 3) + "</span>" : "")) +
        "</button>";
    }
    return h + "</div></div>";
  }
  const legend = () => '<p class="cal-leg">' + Object.entries(TYPES).map(([k, l]) => '<span><i class="t-' + k + '"></i>' + l + "</span>").join("") + "</p>";

  /* ---------- Accueil : annonces récentes + mois en cours ---------- */
  function home() {
    const now = new Date();
    const annF = part(() => {
      if (D.st.ann !== "ok" || !D.ann.length) return stateBox("ann", "Aucune annonce pour l’instant.");
      return annSorted().slice(0, 3).map(a => annCard(a, false)).join("") + '<a class="xmore" href="#annonces">Toutes les annonces →</a>';
    });
    const calF = part(() => grid(now.getFullYear(), now.getMonth(), true) +
      (D.st.ev === "ok" ? (upcoming(3).length ? '<ul class="evl">' + upcoming(3).map(e => evItem(e, true)).join("") + "</ul>" : '<p class="x-empty">Aucune date à venir.</p>') : stateBox("ev", "")) +
      '<a class="xmore" href="#calendrier">Voir le calendrier →</a>');
    return '<section class="xhome"><div class="xcard"><h2>Annonces' + badge("annonces") + "</h2>" + live("xh-ann", ["ann"], annF) + "</div>" +
      '<div class="xcard"><h2>' + MOIS[now.getMonth()].replace(/^./, c => c.toUpperCase()) + " " + now.getFullYear() + "</h2>" + live("xh-cal", ["ev"], calF) + "</div></section>";
  }

  /* ---------- Pages ---------- */
  function pAnnonces() {
    S.set("hub-ann-seen", Date.now());
    const f = part(() => D.st.ann === "ok" && D.ann.length ? annSorted().map(a => annCard(a, true)).join("") : stateBox("ann", "Aucune annonce pour l’instant."));
    page("annonces", "Annonces", '<div class="eyebrow">Révisions</div><h1>Annonces</h1><p class="lede">Les infos importantes de la promo, mises à jour en direct.</p>' + live("xp-ann", ["ann"], f));
    setTimeout(() => S.set("hub-ann-seen", Date.now()), 0);
  }
  function pCalendrier() {
    if (!calMonth) { const n = new Date(); calMonth = new Date(n.getFullYear(), n.getMonth(), 1); }
    const f = part(() => {
      const y = calMonth.getFullYear(), m = calMonth.getMonth(), pre = y + "-" + pad(m + 1) + "-";
      const month = evSorted().filter(e => e.date.startsWith(pre));
      let side = "";
      if (calSel) {
        const evs = evOn(calSel);
        side = '<div class="cal-day"><h3>' + fmtDay(calSel).replace(/^./, c => c.toUpperCase()) + '</h3>' + (evs.length ? '<ul class="evl">' + evs.map(e => evItem(e, false)).join("") + "</ul>" : '<p class="x-empty">Rien de prévu ce jour-là.</p>') + "</div>";
      }
      return '<div class="cal-nav"><button type="button" class="btn" data-cal="-1" aria-label="Mois précédent">←</button><h2>' + MOIS[m] + " " + y + '</h2><button type="button" class="btn" data-cal="1" aria-label="Mois suivant">→</button><button type="button" class="btn" data-cal="0">Aujourd’hui</button></div>' +
        grid(y, m, false) + legend() + side +
        '<h3 class="xh3">Ce mois-ci</h3>' + (D.st.ev === "ok" ? (month.length ? '<ul class="evl">' + month.map(e => evItem(e, true)).join("") + "</ul>" : '<p class="x-empty">Aucune date ce mois-ci.</p>') : stateBox("ev", ""));
    });
    page("calendrier", "Calendrier", '<div class="eyebrow">Révisions</div><h1>Calendrier</h1><p class="lede">Examens, rendus et dates clés. Clique sur un jour pour voir le détail.</p>' + live("xp-cal", ["ev"], f));
  }
  function pTickets() {
    const f = part(() => {
      if (D.st.tk !== "ok" || !D.tk.length) return stateBox("tk", "Tu n’as encore envoyé aucun ticket.");
      return D.tk.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).map(t => tkCard(t, false)).join("");
    });
    page("tickets", "Tickets", '<div class="eyebrow">Révisions</div><h1>Tickets</h1><p class="lede">Un bug, une erreur dans une fiche, une idée ? Écris-nous : la réponse s’affichera ici.</p>' +
      '<form class="xform" id="tk-form"><div class="row"><label>Catégorie<select name="cat">' + CATS.map(c => "<option>" + c + "</option>").join("") + '</select></label>' +
      '<label class="grow">Sujet<input name="subject" maxlength="120" required placeholder="En quelques mots"></label></div>' +
      '<label>Message<textarea name="body" rows="5" maxlength="4000" required placeholder="Décris le problème ou ton idée. Si c’est une erreur, indique le chapitre et l’onglet."></textarea></label>' +
      '<div class="fbar"><button class="btn pri" type="submit">Envoyer le ticket</button><span class="fmsg" role="status"></span></div></form>' +
      '<h2 class="xh2">Mes tickets</h2>' + live("xp-tk", ["tk"], f));
    const form = document.getElementById("tk-form");
    form.onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(form), subject = fd.get("subject").trim(), body = fd.get("body").trim(), msg = form.querySelector(".fmsg");
      if (!subject || !body) { msg.textContent = "Remplis le sujet et le message."; return; }
      const b = form.querySelector("button"); b.disabled = true; msg.textContent = "Envoi…";
      try {
        await FB.fs.addDoc(FB.fs.collection(FB.db, "tickets"), { uid: FB.uid, name: FB.name, cat: fd.get("cat"), subject, body, status: "ouvert", reply: "", ts: Date.now() });
        form.reset(); msg.textContent = "Ticket envoyé. Merci !";
      } catch (err) { msg.textContent = errMsg(err); } finally { b.disabled = false; }
    };
  }
  function tkCard(t, admin) {
    const done = t.status === "traite";
    return '<article class="tk' + (done ? " done" : "") + '" data-tk="' + t.id + '"><header><span class="tag ' + (done ? "ok" : "open") + '">' + (done ? "Traité" : "Ouvert") + '</span><span class="tag">' + esc(t.cat || "Autre") + "</span>" +
      "<h3>" + esc(t.subject) + "</h3><time>" + (admin ? "<b>@" + esc(t.name || "?") + "</b> · " : "") + fmtTs(t.ts) + "</time></header>" +
      '<div class="tk-b">' + txt(t.body) + "</div>" +
      (t.reply ? '<div class="tk-r"><b>Réponse' + (t.replyTs ? " · " + fmtTs(t.replyTs) : "") + "</b>" + txt(t.reply) + "</div>" : "") +
      (admin ? '<div class="tk-a"><textarea rows="2" placeholder="Ta réponse (visible par l’utilisateur)">' + esc(t.reply || "") + '</textarea><div class="fbar">' +
        '<button type="button" class="btn pri" data-act="tk-reply">' + (done ? "Mettre à jour la réponse" : "Répondre et marquer traité") + "</button>" +
        '<button type="button" class="btn" data-act="tk-toggle">' + (done ? "Rouvrir" : "Marquer traité sans répondre") + '</button><button type="button" class="btn ghost" data-act="tk-del">Supprimer</button><span class="fmsg" role="status"></span></div></div>' : "") +
      "</article>";
  }

  /* ---------- Centre admin ---------- */
  function pAdmin() {
    if (!isAdmin()) { location.hash = "accueil"; return; }
    const annList = part(() => D.st.ann === "ok" && D.ann.length ? annSorted().map(a =>
      '<div class="arow" data-ann="' + a.id + '"><div><b>' + esc(a.title) + "</b>" + (a.pinned ? ' <span class="tag pin">Épinglé</span>' : "") + (a.important ? ' <span class="tag impt">Important</span>' : "") + '<small>' + fmtTs(a.ts) + "</small></div>" +
      '<div class="aact"><button type="button" class="btn" data-act="ann-edit">Modifier</button><button type="button" class="btn" data-act="ann-pin">' + (a.pinned ? "Désépingler" : "Épingler") + '</button><button type="button" class="btn ghost" data-act="ann-del">Supprimer</button></div></div>').join("") : stateBox("ann", "Aucune annonce publiée."));
    const evList = part(() => {
      if (D.st.ev !== "ok" || !D.ev.length) return stateBox("ev", "Aucune date dans le calendrier.");
      const t = today(), fut = evSorted().filter(e => e.date >= t), past = evSorted().filter(e => e.date < t).reverse();
      const row = e => '<div class="arow" data-ev="' + e.id + '"><div><b>' + esc(e.title) + "</b><small>" + fmtDay(e.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + (e.time ? " · " + e.time : "") + " · " + (TYPES[e.type] || "Info") + (e.course ? " · " + courseName(e.course) : "") + '</small></div><div class="aact"><button type="button" class="btn" data-act="ev-edit">Modifier</button><button type="button" class="btn ghost" data-act="ev-del">Supprimer</button></div></div>';
      return (fut.length ? fut.map(row).join("") : '<p class="x-empty">Aucune date à venir.</p>') + (past.length ? '<details class="apast"><summary>Dates passées (' + past.length + ")</summary>" + past.map(row).join("") + "</details>" : "");
    });
    const keepDrafts = el => { const m = {}; el.querySelectorAll("[data-tk]").forEach(a => { const ta = a.querySelector("textarea"); if (ta && document.activeElement === ta || (ta && ta.dataset.dirty)) m[a.dataset.tk] = { v: ta.value, f: document.activeElement === ta }; }); return el2 => { for (const id in m) { const ta = el2.querySelector('[data-tk="' + id + '"] textarea'); if (ta) { ta.value = m[id].v; ta.dataset.dirty = 1; if (m[id].f) ta.focus(); } } }; };
    const tkList = part(() => {
      const n = { ouvert: openTk(), traite: D.tk.length - openTk(), tous: D.tk.length };
      const tabs = '<div class="seg" role="group" aria-label="Filtre">' + [["ouvert", "Ouverts"], ["traite", "Traités"], ["tous", "Tous"]].map(([k, l]) => '<button type="button" data-tkf="' + k + '" aria-pressed="' + (tkFilter === k) + '">' + l + " (" + n[k] + ")</button>").join("") + "</div>";
      if (D.st.tk !== "ok") return stateBox("tk", "");
      const list = D.tk.filter(t => tkFilter === "tous" || (tkFilter === "traite") === (t.status === "traite")).sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return tabs + (list.length ? list.map(t => tkCard(t, true)).join("") : '<p class="x-empty">Aucun ticket ici.</p>');
    }, keepDrafts);
    page("admin", "Centre admin", '<div class="eyebrow">Centre admin · @' + esc(FB.name) + '</div><h1>Centre de contrôle</h1><p class="lede">Ce que tu publies ici apparaît en direct chez tous les utilisateurs, sans republier le site.</p>' +
      '<div class="adm-grid"><section class="xcard"><h2>Annonces</h2>' +
      '<form class="xform" id="ann-form"><label>Titre<input name="title" maxlength="140" required></label><label>Message<textarea name="body" rows="4" maxlength="5000"></textarea></label>' +
      '<div class="row checks"><label class="ck"><input type="checkbox" name="pinned"> Épingler en haut</label><label class="ck"><input type="checkbox" name="important"> Important (encadré rouge)</label></div>' +
      '<div class="fbar"><button class="btn pri" type="submit">Publier l’annonce</button><button class="btn" type="button" data-act="ann-cancel" hidden>Annuler la modification</button><span class="fmsg" role="status"></span></div></form>' +
      live("xa-ann", ["ann"], annList) + "</section>" +
      '<section class="xcard"><h2>Calendrier</h2>' +
      '<form class="xform" id="ev-form"><div class="row"><label>Date<input type="date" name="date" required></label><label><span>Heure <small>(facultatif)</small></span><input type="time" name="time"></label></div>' +
      '<label>Titre<input name="title" maxlength="140" required placeholder="Ex. Partiel de droit"></label>' +
      '<div class="row"><label>Type<select name="type">' + Object.entries(TYPES).map(([k, l]) => '<option value="' + k + '">' + l + "</option>").join("") + '</select></label>' +
      '<label>Matière<select name="course"><option value="">Toutes</option>' + M.courses.map(c => '<option value="' + c.id + '">' + esc(c.short) + "</option>").join("") + "</select></label></div>" +
      '<label><span>Détail <small>(facultatif)</small></span><textarea name="note" rows="2" maxlength="1000" placeholder="Salle, chapitres concernés, consignes…"></textarea></label>' +
      '<div class="fbar"><button class="btn pri" type="submit">Ajouter la date</button><button class="btn" type="button" data-act="ev-cancel" hidden>Annuler la modification</button><span class="fmsg" role="status"></span></div></form>' +
      live("xa-ev", ["ev"], evList) + "</section></div>" +
      '<section class="xcard"><h2>Tickets' + badge("admin") + "</h2>" + live("xa-tk", ["tk"], tkList) + "</section>");
    edAnn = edEv = null;
    const fa = document.getElementById("ann-form"), fe = document.getElementById("ev-form");
    fa.onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(fa), msg = fa.querySelector(".fmsg"), title = fd.get("title").trim();
      if (!title) { msg.textContent = "Le titre est obligatoire."; return; }
      const data = { title, body: fd.get("body").trim(), pinned: !!fd.get("pinned"), important: !!fd.get("important") };
      try {
        if (edAnn) await FB.fs.updateDoc(FB.fs.doc(FB.db, "announcements", edAnn), data);
        else await FB.fs.addDoc(FB.fs.collection(FB.db, "announcements"), Object.assign(data, { ts: Date.now(), author: FB.name }));
        msg.textContent = edAnn ? "Annonce modifiée." : "Annonce publiée."; resetForm(fa, "ann");
      } catch (err) { msg.textContent = errMsg(err); }
    };
    fe.onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(fe), msg = fe.querySelector(".fmsg"), title = fd.get("title").trim(), date = fd.get("date");
      if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { msg.textContent = "La date et le titre sont obligatoires."; return; }
      const data = { date, time: fd.get("time") || "", title, type: fd.get("type"), course: fd.get("course"), note: fd.get("note").trim() };
      try {
        if (edEv) await FB.fs.updateDoc(FB.fs.doc(FB.db, "events", edEv), data);
        else await FB.fs.addDoc(FB.fs.collection(FB.db, "events"), Object.assign(data, { ts: Date.now() }));
        msg.textContent = edEv ? "Date modifiée." : "Date ajoutée."; resetForm(fe, "ev");
      } catch (err) { msg.textContent = errMsg(err); }
    };
  }
  function resetForm(f, kind) {
    const keep = f.querySelector(".fmsg").textContent; f.reset(); f.querySelector(".fmsg").textContent = keep;
    if (kind === "ann") edAnn = null; else edEv = null;
    f.querySelector('[data-act$="-cancel"]').hidden = true;
    f.querySelector('button[type="submit"]').textContent = kind === "ann" ? "Publier l’annonce" : "Ajouter la date";
  }

  /* ---------- Actions (délégation) ---------- */
  document.addEventListener("click", async e => {
    const cd = e.target.closest(".cal-d");
    if (cd) {
      calSel = cd.dataset.d; const d = parse(calSel); calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      if (view !== "calendrier") location.hash = "calendrier"; else refresh("ev");
      return;
    }
    const nav = e.target.closest("[data-cal]");
    if (nav) {
      const k = +nav.dataset.cal, n = new Date();
      calMonth = k ? new Date(calMonth.getFullYear(), calMonth.getMonth() + k, 1) : new Date(n.getFullYear(), n.getMonth(), 1);
      if (!k) calSel = today();
      refresh("ev"); return;
    }
    const tf = e.target.closest("[data-tkf]");
    if (tf) { tkFilter = tf.dataset.tkf; refresh("tk"); return; }
    const b = e.target.closest("[data-act]"); if (!b || !isAdmin()) return;
    const act = b.dataset.act, F = FB.fs, row = b.closest("[data-ann],[data-ev],[data-tk]");
    const setMsg = t => { const m = (row || b.closest("form") || document).querySelector(".fmsg"); if (m) m.textContent = t; };
    const confirm2 = () => { if (b.dataset.sure) return true; b.dataset.sure = 1; const old = b.textContent; b.textContent = "Confirmer ?"; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = old; } }, 3000); return false; };
    try {
      if (act === "ann-edit" || act === "ev-edit") {
        const isA = act === "ann-edit", id = row.dataset[isA ? "ann" : "ev"], it = (isA ? D.ann : D.ev).find(x => x.id === id), f = document.getElementById(isA ? "ann-form" : "ev-form");
        if (!it) return;
        if (isA) { edAnn = id; f.title.value = it.title || ""; f.body.value = it.body || ""; f.pinned.checked = !!it.pinned; f.important.checked = !!it.important; }
        else { edEv = id; ["date", "time", "title", "type", "course", "note"].forEach(k => f[k].value = it[k] || (k === "type" ? "info" : "")); }
        f.querySelector('button[type="submit"]').textContent = "Enregistrer la modification";
        f.querySelector('[data-act$="-cancel"]').hidden = false; f.querySelector(".fmsg").textContent = "";
        f.scrollIntoView({ behavior: "smooth", block: "center" }); f.querySelector('[name="' + (isA ? "title" : "date") + '"]').focus();
      } else if (act === "ann-cancel" || act === "ev-cancel") {
        const f = b.closest("form"); f.querySelector(".fmsg").textContent = ""; resetForm(f, act === "ann-cancel" ? "ann" : "ev");
      } else if (act === "ann-pin") {
        const a = D.ann.find(x => x.id === row.dataset.ann); await F.updateDoc(F.doc(FB.db, "announcements", a.id), { pinned: !a.pinned });
      } else if (act === "ann-del") {
        if (confirm2()) await F.deleteDoc(F.doc(FB.db, "announcements", row.dataset.ann));
      } else if (act === "ev-del") {
        if (confirm2()) await F.deleteDoc(F.doc(FB.db, "events", row.dataset.ev));
      } else if (act === "tk-reply") {
        const reply = row.querySelector("textarea").value.trim();
        if (!reply) { setMsg("Écris une réponse d’abord."); return; }
        await F.updateDoc(F.doc(FB.db, "tickets", row.dataset.tk), { reply, replyTs: Date.now(), status: "traite" });
      } else if (act === "tk-toggle") {
        const t = D.tk.find(x => x.id === row.dataset.tk); await F.updateDoc(F.doc(FB.db, "tickets", t.id), { status: t.status === "traite" ? "ouvert" : "traite" });
      } else if (act === "tk-del") {
        if (confirm2()) await F.deleteDoc(F.doc(FB.db, "tickets", row.dataset.tk));
      }
    } catch (err) { setMsg(errMsg(err)); }
  });
  document.addEventListener("input", e => { if (e.target.matches(".tk-a textarea")) e.target.dataset.dirty = 1; });

  /* ---------- Branchement ---------- */
  window.EXTRA = {
    routes: { annonces: pAnnonces, calendrier: pCalendrier, tickets: pTickets, admin: pAdmin },
    reset(h) { view = h && h !== "accueil" ? h : "home"; LIVE = []; },
    nav: navLinks, opts, home
  };
  /* ---------- Utilisateurs en ligne ----------
     Chaque compte connecté écrit presence/{uid} = { ts: heure du serveur } toutes les 90 s
     tant que la page est visible ; le compteur interroge le nombre de comptes actifs
     depuis 3 min (requête de comptage : une seule lecture facturée). */
  const BEAT = 90000, WINDOW = 180000, POLL = 60000;
  let offset = 0, beatT = null, pollT = null, presRef = null, presOn = false;
  function showOnline(n) {
    document.querySelectorAll(".acct-online").forEach(el => {
      if (n == null) { el.hidden = true; return; }
      el.hidden = false; el.querySelector(".acct-on-n").textContent = n + (n > 1 ? " personnes en ligne" : " personne en ligne");
    });
  }
  async function beat(first) {
    const F = FB.fs;
    await F.setDoc(presRef, { ts: F.serverTimestamp() });
    if (first) { const snap = await F.getDoc(presRef); const ts = snap.exists() && snap.data().ts; if (ts && ts.toMillis) offset = ts.toMillis() - Date.now(); }
  }
  async function count() {
    const F = FB.fs;
    const cutoff = F.Timestamp.fromMillis(Date.now() + offset - WINDOW);
    const snap = await F.getCountFromServer(F.query(F.collection(FB.db, "presence"), F.where("ts", ">", cutoff)));
    showOnline(Math.max(1, snap.data().count));
  }
  async function presenceStart() {
    if (presOn || document.visibilityState === "hidden") return;
    presOn = true;
    try { await beat(true); await count(); }
    catch (e) { presOn = false; showOnline(null); return; }     /* règles pas encore publiées : on masque l'indicateur */
    beatT = setInterval(() => beat(false).catch(() => {}), BEAT);
    pollT = setInterval(() => count().catch(() => {}), POLL);
  }
  function presenceStop() { presOn = false; clearInterval(beatT); clearInterval(pollT); }
  window.__presenceOff = async () => { presenceStop(); if (presRef) await FB.fs.deleteDoc(presRef); };
  document.addEventListener("visibilitychange", () => {
    if (!window.FB || !presRef) return;
    if (document.visibilityState === "visible") presenceStart(); else presenceStop();
  });

  window.__extrasStart = function () {
    const { db, fs, uid } = FB;
    const sub = (k, q) => fs.onSnapshot(q,
      snap => { D[k] = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); D.st[k] = "ok"; refresh(k); },
      err => { D.st[k] = err && err.code === "permission-denied" ? "denied" : "error"; refresh(k); });
    presRef = fs.doc(db, "presence", uid); presenceStart();
    sub("ann", fs.collection(db, "announcements"));
    sub("ev", fs.collection(db, "events"));
    sub("tk", FB.isAdmin ? fs.collection(db, "tickets") : fs.query(fs.collection(db, "tickets"), fs.where("uid", "==", uid)));
    if (FB.isAdmin) document.querySelectorAll(".acct-name").forEach(el => { if (!el.nextElementSibling || !el.nextElementSibling.classList.contains("adm-badge")) el.insertAdjacentHTML("afterend", '<span class="adm-badge" title="Compte administrateur">Admin</span>'); });
  };
})();
