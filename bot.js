// dependências
const express = require("express");
const qrcode = require("qrcode-terminal"); // <- agora usa terminal
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const port = process.env.PORT || 3000;

// Simulando vagas por dia
let vagas = {
  "10/08": 5,
  "12/08": 3,
  "15/08": 0,
};

// Para armazenar sessões de usuário (em memória)
let usuarios = {};

// inicializa o cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

// QR Code apenas no terminal
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Escaneie o QRCode acima para conectar o WhatsApp");
});

// WhatsApp pronto
client.on("ready", () => {
  console.log("✅ WhatsApp conectado!");
});

client.initialize();

// delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ----------------- FUNIL DE MENSAGENS -----------------
client.on("message", async (msg) => {
  if (!msg.from.endsWith("@c.us")) return;

  const numero = msg.from;
  const texto = msg.body.trim();
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const nome = contact.pushname ? contact.pushname.split(" ")[0] : "Paciente";

  await chat.sendStateTyping();
  await delay(2000);

  // === Primeiro contato / menu principal ===
  if (!usuarios[numero]) {
    usuarios[numero] = { estado: "menu" };
    await chat.sendMessage(
      `Olá, ${nome}! Sou o assistente virtual do consultório de Dra. Ana Barbosa. Sobre o que deseja falar?\n\n` +
        `1️⃣ Agendamento de consulta\n` +
        `2️⃣ Remarcação de consulta\n` +
        `3️⃣ Resultado de exames\n` +
        `4️⃣ Outros assuntos`
    );
    return;
  }

  const estado = usuarios[numero].estado;

  // === Menu principal ===
  if (estado === "menu") {
    if (texto === "1") {
      usuarios[numero].estado = "agendamento";
      let diasDisponiveis = Object.entries(vagas)
        .filter(([dia, qtd]) => qtd > 0)
        .map(([dia, qtd]) => `${dia} - ${qtd} vagas`)
        .join("\n");
      await chat.sendMessage(
        `🗓️ Dias disponíveis:\n${diasDisponiveis}\n\nPor favor, responda com a data desejada.`
      );
      return;
    } else if (texto === "2") {
      await chat.sendMessage("🔁 Em breve entraremos em contato com as datas disponíveis.");
      return;
    } else if (texto === "3") {
      usuarios[numero].estado = "aguardando_nome_exame";
      await chat.sendMessage("📋 Informe seu nome completo para enviarmos os exames.");
      return;
    } else if (texto === "4") {
      usuarios[numero].estado = "outros_assuntos";
      await chat.sendMessage(
        "✉️ Informe o assunto que deseja tratar e retornaremos em breve."
      );
      return;
    } else {
      await chat.sendMessage("❌ Opção inválida. Responda com 1, 2, 3 ou 4.");
      return;
    }
  }

  // === Agendamento ===
  if (estado === "agendamento") {
    if (vagas[texto] && vagas[texto] > 0) {
      vagas[texto] -= 1;
      usuarios[numero].estado = "aguardando_confirmacao";
      usuarios[numero].dia_escolhido = texto;
      await chat.sendMessage(
        `✅ Você escolheu o dia ${texto}. Aguardando a confirmação do seu agendamento.`
      );
    } else {
      await chat.sendMessage(
        "❌ Data inválida ou sem vagas. Por favor, escolha outra data."
      );
    }
    return;
  }

  // === Resultado de exames ===
  if (estado === "aguardando_nome_exame") {
    usuarios[numero].nome_exame = texto;
    usuarios[numero].estado = "menu";
    await chat.sendMessage("📨 Obrigado! Em breve você receberá seus exames.");
    return;
  }

  // === Outros assuntos ===
  if (estado === "outros_assuntos") {
    usuarios[numero].assunto = texto;
    usuarios[numero].estado = "menu";
    await chat.sendMessage(
      "📌 Obrigado! Seu assunto foi registrado. Retornaremos em breve."
    );
    return;
  }
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>WhatsApp Bot</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <h2>✅ WhatsApp rodando. Confira o terminal para o QRCode.</h2>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
