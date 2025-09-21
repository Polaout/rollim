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

// Regex: pega "XdY" ou "dY" ou "#dY"
const diceRegex = /(?:(\d+)?#)?(\d{0,2})d(\d{1,4})/gi;

client.on("ready", () => {
  console.log(`🤖 Logado como ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  let inputExpr = message.content.replace(/\s+/g, ""); // tira espaços
  let rollsDetails = [];
  let expandedExpr = inputExpr;

  // substitui os dados pelos valores rolados
  expandedExpr = expandedExpr.replace(diceRegex, (match, repeatStr, qtdStr, ladosStr) => {
    let repeat = parseInt(repeatStr || "1", 10); // número de vezes de repetição do tipo #d20
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

        if (result === 1) decorated += "👹";       // mínimo
        if (result === lados) decorated += "✨";   // máximo
        if (lados < 20 && result > Math.floor(lados / 2)) {
          decorated += "💥"; // ataque forte
        }

        rolls.push(decorated);
      }

      let total = rolls.map(r => parseInt(r)).reduce((a, b) => a + b, 0);
      total = Math.max(total, 0); // garante que o resultado mínimo seja 0

      rollsDetails.push(`\`\` ${total} \`\` ⟵ [${rolls.join(", ")}] ${qtd}d${lados}`);
      resultsArray.push(total);
    }

    // se for #d, não substituímos por soma, apenas retorna os resultados para expressão principal
    // se repeat === 1, podemos retornar total
    return resultsArray.reduce((a, b) => a + b, 0).toString();
  });

  try {
    if (/^[0-9+\-*/().\s]+$/.test(expandedExpr)) {
      let result = Function(`"use strict"; return (${expandedExpr});`)();
      result = Math.max(result, 0); // garante que o resultado final seja >= 0

      if (rollsDetails.length > 0) {
        message.reply(
          `${rollsDetails.join("\n")}  ${expandedExpr}`
        );
      }
    }
  } catch (err) {
    console.error("Erro ao avaliar expressão:", err);
  }
});

client.login(process.env.TOKEN);
