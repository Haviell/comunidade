import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window.onload = () => {
    // ------------------------ SUPABASE ------------------------
    const SUPABASE_URL = "https://geaazglkznbkhthutxmb.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYWF6Z2xrem5ia2h0aHV0eG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODgyODYsImV4cCI6MjA3MjY2NDI4Nn0.5sIwkiKYscsJ8vPGiRnb2rp6X5uOoKzB_7aDGyAQd_E";
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ------------------------ SENHAS ------------------------
    const PASSWORDS = {
        MKT: "mkt123",
        Vendas: "vendas123",
        "T.I": "ti123",
        RH: "rh123",
        Logistica: "log123",
        Contabilidade: "cont123"
    };

    // ------------------------ VARIÁVEIS ------------------------
    let currentSector = null;
    let currentChat = "geral";
    let chatSubscription = null;

    // ------------------------ ELEMENTOS ------------------------
    const loginScreen = document.getElementById('loginScreen');
    const mainScreen = document.getElementById('mainScreen');
    const userSectorDisplay = document.getElementById('userSector');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const sectorSelect = document.getElementById('sector');
    const loginError = document.getElementById('loginError');

    const logoutBtn = document.getElementById('logoutBtn');
    const chatBox = document.getElementById('chatBox');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const fileBtn = document.getElementById('fileBtn');

    const scheduleMeetingForm = document.getElementById('meetingForm');
    const meetingSectorSelect = document.getElementById('meetingSector');
    const meetingDateTimeInput = document.getElementById('meetingDateTime');
    const meetingTopicInput = document.getElementById('meetingTopic');
    const scheduleMeetingDiv = document.getElementById('scheduleMeeting');

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // ------------------------ LOGIN ------------------------
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const sector = sectorSelect.value;
        const password = passwordInput.value;

        if (PASSWORDS[sector] === password) {
            currentSector = sector;
            loginScreen.style.display = "none";
            mainScreen.style.display = "block";
            userSectorDisplay.textContent = sector;
            loadChat();
            subscribeChat(currentChat);
            loadMeetings();
        } else {
            loginError.style.display = "block";
        }
    });

    // ------------------------ LOGOUT ------------------------
    logoutBtn.addEventListener("click", () => {
        currentSector = null;
        loginScreen.style.display = "block";
        mainScreen.style.display = "none";
        if (chatSubscription) supabase.removeSubscription(chatSubscription);
    });

    // ------------------------ ABAS ------------------------
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener("click", () => {
            currentChat = tab.id.replace('Tab','');
            loadChat();
            subscribeChat(currentChat);
            scheduleMeetingDiv.style.display = currentChat === "reunioes" ? "block" : "none";

            if (tab.dataset.newMessage === "true") {
                tab.style.backgroundColor = "";
                tab.dataset.newMessage = "";
            }
        });
    });

    // ------------------------ FUNÇÃO PARA ADICIONAR MENSAGEM AO CHAT ------------------------
    function addMessageToChat(msg) {
        const div = document.createElement("div");
        div.classList.add("message");
        div.innerHTML = msg.file_url
            ? `[${new Date(msg.time).toLocaleTimeString()}] ${msg.sender}: <a href="${msg.file_url}" target="_blank">📎 ${msg.text}</a>`
            : `[${new Date(msg.time).toLocaleTimeString()}] ${msg.sender}: ${msg.text}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ------------------------ CHAT ------------------------
    sendMessageBtn.addEventListener("click", async () => {
        const text = messageInput.value.trim();
        if (!text) return;

        const newMsg = {
            sector: currentChat,
            sender: currentSector,
            text,
            time: new Date().toISOString() // timestamp local
        };

        const { data, error } = await supabase.from("mensagens").insert([newMsg]).select();

        messageInput.value = "";

        const msgToShow = (data && data[0]) ? data[0] : newMsg;
        addMessageToChat(msgToShow);
    });

    // ------------------------ UPLOAD DE ARQUIVOS ------------------------
    fileBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const filePath = `${currentChat}/${Date.now()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage.from("arquivos").upload(filePath, file);
        if (uploadError) return console.error(uploadError);

        const { data: publicUrl } = supabase.storage.from("arquivos").getPublicUrl(filePath);

        const newFileMsg = {
            sector: currentChat,
            sender: currentSector,
            text: file.name,
            file_url: publicUrl.publicUrl,
            time: new Date().toISOString()
        };

        const { data, error } = await supabase.from("mensagens").insert([newFileMsg]).select();

        const msgToShow = (data && data[0]) ? data[0] : newFileMsg;
        addMessageToChat(msgToShow);
    });

    // ------------------------ CARREGAR CHAT ------------------------
    async function loadChat() {
        chatBox.innerHTML = "";

        let { data: msgs, error } = await supabase.from("mensagens")
            .select("*")
            .eq("sector", currentChat)
            .order("time", { ascending: true });

        if (error) {
            console.error("Erro ao carregar mensagens:", error);
            msgs = [];
        }

        msgs = msgs || [];

        if (msgs.length === 0) {
            const div = document.createElement("div");
            div.classList.add("message");
            div.innerHTML = "Não há mensagens para este setor.";
            chatBox.appendChild(div);
        }

        msgs.forEach(msg => addMessageToChat(msg));
    }

    // ------------------------ REALTIME ------------------------
    function subscribeChat(sector) {
        if (chatSubscription) supabase.removeSubscription(chatSubscription);

        chatSubscription = supabase
            .from(`mensagens:sector=eq.${sector}`)
            .on('INSERT', payload => {
                const msg = payload.new;

                // Evita duplicar a mensagem do próprio usuário
                if (msg.sender !== currentSector) {
                    addMessageToChat(msg);
                }

                if (currentChat !== sector) {
                    const tabBtn = document.getElementById(`${sector}Tab`);
                    if (tabBtn) {
                        tabBtn.style.backgroundColor = "#fffa65";
                        tabBtn.dataset.newMessage = "true";
                    }
                }
            })
            .subscribe();
    }

    // ------------------------ REUNIÕES ------------------------
    scheduleMeetingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await supabase.from("reunioes").insert([{
            sector: meetingSectorSelect.value,
            date_time: meetingDateTimeInput.value,
            topic: meetingTopicInput.value
        }]);
        meetingDateTimeInput.value = "";
        meetingTopicInput.value = "";
        loadMeetings();
    });

    async function loadMeetings() {
        const { data: meets } = await supabase.from("reunioes")
            .select("*")
            .order("date_time", { ascending: true });

        const meetingsList = document.createElement("ul");
        meets.forEach(meeting => {
            const li = document.createElement("li");
            li.textContent = `📅 ${new Date(meeting.date_time).toLocaleString()} - Setor: ${meeting.sector} - Assunto: ${meeting.topic}`;
            meetingsList.appendChild(li);
        });

        scheduleMeetingDiv.innerHTML = "<h3>Reuniões</h3>";
        scheduleMeetingDiv.appendChild(meetingsList);
        scheduleMeetingDiv.appendChild(scheduleMeetingForm);
    }
}
