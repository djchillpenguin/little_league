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

let pitchStartLocation = { x: 584, y: 298 };
let pitchEndLocation = { x: 0, y: 0};
let shadowStartLocation = { x: 584, y: 369};
let shadowEndLocation = { x: 0, y: 705};

let earlyContactWindow = { start: 560 , end: 610 };
let goodContactWindow = { start: 611 , end: 660 };
let lateContactWindow = { start: 661, end: 705 };

let fastballTime = .75;

let strikezone = {
    leftTop: { x: 0 , y: 0 },
    rightTop: { x: 0, y: 0 },
    leftBottom: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 }
};

let pitchArea = {
    leftTop: { x: 500, y: 400 },
    rightTop: { x: 800, y: 400 },
    leftBottom: { x: 500, y: 700 },
    rightBottom: { x: 800, y: 700 }
};

function preload()
{
    this.load.image('background', 'assets/battingView.png');
    this.load.spritesheet('batter', 'assets/batter.png', { frameWidth: 704 , frameHeight: 640 });
    this.load.spritesheet('pitcher', 'assets/pitcher.png', { frameWidth: 128, frameHeight: 192 });
    this.load.spritesheet('ball', 'assets/fastball.png', { frameWidth: 48, frameHeight: 48 });
    this.load.image('pitchShadow', 'assets/pitchShadow.png');
    this.load.image('hitTarget', 'assets/PCI.png');
}

function create()
{
    background = this.add.sprite(0, 0, 'background');
    background.setOrigin(0, 0);

    batter = this.add.sprite(50, 80, 'batter');
    batter.setOrigin(0, 0);
    batter.setDepth(11);

    pitcher = this.add.sprite(572, 210, 'pitcher');
    pitcher.setOrigin(0, 0);

    ball = this.physics.add.sprite(pitchStartLocation.x, pitchStartLocation.y, 'ball');
    ball.setAlpha(0);

    hitTarget = this.physics.add.sprite(600, 300, 'hitTarget');
    hitTarget.setAlpha(0.5);

    pitchShadow = this.physics.add.sprite(shadowStartLocation.x, shadowStartLocation.y, 'pitchShadow');

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
        frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 10 }),
        frameRate: 60,
        repeat: -1
    });

    batter.anims.play('batterIdle');
    pitcher.anims.play('pitcherIdle');

    ball.setScale(0);
    pitchShadow.setScale(0);
    ball.setDepth(10);
    pitchShadow.setDepth(9);
}

function update(time, delta)
{
    hitTarget.x = this.input.activePointer.x;
    hitTarget.y = this.input.activePointer.y;

    if (time > lastPitchTime + pitchTime)
    {
        pitchShadow.setVelocityX(0);
        pitchShadow.setVelocityY(0);
        ball.setPosition(pitchStartLocation.x, pitchStartLocation.y);
        pitchShadow.setPosition(shadowStartLocation.x, shadowStartLocation.y);
        ball.setVelocityX(0);
        ball.setVelocityY(0);
        pitcher.anims.play('pitch');
        lastPitchTime = time;
        pitchPhase = 'pitched';
    }

    if (time > lastPitchTime + ballReleaseTime && pitchPhase === 'pitched')
    {
        pitchPhase = 'ballVisible';

        pitchEndLocation.x = Phaser.Math.Between(pitchArea.leftTop.x, pitchArea.rightTop.x);
        pitchEndLocation.y = Phaser.Math.Between(pitchArea.leftTop.y, pitchArea.leftBottom.y);
        shadowEndLocation.x = pitchEndLocation.x;

        ball.setVisible(true);
        ball.setAlpha(1);
        ball.anims.play('ballPitch');
        ball.setPosition(pitchStartLocation.x, pitchStartLocation.y);

        ballDistance = Phaser.Math.Distance.Between(pitchStartLocation.x, pitchStartLocation.y,
                        pitchEndLocation.x, pitchEndLocation.y);

        shadowDistance = Phaser.Math.Distance.Between(shadowStartLocation.x, shadowStartLocation.y,
                        shadowEndLocation.x, shadowEndLocation.y);

        ballSpeed = ballDistance / fastballTime;
        shadowSpeed = shadowDistance / fastballTime;

        ballVelocityX = findXVelocity(pitchStartLocation.x - pitchEndLocation.x,
                        pitchStartLocation.y - pitchEndLocation.y, ballSpeed);

        ballVelocityY = findYVelocity(pitchStartLocation.x - pitchEndLocation.x,
                        pitchStartLocation.y - pitchEndLocation.y, ballSpeed);


        ball.setVelocityX(ballVelocityX);
        ball.setVelocityY(ballVelocityY);

        pitchShadow.setVelocityX(findXVelocity(shadowStartLocation.x - shadowEndLocation.x,
            shadowStartLocation.y - shadowEndLocation.y, shadowSpeed ));
        pitchShadow.setVelocityY(findYVelocity(shadowStartLocation.x - shadowEndLocation.x,
            shadowStartLocation.y - shadowEndLocation.y, shadowSpeed));
    }

    if (pitchPhase === 'ballVisible')
    {
        ball.setScale((pitchShadow.y - shadowStartLocation.y)
            / (shadowEndLocation.y - shadowStartLocation.y));
        pitchShadow.setScale((pitchShadow.y - shadowStartLocation.y)
            / (shadowEndLocation.y - shadowStartLocation.y));
    }

    if (pitchShadow.y > shadowEndLocation.y && pitchPhase === 'ballVisible')
    {
        ball.anims.stop();
        ball.setVelocityX(0);
        ball.setVelocityY(0);
        pitchShadow.setVelocityX(0);
        pitchShadow.setVelocityY(0);
    }

    if (time > lastPitchTime + pitchResetTime && pitchPhase === 'ballVisible')
    {
        pitchPhase = 'ready';
        pitcher.anims.play('pitcherIdle');
        batter.anims.play('batterIdle');


        ball.setScale(0);
        pitchShadow.setScale(0);
    }

    if (pitchPhase === 'ready' && time > lastSwingTime + swingCooldown)
    {
        batter.anims.play('batterIdle');
    }

    if (this.input.activePointer.justDown)
    {
        batter.anims.play('swing');

        hitAccuracyX = hitTarget.x - pitchEndLocation.x;
        hitAccuracyY = hitTarget.y - pitchEndLocation.y;
        timingWindow = (lateContactWindow.end - earlyContactWindow.start) / 2
        swingTiming = pitchShadow.x - lateContactWindow.end + timingWindow;

        if (Math.abs(hitAccuracyX) < 60 && Math.abs(hitAccuracyY) < 60 && Math.abs(swingTiming) < timingWindow)
        {
            /*if (pitchShadow.y > earlyContactWindow.start && pitchShadow.y < earlyContactWindow.end)
            {
                ball.setVelocityX(-500 + hitAccuracyX);
                ball.setVelocityY(-250 * (1 / hitAccuracyY) - 500);
                pitchShadow.setVelocityX(-500 + hitAccuracyX);
                pitchShadow.setVelocityY(100 * (1 / hitAccuracyX) - 500);
                console.log('early contact');
            }
            else if (pitchShadow.y > goodContactWindow.start && pitchShadow.y < goodContactWindow.end)
            {
                ball.setVelocityX(hitAccuracyX);
                ball.setVelocityY(-500 * (1 / hitAccuracyY) - 500);
                pitchShadow.setVelocityX(10 + hitAccuracyX);
                pitchShadow.setVelocityY(100 * (1 / hitAccuracyX) - 500);
                console.log('good contact');
            }
            else if (pitchShadow.y > lateContactWindow.start && pitchShadow.y < lateContactWindow.end)
            {
                ball.setVelocityX(500 + hitAccuracyX);
                ball.setVelocityY(-250 * (1 / hitAccuracyY) - 500);
                pitchShadow.setVelocityX(500 + hitAccuracyX);
                pitchShadow.setVelocityY(-100 * (1 / hitAccuracyX) - 500);
                console.log('late contact');
            }*/
            ball.setVelocityX(swingTiming * 25);
            ball.setVelocityY(-250 * (1 / hitAccuracyY) - 500);
            pitchShadow.setVelocityX(swingTiming * 50);
            pitchShadow.setVelocityY(-250);

        }
        else if (swingTiming < timingWindow * -1)
        {
            console.log('miss early');
        }
        else if (swingTiming < timingWindow)
        {
            console.log('miss late');
        }

        console.log('hitAccX = ', hitAccuracyX);
        console.log('hitAccY = ', hitAccuracyY);

        lastSwingTime = time;
    }

}

function findXVelocity (x, y, speed) {
    let angle;
    angle = Math.atan(Math.abs(y) / Math.abs(x));

    if (x > 0) {
        return (speed * Math.cos(angle)) * -1;
    }
    else {
        return speed * Math.cos(angle);
    }
}

function findYVelocity(x, y, speed) {
    let angle;
    angle = Math.atan(Math.abs(y) / Math.abs(x));

    if (y > 0) {
        return (speed * Math.sin(angle)) * -1;
    }
    else {
        return speed * Math.sin(angle);
    }
}
