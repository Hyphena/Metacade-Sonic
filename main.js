var player;
var ground1;
var ground2;
var background1;
var background2;


function init()
{
    player = new player(200, 160);
    ground1 = new ground(0, 292);
    ground2 = new ground(576, 292);
    background1 = new background(256, -256, 512, 1024, assets["backgroundMain.tex"], 0.1);
    background2 = new background(256+512, -256, 512, 1024, assets["backgroundMain.tex"], 0.1);
    _r.color(1, 1, 1);
}


function draw()
{
    player.draw();
    ground1.draw();
    ground2.draw();
    background1.draw();
    background2.draw();
}


function think(time, dt)
{
    player.think();
    ground1.think();
    ground2.think();
    background1.think();
    background2.think();
}


function onKeyPressed(key)
{
    if (key == 4) { player.leftDown = true; }
    if (key == 7) { player.rightDown = true; }
}


function onKeyReleased(key)
{
    if (key == 4) { player.leftDown = false; }
    if (key == 7) { player.rightDown = false; }
}


function player(x, y)
{
    this.x = x || 0;
    this.y = y || 0;
    this.w = 48;
    this.h = 48;

    this.leftDown = false;
    this.rightDown = false;

    this.xsp = 0;
    this.ysp = 0;
    this.gsp = 0;

    this.acc = 0.046875;
    this.dec = 0.5;
    this.frc = 0.046875;
    this.top = 6;

    this.braking = false;
    this.facingDir = true; // F = L; T = R
    this.frameCounter = 0;
    this.currentFrame = 0;
    this.frameDuration = 0;
    this.frameSheetLength = 48;


    this.draw = function()
    {
        this.animation();
    }


    this.think = function()
    {
        this.running();
        // this.roll();
        this.transform();
    }


    this.running = function()
    {
        if (this.leftDown)
        {
            if (this.gsp > 0) { this.gsp -= this.dec; }
            else if (this.gsp > -this.top) { this.gsp -= this.acc; }
        }
        else if (this.rightDown)
        {
            if (this.gsp < 0) { this.gsp += this.dec; }
            else if (this.gsp < this.top) { this.gsp += this.acc; }
        }
        else
        { 
            this.gsp -= Math.min(Math.abs(this.gsp), this.frc)
                      * Math.sign(this.gsp);
        }

        this.xsp = this.gsp * Math.cos(0);
    }


    // this.roll() = function()
    // {

    // }


    this.transform = function()
    {
        this.x += this.xsp;
        this.x = Math.min(Math.max(this.x, 50), 330);
    }


    this.animation = function()
    {
        // Set the frame's duration to 8 minus the current
        // ground speed, the faster you go the faster the
        // frames will cycle through to a minimum of 1 step
        this.frameDuration = Math.max(8 - Math.abs(this.gsp), 1);

        // Draw the sprite (48x48) with a rotation of 0 (drawnFrame = sprite)
        // clipping uses a value from 0 to 1 (weird)
        _r.sprite(this.x, this.y, this.w, this.h, 0, this.drawnFrame,
                  this.currentFrame * 48 / this.frameSheetLength, 0,
                  (this.currentFrame + 1) * 48 / this.frameSheetLength, 1);

        
        // Animation functions (now a lot cleaner!)
        this.brakingAnimation();

        if (!this.braking)
        {
            this.runningAnimation();
        }


        // Increment the counter while under the frame's duration
        // otherwise, advance a frame and refresh the counter.
        if (this.frameCounter <= this.frameDuration)
        { 
            this.frameCounter++;
        }
        else
        {
            this.frameCounter = 0;
            this.currentFrame++;
        }
    }


    this.runningAnimation = function()
    {
        // Draw idle sprites
        if (this.gsp == 0)
        { 
            if (this.facingDir) { this.drawnFrame = assets["rSonicIdle.tex"]; }
            else { this.drawnFrame = assets["lSonicIdle.tex"]; }
            
            this.frameSheetLength = 48;
            this.currentFrame = 0;
        }
        // Draw walking sprites
        else if (this.gsp > 0 && this.gsp < 4.5)
        {
            this.drawnFrame = assets["rSonicWalking.tex"];
            this.frameSheetLength = 576;
            this.facingDir = true;
        }
        else if (this.gsp < 0 && this.gsp > -4.5)
        {
            this.drawnFrame = assets["lSonicWalking.tex"];
            this.frameSheetLength = 576;
            this.facingDir = false;
        }
        // Draw jogging sprite
        else if (this.gsp >= 4.5 && this.gsp < 6)
        {
            this.drawnFrame = assets["rSonicJogging.tex"];
            this.frameSheetLength = 480;
        }
        else if (this.gsp <= -4.5 && this.gsp > -6)
        {
            this.drawnFrame = assets["lSonicJogging.tex"];
            this.frameSheetLength = 480;
        }
        // Draw running sprite
        else if (this.gsp >= 6)
        {
            this.drawnFrame = assets["rSonicRunning.tex"];
            this.frameSheetLength = 384;
            this.frameDuration = 1;
        }
        else if (this.gsp <= -6)
        {
            this.drawnFrame = assets["lSonicRunning.tex"];
            this.frameSheetLength = 384;
            this.frameDuration = 1;
        }
    }


    this.brakingAnimation = function()
    {
        // Braking notes
        // animation not affected by angle
        // there was more but I cleaned it up

        // Draw brake sprites
        if (this.leftDown && this.gsp >= 4.5 && !this.braking)
        {
            this.braking = true
            this.currentFrame = 0;
            this.drawnFrame = assets["rSonicBraking.tex"];
        }
        else if (this.rightDown && this.gsp <= -4.5 && !this.braking)
        {
            this.braking = true;
            this.currentFrame = 0;
            this.drawnFrame = assets["lSonicBraking.tex"];
        }

        // Animate the sprites
        if (this.braking)
        {
            this.frameSheetLength = 576;
            this.frameDuration = 1;
            
            if (this.currentFrame == 9 && !this.leftDown)
            {
                this.braking = false;
            }
            if (this.currentFrame == 11)
            {
                this.braking = false;
            }
        }
    }


    this.getXSpeed = function()
    {
        return this.xsp;
    }
}


function ground(x, y)
{
    this.x = x || 0;
    this.y = y || 0;


    this.draw = function()
    {
        _r.sprite(this.x, this.y, 576, 216, 0, assets["groundTile.tex"]);
    }

    this.think = function()
    {
        if (player.x == 330 || player.x == 50)
        {
            this.x -= player.getXSpeed();
        }

        if (this.x < -576 / 2)
        {
            this.x += 576 * 2;
        }
        else if (this.x > 864)
        {
            this.x -= 576 * 2;
        }
    }
}

function background(x, y, w, h, asset, scrollSpeed)
{
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 400;
    this.h = h || 300;
    this.asset = asset || assets["backgroundMain.tex"];
    this.scrollSpeed = scrollSpeed || 1;

    this.draw = function()
    {
        _r.sprite(this.x, this.y, this.w, this.h, 0, this.asset);
    }

    this.think = function()
    {
        if (player.x == 330 || player.x == 50)
        {
            this.x -= player.getXSpeed() * this.scrollSpeed;
        }

        if (this.x < -this.w / 2)
        {
            this.x += this.w * 2;
        }
        else if (this.x > this.w + (this.w / 2))
        {
            this.x -= this.w * 2;
        }
    }
}
