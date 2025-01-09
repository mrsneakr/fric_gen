import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { Connection, Transaction } from "@solana/web3.js";

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

const lamportsPerSol = solanaWeb3.LAMPORTS_PER_SOL;
let walletPublicKey = null;

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

const networkUrl = "https://api.mainnet-beta.solana.com";
const connection = new Connection(networkUrl);
let walletAddress = null;

const connectWalletButton = document.getElementById("connectWalletButton");
const walletStatus = document.getElementById("walletStatus");

// Verbindung zur Wallet herstellen
async function connectWallet() {
    try {
        const provider = window.solana;
        if (!provider) {
            alert("Phantom Wallet is not installed. Please install it first!");
            return;
        }

        const response = await provider.connect();
        walletAddress = response.publicKey.toString();
        walletStatus.textContent = `Connected: ${walletAddress}`;
        connectWalletButton.textContent = "Wallet Connected";
        connectWalletButton.disabled = true;
    } catch (error) {
        console.error("Wallet connection failed:", error);
    }
}

connectWalletButton.addEventListener("click", connectWallet);

async function payWithFric() {
    if (!walletAddress) {
        alert("Please connect your wallet first!");
        return;
    }

    try {
        const transaction = new Transaction();
        // Replace with your actual recipient address and amount
        const recipientAddress = "RecipientPublicKeyHere";
        const lamports = 100000; // Amount to transfer in lamports

        transaction.add(
            SystemProgram.transfer({
                fromPubkey: walletAddress,
                toPubkey: recipientAddress,
                lamports: lamports,
            })
        );

        const signedTransaction = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());

        alert(`Transaction sent: ${signature}`);
    } catch (error) {
        console.error("Transaction failed:", error);
        alert("Transaction failed. Please try again.");
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
    const weightedAssets = assets.flatMap((asset) =>
      Array(rarityWeights[asset.rarity]).fill(asset)
    );
    selectedAssets[layer] = weightedAssets[Math.floor(Math.random() * weightedAssets.length)];
    document.getElementById(layer).src = selectedAssets[layer].src;
  }

  currentRank = calculateRank(selectedAssets);
  updateAttributes(selectedAssets, currentRank);
}

function calculateRank(assets) {
  const probabilities = Object.values(assets).map((asset) => rarityWeights[asset.rarity] / 100);
  const combinedProbability = probabilities.reduce((prod, prob) => prod * prob, 1);
  const rank = Math.ceil(1 / combinedProbability);
  return rank;
}

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

document.getElementById("randomizeButton").addEventListener("click", () => {
    payWithFric(); // Charge before randomization
    randomizeCharacter();
});

// Initialisieren
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
