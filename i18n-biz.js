/* Interface en anglais pour les chapitres du cours Business exploration (contenu en anglais).
   Traduit à la volée les libellés de l'interface (onglets, flashcards, QCM, notes) dans la page du chapitre. */
(function () {
  const W = {
    "Fiche de révision": "Revision sheet", "Synthèse": "Summary", "Schémas": "Diagrams", "Applications corrigées": "Worked exercises",
    "Exercices de tri": "Sorting exercises", "Flashcards": "Flashcards", "QCM": "MCQ", "Examens blancs": "Mock exams",
    "Masquer les mots-clés": "Hide keywords",
    "Mode mémoire active : clique sur un mot flouté pour le révéler. Pour flouter tes propres mots, sélectionne-les puis « Masquer » ; clique sur un mot révélé pour ne plus le masquer.": "Active recall mode: click a blurred word to reveal it. To blur your own words, select them and choose “Hide”; click a revealed word to stop hiding it.",
    "Réinitialiser les mots masqués": "Reset hidden words",
    "Télécharger le cours (PDF)": "Download the course (PDF)", "Télécharger la fiche (PDF)": "Download the sheet (PDF)", "Préparation…": "Preparing…",
    "L’essentiel du chapitre sur une fiche, à relire juste avant l’examen.": "The chapter’s essentials on one sheet, to reread just before the exam.",
    "L’essentiel en une phrase": "In one sentence", "Sommaire": "Contents", "À propos des corrigés": "About the answers",
    "Recommencer cette série": "Restart this round", "Recommencer (ordre mélangé)": "Restart (shuffled order)",
    "Choisis la bonne catégorie pour chaque élément.": "Choose the right category for each item.",
    /* Flashcards */
    "Cartes": "Cards", "Tableau": "Table", "Toutes": "All", "À revoir": "To review", "Maîtrisées": "Mastered", "Exclues": "Excluded", "Mes cartes": "My cards",
    "+ Ajouter une carte": "+ Add a card", "Nouvelle flashcard": "New flashcard", "Thème": "Topic", "Question (recto)": "Question (front)", "Réponse (verso)": "Answer (back)",
    "Enregistrer la carte": "Save card", "Annuler": "Cancel", "Clique pour retourner ↺": "Click to flip ↺", "Réponse": "Answer", "Question": "Question",
    "← → pour naviguer": "← → to navigate", "← Précédente": "← Previous", "Suivante →": "Next →", "Je savais ✓": "I knew it ✓", "Mélanger": "Shuffle", "Remettre à zéro": "Reset",
    "Exclure cette carte": "Exclude this card", "Exclure": "Exclude", "Réintégrer": "Restore", "Modifier": "Edit", "Supprimer": "Delete", "Statut": "Status",
    "Voir les cartes exclues": "See excluded cards", "✓ Maîtrisée": "✓ Mastered", "maîtrisée": "mastered", "Ma carte": "My card", "Aucune carte": "No cards", "Bravo": "Well done",
    "Toutes les cartes sont maîtrisées. Passe sur « Toutes » pour réviser à nouveau.": "All cards are mastered. Switch to “All” to review them again.",
    "Toutes les cartes sont exclues. Réintègre-les depuis le tableau ou ajoute les tiennes.": "All cards are excluded. Restore them from the table or add your own.",
    "Tu n’as pas encore ajouté de carte. Clique sur « + Ajouter une carte ».": "You haven’t added a card yet. Click “+ Add a card”.",
    "Écris une question et une réponse.": "Write a question and an answer.",
    "Ex. Définitions": "E.g. Definitions", "Filtre": "Filter", "Filtrer le tableau": "Filter the table",
    "Carte : clique ou appuie sur Espace pour retourner": "Card: click or press Space to flip",
    "Cliquer pour marquer maîtrisée": "Click to mark as mastered", "Cliquer pour remettre à revoir": "Click to put back to review",
    /* QCM */
    "Mélange": "Mix", "Séries de QCM": "MCQ series", "Pas encore fait": "Not done yet", "Exact.": "Correct.", "Pas tout à fait.": "Not quite.",
    "Question suivante →": "Next question →", "Voir mon score": "See my score", "Nouveau tirage": "New draw", "Examen blanc aléatoire": "Random mock exam",
    "Très solide. Tu peux passer à la série suivante.": "Very solid. You can move on to the next series.",
    "Très solide. Tu es prêt pour ce chapitre.": "Very solid. You are ready for this chapter.",
    "Bonne base. Relis les points manqués ci-dessous.": "Good foundation. Review the missed points below.",
    "Reprends la synthèse puis refais la série.": "Go back over the summary, then redo the series.",
    "Reprends la synthèse puis refais le QCM.": "Go back over the summary, then redo the MCQ.",
    "Questions du chapitre": "Chapter questions",
    /* Notes */
    "Mes notes": "My notes", "Mes notes ↓": "My notes ↓", "+ Post-it": "+ Note", "Écris ta note…": "Write your note…", "Supprimer la note": "Delete note",
    "Notes enregistrées sur ton compte.": "Notes saved to your account.", "Annuler la suppression": "Undo",
    "Aucune note pour ce chapitre. Ajoute un post-it pour garder une question, un exemple du prof ou un point à revoir. Tu peux aussi sélectionner un passage de la synthèse ou de la fiche pour le surligner.": "No notes for this chapter yet. Add a note to keep a question, an example from class or a point to review. You can also select a passage of the summary or the sheet to highlight it.",
    "Sections du chapitre": "Chapter sections", "Accueil": "Home"
  };
  const RX = [
    [/^(\d+) bonne\(s\) réponse\(s\) sur (\d+) — (\d+) restant\(s\)$/, "$1 correct out of $2 — $3 left"],
    [/^(\d+) \/ (\d+) maîtrisées$/, "$1 / $2 mastered"],
    [/^(\d+) carte(s?) exclue(s?)$/, "$1 excluded card$2"],
    [/^20 questions tirées au hasard parmi les (\d+)$/, "20 random questions out of $1"],
    [/^20 questions tirées parmi les (\d+) du cours$/, "20 questions drawn from the $1 in the course"],
    [/^La bonne réponse est : /, "The correct answer is: "],
    [/^Meilleur score sur cette série : /, "Best score on this series: "], [/^Meilleur score : /, "Best score: "], [/^Meilleur : /, "Best: "],
    [/^Score : /, "Score: "], [/^Série suivante : /, "Next series: "], [/^Série (\d+)/, "Series $1"], [/^Thème (\d*)/, "Topic $1"],
    [/^Ce chapitre n’a pas pu s’afficher : /, "This chapter could not be displayed: "]
  ];
  const ATTR = ["placeholder", "aria-label", "title"];
  function tx(v) {
    const t = v.trim(); if (!t) return null;
    let o = W[t];
    if (o === undefined) { for (const [r, b] of RX) if (r.test(t)) { o = t.replace(r, b); break; } }
    if (o === undefined || o === t) return null;
    return v.replace(t, o);
  }
  function walk(root) {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode.closest("textarea,script,style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let n; const todo = [];
    while ((n = w.nextNode())) { const r = tx(n.nodeValue); if (r !== null) todo.push([n, r]); }
    todo.forEach(([n, r]) => { n.nodeValue = r; });
    root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(e => ATTR.forEach(a => { const v = e.getAttribute(a); if (v) { const r = tx(v); if (r !== null) e.setAttribute(a, r); } }));
  }
  const on = () => document.documentElement.dataset.course === "business" && /^#business-/.test(location.hash);
  let obs = null, busy = false;
  function run() {
    if (busy) return; busy = true;
    try { const g = document.querySelector(".chgrid"); if (g) walk(g); } finally { busy = false; }
  }
  function sync() {
    const m = document.querySelector("main");
    if (on()) {
      document.documentElement.lang = "en";
      run();
      if (!obs && m) { obs = new MutationObserver(() => { if (on()) run(); }); obs.observe(m, { childList: true, subtree: true, characterData: true }); }
    } else {
      document.documentElement.lang = "fr";
      if (obs) { obs.disconnect(); obs = null; }
    }
  }
  window.addEventListener("hashchange", () => setTimeout(sync, 0));
  document.addEventListener("click", () => { if (on()) setTimeout(run, 0); }, true);
  const t = setInterval(() => { if (document.querySelector(".chgrid") || document.querySelector(".hero")) { clearInterval(t); sync(); } }, 200);
  window.I18N_BIZ = { sync, run };
})();
