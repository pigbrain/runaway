const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('time');
const joystick = document.getElementById('joystick');
const stick = document.getElementById('stick');

// 캔버스 크기 설정 및 반응형 조정
function resizeCanvas() {
    const maxWidth = Math.min(800, window.innerWidth - 20);
    const maxHeight = Math.min(600, window.innerHeight - 100);
    const scale = Math.min(maxWidth / 800, maxHeight / 600);
    
    canvas.style.width = (800 * scale) + 'px';
    canvas.style.height = (600 * scale) + 'px';
    canvas.width = 800;
    canvas.height = 600;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 게임 상태
let gameOver = false;
let startTime = Date.now();
let elapsedTime = 0;

// 조이스틱 상태
let joystickActive = false;
let joystickAngle = 0;
let joystickDistance = 0;

// 플레이어 설정
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 10,
    speed: 4
};

// 강아지 배열
let dogs = [];

// 키보드 입력 처리
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// 터치 이벤트 처리
function handleTouch(e) {
    const touch = e.touches[0];
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    joystickAngle = Math.atan2(dy, dx);
    joystickDistance = Math.min(50, Math.sqrt(dx * dx + dy * dy));
    
    const stickX = Math.cos(joystickAngle) * joystickDistance;
    const stickY = Math.sin(joystickAngle) * joystickDistance;
    
    stick.style.transform = `translate(${stickX}px, ${stickY}px)`;
}

function resetJoystick() {
    joystickActive = false;
    joystickAngle = 0;
    joystickDistance = 0;
    stick.style.transform = 'translate(0px, 0px)';
}

joystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    handleTouch(e);
});

joystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joystickActive) {
        handleTouch(e);
    }
});

joystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    resetJoystick();
});

// 강아지 생성 함수
function createDog() {
    const side = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
    let x, y;
    
    switch(side) {
        case 0: // 위
            x = Math.random() * canvas.width;
            y = -20;
            break;
        case 1: // 오른쪽
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
            break;
        case 2: // 아래
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
            break;
        case 3: // 왼쪽
            x = -20;
            y = Math.random() * canvas.height;
            break;
    }

    return {
        x: x,
        y: y,
        size: 10,
        speed: 4.2
    };
}

// 게임 초기화 함수
function resetGame() {
    gameOver = false;
    startTime = Date.now();
    elapsedTime = 0;
    dogs = [];
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}

// 클릭/터치 이벤트 처리
canvas.addEventListener('click', (e) => {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        const clickX = (e.clientX - rect.left) * scale;
        const clickY = (e.clientY - rect.top) * scale;
        
        // 다시하기 버튼 영역 확인
        const buttonX = canvas.width / 2 - 50;
        const buttonY = canvas.height / 2 + 60;
        if (clickX >= buttonX && clickX <= buttonX + 100 &&
            clickY >= buttonY && clickY <= buttonY + 30) {
            resetGame();
        }
    }
});

// 게임 업데이트
function update() {
    if (gameOver) return;

    // 플레이어 이동 (키보드)
    if (keys['ArrowUp']) player.y -= player.speed;
    if (keys['ArrowDown']) player.y += player.speed;
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // 플레이어 이동 (조이스틱)
    if (joystickActive && joystickDistance > 0) {
        const moveX = Math.cos(joystickAngle) * (joystickDistance / 50) * player.speed;
        const moveY = Math.sin(joystickAngle) * (joystickDistance / 50) * player.speed;
        player.x += moveX;
        player.y += moveY;
    }

    // 플레이어를 화면 안에 가두기
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

    // 강아지 이동 및 충돌 처리
    dogs.forEach(dog => {
        const dx = player.x - dog.x;
        const dy = player.y - dog.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 랜덤한 움직임 추가
        const randomX = (Math.random() - 0.5) * 2;
        const randomY = (Math.random() - 0.5) * 2;
        
        dog.x += ((dx / distance) * dog.speed) + randomX;
        dog.y += ((dy / distance) * dog.speed) + randomY;

        // 충돌 검사
        if (distance < player.size + dog.size) {
            gameOver = true;
        }
    });

    // 시간에 따라 강아지 추가 (3초마다)
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    if (elapsedTime % 2 === 0 && elapsedTime !== 0) {
        if (dogs.length < Math.floor(elapsedTime / 2) + 1) {
            dogs.push(createDog());
        }
    }

    timeDisplay.textContent = elapsedTime;
}

// 게임 렌더링
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 플레이어 그리기
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // 강아지 그리기
    ctx.fillStyle = '#e74c3c';
    dogs.forEach(dog => {
        ctx.beginPath();
        ctx.arc(dog.x, dog.y, dog.size, 0, Math.PI * 2);
        ctx.fill();
    });

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`Survived for ${elapsedTime} seconds`, canvas.width / 2, canvas.height / 2 + 40);
        
        // 다시하기 버튼 그리기
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 + 60, 100, 30);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('다시하기', canvas.width / 2, canvas.height / 2 + 80);
    }
}

// 게임 루프
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
gameLoop();