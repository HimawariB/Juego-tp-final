class End extends Phaser.Scene {
    constructor() {
        super({ key: 'End' });
    }

    preload() {
        // Ya no cargamos la imagen de 'gameOverScreen'
        // this.load.image('gameOverScreen', 'assets/gameOverScreen.png');
    }

    create(data) {
        // Eliminar la imagen de 'gameOverScreen'
        // this.add.image(400, 300, 'gameOverScreen');

        const gameOverText = this.add.text(400, 150, 'Game Over', {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);

        const scoreText = this.add.text(400, 250, `Score: ${data.score}`, {
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

