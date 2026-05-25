// Định nghĩa chuỗi hiển thị mặc định của các nút tương ứng với trạng thái nhiệm vụ chưa hoàn thành
const defaultBtnTexts = {
    1: "Bắt đầu", 
    2: "Xem ngay", 
    3: "Khám phá", 
    4: "Chinh phục"
};

const energyFill = document.getElementById('energyFill');
const energyPercent = document.getElementById('energyPercent');

// LẮNG NGHE TÍN HIỆU ĐIỂM SỐ TỪ CỔNG LTI MOODLE GỬI RA CHẠY NGẦM (postMessage)
window.addEventListener('message', function(event) {
    try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Hỗ trợ tự động bắt các định dạng gói tin điểm số từ Moodle LTI Activity gửi ra
        if (data && (data.subject === 'lti.grade' || data.score !== undefined || data.grade !== undefined)) {
            let score = data.score !== undefined ? data.score : data.grade;
            
            // Nếu điểm số gửi dưới dạng tỷ lệ thập phân (0.0 -> 1.0) thì quy đổi ra hệ 100
            if (score <= 1.0) {
                score = Math.round(score * 100);
            }
            
            // Tự động ghi điểm ngầm vào phi thuyền và cập nhật học bạ tức thì!
            autoUpdateLtiScore(score);
        }
    } catch (e) {
        // Bỏ qua tin nhắn lỗi cú pháp JSON từ các luồng bên ngoài
    }
});

/**
 * Xử lý lưu điểm và cập nhật Sổ điểm cá nhân tự động không cần bấm nút
 */
function autoUpdateLtiScore(score) {
    localStorage.setItem('scratch_b1_s4', 'done');
    localStorage.setItem('score_b1_s4', score.toString());
    
    // Cập nhật nhãn trạng thái trên Header của trạm LTI
    const statusText = document.getElementById('ltiSyncStatusText');
    if (statusText) {
        statusText.innerHTML = `🟢 Đã tự động nhận điểm: ${score}/100đ`;
        statusText.style.color = "#4ade80";
        statusText.style.background = "rgba(74, 222, 128, 0.15)";
    }
    
    // Kết xuất lại Sổ điểm cá nhân & lộ trình tuần tự
    checkAndRenderSteps();
    
    // Shin Bot reo mừng tự động đồng bộ thành công!
    showCustomAlert(`🤖 Shin Bot đã tự động ghi nhận và cập nhật điểm số ${score}/100 của bạn từ Moodle LTI về Sổ Điểm Cá Nhân!`);
}

document.addEventListener("DOMContentLoaded", () => {
    checkAndRenderSteps();
});

/**
 * Hiển thị chi tiết danh sách nhiệm vụ của Bài học số 1
 */
function showMissionDetail() {
    document.getElementById('roadmapListView').style.display = 'none';
    document.getElementById('lessonStepsView').style.display = 'flex';
    checkAndRenderSteps();
}

/**
 * Ẩn chi tiết nhiệm vụ và quay về giao diện Bản Đồ Không Gian
 */
function hideMissionDetail() {
    document.getElementById('roadmapListView').style.display = 'block';
    document.getElementById('lessonStepsView').style.display = 'none';
}

/**
 * Kiểm tra trạng thái lưu trữ của từng nhiệm vụ và kết xuất lại giao diện cho các bước học tập
 * LỘ TRÌNH KHÓA HỌC TUẦN TỰ NGHIÊM NGẶT: 1 -> 2 -> 3 -> 4
 */
function checkAndRenderSteps() {
    let s1 = localStorage.getItem('scratch_b1_s1') === 'done';
    let s2 = localStorage.getItem('scratch_b1_s2') === 'done';
    let s3 = localStorage.getItem('scratch_b1_s3') === 'done';
    let s4 = localStorage.getItem('scratch_b1_s4') === 'done';

    // Cổng kiểm soát logic tuần tự chặt chẽ: 
    // - Nhiệm vụ 1: Luôn mở.
    // - Nhiệm vụ 2: Mở khi 1 xong (s1).
    // - Nhiệm vụ 3: Mở khi 2 xong (s2).
    // - Nhiệm vụ 4: Mở khi 3 xong (s3).
    updateCardUI(1, true, s1);
    updateCardUI(2, s1, s2);
    updateCardUI(3, s2, s3);
    updateCardUI(4, s3, s4);

    // Cập nhật Sổ điểm cá nhân
    renderGradebook();
}

/**
 * Cập nhật định dạng giao diện cho từng thẻ chứa thẻ bài bước học tập cụ thể
 */
function updateCardUI(stepNum, isUnlocked, isCompleted) {
    const card = document.getElementById('stepCard' + stepNum);
    const btn = document.getElementById('stepBtn' + stepNum);
    if (!card || !btn) return;
    card.classList.remove('is-locked', 'is-completed');

    if (isCompleted) {
        card.classList.add('is-completed');
        btn.innerHTML = "✅ Đã xong";
        btn.style.background = "#22c55e";
        btn.style.boxShadow = "0 3px 0 #16a34a";
        btn.disabled = false;
    } else if (!isUnlocked) {
        card.classList.add('is-locked');
        btn.innerHTML = "🔒 Khóa";
        btn.style.background = "#475569";
        btn.style.boxShadow = "none";
        btn.disabled = true;
    } else {
        btn.innerHTML = defaultBtnTexts[stepNum];
        btn.style.background = "";
        btn.style.boxShadow = "";
        btn.disabled = false;
    }
}

/* ==========================================
       HỆ THỐNG TRẠM KHỞI ĐỘNG (NHIỆM VỤ 1)
=========================================== */
function goToScratchMission() {
    document.getElementById('scratchLocalPopup').style.display = 'flex';
    document.getElementById('scratchGameIframe').src = "";

    energyFill.style.width = "15%";
    energyFill.style.background = "linear-gradient(90deg, #ef4444, #f97316)";
    energyPercent.innerText = "15";

    const btn = document.getElementById('actionBtn1');
    btn.innerHTML = "🔊 BẬT LOA & NGHE";
    btn.className = "game-btn";
    btn.onclick = startIntro;

    changeSubStep(1);
}

function startIntro() {
    const bgM = document.getElementById('bgMusic');
    const v1 = document.getElementById('voiceStep1');
    const btn = document.getElementById('actionBtn1');

    bgM.volume = 0.15;
    bgM.play().catch(e => { console.log("Bỏ qua lỗi tự động phát nhạc nền"); });
    v1.play().catch(e => console.log("Lỗi âm thanh thông báo:", e));

    btn.innerHTML = "✨ Đang nghe cu Shin...";
    btn.className = "game-btn btn-disabled";
    btn.onclick = null;

    v1.onended = () => {
        btn.innerHTML = "BẮT ĐẦU CHƠI GAME 🚀";
        btn.className = "game-btn btn-green";
        btn.onclick = () => {
            document.getElementById('scratchGameIframe').src = "https://scratch.mit.edu/projects/1311797116/embed";
            changeSubStep(2);
        };
    };
}

function finishGame() {
    document.getElementById('scratchGameIframe').src = "";
    energyFill.style.width = "100%";
    energyFill.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";

    let count = 15;
    let timer = setInterval(() => {
        count++;
        energyPercent.innerText = count;
        if (count >= 100) clearInterval(timer);
    }, 15);

    setTimeout(() => changeSubStep(3), 1000);
}

function changeSubStep(n) {
    document.querySelectorAll('.wizard-container .wizard-step').forEach(s => s.style.display = 'none');
    const targetStep = document.getElementById('subStep' + n);
    if (targetStep) targetStep.style.display = 'flex';

    const v3 = document.getElementById('voiceStep3');
    const v4 = document.getElementById('voiceStep4');

    if (v3 && v4) {
        v3.pause();
        v3.currentTime = 0;
        v4.pause();
        v4.currentTime = 0;

        if (n === 3) v3.play().catch(e => {});
        if (n === 4) v4.play().catch(e => {});
    }
}

function sendToMotherShip() {
    stopAllWizardVoices();
    const bgM = document.getElementById('bgMusic');

    if (bgM) {
        bgM.pause();
        bgM.currentTime = 0;
    }

    localStorage.setItem('scratch_b1_s1', 'done');
    localStorage.setItem('score_b1_s1', '100'); // Gán điểm nhiệm vụ 1
    checkAndRenderSteps();
    document.getElementById('scratchLocalPopup').style.display = 'none';
}

function stopAllWizardVoices() {
    const v1 = document.getElementById('voiceStep1');
    const v3 = document.getElementById('voiceStep3');
    const v4 = document.getElementById('voiceStep4');

    if (v1) { v1.pause(); v1.currentTime = 0; }
    if (v3) { v3.pause(); v3.currentTime = 0; }
    if (v4) { v4.pause(); v4.currentTime = 0; }
}

/* ==========================================
       LOGIC TRẠM LÝ THUYẾT HÀNH TINH NGANG CỐ ĐỊNH (NHIỆM VỤ 3)
=========================================== */
const lessonData = {
    events: {
        t: "🟡 Nhóm Sự Kiện (Events)",
        g: "https://media.giphy.com/media/MBaRIkFJiJ1yF5ZUy8/giphy.gif",
        c: "Nhóm màu vàng này là <b>'Lớp trưởng'</b>! Nó luôn đứng ở đầu hàng để ra lệnh cho các bạn khác chạy theo. Thiếu nó là chú mèo ngủ gật luôn đó!"
    },
    motion: {
        t: "🔵 Nhóm Chuyển Động (Motion)",
        g: "https://media.giphy.com/media/kGdWDdaIEN5yDWKmg4/giphy.gif",
        c: "Làm nhân vật chạy nhảy tung tăng! Mẹo: Bé có thể <b>nhấp đúp chuột 2 lần</b> vào khối lệnh để chú mèo chạy thử ngay lập tức nhé!"
    },
    looks: {
        t: "🟣 Nhóm Hiển Thị (Looks)",
        g: "https://media.giphy.com/media/l4EparOp3SHAgUtBm/giphy.gif",
        c: "Biến hình phép thuật! Giúp nhân vật nói chuyện bằng <b>bong bóng chat</b> và thay đổi quần áo (trang phục) siêu nhanh!"
    },
    sound: {
        t: "🔴 Nhóm Âm Thanh (Sound)",
        g: "https://media.giphy.com/media/icIr8rk03xQI6NS67S/giphy.gif",
        c: "Xập xình âm nhạc! Ngoài âm thanh có sẵn, bé có thể tự <b>tải nhạc từ máy tính lên</b> để làm nhạc nền cho trò chơi mình nhé!"
    }
};

const quizStore = [
    {
        q: "Muốn chạy thử khối lệnh ngay trong kho để xem nó làm gì, bé thao tác thế nào?", 
        a: ["Nhấn Lá Cờ Xanh", "Nhấp đúp chuột 2 lần vào lệnh", "Kéo lệnh vào thùng rác"], 
        c: 1
    },
    {
        q: "Trong video thầy Hùng, nhóm lệnh màu vàng Sự Kiện được ví giống ai?", 
        a: ["Một chú mèo lười", "Một người Lớp Trưởng", "Một phi hành gia"], 
        c: 1
    },
    {
        q: "Lệnh nói chứa số giây (như nói Xin chào trong 2 giây) khác gì lệnh nói thường?", 
        a: ["Sẽ tự ẩn bong bóng chat đi", "Sẽ phát ra tiếng nói", "Không khác gì nhau"], 
        c: 0
    },
    {
        q: "Bé có thể lấy thêm âm thanh cho trò chơi từ đâu?", 
        a: ["Chỉ lấy trong kho Scratch", "Chỉ tải từ máy tính", "Cả kho Scratch và tải từ máy tính"], 
        c: 2
    }
];

let currentQ = 0;
let correctCount = 0;

function goToTheoryMission() {
    document.getElementById('theoryLocalPopup').style.display = 'flex';
    document.getElementById('stageMindmap').style.display = 'flex';
    document.getElementById('stageQuiz').style.display = 'none';
    document.getElementById('stageFinish').style.display = 'none';

    document.getElementById('shinGif').src = "https://media.giphy.com/media/MBaRIkFJiJ1yF5ZUy8/giphy.gif";
    document.getElementById('infoText').innerHTML = "<b>Chào bạn nhỏ!</b> Nhấn vào các hành tinh lệnh trôi bồng bềnh ở trên để cùng cu Shin khám phá bí mật nhé! 🎉";
}

function closeLocalTheory() {
    document.getElementById('theoryLocalPopup').style.display = 'none';
}

function showInfo(key) {
    const d = lessonData[key];
    const gifTarget = document.getElementById('shinGif');

    if (gifTarget) {
        gifTarget.src = d.g;
    }
    document.getElementById('infoText').innerHTML = '<b>' + d.t + '</b>' + d.c;
}

function goToQuiz() {
    document.getElementById('stageMindmap').style.display = 'none';
    document.getElementById('stageQuiz').style.display = 'flex';
    currentQ = 0;
    correctCount = 0;
    renderQuestion();
}

function renderQuestion() {
    const data = quizStore[currentQ];
    document.getElementById('qText').innerText = '❓ ' + data.q;
    document.getElementById('qProgress').innerText = 'Câu ' + (currentQ + 1) + '/4';
    document.getElementById('qFeed').innerText = '';
    document.getElementById('nextBtn').disabled = true;

    const box = document.getElementById('ansBox');
    box.innerHTML = '';

    data.a.forEach(function(txt, i) {
        const b = document.createElement('button');
        b.className = 'ans-btn';
        b.innerText = txt;
        b.onclick = function() {
            checkAns(b, i, data.c);
        };
        box.appendChild(b);
    });
}

function checkAns(btn, idx, correct) {
    const all = document.querySelectorAll('.ans-btn');
    all.forEach(function(el) {
        el.className = 'ans-btn';
    });

    if (idx === correct) {
        btn.classList.add('correct');
        document.getElementById('qFeed').style.color = '#4ade80';
        document.getElementById('qFeed').innerText = '🌟 QUÁ GIỎI LUÔN BẠN ƠI!';
        document.getElementById('nextBtn').disabled = false;
        correctCount++;
    } else {
        btn.classList.add('wrong');
        document.getElementById('qFeed').style.color = '#f87171';
        document.getElementById('qFeed').innerText = '❌ Bé thử suy nghĩ lại một tí nhé!';
        document.getElementById('nextBtn').disabled = true;
    }
}

function loadNextQ() {
    currentQ++;
    if (currentQ < quizStore.length) {
        renderQuestion();
    } else {
        document.getElementById('stageQuiz').style.display = 'none';
        document.getElementById('stageFinish').style.display = 'flex';
    }
}

function backToMap() {
    document.getElementById('stageQuiz').style.display = 'none';
    document.getElementById('stageMindmap').style.display = 'flex';
}

function finishAllTheory() {
    localStorage.setItem('scratch_b1_s3', 'done');
    let finalScore = Math.round((correctCount / 4) * 100);
    localStorage.setItem('score_b1_s3', finalScore.toString()); // Lưu điểm Quiz
    checkAndRenderSteps();
    document.getElementById('theoryLocalPopup').style.display = 'none';

    if (typeof showCustomAlert === "function") {
        showCustomAlert("🎉 Chúc mừng chiến binh nhí! Bạn đã xuất sắc hoàn thành Trạm Bí Kíp & Quiz Ôn Tập. Nhiệm vụ 4 cuối cùng đã sẵn sàng được mở khóa!");
    }
}

/* ==========================================
       HỆ THỐNG VIDEO H5P & HOẠT ĐỘNG KHÁC
=========================================== */
function goToH5PSection(embedUrl) {
    const popup = document.getElementById('h5pLocalPopup');
    const iframe = document.getElementById('localH5pIframe');

    iframe.src = embedUrl;
    popup.style.display = 'flex';

    let alreadyDone = localStorage.getItem('scratch_b1_s2') === 'done';

    if (!alreadyDone) {
        // Tự động mở khóa sau 10 giây xem video mẫu
        setTimeout(function() {
            if (document.getElementById('h5pLocalPopup').style.display === 'flex') {
                localStorage.setItem('scratch_b1_s2', 'done');
                localStorage.setItem('score_b1_s2', '100'); // Lưu điểm xem video H5P
                checkAndRenderSteps();
                showCustomAlert("🎉 Chúc mừng chiến binh vũ trụ! Bạn đã xuất sắc vượt qua thử thách video bài giảng. Nhiệm vụ 3 đã sẵn sàng được mở khóa!");
            }
        }, 10000);
    }
}

function toggleH5PTheaterMode() {
    const popup = document.getElementById('h5pLocalPopup');
    const btn = document.getElementById('btnH5PTheater');
    const spaceWrapper = document.querySelector('.space-course-wrapper');
    const panel2 = document.querySelector('.content-panel.panel-2');

    if (popup && spaceWrapper && panel2) {
        popup.classList.toggle('theater-mode');
        if (popup.classList.contains('theater-mode')) {
            spaceWrapper.appendChild(popup);
            btn.innerHTML = "🔍 THU NHỎ LẠI";
            btn.style.background = "#f59e0b";
        } else {
            panel2.appendChild(popup);
            btn.innerHTML = "📺 PHÓNG TO RẠP CHIẾU PHIM";
            btn.style.background = "#3b82f6";
        }
    }
}

function showCustomAlert(text) {
    document.getElementById('customAlertText').innerText = text;
    document.getElementById('customMissionAlert').style.display = 'flex';
}

// Hàm giải lập để người dùng có thể đóng cửa sổ thông báo
function closeCustomAlert() {
    document.getElementById('customMissionAlert').style.display = 'none';
    closeLocalH5P();
}

function closeLocalH5P() {
    const popup = document.getElementById('h5pLocalPopup');
    const panel2 = document.querySelector('.content-panel.panel-2');
    
    if (popup && panel2) {
        popup.classList.remove('theater-mode');
        panel2.appendChild(popup);
    }
    
    const btn = document.getElementById('btnH5PTheater');
    if (btn) {
        btn.innerHTML = "📺 PHÓNG TO RẠP CHIẾU PHIM";
        btn.style.background = "#3b82f6";
    }
    document.getElementById('h5pLocalPopup').style.display = 'none';
    document.getElementById('localH5pIframe').src = "";
}

/* =======================================================
       HỆ THỐNG ĐỒNG BỘ ĐIỂM MOODLE LTI (BƯỚC 4)
========================================================== */
function openLtiPopup() {
    const iframe = document.getElementById('moodleLtiIframe');
    if (iframe && !iframe.src) {
        iframe.src = "https://laptrinhscratchcoban.moodlecloud.com/mod/lti/launch.php?id=55";
    }
    document.getElementById('ltiAssignmentPopup').style.display = 'flex';
    
    // Tự động kiểm tra xem bài viết đã được ghi điểm trong LocalStorage chưa để cập nhật hiển thị
    const statusText = document.getElementById('ltiSyncStatusText');
    const hasScore = localStorage.getItem('score_b1_s4') !== null;
    if (statusText) {
        if (hasScore) {
            const score = localStorage.getItem('score_b1_s4');
            statusText.innerHTML = `🟢 Đã tự động nhận điểm: ${score}/100đ`;
            statusText.style.color = "#4ade80";
            statusText.style.background = "rgba(74, 222, 128, 0.15)";
        } else {
            statusText.innerHTML = "🟢 Sẵn sàng nhận điểm số tự động";
            statusText.style.color = "#4ade80";
            statusText.style.background = "rgba(74, 222, 128, 0.1)";
        }
    }
}

function closeLtiPopup() {
    document.getElementById('ltiAssignmentPopup').style.display = 'none';
}

/* =======================================================
       KẾT XUẤT ĐỘNG SỔ ĐIỂM CÁ NHÂN LTI (PANEL 3)
========================================================== */
function renderGradebook() {
    const listContainer = document.getElementById('gradebookList');
    if (!listContainer) return;

    // Sổ điểm cá nhân CHỈ hiển thị thống kê phần bài tập Nhiệm vụ 4 của 1 bài duy nhất
    const m = { id: 4, name: "Nhiệm vụ 4: Bài Tập Thực Hành LTI", storageKey: "score_b1_s4" };
    const scoreVal = localStorage.getItem(m.storageKey);
    const hasScore = scoreVal !== null;
    const score = hasScore ? parseInt(scoreVal) : 0;

    let htmlContent = `
        <div class="gradebook-item-row ${hasScore ? 'completed' : ''}">
            <div class="gradebook-icon-badge">${hasScore ? '✅' : '🔒'}</div>
            <div class="gradebook-item-info">
                <span class="gradebook-item-title">${m.name}</span>
                <span class="gradebook-item-status">
                    ${hasScore ? 'Đã được chấm & ghi nhận điểm tự động từ Moodle' : 'Đang chờ nộp bài & nhận điểm từ Moodle'}
                </span>
            </div>
            <div class="gradebook-score-box">
                <span class="gradebook-score-num">${hasScore ? score + 'đ' : '--'}</span>
            </div>
        </div>
    `;

    listContainer.innerHTML = htmlContent;

    // Cập nhật điểm GPA và nhãn hiển thị bên trên cho Nhiệm vụ 4 duy nhất
    document.getElementById('gpaScore').innerText = hasScore ? `${score}/100` : `0/100`;
    
    const syncElement = document.getElementById('syncCount');
    if (syncElement) {
        if (hasScore) {
            syncElement.innerText = "Đã đồng bộ 🟢";
            syncElement.className = "gpa-value text-green";
        } else {
            syncElement.innerText = "Chưa hoàn thành 🔴";
            syncElement.className = "gpa-value text-red";
        }
    }
}

/* ==========================================
       HỆ THỐNG KÉO THẢ CHATBOT SHIN VÀ FULL SCREEN
=========================================== */
document.addEventListener("DOMContentLoaded", function() {
    const botContainer = document.getElementById('chatbotContainer');
    const shinBtn = document.getElementById('shinBotBtn');
    const chatFrame = document.getElementById('aiChatFrame');
    const tooltip = document.getElementById('shinTooltip');
    const spaceWrapper = document.querySelector('.space-course-wrapper');

    let isDragging = false;
    let hasDragged = false;
    let startX, startY, initialLeft, initialTop;

    function startDrag(e) {
        if (!e.target.closest('#shinBotBtn')) return;
        isDragging = true;
        hasDragged = false;
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        startX = clientX;
        startY = clientY;
        const rect = botContainer.getBoundingClientRect();
        const wrapperRect = spaceWrapper.getBoundingClientRect();
        initialLeft = rect.left - wrapperRect.left;
        initialTop = rect.top - wrapperRect.top;
        botContainer.style.right = 'auto';
        botContainer.style.bottom = 'auto';
        botContainer.style.left = initialLeft + 'px';
        botContainer.style.top = initialTop + 'px';
        if (e.type.includes('mouse')) e.preventDefault();
    }

    function doDrag(e) {
        if (!isDragging) return;
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const dx = clientX - startX;
        const dy = clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasDragged = true;
        }

        botContainer.style.left = (initialLeft + dx) + 'px';
        botContainer.style.top = (initialTop + dy) + 'px';
    }

    botContainer.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', () => isDragging = false);

    botContainer.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('touchend', () => isDragging = false);

    shinBtn.addEventListener('click', function(e) {
        if (hasDragged) {
            e.preventDefault(); 
            return;
        }

        if (chatFrame.style.display === 'none' || chatFrame.style.display === '') {
            chatFrame.style.display = 'block'; 
            tooltip.style.display = 'none';
        } else {
            chatFrame.style.display = 'none';
        }
    });
});

function goFullScreen() {
    let element = document.querySelector(".space-course-wrapper");
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msContentFullscreen();
    }
}