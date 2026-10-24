
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODELOS = [
    "gemini-3.8-flash"
];

const ESPERA = ms => new Promise(resolve => setTimeout(resolve, ms));

app.get("/", (req, res) => {
    res.json({
        online: true,
        mensagem: "Servidor da IA Jasmin está online! 💗"
    });
});

async function consultarGemini(mensagem) {
    let ultimoErro = null;

    for (const modelo of MODELOS) {
        for (let tentativa = 0; tentativa < 3; tentativa++) {
            try {
                const resposta = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": GEMINI_API_KEY
                        },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{
                                    text: `Você é Jasmin, uma NPC feminina do Roblox.
Fale em português brasileiro.
Seja carinhosa, divertida, simpática e natural.
Responda diretamente ao jogador com mensagens curtas.
Use emojis ocasionalmente.
Não diga que é uma API ou um servidor.`
                                }]
                            },
                            contents: [{
                                role: "user",
                                parts: [{ text: String(mensagem) }]
                            }],
                            generationConfig: {
                                maxOutputTokens: 180
                            }
                        }),
                        signal: AbortSignal.timeout(25000)
                    }
                );

                const dados = await resposta.json();

                if (resposta.ok) {
                    const texto = dados.candidates?.[0]?.content?.parts
                        ?.map(parte => parte.text || "")
                        .join("")
                        .trim();

                    if (texto) return texto;

                    throw new Error("O Gemini retornou uma resposta vazia.");
                }

                const codigo = resposta.status;
                const detalhe = dados.error?.message || "Erro desconhecido";

                console.error(`Gemini ${modelo}: HTTP ${codigo} - ${detalhe}`);

                ultimoErro = new Error(`HTTP ${codigo}: ${detalhe}`);

                // Só repetir automaticamente em erros temporários.
                if (codigo !== 429 && codigo !== 503 && codigo < 500) {
                    throw Object.assign(ultimoErro, { permanente: true });
                }

                if (tentativa < 2) {
                    const atraso = 1500 * (2 ** tentativa);
                    console.log(`Nova tentativa em ${atraso} ms...`);
                    await ESPERA(atraso);
                }
            } catch (erro) {
                ultimoErro = erro;

                if (erro.permanente) throw erro;

                console.error("Falha na solicitação:", erro.message);

                if (tentativa < 2) {
                    await ESPERA(1500 * (2 ** tentativa));
                }
            }
        }
    }

    throw ultimoErro || new Error("A IA está temporariamente indisponível.");
}

app.post("/chat", async (req, res) => {
    try {
        const mensagem = req.body.mensagem || req.body.message;

        if (!mensagem) {
            return res.status(400).json({
                resposta: "Envie uma mensagem para a Jasmin."
            });
        }

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY não está configurada no Render.");

            return res.status(500).json({
                resposta: "Minha inteligência está temporariamente indisponível. 💗"
            });
        }

        const resposta = await consultarGemini(mensagem);

        return res.json({
            resposta,
            mensagem: resposta
        });
    } catch (erro) {
        console.error("Erro final da IA Jasmin:", erro.message);

        return res.status(502).json({
            resposta: "Desculpa, estou com dificuldades para pensar agora. Tente novamente daqui a pouquinho! 💗"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor da Jasmin iniciado na porta ${PORT}`);
});
