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

// Regex: pega "XdY", "dY" ou "#dY"
const diceRegex = /(?:(\d+)?#)?(\d{0,2})d(\d{1,4})/gi;

client.on("ready", () => {
  console.log(`🤖 Logado como ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  let inputExpr = message.content.replace(/\s+/g, ""); // remove espaços
  let rollsDetails = [];
  let expandedExpr = inputExpr;

  // Substitui os dados pelos valores rolados
  expandedExpr = expandedExpr.replace(diceRegex, (match, repeatStr, qtdStr, ladosStr) => {
    let repeat = parseInt(repeatStr || "1", 10); // número de repetições tipo #d20
    let qtd = parseInt(qtdStr || "1", 10);
    let lados = parseInt(ladosStr, 10);

    if (qtd < 1 || qtd > 10) return match;
    if (lados < 1 || lados > 1000) return match;

    let resultsArray = [];

    for (let r = 0; r < repeat; r++) {
      let rolls = [];
      for (let i = 0; i < qtd; i++) {
        let result = Math.floor(Math.random() * lados) + 1;
        let decorated = result.toString();

        // Emojis
        if (result === 1) decorated += "👹";       // mínimo
        else if (result === lados) decorated += "✨";   // máximo
        else if (lados < 20 && result > Math.floor(lados / 2)) decorated += "💥"; // ataque forte

        rolls.push(decorated);
      }

      const total = rolls.map(r => parseInt(r)).reduce((a, b) => a + b, 0);
      resultsArray.push(total);

      // Adiciona cada repetição como linha separada
      rollsDetails.push(`\`\` ${Math.max(total, 0)} \`\` ⟵ [${rolls.join(", ")}] ${qtd}d${lados}`);
    }

    // Para expressão principal, se repeat > 1 retornamos 0, pois cada repetição é mostrada separadamente
    return repeat === 1 ? resultsArray[0].toString() : "0";
  });

  // Avalia a expressão aritmética final
  try {
    if (/^[0-9+\-*/().\s]+$/.test(expandedExpr)) {
      let result = Function(`"use strict"; return (${expandedExpr});`)();
      result = Math.max(result, 0); // resultado mínimo 0

      if (rollsDetails.length > 0) {
        // Mostra resultado final como nas linhas individuais
        message.reply(`${rollsDetails.join("\n")}  ${inputExpr}`);
      }
    }
  } catch (err) {
    console.error("Erro ao avaliar expressão:", err);
  }
});

client.login(process.env.TOKEN);
