import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Solana Web3.js CDN
const solanaWeb3 = window.solanaWeb3; // Wird von CDN geladen

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDVtb9rKrhW4qhPuEpL3bSRTEAr0i_ZrlI",
  authDomain: "fric-generator.firebaseapp.com",
  databaseURL: "https://fric-generator-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fric-generator",
  storageBucket: "fric-generator.firebasestorage.app",
  messagingSenderId: "843112915879",
  appId: "1:843112915879:web:714f87a5ef147470f30c82",
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let walletPublicKey = null;
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"), "confirmed");

// Layers und Wahrscheinlichkeitswerte
const layers = {
  head: [
    { src: "head1.png", rarity: "common" },
    { src: "head2.png", rarity: "rare" },
    { src: "head3.png", rarity: "legendary" },
  ],
  arms: [
    { src: "arms1.png", rarity: "uncommon" },
    { src: "arms2.png", rarity: "common" },
    { src: "arms3.png", rarity: "epic" },
    { src: "arms4.png", rarity: "rare" },
  ],
  eyes: [
    { src: "eyes1.png", rarity: "common" },
    { src: "eyes2.png", rarity: "uncommon" },
    { src: "eyes3.png", rarity: "epic" },
    { src: "eyes4.png", rarity: "legendary" },
  ],
  mouth: [
    { src: "mouth1.png", rarity: "rare" },
    { src: "mouth2.png", rarity: "common" },
    { src: "mouth3.png", rarity: "uncommon" },
    { src: "mouth4.png", rarity: "epic" },
    { src: "mouth5.png", rarity: "legendary" },
    { src: "mouth6.png", rarity: "common" },
  ],
  accessories: [
    { src: "accessorie1.png", rarity: "common" },
    { src: "accessorie2.png", rarity: "uncommon" },
    { src: "accessorie3.png", rarity: "epic" },
    { src: "accessorie4.png", rarity: "legendary" },
  ],
};

const rarityWeights = { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 };
const rarityPoints = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const rarityColors = {
  common: "rarity-common",
  uncommon: "rarity-uncommon",
  rare: "rarity-rare",
  epic: "rarity-epic",
  legendary: "rarity-legendary",
};

// Berechnung aller möglichen Kombinationen
let allCombinations = [];
function calculateAllCombinations() {
  const layersArray = Object.values(layers);

  function combine(current, depth) {
    if (depth === layersArray.length) {
      const probability = current.reduce(
        (prob, asset) => prob * (rarityWeights[asset.rarity] / 100),
        1
      );
      allCombinations.push({ assets: current, probability });
      return;
    }
    for (const asset of layersArray[depth]) {
      combine([...current, asset], depth + 1);
    }
  }
  combine([], 0);

  // Sortiere Kombinationen nach Wahrscheinlichkeit (seltenste zuerst)
  allCombinations.sort((a, b) => a.probability - b.probability);
}

calculateAllCombinations();

function getRank(selectedAssets) {
  const selectedCombination = Object.values(selectedAssets).map((asset) => asset.src);
  for (let i = 0; i < allCombinations.length; i++) {
    const combination = allCombinations[i].assets.map((asset) => asset.src);
    if (JSON.stringify(selectedCombination) === JSON.stringify(combination)) {
      return i + 1; // 1-basierte Rangliste
    }
  }
  return allCombinations.length; // Fallback
}

// Prüfen, ob Phantom Wallet installiert ist
function isPhantomInstalled() {
  return window.solana && window.solana.isPhantom;
}

// Verbindung zur Wallet herstellen
async function connectWallet() {
  if (!isPhantomInstalled()) {
    alert("Phantom Wallet is not installed! Please install it first.");
    return;
  }

  try {
    const response = await window.solana.connect();
    walletPublicKey = response.publicKey.toString();
    document.getElementById("walletStatus").innerText = `Connected: ${walletPublicKey}`;
    document.getElementById("connectWalletButton").innerText = "Wallet Connected";
  } catch (error) {
    console.error("Wallet connection failed:", error);
  }
}

// Zahlung mit Fric (SPL-Token)
async function payWithFric() {
  if (!walletPublicKey) {
    alert("Please connect your wallet first!");
    return false;
  }

  try {
    // Adresse des Empfängers und des Fric-Tokens
    const recipient = new solanaWeb3.PublicKey("6Y16GQTbeUSQga6McvkzX8JM96GUD8HYX155PmdwgBun"); // Wallet-Adresse, die Fric empfängt
    const tokenMintAddress = new solanaWeb3.PublicKey("EsP4kJfKUDLfX274WoBSiiEy74Sh4tZKUCDjfULHpump"); // Fric-Token Mint-Adresse

    // Erstelle eine Verbindung zu Solana
    const senderPublicKey = new solanaWeb3.PublicKey(walletPublicKey);

    // Token-Account des Senders und des Empfängers finden
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderPublicKey,
      tokenMintAddress,
      senderPublicKey
    );
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      senderPublicKey,
      tokenMintAddress,
      recipient
    );

    // Überweisungsbetrag (10 Fric in Lamports)
    const amount = 10 * Math.pow(10, 6); // Fric hat 6 Dezimalstellen

    // Erstelle die Transaktion
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.Token.createTransferInstruction(
        solanaWeb3.TOKEN_PROGRAM_ID,
        senderTokenAccount.address,
        recipientTokenAccount.address,
        senderPublicKey,
        [],
        amount
      )
    );

    // Füge Blockhash und FeePayer hinzu
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKey;

    // Signiere und sende die Transaktion
    const signedTransaction = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature);

    alert(`Transaction successful! Signature: ${signature}`);
    return true;
  } catch (error) {
    console.error("Transaction failed:", error);
    alert("Transaction failed. Please try again.");
    return false;
  }
}

// Globale Variable, um den aktuellen Rank zu speichern
let currentRank = null;

// Funktionen für Charakter und Attribute
async function randomizeCharacter() {
  const paymentSuccess = await payWithFric();
  if (!paymentSuccess) return;

  const selectedAssets = {};
  for (const layer in layers) {
    const assets = layers[layer];
    const weightedAssets = assets.flatMap((asset) => Array(rarityWeights[asset.rarity]).fill(asset));
    selectedAssets[layer] = weightedAssets[Math.floor(Math.random() * weightedAssets.length)];
    document.getElementById(layer).src = selectedAssets[layer].src;
  }

  const rank = calculateRank(selectedAssets);
  updateAttributes(selectedAssets, rank);
}

function calculateRank(assets) {
  const probabilities = Object.values(assets).map((asset) => rarityWeights[asset.rarity] / 100);
  const combinedProbability = probabilities.reduce((prod, prob) => prod * prob, 1);
  const rank = Math.ceil(1 / combinedProbability);
  return rank;
}

// Attribut-Updates
function updateAttributes(assets, rank) {
  const attributesContainer = document.querySelector(".attributes");
  attributesContainer.innerHTML = Object.entries(assets)
    .map(
      ([layer, asset]) =>
        `<div class="attribute">
          <div class="name">${layer}</div>
          <div class="value">${asset.src.replace(".png", "")}</div>
          <div class="rarity ${rarityColors[asset.rarity]}">${asset.rarity.toUpperCase()}</div>
        </div>`
    )
    .join("");

  const scoreSection = document.querySelector(".score-section");
  scoreSection.innerHTML = `<div>Rank: ${rank}</div>`;
}

// Bild-Download mit Rank und Name
function downloadCharacterImage() {
  const name = document.getElementById("nameInput").value || "Unnamed";
  const rankText = document.querySelector(".score-section").textContent.match(/Rank: (\d+)/);
  const rank = rankText ? rankText[1] : "Unknown";

  // Bild herunterladen
  html2canvas(document.getElementById("previewContainer")).then((canvas) => {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const context = finalCanvas.getContext("2d");

    context.drawImage(canvas, 0, 0);

    context.font = "24px 'Patrick Hand'";
    context.fillStyle = "#000000";
    context.textAlign = "left";
    context.fillText(`Rank ${rank} - ${name}`, 20, 980);

    const fileName = `Fric_${name.replace(/\s+/g, "_")}_Rank${rank}.png`;
    const link = document.createElement("a");
    link.href = finalCanvas.toDataURL("image/png");
    link.download = fileName;
    link.click();
  });

  // Leaderboard aktualisieren
  updateLeaderboard(name, rank);
}

document.getElementById("connectWalletButton").addEventListener("click", connectWallet);
document.getElementById("downloadButton").addEventListener("click", downloadCharacterImage);
document.getElementById("randomizeButton").addEventListener("click", randomizeCharacter);

// Initialisieren
document.addEventListener("DOMContentLoaded", () => {
  if (!isPhantomInstalled()) {
    alert("Phantom Wallet is not installed!");
  }
});
randomizeCharacter();
renderLeaderboard();

function updateLeaderboard(name, rank) {
  const leaderboardRef = ref(db, "leaderboard/");
  push(leaderboardRef, { name, rank });
}

function renderLeaderboard() {
  const leaderboardRef = ref(db, "leaderboard/");
  onValue(leaderboardRef, (snapshot) => {
    const leaderboard = [];
    snapshot.forEach((childSnapshot) => {
      leaderboard.push(childSnapshot.val());
    });

    leaderboard.sort((a, b) => a.rank - b.rank);

    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = leaderboard
      .slice(0, 10)
      .map((entry, index) => `<li>#${index + 1}: ${entry.name} (Rank ${entry.rank})</li>`)
      .join("");
  });
}
