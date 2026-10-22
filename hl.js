/* Surlignage du cours relié aux post-its.
   Un surlignage = un post-it qui porte { hl: { tab, s, e, q, c } } dans hub-notes :
   tab = onglet (synthese | fiche), s/e = position dans le texte de l'onglet,
   q = passage surligné, c = couleur. Supprimer le post-it retire le surlignage (et Annuler le remet).
   Utilise les globales du script principal : main, NOTES, CUR, renderNotes, status, esc, undo. */
(function () {
  const COLORS = [["jaune", "Jaune"], ["vert", "Vert"], ["bleu", "Bleu"], ["rose", "Rose"], ["orange", "Orange"]];
  const TABS = { synthese: { sel: "#prose", label: "Synthèse" }, fiche: { sel: ".ess-sheet", label: "Fiche" } };
  const SKIP = ".toolbar,style,script,.hl-bar,.memo-pill";
  let bar = null, pop = null, pending = null, lastDown = 0, win = null, winId = null, lastColor = "jaune";
  const EYE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.5 8 3.2 10 2 12c1 2.5 5 7 10 7 1.9 0 3.6-.6 5-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
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
    wrapWith(root, s, e, () => {
      const m = document.createElement("mark");
      m.className = "hl"; m.dataset.hl = note.id; m.dataset.c = note.hl.c;
      m.title = note.t ? note.t.slice(0, 140) : "Passage surligné · clique pour la note ou la couleur";
      return m;
    });
  }
  function wrapWith(root, s, e, mk) {
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
      const m = mk();
      node.parentNode.insertBefore(m, node); m.appendChild(node);
    }
  }
  function unwrap(root) {
    root.querySelectorAll("mark.hl, mark.ub").forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); });
    root.normalize();
  }
  /* Retrouve le passage : position enregistrée, sinon première occurrence du texte la plus proche */
  function locate(txt, h) {
    if (txt.slice(h.s, h.e) === h.q) return [h.s, h.e];
    let best = -1, i = txt.indexOf(h.q);
    while (i !== -1) { if (best === -1 || Math.abs(i - h.s) < Math.abs(best - h.s)) best = i; i = txt.indexOf(h.q, i + 1); }
    return best === -1 ? null : [best, best + h.q.length];
  }

  /* ---------- Mots masqués par l'utilisateur ----------
     hub-blur = { chapitre: [ { id, s, e, q } ] } (onglet Synthèse), floutés en mode mémoire
     comme les mots-clés du cours, enregistrés sur le compte. */
  const BKEY = "hub-blur";
  const blurs = () => { const o = S.get(BKEY, {}) || {}; return (CUR && o[CUR]) || []; };
  function saveBlurs(arr) { const o = S.get(BKEY, {}) || {}; if (arr.length) o[CUR] = arr; else delete o[CUR]; S.set(BKEY, o); }
  function addBlur() {
    if (!pending || !CUR || pending.tab !== "synthese") return;
    /* on étend la sélection aux mots entiers (« droit est li » → « droit est lié ») */
    const root = roots().find(([t]) => t === "synthese"); if (!root) return;
    const txt = fullText(root[1]), W = /[\p{L}\p{N}’'-]/u;
    let s0 = pending.s, e0 = pending.e;
    while (s0 > 0 && W.test(txt[s0 - 1])) s0--;
    while (e0 < txt.length && W.test(txt[e0])) e0++;
    let covered = 0;
    root[1].querySelectorAll("mark.k.kept").forEach(k => {
      const r = document.createRange(); r.selectNodeContents(root[1]); r.setEndBefore(k);
      const ks = rangeLen(root[1], r), ke = ks + k.textContent.length;
      if (ks < e0 && ke > s0) { unkeepSilent(kIndex(k)); covered += Math.min(ke, e0) - Math.max(ks, s0); }
    });
    const arr = blurs();
    if (covered < txt.slice(s0, e0).replace(/\s+/g, "").length - 1 && !arr.some(x => x.s === s0 && x.e === e0))
      arr.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), s: s0, e: e0, q: txt.slice(s0, e0) });
    saveBlurs(arr);
    window.getSelection().removeAllRanges(); hideBar();
    const cb = main.querySelector("#hideKeys");
    if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event("change")); }   /* on montre tout de suite l'effet */
    refresh();
  }
  function removeBlur(id) { saveBlurs(blurs().filter(b => b.id !== id)); refresh(); }
  /* hub-unblur = { chapitre: [ { i, q } ] } : mots-clés du cours (i-ème mark.k de la synthèse,
     texte q) que l'utilisateur ne veut plus voir floutés */
  const UKEY = "hub-unblur";
  const kept = () => { const o = S.get(UKEY, {}) || {}; return (CUR && o[CUR]) || []; };
  function saveKept(a) { const o = S.get(UKEY, {}) || {}; if (a.length) o[CUR] = a; else delete o[CUR]; S.set(UKEY, o); }
  const kIndex = k => [...main.querySelectorAll("#prose mark.k")].indexOf(k);
  const isKept = (i, k) => kept().some(x => x.i === i && x.q === k.textContent);
  function keep(i, q) { const a = kept(); if (!a.some(x => x.i === i)) a.push({ i, q }); saveKept(a); refresh(); }
  function unkeepSilent(i) { saveKept(kept().filter(x => x.i !== i)); }
  function unkeep(i) { saveKept(kept().filter(x => x.i !== i)); const k = main.querySelectorAll("#prose mark.k")[i]; if (k) k.classList.remove("shown"); refresh(); }
  function showMaskPop(ref, rect, isKeptNow) {
    ensureUI(); hideBar();
    pop.dataset.id = ""; pop.dataset.ub = ref.ub || ""; pop.dataset.k = ref.k != null ? ref.k : ""; pop.dataset.kq = ref.q || "";
    pop.innerHTML = isKeptNow ? '<button type="button" class="hl-act" data-remask>' + EYE_ICON + 'Masquer à nouveau</button>'
                              : '<button type="button" class="hl-act" data-unblur>' + EYE_ICON + 'Ne plus masquer</button>';
    place(pop, rect);
  }
  function showUbPop(u, rect) { showMaskPop({ ub: u }, rect, false); }

  /* ---------- Case « Masquer les mots-clés » qui suit la lecture ----------
     Une pastille collée en bas de l'écran apparaît quand la barre de la synthèse
     n'est plus visible ; elle pilote la vraie case. */
  function memoPill(root, tb) {
    const cb = root.querySelector("#hideKeys"); if (!cb || !tb || root.querySelector(".memo-pill")) return;
    /* grand écran : sous le sommaire (colonne de gauche, fixe) */
    const toc = root.closest(".synth") && root.closest(".synth").querySelector(".toc");
    if (toc && !toc.querySelector(".toc-memo"))
      toc.insertAdjacentHTML("beforeend", '<label class="toc-memo"><input type="checkbox" class="memo-cb"><span>Masquer les mots-clés</span></label>');
    /* écran plus étroit : petit bouton rond dans le coin, quand la barre du haut est passée */
    root.insertAdjacentHTML("beforeend", '<div class="memo-pill" aria-hidden="true"><label title="Masquer les mots-clés"><input type="checkbox" class="memo-cb" tabindex="-1" aria-label="Masquer les mots-clés">' + EYE_ICON + '</label></div>');
    const pill = root.querySelector(".memo-pill");
    const boxes = () => [...document.querySelectorAll(".memo-cb")].filter(x => x.closest("#p-synthese"));
    const sync = () => { boxes().forEach(x => x.checked = cb.checked); pill.classList.toggle("on", cb.checked); };
    sync();
    cb.addEventListener("change", sync);
    boxes().forEach(x => x.addEventListener("change", () => { cb.checked = x.checked; cb.dispatchEvent(new Event("change")); }));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        const show = !en.isIntersecting && en.boundingClientRect.top < 0;   /* barre passée au-dessus */
        pill.classList.toggle("show", show); pill.setAttribute("aria-hidden", show ? "false" : "true");
        pill.querySelector("input").tabIndex = show ? 0 : -1;
      }).observe(tb);
    }
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
      if (tab === "synthese") {
        const K = kept();
        root.querySelectorAll("mark.k").forEach((m, i) => { const kp = K.some(x => x.i === i && x.q === m.textContent); m.classList.toggle("kept", kp); if (kp) m.classList.remove("shown"); });
        const tb = root.querySelector(".toolbar");
        if (tb && !tb.querySelector(".ub-reset")) tb.insertAdjacentHTML("beforeend", '<button type="button" class="ub-reset" hidden>Réinitialiser les mots masqués</button>');
        const rb = tb && tb.querySelector(".ub-reset"); if (rb) rb.hidden = !(blurs().length || K.length);
        memoPill(root, tb);
      }
      if (tab === "synthese") blurs().forEach(b => { const at = locate(txt, b); if (at) wrapWith(root, at[0], at[1], () => {
        const m = document.createElement("mark"); m.className = "ub"; m.dataset.ub = b.id;
        m.title = "Mot masqué par toi · en mode mémoire, clique pour le révéler"; return m; }); });
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
    bar.innerHTML = '<span class="hl-l">Surligner</span>' + swatches(null, "data-new") + '<span class="hl-sep"></span><button type="button" class="hl-act hl-note" data-newnote title="Surligner et ouvrir une note au-dessus du cours">' + NOTE_ICON + 'Note</button><span class="hl-sep hl-bsep"></span><button type="button" class="hl-act hl-note hl-blurb" data-blur title="Flouter ce passage en mode mémoire">' + EYE_ICON + 'Masquer</button>';
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
      ensureUI(); hidePop(); pending = s;
      bar.querySelectorAll(".hl-blurb,.hl-bsep").forEach(x => x.hidden = s.tab !== "synthese");
      place(bar, s.rect);
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
  function showPop(m, ub) {
    ensureUI(); hideBar();
    const id = m.dataset.hl, n = NOTES.get(CUR).find(x => x.id === id); if (!n) return;
    pop.dataset.id = id; pop.dataset.ub = ub || ""; pop.dataset.k = "";
    pop.innerHTML = swatches(n.hl.c, "data-set") + '<span class="hl-sep"></span><button type="button" class="hl-act hl-note" data-open>' + NOTE_ICON + (n.t ? "Ouvrir la note" : "Écrire une note") + '</button><button type="button" class="hl-act" data-side title="Voir dans Mes notes">Mes notes</button><button type="button" class="hl-act del" data-del>Retirer</button>' + (ub ? '<span class="hl-sep"></span><button type="button" class="hl-act" data-unblur>' + EYE_ICON + 'Ne plus masquer</button>' : "");
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
      else if (t.closest("[data-blur]")) addBlur();
      return true;
    }
    if (pop && t.closest(".hl-pop") === pop) {
      const id = pop.dataset.id, b = t.closest("button"); if (!b) return true;
      if (b.hasAttribute("data-unblur")) { if (pop.dataset.k !== "" && pop.dataset.k != null) keep(+pop.dataset.k, pop.dataset.kq); else removeBlur(pop.dataset.ub); }
      else if (b.hasAttribute("data-remask")) unkeep(+pop.dataset.k);
      else if (b.dataset.set) setColor(id, b.dataset.set);
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
    const rs = t.closest(".ub-reset");
    if (rs) {                                  /* réinitialiser (2 clics pour confirmer) */
      if (!rs.dataset.sure) { rs.dataset.sure = 1; rs.textContent = "Confirmer la réinitialisation ?"; setTimeout(() => { if (rs.isConnected) { delete rs.dataset.sure; rs.textContent = "Réinitialiser les mots masqués"; } }, 3500); return; }
      saveBlurs([]); saveKept([]); refresh(); return;
    }
    const u = t.closest("mark.ub"), k = t.closest("#prose mark.k"), selOn = window.getSelection() && !window.getSelection().isCollapsed;
    if (k && !u && !selOn) {                   /* mot-clé du cours */
      const i = kIndex(k), kp = isKept(i, k), hide = !!k.closest(".hide-keys");
      if (kp) k.classList.remove("shown");     /* un mot gardé n'a pas besoin d'être « révélé » */
      if (hide && !kp) {                       /* le script du cours vient de le révéler / reflouter */
        if (k.classList.contains("shown")) showMaskPop({ k: i, q: k.textContent }, k.getBoundingClientRect(), false); else hidePop();
        return;
      }
      if (!t.closest("mark.hl")) { showMaskPop({ k: i, q: k.textContent }, k.getBoundingClientRect(), kp); return; }
    }
    if (u && !selOn) {
      if (u.closest(".hide-keys")) {           /* mode mémoire : un clic révèle / refloute */
        e.preventDefault(); const on = !u.classList.contains("shown");
        main.querySelectorAll('mark.ub[data-ub="' + u.dataset.ub + '"]').forEach(x => x.classList.toggle("shown", on));
        if (on) showMaskPop({ ub: u.dataset.ub }, u.getBoundingClientRect(), false); else hidePop();
        return;
      }
      if (!t.closest("mark.hl")) { e.preventDefault(); showUbPop(u.dataset.ub, u.getBoundingClientRect()); return; }
    }
    const m = t.closest("mark.hl");
    if (m && u && !selOn && !u.closest(".hide-keys")) { e.preventDefault(); showPop(m, u.dataset.ub); return; }
    if (m && !(t.closest("mark.k") && t.closest(".hide-keys")) && !(window.getSelection() && !window.getSelection().isCollapsed)) { e.preventDefault(); showPop(m); return; }
    const q = t.closest(".pi-q"); if (q) { gotoMark(q.closest(".pi").dataset.note); return; }
    const sw = t.closest("[data-pic]"); if (sw) { setColor(sw.closest(".pi").dataset.note, sw.dataset.pic); return; }
    const wo = t.closest("[data-winopen]"); if (wo) { openWin(wo.closest(".pi").dataset.note); return; }
    hidePop();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { hideBar(); hidePop(); } });
  document.addEventListener("change", e => { if (e.target.id === "hideKeys") main.querySelectorAll("mark.ub.shown").forEach(x => x.classList.remove("shown")); });
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
