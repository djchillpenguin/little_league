//globals
let pitchTime = 5000;
let lastPitchTime = 0;
let ballReleaseTime = 875;
let pitchResetTime = 2000;
let pitchPhase = 'setup';
let lastSwingTime = 0;
let swingCooldown = 500;
let nextSwingTime = 0;

//phase start times
let setupStartTime;
let prePitchStartTime;
let pitchStartTime;
let ballReleaseStartTime;
let ballHitTime;
let ballMissedTime;

let pitchStartLocation = { x: 584, y: 298 };
let pitchEndLocation = { x: 0, y: 0};
let shadowStartLocation = { x: 584, y: 369};
let shadowEndLocation = { x: 0, y: 705};

//maybe get rid of these
let earlyContactWindow = { start: 560 , end: 610 };
let goodContactWindow = { start: 611 , end: 660 };
let lateContactWindow = { start: 661, end: 705 };

let fastballSpeed = 500;

//strikezone, not yet definited
let strikezone = {
    leftTop: { x: 0 , y: 0 },
    rightTop: { x: 0, y: 0 },
    leftBottom: { x: 0, y: 0 },
    rightBottom: { x: 0, y: 0 }
};

//available area for pitch locations
let pitchArea = {
    leftTop: { x: 500, y: 400 },
    rightTop: { x: 800, y: 400 },
    leftBottom: { x: 500, y: 700 },
    rightBottom: { x: 800, y: 700 }
};

//ball hit variables
let exitVelocity = 0;
let exitGroundVelocity = 0;
let exitAngle = 0;
let batDepth = 50;
let ballHitVelocityX = 0;
let ballHitVelocityY = 0;
let ballHitVelocityZ = 0;
let ballHeight = 0;
let ballStartingHeight = 0;
let hitAccuracy = 0;

function ballInPlayPhysics(swingTiming, hitAccuracyX, hitAccuracyY)
{
    hitAccuracy = Math.abs(hitAccuracyX) + Math.abs(hitAccuracyY);

    if(hitAccuracy != 0)
    {
        exitVelocity = 800 * (10 / hitAccuracy);
    }
    else
    {
        exitVelocity = 800;
    }

    ballHitVelocityX = swingTiming * 2;

    exitAngle = Math.atan(Math.abs(hitAccuracyY) / batDepth);

    if (hitAccuracyY > 0)
    {
        ballHitVelocityZ = exitVelocity * Math.tan(exitAngle);
    }
    else
    {
        ballHitVelocityZ = exitVelocity * Math.tan(exitAngle) * -1;
    }

    exitGroundVelocity = exitVelocity * Math.cos(exitAngle);

    //angle = Math.acos(Math.abs(ballHitVelocityX) / exitGroundVelocity);
    ballHitVelocityY = -1 * exitGroundVelocity * Math.sin(Math.acos(Math.abs(ballHitVelocityX) / exitGroundVelocity));
}


var BattingView = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function BattingView ()
    {
        Phaser.Scene.call(this, { key: 'BattingView'});
    },

    preload: function ()
    {
        //load assets
        this.load.image('background', 'assets/battingView.png');
        this.load.spritesheet('batter', 'assets/batterAnimation.png', { frameWidth: 176 , frameHeight: 160 });
        this.load.spritesheet('pitcher', 'assets/pitcher.png', { frameWidth: 128, frameHeight: 192 });
        this.load.spritesheet('ball', 'assets/fastball.png', { frameWidth: 48, frameHeight: 48 });
        this.load.image('pitchShadow', 'assets/pitchShadow.png');
        this.load.image('hitTarget', 'assets/PCI.png');
    },

    create: function ()
    {
        //create background
        background = this.add.sprite(0, 0, 'background');
        background.setOrigin(0, 0);

        //create batter
        batter = this.add.sprite(50, 80, 'batter');
        batter.setOrigin(0, 0);
        batter.setDepth(11);
        batter.setScale(4);

        //create pitcher
        pitcher = this.add.sprite(572, 210, 'pitcher');
        pitcher.setOrigin(0, 0);

        //create ball
        ball = this.physics.add.sprite(pitchStartLocation.x, pitchStartLocation.y, 'ball');
        ball.setAlpha(0);
        ball.setScale(0);
        ball.setDepth(10);

        //create the plate coverage indicator
        hitTarget = this.physics.add.sprite(600, 300, 'hitTarget');
        hitTarget.setAlpha(0.5);

        //create the shadow of the pitching ball
        pitchShadow = this.physics.add.sprite(shadowStartLocation.x, shadowStartLocation.y, 'pitchShadow');
        pitchShadow.setScale(0);
        pitchShadow.setDepth(9);

        //create animations

        //swinging
        this.anims.create({
            key: 'swing',
            frames: this.anims.generateFrameNumbers('batter', { start: 0, end: 3 }),
            frameRate: 15,
            repeat: 0
        });

        //idle batter
        this.anims.create({
            key: 'batterIdle',
            frames: [{ key: 'batter', frame: 4 }],
            frameRate: 2,
            repeat: -1
        });

        //pitching
        this.anims.create({
            key: 'pitch',
            frames: this.anims.generateFrameNumbers('pitcher', { start: 0, end: 9 }),
            frameRate: 8,
            repeat: 0
        });

        //idle pitcher
        this.anims.create({
            key: 'pitcherIdle',
            frames: this.anims.generateFrameNumbers('pitcher', { start: 10, end: 11 }),
            frameRate: 2,
            repeat: -1
        });

        //ball in motion after a pitch
        this.anims.create({
            key: 'ballPitch',
            frames: this.anims.generateFrameNumbers('ball', { start: 0, end: 10 }),
            frameRate: 60,
            repeat: -1
        });

        //start scene with idle batting and pitcher
        batter.anims.play('batterIdle');
        pitcher.anims.play('pitcherIdle');

    },

    update: function (time, delta)
    {
        //updates PCI location with the mouse pointer
        hitTarget.x = this.input.activePointer.x;
        hitTarget.y = this.input.activePointer.y;

        //setup phase
        if (pitchPhase === 'setup')
        {
            console.log('setup phase');
            //set idle animations and set ball starting location
            batter.anims.play('batterIdle');
            pitcher.anims.play('pitcherIdle');
            ball.setPosition(pitchStartLocation.x, pitchStartLocation.y);
            ball.setAlpha(0);
            ball.setScale(0);
            pitchShadow.setPosition(shadowStartLocation.x, shadowStartLocation.y);
            pitchShadow.setScale(0);
            pitchShadow.setDepth(9);
            ball.setVelocityX(0);
            ball.setVelocityY(0);
            pitchShadow.setVelocityX(0);
            pitchShadow.setVelocityY(0);

            lastSwingTime = time;

            prePitchStartTime = time;
            pitchPhase = 'prePitch';
        }

        //pre pitch phase
        if (pitchPhase === 'prePitch')
        {
            console.log('pre pitch phase');
            //input
            if (this.input.activePointer.justDown)
            {
                if (time > nextSwingTime)
                {
                    batter.anims.play('swing');
                    nextSwingTime = time + swingCooldown;
                    lastSwingTime = time;
                }
            }

            //change to pitch phase if enough time without swinging has elapsed
            if(time > prePitchStartTime + pitchTime)
            {
                pitcher.anims.play('pitch');

                //choose pitch location
                //pitchEndLocation.x = Phaser.Math.Between(pitchArea.leftTop.x, pitchArea.rightTop.x);
                //pitchEndLocation.y = Phaser.Math.Between(pitchArea.leftTop.y, pitchArea.leftBottom.y);

                pitchEndLocation.x = 640;
                pitchEndLocation.y = 450;
                shadowEndLocation.x = pitchEndLocation.x;

                pitchStartTime = time;
                pitchPhase = 'pitch';
            }

        }

        if (pitchPhase === 'pitch')
        {
            console.log('pitch phase');
            //start ball animations and motion
            if (time > pitchStartTime + ballReleaseTime)
            {
                ball.setVisible(true);
                ball.setAlpha(1);
                ball.anims.play('ballPitch');

                ballDistance = Phaser.Math.Distance.Between(pitchStartLocation.x, pitchStartLocation.y,
                        pitchEndLocation.x, pitchEndLocation.y);

                shadowDistance = Phaser.Math.Distance.Between(shadowStartLocation.x, shadowStartLocation.y,
                                shadowEndLocation.x, shadowEndLocation.y);

                shadowSpeed = fastballSpeed;
                currentPitchTime = shadowDistance / fastballSpeed;
                ballSpeed = ballDistance / currentPitchTime;

                ball.setVelocityX(findXVelocity(pitchStartLocation.x - pitchEndLocation.x,
                        pitchStartLocation.y - pitchEndLocation.y, ballSpeed));
                ball.setVelocityY(findYVelocity(pitchStartLocation.x - pitchEndLocation.x,
                        pitchStartLocation.y - pitchEndLocation.y, ballSpeed));

                pitchShadow.setVelocityX(findXVelocity(shadowStartLocation.x - shadowEndLocation.x,
                        shadowStartLocation.y - shadowEndLocation.y, shadowSpeed ));
                pitchShadow.setVelocityY(findYVelocity(shadowStartLocation.x - shadowEndLocation.x,
                        shadowStartLocation.y - shadowEndLocation.y, shadowSpeed));

                ballReleaseStartTime = time;
                pitchPhase = 'ballReleased';
            }
        }

        if (pitchPhase === 'ballReleased')
        {
            console.log('ball released phase');
            //input
            if (this.input.activePointer.justDown)
            {
                if (time > nextSwingTime)
                {
                    batter.anims.play('swing');
                    nextSwingTime = time + swingCooldown;
                    lastSwingTime = time;

                    hitAccuracyX = hitTarget.x - pitchEndLocation.x;
                    hitAccuracyY = hitTarget.y - pitchEndLocation.y;
                    timingWindow = (lateContactWindow.end - earlyContactWindow.start) / 2
                    swingTiming = pitchShadow.x - lateContactWindow.end + timingWindow;

                    if (Math.abs(swingTiming) < timingWindow && hitTarget.body.hitTest(ball.x, ball.y))
                    {
                        timedEvent = this.time.addEvent({
                            delay: 100,
                            callback: onEvent,
                            callbackScope: this
                        });

                        function onEvent(){
                            ball.setVelocityX(swingTiming * 25);
                            ball.setVelocityY(-250 * (1 / hitAccuracyY) - 500);
                            pitchShadow.setVelocityX(swingTiming * 25);
                            pitchShadow.setVelocityY(-250);
                            ballInPlayPhysics(swingTiming, hitAccuracyX, hitAccuracyY);
                            ballHitTime = time;
                            pitchPhase = 'ballHit';
                        }

                    }
                }
            }

            //ball gets larger as it gets closer to batter
            ball.setScale((pitchShadow.y - shadowStartLocation.y)
                / (shadowEndLocation.y - shadowStartLocation.y));
            pitchShadow.setScale((pitchShadow.y - shadowStartLocation.y)
                / (shadowEndLocation.y - shadowStartLocation.y));

            //stops the ball at the end point
            if (pitchShadow.y > shadowEndLocation.y)
            {
                ball.anims.stop();
                ball.setVelocityX(0);
                ball.setVelocityY(0);
                pitchShadow.setVelocityX(0);
                pitchShadow.setVelocityY(0);
                ballMissedTime = time;
                pitchPhase = 'ballMissed';
            }
        }

        if (pitchPhase === 'ballHit')
        {
            /*if (time > ballHitTime + pitchResetTime)
            {
                pitchPhase = 'setup';
            }*/

            this.scene.start('FieldingView');
        }

        if (pitchPhase === 'ballMissed')
        {
            if (time > ballMissedTime + pitchResetTime)
            {
                pitchPhase = 'setup';
            }
        }
    }
});

var FieldingView = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function FieldingView ()
    {
        Phaser.Scene.call(this, { key: 'FieldingView' });
    },

    preload: function()
    {
        this.load.image('backgroundFielding', 'assets/fieldingView.png');
    },

    create: function()
    {
        console.log('fielding view');
        backgroundFielding = this.add.sprite(0, 0, 'backgroundFielding');
        backgroundFielding.setOrigin(0, 0);
        backgroundFielding.setScale(4);

        ballField = this.physics.add.sprite(525 * 4, 625 * 4, 'ball');

        camera = this.cameras.main;
        camera.startFollow(ballField);
        camera.setBounds(0, 0, 4320, 2880);

        console.log('ballVelX = ', ballHitVelocityX);
        console.log('ballVely = ', ballHitVelocityY);
        console.log('ballVelZ = ', ballHitVelocityZ);
        console.log('exitV = ', exitVelocity);
        console.log('exitGV = ', exitGroundVelocity);
        console.log('exit angle = ', exitAngle);
        console.log('hit acc = ', hitAccuracy);
        ballField.setVelocityX(ballHitVelocityX);
        ballField.setVelocityY(ballHitVelocityY);
    },

    update: function(time, delta)
    {

    }

});

//game config
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
    scene: [
        BattingView,
        FieldingView
    ]
};


//starts game
var game = new Phaser.Game(config);


//extra utility functions
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
