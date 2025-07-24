import { GoogleGenAI, Type } from "@google/genai";

document.addEventListener('DOMContentLoaded', () => {

    const App = {
        state: {},
        ai: null,
        pomodoroInterval: null,
        notepadSaveTimeout: null,

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
            try {
                this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            } catch (error) {
                console.error("AI functionality disabled: Failed to initialize GoogleGenAI. Please ensure the API_KEY environment variable is set.", error);
                this.ai = null;
            }
            this.state = this.getInitialState();
            this.loadCustomPersona();
            this.cacheDOM();
            this.bindEvents();
            this.initPomodoro();
            this.initNotepad();
            this.render();
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
                notepadMode: 'text', // 'text' or 'draw'
                notepadDrawTool: 'pencil', // 'pencil' or 'eraser'
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
        
        loadData(key, defaultValue) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                console.error(`Failed to load data for ${key}`, e);
                return defaultValue;
            }
        },

        saveData(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error(`Failed to save data for ${key}`, e);
            }
        },

        cacheDOM() {
            this.dom = {
                body: document.body,
                launchScreen: document.getElementById('launch-screen'),
                launchBtn: document.getElementById('launch-btn'),
                launchRocket: document.getElementById('launch-rocket'),
                mainDashboard: document.getElementById('main-dashboard'),
                mobileNavToggle: document.getElementById('mobile-nav-toggle'),
                mobileNavPanel: document.getElementById('mobile-nav-panel'),
                desktopSidebar: document.getElementById('desktop-sidebar'),
                sessionGoalInput: document.getElementById('session-goal-input'),
                aiCommandGrid: document.getElementById('ai-command-grid'),
                modal: document.getElementById('modal'),
                modalBody: document.getElementById('modal-body'),
                modalCloseBtn: document.getElementById('modal-close-btn'),
                logListContainer: document.getElementById('log-list-container'),
                missionBadgeCanvas: document.getElementById('mission-badge'),
                logStatsContainer: document.getElementById('log-stats'),
                logFilterTool: document.getElementById('log-filter-tool'),
                logFilterProject: document.getElementById('log-filter-project'),
                logSearch: document.getElementById('log-search'),
                importJsonInput: document.getElementById('import-json-input'),
                aiCompanionWidget: document.getElementById('ai-companion-widget'),
                pomodoroTime: document.getElementById('pomodoro-time'),
                pomodoroControls: document.getElementById('pomodoro-controls'),
                pomodoroProgress: document.querySelector('.pomodoro-progress'),
                pomodoroStatus: document.getElementById('pomodoro-status'),
                notepadArea: document.getElementById('notepad-area'),
                notepadStatus: document.getElementById('notepad-status'),
                // Notepad drawing elements
                notepadCanvas: document.getElementById('notepad-canvas'),
                notepadDrawControls: document.querySelector('.notepad-draw-controls'),
                notepadContentContainer: document.querySelector('.notepad-content-container'),
            };
        },

        bindEvents() {
            this.dom.launchBtn.addEventListener('click', () => this.launchApp());
            this.dom.mobileNavToggle.addEventListener('click', () => this.toggleMobileNav());
            document.body.addEventListener('click', (e) => this.handleGlobalClick(e));
            this.dom.logListContainer.addEventListener('change', (e) => this.handleLogListChange(e));

            this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
            this.dom.modal.addEventListener('click', (e) => { if (e.target === this.dom.modal) this.closeModal(); });

            this.dom.logFilterTool.addEventListener('change', (e) => { this.state.logFilterTool = e.target.value; this.renderLogList(); });
            this.dom.logFilterProject.addEventListener('change', (e) => { this.state.logFilterProject = e.target.value; this.renderLogList(); });
            this.dom.logSearch.addEventListener('input', (e) => { this.state.logSearchTerm = e.target.value; this.renderLogList(); });
            
            this.dom.sessionGoalInput.addEventListener('input', (e) => {
                this.state.sessionGoal = e.target.value;
                localStorage.setItem('orbit-session-goal', this.state.sessionGoal);
            });
            
            this.dom.importJsonInput.addEventListener('change', (e) => this.importLogFromJson(e));

            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        },

        handleKeyDown(e) {
            if (e.key === 'Escape' && this.dom.modal.classList.contains('active')) this.closeModal();
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.openModal('commandPalette'); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); this.dom.logSearch.focus(); }
        },

        handleGlobalClick(e) {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            const isAiAction = ['ai-tool-select', 'open-chat', 'start-interview'].includes(action);

            if (isAiAction && !this.ai) {
                alert('AI features are disabled. Please configure the API_KEY environment variable.');
                return;
            }

            const { toolId, logIndex, personaKey, project, interviewType, mode, tool } = actionTarget.dataset;
            
            const actions = {
                'navigate': () => {
                    e.preventDefault();
                    document.querySelector(actionTarget.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
                    if (this.state.isMobileNavOpen) this.toggleMobileNav();
                },
                'select-persona': () => { this.state.sessionPersona = personaKey; this.render(); },
                'edit-custom-persona': () => this.openModal('editCustomPersona'),
                'open-chat': () => this.openModal('chat'),
                'ai-tool-select': () => {
                    const tool = this.tools.find(t => t.id === toolId);
                    if (tool.isInteractive) {
                        this.openModal(tool.id); // Open special modal, e.g., 'interview-simulator'
                    } else {
                        this.openModal('aiToolInput', { tool });
                    }
                },
                'start-interview': () => this.startInterview(interviewType),
                'show-tool-info': () => { e.stopPropagation(); this.openModal('toolInfo', this.tools.find(t => t.id === toolId)); },
                'delete-selected': () => this.deleteSelectedLogs(),
                'export-selected': () => this.exportSelectedLogs(),
                'export-all-json': () => this.exportAllLogs(),
                'manage-projects': () => this.openModal('manageProjects'),
                'add-project': () => this.addProject(),
                'delete-project': () => this.deleteProject(project),
                'pin-log': () => this.togglePinLog(parseInt(logIndex)),
                'open-log-entry': () => this.openModal('viewLogEntry', { logIndex: parseInt(logIndex) }),
                'pomodoro-start-pause': () => this.state.pomodoro.isRunning ? this.pausePomodoroTimer() : this.startPomodoroTimer(),
                'pomodoro-reset': () => this.resetPomodoro(),
                'copy-to-clipboard': () => this.copyToClipboard(actionTarget.previousElementSibling.textContent),
                'set-notepad-mode': () => this.setNotepadMode(mode),
                'clear-canvas': () => this.clearNotepadCanvas(),
                'set-draw-tool': () => this.setDrawTool(tool),
            };

            if (actions[action]) {
                actions[action]();
            }
        },
        
        handleLogListChange(e) {
            if (e.target.type === 'checkbox') {
                const index = parseInt(e.target.dataset.logIndex);
                if (e.target.checked) {
                    this.state.selectedLogIndices.add(index);
                } else {
                    this.state.selectedLogIndices.delete(index);
                }
            }
        },

        launchApp() {
            this.dom.launchRocket.classList.add('launching');
            setTimeout(() => {
                this.dom.launchScreen.style.opacity = 0;
                this.dom.mainDashboard.classList.add('visible');
                setTimeout(() => {
                    this.dom.launchScreen.style.display = 'none';
                    document.querySelectorAll('.animate-in').forEach((el, index) => {
                        el.style.animationDelay = `${index * 100}ms`;
                        el.classList.add('fadeInUp');
                    });
                }, 500);
            }, 1000);
        },

        toggleMobileNav() {
            this.state.isMobileNavOpen = !this.state.isMobileNavOpen;
            this.dom.mobileNavPanel.classList.toggle('open');
        },
        
        render() {
            this.renderSidebarContent();
            this.dom.mobileNavPanel.innerHTML = this.dom.desktopSidebar.innerHTML; // Sync mobile and desktop
            this.renderAiCompanionWidget();
            this.renderCommandGrid();
            this.renderLogFilters();
            this.renderLogList();
            this.renderMissionBadge();
        },
        
        renderSidebarContent() {
            const navLinks = `
                <ul class="nav-links">
                    <li><a href="#captains-log-section" data-action="navigate"><i class="fas fa-book"></i> Captain's Log</a></li>
                    <li><a href="#ai-command-center" data-action="navigate"><i class="fas fa-brain"></i> AI Command Center</a></li>
                </ul>
            `;

            const personaGrid = `
                <h4>AI Persona</h4>
                <div class="companion-profile-grid">
                    ${Object.entries(this.personas).map(([key, persona]) => `
                        <div class="persona-card ${this.state.sessionPersona === key ? 'active' : ''}" data-action="select-persona" data-persona-key="${key}">
                            <i class="fas ${persona.avatar}"></i>
                            <h5>${persona.name}</h5>
                        </div>
                    `).join('')}
                </div>
                 <button class="btn btn-secondary" data-action="edit-custom-persona" style="width: 100%; margin-top: 10px;">Edit Custom</button>
            `;
            
            this.dom.desktopSidebar.innerHTML = `${navLinks}${personaGrid}`;
        },
        
        renderAiCompanionWidget() {
            if (!this.ai) {
                this.dom.aiCompanionWidget.innerHTML = `
                    <h3>AI Companion</h3>
                    <div class="companion-interaction disabled">
                        <div class="companion-avatar" title="AI is offline"><i class="fas fa-power-off"></i></div>
                        <div class="companion-chat-bubble">AI is offline. API key not configured.</div>
                    </div>`;
                return;
            }
            const persona = this.personas[this.state.sessionPersona];
            this.dom.aiCompanionWidget.innerHTML = `
                <h3>AI Companion: ${persona.name}</h3>
                <div class="companion-interaction">
                    <div class="companion-avatar" data-action="open-chat" title="Start a Chat with ${persona.name}">
                        <i class="fas ${persona.avatar}"></i>
                    </div>
                    <div class="companion-chat-bubble">Ready to assist. Click my portrait to chat!</div>
                </div>`;
        },

        renderCommandGrid() {
            if (!this.ai) {
                this.dom.aiCommandGrid.style.gridTemplateColumns = '1fr';
                this.dom.aiCommandGrid.innerHTML = `
                   <div class="ai-tool-card disabled">
                       <i class="fas fa-power-off"></i>
                       <h4>AI Tools Offline</h4>
                       <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 1rem; font-family: var(--font-secondary);">
                           AI features are unavailable because the API Key is not configured.
                       </p>
                   </div>`;
               return;
           }
           // Reset style if it was set before
           this.dom.aiCommandGrid.style.gridTemplateColumns = '';
            this.dom.aiCommandGrid.innerHTML = this.tools.map(tool => `
                <div class="ai-tool-card" data-action="ai-tool-select" data-tool-id="${tool.id}">
                     <button class="tool-info-btn" data-action="show-tool-info" data-tool-id="${tool.id}" title="Tool Info"><i class="fas fa-info-circle"></i></button>
                    <i class="fas ${tool.icon}"></i>
                    <h4>${tool.name}</h4>
                </div>
            `).join('');
        },

        renderLogFilters() {
            const toolOptions = this.tools.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            this.dom.logFilterTool.innerHTML = `<option value="all">All Tools</option>${toolOptions}`;
            this.dom.logFilterTool.value = this.state.logFilterTool;
            
            const projectOptions = this.state.projects.map(p => `<option value="${p}">${p}</option>`).join('');
            this.dom.logFilterProject.innerHTML = `<option value="all">All Projects</option>${projectOptions}`;
            this.dom.logFilterProject.value = this.state.logFilterProject;
        },
        
        renderLogList() {
            const filteredLogs = this.state.log
                .map((log, index) => ({ ...log, originalIndex: index }))
                .filter(log =>
                    (this.state.logFilterTool === 'all' || log.toolId === this.state.logFilterTool) &&
                    (this.state.logFilterProject === 'all' || log.project === this.state.logFilterProject) &&
                    (this.state.logSearchTerm === '' || log.prompt.toLowerCase().includes(this.state.logSearchTerm.toLowerCase()) || (typeof log.response === 'string' && log.response.toLowerCase().includes(this.state.logSearchTerm.toLowerCase())))
                )
                .sort((a, b) => (b.pinned ? 1 : -1) - (a.pinned ? 1 : -1) || new Date(b.timestamp) - new Date(a.timestamp));

            if (filteredLogs.length === 0) {
                this.dom.logListContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No log entries found. Use an AI tool to get started!</p>
                    </div>`;
            } else {
                this.dom.logListContainer.innerHTML = filteredLogs.map(log => {
                    const tool = this.tools.find(t => t.id === log.toolId) || { name: 'Unknown', icon: 'fa-question' };
                    return `
                    <div class="log-entry ${log.pinned ? 'pinned' : ''}">
                        <input type="checkbox" data-log-index="${log.originalIndex}" ${this.state.selectedLogIndices.has(log.originalIndex) ? 'checked' : ''}>
                        <div class="log-entry-content" data-action="open-log-entry" data-log-index="${log.originalIndex}">
                            <div class="log-entry-header">
                                <i class="fas ${tool.icon}"></i>
                                <h4>${tool.name}</h4>
                                ${log.project ? `<span class="project-tag">${log.project}</span>` : ''}
                            </div>
                            <p>${log.prompt.substring(0, 150)}...</p>
                        </div>
                        <button class="pin-btn ${log.pinned ? 'pinned' : ''}" data-action="pin-log" data-log-index="${log.originalIndex}" title="Pin Entry">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                    </div>`;
                }).join('');
            }
            this.renderLogStats();
        },

        renderLogStats() {
            this.dom.logStatsContainer.innerHTML = `
                <h2>Captain's Log</h2>
                <p>${this.state.log.length} Entries</p>`;
        },

        renderMissionBadge() {
            const canvas = this.dom.missionBadgeCanvas;
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            ctx.clearRect(0, 0, size, size);

            // Background
            ctx.fillStyle = '#161d31';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Outer Ring
            ctx.strokeStyle = '#4f85e3';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
            ctx.stroke();

            // Inner Icon
            const entries = this.state.log.length;
            let icon = 'fa-rocket';
            if (entries > 10) icon = 'fa-satellite';
            if (entries > 25) icon = 'fa-star';
            if (entries > 50) icon = 'fa-globe-americas';

            ctx.font = '30px "Font Awesome 6 Free"';
            ctx.fillStyle = '#e0e6f0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const iconCode = { 'fa-rocket': '\uf135', 'fa-satellite': '\uf7c1', 'fa-star': '\uf005', 'fa-globe-americas': '\uf57d' }[icon];
            ctx.fillText(iconCode, size / 2, size / 2);
        },

        openModal(type, data = {}) {
            let content = '';
            const handlers = {
                'aiToolInput': () => this.renderModalContent_aiToolInput(data.tool),
                'toolInfo': () => this.renderModalContent_toolInfo(data),
                'editCustomPersona': () => this.renderModalContent_editCustomPersona(),
                'manageProjects': () => this.renderModalContent_manageProjects(),
                'viewLogEntry': () => this.renderModalContent_viewLogEntry(data.logIndex),
                'chat': () => this.renderModalContent_chat(),
                'commandPalette': () => this.renderModalContent_commandPalette(),
                'interview-simulator': () => this.renderModalContent_interviewSimulatorChoice(),
            };

            content = handlers[type] ? handlers[type]() : `<h2>Error</h2><p>Unknown modal type: ${type}</p>`;

            this.dom.modalBody.innerHTML = content;
            this.dom.modal.classList.add('active');
            this.dom.body.style.overflow = 'hidden';
            
            // Post-render bindings
            this.bindModalEvents(type, data);
        },
        
        bindModalEvents(type, data) {
            if (type === 'aiToolInput') {
                const form = this.dom.modalBody.querySelector('#ai-tool-form');
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleToolSubmit(data.tool);
                });
                if(data.tool.id === 'document-processor') this.bindFileDropZone(form.querySelector('#file-drop-zone'));
            } else if (type === 'editCustomPersona') {
                this.dom.modalBody.querySelector('#custom-persona-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveCustomPersona();
                });
            } else if (type === 'manageProjects') {
                 this.dom.modalBody.querySelector('#add-project-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addProject();
                });
            } else if (type === 'chat' || (type === 'viewLogEntry' && data.logIndex !== undefined)) {
                this.bindChatForm();
            } else if(type === 'commandPalette') {
                // this.bindCommandPalette();
            }
        },

        closeModal() {
            this.dom.modal.classList.remove('active');
            this.dom.body.style.overflow = 'auto';
            this.state.currentChatSession = null;
        },

        renderModalContent_loading(message) {
            this.dom.modalBody.innerHTML = `
                <div class="loading-container">
                    <div class="loading-dots"><div></div><div></div><div></div></div>
                    <p>${message}</p>
                </div>
            `;
        },
        
        renderModalContent_aiToolInput(tool) {
            const projectOptions = this.state.projects.map(p => `<option value="${p}">${p}</option>`).join('');
            const fileInputHTML = tool.id === 'document-processor' ? `
                <div id="file-drop-zone">
                    <i class="fas fa-file-upload fa-2x"></i>
                    <p>Drag & drop a .txt file here, or click to select</p>
                    <input type="file" id="file-input" accept=".txt" style="display:none;">
                </div>
                <p style="text-align: center; margin: 1rem 0;">OR</p>
            ` : '';

            return `
                <h2><i class="fas ${tool.icon}"></i> ${tool.name}</h2>
                <p>${tool.description}</p>
                <form id="ai-tool-form">
                    ${fileInputHTML}
                    <div class="form-group">
                        <label for="prompt-input">${tool.promptLabel}</label>
                        <textarea id="prompt-input" class="input-field" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="project-select">Assign to Project:</label>
                        <select id="project-select" class="input-field">${projectOptions}</select>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn">Generate</button>
                    </div>
                </form>
            `;
        },
        
        renderModalContent_toolInfo(tool) {
            return `<h2>${tool.name}</h2><p>${tool.description}</p>`;
        },

        renderModalContent_editCustomPersona() {
            return `
                <h2>Edit Custom Persona</h2>
                <form id="custom-persona-form">
                    <div class="form-group">
                        <label for="custom-persona-name">Name</label>
                        <input type="text" id="custom-persona-name" class="input-field" value="${this.personas.custom.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="custom-persona-instruction">System Instruction</label>
                        <textarea id="custom-persona-instruction" class="input-field" required>${this.personas.custom.systemInstruction}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn">Save Persona</button>
                    </div>
                </form>
            `;
        },
        
        renderModalContent_manageProjects() {
            const projectList = this.state.projects.map(p => `
                <div class="project-item">
                    <span>${p}</span>
                    ${p !== 'Default' ? `<button class="btn-delete-project" data-action="delete-project" data-project="${p}">&times;</button>` : ''}
                </div>
            `).join('');

            return `
                <h2>Manage Projects</h2>
                <div id="project-list">${projectList}</div>
                <form id="add-project-form">
                    <div class="form-group">
                        <label for="new-project-name">New Project Name</label>
                        <input type="text" id="new-project-name" class="input-field" required>
                    </div>
                    <button type="submit" class="btn">Add Project</button>
                </form>
            `;
        },
        
        renderModalContent_viewLogEntry(logIndex) {
            const log = this.state.log[logIndex];
            if (!log) return 'Error: Log entry not found.';

            const tool = this.tools.find(t => t.id === log.toolId) || { name: 'Unknown' };

            let initialContent = '';
            try {
                // Try to parse the response to see if it's structured data from a special tool
                const responseData = JSON.parse(log.response);
                if (log.toolId === 'college-matchmaker') {
                    initialContent = this.renderCollegeMatchmakerResults(responseData, log.prompt, null, true);
                } else if (log.toolId === 'extracurricular-polisher') {
                    initialContent = this.renderEcPolisherResults(responseData, log.prompt, null, true);
                } else {
                     initialContent = `<div class="chat-message model-message"><div>${this.formatResponse(log.response)}</div></div>`;
                }
            } catch (e) {
                 // If parsing fails, it's just plain text
                 initialContent = `<div class="chat-message model-message"><div>${this.formatResponse(log.response)}</div></div>`;
            }
            
            // Set up a chat session based on this log
            this.state.currentChatSession = {
                toolId: log.toolId,
                history: [
                    { role: 'user', parts: [{ text: log.prompt }] },
                    { role: 'model', parts: [{ text: typeof log.response === 'string' ? log.response : JSON.stringify(log.response)}] }
                ],
            };

            return `
                <h2>Log Entry: ${tool.name}</h2>
                <div class="chat-window-container">
                    <div class="chat-window" id="chat-window">
                        <div class="chat-message user-message"><div>${log.prompt}</div></div>
                        ${initialContent}
                    </div>
                    <form id="chat-form">
                        <div class="chat-input-container">
                            <textarea id="chat-input" class="input-field" placeholder="Ask a follow-up question..." required></textarea>
                            <button type="submit" class="btn">Send</button>
                        </div>
                    </form>
                </div>
            `;
        },

        renderModalContent_chat() {
            const persona = this.personas[this.state.sessionPersona];
             this.state.currentChatSession = {
                personaKey: this.state.sessionPersona,
                history: [],
            };
            return `
                <h2>Chat with ${persona.name}</h2>
                <div class="chat-window-container">
                    <div class="chat-window" id="chat-window">
                        <div class="chat-message model-message"><div>Hello! How can I help you today?</div></div>
                    </div>
                    <form id="chat-form">
                        <div class="chat-input-container">
                            <textarea id="chat-input" class="input-field" placeholder="Type your message..." required></textarea>
                            <button type="submit" class="btn">Send</button>
                        </div>
                    </form>
                </div>
            `;
        },
        
        renderModalContent_commandPalette() {
            return `<h2>Command Palette</h2><p>Feature coming soon!</p>`;
        },
        
        renderModalContent_interviewSimulatorChoice() {
            return `
                <h2><i class="fas fa-user-tie"></i> Interview Simulator</h2>
                <p>Choose the type of interview you'd like to practice for.</p>
                <div class="interview-choice-container">
                    <button class="choice-btn" data-action="start-interview" data-interview-type="college">
                        <i class="fas fa-university fa-2x"></i>
                        <span>College Interview</span>
                    </button>
                    <button class="choice-btn" data-action="start-interview" data-interview-type="job">
                        <i class="fas fa-briefcase fa-2x"></i>
                        <span>Job Interview</span>
                    </button>
                </div>
            `;
        },

        formatResponse(responseText) {
            // Simple markdown-to-HTML
            try {
                // This is a weak check, but tries to see if it's a log from college matchmaker
                const data = JSON.parse(responseText);
                if (data.reach || data.match || data.safety) {
                     return this.renderCollegeMatchmakerResults(data, '', null, true);
                }
            } catch (e) { /* Not a JSON object, proceed as text */ }
            
            return responseText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // Code blocks
                .replace(/`(.*?)`/g, '<code>$1</code>')       // Inline code
                .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>') // Basic lists
                .replace(/\n/g, '<br>');
        },

        async handleToolSubmit(tool) {
            const promptInput = this.dom.modalBody.querySelector('#prompt-input');
            const projectSelect = this.dom.modalBody.querySelector('#project-select');
            const prompt = promptInput.value.trim();
            if (!prompt) return;

            const project = projectSelect.value;
            
            this.state.currentChatSession = {
                toolId: tool.id,
                project: project,
                history: [{ role: 'user', parts: [{text: prompt}] }],
            };
            
            this.renderModalContent_loading(`Generating with ${tool.name}...`);
            
            const specialHandlers = {
                'quizzer': this.handleQuizzer,
                'college-matchmaker': this.handleCollegeMatchmaker,
                'extracurricular-polisher': this.handleEcPolisher,
            };

            try {
                if (specialHandlers[tool.id]) {
                    await specialHandlers[tool.id].call(this, prompt, project);
                } else {
                    // Generic handler for text-based tools
                    const modelConfig = { systemInstruction: tool.systemInstruction || "You are a helpful AI." };
                    const response = await this.ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: this.state.currentChatSession.history[0].parts[0].text,
                        config: modelConfig,
                    });
                    const responseText = response.text;
                    
                    this.state.currentChatSession.history.push({ role: 'model', parts: [{text: responseText}] });
                    this.addLogEntry(tool.id, prompt, responseText, project);
                    this.openModal('viewLogEntry', { logIndex: this.state.log.length - 1 });
                }
            } catch (error) {
                console.error("AI Generation Error:", error);
                this.state.currentChatSession = null; // Clear broken session
                this.dom.modalBody.innerHTML = `<p>An error occurred: ${error.message}</p>`;
            }
        },

        async handleQuizzer(prompt, project) {
            try {
                const generationSchema = {
                    type: Type.OBJECT,
                    properties: {
                        mcqs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING } } } },
                        short_answers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } } } }
                    }
                };
                
                const genResponse = await this.ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Generate a quiz with 5 multiple choice questions and 3 short answer questions based on this text: ${prompt}`,
                    config: { responseMimeType: 'application/json', responseSchema: generationSchema, systemInstruction: "You are an AI that creates quizzes based on provided text." }
                });
                const quizData = JSON.parse(genResponse.text);
                this.renderQuizInterface(quizData, prompt, project);

            } catch (error) {
                console.error("Quiz Generation Error:", error);
                this.state.currentChatSession = null;
                this.dom.modalBody.innerHTML = `<p>Could not generate quiz. The AI might have had trouble understanding the source text. Error: ${error.message}</p>`;
            }
        },
        
        renderQuizInterface(quizData, originalPrompt, project) {
            const mcqHtml = quizData.mcqs.map((mcq, index) => `
                <div class="quiz-question">
                    <strong>Question ${index + 1}:</strong> ${mcq.question}
                    <div class="mcq-options" data-mcq-index="${index}">
                        ${mcq.options.map(option => `<button type="button" class="mcq-option" data-option="${this.escapeHtml(option)}">${this.escapeHtml(option)}</button>`).join('')}
                    </div>
                </div>
            `).join('');

            const saHtml = quizData.short_answers.map((sa, index) => `
                 <div class="quiz-question">
                    <strong>Question ${index + 1 + quizData.mcqs.length}:</strong> ${sa.question}
                    <textarea class="input-field short-answer-input" name="sa-${index}"></textarea>
                </div>
            `).join('');

            this.dom.modalBody.innerHTML = `
                <h2>AI Quiz</h2>
                <form id="quiz-form">
                    ${mcqHtml}
                    ${saHtml}
                    <button type="submit" class="btn">Submit for Grading</button>
                </form>
            `;

            this.dom.modalBody.querySelectorAll('.mcq-options').forEach(container => {
                container.addEventListener('click', e => {
                    if (e.target.classList.contains('mcq-option')) {
                        container.querySelectorAll('.mcq-option').forEach(btn => btn.classList.remove('selected'));
                        e.target.classList.add('selected');
                    }
                });
            });

            this.dom.modalBody.querySelector('#quiz-form').addEventListener('submit', e => {
                e.preventDefault();
                this.gradeQuiz(quizData, originalPrompt, project);
            });
        },
        
        async gradeQuiz(quizData, originalPrompt, project) {
            const form = this.dom.modalBody.querySelector('#quiz-form');
            const userAnswers = { mcqs: [], short_answers: [] };
            
            quizData.mcqs.forEach((mcq, index) => {
                const selectedButton = form.querySelector(`.mcq-options[data-mcq-index="${index}"] .mcq-option.selected`);
                userAnswers.mcqs.push({ question: mcq.question, answer: selectedButton ? selectedButton.dataset.option : "Not answered" });
            });
            quizData.short_answers.forEach((sa, index) => {
                const answerInput = form.querySelector(`textarea[name="sa-${index}"]`);
                userAnswers.short_answers.push({ question: sa.question, answer: answerInput ? answerInput.value : "Not answered" });
            });

            this.renderModalContent_loading("Evaluating your answers...");
            
            try {
                const gradingSchema = {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        results: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, user_answer: { type: Type.STRING }, is_correct: { type: Type.BOOLEAN }, feedback: { type: Type.STRING } } } }
                    }
                };
                
                const gradingPrompt = `Evaluate the user's answers against the correct answers and provide feedback. Original Quiz Data: ${JSON.stringify(quizData)}. User's Submitted Answers: ${JSON.stringify(userAnswers)}. Based on this, generate a JSON object with the user's score and a detailed results array. For each question, state if the user was correct and provide brief feedback, especially for incorrect answers.`;

                const gradingResponse = await this.ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: gradingPrompt,
                    config: { responseMimeType: 'application/json', responseSchema: gradingSchema, systemInstruction: "You are an AI Quiz Grader." }
                });

                const resultsData = JSON.parse(gradingResponse.text);
                this.renderQuizResults(resultsData, originalPrompt, project);
                
            } catch(error) {
                 console.error("Quiz Grading Error:", error);
                 this.state.currentChatSession = null;
                 this.dom.modalBody.innerHTML = `<p>An error occurred during grading. ${error.message}</p>`;
            }
        },

        renderQuizResults(resultsData, originalPrompt, project) {
            let correctCount = 0;
            const totalQuestions = resultsData.results.length;

            const resultsHtml = resultsData.results.map(result => {
                if (result.is_correct) correctCount++;
                return `
                    <div class="quiz-question-result ${result.is_correct ? 'correct' : 'incorrect'}">
                        <div class="result-header">
                            <strong>${result.question}</strong>
                            <i class="fas ${result.is_correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        </div>
                        <p>Your answer: <em>${this.escapeHtml(result.user_answer)}</em></p>
                        ${!result.is_correct ? `<div class="feedback-box"><p><strong>Feedback:</strong> ${result.feedback}</p></div>` : ''}
                    </div>
                `;
            }).join('');
            
            this.dom.modalBody.innerHTML = `
                <div class="quiz-results">
                    <h2>Quiz Results <span class="score-badge">${correctCount} / ${totalQuestions} Correct</span></h2>
                    ${resultsHtml}
                </div>
                 <div class="chat-window-container">
                    <p>Want to review? Ask a follow-up question below.</p>
                    <form id="chat-form">
                        <div class="chat-input-container">
                            <textarea id="chat-input" class="input-field" placeholder="e.g., Explain why question 2 was wrong..." required></textarea>
                            <button type="submit" class="btn">Send</button>
                        </div>
                    </form>
                </div>
            `;
            
            const logResponse = `Completed a quiz. Score: ${correctCount}/${totalQuestions}.\n\nResults:\n${JSON.stringify(resultsData, null, 2)}`;
            this.addLogEntry('quizzer', originalPrompt, logResponse, project);

            this.state.currentChatSession = {
                toolId: 'quizzer',
                history: [
                    { role: 'user', parts: [{text: `I took a quiz based on this text: ${originalPrompt}`}] },
                    { role: 'model', parts: [{text: `Great. My memory of the quiz and your results are ready. Your score was ${correctCount}/${totalQuestions}. How can I help you review?` }] }
                ],
            };
            this.bindChatForm();
        },
        
        async handleCollegeMatchmaker(prompt, project) {
             try {
                const schema = {
                    type: Type.OBJECT,
                    properties: {
                        reach: {
                            type: Type.ARRAY,
                            description: "List of reach schools.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Name of the college." },
                                    location: { type: Type.STRING, description: "Location of the college." },
                                    rationale: { type: Type.STRING, description: "Reason for this recommendation." }
                                }
                            }
                        },
                        match: {
                            type: Type.ARRAY,
                            description: "List of match schools.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Name of the college." },
                                    location: { type: Type.STRING, description: "Location of the college." },
                                    rationale: { type: Type.STRING, description: "Reason for this recommendation." }
                                }
                            }
                        },
                        safety: {
                            type: Type.ARRAY,
                            description: "List of safety schools.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Name of the college." },
                                    location: { type: Type.STRING, description: "Location of the college." },
                                    rationale: { type: Type.STRING, description: "Reason for this recommendation." }
                                }
                            }
                        }
                    }
                };

                const response = await this.ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Based on the following student profile, find 2-3 colleges for each category (reach, match, safety). Profile: ${prompt}`,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: schema,
                        systemInstruction: "You are a helpful college guidance counselor AI. Your task is to recommend colleges based on the user's profile. You MUST format your entire response as a single, valid JSON object matching the provided schema with three keys: 'reach', 'match', and 'safety'. Each key should be an array of objects, where each object has 'name', 'location', and 'rationale' properties."
                    }
                });
                
                let matchData;
                try {
                    matchData = JSON.parse(response.text);
                } catch(e) {
                    console.error("Failed to parse College Matchmaker JSON", e);
                    throw new Error("The AI returned an invalid format. Please try again.");
                }
                
                this.renderCollegeMatchmakerResults(matchData, prompt, project);
                this.addLogEntry('college-matchmaker', prompt, JSON.stringify(matchData), project);

            } catch (error) {
                console.error("College Matchmaker Error:", error);
                this.state.currentChatSession = null;
                this.dom.modalBody.innerHTML = `<p>Could not find college matches. Error: ${error.message}</p>`;
            }
        },
        
        renderCollegeMatchmakerResults(data, prompt, project, isFromLog = false) {
             const createCategoryHtml = (title, colleges) => {
                if (!colleges || colleges.length === 0) return '';
                return `
                    <div class="college-category">
                        <h3>${title}</h3>
                        ${colleges.map(college => `
                            <div class="college-card">
                                <h4>${college.name}</h4>
                                <p><strong>Location:</strong> ${college.location}</p>
                                <p>${college.rationale}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            };

            const resultsHtml = `
                <div class="college-match-container">
                    ${createCategoryHtml('Reach Schools', data.reach)}
                    ${createCategoryHtml('Match Schools', data.match)}
                    ${createCategoryHtml('Safety Schools', data.safety)}
                </div>
            `;
            
            if (isFromLog) return resultsHtml;
            this.dom.modalBody.innerHTML = `<h2>College Recommendations</h2>${resultsHtml}`;
        },

        async handleEcPolisher(prompt, project) {
            try {
                const schema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT, properties: {
                            description: { type: Type.STRING, description: "A polished version of the activity description, 150 characters or less." },
                            focus: { type: Type.STRING, description: "The angle or key skill this version emphasizes (e.g., 'Leadership', 'Initiative', 'Teamwork')." }
                        }
                    }
                };

                const response = await this.ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `A student described their extracurricular activity: "${prompt}". Rewrite this into 3-5 powerful, concise versions suitable for a college application, each under 150 characters. For each version, identify the key focus.`,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: schema,
                        systemInstruction: "You are an expert at editing college application essays. You are direct and provide concise, impactful suggestions."
                    }
                });
                const polishedData = JSON.parse(response.text);
                
                this.renderEcPolisherResults(polishedData, prompt, project);
                this.addLogEntry('extracurricular-polisher', prompt, JSON.stringify(polishedData), project);
            } catch (error) {
                console.error("EC Polisher Error:", error);
                this.state.currentChatSession = null;
                this.dom.modalBody.innerHTML = `<p>Could not polish text. Error: ${error.message}</p>`;
            }
        },

        renderEcPolisherResults(data, prompt, project, isFromLog = false) {
             const resultsHtml = `
                <div class="ec-results-container">
                    <h3>Suggested Revisions:</h3>
                    ${data.map(item => `
                        <div class="ec-item">
                            <span class="ec-focus-tag">${item.focus}</span>
                            <p>${item.description}</p>
                            <button class="copy-btn" data-action="copy-to-clipboard" title="Copy to clipboard"><i class="fas fa-copy"></i></button>
                        </div>
                    `).join('')}
                </div>
            `;
            if (isFromLog) return resultsHtml;
            this.dom.modalBody.innerHTML = `<h2>Extracurricular Polisher</h2>${resultsHtml}`;
        },
        
        startInterview(interviewType) {
            const systemInstructions = {
                college: "You are a friendly but professional college admissions interviewer. Your goal is to get to know the applicant better. Start by introducing yourself and then ask a common opening question like 'Tell me a bit about yourself.' Ask relevant follow-up questions based on their answers. Keep your responses concise.",
                job: "You are a hiring manager for a tech company. You are professional and looking for the best candidate. Start by introducing yourself and the role they are interviewing for. Then ask a standard behavioral or technical question. Ask relevant follow-up questions. Keep your responses focused on the job."
            };

            const prompt = `Start a ${interviewType} interview.`
            const toolId = 'interview-simulator';
            this.addLogEntry(toolId, prompt, `Interview session started. Type: ${interviewType}`, 'Default');

            this.state.currentChatSession = {
                toolId: toolId,
                history: [],
                systemInstruction: systemInstructions[interviewType]
            };
            
            this.dom.modalBody.innerHTML = this.renderModalContent_chat(systemInstructions[interviewType]);
            this.bindChatForm();
            this.sendMessageToChat(`Let's begin the ${interviewType} interview practice.`, this.dom.modalBody.querySelector('#chat-form'));

        },


        async sendMessageToChat(message, form) {
            if (!this.state.currentChatSession) {
                console.error("sendMessageToChat called with no active session.");
                const chatWindow = document.getElementById('chat-window');
                if (chatWindow) {
                     const errorEl = document.createElement('div');
                     errorEl.className = 'chat-message model-message';
                     errorEl.innerHTML = `<div><p>Sorry, the chat session has ended due to an error. Please close this window and start again.</p></div>`;
                     chatWindow.appendChild(errorEl);
                }
                return;
            }

            const chatWindow = document.getElementById('chat-window');
            const submitButton = form.querySelector('button[type="submit"]');
            
            const userMsgEl = document.createElement('div');
            userMsgEl.className = 'chat-message user-message';
            userMsgEl.innerHTML = `<div>${message}</div>`;
            chatWindow.appendChild(userMsgEl);

            this.state.currentChatSession.history.push({ role: 'user', parts: [{text: message}] });

            submitButton.disabled = true;
            const loadingEl = document.createElement('div');
            loadingEl.className = 'chat-message model-message';
            loadingEl.innerHTML = `<div><div class="loading-dots"><div></div><div></div><div></div></div></div>`;
            chatWindow.appendChild(loadingEl);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            try {
                const persona = this.personas[this.state.currentChatSession.personaKey];
                const tool = this.tools.find(t => t.id === this.state.currentChatSession.toolId);

                const modelConfig = {
                    systemInstruction: this.state.currentChatSession.systemInstruction || (tool ? tool.systemInstruction : (persona ? persona.systemInstruction : "You are a helpful AI."))
                };

                const response = await this.ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: this.state.currentChatSession.history,
                    config: modelConfig,
                });
                const responseText = response.text;

                this.state.currentChatSession.history.push({ role: 'model', parts: [{text: responseText}] });
                loadingEl.innerHTML = `<div>${this.formatResponse(responseText)}</div>`;

            } catch (error) {
                console.error("Chat Error:", error);
                loadingEl.innerHTML = `<div><p>Sorry, an error occurred: ${error.message}</p></div>`;
                this.state.currentChatSession = null; // Clear broken session
            } finally {
                submitButton.disabled = false;
                chatWindow.scrollTop = chatWindow.scrollHeight;
                if(form.querySelector('textarea')) form.querySelector('textarea').focus();
            }
        },

        bindChatForm() {
            const form = this.dom.modalBody.querySelector('#chat-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const input = form.querySelector('#chat-input');
                    const message = input.value.trim();
                    if (message) {
                        this.sendMessageToChat(message, form);
                        input.value = '';
                    }
                });
            }
        },
        
        bindFileDropZone(dropZone) {
            dropZone.addEventListener('click', () => document.getElementById('file-input').click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });
            document.getElementById('file-input').addEventListener('change', (e) => {
                const files = e.target.files;
                 if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });
        },
        
        handleFile(file) {
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('prompt-input').value = e.target.result;
                };
                reader.readAsText(file);
            } else {
                alert('Only .txt files are supported.');
            }
        },

        addLogEntry(toolId, prompt, response, project) {
            const newEntry = {
                toolId,
                prompt,
                response, // can be a JSON string or plain text
                project,
                timestamp: new Date().toISOString(),
                pinned: false
            };
            this.state.log.push(newEntry);
            this.saveData('orbit-captains-log', this.state.log);
            this.render();
        },

        deleteSelectedLogs() {
            if (this.state.selectedLogIndices.size === 0) return;
            if (!confirm(`Are you sure you want to delete ${this.state.selectedLogIndices.size} log entries? This cannot be undone.`)) return;

            this.state.log = this.state.log.filter((_, index) => !this.state.selectedLogIndices.has(index));
            this.state.selectedLogIndices.clear();
            this.saveData('orbit-captains-log', this.state.log);
            this.render();
        },
        
        togglePinLog(index) {
            this.state.log[index].pinned = !this.state.log[index].pinned;
            this.saveData('orbit-captains-log', this.state.log);
            this.renderLogList();
        },

        exportAllLogs() {
            this.exportData(this.state.log, 'orbit_log_full.json');
        },
        
        exportSelectedLogs() {
             if (this.state.selectedLogIndices.size === 0) {
                alert("No entries selected for export.");
                return;
             }
             const selectedLogs = this.state.log.filter((_, index) => this.state.selectedLogIndices.has(index));
             this.exportData(selectedLogs, 'orbit_log_selected.json');
        },
        
        exportData(data, filename) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        importLogFromJson(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedLog = JSON.parse(event.target.result);
                    if (Array.isArray(importedLog) && confirm(`Import ${importedLog.length} entries? This will be added to your current log.`)) {
                        this.state.log = [...this.state.log, ...importedLog];
                        this.saveData('orbit-captains-log', this.state.log);
                        this.render();
                        alert('Import successful!');
                    } else {
                        throw new Error("Invalid log file format.");
                    }
                } catch (err) {
                    alert(`Import failed: ${err.message}`);
                }
            };
            reader.readAsText(file);
        },

        addProject() {
            const input = document.getElementById('new-project-name');
            const newProjectName = input.value.trim();
            if (newProjectName && !this.state.projects.includes(newProjectName)) {
                this.state.projects.push(newProjectName);
                this.saveData('orbit-projects', this.state.projects);
                this.dom.modalBody.innerHTML = this.renderModalContent_manageProjects(); // Re-render modal
                 this.dom.modalBody.querySelector('#add-project-form').addEventListener('submit', (e) => { // Re-bind event
                    e.preventDefault(); this.addProject();
                });
                this.renderLogFilters();
            }
        },

        deleteProject(projectName) {
            if (projectName === 'Default') return;
            if (confirm(`Are you sure you want to delete the project "${projectName}"?`)) {
                this.state.projects = this.state.projects.filter(p => p !== projectName);
                // Optionally re-assign log entries
                this.state.log.forEach(entry => {
                    if(entry.project === projectName) entry.project = 'Default';
                });
                this.saveData('orbit-projects', this.state.projects);
                this.saveData('orbit-captains-log', this.state.log);
                this.dom.modalBody.innerHTML = this.renderModalContent_manageProjects(); // Re-render modal
                this.dom.modalBody.querySelector('#add-project-form').addEventListener('submit', (e) => { // Re-bind event
                    e.preventDefault(); this.addProject();
                });
                this.render();
            }
        },
        
        loadCustomPersona() {
            const customPersona = this.loadData('orbit-custom-persona', null);
            if(customPersona) {
                this.personas.custom = customPersona;
            }
        },

        saveCustomPersona() {
            const name = document.getElementById('custom-persona-name').value;
            const instruction = document.getElementById('custom-persona-instruction').value;
            this.personas.custom = { name, systemInstruction: instruction, avatar: 'fa-user-pen' };
            this.saveData('orbit-custom-persona', this.personas.custom);
            this.render();
            this.closeModal();
        },
        
        // Pomodoro Timer
        initPomodoro() {
            this.updatePomodoroDisplay();
        },
        updatePomodoroDisplay() {
            const { timeRemaining, isRunning, isWorkSession, workDuration, breakDuration } = this.state.pomodoro;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            this.dom.pomodoroTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.dom.pomodoroControls.querySelector('i').className = `fas ${isRunning ? 'fa-pause' : 'fa-play'}`;
            this.dom.pomodoroStatus.textContent = isWorkSession ? 'Work Session' : 'Break Time';
            
            const totalDuration = isWorkSession ? workDuration : breakDuration;
            const progress = (totalDuration - timeRemaining) / totalDuration;
            const circumference = 2 * Math.PI * 54;
            this.dom.pomodoroProgress.style.strokeDasharray = circumference;
            this.dom.pomodoroProgress.style.strokeDashoffset = circumference * (1 - progress);
        },
        startPomodoroTimer() {
            this.state.pomodoro.isRunning = true;
            this.pomodoroInterval = setInterval(() => {
                this.state.pomodoro.timeRemaining--;
                if (this.state.pomodoro.timeRemaining < 0) {
                    this.state.pomodoro.isWorkSession = !this.state.pomodoro.isWorkSession;
                    this.state.pomodoro.timeRemaining = this.state.pomodoro.isWorkSession ? this.state.pomodoro.workDuration : this.state.pomodoro.breakDuration;
                    new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3').play(); // Simple notification sound
                }
                this.updatePomodoroDisplay();
            }, 1000);
            this.updatePomodoroDisplay();
        },
        pausePomodoroTimer() {
            this.state.pomodoro.isRunning = false;
            clearInterval(this.pomodoroInterval);
            this.updatePomodoroDisplay();
        },
        resetPomodoro() {
            this.pausePomodoroTimer();
            this.state.pomodoro.timeRemaining = this.state.pomodoro.isWorkSession ? this.state.pomodoro.workDuration : this.state.pomodoro.breakDuration;
            this.updatePomodoroDisplay();
        },

        // Notepad and Canvas
        initNotepad() {
            // Textarea logic
            this.dom.notepadArea.value = this.state.notepadContent;
            this.dom.notepadArea.addEventListener('input', () => {
                this.state.notepadContent = this.dom.notepadArea.value;
                this.dom.notepadStatus.textContent = 'Saving...';
                clearTimeout(this.notepadSaveTimeout);
                this.notepadSaveTimeout = setTimeout(() => {
                    this.saveData('orbit-notepad', this.state.notepadContent);
                    this.dom.notepadStatus.textContent = 'Saved!';
                }, 1000);
            });

            // Canvas Drawing Logic
            const canvas = this.dom.notepadCanvas;
            const ctx = canvas.getContext('2d');
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            const drawColorInput = document.getElementById('draw-color');
            const drawWidthInput = document.getElementById('draw-width');

            const draw = (e) => {
                if (!isDrawing) return;
                
                // Set tool properties based on state
                if (this.state.notepadDrawTool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = drawColorInput.value;
                }

                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.lineWidth = drawWidthInput.value;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                [lastX, lastY] = [e.offsetX, e.offsetY];
            }

            canvas.addEventListener('mousedown', (e) => {
                isDrawing = true;
                [lastX, lastY] = [e.offsetX, e.offsetY];
            });
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', () => isDrawing = false);
            canvas.addEventListener('mouseout', () => isDrawing = false);

            // Set initial mode from state
            this.setNotepadMode(this.state.notepadMode);
            // Add resize listener to handle responsive resizing
            new ResizeObserver(() => this.resizeCanvas()).observe(this.dom.notepadContentContainer);
        },
        
        setNotepadMode(mode) {
            if (!mode || this.state.notepadMode === mode) return;
            this.state.notepadMode = mode;

            document.querySelectorAll('[data-action="set-notepad-mode"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });

            if (mode === 'draw') {
                this.dom.notepadArea.style.display = 'none';
                this.dom.notepadCanvas.style.display = 'block';
                this.dom.notepadDrawControls.style.display = 'flex';
                this.renderDrawToolState(); // Ensure tool UI is correct
                this.resizeCanvas();
            } else {
                this.dom.notepadArea.style.display = 'block';
                this.dom.notepadCanvas.style.display = 'none';
                this.dom.notepadDrawControls.style.display = 'none';
            }
        },

        renderDrawToolState() {
            const tool = this.state.notepadDrawTool;
            document.querySelectorAll('[data-action="set-draw-tool"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });
            const colorPicker = document.getElementById('draw-color');
            const colorLabel = colorPicker.previousElementSibling;
             if (tool === 'eraser') {
                colorPicker.style.visibility = 'hidden';
                colorLabel.style.visibility = 'hidden';
            } else {
                colorPicker.style.visibility = 'visible';
                colorLabel.style.visibility = 'visible';
            }
        },

        setDrawTool(tool) {
            if (!tool || this.state.notepadDrawTool === tool) return;
            this.state.notepadDrawTool = tool;
            this.renderDrawToolState();
        },

        resizeCanvas() {
            const canvas = this.dom.notepadCanvas;
            const ctx = canvas.getContext('2d');
            // Save the current canvas content
            const tempImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Resize the canvas
            canvas.width = this.dom.notepadContentContainer.offsetWidth;
            canvas.height = this.dom.notepadContentContainer.offsetHeight;
            // Restore the content
            ctx.putImageData(tempImageData, 0, 0);
            // Re-apply current tool settings
            this.renderDrawToolState();
        },

        clearNotepadCanvas() {
            const canvas = this.dom.notepadCanvas;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
            }, (err) => {
                console.error('Could not copy text: ', err);
            });
        },

        escapeHtml(unsafe) {
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        },

    };

    App.init();

});
