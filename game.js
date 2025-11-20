// --- Configuración Inicial ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar el tamaño del canvas a la ventana
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Constantes del juego
const TILE_SIZE = 32;
const GRAVITY = 0.5;
const PLAYER_SPEED = 5;
const JUMP_FORCE = 12;
const PLAYER_REACH = 5 * TILE_SIZE;

// Tipos de bloques
const TILE_TYPES = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
};

const TILE_COLORS = {
    [TILE_TYPES.GRASS]: '#2ecc71',
    [TILE_TYPES.DIRT]: '#95a5a6',
    [TILE_TYPES.STONE]: '#7f8c8d',
};

// --- Mundo del Juego ---
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 50;
let world = [];

function createWorld() {
    world = Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill(TILE_TYPES.AIR));
    for (let x = 0; x < WORLD_WIDTH; x++) {
        const groundHeight = 30 + Math.floor(Math.sin(x * 0.1) * 5);
        for (let y = groundHeight; y < WORLD_HEIGHT; y++) {
            if (y === groundHeight) world[y][x] = TILE_TYPES.GRASS;
            else if (y < groundHeight + 5) world[y][x] = TILE_TYPES.DIRT;
            else world[y][x] = TILE_TYPES.STONE;
        }
    }
}

// --- Jugador y Modos ---
const player = {
    x: WORLD_WIDTH * TILE_SIZE / 2,
    y: 25 * TILE_SIZE,
    width: TILE_SIZE * 0.8,
    height: TILE_SIZE * 1.8,
    dx: 0, dy: 0,
    onGround: false,
    currentMode: 'combat', // 'combat' o 'build'
};

// --- Proyectiles ---
let projectiles = [];
const PROJECTILE_SPEED = 15;
const PROJECTILE_SIZE = 5;
const PROJECTILE_LIFESPAN = 60; // 1 segundo

// --- Controles ---
const keys = { left: false, right: false, up: false };

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.up = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
    if (e.key === 'e') { // Tecla 'E' para cambiar de modo
        player.currentMode = player.currentMode === 'combat' ? 'build' : 'combat';
    }
});

// --- Interacción con el Mouse ---


canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (e.button === 0) { // Clic izquierdo
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = mouseX + camera.x;
        const worldY = mouseY + camera.y;

        if (player.currentMode === 'combat') {
            shoot(worldX, worldY);
        } else { // 'build'
            placeTile(worldX, worldY);
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Clic derecho para romper
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    breakTile(mouseX + camera.x, mouseY + camera.y);
});

function breakTile(worldX, worldY) {
    const tileCoords = getTileCoordinates(worldX, worldY);
    if (!tileCoords) return;
    const { tileX, tileY, distance } = tileCoords;

    if (distance <= PLAYER_REACH && world[tileY][tileX] !== TILE_TYPES.AIR) {
        world[tileY][tileX] = TILE_TYPES.AIR;
    }
}

function placeTile(worldX, worldY) {
    const tileCoords = getTileCoordinates(worldX, worldY);
    if (!tileCoords) return;
    const { tileX, tileY, distance } = tileCoords;

    if (distance > PLAYER_REACH || world[tileY][tileX] !== TILE_TYPES.AIR) return;

    const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
    const tileRect = { x: tileX * TILE_SIZE, y: tileY * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
    if (isColliding(playerRect, tileRect)) return;

    world[tileY][tileX] = TILE_TYPES.DIRT;
}

function shoot(worldX, worldY) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    const angle = Math.atan2(worldY - playerCenterY, worldX - playerCenterX);

    projectiles.push({
        x: playerCenterX,
        y: playerCenterY,
        dx: Math.cos(angle) * PROJECTILE_SPEED,
        dy: Math.sin(angle) * PROJECTILE_SPEED,
        life: PROJECTILE_LIFESPAN,
    });
}

// --- Funciones de Utilidad ---
function getTileCoordinates(worldX, worldY) {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return null;

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const distance = Math.sqrt(Math.pow(playerCenterX - worldX, 2) + Math.pow(playerCenterY - worldY, 2));

    return { tileX, tileY, distance };
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- Cámara ---
const camera = { x: 0, y: 0 };
function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
    if (camera.x + canvas.width > WORLD_WIDTH * TILE_SIZE) camera.x = WORLD_WIDTH * TILE_SIZE - canvas.width;
    if (camera.y + canvas.height > WORLD_HEIGHT * TILE_SIZE) camera.y = WORLD_HEIGHT * TILE_SIZE - canvas.height;
}

// --- Bucle del Juego ---
function update() {
    // Movimiento del jugador
    player.dx = (keys.left ? -PLAYER_SPEED : (keys.right ? PLAYER_SPEED : 0));
    if (keys.up && player.onGround) {
        player.dy = -JUMP_FORCE;
        player.onGround = false;
    }
    player.dy += GRAVITY;

    // Colisiones del jugador
    player.y += player.dy;
    handlePlayerCollision('y');
    player.x += player.dx;
    handlePlayerCollision('x');

    // Actualizar proyectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        const tileX = Math.floor(p.x / TILE_SIZE);
        const tileY = Math.floor(p.y / TILE_SIZE);

        if (p.life <= 0 || world[tileY]?.[tileX] !== TILE_TYPES.AIR) {
            projectiles.splice(i, 1);
        }
    }
    
    updateCamera();
}

function handlePlayerCollision(axis) {
    const left = Math.floor(player.x / TILE_SIZE);
    const right = Math.floor((player.x + player.width) / TILE_SIZE);
    const top = Math.floor(player.y / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height) / TILE_SIZE);

    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
            const tile = world[y]?.[x];
            if (tile !== TILE_TYPES.AIR) {
                const tileRect = { x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
                if (isColliding(player, tileRect)) {
                    if (axis === 'y') {
                        if (player.dy > 0) {
                            player.y = tileRect.y - player.height;
                            player.onGround = true;
                        } else {
                            player.y = tileRect.y + tileRect.height;
                        }
                        player.dy = 0;
                    } else { // axis 'x'
                        if (player.dx > 0) player.x = tileRect.x - player.width;
                        else player.x = tileRect.x + tileRect.width;
                    }
                }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Dibujar mundo
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = startCol + Math.ceil(canvas.width / TILE_SIZE) + 1;
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = startRow + Math.ceil(canvas.height / TILE_SIZE) + 1;

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            const tile = world[y]?.[x];
            if (tile !== TILE_TYPES.AIR) {
                ctx.fillStyle = TILE_COLORS[tile];
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Dibujar jugador
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Dibujar proyectiles
    ctx.fillStyle = '#f1c40f';
    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, PROJECTILE_SIZE, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();

    // --- Dibujar UI (fija) ---
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const modeText = `Modo: ${player.currentMode === 'combat' ? 'Combate' : 'Construir'} (Tecla 'E')`;
    ctx.fillText(modeText, 10, canvas.height - 10);
}

// --- Iniciar el Juego ---
createWorld();
requestAnimationFrame(function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateCamera();
});
