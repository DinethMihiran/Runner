
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const messageElement = document.getElementById("message");
const restartButton = document.getElementById("restartButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 330;

// Load PNG images.
// If a file is missing, the game will use placeholder artwork.
function loadImage(path) {
    const image = new Image();
    image.src = path;
    return image;
}

const images = {
    run: [
        loadImage("assets/hero/run1.png"),
        loadImage("assets/hero/run2.png"),
        loadImage("assets/hero/run3.png"),
        loadImage("assets/hero/run4.png")
    ],
    jump: loadImage("assets/hero/jump.png"),
    background: loadImage("assets/background.png"),
    obstacle: loadImage("assets/obstacle.png")
};

// Player properties
const player = {
    x: 100,
    y: GROUND_Y - 100,
    width: 70,
    height: 100,
    velocityY: 0,
    gravity: 0.7,
    jumpPower: -15,
    onGround: true,
    frame: 0,
    animationTimer: 0
};

let obstacles = [];
let score = 0;
let bestScore = 0;
let gameSpeed = 6;
let spawnTimer = 0;
let gameOver = false;
let animationId = null;

// Jump when the player is on the ground.
function jump() {
    if (gameOver) {
        return;
    }

    if (player.onGround) {
        player.velocityY = player.jumpPower;
        player.onGround = false;
    }
}

// Create an obstacle.
function createObstacle() {
    const size = 45 + Math.random() * 15;

    obstacles.push({
        x: WIDTH,
        y: GROUND_Y - size,
        width: size,
        height: size,
        passed: false
    });
}

// Rectangle collision detection.
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Update player movement, obstacles, and score.
function update() {
    // Gravity pulls the player downward.
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Stop the player at the ground.
    if (player.y + player.height >= GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.onGround = true;
    }

    // Change running animation frames.
    player.animationTimer++;

    if (player.animationTimer >= 7) {
        player.frame = (player.frame + 1) % images.run.length;
        player.animationTimer = 0;
    }

    // Spawn obstacles at intervals.
    spawnTimer++;

    if (spawnTimer >= 85 + Math.random() * 35) {
        createObstacle();
        spawnTimer = 0;
    }

    // Move obstacles to the left.
    for (const obstacle of obstacles) {
        obstacle.x -= gameSpeed;

        // Award one point when passing an obstacle.
        if (!obstacle.passed &&
            obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            score++;
            scoreElement.textContent = score;

            if (score % 10 === 0) {
                gameSpeed += 0.4;
            }
        }

        // End the game when the player hits an obstacle.
        if (isColliding(player, obstacle)) {
            endGame();
            return;
        }
    }

    // Remove obstacles that leave the screen.
    obstacles = obstacles.filter(
        obstacle => obstacle.x + obstacle.width > 0
    );
}

// Draw the sky, ground, and decorative scenery.
function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#75c9f0");
    sky.addColorStop(1, "#d7f0d0");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Distant hills
    ctx.fillStyle = "#86bd79";
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.quadraticCurveTo(180, 180, 350, 280);
    ctx.quadraticCurveTo(550, 200, 760, 280);
    ctx.lineTo(WIDTH, 330);
    ctx.lineTo(0, 330);
    ctx.fill();

    // Ground
    ctx.fillStyle = "#6e9e42";
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    ctx.fillStyle = "#b5d66a";
    ctx.fillRect(0, GROUND_Y, WIDTH, 8);

    // Small ground details
    ctx.fillStyle = "#477334";

    for (let x = 15; x < WIDTH; x += 65) {
        ctx.fillRect(x, GROUND_Y + 25, 12, 4);
    }
}

// Draw a temporary adventurer if PNGs aren't available.
function drawPlaceholderPlayer() {
    const x = player.x;
    const y = player.y;

    // Legs
    ctx.strokeStyle = "#24364b";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    const running = player.onGround
        ? Math.sin(player.frame * Math.PI / 2) * 8
        : 0;

    ctx.beginPath();
    ctx.moveTo(x + 31, y + 70);
    ctx.lineTo(x + 25 + running, y + 95);
    ctx.moveTo(x + 43, y + 70);
    ctx.lineTo(x + 45 - running, y + 95);
    ctx.stroke();

    // Body and armor
    ctx.fillStyle = "#315d70";
    ctx.fillRect(x + 20, y + 35, 34, 42);

    ctx.fillStyle = "#d5b17a";
    ctx.fillRect(x + 17, y + 42, 40, 7);

    // Head
    ctx.fillStyle = "#e5b88c";
    ctx.beginPath();
    ctx.arc(x + 38, y + 22, 17, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#543a2c";
    ctx.fillRect(x + 22, y + 8, 30, 8);

    // Eye
    ctx.fillStyle = "#202020";
    ctx.fillRect(x + 45, y + 20, 4, 4);
}

// Draw the player, using PNGs when available.
function drawPlayer() {
    let image = player.onGround
        ? images.run[player.frame]
        : images.jump;

    if (image && image.complete && image.naturalWidth > 0) {
        ctx.drawImage(
            image,
            player.x,
            player.y,
            player.width,
            player.height
        );
    } else {
        drawPlaceholderPlayer();
    }
}

// Draw obstacles.
function drawObstacles() {
    for (const obstacle of obstacles) {
        const image = images.obstacle;

        if (image.complete && image.naturalWidth > 0) {
            ctx.drawImage(
                image,
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        } else {
            // Placeholder wooden crate
            ctx.fillStyle = "#85502d";
            ctx.fillRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );

            ctx.strokeStyle = "#e1ad65";
            ctx.lineWidth = 4;
            ctx.strokeRect(
                obstacle.x + 3,
                obstacle.y + 3,
                obstacle.width - 6,
                obstacle.height - 6
            );

            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y);
            ctx.lineTo(
                obstacle.x + obstacle.width,
                obstacle.y + obstacle.height
            );
            ctx.moveTo(
                obstacle.x + obstacle.width,
                obstacle.y
            );
            ctx.lineTo(
                obstacle.x,
                obstacle.y + obstacle.height
            );
            ctx.stroke();
        }
    }
}

// Draw the complete scene.
function draw() {
    drawBackground();
    drawPlayer();
    drawObstacles();
}

// Main game loop.
function gameLoop() {
    update();
    draw();

    if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Stop the game after a collision.
function endGame() {
    gameOver = true;

    bestScore = Math.max(bestScore, score);
    bestElement.textContent = bestScore;

    messageElement.textContent =
        "Game Over! Press R or Restart to try again.";
}

// Reset all game properties.
function restartGame() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    player.onGround = true;
    player.frame = 0;
    player.animationTimer = 0;

    obstacles = [];
    score = 0;
    gameSpeed = 6;
    spawnTimer = 0;
    gameOver = false;

    scoreElement.textContent = score;
    messageElement.textContent = "Jump over the obstacles!";

    gameLoop();
}

// Keyboard controls.
document.addEventListener("keydown", function (event) {
    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {
        event.preventDefault();

        // Allow a new game after game over.
        if (gameOver) {
            restartGame();
        } else {
            jump();
        }
    }

    if (event.code === "KeyR") {
        restartGame();
    }
});

// Mouse and touch-friendly controls.
canvas.addEventListener("pointerdown", jump);
restartButton.addEventListener("click", restartGame);

// Start the game.
gameLoop();
