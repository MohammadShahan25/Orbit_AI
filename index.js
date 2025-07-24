
// A debouncer function to limit the rate at which a function gets called.
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


document.addEventListener('DOMContentLoaded', () => {

    const App = {
        state: {},
        pomodoroInterval: null,
        notepadSaveTimeout: null,
        notepadCtx: null,
        isNotepadDrawing: false,

        personas: {
            commander: { name: "Commander Atlas", avatar: "fa-user-shield", systemInstruction: "You are Commander Atlas, a stern and disciplined AI leader. Your responses should be concise, direct, and mission-oriented. Address the user as 'Cadet'. Provide clear, actionable intelligence. No extraneous pleasantries." },
            professor: { name: "Professor Nova", avatar: "fa-user-graduate", systemInstruction: "You are Professor Nova, a knowledgeable and eloquent academic AI. Your responses should be detailed, well-structured, and educational. Use analogies and provide context. Cite principles where applicable. Encourage deep understanding." },
            zoe: { name: "Zoe", avatar: "fa-user-astronaut", systemInstruction: "You are Zoe, a friendly, enthusiastic, and encouraging AI companion. Your tone is upbeat and supportive. Use emojis where appropriate. Make learning feel like an exciting adventure. You're a partner, not just a tool." },
            custom: { name: "Custom", avatar: "fa-user-pen", systemInstruction: "You are a helpful AI assistant." },
        },
        tools: [
             {
                id: 'quizzer', name: 'AI Quizzer', icon: 'fa-question-circle', description: 'Generate interactive quizzes from your notes or any block of text.',
                promptLabel: "Paste your notes or text to generate a quiz from:", type: "textarea"
             },
            {
                id: 'essay-assistant', name: 'Essay Assistant', icon: 'fa-feather-alt', description: 'Brainstorm personal statements or tailor supplemental "Why this college?" essays.', promptLabel: 'For a supplemental essay, paste the prompt first. Otherwise, describe your topic or life experiences.', type: 'textarea',
                systemInstruction: "You are an expert college essay advisor. If the user provides a specific prompt, tailor a response that directly answers it by connecting their experiences to the prompt's requirements. If they provide general experiences, help them brainstorm unique, compelling narrative angles for a personal statement. Focus on structure, vivid storytelling, and authenticity."
            },
            {
                id: 'college-matchmaker', name: 'College Matchmaker', icon: 'fa-university', description: 'Recommends "reach," "match," and "safety" schools based on your profile and preferences.', promptLabel: 'Enter your GPA, test scores (if any), desired majors, location preferences, and interests:', type: 'textarea'
            },
             {
                id: 'extracurricular-polisher', name: 'Extracurricular Polisher', icon: 'fa-award', description: 'Refine descriptions of your activities to be concise and impactful for applications.', promptLabel: 'Describe one of your extracurricular activities in your own words:', type: 'textarea'
            },
            {
                id: 'interview-simulator', name: 'Interview Simulator', icon: 'fa-user-tie', description: 'Practice for a college or job interview with a realistic AI interviewer.', isInteractive: true // Special flag
            },
            { id: 'flashcards', name: 'Flashcard Creator', icon: 'fa-clone', description: 'Generate flashcards from study material.', promptLabel: "Paste your terms and definitions or a block of text:", type: "textarea",
              systemInstruction: "You are a Flashcard Creator AI. Your task is to extract key terms and their corresponding definitions from the user's text. Format the output as a JSON array where each object has a 'term' and a 'definition' key. Do not add any conversational text. Just return the JSON." },
            { id: 'simplifier', name: 'Explain Like I\'m 5', icon: 'fa-child', description: 'Simplify complex topics.', promptLabel: "Paste the complex text you want simplified:", type: "textarea",
              systemInstruction: "You are an expert simplifier. Your task is to re-explain the user's provided text as if you were talking to a very curious 5-year-old. Use simple words, short sentences, and relatable analogies. Avoid jargon entirely. The goal is to make the core concept understandable to anyone, regardless of their background knowledge." },
            { id: 'document-processor', name: 'Document Analyzer', icon: 'fa-file-alt', description: 'Get a summary from text or a .txt file.', promptLabel: 'Paste text below or upload a .txt file.', type: 'textarea',
              systemInstruction: "You are a Document Analyzer AI. Your sole task is to provide a concise, well-structured summary of the provided text. Identify the main points and key takeaways. Use bullet points for clarity. Do not engage in conversational chat." },
            { id: 'memory-palace', name: 'Memory Palace', icon: 'fa-brain', description: 'Generate a story to remember keywords.', promptLabel: 'Enter keywords (comma-separated) to remember:', type: 'text',
              systemInstruction: "You are a Memory Palace AI. The user will provide a list of keywords. Your task is to weave these keywords into a short, vivid, and funny story using the method of loci. The story should be memorable and clearly incorporate each keyword in order." },
            { id: 'paraphraser', name: 'Paraphrasing Assistant', icon: 'fa-random', description: 'Rephrase text to improve style.', promptLabel: 'Paste the text you want to rephrase:', type: 'textarea',
              systemInstruction: "You are a Paraphrasing Assistant. Your sole purpose is to rephrase the user's text to improve its style, clarity, and flow. Do not add any conversational text, explanations, or introductions. Directly provide ONLY the paraphrased version of the text." },
            { id: 'study-planner', name: 'Study Planner', icon: 'fa-calendar-alt', description: 'Generate a study schedule.', promptLabel: 'What do you need to study for and what are your deadlines?', type: 'textarea',
              systemInstruction: "You are a Study Planner AI. The user will provide their study goals and deadlines. Your task is to generate a detailed, actionable study schedule. Break down the topics into manageable chunks and assign them to specific days or time blocks leading up to the deadline. The output should be a clear, easy-to-read schedule formatted with Markdown." },
            { id: 'socratic', name: 'Socratic Partner', icon: 'fa-comments', description: 'Deepen knowledge with probing questions.', promptLabel: 'What topic do you want to discuss?', type: 'text',
              systemInstruction: "You are a Socratic Partner. Your role is to help the user deepen their knowledge by asking thought-provoking questions. Do NOT provide answers or summaries. ONLY respond with questions that challenge the user's assumptions and encourage them to think more deeply about the topic they provided. Start the conversation with a question." },
            { id: 'language', name: 'Language Lab', icon: 'fa-language', description: 'Practice language skills.', promptLabel: 'What language do you want to practice and in what scenario?', type: 'text',
              systemInstruction: "You are a Language Lab AI. The user will specify a language and a scenario. Your task is to engage them in a realistic, interactive conversation in that language, playing the other role in the scenario. Keep your responses in the target language unless the user asks for a translation or explanation in English." },
            { id: 'research', name: 'Research Assistant', icon: 'fa-book-reader', description: 'Get a summary on a research topic.', promptLabel: 'What research topic do you need help with?', type: 'text',
              systemInstruction: "You are a Research Assistant AI. The user will provide a research topic. Your task is to provide a concise, well-structured summary of that topic, including key points, main arguments, and important figures or dates. Use clear headings and bullet points for readability. Do not engage in conversational chat." },
            { id: 'presentation', name: 'Presentation Writer', icon: 'fa-person-chalkboard', description: 'Generate a presentation script.', promptLabel: 'What is the topic and goal of your presentation?', type: 'textarea',
              systemInstruction: "You are a Presentation Writer AI. The user will provide a topic and a goal for a presentation. Your task is to generate a script for that presentation, complete with slide-by-slide talking points. Structure the output clearly with headings like 'Slide 1: Title', 'Slide 2: Introduction', etc. The script should be engaging and directly address the user's specified goal." },
            { id: 'code', name: 'Code Debugger', icon: 'fa-code', description: 'Get a fix and explanation for buggy code.', promptLabel: 'Paste your buggy code snippet:', type: 'textarea',
              systemInstruction: "You are a Code Debugger AI. The user will provide a buggy code snippet. Your task is to identify the bug, provide the corrected code, and give a clear, step-by-step explanation of what was wrong and how the fix works. Format the output with the corrected code in a code block first, followed by the explanation." },
            { id: 'historical', name: 'Historical Interview', icon: 'fa-landmark', description: '"Interview" a historical figure.', promptLabel: 'Which historical figure would you like to interview?', type: 'text',
              systemInstruction: "You are a Historical Interview AI. The user will name a historical figure. Your task is to adopt the persona of that figure and answer the user's questions as they would have, based on their known personality, beliefs, and historical context. Maintain the persona throughout the conversation. Start by introducing yourself as that figure." },
            { id: 'mapper', name: 'Argument Mapper', icon: 'fa-project-diagram', description: 'Map the arguments of an opinion piece.', promptLabel: 'Paste the text of the opinion piece:', type: 'textarea',
              systemInstruction: "You are an Argument Mapper AI. The user will provide an opinion piece. Your task is to dissect the text and map out its logical structure. Identify the main thesis, key claims, supporting evidence for each claim, and any counterarguments addressed. Present this as a structured outline. Do not summarize or give your own opinion. Just map the arguments." },
        ],

        init() {
            this.state = this.getInitialState();

            this.eventHandlers = {
                'pomodoro-start-pause': () => this.togglePomodoro(),
                'pomodoro-reset': () => this.resetPomodoro(),
                'set-notepad-mode': (e) => this.setNotepadMode(e.target.closest('[data-mode]').dataset.mode),
                'set-draw-tool': (e) => this.setDrawTool(e.target.closest('[data-tool]').dataset.tool),
                'clear-canvas': () => this.clearCanvas(),
                'open-chat': () => this.openChat(),
                'open-tool-info': (e) => this.openToolInfo(e),
                'open-tool': (e) => this.openTool(e),
                'export-selected': () => this.exportSelectedLogs(),
                'export-all-json': () => this.exportLog(true),
                'import-log': () => document.getElementById('import-json-input').click(),
                'manage-projects': () => this.manageProjects(),
                'delete-selected': () => this.deleteSelectedLogs(),
                'view-log-entry': (e) => this.viewLogEntry(e),
                'toggle-pin': (e) => this.togglePin(e),
                'change-persona': (e) => this.handlePersonaChange(e),
                'generate-tool-response': (e) => this.handleToolGeneration(e),
            };

            this.loadCustomPersona();
            this.cacheDOM();
            this.bindEvents();
            this.initPomodoro();
            this.initNotepad();
            this.render();
        },
        
        async _getAIResponse(payload) {
            this.state.aiIsLoading = true;
            this.showLoadingModal();
        
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
        
                // Read the response body once, regardless of status, as text
                const responseText = await response.text();
        
                if (!response.ok) {
                    let errorMsg;
                    try {
                        // Try to parse the text as JSON for a structured error message
                        const errorData = JSON.parse(responseText);
                        errorMsg = errorData.error || responseText;
                    } catch (e) {
                        // If it's not JSON, use the raw text (e.g., Vercel's HTML error page)
                        console.error("Non-JSON error response from server:", responseText);
                        if (responseText.toLowerCase().includes('<html')) {
                             errorMsg = "The server returned an unexpected response. This can happen during deployment. Check the server logs for details.";
                        } else {
                            errorMsg = responseText || `AI server error (status: ${response.status})`;
                        }
                    }
                    throw new Error(errorMsg);
                }
                
                // On success, parse the response text
                const data = JSON.parse(responseText);
                return data.text;
                
            } catch (error) {
                console.error("Error calling AI proxy:", error);
                // Return a user-friendly error message, using the message from the thrown Error
                return `Sorry, an error occurred while contacting the AI: ${error.message}`;
            } finally {
                this.state.aiIsLoading = false;
                // The modal will be replaced by the result/error message.
            }
        },
        
        getInitialState() {
            return {
                aiIsLoading: false,
                currentView: 'launch',
                sessionPersona: this.loadData('orbit-session-persona', 'zoe'),
                sessionGoal: localStorage.getItem('orbit-session-goal') || '',
                log: this.loadData('orbit-captains-log', []),
                projects: this.loadData('orbit-projects', ['Default']),
                notepadContent: this.loadData('orbit-notepad', ''),
                notepadMode: 'text',
                notepadDrawTool: 'pencil',
                logFilterTool: 'all',
                logFilterProject: 'all',
                logSearchTerm: '',
                selectedLogIndices: new Set(),
                isMobileNavOpen: false,
                currentChatSession: null,
                pomodoro: {
                    isRunning: false,
                    isWorkSession: true,
                    timeRemaining: 25 * 60,
                    workDuration: 25 * 60,
                    breakDuration: 5 * 60,
                },
            };
        },

        cacheDOM() {
            this.dom = {
                launchScreen: document.getElementById('launch-screen'),
                launchBtn: document.getElementById('launch-btn'),
                launchRocket: document.getElementById('launch-rocket'),
                mainDashboard: document.getElementById('main-dashboard'),
                sessionGoalInput: document.getElementById('session-goal-input'),
                desktopSidebar: document.getElementById('desktop-sidebar'),
                mobileNavPanel: document.getElementById('mobile-nav-panel'),
                mobileNavToggle: document.getElementById('mobile-nav-toggle'),
                pomodoroTime: document.getElementById('pomodoro-time'),
                pomodoroProgress: document.querySelector('.pomodoro-progress'),
                pomodoroControls: document.getElementById('pomodoro-controls'),
                pomodoroStatus: document.getElementById('pomodoro-status'),
                notepadWidget: document.getElementById('notepad-widget'),
                notepadArea: document.getElementById('notepad-area'),
                notepadCanvas: document.getElementById('notepad-canvas'),
                notepadStatus: document.getElementById('notepad-status'),
                notepadModeToggle: document.querySelector('.notepad-mode-toggle'),
                notepadDrawControls: document.querySelector('.notepad-draw-controls'),
                aiCommandGrid: document.getElementById('ai-command-grid'),
                logListContainer: document.getElementById('log-list-container'),
                logSearch: document.getElementById('log-search'),
                logFilterTool: document.getElementById('log-filter-tool'),
                logFilterProject: document.getElementById('log-filter-project'),
                missionBadge: document.getElementById('mission-badge'),
                logStats: document.getElementById('log-stats'),
                companionInteraction: document.querySelector('.companion-interaction'),
                companionAvatar: document.querySelector('.companion-avatar'),
                companionChatBubble: document.querySelector('.companion-chat-bubble'),
                modal: document.getElementById('modal'),
                modalBody: document.getElementById('modal-body'),
                modalCloseBtn: document.getElementById('modal-close-btn'),
            };
        },

        bindEvents() {
            this.dom.launchBtn.addEventListener('click', () => this.launchApp());
            this.dom.sessionGoalInput.addEventListener('change', (e) => this.handleSessionGoal(e));
            this.dom.sessionGoalInput.addEventListener('keyup', debounce((e) => this.handleSessionGoal(e), 500));
            this.dom.mobileNavToggle.addEventListener('click', () => this.toggleMobileNav());

            document.body.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]');
                if (!action) return;

                const actionName = action.dataset.action;
                if (this.eventHandlers[actionName]) {
                    this.eventHandlers[actionName](e);
                }
            });

            this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
            this.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.dom.modal) this.closeModal();
            });

            this.dom.logSearch.addEventListener('input', debounce((e) => {
                this.state.logSearchTerm = e.target.value;
                this.renderLog();
            }, 300));
            this.dom.logFilterTool.addEventListener('change', (e) => {
                this.state.logFilterTool = e.target.value;
                this.renderLog();
            });
            this.dom.logFilterProject.addEventListener('change', (e) => {
                this.state.logFilterProject = e.target.value;
                this.renderLog();
            });
             document.getElementById('import-json-input').addEventListener('change', (e) => this.importLog(e));
        },

        launchApp() {
            this.dom.launchRocket.classList.add('launching');
            setTimeout(() => {
                this.state.currentView = 'dashboard';
                this.dom.launchScreen.style.display = 'none';
                this.dom.mainDashboard.classList.add('visible');
                document.querySelectorAll('.dashboard-widget, .content-section').forEach((el, index) => {
                    el.style.animationDelay = `${index * 100}ms`;
                });
            }, 1000);
        },
        
        openTool(e) {
            const toolId = e.target.closest('[data-id]').dataset.id;
            const tool = this.tools.find(t => t.id === toolId);
            if(tool) {
                const modalContent = `
                    <h3>${tool.name}</h3>
                    <p>${tool.description}</p>
                    <textarea id="tool-prompt-input" class="input-field" placeholder="${tool.promptLabel}"></textarea>
                    <div class="modal-actions">
                        <button class="btn" data-action="generate-tool-response" data-tool-id="${tool.id}">Generate</button>
                    </div>`;
                this.showModal(modalContent);
            }
        },

        async handleToolGeneration(e) {
            const button = e.target.closest('[data-tool-id]');
            const toolId = button.dataset.toolId;
            const tool = this.tools.find(t => t.id === toolId);
            const prompt = document.getElementById('tool-prompt-input').value;

            if (!prompt) {
                alert("Please enter a prompt.");
                return;
            }

            const responseText = await this._getAIResponse({ prompt, tool, persona: this.personas[this.state.sessionPersona] });
            this.showModalResult(tool, responseText, prompt);
        },

        openToolInfo(e) {
            e.stopPropagation();
            const toolId = e.target.closest('[data-id]').dataset.id;
            const tool = this.tools.find(t => t.id === toolId);
            if (tool) {
                this.showModal(`
                    <h3><i class="fas ${tool.icon}"></i> ${tool.name}</h3>
                    <p>${tool.description}</p>
                    ${tool.systemInstruction ? `<div class="feedback-box"><p><strong>System Instruction:</strong></p><p><em>${tool.systemInstruction}</em></p></div>` : ''}
                `);
            }
        },

        openChat() {
            this.state.currentChatSession = { history: [] };
            this.showModal(`
                <h3><i class="fas ${this.personas[this.state.sessionPersona].avatar}"></i> Chat with ${this.personas[this.state.sessionPersona].name}</h3>
                <div class="chat-window"></div>
                <form id="chat-form" class="chat-input-container">
                    <textarea id="chat-input" class="input-field" placeholder="Type your message..."></textarea>
                    <button class="btn" type="submit">Send</button>
                </form>
            `);
            document.getElementById('chat-form').addEventListener('submit', (e) => this.handleChatSubmit(e));
        },
        
        async handleChatSubmit(e) {
            e.preventDefault();
            const chatInput = document.getElementById('chat-input');
            const prompt = chatInput.value.trim();
            if (!prompt) return;

            const chatWindow = document.querySelector('.chat-window');
            chatInput.value = '';
            chatInput.focus();

            this.appendChatMessage(prompt, 'user');
            this.state.currentChatSession.history.push({ role: 'user', parts: [{ text: prompt }] });
            
            const loadingIndicator = this.appendChatMessage('<div class="loading-dots"><div></div><div></div><div></div></div>', 'model', true);
            
            const responseText = await this._getAIResponse({ 
                prompt, 
                chatHistory: this.state.currentChatSession.history.slice(0, -1), // Send history without current prompt
                persona: this.personas[this.state.sessionPersona] 
            });

            loadingIndicator.remove();
            this.appendChatMessage(responseText, 'model');
            this.state.currentChatSession.history.push({ role: 'model', parts: [{ text: responseText }] });
        },

        appendChatMessage(text, sender, isTemp = false) {
            const chatWindow = document.querySelector('.chat-window');
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `chat-message ${sender}-message`;
            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = text.replace(/\n/g, '<br>');
            messageWrapper.appendChild(messageDiv);
            chatWindow.appendChild(messageWrapper);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            if (isTemp) return messageWrapper;
        },

        showLoadingModal() {
            const content = `<div class="loading-container"><div class="loading-dots"><div></div><div></div><div></div></div><p>Generating response...</p></div>`;
            this.showModal(content);
        },
        
        showModalResult(tool, responseText, prompt) {
            const content = `
                <h3>${tool.name} Result</h3>
                <div class="feedback-box"><p><strong>Your Prompt:</strong> ${prompt}</p></div>
                <div style="margin-top: 1rem;">${responseText.replace(/\n/g, '<br>')}</div>
            `;
             this.showModal(content);
        },

        showModal(content) {
             this.dom.modalBody.innerHTML = content;
             this.dom.modal.classList.add('active');
        },

        closeModal() {
            this.dom.modal.classList.remove('active');
            this.dom.modalBody.innerHTML = '';
        },

        loadData(key, defaultValue) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.error(`Error loading data for key ${key}:`, error);
                return defaultValue;
            }
        },

        saveData(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error(`Error saving data for key ${key}:`, error);
            }
        },
        
        render() {
           this.renderSidebar();
           this.renderAiCommandCenter();
           this.renderLog();
           this.updateCompanionWidget();
        },
        
        renderSidebar() {
            const sidebarContent = `
                <h3><i class="fas fa-user-cog"></i> AI Persona</h3>
                <div class="companion-profile-grid">
                    ${Object.entries(this.personas).map(([id, persona]) => `
                        <div class="persona-card ${this.state.sessionPersona === id ? 'active' : ''}" data-action="change-persona" data-id="${id}">
                            <i class="fas ${persona.avatar}"></i>
                            <h5>${persona.name}</h5>
                        </div>
                    `).join('')}
                </div>
                <h3 style="margin-top: 1.5rem;"><i class="fas fa-compass"></i> Navigation</h3>
                <ul class="nav-links">
                    <li><a href="#ai-command-center"><i class="fas fa-brain"></i> AI Command Center</a></li>
                    <li><a href="#captains-log-section"><i class="fas fa-book"></i> Captain's Log</a></li>
                </ul>
            `;
            this.dom.desktopSidebar.innerHTML = sidebarContent;
            this.dom.mobileNavPanel.innerHTML = sidebarContent;
        },

        renderAiCommandCenter() {
            this.dom.aiCommandGrid.innerHTML = this.tools.map(tool => `
                <div class="ai-tool-card" data-action="open-tool" data-id="${tool.id}">
                    <button class="tool-info-btn" data-action="open-tool-info" data-id="${tool.id}" title="Tool Info"><i class="fas fa-info-circle"></i></button>
                    <i class="fas ${tool.icon}"></i>
                    <h4>${tool.name}</h4>
                </div>
            `).join('');
        },

        renderLog() {
            const { log, logFilterTool, logFilterProject, logSearchTerm } = this.state;
            const filteredLogs = log.filter(entry => {
                const matchesTool = logFilterTool === 'all' || entry.toolId === logFilterTool;
                const matchesProject = logFilterProject === 'all' || entry.project === logFilterProject;
                const matchesSearch = !logSearchTerm || entry.prompt.toLowerCase().includes(logSearchTerm.toLowerCase()) || (entry.response && entry.response.toLowerCase().includes(logSearchTerm.toLowerCase()));
                return matchesTool && matchesProject && matchesSearch;
            });

            if (filteredLogs.length === 0) {
                this.dom.logListContainer.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>No log entries found. Try using an AI tool!</p></div>`;
            } else {
                this.dom.logListContainer.innerHTML = filteredLogs.map((entry, index) => this.createLogEntryHTML(entry, log.indexOf(entry))).join('');
            }
        },

        createLogEntryHTML(entry, originalIndex) {
            const tool = this.tools.find(t => t.id === entry.toolId) || { name: 'Unknown', icon: 'fa-question' };
            const isSelected = this.state.selectedLogIndices.has(originalIndex);
            
            return `
                <div class="log-entry ${entry.pinned ? 'pinned' : ''} ${isSelected ? 'selected' : ''}" data-index="${originalIndex}">
                    <input type="checkbox" class="log-select-checkbox" data-index="${originalIndex}" ${isSelected ? 'checked' : ''}>
                    <div class="log-entry-content" data-action="view-log-entry">
                        <div class="log-entry-header">
                            <i class="fas ${tool.icon}"></i>
                            <h4>${tool.name}</h4>
                            ${entry.project && entry.project !== 'Default' ? `<span class="project-tag">${entry.project}</span>` : ''}
                        </div>
                        <p>${entry.prompt}</p>
                        <div class="log-entry-meta">${new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                    <button class="pin-btn ${entry.pinned ? 'pinned' : ''}" data-action="toggle-pin" title="Pin Entry"><i class="fas fa-thumbtack"></i></button>
                </div>
            `;
        },

        initPomodoro() {
            this.updatePomodoroDisplay();
        },
        togglePomodoro() {
            this.state.pomodoro.isRunning = !this.state.pomodoro.isRunning;
            if (this.state.pomodoro.isRunning) {
                this.startPomodoroInterval();
                this.dom.pomodoroControls.querySelector('[data-action="pomodoro-start-pause"] i').className = 'fas fa-pause';
            } else {
                clearInterval(this.pomodoroInterval);
                this.dom.pomodoroControls.querySelector('[data-action="pomodoro-start-pause"] i').className = 'fas fa-play';
            }
        },
        resetPomodoro() {
            clearInterval(this.pomodoroInterval);
            this.state.pomodoro.isRunning = false;
            this.state.pomodoro.isWorkSession = true;
            this.state.pomodoro.timeRemaining = this.state.pomodoro.workDuration;
            this.updatePomodoroDisplay();
            this.dom.pomodoroControls.querySelector('[data-action="pomodoro-start-pause"] i').className = 'fas fa-play';
        },
        startPomodoroInterval() {
            this.pomodoroInterval = setInterval(() => {
                this.state.pomodoro.timeRemaining--;
                this.updatePomodoroDisplay();
                if (this.state.pomodoro.timeRemaining < 0) {
                    clearInterval(this.pomodoroInterval);
                    this.switchPomodoroSession();
                }
            }, 1000);
        },
        switchPomodoroSession() {
            this.state.pomodoro.isWorkSession = !this.state.pomodoro.isWorkSession;
            this.state.pomodoro.timeRemaining = this.state.pomodoro.isWorkSession 
                ? this.state.pomodoro.workDuration 
                : this.state.pomodoro.breakDuration;
            this.updatePomodoroDisplay();
            this.startPomodoroInterval(); // Auto-start next session
        },
        updatePomodoroDisplay() {
            const { timeRemaining, isWorkSession } = this.state.pomodoro;
            const duration = isWorkSession ? this.state.pomodoro.workDuration : this.state.pomodoro.breakDuration;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            this.dom.pomodoroTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            const radius = this.dom.pomodoroProgress.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (timeRemaining / duration) * circumference;
            this.dom.pomodoroProgress.style.strokeDasharray = circumference;
            this.dom.pomodoroProgress.style.strokeDashoffset = isNaN(offset) ? circumference : offset;

            this.dom.pomodoroStatus.textContent = isWorkSession ? 'Work Session' : 'Break Session';
            this.dom.pomodoroProgress.style.stroke = isWorkSession ? 'var(--accent-secondary)' : 'var(--accent-primary)';
        },

        initNotepad() {
            this.notepadCtx = this.dom.notepadCanvas.getContext('2d');
            this.dom.notepadArea.value = this.state.notepadContent;
            
            const resizeCanvas = () => {
                const container = this.dom.notepadWidget; // Changed this to the resizable element
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const style = window.getComputedStyle(container);
                const paddingLeft = parseFloat(style.paddingLeft);
                const paddingRight = parseFloat(style.paddingRight);
                const paddingTop = parseFloat(style.paddingTop);
                const paddingBottom = parseFloat(style.paddingBottom);

                const contentContainer = this.dom.notepadContentContainer;
                if (!contentContainer) return;
                const contentRect = contentContainer.getBoundingClientRect();

                this.dom.notepadCanvas.width = contentRect.width;
                this.dom.notepadCanvas.height = contentRect.height;
            };
            
            resizeCanvas();
            new ResizeObserver(debounce(resizeCanvas, 50)).observe(this.dom.notepadWidget);

            const startDrawing = (e) => {
                this.isNotepadDrawing = true;
                this.drawOnNotepad(e);
            };
            const stopDrawing = () => { this.isNotepadDrawing = false; this.notepadCtx.beginPath(); };
            
            this.dom.notepadCanvas.addEventListener('mousedown', startDrawing);
            this.dom.notepadCanvas.addEventListener('mousemove', (e) => this.drawOnNotepad(e));
            this.dom.notepadCanvas.addEventListener('mouseup', stopDrawing);
            this.dom.notepadCanvas.addEventListener('mouseout', stopDrawing);
        },

        drawOnNotepad(e) {
            if (!this.isNotepadDrawing) return;
            this.notepadCtx.lineWidth = document.getElementById('draw-width').value;
            this.notepadCtx.lineCap = 'round';
            
            // Adjust for the tool
            this.setDrawTool(this.state.notepadDrawTool);
            if (this.state.notepadDrawTool === 'pencil') {
                this.notepadCtx.strokeStyle = document.getElementById('draw-color').value;
            } else {
                 this.notepadCtx.strokeStyle = 'rgba(0,0,0,1)'; // For eraser
            }

            this.notepadCtx.lineTo(e.offsetX, e.offsetY);
            this.notepadCtx.stroke();
            this.notepadCtx.beginPath();
            this.notepadCtx.moveTo(e.offsetX, e.offsetY);
        },

        setNotepadMode(mode) {
            if (this.state.notepadMode === mode) return;
            this.state.notepadMode = mode;
            this.dom.notepadArea.style.display = mode === 'text' ? 'block' : 'none';
            this.dom.notepadCanvas.style.display = mode === 'draw' ? 'block' : 'none';
            this.dom.notepadDrawControls.style.display = mode === 'draw' ? 'flex' : 'none';
            this.dom.notepadModeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });
        },

        setDrawTool(tool) {
            this.state.notepadDrawTool = tool;
            this.notepadCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            this.dom.notepadDrawControls.querySelectorAll('[data-action="set-draw-tool"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });
        },

        clearCanvas() {
            this.notepadCtx.clearRect(0, 0, this.dom.notepadCanvas.width, this.dom.notepadCanvas.height);
        },

        handleSessionGoal(e) { 
            this.state.sessionGoal = e.target.value;
            this.saveData('orbit-session-goal', this.state.sessionGoal);
        },
        
        toggleMobileNav() {
            this.state.isMobileNavOpen = !this.state.isMobileNavOpen;
            this.dom.mobileNavPanel.classList.toggle('open', this.state.isMobileNavOpen);
        },
        
        handlePersonaChange(e) {
            const card = e.target.closest('[data-id]');
            if (!card) return;
            const personaId = card.dataset.id;
            this.state.sessionPersona = personaId;
            this.saveData('orbit-session-persona', personaId);
            this.renderSidebar();
            this.updateCompanionWidget();
        },
        
        updateCompanionWidget() {
            const persona = this.personas[this.state.sessionPersona];
            this.dom.companionAvatar.innerHTML = `<i class="fas ${persona.avatar}"></i>`;
            this.dom.companionChatBubble.textContent = `Ready to assist.`;
        },
        
        loadCustomPersona() { /* ... */ },
        viewLogEntry() { /* ... */ },
        togglePin() { /* ... */ },
        exportSelectedLogs() { /* ... */ },
        exportLog() { /* ... */ },
        importLog() { /* ... */ },
        manageProjects() { /* ... */ },
        deleteSelectedLogs() { /* ... */ },
    };

    App.init();
});
