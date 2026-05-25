/* ==============================================================
   SCRIPT.JS - PHI THUYỀN SCRATCH - DINO TECH
   Hệ thống chấm điểm .sb3 tự động + đồng bộ Moodle Web Services
   Không còn dùng iframe LTI
   ============================================================== */

/* =================================================================
   CẤU HÌNH MOODLE WEB SERVICES
   - Vào Moodle → Site Admin → Plugins → Web Services → External Services
     → Tạo service → Enable functions: core_grades_update_grades
   - Vào Plugins → Web Services → Manage Tokens → Tạo token cho GV
   - Điền thông tin vào đây:
   ================================================================= */
const MOODLE_CONFIG = {
    baseUrl:    'https://laptrinhscratchcoban.moodlecloud.com',  // URL Moodle của bạn
    wsToken:    'PASTE_YOUR_MOODLE_WS_TOKEN_HERE',              // Token Web Services
    courseId:   1,      // ID khóa học trong Moodle (xem trên URL khi vào khóa học)
    assignId:   55,     // ID item điểm (grade item id) – xem tại Gradebook Setup
    itemName:   'Bai1_NhiemVu4_Scratch',                        // Tên grade item (phải khớp)
    maxScore:   100
};

/* =================================================================
   YÊU CẦU BÀI TẬP & TIÊU CHÍ CHẤM ĐIỂM FILE .SB3
   Mỗi criterion: { id, label, points, hint, check(projectJson) }
   projectJson = nội dung project.json bên trong file .sb3
   ================================================================= */
const SB3_CRITERIA = [
    {
        id: 'has_green_flag',
        label: '✅ Có khối lệnh "Khi nhấn lá cờ xanh" (sự kiện khởi động)',
        points: 20,
        hint: 'Vào nhóm Sự Kiện (màu vàng) → kéo khối "Khi nhấn 🏁" vào vùng lập trình của nhân vật.',
        check(proj) {
            return hasBlock(proj, 'event_whenflagclicked');
        }
    },
    {
        id: 'has_motion',
        label: '✅ Nhân vật có lệnh chuyển động (di chuyển / xoay / đến vị trí)',
        points: 20,
        hint: 'Vào nhóm Chuyển Động (màu xanh dương) → dùng ít nhất 1 lệnh như "di chuyển 10 bước" hoặc "đến vị trí x,y".',
        check(proj) {
            return hasAnyBlock(proj, ['motion_movesteps','motion_gotoxy','motion_glidesecstoxy','motion_turnright','motion_turnleft']);
        }
    },
    {
        id: 'has_looks_say',
        label: '✅ Nhân vật có lệnh hiển thị / nói (nhóm Looks)',
        points: 20,
        hint: 'Vào nhóm Hiển Thị (màu tím) → dùng lệnh "Nói [xin chào] trong [2] giây" hoặc "Nói [xin chào]".',
        check(proj) {
            return hasAnyBlock(proj, ['looks_say','looks_sayforsecs','looks_think','looks_thinkforsecs']);
        }
    },
    {
        id: 'has_sound',
        label: '✅ Dự án có lệnh phát âm thanh (nhóm Sound)',
        points: 20,
        hint: 'Vào nhóm Âm Thanh (màu hồng đỏ) → dùng lệnh "Phát âm thanh..." hoặc "Phát âm thanh ... đến khi xong".',
        check(proj) {
            return hasAnyBlock(proj, ['sound_play','sound_playuntildone']);
        }
    },
    {
        id: 'multi_sprites',
        label: '✅ Có ít nhất 2 nhân vật (sprite) trong dự án',
        points: 20,
        hint: 'Nhìn vào thanh Nhân Vật phía dưới màn hình Scratch → bấm nút "+" để thêm nhân vật mới từ thư viện hoặc vẽ tay.',
        check(proj) {
            try {
                const sprites = proj.targets.filter(t => !t.isStage);
                return sprites.length >= 2;
            } catch { return false; }
        }
    }
];

/* ------------------------------------------------------------------
   TIỆN ÍCH ĐỌC BLOCK TỪ PROJECT.JSON CỦA SCRATCH
   ------------------------------------------------------------------ */
function hasBlock(projectJson, opcode) {
    return hasAnyBlock(projectJson, [opcode]);
}

function hasAnyBlock(projectJson, opcodes) {
    try {
        for (const target of projectJson.targets) {
            const blocks = Object.values(target.blocks || {});
            for (const block of blocks) {
                if (block && opcodes.includes(block.opcode)) return true;
            }
        }
    } catch(e) {}
    return false;
}

/* ==============================================================
   TRẠNG THÁI TOÀN CỤC (thay thế localStorage riêng lẻ)
   ============================================================== */
const defaultBtnTexts = { 1:"Bắt đầu", 2:"Xem ngay", 3:"Khám phá", 4:"Chinh phục" };
const energyFill    = document.getElementById('energyFill');
const energyPercent = document.getElementById('energyPercent');

/* ==============================================================
   KHỞI TẠO KHI DOM SẴN SÀNG
   ============================================================== */
document.addEventListener("DOMContentLoaded", () => {
    checkAndRenderSteps();
    renderSb3Requirements();
    initSb3Uploader();
});

/* ==============================================================
   LỘ TRÌNH HỌC TẬP TUẦN TỰ
   ============================================================== */
function showMissionDetail() {
    document.getElementById('roadmapListView').style.display = 'none';
    document.getElementById('lessonStepsView').style.display = 'flex';
    checkAndRenderSteps();
}

function hideMissionDetail() {
    document.getElementById('roadmapListView').style.display = 'block';
    document.getElementById('lessonStepsView').style.display = 'none';
}

function checkAndRenderSteps() {
    const s1 = localStorage.getItem('scratch_b1_s1') === 'done';
    const s2 = localStorage.getItem('scratch_b1_s2') === 'done';
    const s3 = localStorage.getItem('scratch_b1_s3') === 'done';
    const s4 = localStorage.getItem('scratch_b1_s4') === 'done';
    updateCardUI(1, true, s1);
    updateCardUI(2, s1,   s2);
    updateCardUI(3, s2,   s3);
    updateCardUI(4, s3,   s4);
    renderGradebook();
}

function updateCardUI(stepNum, isUnlocked, isCompleted) {
    const card = document.getElementById('stepCard' + stepNum);
    const btn  = document.getElementById('stepBtn'  + stepNum);
    if (!card || !btn) return;
    card.classList.remove('is-locked','is-completed');
    if (isCompleted) {
        card.classList.add('is-completed');
        btn.innerHTML  = "✅ Đã xong";
        btn.style.background  = "#22c55e";
        btn.style.boxShadow   = "0 3px 0 #16a34a";
        btn.disabled   = false;
    } else if (!isUnlocked) {
        card.classList.add('is-locked');
        btn.innerHTML  = "🔒 Khóa";
        btn.style.background  = "#475569";
        btn.style.boxShadow   = "none";
        btn.disabled   = true;
    } else {
        btn.innerHTML  = defaultBtnTexts[stepNum];
        btn.style.background  = "";
        btn.style.boxShadow   = "";
        btn.disabled   = false;
    }
}

/* ==============================================================
   SỔ ĐIỂM CÁ NHÂN (PANEL 3)
   ============================================================== */
function renderGradebook() {
    const listContainer = document.getElementById('gradebookList');
    if (!listContainer) return;
    const scoreVal = localStorage.getItem('score_b1_s4');
    const hasScore = scoreVal !== null;
    const score    = hasScore ? parseInt(scoreVal) : 0;
    const moodleSynced = localStorage.getItem('moodle_synced_b1_s4') === 'yes';

    listContainer.innerHTML = `
        <div class="gradebook-item-row ${hasScore ? 'completed' : ''}">
            <div class="gradebook-icon-badge">${hasScore ? '✅' : '🔒'}</div>
            <div class="gradebook-item-info">
                <span class="gradebook-item-title">Nhiệm vụ 4: Bài Tập Scratch (.sb3)</span>
                <span class="gradebook-item-status">
                    ${hasScore
                        ? (moodleSynced ? '✅ Đã chấm & đồng bộ lên Moodle thành công' : '⏳ Đã chấm – chờ đồng bộ Moodle')
                        : 'Đang chờ nộp file .sb3'}
                </span>
            </div>
            <div class="gradebook-score-box">
                <span class="gradebook-score-num">${hasScore ? score + 'đ' : '--'}</span>
            </div>
        </div>`;

    document.getElementById('gpaScore').innerText = hasScore ? `${score}/100` : '0/100';
    const syncEl = document.getElementById('syncCount');
    if (syncEl) {
        if (moodleSynced) {
            syncEl.innerText   = "Đã đồng bộ 🟢";
            syncEl.className   = "gpa-value text-green";
        } else if (hasScore) {
            syncEl.innerText   = "Chờ đồng bộ 🟡";
            syncEl.className   = "gpa-value";
            syncEl.style.color = "#fbbf24";
        } else {
            syncEl.innerText   = "Chưa hoàn thành 🔴";
            syncEl.className   = "gpa-value text-red";
        }
    }
}

/* ==============================================================
   TRẠM KHỞI ĐỘNG (NHIỆM VỤ 1)
   ============================================================== */
function goToScratchMission() {
    document.getElementById('scratchLocalPopup').style.display = 'flex';
    document.getElementById('scratchGameIframe').src = "";
    energyFill.style.width      = "15%";
    energyFill.style.background = "linear-gradient(90deg, #ef4444, #f97316)";
    energyPercent.innerText     = "15";
    const btn = document.getElementById('actionBtn1');
    btn.innerHTML  = "🔊 BẬT LOA & NGHE";
    btn.className  = "game-btn";
    btn.onclick    = startIntro;
    changeSubStep(1);
}

function startIntro() {
    const bgM = document.getElementById('bgMusic');
    const v1   = document.getElementById('voiceStep1');
    const btn  = document.getElementById('actionBtn1');
    bgM.volume = 0.15;
    bgM.play().catch(() => {});
    v1.play().catch(e => console.log("Lỗi âm thanh:", e));
    btn.innerHTML = "✨ Đang nghe cu Shin...";
    btn.className = "game-btn btn-disabled";
    btn.onclick   = null;
    v1.onended = () => {
        btn.innerHTML = "BẮT ĐẦU CHƠI GAME 🚀";
        btn.className = "game-btn btn-green";
        btn.onclick   = () => {
            document.getElementById('scratchGameIframe').src = "https://scratch.mit.edu/projects/1311797116/embed";
            changeSubStep(2);
        };
    };
}

function finishGame() {
    document.getElementById('scratchGameIframe').src = "";
    energyFill.style.width      = "100%";
    energyFill.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
    let count = 15;
    const timer = setInterval(() => {
        count++;
        energyPercent.innerText = count;
        if (count >= 100) clearInterval(timer);
    }, 15);
    setTimeout(() => changeSubStep(3), 1000);
}

function changeSubStep(n) {
    document.querySelectorAll('.wizard-container .wizard-step').forEach(s => s.style.display = 'none');
    const t = document.getElementById('subStep' + n);
    if (t) t.style.display = 'flex';
    const v3 = document.getElementById('voiceStep3');
    const v4 = document.getElementById('voiceStep4');
    if (v3 && v4) {
        v3.pause(); v3.currentTime = 0;
        v4.pause(); v4.currentTime = 0;
        if (n === 3) v3.play().catch(() => {});
        if (n === 4) v4.play().catch(() => {});
    }
}

function sendToMotherShip() {
    stopAllWizardVoices();
    const bgM = document.getElementById('bgMusic');
    if (bgM) { bgM.pause(); bgM.currentTime = 0; }
    localStorage.setItem('scratch_b1_s1', 'done');
    localStorage.setItem('score_b1_s1', '100');
    checkAndRenderSteps();
    document.getElementById('scratchLocalPopup').style.display = 'none';
}

function stopAllWizardVoices() {
    ['voiceStep1','voiceStep3','voiceStep4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.pause(); el.currentTime = 0; }
    });
}

/* ==============================================================
   TRẠM LÝ THUYẾT (NHIỆM VỤ 3)
   ============================================================== */
const lessonData = {
    events: { t:"🟡 Nhóm Sự Kiện (Events)", g:"https://media.giphy.com/media/MBaRIkFJiJ1yF5ZUy8/giphy.gif", c:" Nhóm màu vàng này là <b>'Lớp trưởng'</b>! Nó luôn đứng ở đầu hàng để ra lệnh cho các bạn khác chạy theo. Thiếu nó là chú mèo ngủ gật luôn đó!" },
    motion: { t:"🔵 Nhóm Chuyển Động (Motion)", g:"https://media.giphy.com/media/kGdWDdaIEN5yDWKmg4/giphy.gif", c:" Làm nhân vật chạy nhảy tung tăng! Mẹo: Bé có thể <b>nhấp đúp chuột 2 lần</b> vào khối lệnh để chú mèo chạy thử ngay lập tức nhé!" },
    looks:  { t:"🟣 Nhóm Hiển Thị (Looks)", g:"https://media.giphy.com/media/l4EparOp3SHAgUtBm/giphy.gif", c:" Biến hình phép thuật! Giúp nhân vật nói chuyện bằng <b>bong bóng chat</b> và thay đổi quần áo (trang phục) siêu nhanh!" },
    sound:  { t:"🔴 Nhóm Âm Thanh (Sound)", g:"https://media.giphy.com/media/icIr8rk03xQI6NS67S/giphy.gif", c:" Xập xình âm nhạc! Ngoài âm thanh có sẵn, bé có thể tự <b>tải nhạc từ máy tính lên</b> để làm nhạc nền cho trò chơi mình nhé!" }
};
const quizStore = [
    { q:"Muốn chạy thử khối lệnh ngay trong kho để xem nó làm gì, bé thao tác thế nào?", a:["Nhấn Lá Cờ Xanh","Nhấp đúp chuột 2 lần vào lệnh","Kéo lệnh vào thùng rác"], c:1 },
    { q:"Trong video thầy Hùng, nhóm lệnh màu vàng Sự Kiện được ví giống ai?", a:["Một chú mèo lười","Một người Lớp Trưởng","Một phi hành gia"], c:1 },
    { q:"Lệnh nói chứa số giây (như nói Xin chào trong 2 giây) khác gì lệnh nói thường?", a:["Sẽ tự ẩn bong bóng chat đi","Sẽ phát ra tiếng nói","Không khác gì nhau"], c:0 },
    { q:"Bé có thể lấy thêm âm thanh cho trò chơi từ đâu?", a:["Chỉ lấy trong kho Scratch","Chỉ tải từ máy tính","Cả kho Scratch và tải từ máy tính"], c:2 }
];
let currentQ = 0, correctCount = 0;

function goToTheoryMission() {
    document.getElementById('theoryLocalPopup').style.display = 'flex';
    document.getElementById('stageMindmap').style.display = 'flex';
    document.getElementById('stageQuiz').style.display = 'none';
    document.getElementById('stageFinish').style.display = 'none';
    document.getElementById('shinGif').src = "https://media.giphy.com/media/MBaRIkFJiJ1yF5ZUy8/giphy.gif";
    document.getElementById('infoText').innerHTML = "<b>Chào bạn nhỏ!</b> Nhấn vào các hành tinh lệnh trôi bồng bềnh ở trên để cùng cu Shin khám phá bí mật nhé! 🎉";
}
function closeLocalTheory() { document.getElementById('theoryLocalPopup').style.display = 'none'; }
function showInfo(key) {
    const d = lessonData[key];
    document.getElementById('shinGif').src = d.g;
    document.getElementById('infoText').innerHTML = '<b>' + d.t + '</b>' + d.c;
}
function goToQuiz() {
    document.getElementById('stageMindmap').style.display = 'none';
    document.getElementById('stageQuiz').style.display = 'flex';
    currentQ = 0; correctCount = 0;
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
    data.a.forEach((txt, i) => {
        const b = document.createElement('button');
        b.className = 'ans-btn';
        b.innerText = txt;
        b.onclick = () => checkAns(b, i, data.c);
        box.appendChild(b);
    });
}
function checkAns(btn, idx, correct) {
    document.querySelectorAll('.ans-btn').forEach(el => el.className = 'ans-btn');
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
    if (currentQ < quizStore.length) renderQuestion();
    else { document.getElementById('stageQuiz').style.display = 'none'; document.getElementById('stageFinish').style.display = 'flex'; }
}
function backToMap() {
    document.getElementById('stageQuiz').style.display = 'none';
    document.getElementById('stageMindmap').style.display = 'flex';
}
function finishAllTheory() {
    localStorage.setItem('scratch_b1_s3', 'done');
    localStorage.setItem('score_b1_s3', Math.round((correctCount / 4) * 100).toString());
    checkAndRenderSteps();
    document.getElementById('theoryLocalPopup').style.display = 'none';
    showCustomAlert("🎉 Chúc mừng chiến binh nhí! Bạn đã hoàn thành Trạm Bí Kíp & Quiz. Nhiệm vụ 4 đã sẵn sàng được mở khóa!");
}

/* ==============================================================
   VIDEO H5P (NHIỆM VỤ 2)
   ============================================================== */
function goToH5PSection(embedUrl) {
    const popup  = document.getElementById('h5pLocalPopup');
    const iframe = document.getElementById('localH5pIframe');
    iframe.src   = embedUrl;
    popup.style.display = 'flex';
    if (localStorage.getItem('scratch_b1_s2') !== 'done') {
        setTimeout(() => {
            if (document.getElementById('h5pLocalPopup').style.display === 'flex') {
                localStorage.setItem('scratch_b1_s2', 'done');
                localStorage.setItem('score_b1_s2', '100');
                checkAndRenderSteps();
                showCustomAlert("🎉 Chúc mừng! Bạn đã vượt qua thử thách video. Nhiệm vụ 3 đã sẵn sàng được mở khóa!");
            }
        }, 10000);
    }
}
function toggleH5PTheaterMode() {
    const popup       = document.getElementById('h5pLocalPopup');
    const btn         = document.getElementById('btnH5PTheater');
    const spaceWrapper= document.querySelector('.space-course-wrapper');
    const panel2      = document.querySelector('.content-panel.panel-2');
    if (!popup || !spaceWrapper || !panel2) return;
    popup.classList.toggle('theater-mode');
    if (popup.classList.contains('theater-mode')) {
        spaceWrapper.appendChild(popup);
        btn.innerHTML     = "🔍 THU NHỎ LẠI";
        btn.style.background = "#f59e0b";
    } else {
        panel2.appendChild(popup);
        btn.innerHTML     = "📺 PHÓNG TO RẠP CHIẾU PHIM";
        btn.style.background = "#3b82f6";
    }
}
function closeLocalH5P() {
    const popup  = document.getElementById('h5pLocalPopup');
    const panel2 = document.querySelector('.content-panel.panel-2');
    if (popup && panel2) { popup.classList.remove('theater-mode'); panel2.appendChild(popup); }
    const btn = document.getElementById('btnH5PTheater');
    if (btn) { btn.innerHTML = "📺 PHÓNG TO RẠP CHIẾU PHIM"; btn.style.background = "#3b82f6"; }
    popup.style.display = 'none';
    document.getElementById('localH5pIframe').src = "";
}

/* ==============================================================
   THÔNG BÁO TÙY CHỈNH
   ============================================================== */
function showCustomAlert(text) {
    document.getElementById('customAlertText').innerText = text;
    document.getElementById('customMissionAlert').style.display = 'flex';
}
function closeCustomAlert() {
    document.getElementById('customMissionAlert').style.display = 'none';
    closeLocalH5P();
}

/* ==============================================================
   ╔═══════════════════════════════════════════════════════════╗
   ║   HỆ THỐNG CHẤM BÀI SB3 + ĐỒNG BỘ MOODLE (NHIỆM VỤ 4)  ║
   ╚═══════════════════════════════════════════════════════════╝

   LUỒNG HOẠT ĐỘNG:
   1. Học sinh bấm "Chinh phục" → mở popup chấm bài
   2. Kéo thả / chọn file .sb3
   3. JSZip giải nén → đọc project.json
   4. Chạy SB3_CRITERIA.check() cho từng tiêu chí
   5. Tính điểm tổng → hiển thị vòng điểm + chi tiết
   6. Hiển thị gợi ý sửa lỗi cho tiêu chí chưa đạt
   7. Học sinh bấm "Gửi điểm lên Moodle"
   8. Gọi Moodle Web Services REST API:
      POST /webservice/rest/server.php
      wsfunction=core_grades_update_grades
      → Moodle cập nhật điểm ngay, không cần nhập thủ công
   ============================================================== */

/** Mở popup chấm bài */
function openSb3Grader() {
    document.getElementById('sb3GraderPopup').style.display = 'flex';
    // Reset lại UI nếu mở lần 2
    const scoreVal = localStorage.getItem('score_b1_s4');
    if (scoreVal) {
        setSb3ScoreUI(parseInt(scoreVal), JSON.parse(localStorage.getItem('sb3_last_results') || '[]'));
        updateSb3SyncStatus('scored');
    } else {
        updateSb3SyncStatus('waiting');
    }
}

/** Đóng popup chấm bài */
function closeSb3Grader() {
    document.getElementById('sb3GraderPopup').style.display = 'none';
}

/** Render danh sách yêu cầu bài tập */
function renderSb3Requirements() {
    const container = document.getElementById('sb3Requirements');
    if (!container) return;
    container.innerHTML = SB3_CRITERIA.map((c, i) => `
        <div class="sb3-req-item">
            <span class="sb3-req-num">${i+1}</span>
            <span>${c.label.replace(/^✅ /,'')} <b>(${c.points}đ)</b></span>
        </div>
    `).join('');
}

/** Khởi tạo vùng kéo thả file */
function initSb3Uploader() {
    const zone  = document.getElementById('sb3UploadZone');
    const input = document.getElementById('sb3FileInput');
    if (!zone || !input) return;

    // Drag & Drop
    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleSb3File(file);
    });

    // Click to browse
    input.addEventListener('change', () => {
        if (input.files[0]) handleSb3File(input.files[0]);
    });
}

/** Xử lý file .sb3 được chọn */
async function handleSb3File(file) {
    if (!file.name.endsWith('.sb3')) {
        showSb3Error('❌ Vui lòng chọn đúng file có đuôi .sb3 (export từ Scratch).');
        return;
    }

    // Hiển thị thông tin file
    const infoBox = document.getElementById('sb3FileInfo');
    infoBox.style.display = 'block';
    infoBox.innerHTML = `
        <div class="sb3-file-row">
            <span class="sb3-file-icon">📄</span>
            <div>
                <b>${file.name}</b><br>
                <small>${(file.size / 1024).toFixed(1)} KB · Đang phân tích...</small>
            </div>
            <div class="sb3-spinner"></div>
        </div>`;

    updateSb3SyncStatus('analyzing');

    try {
        // Giải nén .sb3 (thực chất là file ZIP)
        const zip         = await JSZip.loadAsync(file);
        const projectFile = zip.file('project.json');
        if (!projectFile) throw new Error('Không tìm thấy project.json trong file .sb3');
        const projectText = await projectFile.async('string');
        const projectJson = JSON.parse(projectText);

        // Chấm điểm
        const results = gradeSb3(projectJson);
        const total   = results.reduce((sum, r) => sum + (r.passed ? r.points : 0), 0);

        // Lưu kết quả
        localStorage.setItem('score_b1_s4',       total.toString());
        localStorage.setItem('sb3_last_results',  JSON.stringify(results));
        localStorage.setItem('scratch_b1_s4',     'done');
        localStorage.removeItem('moodle_synced_b1_s4'); // reset sync flag

        // Cập nhật UI
        infoBox.innerHTML = `
            <div class="sb3-file-row">
                <span class="sb3-file-icon">✅</span>
                <div><b>${file.name}</b><br><small>${(file.size/1024).toFixed(1)} KB · Đã phân tích xong</small></div>
            </div>`;

        setSb3ScoreUI(total, results);
        updateSb3SyncStatus('scored');
        checkAndRenderSteps();

    } catch(err) {
        console.error('Lỗi đọc sb3:', err);
        showSb3Error('❌ Không thể đọc file .sb3: ' + err.message);
        updateSb3SyncStatus('waiting');
    }
}

/** Chạy tất cả tiêu chí chấm điểm */
function gradeSb3(projectJson) {
    return SB3_CRITERIA.map(criterion => ({
        id:     criterion.id,
        label:  criterion.label,
        points: criterion.points,
        hint:   criterion.hint,
        passed: criterion.check(projectJson)
    }));
}

/** Cập nhật toàn bộ UI kết quả chấm */
function setSb3ScoreUI(total, results) {
    // Vòng điểm SVG
    const ring    = document.getElementById('sb3RingFill');
    const display = document.getElementById('sb3ScoreDisplay');
    const radius  = 50;
    const circum  = 2 * Math.PI * radius; // ≈ 314.16
    const offset  = circum - (total / 100) * circum;
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = total >= 80 ? '#4ade80' : total >= 50 ? '#fbbf24' : '#f87171';
    display.innerText = total;

    // Danh sách tiêu chí
    const list = document.getElementById('sb3CriteriaResult');
    list.innerHTML = results.map(r => `
        <div class="sb3-criteria-row ${r.passed ? 'passed' : 'failed'}">
            <span class="sb3-criteria-icon">${r.passed ? '✅' : '❌'}</span>
            <span class="sb3-criteria-label">${r.label.replace(/^[✅❌] /,'')}</span>
            <span class="sb3-criteria-pts">${r.passed ? '+'+r.points : '0'}đ</span>
        </div>
    `).join('');

    // Gợi ý sửa lỗi
    const failed = results.filter(r => !r.passed);
    const hintBox = document.getElementById('sb3HintBox');
    const hintContent = document.getElementById('sb3HintContent');
    if (failed.length > 0) {
        hintBox.style.display = 'block';
        hintContent.innerHTML = failed.map((r, i) => `
            <div class="sb3-hint-item">
                <b>${i+1}. ${r.label.replace(/^[✅❌] /,'').split('(')[0].trim()}</b><br>
                <span>👉 ${r.hint}</span>
            </div>
        `).join('');
    } else {
        hintBox.style.display = 'none';
    }

    // Bật nút gửi Moodle
    document.getElementById('sb3SubmitBtn').disabled = false;
}

/** Hiển thị lỗi trong khu vực chấm điểm */
function showSb3Error(msg) {
    document.getElementById('sb3CriteriaResult').innerHTML = `
        <div style="color:#f87171; text-align:center; padding:20px; font-size:14px;">${msg}</div>`;
}

/** Cập nhật nhãn trạng thái header */
function updateSb3SyncStatus(state) {
    const el = document.getElementById('sb3SyncStatus');
    if (!el) return;
    const states = {
        waiting:   { text:'⏳ Chờ nộp bài',            color:'#94a3b8' },
        analyzing: { text:'🔍 Đang phân tích .sb3...',  color:'#fbbf24' },
        scored:    { text:'📊 Đã chấm – chờ gửi Moodle',color:'#fbbf24' },
        syncing:   { text:'🌐 Đang gửi lên Moodle...',  color:'#60a5fa' },
        synced:    { text:'🟢 Đã đồng bộ Moodle!',      color:'#4ade80' },
        error:     { text:'🔴 Lỗi gửi – thử lại',       color:'#f87171' }
    };
    const s = states[state] || states.waiting;
    el.textContent  = s.text;
    el.style.color  = s.color;
}

/* ==============================================================
   GỬI ĐIỂM LÊN MOODLE QUA WEB SERVICES REST API
   
   Hàm core_grades_update_grades cần:
   - source      : tên ứng dụng (string tuỳ ý)
   - component   : 'manual' (điểm thủ công/ngoài)
   - activityid  : 0 (không gắn với activity cụ thể)
   - itemnumber  : 0
   - grades[0][userid]   : ID học sinh (lấy từ URL params)
   - grades[0][rawgrade] : điểm số (0-100)
   
   Lưu ý CORS: Moodle mặc định chặn request từ domain khác.
   Cần vào Site Admin → Security → HTTP Security → 
   "Allowed hosts" hoặc dùng proxy server nhỏ.
   Hướng dẫn đầy đủ: xem README trong repo
   ============================================================== */
async function submitToMoodle() {
    const score   = parseInt(localStorage.getItem('score_b1_s4') || '0');
    const userId  = getMoodleUserId();

    if (!userId) {
        showMoodleStatus('error', '⚠️ Không tìm thấy ID học sinh. Hãy đảm bảo truy cập từ Moodle LTI (URL có ?user_id=...).');
        return;
    }
    if (MOODLE_CONFIG.wsToken === 'PASTE_YOUR_MOODLE_WS_TOKEN_HERE') {
        showMoodleStatus('error', '⚙️ Chưa cấu hình MOODLE_CONFIG.wsToken trong script.js. Xem hướng dẫn ở đầu file.');
        return;
    }

    updateSb3SyncStatus('syncing');
    document.getElementById('sb3SubmitBtn').disabled = true;
    showMoodleStatus('loading', '🌐 Đang kết nối Moodle...');

    try {
        /* -------------------------------------------------------
           Gọi Moodle Web Services REST
           Endpoint: /webservice/rest/server.php
           Method: GET hoặc POST (dùng POST để tránh URL quá dài)
           ------------------------------------------------------- */
        const params = new URLSearchParams({
            wstoken:    MOODLE_CONFIG.wsToken,
            wsfunction: 'core_grades_update_grades',
            moodlewsrestformat: 'json',
            source:     'DinoTechScratch',
            component:  'manual',
            activityid: 0,
            itemnumber: 0,
            courseid:   MOODLE_CONFIG.courseId,
            // Tên grade item trong gradebook Moodle (phải trùng với MOODLE_CONFIG.itemName)
            itemname:   MOODLE_CONFIG.itemName,
            [`grades[0][userid]`]:   userId,
            [`grades[0][rawgrade]`]: score,
            [`grades[0][feedback]`]: buildFeedback(score)
        });

        const response = await fetch(
            `${MOODLE_CONFIG.baseUrl}/webservice/rest/server.php`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Moodle trả về null khi thành công, hoặc object có exception khi lỗi
        if (data && data.exception) throw new Error(data.message || data.exception);

        // Thành công!
        localStorage.setItem('moodle_synced_b1_s4', 'yes');
        localStorage.setItem('scratch_b1_s4', 'done');
        updateSb3SyncStatus('synced');
        showMoodleStatus('success', `✅ Điểm ${score}/100 đã được gửi thành công lên Moodle cho học sinh ID ${userId}!`);
        checkAndRenderSteps();
        showCustomAlert(`🎉 Xuất sắc! Điểm ${score}/100 đã tự động đồng bộ lên Moodle. Shin Bot ghi nhận nhiệm vụ hoàn thành!`);

    } catch(err) {
        console.error('Lỗi gửi Moodle:', err);
        updateSb3SyncStatus('error');
        document.getElementById('sb3SubmitBtn').disabled = false;
        showMoodleStatus('error',
            `❌ Lỗi: ${err.message}. <br><small>Kiểm tra: token đúng chưa? Moodle có bật CORS chưa? Xem console để biết thêm.</small>`);
    }
}

/** Lấy Moodle user ID từ URL param hoặc localStorage */
function getMoodleUserId() {
    // Khi nhúng làm LTI content, Moodle thêm ?user_id=xxx vào URL
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl   = urlParams.get('user_id') || urlParams.get('userid');
    if (fromUrl) {
        localStorage.setItem('moodle_user_id', fromUrl); // cache lại
        return fromUrl;
    }
    // Nếu đã lưu trước đó
    return localStorage.getItem('moodle_user_id') || null;
}

/** Tạo feedback text tự động dựa trên điểm */
function buildFeedback(score) {
    const results = JSON.parse(localStorage.getItem('sb3_last_results') || '[]');
    const passed  = results.filter(r => r.passed).map(r => r.label.replace(/^[✅❌] /,'').split('(')[0].trim());
    const failed  = results.filter(r => !r.passed).map(r => r.label.replace(/^[✅❌] /,'').split('(')[0].trim());
    let fb = `Điểm tự động từ DinoTech Scratch Grader: ${score}/100. `;
    if (passed.length) fb += `Đạt: ${passed.join(', ')}. `;
    if (failed.length) fb += `Cần cải thiện: ${failed.join(', ')}.`;
    return fb;
}

/** Hiển thị trạng thái gửi Moodle */
function showMoodleStatus(type, msg) {
    const el = document.getElementById('sb3MoodleStatus');
    el.style.display = 'block';
    el.className = 'sb3-moodle-status sb3-moodle-' + type;
    el.innerHTML = msg;
}

/* ==============================================================
   CHATBOT SHIN (KÉO THẢ) + FULLSCREEN
   ============================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const botContainer = document.getElementById('chatbotContainer');
    const shinBtn      = document.getElementById('shinBotBtn');
    const chatFrame    = document.getElementById('aiChatFrame');
    const tooltip      = document.getElementById('shinTooltip');
    const spaceWrapper = document.querySelector('.space-course-wrapper');
    if (!botContainer || !shinBtn) return;

    let isDragging = false, hasDragged = false, startX, startY, initialLeft, initialTop;

    function startDrag(e) {
        if (!e.target.closest('#shinBotBtn')) return;
        isDragging = true; hasDragged = false;
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        startX = clientX; startY = clientY;
        const rect        = botContainer.getBoundingClientRect();
        const wrapperRect = spaceWrapper.getBoundingClientRect();
        initialLeft = rect.left - wrapperRect.left;
        initialTop  = rect.top  - wrapperRect.top;
        botContainer.style.right  = 'auto';
        botContainer.style.bottom = 'auto';
        botContainer.style.left   = initialLeft + 'px';
        botContainer.style.top    = initialTop  + 'px';
        if (e.type.includes('mouse')) e.preventDefault();
    }

    function doDrag(e) {
        if (!isDragging) return;
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const dx = clientX - startX, dy = clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged = true;
        botContainer.style.left = (initialLeft + dx) + 'px';
        botContainer.style.top  = (initialTop  + dy) + 'px';
    }

    botContainer.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', () => isDragging = false);
    botContainer.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', doDrag, { passive: false });
    document.addEventListener('touchend', () => isDragging = false);

    shinBtn.addEventListener('click', function(e) {
        if (hasDragged) { e.preventDefault(); return; }
        if (chatFrame.style.display === 'none' || chatFrame.style.display === '') {
            chatFrame.style.display = 'block';
            tooltip.style.display  = 'none';
        } else {
            chatFrame.style.display = 'none';
        }
    });
});

function goFullScreen() {
    const el = document.querySelector(".space-course-wrapper");
    if      (el.requestFullscreen)       el.requestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen)     el.msRequestFullscreen();
}
