# 🎙️ Transcritor de Áudio AI (Google Gemini)

Um aplicativo web moderno, completo e de alta precisão para transcrição de áudios em português e outros idiomas, alimentado pela inteligência artificial do **Google Gemini** (`gemini-3.8-flash` e `gemini-3.5-transcribe`).

---

## ✨ Principais Recursos

- **Upload de Áudio Flexível**: Suporte a arrastar e soltar (Drag & Drop) para arquivos em **MP3, WAV, M4A, OGG, OPUS (áudios do WhatsApp), AAC, FLAC, WEBM** de até 100 MB.
- **Gravação ao Vivo**: Grave áudios diretamente pelo microfone do seu computador ou celular com medidor visual e timer.
- **Player de Áudio Integrado**: Ouça o áudio enviado ou gravado diretamente na página.
- **Identificação de Falantes (Diarização)**: Separação automática de interlocutores ("Falante 1:", "Falante 2:").
- **Marcadores de Tempo (Timestamps)**: Inserção de marcações `[MM:SS]` para acompanhar trechos com facilidade.
- **Resumo Inteligente & Ações**: Gera resumo executivo, tópicos principais discutidos e lista de tarefas/ações práticas mencionadas.
- **Legendas Prontas (SRT)**: Exporta arquivos de legenda `.srt` formatados para YouTube, Premiere, DaVinci Resolve ou VLC.
- **Formatos de Exportação**:
  - 📋 Copiar para Área de Transferência
  - 📄 Baixar Texto Simples (`.txt`)
  - 🎬 Baixar Legenda (`.srt`)
  - 📝 Baixar Relatório Completo em Markdown (`.md`)
  - 🖨️ Imprimir ou Salvar em PDF
- **Histórico Local no Navegador**: Salva as últimas transcrições para você nunca perder seu trabalho.
- **Segurança da Chave API**: Você pode salvar a chave no `.env` do servidor ou digitá-la diretamente na interface (armazenada de forma segura no seu próprio navegador).

---

## 🚀 Como Iniciar

### Opção 1: Com 1 Clique (Windows)
Basta dar um duplo clique no arquivo:
```
iniciar.bat
```
Ele iniciará o servidor e abrirá automaticamente o navegador em `http://localhost:3000`.

### Opção 2: Pelo Terminal / Prompt de Comando
```bash
node server.js
```
E acesse no seu navegador: **http://localhost:3000**

---

## 🔑 Como Obter sua Chave da API Gemini (100% Gratuita)

1. Acesse o [Google AI Studio](https://aistudio.google.com/apikey).
2. Faça login com sua conta do Google.
3. Clique no botão azul **"Create API key"** (ou "Criar chave de API").
4. Copie a chave gerada.
5. No aplicativo web, clique no botão **"Configurar Chave API"** no canto superior direito e cole sua chave.
   *(Opcional: Você também pode colar no arquivo `.env` na linha `GEMINI_API_KEY=sua_chave_aqui`).*

---

## 🌐 Como Colocar no Ar (Deploy Online)

Se você quiser que este site fique acessível na internet para você ou outras pessoas acessarem de qualquer lugar (celular, tablet ou outro computador), você pode publicá-lo gratuitamente em plataformas como:

1. **Render.com**:
   - Crie uma conta gratuita em [Render.com](https://render.com).
   - Conecte o repositório ou faça upload deste projeto como *Web Service*.
   - Defina o comando de inicialização como `npm start`.
   - Adicione a variável de ambiente `GEMINI_API_KEY` com sua chave.

2. **Railway.app** ou **Fly.io**:
   - O projeto já possui `package.json` configurado com `npm start`, funcionando de forma plug-and-play.
