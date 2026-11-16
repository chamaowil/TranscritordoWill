# 🎙️ Transcritor do Will (`transcritordowill`)

Aplicativo web completo para transcrição de áudios em alta definição, geração de resumos executivos, tópicos, atas corporativas e exportação de relatórios em PDF com 1 clique, alimentado pela IA do **Google Gemini** (`gemini-3.8-flash` e `gemini-3.5-transcribe`).

---

## ✨ Recursos

- **Identidade Visual Premium**: Interface limpa e moderna em tons de Branco, Cinza Chumbo e Azul Royal.
- **Upload Multi-formato**: Suporte a arrastar e soltar (Drag & Drop) para arquivos em **MP3, WAV, M4A, OGG, OPUS (WhatsApp), AAC, FLAC, WEBM** até 100 MB.
- **Gravação ao Vivo**: Grave direto do microfone com cronômetro em tempo real.
- **Formatos de Análise & Saída**:
  - 📊 **Resumo Executivo & Tópicos**: Resumo conciso + pontos mais importantes em tópicos.
  - 📋 **Ata de Reunião Corporativa**: Identificação de participantes, pauta, deliberações e tabela/lista de responsáveis com prazos.
  - 📱 **Conteúdo para Redes Sociais / LinkedIn**: Extrai as lições centrais em formato de post de engajamento.
  - ❓ **Perguntas & Respostas (FAQ)**: Mapeia dúvidas e respostas discutidas no áudio.
  - 📄 **Apenas Transcrição Direta**: Transcrição fiel com pontuação perfeita.
- **Exportação em PDF**: Gera relatórios corporativos A4 profissionais com cabeçalho, caixas de resumo e transcrição integral.
- **Exportações Adicionais**: Copiar texto, `.TXT`, legendas `.SRT` e Markdown `.MD`.

---

## 🚀 Como Iniciar Localmente

```bash
node server.js
```
Ou dê um duplo clique no arquivo:
```
iniciar.bat
```
Acesse no navegador: **http://localhost:3000**

---

## 🌐 Deploy no Render.com

1. Conecte este repositório no [Render.com](https://dashboard.render.com).
2. O arquivo `render.yaml` já configura tudo automaticamente.
3. Configure a variável de ambiente:
   - `GEMINI_API_KEY`: sua chave do Google AI Studio.
