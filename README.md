# 🎙️ Transcritor do Will (`transcritordowill`)

SaaS completo e monetizável para transcrição de áudios em altíssima fidelidade, geração de resumos executivos, atas de reuniões corporativas e exportação de relatórios profissionais em PDF com 1 clique, alimentado pela IA do **Google Gemini** (`gemini-3.8-flash` e `gemini-3.5-transcribe`).

---

## ✨ Principais Funcionalidades

- **Zero Vazamento de Credenciais**: Acesso comercial 100% seguro. Usuários finais nunca veem nem precisam de chaves de API — o servidor processa tudo de forma isolada e segura.
- **Sistema Completo de Autenticação**: Cadastro, Login, Perfil de Usuário e sessões seguras via JWT com senhas criptografadas (Bcrypt).
- **Crédito Grátis de Boas-Vindas**: Novos usuários ganham automaticamente 1 crédito gratuito ao se cadastrarem para testar o serviço.
- **Planos & Checkout Pix Integrado**:
  - **Avulso (R$ 9,90)**: 1 transcrição pontual.
  - **Plano Pro (R$ 29,90/mês)**: Acesso ilimitado 30 dias com todos os templates.
  - **Escritórios / Ilimitado (R$ 79,90/mês)**: Acesso corporativo total para equipes e arquivos grandes.
  - QR Code dinâmico e código Pix Copia e Cola oficiais (BCB BRCode).
- **Identidade Visual Premium & Modo Escuro**:
  - Paleta oficial: Branco, Cinza Chumbo (`#0f172a`, `#1e293b`) e Azul Royal (`#1d4ed8`, `#2563eb`).
  - Alternador dinâmico de Modo Claro e Modo Escuro com salvamento no navegador.
- **Upload Multi-formato & Gravação ao Vivo**:
  - MP3, WAV, M4A, OGG, OPUS (áudios do WhatsApp), AAC, FLAC, WEBM até 100 MB.
  - Gravação direta pelo microfone com indicador de gravação e cronômetro em tempo real.
- **Formatos de Análise & Atas**:
  - 📊 **Resumo Executivo & Tópicos**: Síntese direta + pontos centrais em bullet points.
  - 📋 **Ata de Reunião Corporativa**: Identificação de participantes, pauta, deliberações e tabela de responsáveis com prazos.
  - 📱 **Conteúdo para Redes Sociais / LinkedIn**: Post pronto com gancho, lições e chamada para ação.
  - ❓ **Perguntas & Respostas Frequentes (FAQ)**.
  - 📄 **Apenas Transcrição Direta**: Transcrição fiel com pontuação impecável.
- **Exportação Profissional em PDF**:
  - Gera documento corporativo A4 limpo e elegante com cabeçalho da marca, blocos coloridos e transcrição integral.
  - Downloads adicionais em `.TXT`, `.SRT` (legendas) e `.MD` (Markdown).
- **Histórico Privado**: Cada usuário visualiza e gerencia exclusivamente suas próprias transcrições.

---

## 🚀 Como Executar Localmente

1. Instale as dependências:
```bash
npm install
```

2. Crie ou configure seu arquivo `.env`:
```env
GEMINI_API_KEY=sua_chave_aqui
JWT_SECRET=seu_segredo_jwt
PIX_KEY=wilsonbrenomkt@gmail.com
PIX_NAME=Transcritor do Will
PIX_CITY=SAO PAULO
PORT=3000
```

3. Inicie o servidor:
```bash
node server.js
```
Ou dê um duplo clique no arquivo:
```
iniciar.bat
```

4. Acesse: **http://localhost:3000**

---

## 🌐 Deploy em Produção (Render.com)

- O projeto já possui o arquivo `render.yaml` pronto para deploy automático.
- No dashboard do Render, certifique-se de configurar a variável de ambiente:
  - `GEMINI_API_KEY`: Sua chave do Google AI Studio.
  - `JWT_SECRET`: Uma chave secreta para as assinaturas dos tokens de login.
  - `PIX_KEY`: `wilsonbrenomkt@gmail.com`
  - `PIX_NAME`: `Transcritor do Will`
