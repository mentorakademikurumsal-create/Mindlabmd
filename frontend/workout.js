const canvas = document.getElementById('workout-canvas');
const submitBtn = document.getElementById('universal-submit-btn');
const resultsPopup = document.getElementById('results-popup');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackDesc = document.getElementById('feedback-desc');
const nextBtn = document.getElementById('next-task-btn');

let currentQuestion = null;
let answered = false;

// Goal tracking variables
let sessionGoal = 0;
let sessionCompleted = 0;

// Initialize Goal Modal if not set
document.addEventListener('DOMContentLoaded', () => {
    const goalModal = document.getElementById('goal-modal');
    const startBtn = document.getElementById('start-workout-btn');
    const goalInput = document.getElementById('goal-input');

    startBtn.addEventListener('click', () => {
        const val = parseInt(goalInput.value);
        if (val > 0) {
            sessionGoal = val;
            sessionCompleted = 0;
            goalModal.style.display = 'none';
            updateProgressBar();
            loadRandomTask();
        }
    });
});

function updateProgressBar() {
    const fill = document.getElementById('progress-bar-fill');
    const text = document.getElementById('progress-text');
    if (fill && text && sessionGoal > 0) {
        const percentage = Math.min(100, (sessionCompleted / sessionGoal) * 100);
        fill.style.width = percentage + '%';
        text.innerText = `Hedef: ${sessionCompleted} / ${sessionGoal} Soru`;
        
        if (sessionCompleted >= sessionGoal) {
            text.innerText = `Hedefine Ulaştın! 🏆 (${sessionCompleted}/${sessionGoal})`;
            fill.style.background = '#f1c40f'; // Gold color when reached
        }
    }
}

// Global Swipe Variables
let cardStartTime = 0;
let totalWaitTime = 0;
let correctSwipeAnswers = 0;
let swipeCurrentIndex = 0;


async function loadRandomTask() {
    answered = false;
    submitBtn.style.display = 'none';
    resultsPopup.classList.remove('show');
    canvas.innerHTML = '';
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await response.json();
        
        const solvedIds = JSON.parse(localStorage.getItem('solvedQuestions') || '[]');
        let filteredDB = tasks.filter(q => !solvedIds.includes(q.id));
        
        if (filteredDB.length === 0) {
            // Trigger AI Generation
            canvas.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #2980b9;">
                    <i class="fas fa-robot fa-spin" style="font-size: 40px; margin-bottom: 15px;"></i>
                    <h3>Yapay Zeka Yeni Bir Görev Üretiyor...</h3>
                </div>
            `;
            
            const aiRes = await fetch('/api/tasks/generate?module_type=Kategori Sepeti', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const newTask = await aiRes.json();
            
            if (newTask && newTask.id) {
                currentQuestion = newTask;
            } else {
                throw new Error("Invalid AI Task");
            }
        } else {
            currentQuestion = filteredDB[Math.floor(Math.random() * filteredDB.length)];
        }
        
        renderCurrentTask();
    } catch (err) {
        console.error(err);
        canvas.innerHTML = '<div style="padding: 20px;">Bağlantı hatası veya soru bulunamadı.</div>';
    }
}

function renderCurrentTask() {
    canvas.innerHTML = '';
    renderTags();
    
    if (currentQuestion.module_type.includes("Tinder")) {
        renderSwipeTask();
    } else if (currentQuestion.module_type.includes("Hata")) {
        renderBugBountyTask();
    } else if (currentQuestion.module_type.includes("Fosforlu")) {
        renderHighlightTask();
    } else if (currentQuestion.module_type.includes("Zinciri")) {
        renderLogicChainTask();
    } else if (currentQuestion.module_type.includes("Perspektif")) {
        renderPerspectiveTask();
    } else if (currentQuestion.module_type.includes("Kategori")) {
        renderCategoryTask();
    } else {
        canvas.innerHTML = `<div style="padding: 20px;">Bilinmeyen modül tipi: ${currentQuestion.module_type}</div>`;
    }
}

function renderTags() {
    const tagsHtml = `
        <div class="meta-tags">
            <span class="tag"><i class="fas fa-layer-group"></i> ${currentQuestion.grade_level}. Sınıf</span>
            <span class="tag"><i class="fas fa-bullseye"></i> ${currentQuestion.maarif_skill}</span>
            <span class="tag"><i class="fas fa-brain"></i> ${currentQuestion.cognitive_target}</span>
        </div>
    `;
    canvas.innerHTML += tagsHtml;
}

function showFeedback(isSuccess, titleText, descText) {
    answered = true;
    
    // Soruyu çözüldü olarak işaretle ve kaydet
    const solvedIds = JSON.parse(localStorage.getItem('solvedQuestions') || '[]');
    if (!solvedIds.includes(currentQuestion.id)) {
        solvedIds.push(currentQuestion.id);
        localStorage.setItem('solvedQuestions', JSON.stringify(solvedIds));
    }

    if (isSuccess) {
        sessionCompleted++;
        updateProgressBar();
    }
    
    feedbackTitle.innerText = titleText;
    feedbackTitle.style.color = isSuccess ? "#2ecc71" : "#e74c3c";
    feedbackDesc.innerHTML = descText;
    resultsPopup.classList.add('show');
}

nextBtn.addEventListener('click', loadRandomTask);

// ==========================================
// MODULE 1: HATA DEDEKTİFİ
// ==========================================
function renderBugBountyTask() {
    const contextHtml = `
        <div class="math-context">
            <strong>Bağlam:</strong> ${currentQuestion.context_text}
            <br><br><span style="color:#e74c3c; font-weight:bold;">Hangi adımda mantık hatası yapılmıştır? Dokun.</span>
        </div>
    `;
    canvas.innerHTML += contextHtml;

    const solutionArea = document.createElement('div');
    solutionArea.className = 'solution-area';
    
    currentQuestion.steps.forEach(stepObj => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.dataset.isError = stepObj.is_error;
        stepDiv.innerHTML = `<span><strong>Adım ${stepObj.step}:</strong> ${stepObj.text}</span><i class="fas fa-bug bug-icon"></i>`;
        
        stepDiv.addEventListener('click', function() {
            if (answered) return;
            document.querySelectorAll('.step').forEach(s => s.classList.remove('selected'));
            
            const isCorrect = this.dataset.isError === 'true';
            if (isCorrect) {
                this.classList.add('correct');
                showFeedback(true, "Harika! Hatayı Buldun.", currentQuestion.feedback);
            } else {
                this.classList.add('selected');
                document.querySelectorAll('.step').forEach(s => {
                    if (s.dataset.isError === 'true') s.style.border = "2px solid #2ecc71";
                });
                showFeedback(false, "Yanlış Adım", `Seçtiğin adım doğruydu. Asıl hata şuydu:<br><br>${currentQuestion.feedback}`);
            }
        });
        solutionArea.appendChild(stepDiv);
    });
    canvas.appendChild(solutionArea);
}

// ==========================================
// MODULE 2: FOSFORLU KALEM
// ==========================================
function renderHighlightTask() {
    const instructionHtml = `
        <div style="padding: 15px 20px; background: #fdfefe; border-bottom: 1px solid #eee; font-weight: bold; color: #2c3e50;">
            ${currentQuestion.question}
        </div>
    `;
    canvas.innerHTML += instructionHtml;

    const readingArea = document.createElement('div');
    readingArea.className = 'reading-area';
    
    const sentencesArray = currentQuestion.context_text.split('|');
    let selectedSpan = null;

    sentencesArray.forEach((text, index) => {
        const span = document.createElement('span');
        span.className = 'sentence';
        span.innerText = text.trim() + " ";
        span.dataset.isCorrect = (index === currentQuestion.correct_sentence_index);
        
        span.addEventListener('click', function() {
            if (answered) return;
            document.querySelectorAll('.sentence').forEach(el => el.classList.remove('highlighted'));
            this.classList.add('highlighted');
            selectedSpan = this;
            
            submitBtn.style.display = 'block';
            submitBtn.onclick = () => {
                submitBtn.style.display = 'none';
                const isCorrect = selectedSpan.dataset.isCorrect === 'true';
                if (isCorrect) {
                    selectedSpan.classList.add('correct');
                    showFeedback(true, "Filtreleme Başarılı!", "Metin içindeki ana fikri diğer yan düşüncelerden başarıyla ayırdın.");
                } else {
                    selectedSpan.classList.add('wrong');
                    document.querySelectorAll('.sentence').forEach(s => {
                        if (s.dataset.isCorrect === 'true') s.style.borderBottom = "2px solid #2ecc71";
                    });
                    showFeedback(false, "Yanlış Cümle", "Seçtiğin cümle metinde geçiyor olabilir ancak sorunun asıl odak noktası yeşil ile çizili olan cümleydi.");
                }
            };
        });
        readingArea.appendChild(span);
    });
    canvas.appendChild(readingArea);
}

// ==========================================
// MODULE 3: TİNDER (BUTONLU KANIT/VARSAYIM)
// ==========================================
function renderSwipeTask() {
    const contextHtml = `
        <div class="math-context">
            ${currentQuestion.context_text}
            <br><br><span style="color:#2980b9; font-weight:bold;">Aşağıdaki cümlenin kanıt mı yoksa varsayım mı olduğunu seç.</span>
        </div>
        <div class="swipe-area" id="swipe-area" style="padding: 20px; text-align: center; background:#f9f9f9; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div id="card-container" style="width: 100%; max-width: 350px; min-height: 120px; margin-bottom: 25px; display: flex; align-items: center; justify-content: center;"></div>
            
            <div style="display: flex; gap: 15px; justify-content: center; width: 100%; max-width: 350px;">
                <button id="btn-varsayim" style="flex:1; padding: 15px; border-radius: 12px; border: 2px solid #34495e; background: white; color: #34495e; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s;">Varsayım</button>
                <button id="btn-kanit" style="flex:1; padding: 15px; border-radius: 12px; border: 2px solid #34495e; background: white; color: #34495e; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s;">Kanıt</button>
            </div>
        </div>
    `;
    canvas.innerHTML += contextHtml;

    swipeCurrentIndex = 0;
    correctSwipeAnswers = 0;
    renderSwipeCard();
}

function renderSwipeCard() {
    if (swipeCurrentIndex >= currentQuestion.statements.length) {
        const acc = Math.round((correctSwipeAnswers / currentQuestion.statements.length) * 100);
        const msg = acc >= 75 ? "Metni çok iyi analiz ettin ve varsayımlara düşmedin." : "Dış bilgileri kanıt sanıyorsun. Sadece metne odaklanmalısın.";
        showFeedback(acc >= 75, "Görev Tamamlandı!", `Doğruluk: %${acc}<br><br>${msg}`);
        return;
    }

    const statement = currentQuestion.statements[swipeCurrentIndex];
    const container = document.getElementById('card-container');
    
    // Create static card
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    card.style.position = 'relative'; 
    card.style.width = '100%';
    card.style.transform = 'none';
    card.style.cursor = 'default';
    card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    card.style.border = '2px solid transparent';
    card.innerText = statement.text;
    container.appendChild(card);

    const btnVarsayim = document.getElementById('btn-varsayim');
    const btnKanit = document.getElementById('btn-kanit');
    
    // Reset buttons to neutral state
    btnVarsayim.style.pointerEvents = 'auto';
    btnKanit.style.pointerEvents = 'auto';
    btnVarsayim.style.backgroundColor = 'white';
    btnKanit.style.backgroundColor = 'white';
    btnVarsayim.style.color = '#34495e';
    btnKanit.style.color = '#34495e';
    btnVarsayim.style.borderColor = '#34495e';
    btnKanit.style.borderColor = '#34495e';
    
    // Clean old event listeners by cloning
    const newBtnVarsayim = btnVarsayim.cloneNode(true);
    const newBtnKanit = btnKanit.cloneNode(true);
    btnVarsayim.parentNode.replaceChild(newBtnVarsayim, btnVarsayim);
    btnKanit.parentNode.replaceChild(newBtnKanit, btnKanit);

    const handleAnswer = (isKanit, clickedBtn) => {
        const isCorrect = (isKanit === statement.is_evidence);
        
        if (isCorrect) {
            correctSwipeAnswers++;
            clickedBtn.style.backgroundColor = '#2ecc71';
            clickedBtn.style.color = 'white';
            clickedBtn.style.borderColor = '#2ecc71';
            card.style.borderColor = '#2ecc71';
        } else {
            clickedBtn.style.backgroundColor = '#e74c3c';
            clickedBtn.style.color = 'white';
            clickedBtn.style.borderColor = '#e74c3c';
            card.style.borderColor = '#e74c3c';
        }
        
        newBtnVarsayim.style.pointerEvents = 'none';
        newBtnKanit.style.pointerEvents = 'none';

        setTimeout(() => { 
            swipeCurrentIndex++; 
            renderSwipeCard(); 
        }, 600);
    };

    newBtnVarsayim.addEventListener('click', () => handleAnswer(false, newBtnVarsayim));
    newBtnKanit.addEventListener('click', () => handleAnswer(true, newBtnKanit));
}

// ==========================================
// MODULE 4: MANTIK ZİNCİRİ (SIRALAMA)
// ==========================================
function renderLogicChainTask() {
    const contextHtml = `
        <div class="math-context">
            ${currentQuestion.context_text}
        </div>
        <div id="chain-area" style="padding: 20px;"></div>
    `;
    canvas.innerHTML += contextHtml;

    const chainArea = document.getElementById('chain-area');
    
    // Karıştır (Shuffle)
    let shuffledSteps = [...currentQuestion.steps].sort(() => Math.random() - 0.5);
    let selectedOrder = [];

    shuffledSteps.forEach(stepObj => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step'; // Reuse style from bug bounty
        stepDiv.style.justifyContent = 'flex-start';
        stepDiv.style.gap = '15px';
        stepDiv.dataset.order = stepObj.order;
        
        const badge = document.createElement('div');
        badge.style.width = '25px'; badge.style.height = '25px'; badge.style.borderRadius = '50%';
        badge.style.background = '#eee'; badge.style.display = 'flex'; badge.style.alignItems = 'center'; 
        badge.style.justifyContent = 'center'; badge.style.fontWeight = 'bold'; badge.style.color = '#7f8c8d';
        badge.innerText = '-';
        
        const textSpan = document.createElement('span');
        textSpan.innerText = stepObj.text;

        stepDiv.appendChild(badge);
        stepDiv.appendChild(textSpan);

        stepDiv.addEventListener('click', function() {
            if (answered) return;
            
            // Eğer zaten seçilmişse (geri al)
            if (selectedOrder.includes(this)) {
                selectedOrder = selectedOrder.filter(item => item !== this);
                this.style.borderColor = '#eee';
                this.style.backgroundColor = '#fff';
                badge.innerText = '-';
                badge.style.background = '#eee';
                badge.style.color = '#7f8c8d';
                
                // Diğerlerinin sırasını güncelle
                selectedOrder.forEach((item, index) => {
                    item.firstChild.innerText = index + 1;
                });
                return;
            }

            // Seçilmemişse listeye ekle
            selectedOrder.push(this);
            this.style.borderColor = '#3498db';
            this.style.backgroundColor = '#ebf5fb';
            badge.innerText = selectedOrder.length;
            badge.style.background = '#3498db';
            badge.style.color = 'white';

            // Hepsi seçildiyse kontrol et
            if (selectedOrder.length === currentQuestion.steps.length) {
                let isCorrect = true;
                selectedOrder.forEach((item, index) => {
                    if (parseInt(item.dataset.order) !== (index + 1)) {
                        isCorrect = false;
                        item.style.borderColor = '#e74c3c';
                        item.firstChild.style.background = '#e74c3c';
                    } else {
                        item.style.borderColor = '#2ecc71';
                        item.firstChild.style.background = '#2ecc71';
                    }
                });

                if (isCorrect) {
                    showFeedback(true, "Mükemmel Sıralama!", `Neden-Sonuç bağını harika kurdun.<br><br>${currentQuestion.feedback}`);
                } else {
                    showFeedback(false, "Sıralama Hatası", `Tarihsel olayların (neden-sonuç) zincirini yanlış kurdun. Lütfen yeniden düşün.<br><br>${currentQuestion.feedback}`);
                }
            }
        });
        
        chainArea.appendChild(stepDiv);
    });
}

// Başlat (Artık modal'daki butondan tetikleniyor)
// loadRandomTask();


// ==========================================
// MODULE 5: PERSPEKTİF SÜRÜKLE (ZİHİNSEL ESNEKLİK)
// ==========================================
function renderPerspectiveTask() {
    const contextHtml = `
        <div class="math-context">
            <strong>Bağlam:</strong> ${currentQuestion.context_text}
            <br><br><span style="color:#8e44ad; font-weight:bold;">Aşağıdaki düşünce balonlarını, bu düşünceyi savunacak doğru kişilerin kutusuna sürükle.</span>
        </div>
        <div id="perspective-area" style="padding: 20px; background:#f9f9f9; min-height: 250px;">
            <!-- Drop Zones for Characters -->
            <div id="characters-container" style="display: flex; gap: 10px; margin-bottom: 25px; justify-content: center; flex-wrap: wrap;"></div>
            
            <!-- Draggable Statements -->
            <div id="statements-container" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
    `;
    canvas.innerHTML += contextHtml;

    const charsContainer = document.getElementById('characters-container');
    const statementsContainer = document.getElementById('statements-container');

    // Create Drop Zones (Characters)
    currentQuestion.characters.forEach(char => {
        const dropZone = document.createElement('div');
        dropZone.className = 'char-dropzone';
        dropZone.dataset.charId = char.id;
        dropZone.style.flex = '1';
        dropZone.style.minWidth = '90px';
        dropZone.style.minHeight = '120px';
        dropZone.style.border = '2px dashed #bdc3c7';
        dropZone.style.borderRadius = '12px';
        dropZone.style.padding = '10px';
        dropZone.style.background = '#fff';
        dropZone.style.display = 'flex';
        dropZone.style.flexDirection = 'column';
        dropZone.style.alignItems = 'center';
        
        dropZone.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 5px; color: #34495e;"><i class="fas ${char.icon}"></i></div>
            <div style="font-size: 11px; font-weight: bold; text-align: center; color: #2c3e50;">${char.name}</div>
            <div class="drop-content" style="flex:1; width: 100%; display: flex; flex-direction: column; gap: 5px; margin-top: 10px; min-height: 40px;"></div>
        `;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#3498db';
            dropZone.style.background = '#ebf5fb';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#bdc3c7';
            dropZone.style.background = '#fff';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#bdc3c7';
            dropZone.style.background = '#fff';
            
            const stmtId = e.dataTransfer.getData('text/plain');
            const draggedEl = document.getElementById(stmtId);
            if (draggedEl) {
                dropZone.querySelector('.drop-content').appendChild(draggedEl);
                checkPerspectiveCompletion();
            }
        });

        charsContainer.appendChild(dropZone);
    });

    // Create Draggable Statements
    let shuffledStatements = [...currentQuestion.statements].sort(() => Math.random() - 0.5);
    
    shuffledStatements.forEach(stmt => {
        const dragItem = document.createElement('div');
        dragItem.id = stmt.id;
        dragItem.dataset.owner = stmt.owner;
        dragItem.draggable = true;
        dragItem.style.background = '#fff';
        dragItem.style.border = '1px solid #dcdde1';
        dragItem.style.padding = '10px';
        dragItem.style.borderRadius = '8px';
        dragItem.style.fontSize = '12px';
        dragItem.style.cursor = 'grab';
        dragItem.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
        dragItem.innerHTML = `<i class="fas fa-comment-dots" style="color: #95a5a6; margin-right: 5px;"></i> ${stmt.text}`;
        
        dragItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', stmt.id);
            dragItem.style.opacity = '0.5';
        });
        
        dragItem.addEventListener('dragend', () => {
            dragItem.style.opacity = '1';
        });

        statementsContainer.appendChild(dragItem);
    });

    // Also allow dropping back to the statements container
    statementsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    statementsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const stmtId = e.dataTransfer.getData('text/plain');
        const draggedEl = document.getElementById(stmtId);
        if (draggedEl) {
            statementsContainer.appendChild(draggedEl);
            checkPerspectiveCompletion();
        }
    });

    function checkPerspectiveCompletion() {
        const remaining = statementsContainer.children.length;
        if (remaining === 0) {
            submitBtn.style.display = 'block';
        } else {
            submitBtn.style.display = 'none';
        }
    }
    
    submitBtn.onclick = () => {
        let isCorrect = true;
        const dropZones = document.querySelectorAll('.char-dropzone');
        dropZones.forEach(zone => {
            const expectedCharId = zone.dataset.charId;
            const items = zone.querySelectorAll('.drop-content div');
            items.forEach(item => {
                if (item.dataset.owner !== expectedCharId) {
                    isCorrect = false;
                    item.style.background = '#ffcccc';
                    item.style.borderColor = '#e74c3c';
                } else {
                    item.style.background = '#ccffcc';
                    item.style.borderColor = '#2ecc71';
                }
            });
        });

        if (isCorrect) {
            showFeedback(true, "Mükemmel Empati!", currentQuestion.feedback);
        } else {
            showFeedback(false, "Yanlış Eşleştirme", "Biri böyle bir olaya bu şekilde tepki vermeyebilir. Roller ve çıkarları tekrar düşün!");
            submitBtn.style.display = 'none';
        }
    };
}


document.getElementById('ai-force-btn')?.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    answered = false;
    submitBtn.style.display = 'none';
    resultsPopup.classList.remove('show');
    canvas.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #2980b9;">
            <i class="fas fa-robot fa-spin" style="font-size: 40px; margin-bottom: 15px;"></i>
            <h3>Yapay Zeka Yeni Bir Görev Üretiyor...</h3>
        </div>
    `;
    
    try {
        const aiRes = await fetch('/api/tasks/generate?module_type=Kategori Sepeti', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const newTask = await aiRes.json();
        if (newTask && newTask.id) {
            currentQuestion = newTask;
            renderCurrentTask();
        }
    } catch (error) {
        alert("AI Sunucusuna ulaşılamadı!");
        loadRandomTask();
    }
});



function renderCategoryTask() {
    const contextHtml = `
        <div class="math-context">
            <strong>Görev:</strong> ${currentQuestion.context_text}
            <br><br><span style="color:#2980b9; font-weight:bold;">Aşağıdaki öğeleri doğru kategorilere sürükleyip bırakın.</span>
        </div>
        <div id="category-area" style="padding: 10px; background:#f4f6f7; border-radius: 10px;">
            <!-- Categories (Drop Zones) -->
            <div id="baskets-container" style="display: flex; gap: 15px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap;"></div>
            
            <!-- Draggable Items -->
            <div id="items-container" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; min-height: 50px; padding: 15px; background: white; border: 2px dashed #bdc3c7; border-radius: 8px;"></div>
        </div>
    `;
    canvas.innerHTML += contextHtml;

    const basketsContainer = document.getElementById('baskets-container');
    const itemsContainer = document.getElementById('items-container');

    // Create Category Baskets
    currentQuestion.categories.forEach(cat => {
        const dropZone = document.createElement('div');
        dropZone.className = 'category-basket';
        dropZone.dataset.catId = cat.id;
        dropZone.style.flex = '1';
        dropZone.style.minWidth = '120px';
        dropZone.style.minHeight = '150px';
        dropZone.style.border = `3px solid ${cat.color || '#95a5a6'}`;
        dropZone.style.borderRadius = '12px';
        dropZone.style.padding = '10px';
        dropZone.style.background = '#fff';
        dropZone.style.display = 'flex';
        dropZone.style.flexDirection = 'column';
        dropZone.style.alignItems = 'center';
        
        dropZone.innerHTML = `
            <div style="font-size: 14px; font-weight: bold; text-align: center; color: ${cat.color || '#2c3e50'}; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid ${cat.color || '#95a5a6'}; width: 100%;">${cat.title}</div>
            <div class="basket-content" style="flex:1; width: 100%; display: flex; flex-direction: column; gap: 8px; min-height: 40px;"></div>
        `;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.background = '#f0f3f4';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.background = '#fff';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.background = '#fff';
            const itemId = e.dataTransfer.getData('text/plain');
            const draggedEl = document.getElementById(itemId);
            if (draggedEl) {
                dropZone.querySelector('.basket-content').appendChild(draggedEl);
                checkCategoryCompletion();
            }
        });

        basketsContainer.appendChild(dropZone);
    });

    // Create Draggable Items
    let shuffledItems = [...currentQuestion.items].sort(() => Math.random() - 0.5);
    
    shuffledItems.forEach(item => {
        const dragItem = document.createElement('div');
        dragItem.id = item.id;
        dragItem.dataset.target = item.target;
        dragItem.draggable = true;
        dragItem.style.background = '#ecf0f1';
        dragItem.style.border = '1px solid #bdc3c7';
        dragItem.style.padding = '8px 15px';
        dragItem.style.borderRadius = '20px';
        dragItem.style.fontSize = '14px';
        dragItem.style.fontWeight = '500';
        dragItem.style.cursor = 'grab';
        dragItem.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        dragItem.style.textAlign = 'center';
        dragItem.innerText = item.text;
        
        dragItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.id);
            dragItem.style.opacity = '0.5';
        });
        
        dragItem.addEventListener('dragend', () => {
            dragItem.style.opacity = '1';
        });

        itemsContainer.appendChild(dragItem);
    });

    // Allow dropping back to original container
    itemsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    itemsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const draggedEl = document.getElementById(itemId);
        if (draggedEl) {
            itemsContainer.appendChild(draggedEl);
            checkCategoryCompletion();
        }
    });

    function checkCategoryCompletion() {
        if (itemsContainer.children.length === 0) {
            submitBtn.style.display = 'block';
        } else {
            submitBtn.style.display = 'none';
        }
    }
    
    submitBtn.onclick = () => {
        let isCorrect = true;
        const baskets = document.querySelectorAll('.category-basket');
        baskets.forEach(basket => {
            const expectedCatId = basket.dataset.catId;
            const items = basket.querySelectorAll('.basket-content div');
            items.forEach(item => {
                if (item.dataset.target !== expectedCatId) {
                    isCorrect = false;
                    item.style.background = '#ffcccc';
                    item.style.borderColor = '#e74c3c';
                } else {
                    item.style.background = '#ccffcc';
                    item.style.borderColor = '#2ecc71';
                }
            });
        });

        if (isCorrect) {
            showFeedback(true, "Mükemmel Sınıflandırma!", currentQuestion.feedback);
        } else {
            showFeedback(false, "Kategori Hatası", "Bazı öğeler yanlış kutuda! İpuçlarını düşünerek tekrar yerleştir.");
            submitBtn.style.display = 'none';
            // Optionally, return wrong items to the pool
        }
    };
}
