var config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
            fps: 60
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload()
{
    this.load.image('background', 'assets/battingView.png');
}

function create()
{
    background = this.add.sprite(0, 0, 'background');
    background.setOrigin(0, 0);
}

function update(time, delta)
{

}
