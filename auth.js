/* Connexion par nom d'utilisateur + mot de passe, et sauvegarde de la progression
   et des post-its sur le compte (Firebase Auth + Firestore, offre gratuite).
   Le site garde ses données dans localStorage ; ce module recopie les clés
   « fiche-… » et « hub-… » vers le document Firestore users/{uid}. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteField, serverTimestamp,
  collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getCountFromServer, Timestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DOMAIN = "fiches-ieseg.example.com";      // adresse fictive : aucun e-mail n'est jamais envoyé
const ADMIN = "mat";                              // compte administrateur (doit correspondre aux règles Firestore)
const SYNCED = /^(fiche-|hub-)/;
const $ = s => document.querySelector(s);
const gate = $("#gate"), form = $("#gate-form"), msg = $("#gate-msg"), btn = $("#gate-submit");
let mode = "login", uid = null, ref = null, pending = {}, timer = null, saving = false;

/* ---------- Écran de connexion ---------- */
function showGate(state, text) {
  document.documentElement.classList.add("locked");
  gate.dataset.state = state;                    // loading | form | error
  if (text !== undefined) msg.textContent = text;
}
function setMode(m) {
  mode = m;
  document.querySelectorAll("#gate [data-mode]").forEach(b => b.setAttribute("aria-selected", b.dataset.mode === m));
  $("#gate-confirm-row").hidden = m !== "signup";
  $("#gate-confirm").required = m === "signup";
  $("#gate-pass").autocomplete = m === "signup" ? "new-password" : "current-password";
  btn.textContent = m === "signup" ? "Créer mon compte" : "Se connecter";
  $("#gate-hint").hidden = m !== "signup";
  msg.textContent = "";
}
document.querySelectorAll("#gate [data-mode]").forEach(b => b.onclick = () => setMode(b.dataset.mode));
$("#gate-eye").onclick = () => {
  const show = $("#gate-pass").type === "password";
  ["#gate-pass", "#gate-confirm"].forEach(s => $(s).type = show ? "text" : "password");
  $("#gate-eye").textContent = show ? "Masquer" : "Afficher";
};

const cleanName = s => s.trim().toLowerCase();
const ERR = {
  "auth/email-already-in-use": "Ce nom d'utilisateur est déjà pris.",
  "auth/invalid-credential": "Nom d'utilisateur ou mot de passe incorrect.",
  "auth/wrong-password": "Nom d'utilisateur ou mot de passe incorrect.",
  "auth/user-not-found": "Aucun compte avec ce nom d'utilisateur.",
  "auth/invalid-email": "Nom d'utilisateur invalide.",
  "auth/weak-password": "Mot de passe trop court : 6 caractères minimum.",
  "auth/too-many-requests": "Trop d'essais. Patiente quelques minutes avant de réessayer.",
  "auth/network-request-failed": "Pas de connexion internet.",
  "auth/operation-not-allowed": "La connexion par mot de passe n'est pas activée dans Firebase (voir le guide, étape 2)."
};

/* ---------- Démarrage ---------- */
const cfg = window.FIREBASE_CONFIG;
if (!cfg || !cfg.apiKey || String(cfg.apiKey).startsWith("COLLE")) {
  setMode("login");
  showGate("error", "Le site n'est pas encore relié à Firebase : remplis le fichier firebase-config.js (voir le guide).");
  btn.disabled = true;
} else {
  const app = initializeApp(cfg);
  const auth = getAuth(app), db = getFirestore(app);

  form.onsubmit = async e => {
    e.preventDefault();
    const name = cleanName($("#gate-user").value), pass = $("#gate-pass").value;
    if (!/^[a-z0-9._-]{3,24}$/.test(name)) { msg.textContent = "Nom d'utilisateur : 3 à 24 caractères, lettres sans accent, chiffres, point, tiret ou _."; return; }
    if (mode === "signup") {
      if (pass.length < 6) { msg.textContent = "Mot de passe trop court : 6 caractères minimum."; return; }
      if (pass !== $("#gate-confirm").value) { msg.textContent = "Les deux mots de passe ne sont pas identiques."; return; }
    }
    btn.disabled = true; msg.textContent = mode === "signup" ? "Création du compte…" : "Connexion…";
    try {
      const email = name + "@" + DOMAIN;
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, pass);
      else await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      msg.textContent = ERR[err.code] || ("Erreur : " + (err.code || err.message));
    } finally { btn.disabled = false; }
  };

  onAuthStateChanged(auth, async user => {
    if (!user) {
      uid = ref = null; pending = {};
      clearLocal();
      setMode(mode); showGate("form", "");
      setTimeout(() => $("#gate-user").focus(), 50);
      return;
    }
    showGate("loading", "Chargement de ta progression…");
    try {
      ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const data = (snap.exists() && snap.data().data) || {};
      clearLocal();
      for (const k in data) if (SYNCED.test(k) && typeof data[k] === "string") rawSet.call(localStorage, k, data[k]);
      if (!snap.exists()) await setDoc(ref, { name: user.email.split("@")[0], created: serverTimestamp(), data: {} });
      uid = user.uid;
      const name = user.email.split("@")[0];
      document.querySelectorAll(".acct-name").forEach(el => el.textContent = name);
      document.documentElement.classList.remove("locked");
      gate.dataset.state = "off";
      /* Accès aux données partagées (annonces, calendrier, tickets) pour extras.js */
      window.FB = { db, uid: user.uid, name, isAdmin: name === ADMIN,
        fs: { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getCountFromServer, Timestamp, setDoc, getDoc, serverTimestamp } };
      window.__extrasStart && window.__extrasStart();
      window.__appStart && window.__appStart();
    } catch (err) {
      showGate("error", "Impossible de charger ta progression (" + (err.code || err.message) + "). Vérifie ta connexion puis recharge la page.");
      $("#gate-retry").hidden = false;
    }
  });

  document.addEventListener("click", async e => {
    if (!e.target.closest(".acct-out")) return;
    await flush();
    try { window.__presenceOff && await window.__presenceOff(); } catch (e) {}
    await signOut(auth);
    location.replace(location.pathname);
  });
}
$("#gate-retry").onclick = () => location.reload();

/* ---------- Synchronisation localStorage → compte ---------- */
const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
function clearLocal() {
  try { Object.keys(localStorage).filter(k => SYNCED.test(k)).forEach(k => rawRemove.call(localStorage, k)); } catch (e) {}
}
function queue(k, v) {
  if (!uid || !SYNCED.test(k)) return;
  pending[k] = v;
  clearTimeout(timer); timer = setTimeout(flush, 1200);
}
Storage.prototype.setItem = function (k, v) { rawSet.call(this, k, v); if (this === localStorage) queue(k, String(v)); };
Storage.prototype.removeItem = function (k) { rawRemove.call(this, k); if (this === localStorage) queue(k, null); };

async function flush() {
  clearTimeout(timer); timer = null;
  if (saving) { timer = setTimeout(flush, 800); return; }
  if (!ref || !Object.keys(pending).length) return;
  const batch = pending; pending = {}; saving = true;
  const data = {};
  for (const k in batch) data[k] = batch[k] === null ? deleteField() : batch[k];
  try { await setDoc(ref, { data, updated: serverTimestamp() }, { merge: true }); setSync("ok"); }
  catch (e) { pending = Object.assign(batch, pending); setSync("err"); timer = setTimeout(flush, 5000); }
  finally { saving = false; if (Object.keys(pending).length && !timer) timer = setTimeout(flush, 1200); }
}
function setSync(s) {
  document.querySelectorAll(".acct-sync").forEach(el => {
    el.textContent = s === "err" ? "Hors ligne : nouvel essai…" : "Progression enregistrée sur ton compte";
    el.classList.toggle("bad", s === "err");
  });
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
window.addEventListener("pagehide", flush);
