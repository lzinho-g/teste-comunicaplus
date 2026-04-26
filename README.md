# 📱 Comunica+

O **Comunica+** é uma plataforma digital desenvolvida para facilitar a comunicação entre cidadãos e o poder público na gestão de problemas urbanos.

O sistema permite o registro, acompanhamento e priorização de ocorrências como buracos, falhas na iluminação pública e acúmulo de lixo, promovendo maior transparência e participação da comunidade.

---

## 🚀 Tecnologias Utilizadas

- **React Native (Expo)**
- **TypeScript**
- **Firebase Firestore (Realtime Database)**
- **Zustand (gerenciamento de estado)**
- **React Navigation**
- **Expo Location / Camera**

---

## 📱 Funcionalidades

- 📌 Cadastro de ocorrências com:
  - descrição
  - imagem
  - localização (GPS)
- 🗺️ Visualização no mapa
- 📋 Listagem de ocorrências
- 👍 Sistema de votação
- 🔄 Atualização de status:
  - Aberto
  - Em andamento
  - Resolvido
- 🔁 Sincronização em tempo real com Firebase
- 🔐 Tela de login e autenticação básica
- 📊 Integração com dashboard web

---

## 🧠 Arquitetura do Sistema

O projeto é dividido em:

```text
App Mobile (React Native)
        ↓
Firebase Firestore (tempo real)
        ↓
Dashboard Web (Next.js)

Estrutura do Projeto
src/
 ├── components/        # Componentes reutilizáveis
 ├── screens/           # Telas do app
 ├── navigation/        # Navegação
 ├── services/          # Integração com Firebase
 ├── state/             # Zustand (estado global)
 ├── domain/            # Tipagens e modelos
 ├── theme/             # Cores e estilos

⚙️ Como rodar o projeto
1. Instalar dependências
npm install
2. Iniciar o projeto
npx expo start
3. Executar no celular
Baixe o Expo Go
Escaneie o QR Code
🔥 Configuração do Firebase

Arquivo:

src/services/firebase.ts

Configure com seus dados:

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID",
};

🔄 Sincronização em tempo real

O app utiliza Firebase Firestore com onSnapshot, permitindo:

Atualização automática de dados
Integração com dashboard web
Sincronização instantânea entre usuários

📊 Dashboard Web

O projeto possui um dashboard separado para administração:

👉 https://github.com/lzinho-g/comunicaplus-dashboard

Funcionalidades:

gestão de ocorrências
alteração de status
exclusão de resolvidos
gráficos e indicadores

🧪 Testes

Os testes foram realizados manualmente utilizando:

Expo Go (ambiente mobile)
Testes de fluxo completo:
cadastro
votação
sincronização
atualização de status

📌 Status do Projeto

✔ MVP funcional
✔ Integração completa com Firebase
✔ Sincronização em tempo real
✔ Dashboard administrativo

⚠️ Observações
Projeto desenvolvido para fins acadêmicos (HOW - UNIVALI)
Não possui autenticação avançada (produção)
Pode ser expandido com:
notificações
autenticação completa
deploy em produção

📄 Licença

Projeto acadêmico – uso educacional.
