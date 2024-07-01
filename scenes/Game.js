class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    preload() {
        this.load.image("shooter", "assets/araña.png");
        this.load.image("alien", "assets/abeja.png");
        this.load.image("bullet", "assets/bala.png");
        this.load.image("saucer", "assets/abejados.png");
        this.load.image('gameOverScreen', 'assets/gameOverScreen.png');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.isShooting = false;
        this.enemies = this.physics.add.group();
        this.saucers = [];
        
        this.playerLava = this.add.rectangle(0, 0, 800, 10, 0x000).setOrigin(0);
        this.enemyLava = this.add.rectangle(0, 590, 800, 10, 0x000).setOrigin(0);
        this.saucerLava = this.add.rectangle(790, 0, 10, 600, 0x000).setOrigin(0);
        this.physics.add.existing(this.playerLava);
        this.physics.add.existing(this.enemyLava);
        this.physics.add.existing(this.saucerLava);
        this.enemyDirection = 1;

        this.shooter = this.physics.add.sprite(400, 520, 'shooter').setCollideWorldBounds(true);

        this.score = 0;
        this.lives = 3;
        this.isStarted = false;
        this.isGameOver = false;

        this.scoreText = this.add.text(16, 16, "Score: " + this.score, { fontSize: '18px', fill: '#FFF' });
        this.livesText = this.add.text(696, 16, "Lives: " + this.lives, { fontSize: '18px', fill: '#FFF' });

        this.startScreen = this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);
        this.titleText = this.add.text(400, 200, "Web Defender", { fontSize: '48px', fill: '#FFF' }).setOrigin(0.5);
        this.startText = this.add.text(400, 300, "Click to Play", { fontSize: '24px', fill: '#FFF' }).setOrigin(0.5);

        this.input.on('pointerdown', () => {
            if (!this.isStarted) {
                this.startGame();
            } else {
                this.shoot();
            }
        });

        this.input.keyboard.on('keydown-SPACE', this.shoot, this);

        this.physics.add.collider(this.enemies, this.shooter, (shooter, enemy) => {
            enemy.destroy();
            this.lives--;
            this.livesText.setText("Lives: " + this.lives);

            if (this.lives === 0) {
                this.end("Lose");
            }
        });

        this.input.keyboard.on('keydown-R', () => {
            if (this.isGameOver) {
                this.scene.start('Game');
            }
        });

        // Inicializar variables de velocidad
        this.enemySpeed = 1;
        this.saucerSpeed = 80;
        this.enemyBulletSpeed = 100;
        this.saucerBulletSpeed = 100;
        this.enemyFireIntervalTime = 3000;
    }

    update() {
        if (this.isStarted) {
            if (this.cursors.left.isDown || this.keyA.isDown) {
                this.shooter.setVelocityX(-160);
            } else if (this.cursors.right.isDown || this.keyD.isDown) {
                this.shooter.setVelocityX(160);
            } else {
                this.shooter.setVelocityX(0);
            }

            this.moveEnemies();
        }
    }

    startGame() {
        this.isStarted = true;
        this.isGameOver = false;
        this.startScreen.destroy();
        this.titleText.destroy();
        this.startText.destroy();
        this.initEnemies();
        this.saucerInterval = this.time.addEvent({
            delay: 15000,
            callback: this.makeSaucer,
            callbackScope: this,
            loop: true
        });
        this.enemyFireInterval = this.time.addEvent({
            delay: this.enemyFireIntervalTime,
            callback: this.enemyFire,
            callbackScope: this,
            loop: true
        });
        this.saucerFireInterval = this.time.addEvent({
            delay: 2000,
            callback: this.saucerFire,
            callbackScope: this,
            loop: true
        });
    }

    shoot() {
        if (this.isStarted && !this.isShooting) {
            this.manageBullet(this.physics.add.sprite(this.shooter.x, this.shooter.y, "bullet"));
            this.isShooting = true;
        }
    }

    initEnemies() {
        this.enemies.clear(true, true);
        for (let c = 0; c < 9; c++) {
            for (let r = 0; r < 5; r++) {
                const enemyX = (c * (40 + 5)) + 60;
                const enemyY = (r * (20 + 5)) + 100;
                const enemy = this.enemies.create(enemyX, enemyY, 'alien').setOrigin(0.5);
                enemy.setSize(32, 16).setOffset(4, 2);
            }
        }

        // Incrementar la velocidad de los enemigos y sus balas
        this.enemySpeed *= 1.5;
        this.enemyBulletSpeed *= 1;
        this.enemyFireIntervalTime = Math.max(100, this.enemyFireIntervalTime - 250); // No disminuir por debajo de 1000ms
    }

    moveEnemies() {
        let moveDown = false;

        this.enemies.children.each((enemy) => {
            enemy.x += this.enemyDirection * this.enemySpeed;
            if (enemy.x <= 60 && this.enemyDirection === -1) {
                moveDown = true;
            } else if (enemy.x >= 740 && this.enemyDirection === 1) {
                moveDown = true;
            }
        });

        if (moveDown) {
            this.enemies.children.each((enemy) => {
                enemy.y += 20;
            });
            this.enemyDirection *= -1;
        }

        this.enemies.children.each((enemy) => {
            enemy.body.reset(enemy.x, enemy.y);
        });
    }

    manageBullet(bullet) {
        bullet.setVelocityY(-380);
        const i = setInterval(() => {
            this.enemies.children.each((enemy) => {
                if (this.checkOverlap(bullet, enemy)) {
                    bullet.destroy();
                    clearInterval(i);
                    this.isShooting = false;
                    enemy.destroy();
                    this.score++;
                    this.scoreText.setText("Score: " + this.score);
                    if (this.enemies.countActive(true) === 0) {
                        this.initEnemies();
                    }
                }
            });

            this.saucers.forEach((saucer, index) => {
                if (this.checkOverlap(bullet, saucer)) {
                    bullet.destroy();
                    clearInterval(i);
                    this.isShooting = false;
                    saucer.hits = (saucer.hits || 0) + 1;
                    if (saucer.hits === 2) {
                        saucer.destroy();
                        this.saucers.splice(index, 1);
                        this.score += 10;
                        this.scoreText.setText("Score: " + this.score);
                    }
                }
            });

            if (this.checkOverlap(bullet, this.playerLava)) {
                bullet.destroy();
                clearInterval(i);
                this.isShooting = false;
            }
        }, 10);
    }

    checkOverlap(spriteA, spriteB) {
        const boundsA = spriteA.getBounds();
        const boundsB = spriteB.getBounds();
        return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
    }

    enemyFire() {
        if (this.isStarted && !this.isGameOver) {
            const enemy = Phaser.Math.RND.pick(this.enemies.getChildren().filter(enemy => enemy.active));
            if (enemy) {
                this.manageEnemyBullet(this.physics.add.sprite(enemy.x, enemy.y, "bullet"), enemy);
            }
        }
    }

    manageEnemyBullet(bullet, enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.shooter.x, this.shooter.y);
        this.physics.velocityFromRotation(angle, this.enemyBulletSpeed, bullet.body.velocity);
        const i = setInterval(() => {
            if (!enemy.active) {
                bullet.destroy();
                clearInterval(i);
                return;
            }
            if (this.checkOverlap(bullet, this.shooter)) {
                bullet.destroy();
                clearInterval(i);
                this.lives--;
                this.livesText.setText("Lives: " + this.lives);
                if (this.lives === 0) {
                    this.end("Lose");
                }
            }
            if (this.checkOverlap(bullet, this.enemyLava)) {
                bullet.destroy();
                clearInterval(i);
            }
        }, 10);
    }

    saucerFire() {
        if (this.isStarted && !this.isGameOver) {
            const saucer = Phaser.Math.RND.pick(this.saucers.filter(saucer => saucer.active));
            if (saucer) {
                this.manageSaucerBullet(this.physics.add.sprite(saucer.x, saucer.y, "bullet"), saucer);
            }
        }
    }

    manageSaucerBullet(bullet, saucer) {
        const angle = Phaser.Math.Angle.Between(saucer.x, saucer.y, this.shooter.x, this.shooter.y);
        this.physics.velocityFromRotation(angle, this.saucerBulletSpeed, bullet.body.velocity);
        const i = setInterval(() => {
            if (!saucer.active) {
                bullet.destroy();
                clearInterval(i);
                return;
            }
            if (this.checkOverlap(bullet, this.shooter)) {
                bullet.destroy();
                clearInterval(i);
                this.lives--;
                this.livesText.setText("Lives: " + this.lives);
                if (this.lives === 0) {
                    this.end("Lose");
                }
            }
            if (this.checkOverlap(bullet, this.enemyLava)) {
                bullet.destroy();
                clearInterval(i);
            }
        }, 10);
    }

    makeSaucer() {
        if (this.isStarted && !this.isGameOver) {
            const saucer = this.physics.add.sprite(10, 50, "saucer").setVelocityX(this.saucerSpeed);
            this.saucers.push(saucer);

            const i = setInterval(() => {
                if (this.checkOverlap(saucer, this.saucerLava)) {
                    saucer.destroy();
                    clearInterval(i);
                }
                if (this.checkOverlap(saucer, this.shooter)) {
                    saucer.destroy();
                    clearInterval(i);
                    this.lives--;
                    this.livesText.setText("Lives: " + this.lives);
                    if (this.lives === 0) {
                        this.end("Lose");
                    }
                }
                if (this.isGameOver) {
                    saucer.destroy();
                    clearInterval(i);
                }
            }, 10);

            // Incrementar la velocidad del saucer
            this.saucerSpeed *= 1.1;
            this.saucerBulletSpeed *= 1.1;
        }
    }

    end(type) {
        this.isGameOver = true;
        this.saucerInterval.remove();
        this.enemyFireInterval.remove();
        this.saucerFireInterval.remove();
        this.scene.start('End', { score: this.score });
    }
}

export default Game;
