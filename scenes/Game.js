

function preload() {

    this.load.image("araña", "assets/araña.png");
    this.load.image("abeja", "assets/abeja.png");
    this.load.image("telaraña", "assets/telaraña.png");
    
    var score = 0;
    var lives = 3;
    var isStarted = false;
    var ufoCount = 0;
    
    
    }
    
    function create() {
    
    scene = this;
    cursors = sccene.input.keyboard.createCursorKeys();
    keyA = scene.input.Keyboard.addkey(Phaser.input.Keyboard.KeyCodes.A)
    keyD = scene.input.Keyboard.addkey(Phaser.input.Keyboard.KeyCodes.D)
    
    isShooting = false;
    this.input.keyboard.addCapture('SPACE');
    
    enemies = scene.physics.add.staticGroup();
    
    }
    
    function update() {
    
    }