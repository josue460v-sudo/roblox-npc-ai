
const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    mensagem: "Servidor de IA do NPC Roblox funcionando!"
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (typeof mensagem !== "string" || !mensagem.trim()) {
      return res.status(400).json({
        erro: "Envie uma mensagem válida."
      });
    }

    const chave = process.env.OPENAI_API_KEY;

    if (!chave) {
      return res.status(500).json({
        erro: "A chave da IA ainda não foi configurada no servidor."
      });
    }

    const respostaIA = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${chave}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "Você é um NPC amigável dentro de um jogo Roblox. Responda em português brasileiro, de forma curta e natural. Se pedirem para seguir, parar ou voltar, explique que o jogo precisa executar esse comando.",
          input: mensagem,
          max_output_tokens: 150
        })
      }
    );

    const dados = await respostaIA.json();

    if (!respostaIA.ok) {
      console.error("Erro da API:", dados);
      return res.status(502).json({
        erro: "Não foi possível obter uma resposta da IA."
      });
    }

    const texto = (dados.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    res.json({
      resposta: texto || "Não consegui responder agora."
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Erro interno no servidor."
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, "0.0.0.0", () => {
  console.log(`Servidor iniciado na porta ${porta}`);
});
