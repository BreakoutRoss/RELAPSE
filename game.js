const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game;
let playerName = '';
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

document.getElementById('start-button').addEventListener('click', () => {
    playerName = document.getElementById('player-name').value;
    if (playerName) {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        game = new Phaser.Game(config);
    }
});

document.getElementById('play-again-button').addEventListener('click', () => {
    document.getElementById('leaderboard-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    resetGame();
});

let paddle;
let hatchet;
let blocks;
let cursors;
let score = 0;
let scoreText;
let isGameOver = false;

function preload() {
    console.log('Preloading assets...');
    this.load.image('paddle', 'paddle.png'); // Use the local paddle image
    this.load.image('hatchet', 'hatchet.png');
    this.load.image('car', 'car.png');
    console.log('Assets queued for loading.');
}

function create() {
    console.log('Creating game objects...');
    
    paddle = this.physics.add.image(512, 700, 'paddle').setImmovable().setScale(0.25); // Scale down the paddle to 1/4th the size
    paddle.body.allowGravity = false;
    paddle.setCollideWorldBounds(true);
    console.log('Paddle created.');

    hatchet = this.physics.add.image(512, 650, 'hatchet');
    hatchet.setCollideWorldBounds(true);
    hatchet.setBounce(1, 1);
    hatchet.setScale(0.4); // Scale up the hatchet to make it even larger
    hatchet.setVelocity(200, -200);
    console.log('Hatchet created.');

    // Create fewer, square-shaped blocks
    blocks = this.physics.add.staticGroup({
        key: 'car',
        frameQuantity: 48, // Reduced the number of blocks
        gridAlign: { width: 12, height: 4, cellWidth: 60, cellHeight: 60, x: 60, y: 100 }
    });
    blocks.children.iterate((block) => {
        block.setScale(0.5); // Scale down the car image to make it square-shaped
        block.refreshBody();
    });
    console.log('Blocks created.');

    this.physics.add.collider(hatchet, paddle, hitPaddle, null, this);
    this.physics.add.collider(hatchet, blocks, hitBlock, null, this);

    cursors = this.input.keyboard.createCursorKeys();
    console.log('Cursor keys created.');

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

    console.log('Game objects creation complete.');
}

function update() {
    if (isGameOver) {
        return;
    }

    if (cursors.left.isDown) {
        paddle.setVelocityX(-500);
    } else if (cursors.right.isDown) {
        paddle.setVelocityX(500);
    } else {
        paddle.setVelocityX(0);
    }

    console.log('Hatchet Y position:', hatchet.y); // Log hatchet's Y position

    if (hatchet.y > 655) { // Set game over condition to Y > 655
        console.log('Hatchet hit the bottom of the screen.');
        endGame(this, false);
    }
}

function hitPaddle(hatchet, paddle) {
    let diff = 0;

    if (hatchet.x < paddle.x) {
        diff = paddle.x - hatchet.x;
        hatchet.setVelocityX(-10 * diff);
    } else if (hatchet.x > paddle.x) {
        diff = hatchet.x - paddle.x;
        hatchet.setVelocityX(10 * diff);
    } else {
        hatchet.setVelocityX(2 + Math.random() * 8);
    }
    console.log('Hatchet hit the paddle.');
}

function hitBlock(hatchet, block) {
    block.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
    console.log('Block hit and disabled. Current score: ' + score);

    if (blocks.countActive() === 0) {
        console.log('All blocks cleared. Player wins.');
        endGame(this, true);
    }
}

function endGame(scene, isWin) {
    console.log('Ending game...');
    isGameOver = true;
    scene.physics.pause();
    scene.scene.stop();
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('leaderboard-screen').classList.remove('hidden');

    if (isWin) {
        document.getElementById('leaderboard').innerHTML = '<h1>CONGRATULATIONS, NOW YOU\'RE SOBER AND HAPPY, YOU DON\'T NEED TO PLAY AGAIN BECAUSE THAT MEANS YOU RELAPSED</h1>';
        document.getElementById('play-again-button').textContent = 'Relapse';
    } else {
        document.getElementById('leaderboard').innerHTML = '<h1>YOU RELAPSED, TRY AGAIN</h1>' + leaderboard.map(entry => `<p>${entry.name}: ${entry.score}</p>`).join('');
    }

    // Add player score to leaderboard
    leaderboard.push({ name: playerName, score: score });
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

    console.log('Game over. Awaiting restart.');
}

function resetGame() {
    // Reset game state
    isGameOver = false;
    score = 0;
    game.destroy(true);
    game = new Phaser.Game(config);
}

