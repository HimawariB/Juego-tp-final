var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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

var game = new Phaser.Game(config);

var enemyInfo = {
    width: 40,
    height: 20,
    count: {
        row: 5,
        col: 9
    },
    offset: {
        top: 100,
        left: 60
    },
    padding: 5
};

function preload() {
    this.load.image("shooter", "assets/araña.png");
    this.load.image("alien", "assets/abeja.png");
    this.load.image("bullet", "assets/bala.png");
    this.load.image("saucer", "assets/abejados.png");
}

var score = 0;
var lives = 3;
var isStarted = false;
var barriers = [];
var ufoCount = 0;
var enemySpeed = 10;
var enemyBulletSpeed = 200;

function create() {
    scene = this;
    cursors = scene.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    isShooting = false;
    this.input.keyboard.addCapture('SPACE');
    enemies = this.physics.add.staticGroup();
    playerLava = scene.add.rectangle(0, 0, 800, 10, 0x000).setOrigin(0);
    enemyLava = scene.add.rectangle(0, 590, 800, 10, 0x000).setOrigin(0);
    saucerLava = scene.add.rectangle(790, 0, 10, 600, 0x000).setOrigin(0);
    scene.physics.add.existing(playerLava);
    scene.physics.add.existing(enemyLava);
    scene.physics.add.existing(saucerLava);

    shooter = scene.physics.add.sprite(400, 560, 'shooter');
    shooter.setCollideWorldBounds(true);

    scoreText = scene.add.text(16, 16, "Score: " + score, { fontSize: '18px', fill: '#FFF' });
    livesText = scene.add.text(696, 16, "Lives: " + lives, { fontSize: '18px', fill: '#FFF' });
    startText = scene.add.text(400, 300, "Click to Play", { fontSize: '18px', fill: '#FFF' }).setOrigin(0.5);

    this.input.keyboard.on('keydown-SPACE', shoot);

    this.input.on('pointerdown', function () {
        if (!isStarted) {
            isStarted = true;
            startText.destroy();
            setInterval(makeSaucer, 15000);
        } else {
            shoot();
        }
    });

    initEnemies();
    setInterval(enemyFire, 3000);
}

function update() {
    if (isStarted) {
        if (cursors.left.isDown || keyA.isDown) {
            shooter.setVelocityX(-160);
        } else if (cursors.right.isDown || keyD.isDown) {
            shooter.setVelocityX(160);
        } else {
            shooter.setVelocityX(0);
        }
    }
}

function shoot() {
    if (isStarted && !isShooting) {
        manageBullet(scene.physics.add.sprite(shooter.x, shooter.y, "bullet"));
        isShooting = true;
    }
}

function initEnemies() {
    enemies.clear(true, true);
    for (var c = 0; c < enemyInfo.count.col; c++) {
        for (var r = 0; r < enemyInfo.count.row; r++) {
            var enemyX = (c * (enemyInfo.width + enemyInfo.padding)) + enemyInfo.offset.left;
            var enemyY = (r * (enemyInfo.height + enemyInfo.padding)) + enemyInfo.offset.top;
            var enemy = enemies.create(enemyX, enemyY, 'alien').setOrigin(0.5);
            enemy.setSize(enemyInfo.width * 0.8, enemyInfo.height * 0.8).setOffset(enemyInfo.width * 0.1, enemyInfo.height * 0.1);
        }
    }
}

function resetEnemies() {
    xTimes = 0;
    dir = "right";
    enemySpeed *= 2;  // Duplica la velocidad de los enemigos
    enemyBulletSpeed *= 2;  // Duplica la velocidad de las balas enemigas
    initEnemies();
}

setInterval(moveEnemies, 1000);

var xTimes = 0;
var dir = "right";

function moveEnemies() {
    if (isStarted) {
        var moveDown = false;
        var deltaX = dir === "right" ? enemySpeed : -enemySpeed;

        enemies.children.each(function (enemy) {
            enemy.x += deltaX;
            enemy.body.reset(enemy.x, enemy.y);
            if (enemy.x <= enemyInfo.offset.left || enemy.x >= config.width - enemyInfo.offset.left) {
                moveDown = true;
            }
        });

        if (moveDown) {
            dir = dir === "right" ? "left" : "right";
            enemies.children.each(function (enemy) {
                enemy.y += 10;
                enemy.body.reset(enemy.x, enemy.y);
            });
        }

        xTimes++;
    }
}

function manageBullet(bullet) {
    bullet.setVelocityY(-380);

    var i = setInterval(function () {
        enemies.children.each(function (enemy) {
            if (checkOverlap(bullet, enemy)) {
                bullet.destroy();
                clearInterval(i);
                isShooting = false;
                enemy.destroy();
                score++;
                scoreText.setText("Score: " + score);

                if (enemies.countActive(true) === 0) {
                    resetEnemies();
                }
            }
        }, this);

        saucers.forEach(function (saucer, index) {
            if (checkOverlap(bullet, saucer)) {
                bullet.destroy();
                clearInterval(i);
                isShooting = false;
                saucer.destroy();
                saucers.splice(index, 1);
                score++;
                ufoCount++;
                scoreText.setText("Score: " + score);
            }
        });
    }, 10);

    scene.physics.add.overlap(bullet, playerLava, function () {
        bullet.destroy();
        clearInterval(i);
        isShooting = false;
    });
}

function manageEnemyBullet(bullet, enemy) {
    if (!enemy.active) {
        bullet.destroy();
        return;
    }

    var angle = Phaser.Math.Angle.BetweenPoints(enemy, shooter);
    scene.physics.velocityFromRotation(angle, enemyBulletSpeed, bullet.body.velocity);

    var i = setInterval(function () {
        if (checkOverlap(bullet, shooter)) {
            bullet.destroy();
            clearInterval(i);
            lives--;
            livesText.setText("Lives: " + lives);

            if (lives === 0) {
                end("Lose");
            }
        }
    }, 10);

    scene.physics.add.overlap(bullet, enemyLava, function () {
        bullet.destroy();
        clearInterval(i);
    });
}

function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

function enemyFire() {
    if (isStarted) {
        var enemy = enemies.children.entries[Phaser.Math.Between(0, enemies.children.entries.length - 1)];
        if (enemy.active) {
            manageEnemyBullet(scene.physics.add.sprite(enemy.x, enemy.y, "bullet"), enemy);
        }
    }
}

var saucers = [];

function makeSaucer() {
    if (isStarted) {
        manageSaucer(scene.physics.add.sprite(0, 60, "saucer"));
    }
}

function manageSaucer(saucer) {
    saucers.push(saucer);
    saucer.isDestroyed = false;
    saucer.setVelocityX(100); // Configuración anterior para el saucer
    scene.physics.add.overlap(saucer, saucerLava, function () {
        saucer.destroy();
        saucer.isDestroyed = true;
    });

    var saucerInterval = setInterval(function () {
        if (saucer.isDestroyed) {
            clearInterval(saucerInterval);
        } else if (isStarted) {
            manageEnemyBullet(scene.physics.add.sprite(saucer.x, saucer.y, "bullet"), saucer);
        }
    }, 2000);
}

function end(con) {
    alert(`You ${con}! Score: ` + score);
    location.reload();
}
