const TelegramBot = require("node-telegram-bot-api");
const solanaWeb3 = require("@solana/web3.js");
const axios = require("axios");
const express = require("express");

// Replace with the token you got from BotFather
const token = "6508857375:AAF-Yj86ZW9GtMQ5VZByrXyRTz6h1zqp1o0";
let subscribers = [];
// Create a bot that uses polling to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const app = express();
app.get("/", (req, res) => {
  res.send("Univ2v3Tracker Bot!");
});

const port = 3004;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
    bot.sendMessage(chatId, "Please send a valid Solana token address!");
  }
});

bot.on("message", (msg) => {
  // Regular expression to check if the message is a Solana address
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (solanaAddressRegex.test(msg.text)) {
    const address = msg.text;
    const chatId = msg.chat.id;
    getContractDetails(address, chatId);
  } else {
    bot.sendMessage(msg.chat.id, "Please send a valid Solana token address!");
  }
});

async function getContractDetails(address, chatId) {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
    );
    const pairs = response.data.pairs;
    const pairData = response.data;
    console.log(pairData);
    const baseToken = pairs[0].baseToken.name;
    const baseSymbol = pairs[0].baseToken.symbol;
    const tokenPrice = pairs[0].priceUsd;
    const pairAddress = pairs[0].pairAddress;
    const h24Buys = pairs[0].txns.h24.buys;
    const h24Sells = pairs[0].txns.h24.sells;
    const totalTxns = h24Buys + h24Sells;
    const h24Volume = pairs[0].volume.h24;
    const h1PriceChange = pairs[0].priceChange.h1;
    const h24PriceChange = pairs[0].priceChange.h24;
    const liquidity = pairs[0].liquidity.usd;
    const fdv = pairs[0].fdv;
    const web = pairs[0].info.websites[0].url;
    const twitter = pairs[0].info.socials[0].url;
    const telegram = pairs[0].info.socials[1].url;
    const dexUrl = pairs[0].url;
    const dateCreated = pairs[0].pairCreatedAt;

    console.log(`token web: ${dexUrl}`);

    // Create a new Date object using the timestamp
    const date = new Date(dateCreated);

    // Extract date components
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Months are zero-based, so add 1
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Format the date as a string
    const formattedDate = `${year}-${month}-${day} (${hours}:${minutes}:${seconds})`;

    const dexScreenerLink = `https://dexscreener.com/solana/${pairAddress}`;
    const chartLink = `https://birdeye.so/token/${address}?chain=solana`;

    const message =
      `🔰${baseToken} (${baseSymbol})🔰\n\n` +
      `❇️ *Pair Address:* \`${pairAddress}\`\n\n` +
      `⏳ *Liquidity:* ${liquidity}\n\n` +
      `💠 *Market Cap:* ${fdv}\n\n` +
      `💵 *Price:* ${tokenPrice}\n\n` +
      `📈 H1 Price Change: ${h1PriceChange}%\n` +
      `📈 H24 Price Change: ${h24PriceChange}%\n\n` +
      `📊 24hr Volume: ${h24Volume}\n\n` +
      `*TXNs*:\n` +
      `🟢 Buys: ${h24Buys} | 🔴 Sells: ${h24Sells}\n` +
      `🔄 *Total transactions:* ${totalTxns}\n\n` +
      `📅 *Date Created:* ${formattedDate}\n\n` +
      `🌐 [Website](${web}) | 🐦 [Twitter](${twitter}) | 💬 [Telegram](${telegram})\n` +
      `🔗[DexScreener](${dexScreenerLink}) | 📊[Chart](${chartLink})`;

    console.log(message);
    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      remove_keyboard: true,
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.log(error);
  }
}
