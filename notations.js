/* Notations du cours d'environnement économique : tableau de toutes les lettres et symboles.
   Page #eco-notations + fenêtre « Notations » dans chaque chapitre du cours. */
(function () {
  const s = x => "<sub>" + x + "</sub>";
  /* g : groupe · s : symbole (HTML) · n : nom · d : signification · f : formule (HTML) · ch : chapitres · w : attention */
  const G = [
    ["agr", "Agrégats, prix et croissance"],
    ["pol", "Politiques économiques"],
    ["is", "IS-LM · marché des biens (courbe IS)"],
    ["lm", "IS-LM · marché de la monnaie (courbe LM)"],
    ["eq", "Équilibres et lecture des graphiques"],
    ["adas", "AD-AS"],
    ["mf", "Mundell-Fleming (économie ouverte)"],
    ["tr", "Inflation, chômage et marché du travail"],
    ["sym", "Symboles et conventions d’écriture"],
    ["sig", "Sigles et unités"]
  ];
  const R = [
    /* ---- Agrégats ---- */
    { g: "agr", s: "Y", n: "PIB : production = revenu national", d: "Valeur de tout ce qui est produit dans le pays sur une période. Dans les modèles, Y est à la fois la production, les revenus distribués et les dépenses (les trois sont égaux).", f: "Y = C + I + G (économie fermée)<br>Y = C + I + G + (X − M) (économie ouverte)", ch: [1, 3, 4, 5, 6] },
    { g: "agr", s: "C", n: "Consommation des ménages", d: "Dépenses de consommation des ménages ; première composante de Y.", f: "C = C" + s(0) + " + cY" + s("d") + " (ch. 3)", ch: [1, 3] },
    { g: "agr", s: "I", n: "Investissement", d: "Achats de biens de production par les entreprises (machines, bâtiments…). C’est le « I » de IS.", f: "I = I" + s(0) + " + αY − βi (ch. 3)", ch: [1, 3] },
    { g: "agr", s: "G", n: "Dépenses publiques (Government)", d: "Dépenses de l’État. Exogène : décidée par le gouvernement, c’est l’outil de la politique budgétaire.", f: "", ch: [1, 2, 3, 5] },
    { g: "agr", s: "X", n: "Exportations", d: "Biens et services produits dans le pays et vendus à l’étranger : ils s’ajoutent à Y.", f: "", ch: [1, 5] },
    { g: "agr", s: "M", n: "Importations", d: "Biens et services achetés à l’étranger : ils se retranchent de Y (fuite hors de l’économie nationale).", f: "", ch: [1, 5], w: "Au chapitre 3, M désigne l’offre de monnaie (le « M » de LM)." },
    { g: "agr", s: "X − M", n: "Solde extérieur (solde commercial)", d: "Positif : excédent commercial ; négatif : déficit. Le taux de change le fait varier (ch. 5).", f: "X − M", ch: [1, 5] },
    { g: "agr", s: "P" + s("t"), n: "Prix d’un bien l’année t", d: "Prix de l’année considérée (prix courants).", f: "", ch: [1] },
    { g: "agr", s: "Q" + s("t"), n: "Quantité produite l’année t", d: "Quantité de chaque bien produite l’année considérée.", f: "", ch: [1] },
    { g: "agr", s: "P" + s("base"), n: "Prix de l’année de base", d: "Prix « gelés » de l’année de référence, pour retirer l’effet des prix (PIB réel).", f: "", ch: [1] },
    { g: "agr", s: "Q" + s("base"), n: "Quantités de l’année de base", d: "Le panier fixe de l’IPC : les mêmes quantités chaque année, seuls les prix changent.", f: "", ch: [1] },
    { g: "agr", s: "t (en indice)", n: "Année considérée", d: "En indice (P" + s("t") + ", IPC" + s("t") + "), t désigne l’année qu’on calcule.", f: "", ch: [1], w: "Écrit seul (pas en indice), t est le taux d’imposition (ch. 3)." },
    { g: "agr", s: "Σ", n: "Somme (sigma)", d: "Additionne le calcul pour tous les biens de l’économie.", f: "Σ P" + s("t") + " × Q" + s("t") + " = somme des P × Q de chaque bien", ch: [1] },
    { g: "agr", s: "PIB nominal", n: "PIB en valeur (prix courants)", d: "Quantités de l’année × prix de l’année : varie avec les quantités et avec les prix.", f: "Σ P" + s("t") + " × Q" + s("t"), ch: [1] },
    { g: "agr", s: "PIB réel", n: "PIB en volume (prix constants)", d: "Quantités de l’année × prix de l’année de base : ne varie qu’avec les quantités. Seul le PIB réel mesure la croissance. L’année de base, PIB nominal = PIB réel.", f: "Σ P" + s("base") + " × Q" + s("t"), ch: [1] },
    { g: "agr", s: "V" + s("f") + ", V" + s("i"), n: "Valeur finale, valeur initiale", d: "Valeurs de fin et de début de période, pour calculer un taux de variation.", f: "Taux = (V" + s("f") + " − V" + s("i") + ") / V" + s("i") + " × 100", ch: [1] },
    { g: "agr", s: "g", n: "Taux de croissance (growth)", d: "Taux de variation d’une grandeur, en %. g" + s("nominal") + " : du PIB nominal ; g" + s("réel") + " : du PIB réel (la vraie croissance).", f: "g = (V" + s("f") + " − V" + s("i") + ") / V" + s("i") + " × 100<br>(1 + g" + s("nominal") + ") = (1 + g" + s("réel") + ") × (1 + π)", ch: [1] },
    { g: "agr", s: "Déflateur", n: "Déflateur du PIB", d: "Indice du niveau des prix de tout ce qui est produit. Vaut 100 l’année de base (ou 1 si on ne multiplie pas par 100).", f: "Déflateur = PIB nominal / PIB réel × 100", ch: [1] },
    { g: "agr", s: "IPC" + s("t"), n: "Indice des prix à la consommation, année t", d: "Évolution du coût d’un panier fixe de consommation. Vaut 100 l’année de base.", f: "IPC" + s("t") + " = Coût du panier" + s("t") + " / Coût du panier" + s("base") + " × 100<br>Coût du panier" + s("t") + " = Σ P" + s("t") + " × Q" + s("base"), ch: [1] },
    { g: "agr", s: "π", n: "Taux d’inflation", d: "Hausse générale et durable des prix, en %. C’est le taux de croissance du déflateur ou de l’IPC (annuel ou par rapport à la base). Axe vertical de la courbe de Phillips.", f: "π = (IPC" + s("t") + " − IPC" + s("t−1") + ") / IPC" + s("t−1") + " × 100<br>(idem avec le déflateur)", ch: [1, 6] },
    { g: "agr", s: "P", n: "Niveau général des prix", d: "Prix moyen de l’économie (mesuré par le déflateur ou l’IPC). Axe vertical du modèle AD-AS.", f: "", ch: [1, 4, 6] },
    { g: "agr", s: "w", n: "Salaire nominal (wage)", d: "Salaire en euros, tel qu’il apparaît sur la fiche de paie.", f: "", ch: [1, 4, 6] },
    { g: "agr", s: "w/P", n: "Salaire réel = pouvoir d’achat", d: "Quantité de biens qu’on peut acheter avec son salaire ; c’est aussi le coût réel du travail pour l’entreprise. Si P monte plus vite que w, w/P baisse.", f: "w / P", ch: [1, 4, 6, 7] },

    /* ---- Politiques ---- */
    { g: "pol", s: "T", n: "Impôts et prélèvements (Taxes)", d: "Recettes de l’État. Au ch. 3, T seul désigne un impôt forfaitaire : un montant fixe qui ne dépend pas de Y.", f: "Impôt proportionnel : T = tY", ch: [2, 3] },
    { g: "pol", s: "T − G", n: "Solde budgétaire = épargne publique", d: "Recettes moins dépenses de l’État. Positif : excédent ; négatif : déficit.", f: "S" + s("publique") + " = T − G", ch: [2, 3] },
    { g: "pol", s: "i", n: "Taux d’intérêt (interest)", d: "Prix de l’argent emprunté. Instrument de la politique monétaire ; axe vertical d’IS-LM et de Mundell-Fleming.", f: "", ch: [2, 3, 5] },
    { g: "pol", s: "MM", n: "Masse monétaire", d: "Quantité de monnaie en circulation ; l’autre instrument de la politique monétaire. Taux directeur ↓ → i ↓ → crédits ↑ → MM ↑.", f: "", ch: [2] },

    /* ---- IS ---- */
    { g: "is", s: "IS", n: "Courbe IS (Investment = Saving)", d: "Ensemble des couples (i, Y) qui équilibrent le marché des biens et services. Décroissante : quand i baisse, I augmente donc Y augmente.", f: "I = S", ch: [3, 4, 5] },
    { g: "is", s: "S", n: "Épargne (Saving)", d: "Partie du revenu qui n’est pas consommée. À l’équilibre d’une économie fermée, l’épargne finance l’investissement.", f: "Privée : S = Y − C − T<br>Publique : S = T − G<br>Équilibre : S = I", ch: [3] },
    { g: "is", s: "Y" + s("d"), n: "Revenu disponible", d: "Revenu qui reste aux ménages après impôts, à consommer ou épargner.", f: "Y" + s("d") + " = Y − T (forfaitaire)<br>Y" + s("d") + " = Y − tY (proportionnel)", ch: [3] },
    { g: "is", s: "C" + s(0), n: "Consommation incompressible (autonome)", d: "Consommation même avec un revenu nul (se nourrir, se loger…).", f: "", ch: [3] },
    { g: "is", s: "c", n: "Propension marginale à consommer (PmC)", d: "Part de chaque euro de revenu supplémentaire qui est consommée. Entre 0 et 1 ; dépend de la confiance.", f: "c = ΔC / ΔY", ch: [2, 3] },
    { g: "is", s: "s", n: "Propension marginale à épargner", d: "Part de chaque euro de revenu supplémentaire qui est épargnée.", f: "s = 1 − c", ch: [3] },
    { g: "is", s: "PMC", n: "Propension moyenne à consommer", d: "Part du revenu disponible consommée en moyenne (pas à la marge).", f: "PMC = C / Y" + s("d"), ch: [3], w: "Ne pas confondre PmC (marginale, = c) et PMC (moyenne)." },
    { g: "is", s: "PMS", n: "Propension moyenne à épargner", d: "Part du revenu disponible épargnée en moyenne.", f: "PMS = S / Y" + s("d") + "<br>PMC + PMS = 1", ch: [3] },
    { g: "is", s: "I" + s(0), n: "Investissement autonome", d: "Partie de l’investissement qui ne dépend ni de Y ni de i.", f: "", ch: [3] },
    { g: "is", s: "α", n: "Propension marginale à investir (alpha)", d: "Investissement supplémentaire quand Y augmente de 1 €.", f: "α = ΔI / ΔY", ch: [3] },
    { g: "is", s: "β", n: "Sensibilité de l’investissement au taux d’intérêt (bêta)", d: "De combien I baisse quand i augmente. On ne dit pas « propension » : ce mot est réservé à ce qui dépend du revenu.", f: "terme −βi dans I = I" + s(0) + " + αY − βi", ch: [3] },
    { g: "is", s: "t", n: "Taux d’imposition (proportionnel)", d: "Part du revenu prélevée par l’impôt (ex. t = 0,4 = 40 %). Plus t est élevé, plus le multiplicateur est faible.", f: "Impôt = tY", ch: [3], w: "En indice (P" + s("t") + ", IPC" + s("t") + "), t désigne l’année (ch. 1)." },
    { g: "is", s: "tY", n: "Impôt proportionnel", d: "Montant de l’impôt quand il dépend du revenu.", f: "tY = t × Y", ch: [3] },
    { g: "is", s: "K, K" + s("G"), n: "Multiplicateur (des dépenses publiques)", d: "De combien Y augmente quand G augmente de 1 €. Plus c ou α sont élevés, plus K est grand ; plus t est élevé, plus K est faible. K" + s("A") + ", K" + s("B") + " : multiplicateurs des économies A et B dans l’application.", f: "K" + s("G") + " = 1 / (1 − c + ct − α)<br>Impôt forfaitaire : K = 1 / (1 − c − α)<br>ΔY = K × ΔG", ch: [3] },
    { g: "is", s: "Équation IS", n: "Expression de Y en fonction de i", d: "On remplace C, I et G dans Y = C + I + G, puis on isole Y. Avec un impôt forfaitaire T, la partie autonome contient −cT.", f: "Y = C" + s(0) + " + c(Y − tY) + I" + s(0) + " + αY − βi + G<br>⟹ Y = K" + s("G") + " × (C" + s(0) + " + I" + s(0) + " − βi + G)", ch: [3] },
    { g: "is", s: "ΔY = ΔG", n: "Multiplicateur du budget équilibré (Haavelmo)", d: "Si G et T augmentent du même montant, Y augmente de ce montant (sans impôt proportionnel).", f: "ΔG = ΔT ⟹ ΔY = ΔG (multiplicateur = 1)", ch: [3] },

    /* ---- LM ---- */
    { g: "lm", s: "LM", n: "Courbe LM (Liquidity preference = Money supply)", d: "Ensemble des couples (i, Y) qui équilibrent le marché de la monnaie. Croissante : quand Y augmente, la demande de monnaie augmente donc i augmente.", f: "L = M, soit MD = MO", ch: [3, 4, 5] },
    { g: "lm", s: "L", n: "Demande de monnaie (Liquidity preference)", d: "Le « L » de LM : la préférence pour la liquidité, c’est-à-dire la monnaie que les agents veulent garder.", f: "", ch: [3], w: "Au chapitre 7, L désigne l’emploi (quantité de travail)." },
    { g: "lm", s: "M (dans LM)", n: "Offre de monnaie (Money supply)", d: "Le « M » de LM : la monnaie mise en circulation par la banque centrale.", f: "", ch: [3], w: "Aux chapitres 1 et 5, M désigne les importations." },
    { g: "lm", s: "MO", n: "Offre de monnaie", d: "Quantité de monnaie offerte. Exogène : fixée par la banque centrale.", f: "Équilibre : MO = MD", ch: [3] },
    { g: "lm", s: "MD", n: "Demande de monnaie", d: "Somme des trois motifs de Keynes : transaction, précaution, spéculation.", f: "MD = M" + s("t") + " + M" + s("p") + " + M" + s("s") + " = εY + M" + s("so") + " − γi", ch: [3] },
    { g: "lm", s: "M" + s("t"), n: "Demande de monnaie de transaction", d: "Monnaie gardée pour payer ses achats ; augmente avec Y.", f: "M" + s("t") + " = εY", ch: [3] },
    { g: "lm", s: "M" + s("p"), n: "Demande de monnaie de précaution", d: "Monnaie gardée pour faire face aux imprévus. Dépend aussi de Y : on la regroupe avec M" + s("t") + ".", f: "incluse dans εY", ch: [3] },
    { g: "lm", s: "M" + s("s"), n: "Demande de monnaie de spéculation", d: "Liquidités gardées pour acheter des titres quand leur cours est bas ; diminue quand i augmente.", f: "M" + s("s") + " = M" + s("so") + " − γi", ch: [3], w: "Ici le « s » veut dire spéculation, pas supply (offre)." },
    { g: "lm", s: "M" + s("so"), n: "Partie autonome de la demande de spéculation", d: "Demande de monnaie de spéculation qui ne dépend pas de i.", f: "", ch: [3] },
    { g: "lm", s: "ε", n: "Sensibilité de la demande de monnaie au revenu (epsilon)", d: "Monnaie supplémentaire demandée quand Y augmente de 1 €.", f: "M" + s("t") + " = εY", ch: [3] },
    { g: "lm", s: "γ", n: "Sensibilité de la demande de monnaie au taux d’intérêt (gamma)", d: "De combien la demande de spéculation baisse quand i augmente.", f: "terme −γi", ch: [3] },
    { g: "lm", s: "Équation LM", n: "Équilibre du marché de la monnaie", d: "On écrit offre = demande, puis on isole i (ou Y).", f: "MO = εY + M" + s("so") + " − γi", ch: [3] },

    /* ---- Équilibres ---- */
    { g: "eq", s: "E, E" + s(0) + ", E" + s(1), n: "Point d’équilibre", d: "Intersection des courbes sur un graphique. E" + s(0) + " : situation de départ ; E" + s(1) + " : après le choc ou la politique.", f: "", ch: [3, 5, 7] },
    { g: "eq", s: "Y*, i*", n: "Équilibre IS-LM", d: "Production et taux d’intérêt où IS et LM se croisent (calculatrice du ch. 3).", f: "On résout le système IS = LM", ch: [3], w: "Au chapitre 5, i* est le taux d’intérêt mondial." },
    { g: "eq", s: "Y" + s(0) + ", i" + s(0) + ", P" + s(0), n: "Valeurs de départ", d: "L’indice 0 désigne la situation initiale. En AD-AS, Y" + s(0) + " est aussi le niveau de production vers lequel l’économie revient à long terme.", f: "", ch: [3, 4, 5] },
    { g: "eq", s: "Y" + s(1) + ", P" + s(1), n: "Valeurs après le choc", d: "L’indice 1 désigne la nouvelle situation.", f: "", ch: [4] },
    { g: "eq", s: "AD′, AS′, IS′, LM′", n: "Courbe déplacée (prime)", d: "Le prime (′) indique la nouvelle position d’une courbe après un choc ou une politique.", f: "", ch: [3, 4, 5] },
    { g: "eq", s: "Δ", n: "Variation (delta)", d: "Écart entre la valeur finale et la valeur initiale : ΔG, ΔY, ΔC, ΔI…", f: "ΔY = Y" + s(1) + " − Y" + s(0), ch: [3] },

    /* ---- AD-AS ---- */
    { g: "adas", s: "AD", n: "Demande agrégée (Aggregate Demand)", d: "Demande totale de biens et services selon le niveau des prix P. Décroissante ; construite à partir d’IS-LM. Une relance la déplace à droite.", f: "", ch: [4, 5, 6] },
    { g: "adas", s: "AS", n: "Offre agrégée (Aggregate Supply)", d: "Production offerte selon P : horizontale (vision keynésienne, très court terme), croissante (intermédiaire, moyen terme), verticale (classique, long terme).", f: "", ch: [4] },

    /* ---- Mundell-Fleming ---- */
    { g: "mf", s: "BP", n: "Courbe de la balance des paiements", d: "Couples (i, Y) compatibles avec l’équilibre des échanges avec l’étranger. Avec des capitaux parfaitement mobiles, elle est horizontale au niveau du taux mondial.", f: "i = i*", ch: [5] },
    { g: "mf", s: "i*", n: "Taux d’intérêt mondial", d: "Taux du reste du monde. Si i > i*, les capitaux entrent et la monnaie s’apprécie ; si i < i*, ils sortent et elle se déprécie.", f: "Mobilité parfaite : i = i*", ch: [5], w: "Au chapitre 3, i* est le taux d’équilibre IS-LM." },

    /* ---- Travail ---- */
    { g: "tr", s: "u", n: "Taux de chômage (unemployment)", d: "Part des actifs sans emploi qui en cherchent un. Axe horizontal de la courbe de Phillips.", f: "u = chômeurs / population active × 100", ch: [6, 7] },
    { g: "tr", s: "u" + s(0) + ", π" + s(0), n: "Point de départ sur la courbe de Phillips", d: "Chômage et inflation initiaux (point A du graphique).", f: "", ch: [6] },
    { g: "tr", s: "N", n: "Emploi (nombre de personnes en emploi)", d: "Actifs occupés. Loi d’Okun : Y ↑ → N ↑ → u ↓.", f: "", ch: [6, 7] },
    { g: "tr", s: "CP", n: "Courbe de Phillips", d: "Relation entre π (ordonnée) et u (abscisse). Décroissante à court terme ; verticale à long terme (Friedman).", f: "", ch: [6] },
    { g: "tr", s: "Population active", n: "Actifs", d: "Personnes en emploi + chômeurs. Les inactifs (étudiants, retraités, au foyer) n’en font pas partie.", f: "Population active = actifs occupés + chômeurs", ch: [7] },
    { g: "tr", s: "Taux d’activité", n: "Part des actifs", d: "Part de la population en âge de travailler qui est active.", f: "Population active / population en âge de travailler × 100", ch: [7], w: "Le taux de chômage se divise par la population active, pas par la population en âge de travailler." },
    { g: "tr", s: "L", n: "Emploi, quantité de travail (Labour)", d: "Axe horizontal du graphique du marché du travail.", f: "", ch: [7], w: "Au chapitre 3, L est la demande de monnaie." },
    { g: "tr", s: "L" + s("s"), n: "Offre de travail (supply)", d: "Travail proposé par les travailleurs ; augmente avec le salaire réel w/P.", f: "", ch: [7] },
    { g: "tr", s: "L" + s("d"), n: "Demande de travail (demand)", d: "Travail demandé par les entreprises ; diminue quand le salaire réel w/P augmente.", f: "Chômage au salaire minimum = L" + s("s") + " − L" + s("d"), ch: [7] },
    { g: "tr", s: "L*, (w/P)*", n: "Équilibre du marché du travail", d: "Emploi et salaire réel d’équilibre (point E).", f: "L" + s("s") + " = L" + s("d"), ch: [7] },

    /* ---- Symboles ---- */
    { g: "sym", s: "↑ · ↓ · ↑↑", n: "Hausse · baisse · forte hausse", d: "Sens de variation d’une grandeur : Y ↑, i ↓.", f: "", ch: [2, 3, 4, 5, 6] },
    { g: "sym", s: "=", n: "Inchangé (dans un bilan)", d: "« P = » signifie que P ne bouge pas.", f: "", ch: [4] },
    { g: "sym", s: "→ · ←", n: "Entraîne · déplacement de courbe", d: "Entre deux grandeurs : « entraîne » (Y ↑ → u ↓). Après le nom d’une courbe : déplacement à droite ou à gauche (AD →, AS ←).", f: "", ch: [2, 3, 4, 5, 6] },
    { g: "sym", s: "⟹", n: "Donc, implique", d: "Étape suivante d’un calcul ou d’un raisonnement.", f: "", ch: [3] },
    { g: "sym", s: "*", n: "Étoile : équilibre ou mondial", d: "Valeur d’équilibre (Y*, L*, (w/P)*) ou, en économie ouverte, valeur mondiale (i*).", f: "", ch: [3, 5, 7] },
    { g: "sym", s: "x" + s(0) + " · x" + s(1), n: "Indices 0 et 1", d: "0 : situation initiale ou partie autonome (C" + s(0) + ", I" + s(0) + ") ; 1 : nouvelle situation.", f: "", ch: [3, 4, 5, 6] },
    { g: "sym", s: "× 100 · base 100", n: "Pourcentage, indice", d: "On multiplie par 100 pour exprimer un taux en % ou un indice base 100.", f: "", ch: [1, 7] },

    /* ---- Sigles ---- */
    { g: "sig", s: "PESTEL", n: "Politique · Économique · Socioculturel · Technologique · Écologique · Légal", d: "Les 6 facteurs du macro-environnement de l’entreprise. Le cours porte sur le E.", f: "", ch: [0] },
    { g: "sig", s: "PIB · IPC", n: "Produit intérieur brut · Indice des prix à la consommation", d: "Voir Y, PIB nominal, PIB réel et IPC" + s("t") + " plus haut.", f: "", ch: [1] },
    { g: "sig", s: "BC · BCE", n: "Banque centrale · Banque centrale européenne", d: "Fixe le taux directeur (taux auquel elle prête aux banques) et l’offre de monnaie MO.", f: "", ch: [2, 5] },
    { g: "sig", s: "CT · MT · LT · MLT", n: "Court · moyen · long · moyen et long terme", d: "Horizon d’analyse : IS-LM et Mundell-Fleming à CT, AD-AS à MLT.", f: "", ch: [4, 6] },
    { g: "sig", s: "VST", n: "Valeur sociale du travail", d: "Ce que le travail d’une personne apporte à toute la société (cotisations, consommation).", f: "", ch: [7] },
    { g: "sig", s: "M€ · Md€", n: "Millions · milliards d’euros", d: "Unités des montants dans les exercices (ex. G + 20 Md€).", f: "", ch: [3] }
  ];

  const esc = x => String(x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const norm = x => String(x).replace(/<[^>]+>/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  R.forEach(r => { r.k = norm(r.s + " " + r.n + " " + r.d + " " + r.f + " " + (r.w || "")); r.ks = norm(r.s); });
  const chTitle = n => { try { const c = M.courses.find(x => x.id === "eco"); const ch = c.chapters.find(x => x.id === "eco-" + n); return ch ? ch.title : ""; } catch (e) { return ""; } };

  function rows(q, ch) {
    const nq = norm(q.trim());
    let out = "", n = 0;
    G.forEach(([gk, gl]) => {
      const short = nq.length && nq.length <= 2;
      const list = R.filter(r => r.g === gk && (ch === "" || r.ch.includes(+ch)) && (!nq || (short ? r.ks.split(/[\s,·()]+/).includes(nq) || r.ks === nq : r.k.includes(nq))));
      if (!list.length) return;
      out += '<tbody><tr class="nt-gr"><th colspan="5">' + gl + '<span>' + list.length + "</span></th></tr>" + list.map(r => {
        n++;
        return '<tr' + (r.w ? ' class="w"' : "") + '><td class="nt-s" data-l="Symbole">' + r.s + '</td><td class="nt-n" data-l="Nom"><b>' + r.n + "</b></td>" +
          '<td class="nt-d" data-l="Signification">' + r.d + (r.w ? '<span class="nt-w"><b>Attention</b> ' + r.w + "</span>" : "") + "</td>" +
          '<td class="nt-f" data-l="Formule">' + (r.f ? '<span class="nt-fx">' + r.f + "</span>" : '<span class="nt-none">—</span>') + "</td>" +
          '<td class="nt-c" data-l="Chapitres">' + r.ch.map(c => '<a href="#eco-' + c + '" title="' + esc(chTitle(c)) + '">' + c + "</a>").join("") + "</td></tr>";
      }).join("") + "</tbody>";
    });
    return { html: out, n };
  }

  /* Composant : recherche + filtres par chapitre + tableau */
  function mount(box, ch) {
    let cur = /^\d+$/.test(String(ch)) ? String(ch) : "", q = "";
    box.innerHTML = '<div class="nt-tools"><label class="nt-q"><span class="sr">Rechercher</span><input type="search" placeholder="Chercher une lettre ou un mot : c, ε, multiplicateur…" autocomplete="off"></label>' +
      '<div class="nt-chips" role="group" aria-label="Filtrer par chapitre"><button type="button" data-c="">Tous</button>' + [0, 1, 2, 3, 4, 5, 6, 7].map(c => '<button type="button" data-c="' + c + '" title="' + esc(chTitle(c)) + '">Ch. ' + c + "</button>").join("") + "</div></div>" +
      '<p class="nt-count" role="status"></p><div class="nt-wrap"><table class="nt-t"><thead><tr><th>Symbole</th><th>Nom</th><th>Signification</th><th>Formule / calcul</th><th>Ch.</th></tr></thead><tbody class="nt-body"></tbody></table></div>';
    const inp = box.querySelector("input"), tbl = box.querySelector(".nt-t"), cnt = box.querySelector(".nt-count");
    function draw() {
      const nq = norm(q.trim());
      const r = rows(q, cur);
      tbl.querySelectorAll("tbody").forEach(b => b.remove());
      tbl.insertAdjacentHTML("beforeend", r.html || '<tbody><tr><td colspan="5" class="nt-empty">Aucune notation ne correspond.</td></tr></tbody>');
      box.querySelectorAll(".nt-chips button").forEach(b => b.setAttribute("aria-pressed", b.dataset.c === cur ? "true" : "false"));
      cnt.textContent = r.n + " notation" + (r.n > 1 ? "s" : "") + (cur !== "" ? " utilisée" + (r.n > 1 ? "s" : "") + " au chapitre " + cur + " · " + chTitle(cur) : " · tout le cours") + (nq ? " · recherche « " + q.trim() + " »" : "");
    }
    inp.addEventListener("input", () => { q = inp.value; draw(); });
    box.querySelector(".nt-chips").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; cur = b.dataset.c; draw(); });
    draw();
    return inp;
  }

  const INTRO = "Toutes les lettres et tous les symboles des formules du cours, un par un, y compris ceux qui ne servent qu’à calculer d’autres grandeurs. Les lignes marquées « Attention » signalent une lettre qui change de sens selon le chapitre.";
  function page() {
    document.documentElement.dataset.course = "eco";
    document.title = "Notations · Macroéconomie · Admifreeble";
    main.innerHTML = '<div class="xpage ntpage"><div class="crumbs"><a href="#accueil">Accueil</a><span>›</span><span>Environnement économique</span><span>›</span><span>Notations</span></div>' +
      '<div class="eyebrow">Environnement économique</div><h1>Tableau des notations</h1><p class="lede">' + INTRO + '</p><div class="nt-box"></div></div>';
    buildSide("eco-notations");
    mount(main.querySelector(".nt-box"), "");
    window.scrollTo(0, 0);
  }

  /* Fenêtre par-dessus un chapitre */
  let last = null;
  function open(ch) {
    close();
    last = document.activeElement;
    const m = document.createElement("div");
    m.className = "nt-modal";
    m.innerHTML = '<div class="nt-back" data-x></div><div class="nt-dlg" role="dialog" aria-modal="true" aria-labelledby="nt-h"><header><div><small>Environnement économique</small><h2 id="nt-h">Notations</h2></div>' +
      '<a class="nt-full" href="#eco-notations">Ouvrir en pleine page</a><button type="button" class="nt-x" data-x aria-label="Fermer">×</button></header><div class="nt-box"></div></div>';
    document.body.appendChild(m);
    document.documentElement.classList.add("nt-lock");
    const inp = mount(m.querySelector(".nt-box"), ch);
    m.addEventListener("click", e => { if (e.target.closest("[data-x]") || e.target.closest(".nt-c a, .nt-full")) close(); });
    setTimeout(() => { if (matchMedia("(pointer:fine)").matches) inp.focus(); else m.querySelector(".nt-x").focus(); }, 30);
  }
  function close() {
    const m = document.querySelector(".nt-modal"); if (!m) return;
    m.remove(); document.documentElement.classList.remove("nt-lock");
    if (last && last.focus) try { last.focus(); } catch (e) {}
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.querySelector(".nt-modal")) close(); });
  window.addEventListener("hashchange", close);

  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 5H7l6 7-6 7h10"/></svg>';
  window.NOTA = {
    page, open, close, count: R.length,
    side: cur => '<li class="nt-li"><a href="#eco-notations"' + (cur === "eco-notations" ? ' aria-current="page"' : "") + '><span class="n">Σ</span><span>Tableau des notations</span></a></li>',
    opt: cur => '<option value="eco-notations"' + (cur === "eco-notations" ? " selected" : "") + ">Σ · Tableau des notations</option>",
    homeLink: () => '<a class="nt-home" href="#eco-notations"><span class="nt-hi">' + ICON + '</span><span><b>Tableau des notations</b><small>' + R.length + ' lettres et symboles des formules, expliqués un par un</small></span><span class="nt-go">→</span></a>',
    btn: id => '<button type="button" class="nt-open" data-ch="' + esc(id.replace("eco-", "")) + '">' + ICON + "Notations</button>"
  };
  document.addEventListener("click", e => { const b = e.target.closest(".nt-open"); if (b) { e.preventDefault(); open(b.dataset.ch); } });
})();
