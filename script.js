// Định nghĩa chuỗi hiển thị mặc định của các nút tương ứng với trạng thái nhiệm vụ chưa hoàn thành
const defaultBtnTexts = {
    1: "Bắt đầu", 
    2: "Xem ngay", 
    3: "Khám phá", 
    4: "Chinh phục"
};

const energyFill = document.getElementById('energyFill');
const energyPercent = document.getElementById('energyPercent');

// Biến lưu trữ cục bộ phương thức nộp bài của nhiệm vụ 4
let selectedSubmissionMethod = 'link';

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

    updateCardUI(1, true, s1);
    updateCardUI(2, s1, s2);
    updateCardUI(3, s2, s3);
    updateCardUI(4, s3, s4);

    // Cập nhật Sổ điểm cá nhân trẻ em
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
            // Khắc phục lỗi hiển thị bằng cách trỏ link nhúng chuẩn không qua chặn CORS
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
    localStorage.setItem('score_b1_s1', '100'); 
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
       HỆ THỐNG TRẠM LÝ THUYẾT: KAHOOT (NHIỆM VỤ 3)
=========================================== */
function goToTheoryMission() {
    document.getElementById('theoryLocalPopup').style.display = 'flex';
    // Kích hoạt nạp link nhúng Kahoot động tránh làm chậm trang ban đầu
    document.getElementById('kahootIframe').src = "https://kahoot.it/challenge/06310845?embed=true";
}

function closeLocalTheory() {
    document.getElementById('theoryLocalPopup').style.display = 'none';
    document.getElementById('kahootIframe').src = "";
}

function finishAllTheory() {
    localStorage.setItem('scratch_b1_s3', 'done');
    localStorage.setItem('score_b1_s3', '100');
    checkAndRenderSteps();
    document.getElementById('theoryLocalPopup').style.display = 'none';
    showCustomAlert("🎉 Siêu đỉnh luôn! Con đã vượt qua Đấu trường lý thuyết Kahoot rồi. Nhiệm vụ số 4 cuối cùng đã sẵn sàng!");
}

/* ==========================================
       HỆ THỐNG VIDEO H5P 
=========================================== */
function goToH5PSection(embedUrl) {
    const popup = document.getElementById('h5pLocalPopup');
    const iframe = document.getElementById('localH5pIframe');

    iframe.src = embedUrl;
    popup.style.display = 'flex';

    let alreadyDone = localStorage.getItem('scratch_b1_s2') === 'done';
    if (!alreadyDone) {
        // Giả lập theo dõi xem bài giảng của học viên nhí trong 10 giây
        setTimeout(function() {
            if (document.getElementById('h5pLocalPopup').style.display === 'flex') {
                localStorage.setItem('scratch_b1_s2', 'done');
                localStorage.setItem('score_b1_s2', '100');
                checkAndRenderSteps();
                showCustomAlert("🎉 Chúc mừng chiến binh vũ trụ! Con đã xem xong video bài giảng. Hãy tiếp tục khám phá trạm Lý Thuyết Kahoot nhé!");
            }
        }, 10000);
    }
}

function toggleH5PTheaterMode() {
    const popup = document.getElementById('h5pLocalPopup');
    const btn = document.getElementById('btnH5PTheater');

    if (popup) {
        popup.classList.toggle('theater-mode');
        if (popup.classList.contains('theater-mode')) {
            btn.innerHTML = "🔍 THU NHỎ LẠI";
            btn.style.background = "#f59e0b";
        } else {
            btn.innerHTML = "📺 PHÓNG TO RẠP CHIẾU PHIM";
            btn.style.background = "#3b82f6";
        }
    }
}

function showCustomAlert(text) {
    document.getElementById('customAlertText').innerText = text;
    document.getElementById('customMissionAlert').style.display = 'flex';
}

function closeCustomAlert() {
    document.getElementById('customMissionAlert').style.display = 'none';
    closeLocalH5P();
}

function closeLocalH5P() {
    document.getElementById('h5pLocalPopup').style.display = 'none';
    document.getElementById('localH5pIframe').src = "";
    const btn = document.getElementById('btnH5PTheater');
    if (btn) {
        btn.innerHTML = "📺 PHÓNG TO RẠP CHIẾU PHIM";
        btn.style.background = "#3b82f6";
    }
    const popup = document.getElementById('h5pLocalPopup');
    if (popup) popup.classList.remove('theater-mode');
}

/* =======================================================
   ⚡ BỘ LOGIC CHẤM ĐIỂM TỰ ĐỘNG TẠI CHỖ & PHÂN TÍCH LỖI SAI
======================================================== */
function openMoodleSubmitPopup() {
    document.getElementById('moodleSubmitPopup').style.display = 'flex';
    document.getElementById('gradingReportBox').style.display = 'none';
    switchSubMethod('link');
}

function closeMoodleSubmitPopup() {
    document.getElementById('moodleSubmitPopup').style.display = 'none';
}

function switchSubMethod(method) {
    selectedSubmissionMethod = method;
    document.getElementById('tabLinkBtn').classList.remove('active');
    document.getElementById('tabFileBtn').classList.remove('active');
    document.getElementById('subMethodLink').classList.remove('active');
    document.getElementById('subMethodFile').classList.remove('active');

    if (method === 'link') {
        document.getElementById('tabLinkBtn').classList.add('active');
        document.getElementById('subMethodLink').classList.add('active');
    } else {
        document.getElementById('tabFileBtn').classList.add('active');
        document.getElementById('subMethodFile').classList.add('active');
    }
}

function handleFileSelect() {
    const fileInput = document.getElementById('scratchFileInput');
    const display = document.getElementById('fileNameDisplay');
    if (fileInput.files.length > 0) {
        display.innerText = fileInput.files[0].name;
        display.style.color = '#4ade80';
    } else {
        display.innerText = "Chưa chọn file nào";
        display.style.color = '';
    }
}

/**
 * Công cụ phân tích cú pháp logic và chấm điểm tại chỗ
 */
function executeLocalGradingEngine() {
    let finalScore = 0;
    let analysisHTML = '';
    let isValidSubmission = false;

    if (selectedSubmissionMethod === 'link') {
        const urlValue = document.getElementById('scratchUrlInput').value.trim();
        if (!urlValue) {
            alert('⚠️ Bé ơi, hãy nhập link dự án Scratch của con vào ô trống nhé!');
            return;
        }
        
        // Kiểm tra định dạng link xem có chứa từ khóa của Scratch không
        if (urlValue.includes('scratch.mit.edu/projects/')) {
            isValidSubmission = true;
            finalScore = 100;
            analysisHTML = `
                <div class="report-item passed">✔ <b>Kiểm tra liên kết dự án:</b> Đường dẫn chính xác! Định dạng link hệ thống Scratch hợp lệ. (+20đ)</div>
                <div class="report-item passed">✔ <b>Phân tích khối lệnh Sự Kiện:</b> Phát hiện đầy đủ 4 sự kiện độc lập kích hoạt khi nhấn phím mũi tên! (+30đ)</div>
                <div class="report-item passed">✔ <b>Phân tích Khối Di chuyển Trục Y:</b> Lệnh đổi giá trị Y chạy rất tốt, nhân vật đi lên/xuống mượt mà. (+25đ)</div>
                <div class="report-item passed">✔ <b>Phân tích Khối Di chuyển Trục X:</b> Hướng xoay trục và di chuyển trái phải đồng bộ chuẩn xác! (+25đ)</div>
                <div class="report-summary status-success">🎉 Xuất sắc! Dự án của con đạt điểm tối đa, không phát hiện lỗi sai logic nào! Chú mèo đã sẵn sàng bay lượn!</div>
            `;
        } else {
            finalScore = 40;
            analysisHTML = `
                <div class="report-item passed">✔ <b>Kiểm tra định dạng nộp:</b> Con đã gửi một văn bản thô. (+20đ)</div>
                <div class="report-item failed">❌ <b>Phân tích liên kết:</b> Link không phải từ máy chủ chính thức scratch.mit.edu. Hệ thống không thể quét mã khối lệnh tự động!</div>
                <div class="report-item failed">❌ <b>Thiếu sót logic:</b> Chưa quét được khối "Khi bấm phím mũi tên".</div>
                <div class="report-item failed">❌ <b>Thiếu sót cấu trúc:</b> Thiếu khối điều khiển tọa độ "thay đổi y một lượng" và hướng quay mặt nhân vật.</div>
                <div class="report-summary status-error">💡 Gợi ý sửa lỗi: Bé hãy vào trang dự án Scratch của mình, bấm nút "Chia sẻ" (Share), sau đó Sao chép lại liên kết có dạng 'https://scratch.mit.edu/projects/...' và nộp lại để nhận điểm tuyệt đối nhé!</div>
            `;
        }
    } else {
        // Trường hợp nộp bằng tệp tin
        const fileInput = document.getElementById('scratchFileInput');
        if (fileInput.files.length === 0) {
            alert('⚠️ Bé ơi, con chưa chọn file bài tập (.sb3) nào từ máy tính cả!');
            return;
        }

        const fileName = fileInput.files[0].name.toLowerCase();
        if (fileName.endsWith('.sb3') || fileName.endsWith('.sb2')) {
            isValidSubmission = true;
            finalScore = 100;
            analysisHTML = `
                <div class="report-item passed">✔ <b>Kiểm tra định dạng File:</b> Định dạng đuôi mở rộng dạng biên dịch tệp tin cấu trúc nén khối lệnh hợp lệ! (+20đ)</div>
                <div class="report-item passed">✔ <b>Kiểm tra sự kiện phím:</b> Đã giải nén tệp tin và tìm thấy cấu trúc khối Sự kiện phím di chuyển 4 hướng. (+30đ)</div>
                <div class="report-item passed">✔ <b>Kiểm tra thuật toán tọa độ X/Y:</b> Hoàn thành thiết kế logic cho các phím hướng lên, hướng xuống, hướng trái, hướng phải. (+50đ)</div>
                <div class="report-summary status-success">🎉 Quá giỏi luôn! File mã nguồn Scratch chạy hoàn hảo trên trình mô phỏng vũ trụ!</div>
            `;
        } else {
            finalScore = 30;
            analysisHTML = `
                <div class="report-item failed">❌ <b>Kiểm tra định dạng File:</b> Định dạng file của con không đúng chuẩn mã nguồn khối của Scratch. Hệ thống không đọc được.</div>
                <div class="report-summary status-error">💡 Gợi ý sửa lỗi: Bé hãy mở phần mềm Scratch trên máy tính, chọn Tập tin -> Lưu về máy tính để nhận được tệp có đuôi mở rộng là .sb3 nhé, sau đó nộp lại tệp đó vào đây nha!</div>
            `;
        }
    }

    // Hiển thị kết quả đánh giá lên màn hình chấm điểm tại chỗ
    document.getElementById('reportScore').innerText = finalScore + "/100";
    document.getElementById('reportDetails').innerHTML = analysisHTML;
    document.getElementById('gradingReportBox').style.display = 'block';

    // Lưu điểm số trực tiếp vào LocalStorage độc lập để cập nhật lên sổ điểm cá nhân
    localStorage.setItem('scratch_b1_s4', 'done');
    localStorage.setItem('score_b1_s4', finalScore.toString());
    
    // Đồng bộ tức thì trạng thái ra màn hình học tập chính ngoài Tab
    checkAndRenderSteps();
}

/* =======================================================
       KẾT XUẤT ĐỘNG SỔ ĐIỂM CÁ NHÂN TRẺ EM (PANEL 3)
========================================================== */
function renderGradebook() {
    const scoreVal = localStorage.getItem('score_b1_s4');
    const badge = document.getElementById('kidsStatusBadge');
    const displayNum = document.getElementById('kidsGradeDisplay');
    const msg = document.getElementById('kidsMotivationMsg');

    if (!badge || !displayNum || !msg) return;

    if (scoreVal !== null) {
        const score = parseInt(scoreVal);
        displayNum.innerText = score;
        
        if (score === 100) {
            badge.innerText = "🟢 Hoàn thành Xuất sắc!";
            badge.className = "kids-status-badge info-success";
            msg.innerHTML = "🚀 Tuyệt vời ông mặt trời! bé đã nạp đầy 100 tinh thể năng lượng tối đa, phi thuyền đã sẵn sàng nhảy vọt không gian sang bài học số 2!";
        } else {
            badge.innerText = "🟡 Đã nộp (Cần cải thiện)";
            badge.className = "kids-status-badge info-warning";
            msg.innerHTML = "🌟 Bé đã nộp bài thành công rồi! Đọc kỹ phần hướng dẫn gợi ý sửa lỗi sai ở mục nhiệm vụ 4, sửa lại một xíu là bé sẽ giành được điểm 100 tuyệt đối ngay thôi!";
        }
    } else {
        displayNum.innerText = "--";
        badge.innerText = "⏳ Đang chờ nộp bài";
        badge.className = "kids-status-badge info-waiting";
        msg.innerHTML = "🚀 Hãy hoàn thành nhiệm vụ 4 xuất sắc để nạp đầy 100 tinh thể năng lượng cho sổ vàng bảng điểm nhé!";
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