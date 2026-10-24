
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
    res.json({
        online: true,
        mensagem: "Servidor da IA Jasmin está online! 💗"
    });
});

app.post("/chat", async (req, res) => {
    try {
        const mensagem = req.body.mensagem || req.body.message;

        if (!mensagem) {
            return res.status(400).json({
                erro: "Envie uma mensagem para a Jasmin."
            });
        }

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY não foi configurada.");
            return res.status(500).json({
                resposta: "Minha inteligência ainda não foi configurada."
            });
        }

        const respostaIA = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: `Você é Jasmin, uma NPC feminina de Roblox.
Fale sempre em português brasileiro.
Seja carinhosa, simpática, divertida e natural.
Responda como uma personagem de jogo, com mensagens curtas.
Não diga que é um servidor ou uma API.
Se o jogador conversar com você, responda diretamente ao que ele disser.
Use emojis de vez em quando, sem exagerar.`
                        }]
                    },
                    contents: [{
                        role: "user",
                        parts: [{ text: String(mensagem) }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 180
                    }
                })
            }
        );

        const dados = await respostaIA.json();

        if (!respostaIA.ok) {
            console.error("Erro da API Gemini:", {
                status: respostaIA.status,
                erro: dados.error || dados
            });

            return res.status(502).json({
                resposta: "Desculpa, não consegui pensar agora. Tente falar comigo novamente! 💗"
            });
        }

        const resposta =
            dados.candidates?.[0]?.content?.parts
                ?.map(parte => parte.text || "")
                .join("")
                .trim();

        if (!resposta) {
            console.error("A Gemini não retornou texto:", dados);

            return res.json({
                resposta: "Oi! 💗 Pode falar comigo de novo?"
            });
        }

        return res.json({
            resposta: resposta,
            mensagem: resposta
        });

    } catch (erro) {
        console.error("Erro no servidor da Jasmin:", erro);

        return res.status(500).json({
            resposta: "Ops! Tive um probleminha. Tente falar comigo novamente! 💗"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor da Jasmin iniciado na porta ${PORT}`);
});
