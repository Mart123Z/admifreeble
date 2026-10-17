/* Surlignage du cours relié aux post-its.
   Un surlignage = un post-it qui porte { hl: { tab, s, e, q, c } } dans hub-notes :
   tab = onglet (synthese | fiche), s/e = position dans le texte de l'onglet,
   q = passage surligné, c = couleur. Supprimer le post-it retire le surlignage (et Annuler le remet).
   Utilise les globales du script principal : main, NOTES, CUR, renderNotes, status, esc, undo. */
(function () {
  const COLORS = [["jaune", "Jaune"], ["vert", "Vert"], ["bleu", "Bleu"], ["rose", "Rose"], ["orange", "Orange"]];
  const TABS = { synthese: { sel: "#prose", label: "Synthèse" }, fiche: { sel: ".ess-sheet", label: "Fiche" } };
  const SKIP = ".toolbar,style,script,.hl-bar";
  let bar = null, pop = null, pending = null;

  /* ---------- Texte et positions ---------- */
  function texts(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const out = []; let n; while ((n = w.nextNode())) out.push(n); return out;
  }
  const fullText = root => texts(root).map(n => n.data).join("");
  function wrap(root, s, e, note) {
    let pos = 0; const list = texts(root);
    for (const t of list) {
      const a = pos, b = pos + t.data.length; pos = b;
      if (b <= s || a >= e) continue;
      let node = t;
      const from = Math.max(s, a) - a, to = Math.min(e, b) - a;
      if (to - from <= 0) continue;
      if (from > 0) node = node.splitText(from);
      if (to - from < node.data.length) node.splitText(to - from);
      if (!node.data.trim()) continue;
      const m = document.createElement("mark");
      m.className = "hl"; m.dataset.hl = note.id; m.dataset.c = note.hl.c;
      m.title = note.t ? note.t.slice(0, 140) : "Passage surligné · clique pour la note ou la couleur";
      node.parentNode.insertBefore(m, node); m.appendChild(node);
    }
  }
  function unwrap(root) {
    root.querySelectorAll("mark.hl").forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); });
    root.normalize();
  }
  /* Retrouve le passage : position enregistrée, sinon première occurrence du texte la plus proche */
  function locate(txt, h) {
    if (txt.slice(h.s, h.e) === h.q) return [h.s, h.e];
    let best = -1, i = txt.indexOf(h.q);
    while (i !== -1) { if (best === -1 || Math.abs(i - h.s) < Math.abs(best - h.s)) best = i; i = txt.indexOf(h.q, i + 1); }
    return best === -1 ? null : [best, best + h.q.length];
  }

  /* ---------- Application sur les onglets ---------- */
  function roots() {
    const out = [];
    for (const tab in TABS) { const p = main.querySelector("#p-" + tab), r = p && p.querySelector(TABS[tab].sel); if (r) out.push([tab, r]); }
    return out;
  }
  function refresh() {
    if (!CUR) return;
    const notes = NOTES.get(CUR).filter(n => n.hl);
    roots().forEach(([tab, root]) => {
      unwrap(root);
      const txt = fullText(root);
      notes.filter(n => n.hl.tab === tab).forEach(n => { const at = locate(txt, n.hl); if (at) wrap(root, at[0], at[1], n); });
    });
    main.querySelectorAll(".pi-hl").forEach(el => {
      const n = notes.find(x => x.id === el.dataset.note), lost = n && !roots().some(([t, r]) => t === n.hl.tab && r.querySelector('mark.hl[data-hl="' + n.id + '"]'));
      const tabOpen = n && roots().some(([t]) => t === n.hl.tab);
      el.classList.toggle("lost", !!(lost && tabOpen));
    });
  }

  /* ---------- Barre de couleurs à la sélection ---------- */
  function swatches(cur, attr) {
    return COLORS.map(([k, l]) => '<button type="button" class="hl-sw" data-c="' + k + '" ' + attr + '="' + k + '" aria-label="' + l + '" title="' + l + '"' + (k === cur ? ' aria-pressed="true"' : "") + "></button>").join("");
  }
  function ensureUI() {
    if (bar) return;
    bar = document.createElement("div"); bar.className = "hl-bar"; bar.hidden = true; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Surligner le passage");
    bar.innerHTML = '<span class="hl-l">Surligner</span>' + swatches(null, "data-new");
    pop = document.createElement("div"); pop.className = "hl-bar hl-pop"; pop.hidden = true; pop.setAttribute("role", "toolbar");
    document.body.append(bar, pop);
    [bar, pop].forEach(el => el.addEventListener("mousedown", e => e.preventDefault()));
  }
  function place(el, rect) {
    el.hidden = false;
    const w = el.offsetWidth, x = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2), document.documentElement.clientWidth - w - 8);
    const below = rect.bottom + 10, y = (below + el.offsetHeight > window.innerHeight - 8) ? rect.top - el.offsetHeight - 10 : below;
    el.style.left = (x + window.scrollX) + "px"; el.style.top = (y + window.scrollY) + "px";
  }
  function hideBar() { if (bar) bar.hidden = true; pending = null; }
  function hidePop() { if (pop) pop.hidden = true; }

  function readSelection() {
    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    for (const [tab, root] of roots()) {
      if (!root.contains(r.commonAncestorContainer) || root.offsetParent === null) continue;
      const startEl = r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer;
      const endEl = r.endContainer.nodeType === 3 ? r.endContainer.parentElement : r.endContainer;
      if ((startEl && startEl.closest(SKIP)) || (endEl && endEl.closest(SKIP))) return null;
      const pre = document.createRange(); pre.selectNodeContents(root); pre.setEnd(r.startContainer, r.startOffset);
      const s0 = rangeLen(root, pre), e0 = s0 + rangeLen(root, r);
      const txt = fullText(root); let s = s0, e = e0;
      while (s < e && /\s/.test(txt[s])) s++;
      while (e > s && /\s/.test(txt[e - 1])) e--;
      if (e - s < 2 || e - s > 1500) return null;
      return { tab, s, e, q: txt.slice(s, e), rect: r.getBoundingClientRect() };
    }
    return null;
  }
  /* longueur du texte « comptable » (hors barre d'outils) contenu dans une plage */
  function rangeLen(root, rg) {
    let n = 0;
    for (const t of texts(root)) {
      if (!rg.intersectsNode(t)) continue;
      const a = t === rg.startContainer ? rg.startOffset : 0, b = t === rg.endContainer ? rg.endOffset : t.data.length;
      n += Math.max(0, b - a);
    }
    return n;
  }
  let selTimer = null;
  function onSelect() {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      if (!CUR) return hideBar();
      const s = readSelection(); if (!s) return hideBar();
      ensureUI(); hidePop(); pending = s; place(bar, s.rect);
    }, 180);
  }
  document.addEventListener("selectionchange", onSelect);

  /* ---------- Actions ---------- */
  function create(color) {
    if (!pending || !CUR) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const note = { id, t: "", ts: Date.now(), hl: { tab: pending.tab, s: pending.s, e: pending.e, q: pending.q, c: color } };
    const a = NOTES.get(CUR); a.unshift(note); NOTES.put(CUR, a);
    window.getSelection().removeAllRanges(); hideBar();
    renderNotes(CUR);
    openNote(id, true);
  }
  function setColor(id, c) {
    const a = NOTES.get(CUR), n = a.find(x => x.id === id); if (!n || !n.hl) return;
    n.hl = Object.assign({}, n.hl, { c }); NOTES.put(CUR, a); renderNotes(CUR);
  }
  function remove(id) {
    const a = NOTES.get(CUR), k = a.findIndex(x => x.id === id); if (k < 0) return;
    const gone = a.splice(k, 1)[0]; NOTES.put(CUR, a);
    undo = { id: CUR, k, n: gone }; renderNotes(CUR); status(true);
  }
  function flash(el) { el.classList.remove("hl-flash"); void el.offsetWidth; el.classList.add("hl-flash"); }
  function openNote(id, focus) {
    const el = main.querySelector('.pi[data-note="' + id + '"]'); if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" }); flash(el);
    if (focus) setTimeout(() => { const ta = el.querySelector("textarea"); ta && ta.focus({ preventScroll: true }); }, 350);
  }
  function gotoMark(id) {
    const n = NOTES.get(CUR).find(x => x.id === id); if (!n || !n.hl) return;
    const tabBtn = main.querySelector("#tab-" + n.hl.tab);
    if (tabBtn && tabBtn.getAttribute("aria-selected") !== "true") tabBtn.click();
    setTimeout(() => {
      const m = main.querySelector('mark.hl[data-hl="' + id + '"]');
      if (m) { m.scrollIntoView({ behavior: "smooth", block: "center" }); main.querySelectorAll('mark.hl[data-hl="' + id + '"]').forEach(flash); }
    }, 60);
  }
  function showPop(m) {
    ensureUI(); hideBar();
    const id = m.dataset.hl, n = NOTES.get(CUR).find(x => x.id === id); if (!n) return;
    pop.dataset.id = id;
    pop.innerHTML = swatches(n.hl.c, "data-set") + '<span class="hl-sep"></span><button type="button" class="hl-act" data-open>' + (n.t ? "Voir la note" : "Écrire une note") + '</button><button type="button" class="hl-act del" data-del>Retirer</button>';
    place(pop, m.getBoundingClientRect());
  }

  document.addEventListener("click", e => {
    const t = e.target;
    if (bar && !bar.hidden && t.closest(".hl-bar") === bar) { const b = t.closest("[data-new]"); if (b) create(b.dataset.new); return; }
    if (pop && !pop.hidden && t.closest(".hl-pop")) {
      const id = pop.dataset.id;
      if (t.closest("[data-set]")) setColor(id, t.closest("[data-set]").dataset.set);
      else if (t.closest("[data-open]")) openNote(id, true);
      else if (t.closest("[data-del]")) remove(id);
      hidePop(); return;
    }
    const m = t.closest("mark.hl");
    if (m && !(t.closest("mark.k") && t.closest(".hide-keys")) && !(window.getSelection() && !window.getSelection().isCollapsed)) { e.preventDefault(); showPop(m); return; }
    const q = t.closest(".pi-q"); if (q) { gotoMark(q.closest(".pi").dataset.note); return; }
    const sw = t.closest("[data-pic]"); if (sw) { setColor(sw.closest(".pi").dataset.note, sw.dataset.pic); return; }
    hidePop();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { hideBar(); hidePop(); } });
  window.addEventListener("hashchange", () => { hideBar(); hidePop(); });
  window.addEventListener("resize", () => { hideBar(); hidePop(); });

  /* ---------- Branchement ---------- */
  window.HL = {
    attach(p, tab) { if (TABS[tab]) refresh(); },
    refresh,
    head(n) {
      const lbl = (TABS[n.hl.tab] || {}).label || "";
      const q = n.hl.q.length > 160 ? n.hl.q.slice(0, 157) + "…" : n.hl.q;
      return '<div class="pi-top"><button type="button" class="pi-q" title="Aller au passage surligné"><small>' + lbl + " · passage surligné</small>« " + esc(q) + ' »</button>' +
        '<div class="pi-cols" role="group" aria-label="Couleur du surlignage">' + COLORS.map(([k, l]) => '<button type="button" class="hl-sw sm" data-c="' + k + '" data-pic="' + k + '" aria-label="' + l + '" title="' + l + '"' + (k === n.hl.c ? ' aria-pressed="true"' : "") + "></button>").join("") + "</div>" +
        '<p class="pi-lost">Ce passage n’a pas été retrouvé dans le cours (il a peut-être été modifié).</p></div>';
    }
  };
})();
