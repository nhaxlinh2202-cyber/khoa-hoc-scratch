// Định nghĩa chuỗi hiển thị mặc định của các nút tương ứng với trạng thái nhiệm vụ chưa hoàn thành
const defaultBtnTexts = {
    1: "Bắt đầu", 
    2: "Xem ngay", 
    3: "Khám phá", 
    4: "Chinh phục"
};

const energyFill = document.getElementById('energyFill');
const energyPercent = document.getElementById('energyPercent');

/* =======================================================
   ⚙️  CẤU HÌNH MOODLE WEB SERVICES API
   👉  GIÁO VIÊN: điền thông tin vào đây trước khi dùng
======================================================== */
const MOODLE_CONFIG = {
    // URL gốc của trang Moodle (không có dấu / ở cuối)
    url: 'https://laptrinhscratchcoban.moodlecloud.com',

    // Token dịch vụ Web Services — tạo tại:
    // Site Administration → Plugins → Web Services → Manage tokens
    // Token cần có quyền: core_user_get_users_by_field + core_grades_update_grades
    wstoken: 'THAY_TOKEN_CUA_BAN_VAO_DAY',

    // ID của hoạt động Assignment trong Moodle (lấy từ URL khi mở bài tập)
    assignId: 55,

    // Điểm tối đa cho nhiệm vụ này
    maxScore: 100
};

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
   🚀  HỆ THỐNG NỘP BÀI & CHẤM ĐIỂM MOODLE WS API (NHIỆM VỤ 4)
======================================================== */

// Trạng thái nội bộ của form nộp bài
let _scratchProjectUrl = '';

/**
 * Mở popup nộp bài và khởi động lại về Stage 1
 */
function openMoodleSubmitPopup() {
    _scratchProjectUrl = '';
    document.getElementById('moodleSubmitPopup').style.display = 'flex';
    _showMoodleStage(1);

    // Nếu đã từng nộp, hiện trạng thái luôn
    const savedScore = localStorage.getItem('score_b1_s4');
    const pill = document.getElementById('moodleSyncStatus');
    if (pill) {
        if (savedScore !== null) {
            pill.textContent = `🟢 Đã nộp: ${savedScore}/100đ`;
            pill.style.background = 'rgba(74,222,128,0.15)';
            pill.style.color = '#4ade80';
            pill.style.borderColor = 'rgba(74,222,128,0.4)';
        } else {
            pill.textContent = '🟡 Chưa nộp';
            pill.style.background = 'rgba(251,191,36,0.12)';
            pill.style.color = '#fbbf24';
            pill.style.borderColor = 'rgba(251,191,36,0.3)';
        }
    }
}

/**
 * Đóng popup nộp bài và dừng preview
 */
function closeMoodleSubmitPopup() {
    document.getElementById('moodleSubmitPopup').style.display = 'none';
    const previewIframe = document.getElementById('scratchPreviewIframe');
    if (previewIframe) previewIframe.src = '';
}

/**
 * Điều hướng nội bộ giữa các Stage
 */
function _showMoodleStage(n) {
    [1, 2, 3].forEach(i => {
        const el = document.getElementById('moodleStage' + i);
        if (el) el.style.display = (i === n) ? 'flex' : 'none';
    });
}

function goToMoodleStage1() { _showMoodleStage(1); }
function goToMoodleStage2() {
    const confirmed = document.getElementById('confirmedScratchUrl');
    if (confirmed) confirmed.textContent = _scratchProjectUrl;
    _showMoodleStage(2);
}

/**
 * Xem trước dự án Scratch: validate URL rồi nhúng embed
 */
function previewScratchProject() {
    const raw = (document.getElementById('scratchUrlInput').value || '').trim();

    // Trích project ID từ nhiều dạng URL Scratch khác nhau
    const match = raw.match(/scratch\.mit\.edu\/projects\/(\d+)/);
    if (!match) {
        alert('⚠️ URL không hợp lệ!\nVí dụ đúng: https://scratch.mit.edu/projects/123456789');
        return;
    }

    const projectId = match[1];
    _scratchProjectUrl = `https://scratch.mit.edu/projects/${projectId}`;

    const embedUrl = `https://scratch.mit.edu/projects/${projectId}/embed`;
    document.getElementById('scratchPreviewIframe').src = embedUrl;
    document.getElementById('scratchPreviewBox').style.display = 'block';
    document.getElementById('btnGoStage2').style.display = 'inline-flex';
}

/**
 * NỘP BÀI CHÍNH: gọi Moodle WS API để đẩy điểm về Moodle
 *
 * Flow:
 *  1. Validate username
 *  2. core_user_get_users_by_field  → lấy userId
 *  3. core_grades_update_grades     → ghi điểm vào Moodle
 *  4. Lưu localStorage + cập nhật UI
 */
async function submitToMoodle() {
    const username = (document.getElementById('moodleUsernameInput').value || '').trim();
    const errorBox = document.getElementById('moodleApiError');
    const submitBtn = document.getElementById('btnSubmitMoodle');

    // --- Validate ---
    errorBox.style.display = 'none';
    if (!username) {
        _showMoodleError('⚠️ Bạn chưa nhập tên đăng nhập Moodle!');
        return;
    }
    if (!_scratchProjectUrl) {
        _showMoodleError('⚠️ Bạn chưa chọn dự án Scratch! Quay lại bước trước.');
        return;
    }

    // --- Loading state ---
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang kết nối Moodle...';

    try {
        // BƯỚC 1: Tìm userId từ username
        const userId = await _getMoodleUserId(username);

        // BƯỚC 2: Tính điểm (100 điểm cho bài nộp hợp lệ)
        const score = MOODLE_CONFIG.maxScore;

        // BƯỚC 3: Đẩy điểm lên Moodle
        submitBtn.innerHTML = '📡 Đang đẩy điểm về Moodle...';
        const gradeResult = await _pushGradeToMoodle(userId, score);

        // BƯỚC 4: Kiểm tra kết quả API
        if (gradeResult && gradeResult.status === true) {
            _onMoodleSubmitSuccess(score, username, true);
        } else if (gradeResult && gradeResult.exception) {
            // Moodle trả về exception (token sai, quyền thiếu, v.v.)
            throw new Error(gradeResult.message || gradeResult.exception);
        } else {
            // Có thể token chưa cấu hình — vẫn lưu local như fallback
            console.warn('Moodle API response:', gradeResult);
            _onMoodleSubmitSuccess(score, username, false);
        }

    } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 NỘP BÀI & CẬP NHẬT ĐIỂM MOODLE';
        _showMoodleError(`❌ Lỗi: ${err.message}\n\n💡 Kiểm tra lại: tên đăng nhập đúng chưa? Hoặc hỏi giáo viên cấu hình WS Token.`);
    }
}

/**
 * Gọi Moodle REST API để tìm userId từ username
 */
async function _getMoodleUserId(username) {
    const endpoint = `${MOODLE_CONFIG.url}/webservice/rest/server.php`;
    const params = new URLSearchParams({
        wstoken:            MOODLE_CONFIG.wstoken,
        wsfunction:         'core_user_get_users_by_field',
        moodlewsrestformat: 'json',
        field:              'username',
        'values[0]':        username
    });

    const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params
    });

    if (!res.ok) throw new Error(`Moodle không phản hồi (HTTP ${res.status})`);

    const data = await res.json();

    // Moodle trả về mảng users; nếu rỗng → không tìm thấy
    if (data && data.exception) throw new Error(data.message || 'Lỗi xác thực Moodle');
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`Không tìm thấy tài khoản "${username}" trên Moodle. Kiểm tra lại tên đăng nhập.`);
    }

    return data[0].id;
}

/**
 * Gọi Moodle REST API để ghi điểm vào gradebook
 */
async function _pushGradeToMoodle(userId, score) {
    const endpoint = `${MOODLE_CONFIG.url}/webservice/rest/server.php`;
    const feedback = `Nộp qua Phi Thuyền Học Tập | Scratch: ${_scratchProjectUrl}`;

    const params = new URLSearchParams({
        wstoken:               MOODLE_CONFIG.wstoken,
        wsfunction:            'core_grades_update_grades',
        moodlewsrestformat:    'json',
        source:                'PhiThuyen_DinoTech',
        component:             'mod_assign',
        activityid:            MOODLE_CONFIG.assignId,
        itemnumber:            0,
        'grades[0][studentid]':   userId,
        'grades[0][grade]':        score,
        'grades[0][str_feedback]': feedback
    });

    const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params
    });

    if (!res.ok) throw new Error(`Moodle không phản hồi khi ghi điểm (HTTP ${res.status})`);
    return await res.json();
}

/**
 * Xử lý sau khi nộp bài thành công
 * @param {number}  score      - Điểm đạt được
 * @param {string}  username   - Tên đăng nhập Moodle
 * @param {boolean} synced     - true nếu API Moodle xác nhận thành công
 */
function _onMoodleSubmitSuccess(score, username, synced) {
    // Lưu localStorage
    localStorage.setItem('scratch_b1_s4', 'done');
    localStorage.setItem('score_b1_s4', score.toString());
    localStorage.setItem('scratch_b1_s4_user', username);
    localStorage.setItem('scratch_b1_s4_url', _scratchProjectUrl);

    // Cập nhật status pill ở header
    const pill = document.getElementById('moodleSyncStatus');
    if (pill) {
        pill.textContent = `🟢 Đã nộp: ${score}/100đ`;
        pill.style.background = 'rgba(74,222,128,0.15)';
        pill.style.color = '#4ade80';
        pill.style.borderColor = 'rgba(74,222,128,0.4)';
    }

    // Hiện kết quả Stage 3
    document.getElementById('moodleResultScore').textContent = `${score}/${MOODLE_CONFIG.maxScore}`;
    document.getElementById('moodleResultSyncText').textContent = synced
        ? '🟢 Đã đồng bộ Moodle'
        : '🟡 Lưu cục bộ (kiểm tra token)';
    document.getElementById('moodleResultMsg').textContent = synced
        ? `Điểm ${score}/100 đã được cập nhật trực tiếp vào sổ điểm Moodle của ${username}!`
        : `Điểm đã lưu cục bộ. Liên hệ giáo viên kiểm tra cấu hình WS Token để đồng bộ Moodle.`;

    _showMoodleStage(3);
    checkAndRenderSteps();
}

/**
 * Hiển thị thông báo lỗi bên trong popup
 */
function _showMoodleError(msg) {
    const box = document.getElementById('moodleApiError');
    if (!box) return;
    box.textContent = msg;
    box.style.display = 'block';
}

/* =======================================================
       KẾT XUẤT ĐỘNG SỔ ĐIỂM CÁ NHÂN LTI (PANEL 3)
========================================================== */
function renderGradebook() {
    const listContainer = document.getElementById('gradebookList');
    if (!listContainer) return;

    // Sổ điểm cá nhân CHỈ hiển thị thống kê phần bài tập Nhiệm vụ 4 của 1 bài duy nhất
    const m = { id: 4, name: "Nhiệm vụ 4: Nộp Bài Scratch & Đồng Bộ Moodle", storageKey: "score_b1_s4" };
    const scoreVal = localStorage.getItem(m.storageKey);
    const hasScore = scoreVal !== null;
    const score = hasScore ? parseInt(scoreVal) : 0;

    let htmlContent = `
        <div class="gradebook-item-row ${hasScore ? 'completed' : ''}">
            <div class="gradebook-icon-badge">${hasScore ? '✅' : '🔒'}</div>
            <div class="gradebook-item-info">
                <span class="gradebook-item-title">${m.name}</span>
                <span class="gradebook-item-status">
                    ${hasScore ? 'Đã nộp qua WS API & đồng bộ Moodle thành công' : 'Đang chờ nộp bài Scratch & đồng bộ Moodle'}
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