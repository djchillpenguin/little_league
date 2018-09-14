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

//globals
let pitchTime = 8000;
let lastPitchTime = 0;
let ballReleaseTime = 875;
let pitchResetTime = 3000;
let pitchPhase = 'ready';
let lastSwingTime = 0;
let swingCooldown = 500;

function preload()
{
    this.load.image('background', 'assets/battingView.png');
    this.load.spritesheet('batter', 'assets/batter.png', { frameWidth: 528 , frameHeight: 480 });
    this.load.spritesheet('pitcher', 'assets/pitcher.png', { frameWidth: 128, frameHeight: 192 });
    this.load.spritesheet('ball', 'assets/baseballBatting.png', { frameWidth: 32, frameHeight: 32 });
}

function create()
{
    background = this.add.sprite(0, 0, 'background');
    background.setOrigin(0, 0);

    batter = this.add.sprite(144, 216, 'batter');
    batter.setOrigin(0, 0);

    pitcher = this.add.sprite(572, 116, 'pitcher');
    pitcher.setOrigin(0, 0);

    ball = this.physics.add.sprite(572, 116, 'ball');
    ball.setAlpha(0);

    this.anims.create({
        key: 'swing',
        frames: this.anims.generateFrameNumbers('batter', { start: 0, end: 3 }),
        frameRate: 16,
        repeat: 0
    });

    this.anims.create({
        key: 'batterIdle',
        frames: [{ key: 'batter', frame: 4 }],
        frameRate: 2,
        repeat: -1
    });

    this.anims.create({
        key: 'pitch',
        frames: this.anims.generateFrameNumbers('pitcher', { start: 0, end: 9 }),
        frameRate: 8,
        repeat: 0
    });

    this.anims.create({
        key: 'pitcherIdle',
        frames: this.anims.generateFrameNumbers('pitcher', { start: 10, end: 11 }),
        frameRate: 2,
        repeat: -1
    });

    this.anims.create({
        key: 'ballPitch',
        frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: 0
    });

    batter.anims.play('batterIdle');
    pitcher.anims.play('pitcherIdle');
}

function update(time, delta)
{
    if (time > lastPitchTime + pitchTime)
    {
        pitcher.anims.play('pitch');
        lastPitchTime = time;
        pitchPhase = 'pitched';
        console.log('testPitch');
    }

    if (time > lastPitchTime + ballReleaseTime && pitchPhase === 'pitched')
    {
        pitchPhase = 'ballVisible';
        ball.setVisible(true);
        ball.setAlpha(1);
        ball.anims.play('ballPitch');
        ball.setPosition(572, 130);
        ball.setVelocityX(10);
        ball.setVelocityY(300);
        console.log('testBall');
    }

    if (time > lastPitchTime + pitchResetTime && pitchPhase === 'ballVisible')
    {
        pitchPhase = 'ready';
        pitcher.anims.play('pitcherIdle');
        batter.anims.play('batterIdle');
        ball.setPosition(572, 116);
        ball.setVelocityX(0);
        ball.setVelocityY(0);
        ball.setAlpha(0);
        console.log('testReset');
    }

    if (pitchPhase === 'ready' && time > lastSwingTime + swingCooldown)
    {
        batter.anims.play('batterIdle');
    }

    if (this.input.activePointer.justDown)
    {
        batter.anims.play('swing');
        lastSwingTime = time;
    }



}
