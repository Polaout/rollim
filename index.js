// index.js
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Regex: pega "XdY" ou "dY"
const diceRegex = /\b(?:(\d{0,2})d(\d{1,4}))\b/gi;

client.on("clientReady", () => {
  console.log(`🤖 Logado como ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  let safeExpr = message.content.replace(/\s+/g, ""); // tira espaços
  let rollsDetails = [];

  // substitui os dados pelos valores rolados
  safeExpr = safeExpr.replace(diceRegex, (match, qtdStr, ladosStr) => {
    let qtd = parseInt(qtdStr || "1", 10);
    let lados = parseInt(ladosStr, 10);

    if (qtd < 1 || qtd > 10) return match;
    if (lados < 1 || lados > 1000) return match;

    let rolls = [];
    for (let i = 0; i < qtd; i++) {
      let result = Math.floor(Math.random() * lados) + 1;
      let decorated = result.toString();

      if (result === 1) decorated += "👹";       // mínimo
      if (result === lados) decorated += "✨";   // máximo
      if (lados < 20 && result > Math.floor(lados / 2)) {
        decorated += "💥"; // ataque forte
      }

      rolls.push(decorated);
    }

    let total = rolls
      .map((r) => parseInt(r))
      .reduce((a, b) => a + b, 0);

    rollsDetails.push(`[${rolls.join(", ")}] ${qtd}d${lados}`);

    return total.toString();
  });

  try {
    if (/^[0-9+\-*/().\s]+$/.test(safeExpr)) {
      const result = Function(`"use strict"; return (${safeExpr});`)();

      if (rollsDetails.length > 0) {
        message.reply(
          `\`\` ${result} \`\` ⟵ ${rollsDetails.join(" + ")}  ${safeExpr}`
        );
      }
    }
  } catch (err) {
    console.error("Erro ao avaliar expressão:", err);
  }
});

client.login(process.env.TOKEN);
