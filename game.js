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
        // Altura del terreno
        const groundHeight = 30 + Math.floor(Math.sin(x * 0.1) * 5);
        for (let y = groundHeight; y < WORLD_HEIGHT; y++) {
            if (y === groundHeight) {
                world[y][x] = TILE_TYPES.GRASS;
            } else if (y < groundHeight + 5) {
                world[y][x] = TILE_TYPES.DIRT;
            } else {
                world[y][x] = TILE_TYPES.STONE;
            }
        }
    }
}

// --- Jugador ---
const player = {
    x: WORLD_WIDTH * TILE_SIZE / 2,
    y: 25 * TILE_SIZE,
    width: TILE_SIZE * 0.8,
    height: TILE_SIZE * 1.8,
    dx: 0, // velocidad en x
    dy: 0, // velocidad en y
    onGround: false,
};

// --- Controles ---
const keys = {
    left: false,
    right: false,
    up: false,
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.up = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
});

// --- Cámara ---
const camera = {
    x: 0,
    y: 0,
};

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // Limitar la cámara a los bordes del mundo
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
    if (camera.x + canvas.width > WORLD_WIDTH * TILE_SIZE) {
        camera.x = WORLD_WIDTH * TILE_SIZE - canvas.width;
    }
    if (camera.y + canvas.height > WORLD_HEIGHT * TILE_SIZE) {
        camera.y = WORLD_HEIGHT * TILE_SIZE - canvas.height;
    }
}


// --- Bucle del Juego ---
function update() {
    // Movimiento del jugador
    player.dx = 0;
    if (keys.left) player.dx = -PLAYER_SPEED;
    if (keys.right) player.dx = PLAYER_SPEED;
    if (keys.up && player.onGround) {
        player.dy = -JUMP_FORCE;
        player.onGround = false;
    }

    // Aplicar gravedad
    player.dy += GRAVITY;

    // Colisiones y movimiento
    handleCollisions();
    
    // Actualizar cámara
    updateCamera();
}

function handleCollisions() {
    player.onGround = false;

    // Colisión en X
    player.x += player.dx;
    let playerCol = Math.floor(player.x / TILE_SIZE);
    let playerRow = Math.floor(player.y / TILE_SIZE);
    
    // Colisión en Y
    player.y += player.dy;
    playerCol = Math.floor(player.x / TILE_SIZE);
    playerRow = Math.floor(player.y / TILE_SIZE);

    // Iterar sobre los bloques cercanos al jugador
    for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
            const tileX = playerCol + x;
            const tileY = playerRow + y;

            if (tileX >= 0 && tileX < WORLD_WIDTH && tileY >= 0 && tileY < WORLD_HEIGHT) {
                const tile = world[tileY][tileX];
                if (tile !== TILE_TYPES.AIR) {
                    const tileRect = {
                        x: tileX * TILE_SIZE,
                        y: tileY * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                    };
                    
                    // Comprobar colisión
                    if (
                        player.x < tileRect.x + tileRect.width &&
                        player.x + player.width > tileRect.x &&
                        player.y < tileRect.y + tileRect.height &&
                        player.y + player.height > tileRect.y
                    ) {
                        // Resolver colisión
                        const overlapY = (player.y + player.height) - tileRect.y;
                        if (player.dy > 0 && overlapY > 0 && overlapY < TILE_SIZE) {
                             player.y = tileRect.y - player.height;
                             player.dy = 0;
                             player.onGround = true;
                        }
                    }
                }
            }
        }
    }
}


function draw() {
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo de cielo
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Guardar el estado del contexto y mover la "cámara"
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Dibujar el mundo
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = startCol + Math.ceil(canvas.width / TILE_SIZE) + 1;
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = startRow + Math.ceil(canvas.height / TILE_SIZE) + 1;

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                const tile = world[y][x];
                if (tile !== TILE_TYPES.AIR) {
                    ctx.fillStyle = TILE_COLORS[tile];
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // Dibujar al jugador
    ctx.fillStyle = '#e74c3c'; // Rojo
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Restaurar el contexto para dibujar elementos fijos (UI)
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Iniciar el Juego ---
createWorld();
gameLoop();

// Ajustar el canvas si la ventana cambia de tamaño
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateCamera(); // Re-calcular la cámara para el nuevo tamaño
});
