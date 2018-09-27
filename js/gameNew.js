var FieldingView = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function FieldingView ()
    {
        Phaser.Scene.call(this, { key: 'FieldingView '});
    },

    preload: function ()
    {

    },

    create: function ()
    {

    },

    update: function (time, delta)
    {

    }
});

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
        FieldingView
    ]
};

var game = new Phaser.Game(config);
