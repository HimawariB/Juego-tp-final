class End extends Phaser.Scene {
    constructor() {
        super({ key: 'End' });
    }

    preload() {
        this.load.image('gameOverScreen', 'assets/gameOverScreen.png');
    }

    create(data) {
        this.add.image(400, 300, 'gameOverScreen');

        const scoreText = this.add.text(400, 200, `Score: ${data.score}`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        const restartText = this.add.text(400, 400, 'Press R to Restart', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('Game');
        });
    }
}

export default End;
