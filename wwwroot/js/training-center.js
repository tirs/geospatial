// Training Center - Flow Architecture Implementation
class TrainingCenter {
    constructor() {
        this.currentModule = 0;
        this.quizResults = {}; // Track quiz completion and correctness
        this.modules = [
            {
                id: 'welcome',
                title: 'Welcome & System Overview',
                description: 'System introduction and architecture',
                progress: 0,
                content: this.getWelcomeContent()
            },
            {
                id: 'navigation',
                title: 'System Navigation Flow',
                description: 'Learn navigation patterns and workflows',
                progress: 0,
                content: this.getNavigationContent()
            },
            {
                id: 'customer-service',
                title: 'Customer Service Workflow',
                description: 'Customer interaction flow and best practices',
                progress: 0,
                content: this.getCustomerServiceContent()
            },
            {
                id: 'contractor-management',
                title: 'Contractor Management Flow',
                description: 'Contractor lifecycle and referral processes',
                progress: 0,
                content: this.getContractorManagementContent()
            },
            {
                id: 'call-center',
                title: 'Call Center Operations Flow',
                description: 'Call handling and processing workflows',
                progress: 0,
                content: this.getCallCenterContent()
            },
            {
                id: 'troubleshooting',
                title: 'Troubleshooting Flow',
                description: 'Issue resolution and escalation flows',
                progress: 0,
                content: this.getTroubleshootingContent()
            }
        ];
        this.init();
    }

    init() {
        this.renderModuleList();
        this.loadModule(0);
        this.updateProgress();
    }

    renderModuleList() {
        const moduleList = document.getElementById('moduleList');
        if (!moduleList) return;

        moduleList.innerHTML = this.modules.map((module, index) => `
            <li class="module-item">
                <div class="module-link ${index === this.currentModule ? 'active' : ''}" 
                     onclick="trainingCenter.loadModule(${index})">
                    <div class="module-title">${module.title}</div>
                    <div class="module-desc">${module.description}</div>
                    <div class="module-progress">
                        <div class="progress-fill" style="width: ${module.progress}%"></div>
                    </div>
                </div>
            </li>
        `).join('');
    }

    loadModule(index) {
        if (index < 0 || index >= this.modules.length) return;
        
        this.currentModule = index;
        const module = this.modules[index];
        
        document.getElementById('contentTitle').textContent = module.title;
        document.getElementById('contentSubtitle').textContent = module.description;
        document.getElementById('contentBody').innerHTML = module.content;
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        prevBtn.disabled = index === 0;
        
        // Update next button based on quiz completion
        this.updateNavigationButtons();
        
        this.renderModuleList();
        document.getElementById('contentBody').scrollTop = 0;
    }

    updateProgress() {
        const totalProgress = this.modules.reduce((sum, module) => sum + module.progress, 0);
        const overallProgress = Math.round(totalProgress / this.modules.length);
        
        document.getElementById('overallProgress').textContent = overallProgress + '%';
        document.querySelector('.progress-tracker .progress-fill').style.width = overallProgress + '%';
        
        const finalAssessmentBtn = document.getElementById('finalAssessmentBtn');
        if (finalAssessmentBtn && this.isTrainingComplete()) {
            finalAssessmentBtn.disabled = false;
            finalAssessmentBtn.style.opacity = '1';
            finalAssessmentBtn.style.background = '#059669';
            finalAssessmentBtn.innerHTML = '🎓 Take Final Assessment - Unlocked!';
        }
    }

    moduleHasQuiz(moduleId) {
        // List of modules that have quizzes
        const modulesWithQuizzes = ['welcome', 'navigation', 'customer-service', 'contractor-management', 'call-center', 'troubleshooting'];
        return modulesWithQuizzes.includes(moduleId);
    }

    isTrainingComplete() {
        return this.modules.every(module => module.progress === 100);
    }

    areAllQuizzesCompleted() {
        // Check if all modules with quizzes have been completed correctly
        return this.modules.every(module => {
            if (!this.moduleHasQuiz(module.id)) return true;
            const quizResult = this.quizResults[module.id];
            return quizResult && quizResult.completed && quizResult.correct;
        });
    }

    nextModule() {
        if (this.currentModule < this.modules.length - 1) {
            this.loadModule(this.currentModule + 1);
        } else {
            // On last module, show completion message or trigger final assessment
            this.handleTrainingCompletion();
        }
    }

    previousModule() {
        if (this.currentModule > 0) {
            this.loadModule(this.currentModule - 1);
        }
    }

    handleTrainingCompletion() {
        // Check if all quizzes are completed correctly
        const allQuizzesCorrect = this.areAllQuizzesCompleted();
        
        if (allQuizzesCorrect) {
            // Show completion message and offer final assessment
            const completionMessage = `
                <div class="completion-message">
                    <h3>🎉 Congratulations!</h3>
                    <p>You've completed all training modules and answered all quizzes correctly. Ready for the final assessment?</p>
                    <button onclick="trainingCenter.generateFinalAssessment()" class="btn btn-primary">
                        🎓 Take Final Assessment
                    </button>
                </div>
            `;
            
            // Show modal or update content
            this.showCompletionModal(completionMessage);
        } else {
            // Show which quizzes need to be completed
            const incompleteQuizzes = this.getIncompleteQuizzes();
            const quizList = incompleteQuizzes.map(moduleId => {
                const module = this.modules.find(m => m.id === moduleId);
                return `• ${module.title}`;
            }).join('<br>');
            
            alert(`Complete all quizzes correctly before taking the final assessment!\n\nIncomplete quizzes:\n${quizList.replace(/<br>/g, '\n')}`);
        }
    }

    getIncompleteQuizzes() {
        return this.modules
            .filter(module => this.moduleHasQuiz(module.id))
            .filter(module => {
                const quizResult = this.quizResults[module.id];
                return !quizResult || !quizResult.completed || !quizResult.correct;
            })
            .map(module => module.id);
    }

    showCompletionModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Training Complete</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createQuiz(moduleId, question, options, correctAnswer) {
        return `
            <div class="quiz-section">
                <h4>📝 Quick Quiz</h4>
                <div class="quiz-question">${question}</div>
                <ul class="quiz-options">
                    ${options.map((option, index) => `
                        <li class="quiz-option">
                            <label>
                                <input type="radio" name="quiz-${moduleId}" value="${index}">
                                ${option}
                            </label>
                        </li>
                    `).join('')}
                </ul>
                <button onclick="checkAnswer('${moduleId}', ${correctAnswer})" class="quiz-submit">
                    Check Answer
                </button>
                <div id="quiz-result-${moduleId}" class="quiz-result"></div>
            </div>
        `;
    }

    checkQuizAnswer(moduleId, correctAnswer) {
        const selectedOption = document.querySelector(`input[name="quiz-${moduleId}"]:checked`);
        const resultDiv = document.getElementById(`quiz-result-${moduleId}`);
        
        if (!selectedOption) {
            alert('Please select an answer first!');
            return;
        }
        
        const isCorrect = parseInt(selectedOption.value) === correctAnswer;
        const moduleIndex = this.modules.findIndex(m => m.id === moduleId);
        
        // Track quiz results
        this.quizResults[moduleId] = {
            completed: true,
            correct: isCorrect,
            attempts: (this.quizResults[moduleId]?.attempts || 0) + 1
        };
        
        if (isCorrect && moduleIndex !== -1) {
            this.modules[moduleIndex].progress = 100; // Complete the module when quiz is correct
            this.updateProgress();
            this.renderModuleList();
        } else if (!isCorrect && moduleIndex !== -1) {
            this.modules[moduleIndex].progress = 0; // Reset progress for incorrect answers
            this.updateProgress();
            this.renderModuleList();
        }
        
        // Show result with retry option for incorrect answers
        const retryButton = !isCorrect ? `
            <button onclick="trainingCenter.retakeQuiz('${moduleId}')" class="btn btn-warning" style="margin-top: 1rem;">
                🔄 Retake Quiz
            </button>
        ` : '';
        
        resultDiv.innerHTML = `
            <div class="quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong>
                <p>${isCorrect ? 'Great job! You can now proceed to the next module.' : 'Review the material and try again. You must answer correctly to proceed.'}</p>
                ${retryButton}
            </div>
        `;
        resultDiv.style.display = 'block';
        
        // Disable quiz inputs only if correct
        if (isCorrect) {
            document.querySelectorAll(`input[name="quiz-${moduleId}"]`).forEach(input => {
                input.disabled = true;
            });
            document.querySelector(`button[onclick*="checkAnswer('${moduleId}'"]`).disabled = true;
        }
        
        // Update navigation buttons based on quiz result
        this.updateNavigationButtons();
    }

    retakeQuiz(moduleId) {
        // Reset quiz state
        this.quizResults[moduleId] = {
            completed: false,
            correct: false,
            attempts: this.quizResults[moduleId]?.attempts || 0
        };
        
        // Clear previous selection and enable inputs
        document.querySelectorAll(`input[name="quiz-${moduleId}"]`).forEach(input => {
            input.checked = false;
            input.disabled = false;
        });
        
        // Re-enable submit button
        const submitBtn = document.querySelector(`button[onclick*="checkAnswer('${moduleId}'"]`);
        if (submitBtn) {
            submitBtn.disabled = false;
        }
        
        // Clear result display
        const resultDiv = document.getElementById(`quiz-result-${moduleId}`);
        if (resultDiv) {
            resultDiv.innerHTML = '';
            resultDiv.style.display = 'none';
        }
        
        // Update navigation
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const currentModuleId = this.modules[this.currentModule].id;
        const hasQuiz = this.moduleHasQuiz(currentModuleId);
        const quizResult = this.quizResults[currentModuleId];
        const quizCompleted = quizResult?.completed || false;
        const quizCorrect = quizResult?.correct || false;
        
        const nextBtn = document.getElementById('nextBtn');
        if (!nextBtn) return;
        
        if (this.currentModule === this.modules.length - 1) {
            // Last module
            if (hasQuiz && (!quizCompleted || !quizCorrect)) {
                nextBtn.disabled = true;
                nextBtn.innerHTML = '🔒 Complete Quiz First';
                nextBtn.classList.remove('btn-complete');
                nextBtn.classList.add('btn-locked');
            } else {
                nextBtn.disabled = false;
                nextBtn.innerHTML = '🎯 Complete Training';
                nextBtn.classList.add('btn-complete');
                nextBtn.classList.remove('btn-locked');
            }
        } else {
            // Regular modules
            if (hasQuiz && (!quizCompleted || !quizCorrect)) {
                nextBtn.disabled = true;
                nextBtn.innerHTML = '🔒 Complete Quiz First';
                nextBtn.classList.remove('btn-complete');
                nextBtn.classList.add('btn-locked');
            } else {
                nextBtn.disabled = false;
                nextBtn.innerHTML = 'Next →';
                nextBtn.classList.remove('btn-complete', 'btn-locked');
            }
        }
    }

    createFlowDiagram(title, steps) {
        const stepElements = steps.map((step, index) => `
            <div class="flow-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <h6>${step.title}</h6>
                    <p>${step.description}</p>
                </div>
            </div>
        `).join('');

        return `
            <div class="flow-architecture">
                <h4 class="flow-title">🔄 ${title}</h4>
                <div class="flow-diagram">
                    ${stepElements}
                </div>
            </div>
        `;
    }

    getWelcomeContent() {
        return `
            <div class="lesson-section">
                <h2>Welcome to Urban Referral Network</h2>
                <p>Welcome to the comprehensive training program for the Urban Referral Network system. This training focuses on understanding system workflows and architecture through interactive flow diagrams.</p>
                
                ${this.createFlowDiagram('System Overview Architecture', [
                    { title: 'Customer Contact', description: 'Phone call or web inquiry' },
                    { title: 'Request Processing', description: 'Gather requirements and location' },
                    { title: 'Contractor Matching', description: 'Find suitable contractors' },
                    { title: 'Referral Creation', description: 'Generate and send referral' },
                    { title: 'Follow-up', description: 'Track completion and feedback' }
                ])}
                
                <h3>Training Objectives</h3>
                <ul>
                    <li>Master system navigation and core workflows</li>
                    <li>Learn customer service flow patterns</li>
                    <li>Understand contractor management processes</li>
                    <li>Become proficient in call center operations</li>
                    <li>Develop troubleshooting methodologies</li>
                </ul>
                
                <div class="architecture-grid">
                    <div class="arch-component">
                        <h5>📊 Dashboard Layer</h5>
                        <p>Real-time metrics and system overview</p>
                    </div>
                    <div class="arch-component">
                        <h5>🔍 Search Engine</h5>
                        <p>Contractor matching and filtering</p>
                    </div>
                    <div class="arch-component">
                        <h5>📞 Call Center</h5>
                        <p>Call handling and queue management</p>
                    </div>
                    <div class="arch-component">
                        <h5>⚙️ Admin Panel</h5>
                        <p>System configuration and management</p>
                    </div>
                </div>
                
                ${this.createQuiz('welcome', 'What is the first step in the system workflow?', [
                    'Contractor Matching',
                    'Customer Contact',
                    'Referral Creation',
                    'Follow-up'
                ], 1)}
            </div>
        `;
    }

    getNavigationContent() {
        return `
            <div class="lesson-section">
                <h2>System Navigation Flow</h2>
                <p>Learn how to efficiently navigate through the Urban Referral Network interface using flow-based patterns.</p>
                
                ${this.createFlowDiagram('Navigation Workflow', [
                    { title: 'Login', description: 'Authenticate and access system' },
                    { title: 'Dashboard', description: 'View system overview and alerts' },
                    { title: 'Module Selection', description: 'Choose appropriate function' },
                    { title: 'Task Execution', description: 'Perform required operations' },
                    { title: 'Completion', description: 'Save and confirm actions' }
                ])}
                
                <h3>Main Navigation Areas</h3>
                <ul>
                    <li><strong>Dashboard:</strong> Overview of system activity and key metrics</li>
                    <li><strong>Contractor Finder:</strong> Search and manage contractor referrals</li>
                    <li><strong>Call Center:</strong> Handle incoming calls and create referrals</li>
                    <li><strong>Admin Panel:</strong> System administration and configuration</li>
                </ul>
                
                <h3>Keyboard Shortcuts</h3>
                <ul>
                    <li><kbd>Alt + A</kbd> - Answer next call</li>
                    <li><kbd>Alt + H</kbd> - Hold current call</li>
                    <li><kbd>Alt + E</kbd> - End current call</li>
                    <li><kbd>Ctrl + F</kbd> - Quick search</li>
                </ul>
                
                ${this.createQuiz('navigation', 'Which keyboard shortcut answers the next call?', [
                    'Alt + A',
                    'Alt + H',
                    'Ctrl + F',
                    'Alt + E'
                ], 0)}
            </div>
        `;
    }

    getCustomerServiceContent() {
        return `
            <div class="lesson-section">
                <h2>Customer Service Workflow</h2>
                <p>Master the customer service workflow to provide exceptional support and efficient referral processing.</p>
                
                ${this.createFlowDiagram('Customer Service Flow', [
                    { title: 'Call Reception', description: 'Answer and greet customer professionally' },
                    { title: 'Needs Assessment', description: 'Identify service requirements and location' },
                    { title: 'Information Gathering', description: 'Collect contact and project details' },
                    { title: 'Contractor Search', description: 'Find qualified contractors in area' },
                    { title: 'Referral Processing', description: 'Create and send referral to contractors' },
                    { title: 'Follow-up Scheduling', description: 'Set expectations and follow-up timeline' }
                ])}
                
                <h3>Best Practices</h3>
                <ul>
                    <li><strong>Active Listening:</strong> Pay attention to customer needs and concerns</li>
                    <li><strong>Professional Communication:</strong> Use clear, friendly language</li>
                    <li><strong>Efficient Processing:</strong> Minimize wait times while being thorough</li>
                    <li><strong>Quality Assurance:</strong> Verify all information before processing</li>
                </ul>
                
                ${this.createQuiz('customer-service', 'What is the second step in the customer service flow?', [
                    'Call Reception',
                    'Needs Assessment',
                    'Information Gathering',
                    'Contractor Search'
                ], 1)}
            </div>
        `;
    }

    getContractorManagementContent() {
        return `
            <div class="lesson-section">
                <h2>Contractor Management Flow</h2>
                <p>Learn the complete contractor lifecycle management and referral optimization processes.</p>
                
                ${this.createFlowDiagram('Contractor Lifecycle', [
                    { title: 'Registration', description: 'Contractor signs up and provides credentials' },
                    { title: 'Verification', description: 'Validate licenses, insurance, and references' },
                    { title: 'Profile Setup', description: 'Complete service areas and specializations' },
                    { title: 'Activation', description: 'Approve contractor for referrals' },
                    { title: 'Performance Monitoring', description: 'Track ratings and response times' },
                    { title: 'Relationship Management', description: 'Ongoing support and optimization' }
                ])}
                
                <h3>Key Management Areas</h3>
                <ul>
                    <li><strong>Quality Control:</strong> Monitor contractor performance and customer feedback</li>
                    <li><strong>Service Coverage:</strong> Ensure adequate contractor coverage in all areas</li>
                    <li><strong>Referral Optimization:</strong> Match customers with best-suited contractors</li>
                    <li><strong>Communication:</strong> Maintain regular contact and support</li>
                </ul>
                
                ${this.createQuiz('contractor-management', 'What comes after contractor registration?', [
                    'Profile Setup',
                    'Verification',
                    'Activation',
                    'Performance Monitoring'
                ], 1)}
            </div>
        `;
    }

    getCallCenterContent() {
        return `
            <div class="lesson-section">
                <h2>Call Center Operations Flow</h2>
                <p>Master call center operations with efficient call handling and processing workflows.</p>
                
                ${this.createFlowDiagram('Call Processing Workflow', [
                    { title: 'Queue Management', description: 'Monitor incoming calls and priorities' },
                    { title: 'Call Answer', description: 'Professional greeting and identification' },
                    { title: 'Customer Verification', description: 'Confirm identity and contact information' },
                    { title: 'Service Request', description: 'Document service needs and urgency' },
                    { title: 'Contractor Assignment', description: 'Select and notify appropriate contractors' },
                    { title: 'Call Completion', description: 'Confirm details and set expectations' }
                ])}
                
                <h3>Call Center Best Practices</h3>
                <ul>
                    <li><strong>Response Time:</strong> Answer calls within 3 rings</li>
                    <li><strong>Professional Greeting:</strong> Use standardized greeting protocol</li>
                    <li><strong>Efficient Processing:</strong> Complete calls within target time</li>
                    <li><strong>Quality Documentation:</strong> Accurate record keeping</li>
                </ul>
                
                ${this.createQuiz('call-center', 'What is the target call answer time?', [
                    '5 rings',
                    '3 rings',
                    '1 ring',
                    '10 rings'
                ], 1)}
            </div>
        `;
    }

    getTroubleshootingContent() {
        return `
            <div class="lesson-section">
                <h2>Troubleshooting Flow</h2>
                <p>Learn systematic troubleshooting approaches for resolving system and process issues.</p>
                
                ${this.createFlowDiagram('Troubleshooting Process', [
                    { title: 'Issue Identification', description: 'Clearly define the problem and symptoms' },
                    { title: 'Information Gathering', description: 'Collect relevant data and context' },
                    { title: 'Root Cause Analysis', description: 'Identify underlying cause of issue' },
                    { title: 'Solution Development', description: 'Create action plan to resolve issue' },
                    { title: 'Implementation', description: 'Execute solution with proper testing' },
                    { title: 'Verification', description: 'Confirm resolution and document process' }
                ])}
                
                <h3>Common Issues & Solutions</h3>
                <ul>
                    <li><strong>System Performance:</strong> Check server status and network connectivity</li>
                    <li><strong>Contractor Availability:</strong> Verify service areas and capacity</li>
                    <li><strong>Customer Complaints:</strong> Follow escalation procedures</li>
                    <li><strong>Data Inconsistencies:</strong> Validate and correct information</li>
                </ul>
                
                ${this.createQuiz('troubleshooting', 'What is the first step in troubleshooting?', [
                    'Solution Development',
                    'Issue Identification',
                    'Root Cause Analysis',
                    'Implementation'
                ], 1)}
            </div>
        `;
    }

    startDemo(demoType) {
        alert(`Starting ${demoType} demo - Flow architecture implementation`);
    }

    closeDemo() {
        document.querySelectorAll('.demo-modal').forEach(modal => modal.remove());
    }

    generateFinalAssessment() {
        // Check if all quizzes are completed correctly
        if (!this.areAllQuizzesCompleted()) {
            const incompleteQuizzes = this.getIncompleteQuizzes();
            const quizList = incompleteQuizzes.map(moduleId => {
                const module = this.modules.find(m => m.id === moduleId);
                const quizResult = this.quizResults[moduleId];
                const status = !quizResult ? 'Not attempted' : 
                             !quizResult.completed ? 'Not completed' : 
                             !quizResult.correct ? 'Incorrect answer' : 'Complete';
                return `• ${module.title}: ${status}`;
            }).join('\n');
            
            alert(`You must complete all quizzes correctly before taking the final assessment!\n\nQuizzes that need attention:\n${quizList}`);
            return;
        }

        // Show final assessment modal
        const assessmentModal = document.createElement('div');
        assessmentModal.className = 'modal active';
        assessmentModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">🎓 Final Assessment</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="assessment-intro">
                        <h4>Congratulations on completing all training modules!</h4>
                        <p>This final assessment will test your knowledge of all workflow processes covered in the training.</p>
                        
                        <div class="assessment-stats">
                            <div class="stat-item">
                                <strong>Modules Completed:</strong> ${this.modules.length}/${this.modules.length}
                            </div>
                            <div class="stat-item">
                                <strong>Overall Progress:</strong> ${Math.round(this.modules.reduce((sum, module) => sum + module.progress, 0) / this.modules.length)}%
                            </div>
                            <div class="stat-item">
                                <strong>Assessment Duration:</strong> ~15 minutes
                            </div>
                        </div>
                        
                        <div class="assessment-actions">
                            <button onclick="trainingCenter.startFinalAssessment()" class="btn btn-primary">
                                🚀 Start Assessment
                            </button>
                            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">
                                📚 Review Modules First
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(assessmentModal);
    }

    startFinalAssessment() {
        // Close any open modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        
        // Initialize final assessment
        this.currentAssessmentQuestion = 0;
        this.assessmentAnswers = [];
        this.assessmentQuestions = [
            {
                question: "What is the first step in the system workflow?",
                options: ["Login to system", "Check notifications", "Review dashboard", "Answer calls"],
                correct: 0,
                module: "Welcome & System Overview"
            },
            {
                question: "Which keyboard shortcut answers the next call?",
                options: ["Ctrl+A", "F1", "Space", "Enter"],
                correct: 1,
                module: "System Navigation Flow"
            },
            {
                question: "What is the second step in the customer service flow?",
                options: ["End call", "Gather information", "Transfer call", "Schedule follow-up"],
                correct: 1,
                module: "Customer Service Workflow"
            },
            {
                question: "What comes after contractor registration?",
                options: ["Payment processing", "Background verification", "Service assignment", "Training completion"],
                correct: 1,
                module: "Contractor Management Flow"
            },
            {
                question: "What is the target call answer time?",
                options: ["30 seconds", "1 minute", "3 rings", "2 minutes"],
                correct: 2,
                module: "Call Center Operations Flow"
            },
            {
                question: "What is the first step in troubleshooting?",
                options: ["Solution Development", "Issue Identification", "Root Cause Analysis", "Implementation"],
                correct: 1,
                module: "Troubleshooting Flow"
            },
            {
                question: "How should customer complaints be handled?",
                options: ["Ignore them", "Follow escalation procedures", "Transfer immediately", "End the call"],
                correct: 1,
                module: "Customer Service Workflow"
            },
            {
                question: "What information is required for contractor onboarding?",
                options: ["Name only", "Contact info only", "Full background check and documentation", "Just a phone number"],
                correct: 2,
                module: "Contractor Management Flow"
            },
            {
                question: "What should you do if a system error occurs?",
                options: ["Restart computer", "Follow troubleshooting procedures", "Call IT immediately", "Ignore the error"],
                correct: 1,
                module: "Troubleshooting Flow"
            },
            {
                question: "What is the most important aspect of customer service?",
                options: ["Speed", "Professional communication and problem resolution", "Ending calls quickly", "Following scripts exactly"],
                correct: 1,
                module: "Customer Service Workflow"
            }
        ];
        
        this.showAssessmentQuestion();
    }

    showAssessmentQuestion() {
        const question = this.assessmentQuestions[this.currentAssessmentQuestion];
        const totalQuestions = this.assessmentQuestions.length;
        const progressPercent = (this.currentAssessmentQuestion / totalQuestions) * 100;
        
        const assessmentModal = document.createElement('div');
        assessmentModal.className = 'modal active';
        assessmentModal.id = 'assessmentModal';
        assessmentModal.innerHTML = `
            <div class="modal-content assessment-modal">
                <div class="modal-header">
                    <h3 class="modal-title">🎓 Final Assessment</h3>
                    <div class="assessment-progress">
                        Question ${this.currentAssessmentQuestion + 1} of ${totalQuestions}
                    </div>
                </div>
                <div class="modal-body">
                    <div class="assessment-progress-bar">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    
                    <div class="assessment-question-container">
                        <div class="question-module">📚 ${question.module}</div>
                        <div class="assessment-question-text">${question.question}</div>
                        
                        <div class="assessment-options">
                            ${question.options.map((option, index) => `
                                <label class="assessment-option">
                                    <input type="radio" name="assessment-q${this.currentAssessmentQuestion}" value="${index}">
                                    <span class="option-text">${option}</span>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div class="assessment-navigation">
                            ${this.currentAssessmentQuestion > 0 ? 
                                `<button onclick="trainingCenter.previousAssessmentQuestion()" class="btn btn-secondary">← Previous</button>` : 
                                '<div></div>'
                            }
                            
                            <button onclick="trainingCenter.nextAssessmentQuestion()" class="btn btn-primary" id="assessmentNextBtn" disabled>
                                ${this.currentAssessmentQuestion === totalQuestions - 1 ? 'Submit Assessment' : 'Next Question →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(assessmentModal);
        
        // Add event listeners to enable next button when option is selected
        document.querySelectorAll(`input[name="assessment-q${this.currentAssessmentQuestion}"]`).forEach(input => {
            input.addEventListener('change', () => {
                document.getElementById('assessmentNextBtn').disabled = false;
            });
        });
    }

    nextAssessmentQuestion() {
        const selectedOption = document.querySelector(`input[name="assessment-q${this.currentAssessmentQuestion}"]:checked`);
        
        if (!selectedOption) {
            alert('Please select an answer before proceeding.');
            return;
        }
        
        // Store the answer
        this.assessmentAnswers[this.currentAssessmentQuestion] = parseInt(selectedOption.value);
        
        // Remove current modal
        document.getElementById('assessmentModal').remove();
        
        if (this.currentAssessmentQuestion < this.assessmentQuestions.length - 1) {
            // Show next question
            this.currentAssessmentQuestion++;
            this.showAssessmentQuestion();
        } else {
            // Assessment complete - show results
            this.showAssessmentResults();
        }
    }

    previousAssessmentQuestion() {
        if (this.currentAssessmentQuestion > 0) {
            document.getElementById('assessmentModal').remove();
            this.currentAssessmentQuestion--;
            this.showAssessmentQuestion();
            
            // Restore previous answer if it exists
            if (this.assessmentAnswers[this.currentAssessmentQuestion] !== undefined) {
                setTimeout(() => {
                    const previousAnswer = this.assessmentAnswers[this.currentAssessmentQuestion];
                    const input = document.querySelector(`input[name="assessment-q${this.currentAssessmentQuestion}"][value="${previousAnswer}"]`);
                    if (input) {
                        input.checked = true;
                        document.getElementById('assessmentNextBtn').disabled = false;
                    }
                }, 100);
            }
        }
    }

    showAssessmentResults() {
        // Calculate score
        let correctAnswers = 0;
        this.assessmentQuestions.forEach((question, index) => {
            if (this.assessmentAnswers[index] === question.correct) {
                correctAnswers++;
            }
        });
        
        const totalQuestions = this.assessmentQuestions.length;
        const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = scorePercent >= 70; // 70% passing grade
        
        const resultModal = document.createElement('div');
        resultModal.className = 'modal active';
        resultModal.innerHTML = `
            <div class="modal-content assessment-results">
                <div class="modal-header">
                    <h3 class="modal-title">🎓 Assessment Results</h3>
                </div>
                <div class="modal-body">
                    <div class="results-summary ${passed ? 'passed' : 'failed'}">
                        <div class="score-circle">
                            <div class="score-number">${scorePercent}%</div>
                            <div class="score-label">${passed ? 'PASSED' : 'FAILED'}</div>
                        </div>
                        
                        <div class="results-details">
                            <h4>${passed ? '🎉 Congratulations!' : '📚 Keep Learning'}</h4>
                            <p>${passed ? 
                                'You have successfully completed the Urban Referral Network Training Program!' : 
                                'You need at least 70% to pass. Review the training materials and try again.'
                            }</p>
                            
                            <div class="score-breakdown">
                                <div class="stat-item">
                                    <strong>Correct Answers:</strong> ${correctAnswers} / ${totalQuestions}
                                </div>
                                <div class="stat-item">
                                    <strong>Score:</strong> ${scorePercent}%
                                </div>
                                <div class="stat-item">
                                    <strong>Passing Grade:</strong> 70%
                                </div>
                                <div class="stat-item">
                                    <strong>Status:</strong> ${passed ? 'CERTIFIED' : 'NEEDS IMPROVEMENT'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-actions">
                        ${passed ? `
                            <button onclick="trainingCenter.showCertificateModal()" class="btn btn-success">
                                🏆 Get Certificate
                            </button>
                            <button onclick="trainingCenter.showDetailedResults()" class="btn btn-secondary">
                                📊 View Detailed Results
                            </button>
                        ` : `
                            <button onclick="trainingCenter.retakeAssessment()" class="btn btn-primary">
                                🔄 Retake Assessment
                            </button>
                            <button onclick="trainingCenter.showDetailedResults()" class="btn btn-secondary">
                                📊 Review Answers
                            </button>
                        `}
                        <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(resultModal);
        
        // Store assessment results
        this.lastAssessmentScore = scorePercent;
        this.lastAssessmentPassed = passed;
    }

    showDetailedResults() {
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal active';
        detailsModal.innerHTML = `
            <div class="modal-content detailed-results">
                <div class="modal-header">
                    <h3 class="modal-title">📊 Detailed Results</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="question-results">
                        ${this.assessmentQuestions.map((question, index) => {
                            const userAnswer = this.assessmentAnswers[index];
                            const isCorrect = userAnswer === question.correct;
                            return `
                                <div class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
                                    <div class="question-header">
                                        <span class="question-number">Q${index + 1}</span>
                                        <span class="question-status">${isCorrect ? '✅' : '❌'}</span>
                                        <span class="question-module">${question.module}</span>
                                    </div>
                                    <div class="question-text">${question.question}</div>
                                    <div class="answer-comparison">
                                        <div class="user-answer">
                                            <strong>Your Answer:</strong> ${question.options[userAnswer]}
                                        </div>
                                        ${!isCorrect ? `
                                            <div class="correct-answer">
                                                <strong>Correct Answer:</strong> ${question.options[question.correct]}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailsModal);
    }

    retakeAssessment() {
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        
        // Reset assessment state
        this.currentAssessmentQuestion = 0;
        this.assessmentAnswers = [];
        
        // Start assessment again
        this.startFinalAssessment();
    }

    showCertificateModal() {
        const currentDate = new Date().toLocaleDateString();
        const certificateId = 'URN-' + Date.now().toString().slice(-6);
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content certificate-modal">
                <button class="close-certificate" onclick="this.closest('.modal').remove()">&times;</button>
                <div class="certificate-border">
                    <div class="certificate-header">
                        <div class="certificate-icon">🏆</div>
                        <h1>Certificate of Completion</h1>
                    </div>
                    
                    <div class="certificate-body">
                        <p class="certifies">This certifies that</p>
                        <h2 class="recipient-name">Training Participant</h2>
                        <p class="completion-text">has successfully completed the</p>
                        <h3 class="program-name">Urban Referral Network Training Program</h3>
                        
                        <div class="certificate-details">
                            <div class="detail-item">
                                <strong>Modules Completed:</strong> ${this.modules.length}/${this.modules.length}
                            </div>
                            <div class="detail-item">
                                <strong>Final Assessment Score:</strong> ${this.lastAssessmentScore || 0}%
                            </div>
                            <div class="detail-item">
                                <strong>Completion Date:</strong> ${currentDate}
                            </div>
                            <div class="detail-item">
                                <strong>Certificate ID:</strong> ${certificateId}
                            </div>
                        </div>
                    </div>
                    
                    <div class="certificate-footer">
                        <div class="signature-line">
                            <div class="signature">Urban Referral Network</div>
                            <div class="title">Training Department</div>
                        </div>
                    </div>
                    
                    <div class="certificate-actions">
                        <button onclick="window.print()" class="cert-btn download">🖨️ Print Certificate</button>
                        <button onclick="trainingCenter.downloadCertificate()" class="cert-btn print">💾 Download PDF</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    downloadCertificate() {
        // Placeholder for PDF download functionality
        alert('Certificate download feature would be implemented here.\n\nYour certificate ID: URN-' + Date.now().toString().slice(-6));
    }
}

// Global functions
let trainingCenter;

function nextModule() {
    trainingCenter.nextModule();
}

function previousModule() {
    trainingCenter.previousModule();
}

function startDemo(demoType) {
    trainingCenter.startDemo(demoType);
}

function closeDemo() {
    trainingCenter.closeDemo();
}

function checkAnswer(moduleId, correctAnswer) {
    trainingCenter.checkQuizAnswer(moduleId, correctAnswer);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    trainingCenter = new TrainingCenter();
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .flow-architecture {
            background: #f8fafc;
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        }
        
        .flow-title {
            color: #1e40af;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .flow-diagram {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
        
        .flow-step {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .step-number {
            background: #3b82f6;
            color: white;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .step-content h6 {
            margin: 0 0 0.5rem 0;
            color: #111827;
            font-weight: 600;
        }
        
        .step-content p {
            margin: 0;
            color: #6b7280;
            font-size: 0.875rem;
        }
        
        .architecture-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .arch-component {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            text-align: center;
        }
        
        .arch-component h5 {
            margin: 0 0 1rem 0;
            color: #1e40af;
        }
        
        /* Quiz styles moved to training-center.css for better maintainability */
        
        .certificate-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .certificate-content {
            background: white;
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            max-width: 600px;
        }
        
        .certificate-header {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        .certificate-stats {
            background: #f0fdf4;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 2rem 0;
            display: flex;
            justify-content: space-around;
        }
    `;
    document.head.appendChild(style);
});