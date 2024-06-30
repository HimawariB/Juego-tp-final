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

var score = 0;
var lives = 3;
var isStarted = false;
var ufoCount = 0;
var enemySpeed = 1; // Velocidad inicial de los enemigos
var enemyBulletSpeed = 100; // Velocidad inicial de las balas enemigas
var moveDirection = 1; // 1: derecha, -1: izquierda
var moveDownDistance = 20;
var moveDistance = 10;
var enemyFireInterval = 3000; // Intervalo de disparo inicial de los enemigos

var cursors, keyA, keyD, shooter, scoreText, livesText, startText, enemies, scene, playerLava, enemyLava, saucerLava;
var isShooting = false;

function preload() {
    this.load.image("shooter", "assets/araña.png");
    this.load.image("alien", "assets/abeja.png");
    this.load.image("bullet", "assets/bala.png");
    this.load.image("saucer", "assets/abejados.png");
}

function create() {
    scene = this;
    cursors = scene.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    isShooting = false;
    this.input.keyboard.addCapture('SPACE');
    enemies = this.physics.add.group();
    playerLava = scene.add.rectangle(0, 0, 800, 10, 0x000).setOrigin(0);
    enemyLava = scene.add.rectangle(0, 590, 800, 10, 0x000).setOrigin(0);
    saucerLava = scene.add.rectangle(790, 0, 10, 600, 0x000).setOrigin(0);
    scene.physics.add.existing(playerLava);
    scene.physics.add.existing(enemyLava);
    scene.physics.add.existing(saucerLava);

    shooter = scene.physics.add.sprite(400, 520, 'shooter');
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
    setInterval(enemyFire, enemyFireInterval);

    // Colisión entre enemigos y shooter
    this.physics.add.collider(enemies, shooter, function (shooter, enemy) {
        enemy.destroy();
        lives--;
        livesText.setText("Lives: " + lives);

        if (lives === 0) {
            end("Lose");
        }
    });
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

        moveEnemies(); // Mueve los enemigos en cada actualización
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
    enemies.clear(true, true); // Elimina todos los enemigos existentes

    // Incrementa la velocidad de los enemigos al regenerarse
    enemySpeed += 1;

    // Disminuye el intervalo de disparo de los enemigos al regenerarse
    enemyFireInterval = Math.max(500, enemyFireInterval - 250); // Aseguramos que no sea menor a 500ms

    // Aumenta la velocidad de las balas enemigas al regenerarse
    enemyBulletSpeed += 20;

    // Determina la dirección de movimiento para la nueva oleada de enemigos
    moveDirection = 1;

    for (var c = 0; c < enemyInfo.count.col; c++) {
        for (var r = 0; r < enemyInfo.count.row; r++) {
            var enemyX = (c * (enemyInfo.width + enemyInfo.padding)) + enemyInfo.offset.left;
            var enemyY = (r * (enemyInfo.height + enemyInfo.padding)) + enemyInfo.offset.top;
            var enemy = enemies.create(enemyX, enemyY, 'alien').setOrigin(0.5);
            enemy.setSize(enemyInfo.width * 0.8, enemyInfo.height * 0.8).setOffset(enemyInfo.width * 0.1, enemyInfo.height * 0.1);
        }
    }

    // Actualiza el intervalo de disparo
    clearInterval(enemyFireIntervalId);
    enemyFireIntervalId = setInterval(enemyFire, enemyFireInterval);
}

function moveEnemies() {
    var moveDown = false;
    enemies.children.each(function (enemy) {
        enemy.x += enemySpeed * moveDirection;

        // Verifica si el enemigo debe moverse hacia los bordes antes de bajar
        if (enemy.x <= enemyInfo.offset.left || enemy.x >= config.width - enemyInfo.offset.left - enemy.width) {
            moveDown = true;
        }
        enemy.body.reset(enemy.x, enemy.y);
    });

    if (moveDown) {
        enemies.children.each(function (enemy) {
            enemy.y += moveDownDistance; // Baja los enemigos un poco
            enemy.body.reset(enemy.x, enemy.y);
        });
        moveDirection *= -1; // Cambia la dirección después de bajar

        // Si todos los enemigos se han eliminados y la dirección es hacia la izquierda,
        // regenerar la oleada de enemigos con dirección hacia la derecha
        if (enemies.countActive(true) === 0 && moveDirection === -1) {
            resetEnemies();
        }
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

                // Incrementa el contador de disparos recibidos por el saucer
                saucer.hits = (saucer.hits || 0) + 1;

                // Destruye el saucer cuando ha recibido dos disparos
                if (saucer.hits === 2) {
                    saucer.destroy();
                    saucers.splice(index, 1);
                    score++;
                    ufoCount++;
                    scoreText.setText("Score: " + score);
                }
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
        if (!enemy.active) {
            bullet.destroy();
            clearInterval(i);
            return;
        }

        if (checkOverlap(bullet, shooter)) {
            bullet.destroy();
            clearInterval(i);
            lives--;
            livesText.setText("Lives: " + lives);

            if (lives === 0) {
                end("Lose");
            }
        }

        if (checkOverlap(bullet, enemyLava)) {
            bullet.destroy();
            clearInterval(i);
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
