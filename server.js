
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

    const chave = process.env.GEMINI_API_KEY;

    if (!chave) {
      return res.status(500).json({
        erro: "A variável GEMINI_API_KEY não está configurada."
      });
    }

    const respostaIA = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": chave
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Você é Jasmin, uma NPC amigável dentro de um jogo Roblox. Responda em português brasileiro, de forma curta, carinhosa e natural. Se pedirem para seguir, parar ou voltar, converse naturalmente, mas não diga que executou o comando se o jogo não o executou."
            }]
          },
          contents: [{
            parts: [{ text: mensagem.trim() }]
          }],
          generationConfig: {
            maxOutputTokens: 150
          }
        })
      }
    );

    const dados = await respostaIA.json();

    if (!respostaIA.ok) {
      console.error("Erro da API Gemini:", {
        status: respostaIA.status,
        erro: dados.error
      });

      return res.status(502).json({
        erro: "Não foi possível obter uma resposta da IA."
      });
    }

    const texto = (dados.candidates?.[0]?.content?.parts || [])
      .map(parte => parte.text || "")
      .join("\n")
      .trim();

    res.json({
      resposta: texto || "Não consegui responder agora."
    });
  } catch (erro) {
    console.error("Erro interno:", erro.message);

    res.status(500).json({
      erro: "Erro interno no servidor."
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, "0.0.0.0", () => {
  console.log(`Servidor iniciado na porta ${porta}`);
});
