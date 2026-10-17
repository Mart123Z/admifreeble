/* Surlignage du cours relié aux post-its.
   Un surlignage = un post-it qui porte { hl: { tab, s, e, q, c } } dans hub-notes :
   tab = onglet (synthese | fiche), s/e = position dans le texte de l'onglet,
   q = passage surligné, c = couleur. Supprimer le post-it retire le surlignage (et Annuler le remet).
   Utilise les globales du script principal : main, NOTES, CUR, renderNotes, status, esc, undo. */
(function () {
  const COLORS = [["jaune", "Jaune"], ["vert", "Vert"], ["bleu", "Bleu"], ["rose", "Rose"], ["orange", "Orange"]];
  const TABS = { synthese: { sel: "#prose", label: "Synthèse" }, fiche: { sel: ".ess-sheet", label: "Fiche" } };
  const SKIP = ".toolbar,style,script,.hl-bar";
  let bar = null, pop = null, pending = null, lastDown = 0, win = null, winId = null, lastColor = "jaune";
  const NOTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/></svg>';

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
    if (win && !win.hidden) { const n = notes.find(x => x.id === winId); if (!n) closeWin(); else fillWin(n, false); }
  }

  /* ---------- Barre de couleurs à la sélection ---------- */
  function swatches(cur, attr) {
    return COLORS.map(([k, l]) => '<button type="button" class="hl-sw" data-c="' + k + '" ' + attr + '="' + k + '" aria-label="' + l + '" title="' + l + '"' + (k === cur ? ' aria-pressed="true"' : "") + "></button>").join("");
  }
  function ensureUI() {
    if (bar) return;
    bar = document.createElement("div"); bar.className = "hl-bar"; bar.hidden = true; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Surligner le passage");
    bar.innerHTML = '<span class="hl-l">Surligner</span>' + swatches(null, "data-new") + '<span class="hl-sep"></span><button type="button" class="hl-act hl-note" data-newnote title="Surligner et ouvrir une note au-dessus du cours">' + NOTE_ICON + 'Note</button>';
    pop = document.createElement("div"); pop.className = "hl-bar hl-pop"; pop.hidden = true; pop.setAttribute("role", "toolbar");
    document.body.append(bar, pop);
    /* Safari (Mac) efface la sélection au moment du clic : avec la souris, on agit dès
       l'appui (pointerdown), avant que la sélection ne disparaisse. Au doigt, on garde le clic. */
    [bar, pop].forEach(el => {
      el.addEventListener("mousedown", e => e.preventDefault());
      el.addEventListener("pointerdown", e => {
        e.preventDefault();
        if (e.pointerType === "mouse" || e.pointerType === "pen") { lastDown = Date.now(); act(e.target, true); }
      });
    });
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
  document.addEventListener("mouseup", onSelect);   /* filet de sécurité pour Safari (Mac) */
  document.addEventListener("keyup", e => { if (e.shiftKey || e.key === "Shift") onSelect(); });

  /* ---------- Actions ---------- */
  function create(color, inWin) {
    if (!pending || !CUR) return;
    const rect = pending.rect;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const note = { id, t: "", ts: Date.now(), hl: { tab: pending.tab, s: pending.s, e: pending.e, q: pending.q, c: color } };
    const a = NOTES.get(CUR); a.unshift(note); NOTES.put(CUR, a);
    window.getSelection().removeAllRanges(); hideBar();
    renderNotes(CUR);
    if (inWin) openWinLater(id, rect, inWin === "later"); else openNote(id, true);
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
    pop.innerHTML = swatches(n.hl.c, "data-set") + '<span class="hl-sep"></span><button type="button" class="hl-act hl-note" data-open>' + NOTE_ICON + (n.t ? "Ouvrir la note" : "Écrire une note") + '</button><button type="button" class="hl-act" data-side title="Voir dans Mes notes">Mes notes</button><button type="button" class="hl-act del" data-del>Retirer</button>';
    place(pop, m.getBoundingClientRect());
  }

  /* Action d'un bouton de la barre (nouveau surlignage) ou du menu (passage existant) */
  /* Safari (Mac) retire le focus au relâchement du clic : quand l'action part de l'appui,
     la fenêtre s'ouvre seulement une fois le bouton de la souris relâché. */
  function openWinLater(id, rect, viaDown) {
    if (!viaDown) return openWin(id, rect);
    let done = false;
    const go = () => { if (done) return; done = true; document.removeEventListener("pointerup", up, true); setTimeout(() => openWin(id, rect), 0); };
    const up = () => go();
    document.addEventListener("pointerup", up, true);
    setTimeout(go, 700);
  }
  function act(t, viaDown) {
    if (bar && t.closest(".hl-bar") === bar) {
      const b = t.closest("[data-new]"); if (b) { lastColor = b.dataset.new; create(lastColor); }
      else if (t.closest("[data-newnote]")) create(lastColor, viaDown ? "later" : true);
      return true;
    }
    if (pop && t.closest(".hl-pop") === pop) {
      const id = pop.dataset.id, b = t.closest("button"); if (!b) return true;
      if (b.dataset.set) setColor(id, b.dataset.set);
      else if (b.hasAttribute("data-open")) { const m = main.querySelector('mark.hl[data-hl="' + id + '"]'); openWinLater(id, m && m.getBoundingClientRect(), viaDown); }
      else if (b.hasAttribute("data-side")) openNote(id, true);
      else if (b.hasAttribute("data-del")) remove(id);
      hidePop(); return true;
    }
    return false;
  }
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest(".hl-bar")) { if (Date.now() - lastDown > 700) act(t); return; }
    const m = t.closest("mark.hl");
    if (m && !(t.closest("mark.k") && t.closest(".hide-keys")) && !(window.getSelection() && !window.getSelection().isCollapsed)) { e.preventDefault(); showPop(m); return; }
    const q = t.closest(".pi-q"); if (q) { gotoMark(q.closest(".pi").dataset.note); return; }
    const sw = t.closest("[data-pic]"); if (sw) { setColor(sw.closest(".pi").dataset.note, sw.dataset.pic); return; }
    const wo = t.closest("[data-winopen]"); if (wo) { openWin(wo.closest(".pi").dataset.note); return; }
    hidePop();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { hideBar(); hidePop(); } });
  window.addEventListener("hashchange", () => { hideBar(); hidePop(); closeWin(); });
  window.addEventListener("resize", () => { hideBar(); hidePop(); if (win && !win.hidden) clampWin(); });

  /* ---------- Fenêtre post-it flottante, déplaçable, au-dessus du cours ---------- */
  const POS_KEY = "hlwin-pos";                       /* préférence d'affichage, propre à ce navigateur */
  function ensureWin() {
    if (win) return;
    win = document.createElement("div"); win.className = "hl-win"; win.hidden = true;
    win.setAttribute("role", "dialog"); win.setAttribute("aria-label", "Note sur le passage surligné");
    win.innerHTML = '<div class="hlw-h" title="Glisser pour déplacer"><span class="hlw-grip" aria-hidden="true"></span><b>Note</b>' +
      '<div class="hlw-cols" role="group" aria-label="Couleur du surlignage">' + COLORS.map(([k, l]) => '<button type="button" class="hl-sw sm" data-c="' + k + '" data-wc="' + k + '" aria-label="' + l + '" title="' + l + '"></button>').join("") + "</div>" +
      '<button type="button" class="hlw-x" aria-label="Fermer la note" title="Fermer">×</button></div>' +
      '<button type="button" class="pi-q hlw-q" title="Aller au passage surligné"></button>' +
      '<textarea rows="6" placeholder="Ta note sur ce passage…" aria-label="Note"></textarea>' +
      '<div class="hlw-f"><span class="hlw-s">Enregistrée sur ton compte</span><button type="button" class="hlw-del">Supprimer</button></div>';
    document.body.appendChild(win);
    const ta = win.querySelector("textarea");
    ta.addEventListener("input", () => {
      const a = NOTES.get(CUR), n = a.find(x => x.id === winId); if (!n) return;
      n.t = ta.value; n.ts = Date.now(); NOTES.put(CUR, a);
      const side = main.querySelector('.pi[data-note="' + winId + '"] textarea');
      if (side) { side.value = ta.value; side.style.height = "auto"; side.style.height = side.scrollHeight + "px"; }
      main.querySelectorAll('mark.hl[data-hl="' + winId + '"]').forEach(m => m.title = ta.value.slice(0, 140) || m.title);
    });
    win.addEventListener("click", e => {
      const t = e.target;
      if (t.closest(".hlw-x")) closeWin();
      else if (t.closest("[data-wc]")) setColor(winId, t.closest("[data-wc]").dataset.wc);
      else if (t.closest(".hlw-q")) gotoMark(winId);
      else if (t.closest(".hlw-del")) { const id = winId; closeWin(); remove(id); }
    });
    win.addEventListener("pointerup", e => {
      if (e.target.closest("button,textarea") || win.classList.contains("drag")) return;
      const ta2 = win.querySelector("textarea"); setTimeout(() => ta2.focus({ preventScroll: true }), 0);
    });
    win.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); closeWin(); } });
    /* glisser-déposer par l'en-tête (souris et doigt) */
    const head = win.querySelector(".hlw-h"); let drag = null;
    head.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      e.preventDefault(); const r = win.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; head.setPointerCapture(e.pointerId); win.classList.add("drag");
    });
    head.addEventListener("pointermove", e => { if (!drag) return; moveWin(e.clientX - drag.dx, e.clientY - drag.dy); });
    const end = () => { if (!drag) return; drag = null; win.classList.remove("drag"); try { localStorage.setItem(POS_KEY, JSON.stringify({ x: parseFloat(win.style.left), y: parseFloat(win.style.top) })); } catch (e) {} };
    head.addEventListener("pointerup", end); head.addEventListener("pointercancel", end);
  }
  function moveWin(x, y) {
    const w = win.offsetWidth, h = win.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    win.style.left = Math.min(Math.max(8, x), vw - w - 8) + "px";
    win.style.top = Math.min(Math.max(8, y), Math.max(8, vh - Math.min(h, vh - 16) - 8)) + "px";
  }
  function clampWin() { moveWin(parseFloat(win.style.left) || 0, parseFloat(win.style.top) || 0); }
  function fillWin(n, setText) {
    win.dataset.c = n.hl.c;
    const q = n.hl.q.length > 220 ? n.hl.q.slice(0, 217) + "…" : n.hl.q;
    win.querySelector(".hlw-q").innerHTML = "<small>" + esc((TABS[n.hl.tab] || {}).label || "") + " · passage surligné</small>« " + esc(q) + " »";
    win.querySelectorAll("[data-wc]").forEach(b => b.setAttribute("aria-pressed", b.dataset.wc === n.hl.c));
    if (setText) win.querySelector("textarea").value = n.t || "";
  }
  function openWin(id, rect) {
    const n = NOTES.get(CUR).find(x => x.id === id); if (!n || !n.hl) return;
    ensureWin(); hideBar(); hidePop();
    winId = id; fillWin(n, true); win.hidden = false;
    let pos = null; try { pos = JSON.parse(localStorage.getItem(POS_KEY) || "null"); } catch (e) {}
    const w = win.offsetWidth, vw = document.documentElement.clientWidth;
    if (pos && typeof pos.x === "number") moveWin(pos.x, pos.y);
    else if (rect) moveWin(rect.right + 16 + w < vw ? rect.right + 16 : rect.left, rect.bottom + 12);
    else moveWin(vw - w - 24, 90);
    flash(win);
    const ta = win.querySelector("textarea"), focus = () => { if (win.hidden) return; ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); };
    focus(); setTimeout(focus, 60); setTimeout(focus, 250);
  }
  function closeWin() { if (win) win.hidden = true; winId = null; }
  /* saisie dans « Mes notes » → fenêtre ouverte sur la même note */
  document.addEventListener("input", e => {
    if (!win || win.hidden || !e.target.matches(".pi textarea")) return;
    const pi = e.target.closest(".pi"); if (pi && pi.dataset.note === winId) win.querySelector("textarea").value = e.target.value;
  });

  /* ---------- Branchement ---------- */
  window.HL = {
    attach(p, tab) { if (TABS[tab]) refresh(); },
    refresh,
    head(n) {
      const lbl = (TABS[n.hl.tab] || {}).label || "";
      const q = n.hl.q.length > 160 ? n.hl.q.slice(0, 157) + "…" : n.hl.q;
      return '<div class="pi-top"><button type="button" class="pi-q" title="Aller au passage surligné"><small>' + lbl + " · passage surligné</small>« " + esc(q) + ' »</button>' +
        '<div class="pi-row"><div class="pi-cols" role="group" aria-label="Couleur du surlignage">' + COLORS.map(([k, l]) => '<button type="button" class="hl-sw sm" data-c="' + k + '" data-pic="' + k + '" aria-label="' + l + '" title="' + l + '"' + (k === n.hl.c ? ' aria-pressed="true"' : "") + "></button>").join("") + "</div>" +
        '<button type="button" class="pi-win" data-winopen title="Ouvrir au-dessus du cours">' + NOTE_ICON + 'Fenêtre</button></div>' +
        '<p class="pi-lost">Ce passage n’a pas été retrouvé dans le cours (il a peut-être été modifié).</p></div>';
    }
  };
})();
