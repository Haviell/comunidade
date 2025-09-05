// Senhas dos setores (para autenticação simples)
const PASSWORDS = {
  MKT: "mkt123",
  Vendas: "vendas123",
  "T.I": "ti123",
  RH: "rh123",
  Logistica: "log123",
  Contabilidade: "cont123"
};

// Variáveis globais
let currentSector = null;
let currentChat = "geral";
let chats = {
  geral: [],
  MKT: [],
  Vendas: [],
  "T.I": [],
  RH: [],
  Logistica: [],
  Contabilidade: []
};
let meetings = [];

// Tela de login
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const userSectorDisplay = document.getElementById('userSector');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const sectorSelect = document.getElementById('sector');
const loginError = document.getElementById('loginError');

// Tela principal
const logoutBtn = document.getElementById('logoutBtn');
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const scheduleMeetingForm = document.getElementById('meetingForm');
const meetingSectorSelect = document.getElementById('meetingSector');
const meetingDateTimeInput = document.getElementById('meetingDateTime');
const meetingTopicInput = document.getElementById('meetingTopic');
const scheduleMeetingDiv = document.getElementById('scheduleMeeting');

// Função de login
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const password = passwordInput.value;
  const sector = sectorSelect.value;

  if (PASSWORDS[sector] === password) {
      currentSector = sector;
      loginScreen.style.display = 'none';
      mainScreen.style.display = 'block';
      userSectorDisplay.textContent = sector;
      passwordInput.value = '';
      loadChat();
  } else {
      loginError.style.display = 'block';
  }
});

// Função de logout
logoutBtn.addEventListener('click', function() {
  currentSector = null;
  loginScreen.style.display = 'block';
  mainScreen.style.display = 'none';
});

// Enviar mensagem
sendMessageBtn.addEventListener('click', function() {
  const messageText = messageInput.value.trim();
  if (messageText) {
      const message = {
          sender: currentSector,
          text: messageText,
          time: new Date().toLocaleTimeString()
      };
      chats[currentChat].push(message);
      messageInput.value = '';
      loadChat();
  }
});

// Alterar aba do chat
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
      currentChat = tab.id.replace('Tab', '');
      loadChat();
  });
});

// Carregar o chat
function loadChat() {
  chatBox.innerHTML = '';
  chats[currentChat].forEach(msg => {
      const msgElement = document.createElement('div');
      msgElement.classList.add('message');
      msgElement.textContent = `[${msg.time}] ${msg.sender}: ${msg.text}`;
      chatBox.appendChild(msgElement);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Agendar reunião
scheduleMeetingForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const meetingSector = meetingSectorSelect.value;
  const dateTime = meetingDateTimeInput.value;
  const topic = meetingTopicInput.value;

  if (dateTime && topic) {
      const meeting = {
          id: Date.now(),
          sector: meetingSector,
          dateTime: dateTime,
          topic: topic
      };
      meetings.push(meeting);
      meetingDateTimeInput.value = '';
      meetingTopicInput.value = '';
      loadMeetings();
  }
});

// Carregar reuniões
function loadMeetings() {
  scheduleMeetingDiv.style.display = 'block';
  const meetingsList = document.createElement('ul');
  meetings.forEach(meeting => {
      const meetingItem = document.createElement('li');
      meetingItem.textContent = `Setor: ${meeting.sector}, Data: ${meeting.dateTime}, Assunto: ${meeting.topic}`;
      meetingsList.appendChild(meetingItem);
  });
  scheduleMeetingDiv.appendChild(meetingsList);
}
