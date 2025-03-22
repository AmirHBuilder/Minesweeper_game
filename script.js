let boardSize, mineCount;
let board = [];
let gameOver = false;
let timerInterval;
let startTime;
let currentRecord = localStorage.getItem("minesweeper-record") || null;
let isFirstClick = true; // برای شروع تایمر پس از اولین کلیک

const languageTexts = {
    fa: {
        title: "مین‌روب - AmirHBuilder",
        easy: "آسان",
        medium: "متوسط",
        hard: "سخت",
        reset: "بازی مجدد",
        guideTitle: "راهنمای بازی",
        guideText: `
            - هدف بازی این است که همه خانه‌های بدون مین را باز کنید.<br><br>
            - اگر روی یک مین کلیک کنید، بازی را می‌بازید.<br><br>
            - اعداد روی خانه‌ها نشان‌دهنده تعداد مین‌های اطراف آن خانه هستند.<br><br>
            - برای شروع بازی، دکمه "تأیید" را بزنید.
        `,
        confirm: "تأیید",
        lose: "باختی! بازی تمام شد.",
        win: "تبریک! شما برنده شدید.",
        timer: "زمان: ",
        record: "رکورد: ",
        noRecord: "-"
    },
    en: {
        title: "Minesweeper - AmirHBuilder",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        reset: "Reset Game",
        guideTitle: "Game Guide",
        guideText: `
            - The goal is to reveal all non-mine cells.<br><br>
            - If you click on a mine, you lose.<br><br>
            - Numbers indicate how many mines are adjacent to a cell.<br><br>
            - Click "Confirm" to start the game.
        `,
        confirm: "Confirm",
        lose: "You lost! Game over.",
        win: "Congratulations! You won.",
        timer: "Time: ",
        record: "Record: ",
        noRecord: "-"
    }
};

let currentLanguage = "fa";

// تنظیمات اولیه بازی
function setDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    if (difficulty === "easy") {
        boardSize = 8;
        mineCount = 10;
    } else if (difficulty === "medium") {
        boardSize = 10;
        mineCount = 20;
    } else if (difficulty === "hard") {
        boardSize = 12;
        mineCount = 30;
    }
}

// شروع بازی
function startGame() {
    gameOver = false;
    isFirstClick = true; // ریست متغیر اولین کلیک
    document.getElementById('message').textContent = '';
    setDifficulty();
    createBoard();
    document.getElementById('guideModal').style.display = 'none'; // مخفی کردن کادر راهنما
    document.getElementById('board').style.display = 'grid'; // نمایش صفحه بازی
}

// ایجاد صفحه بازی
function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 40px)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, 40px)`;
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));

    // قرار دادن مین‌ها به صورت تصادفی
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        if (board[row][col] !== 'M') {
            board[row][col] = 'M';
            minesPlaced++;
        }
    }

    // محاسبه تعداد مین‌های اطراف هر خانه
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === 'M') continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && board[newRow][newCol] === 'M') {
                        count++;
                    }
                }
            }
            board[row][col] = count;
        }
    }

    // ایجاد خانه‌ها در صفحه
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => revealCell(row, col));
            boardElement.appendChild(cell);
        }
    }
}

// آشکار کردن خانه
function revealCell(row, col) {
    if (gameOver) return;
    const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    if (cell.classList.contains('revealed')) return;

    // شروع تایمر پس از اولین کلیک
    if (isFirstClick) {
        startTimer();
        isFirstClick = false;
    }

    cell.classList.add('revealed');
    if (board[row][col] === 'M') {
        cell.textContent = '💣';
        cell.classList.add('mine');
        gameOver = true;
        document.getElementById('message').textContent = languageTexts[currentLanguage].lose;
        revealAllMines();
        stopTimer();
    } else {
        cell.textContent = board[row][col] || '';
        if (board[row][col] === 0) {
            // اگر خانه خالی بود، خانه‌های اطراف را نیز آشکار کن
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                        revealCell(newRow, newCol);
                    }
                }
            }
        }
        checkWin(); // بررسی برنده شدن
    }
}

// بررسی برنده شدن
function checkWin() {
    let revealedCells = 0;
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] !== 'M' && document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`).classList.contains('revealed')) {
                revealedCells++;
            }
        }
    }
    if (revealedCells === (boardSize * boardSize - mineCount)) {
        gameOver = true;
        document.getElementById('message').textContent = languageTexts[currentLanguage].win;
        stopTimer();
    }
}

// آشکار کردن همه مین‌ها در صورت باخت
function revealAllMines() {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === 'M') {
                const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
                cell.textContent = '💣';
                cell.classList.add('mine');
            }
        }
    }
}

// بازنشانی بازی
function resetGame() {
    gameOver = false;
    isFirstClick = true;
    document.getElementById('message').textContent = '';
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = `${languageTexts[currentLanguage].timer}0 ثانیه`;
    document.getElementById('record').textContent = `${languageTexts[currentLanguage].record}${currentRecord || languageTexts[currentLanguage].noRecord}`;
    startGame(); // شروع مجدد بازی
}

// شروع تایمر
function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

// بروزرسانی تایمر
function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = `${languageTexts[currentLanguage].timer}${elapsedTime} ثانیه`;
}

// توقف تایمر و ثبت رکورد
function stopTimer() {
    clearInterval(timerInterval);
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    if (!currentRecord || elapsedTime < currentRecord) {
        currentRecord = elapsedTime;
        localStorage.setItem("minesweeper-record", currentRecord); // ذخیره رکورد در localStorage
        document.getElementById('record').textContent = `${languageTexts[currentLanguage].record}${currentRecord} ثانیه`;
    }
}

// تغییر زبان
document.getElementById('language').addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    updateLanguage();
    document.body.dir = currentLanguage === 'fa' ? 'rtl' : 'ltr';
});

// به‌روزرسانی زبان
function updateLanguage() {
    const texts = languageTexts[currentLanguage];
    document.getElementById('gameTitle').textContent = texts.title;
    document.getElementById('difficulty').innerHTML = `
        <option value="easy">${texts.easy}</option>
        <option value="medium">${texts.medium}</option>
        <option value="hard">${texts.hard}</option>
    `;
    document.getElementById('resetButton').textContent = texts.reset;
    document.getElementById('guideTitle').textContent = texts.guideTitle;
    document.getElementById('guideText').innerHTML = texts.guideText;
    document.getElementById('confirmButton').textContent = texts.confirm;
    document.getElementById('timer').textContent = `${texts.timer}0 ثانیه`;
    document.getElementById('record').textContent = `${texts.record}${currentRecord || texts.noRecord}`;
}

// تغییر سطح دشواری و ریست خودکار بازی
document.getElementById('difficulty').addEventListener('change', () => {
    setDifficulty();
    resetGame();
});

// نمایش کادر راهنما
document.getElementById('confirmButton').addEventListener('click', startGame);

// اتصال تابع resetGame به دکمه "بازی مجدد"
document.getElementById('resetButton').addEventListener('click', resetGame);

// شروع اولیه بازی
updateLanguage();
document.getElementById('guideModal').style.display = 'flex'; // نمایش کادر راهنما در ابتدا