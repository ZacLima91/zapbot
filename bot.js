// dependências
const express = require("express");
const qrcode = require("qrcode");
const {
  Client,
  LocalAuth,
  Buttons,
  List,
  MessageMedia,
} = require("whatsapp-web.js");

const app = express();
const port = process.env.PORT || 3000;

// variável global para guardar o QR atual
let qrCodeData = null;

// inicializa o cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session" }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// serviço de leitura do qr code
client.on("qr", async (qr) => {
  qrCodeData = await qrcode.toDataURL(qr); // converte para imagem base64
  console.log("📲 QRCode gerado, acesse http://localhost:" + port);
});

// quando o WhatsApp conectar
client.on("ready", () => {
  console.log("✅ Tudo certo! WhatsApp conectado.");
  qrCodeData = null; // limpa o QRCode
});

// inicializa
client.initialize();

// função de delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ----------------- FUNIL DE MENSAGENS -----------------
client.on("message", async (msg) => {
  if (
    msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) &&
    msg.from.endsWith("@c.us")
  ) {
    const chat = await msg.getChat();
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    const contact = await msg.getContact();
    const name = contact.pushname;
    await client.sendMessage(
      msg.from,
      `Olá, ${name.split(" ")[0]}! Sou o assistente virtual do consultório de Dra. Ana Barbosa. Como posso ajudá-lo(a) hoje? 
Por favor, digite uma das opções abaixo:

1 - Como funciona
2 - Valores dos planos
3 - Benefícios
4 - Como aderir
5 - Outras perguntas`
    );
    await delay(3000);
    await chat.sendStateTyping();
  }

  if (msg.body === "1" && msg.from.endsWith("@c.us")) {
    const chat = await msg.getChat();
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(
      msg.from,
      "Nosso serviço oferece consultas médicas 24 horas por dia, 7 dias por semana, diretamente pelo WhatsApp.\n\nNão há carência, o que significa que você pode começar a usar nossos serviços imediatamente após a adesão.\n\nOferecemos atendimento médico ilimitado, receitas\n\nAlém disso, temos uma ampla gama de benefícios, incluindo acesso a cursos gratuitos"
    );
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(
      msg.from,
      "COMO FUNCIONA?\nÉ muito simples.\n\n1º Passo\nFaça seu cadastro e escolha o plano que desejar.\n\n2º Passo\nApós efetuar o pagamento do plano escolhido você já terá acesso a nossa área exclusiva para começar seu atendimento na mesma hora.\n\n3º Passo\nSempre que precisar"
    );
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(msg.from, "Link para cadastro: https://site.com");
  }

  if (msg.body === "2" && msg.from.endsWith("@c.us")) {
    const chat = await msg.getChat();
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(
      msg.from,
      "*Plano Individual:* R$22,50 por mês.\n\n*Plano Família:* R$39,90 por mês, inclui você mais 3 dependentes.\n\n*Plano TOP Individual:* R$42,50 por mês, com benefícios adicionais como\n\n*Plano TOP Família:* R$79,90 por mês, inclui você mais 3 dependentes"
    );
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(msg.from, "Link para cadastro: https://site.com");
  }

  if (msg.body === "3" && msg.from.endsWith("@c.us")) {
    const chat = await msg.getChat();
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(
      msg.from,
      "Sorteio de prêmios todo ano.\n\nAtendimento médico ilimitado 24h por dia.\n\nReceitas de medicamentos"
    );
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(msg.from, "Link para cadastro: https://site.com");
  }

  if (msg.body === "4" && msg.from.endsWith("@c.us")) {
    const chat = await msg.getChat();
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(
      msg.from,
      "Você pode aderir aos nossos planos diretamente pelo nosso site ou pelo WhatsApp.\n\nApós a adesão, você terá acesso imediato"
    );
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(msg.from, "Link para cadastro: https://site.com");
  }

  if (msg.body === "5" && msg.from.endsWith("@c.us")) {
    const chat = await msg.getChat();
    await delay(3000);
    await chat.sendStateTyping();
    await delay(3000);
    await client.sendMessage(
      msg.from,
      "Se você tiver outras dúvidas ou precisar de mais informações, por favor, fale aqui nesse WhatsApp ou visite nosso site: https://site.com"
    );
  }
});

// ----------------- FRONTEND HTML -----------------
app.get("/", (req, res) => {
  if (qrCodeData) {
    res.send(`
      <html>
        <head>
          <title>Conectar WhatsApp</title>
        </head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;">
          <h2>Escaneie o QRCode abaixo no seu WhatsApp</h2>
          <img src="${qrCodeData}" />
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <head>
          <title>WhatsApp</title>
        </head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <h2>✅ WhatsApp já conectado!</h2>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});


