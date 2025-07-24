

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
        // ... other properties

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

            // CRITICAL FIX: Define eventHandlers here inside init()
            // This ensures that `this` inside the handler functions correctly refers to the App object.
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
            };

            this.loadCustomPersona();
            this.cacheDOM();
            this.bindEvents();
            this.initPomodoro();
            this.initNotepad();
            this.render();
        },
        
        /**
         * Securely calls the backend proxy to get an AI response.
         * @param {object} payload - The data to send to the backend.
         * @param {string} payload.prompt - The user's prompt.
         * @param {object} [payload.tool] - The tool object, if any.
         * @param {object} [payload.persona] - The persona object.
         * @param {Array} [payload.chatHistory] - The history for chat sessions.
         * @returns {Promise<string>} - The AI-generated text.
         */
        async _getAIResponse(payload) {
            this.state.aiIsLoading = true;
            // You might want to update the UI to show a loading state here.
            
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data.text;
            } catch (error) {
                console.error("Error calling AI proxy:", error);
                // Return a user-friendly error message
                return `Sorry, an error occurred while contacting the AI: ${error.message}`;
            } finally {
                this.state.aiIsLoading = false;
                 // You might want to update the UI to hide the loading state here.
            }
        },
        
        getInitialState() {
            return {
                aiIsLoading: false,
                currentView: 'launch',
                sessionPersona: 'zoe',
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
                // ... any other initial state properties
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

            // Central event delegation for actions
            document.body.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]');
                if (!action) return;

                const actionName = action.dataset.action;
                if (this.eventHandlers[actionName]) {
                    this.eventHandlers[actionName](e);
                }
            });

            // Modal closing events
            this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
            this.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.dom.modal) {
                    this.closeModal();
                }
            });

            // Specific listeners for non-action elements
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

        // --- Core App Logic ---
        launchApp() {
            this.dom.launchRocket.classList.add('launching');
            setTimeout(() => {
                this.state.currentView = 'dashboard';
                this.dom.launchScreen.style.display = 'none';
                this.dom.mainDashboard.classList.add('visible');
                // Stagger animations for widgets
                document.querySelectorAll('.dashboard-widget, .content-section').forEach((el, index) => {
                    el.style.animationDelay = `${index * 100}ms`;
                });
            }, 1000);
        },
        
        async openToolModal(tool) {
            const prompt = "Example prompt for " + tool.name;
            this.showLoadingModal();
            const persona = this.personas[this.state.sessionPersona];
            const responseText = await this._getAIResponse({ prompt, tool, persona });
            this.showModalResult(tool, responseText);
        },
        
        openTool(e) {
            const toolId = e.target.closest('[data-id]').dataset.id;
            const tool = this.tools.find(t => t.id === toolId);
            if(tool) {
                 this.showModal(`<h3>${tool.name}</h3><p>${tool.description}</p><textarea id="tool-prompt-input" class="input-field" placeholder="${tool.promptLabel}"></textarea><button id="tool-generate-btn" class="btn">Generate</button>`);
                 document.getElementById('tool-generate-btn').addEventListener('click', async () => {
                    const prompt = document.getElementById('tool-prompt-input').value;
                    if (!prompt) {
                        alert("Please enter a prompt.");
                        return;
                    }
                    this.showLoadingModal();
                    const persona = this.personas[this.state.sessionPersona];
                    const responseText = await this._getAIResponse({ prompt, tool, persona });
                    // This part will need more advanced rendering based on the tool
                    this.showModalResult(tool, responseText, prompt);
                 });
            }
        },

        openToolInfo(e) {
            e.stopPropagation(); // Prevent the 'open-tool' action on the parent card from firing
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
            // Logic to open chat modal will now use _getAIResponse
            this.showModal(`
                <h3><i class="fas ${this.personas[this.state.sessionPersona].avatar}"></i> Chat with ${this.personas[this.state.sessionPersona].name}</h3>
                <div class="chat-window"></div>
                <form id="chat-form" class="chat-input-container">
                    <textarea id="chat-input" class="input-field" placeholder="Type your message..."></textarea>
                    <button class="btn" type="submit">Send</button>
                </form>
            `);
             // Chat logic would be handled here
        },

        showLoadingModal() {
            const content = `<div class="loading-container"><div class="loading-dots"><div></div><div></div><div></div></div><p>Generating response...</p></div>`;
            this.showModal(content);
        },
        
        showModalResult(tool, responseText, prompt) {
            // A more sophisticated version would handle different response types (JSON for flashcards, etc.)
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
            this.dom.modalBody.innerHTML = ''; // Clear content
        },

        // --- Utility Functions ---
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
        
        // ... The rest of the App's methods would go here (render, pomodoro, notepad, etc.)
        // Assume they are complete and correct.
        
        render() {
           // This function would update the entire UI based on the current state.
           this.renderSidebar();
           this.renderAiCommandCenter();
           this.renderLog();
           // etc.
        },
        
        renderSidebar() {
            // Renders both desktop and mobile sidebars
            const sidebarContent = `
                <h3><i class="fas fa-user-cog"></i> AI Persona</h3>
                <div class="companion-profile-grid">
                    ${Object.entries(this.personas).map(([id, persona]) => `
                        <div class="persona-card ${this.state.sessionPersona === id ? 'active' : ''}" data-id="${id}">
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

            this.dom.desktopSidebar.querySelector('.companion-profile-grid').addEventListener('click', (e) => this.handlePersonaChange(e));
            this.dom.mobileNavPanel.querySelector('.companion-profile-grid').addEventListener('click', (e) => this.handlePersonaChange(e));
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
             // Renders the captain's log entries
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


        loadCustomPersona() { /* ... */ },
        initPomodoro() { /* ... */ },
        togglePomodoro() { /* ... */ },
        resetPomodoro() { /* ... */ },
        initNotepad() { /* ... */ },
        handleSessionGoal() { /* ... */ },
        toggleMobileNav() { /* ... */ },
        handlePersonaChange() { /* ... */ },
        setNotepadMode() { /* ... */ },
        setDrawTool() { /* ... */ },
        clearCanvas() { /* ... */ },
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
