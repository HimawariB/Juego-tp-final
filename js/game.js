const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let bullets;
let enemies;
let lastFired = 0;
let fireRate = 100;
let gameOver = false;

function preload() {
    this.load.image('player', 'assets/araña.png');
    this.load.image('bullet', 'assets/telaraña.png');
    this.load.image('enemy', 'assets/abeja.png');
}

function create() {
    player = this.physics.add.sprite(400, 500, 'player').setCollideWorldBounds(true);

  

    enemies = this.physics.add.group({
        key: 'enemy',
        repeat: 5,
        setXY: { x: 100, y: 100, stepX: 100 }
    });

    enemies.children.iterate(function (enemy) {
        enemy.setVelocityY(30); // Velocidad hacia abajo
    });

    cursors = this.input.keyboard.createCursorKeys();

    
    this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
    this.physics.add.collider(player, enemies, hitPlayer, null, this);

}


function update(time, delta) {
    if (gameOver) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        player.setVelocityX(300);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-300);
    } else if (cursors.down.isDown) {
        player.setVelocityY(300);
    } else {
        player.setVelocityY(0);
    }

    for (let i = 0; 1 < bulletArray.lenght; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle="white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

}

function shoot(e) {
    if (e.code == "Space") {
        let bullet = {
            x: araña.x + arañaWidth*15/32,
            y: araña.y,
            width: tileSize/8,
            height: tileSize/2,
            used: false
        }
        bulletArray.push(bullet);
    }
}

function hitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);
}

function hitPlayer(player, enemy) {
    gameOver = true;
}

class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
    }

    fire(x, y) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityY(-300);

        if (direction === 'up') {
            this.setVelocityY(-300);
        } else if (direction === 'down') {
            this.setVelocityY(300);
        } else if (direction === 'left') {
            this.setVelocityX(-300);
        } else if (direction === 'right') {
            this.setVelocityX(300);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.y <= 0 || this.y >= 600 || this.x <= 0 || this.x >= 800) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}