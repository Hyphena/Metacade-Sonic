var player;
var background1;
var background2;
var dustPuff;
var stage;

var particles = [];


function init()
{
    player = new player(60, 168);
    background1 = new background(256, -256, 512, 1024, assets["backgroundMain.tex"], 0.1);
    background2 = new background(256 + 512, -256, 512, 1024, assets["backgroundMain.tex"], 0.1);
    stage = new stage();
    
    _r.color(1, 1, 1);
}


function draw()
{
    player.draw();
    background1.draw();
    background2.draw();
    stage.draw();
    drawParticles();
}


function think(time, dt)
{
    player.think();
}


function onKeyPressed(key)
{
    if (key == 4) { player.leftDown = true; }
    if (key == 7) { player.rightDown = true; }
    if (key == 22) { player.downDown = true; }
}


function onKeyReleased(key)
{
    if (key == 4) { player.leftDown = false; }
    if (key == 7) { player.rightDown = false; }
    if (key == 22) { player.downDown = false; }
}


// TODO: Use box collisions instead of lines
// TODO: Add the second balancing animation


function player(x, y)
{
    this.x = x || 0;
    this.y = y || 0;
    this.w = 48;
    this.h = 48;
    this.drawX = this.x;
    this.drawY = this.y;
    this.camXBoundL = 192;
    this.camXBoundR = 208;

    this.leftDown = false;
    this.rightDown = false;
    this.upDown = false;
    this.downDown = false;

    this.braking = false;
    this.crouching = false;
    this.rolling = false;
    this.leftGrounded = true;
    this.rightGrounded = true;

    this.xsp = 0;
    this.ysp = 0;
    this.gsp = 0;
    this.slope = 0;
    this.ang = 0;

    this.acc = 0.046875;
    this.dec = 0.5;
    this.frc = 0.046875;
    this.top = 6;
    this.jmp = 6.5;
    this.grv = 0.21875;
    this.slp = 0.125;
    this.slprollup = 0.078125;
    this.slprolldown = 0.3125;
    this.fall = 2.5;

    this.drawnFrame = assets["rSonicIdle.tex"];
    this.facingDir = true; // false = left; true = right
    this.frameCounter = 0;
    this.currentFrame = 0;
    this.frameDuration = 0;
    this.frameSheetLength = 48;


    ///////  [ BASE FUNCTIONS ] ///////
    // Used for the base methods and calls upon the other methods

    this.draw = function()
    {
        // TODO: Figure out why going from crouch/roll to run sometimes bugs out

        // Set the frame's duration to 8 minus the current
        // ground speed, the faster you go the faster the
        // frames will cycle through to a minimum of 1 step
        this.frameDuration = Math.max(8 - Math.abs(this.gsp), 1);

        // Draw the sprite (48x48) with a rotation of 0 (drawnFrame = sprite)
        // clipping uses a value from 0 to 1 (weird)
        _r.sprite(this.drawX, this.drawY, this.w, this.h, 0, this.drawnFrame,
                  this.currentFrame * 48 / this.frameSheetLength, 0,
                  (this.currentFrame + 1) * 48 / this.frameSheetLength, 1);

        
        // Animation functions (now a lot cleaner!)
        if (this.leftGrounded && this.rightGrounded)
        {
            this.brakingAnimation();
            this.rollingAnimation();
            this.crouchingAnimation();
        }
        else
        {
            this.balanceAnimation();
        }

        if (!this.braking && !this.downDown && !this.rolling)
        {
            this.runningAnimation();
        }


        if (!this.crouching)
        {
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
        else
        {
            if (this.frameCounter <= this.frameDuration)
            {
                this.frameCounter++;
            }
            else if (this.currentFrame + 1 <= 3)
            {
                this.frameCounter = 0;
                this.currentFrame++;
            }
        }

        // this.drawSensors();
    }


    this.think = function()
    {
        this.running();
        // this.roll();
        // this.collisions();
        // this.transform();
        // this.scrollStage();
    }


    ///////  [ PHYSICS FUNCTIONS ]  ///////
    // Calculates the physics for certain states

    this.running = function()
    {
        if (this.leftDown) // move left
        {
            if (this.gsp > 0) { this.gsp -= this.dec; }
            else if (this.gsp > -this.top && !this.rolling) { this.gsp -= this.acc; }
        }
        else if (this.rightDown && !this.rolling) // move right
        {
            if (this.gsp < 0) { this.gsp += this.dec; }
            else if (this.gsp < this.top && !this.rolling) { this.gsp += this.acc; }
        }
        else // apply friction
        { 
            this.gsp -= Math.min(Math.abs(this.gsp), this.frc)
                      * Math.sign(this.gsp);
        }

        this.xsp = this.gsp * Math.cos(0);
    }


    this.roll = function()
    {
        // TODO: Allow crouching and rolling
        // crouching
        // - dont allow any movement or animations besides crouching
        // - LATER holding jump to spindash, but at a later date
        // rolling https://info.sonicretro.org/SPG:Rolling
        // - roll up when holding down S
        // - friction is half of normal
        // - holding opp of motion will slow Xspd by .125
        // - while decelerating Xspd is slowed by half of friction + maybe .125
        // - sonic cannot roll up unless Xspd is greater than 1.03125 (oddly specific)
        // - sonic unrolls if Xspd falls under .5
        // -- LATER: allow full air control while rolling
        // -- OPTIONAL: top speed is 16 gsp

        // TODO: Figure out why holding the moving direction while rolling doesn't slow down

        if (this.downDown && Math.abs(this.xsp) > 1.03125 && !this.rolling)
        {
            this.rolling = true;
            this.frc = this.frc / 2;
        }

        if (!this.downDown && Math.abs(this.xsp) < 0.5)
        {
            this.rolling = false;
            this.frc = 0.046875;
        }
    }


    this.transform = function()
    {
        if (this.crouching)
        {
            this.xsp = 0;
            this.gsp = 0;
        }

        if (!this.leftGrounded && !this.rightGrounded)
        {
            this.ysp += this.grv;
            
            if (this.ysp > 16)
            {
                this.ysp = 16;
            }
        }
        else
        {
            this.ysp = 0;
        }

        this.x += this.xsp;

        // if (this.x >= 192)
        // {
        //     this.drawX = Math.min(Math.max(this.drawX + this.xsp, this.camXBoundL), this.camXBoundR);
        // }
        // else
        // {
        //     this.drawX = this.x;
        // }

        this.drawX = Math.min(Math.max(this.drawX + this.xsp, this.camXBoundL), this.camXBoundR);

        // this.x = Math.min(Math.max(this.x, 50), 330);
        this.y += this.ysp;
        // this.drawY = Math.min(Math.max(this.y + this.ysp, -400), 230);
        this.drawY = this.y;
    }


    this.checkLeftSensor = function(x, y)
    {
        // Round down the player's position to the nearest cell in the stage
        roundedX = (x - (x % 16)) / 16;
        roundedY = (y - (y % 16)) / 16;
        stageTile = stageArray[roundedY][roundedX];

        if (stageTile != 0)
        {
            if (y > heightMask[stageTile][x % 16])
            {
                if (stageArray[roundedY - 1][x % 16] != 0)
                {
                    return roundedY * 16 - 24 - heightMask[stageArray[roundedY - 1][roundedX]][x % 16];
                }
                
                return roundedY * 16 - 8 - heightMask[stageTile][x % 16];
            }

            this.leftGrounded = true;
        }

        this.leftGrounded = false;
    }


    this.checkRightSensor = function(x, y)
    {
        // Round down the player's position to the nearest cell in the stage
        roundedX = (x - (x % 16)) / 16;
        roundedY = (y - (y % 16)) / 16;
        stageTile = stageArray[roundedY][roundedX];

        if (stageTile != 0)
        {
            if (y > heightMask[stageTile][x % 16])
            {
                if (stageArray[roundedY - 1][x % 16] != 0)
                {
                    return roundedY * 16 - 24 - heightMask[stageArray[roundedY - 1][roundedX]][x % 16];
                }
            
                return roundedY * 16 - 8 - heightMask[stageTile][x % 16];
            }

            this.rightGrounded = true;
        }

        this.rightGrounded = false;
    }

    this.collisions = function()
    {
        this.leftXY = this.checkLeftSensor(Math.trunc(this.x) - 7, Math.trunc(this.y) + 24);
        this.rightXY = this.checkRightSensor(Math.trunc(this.x) + 7, Math.trunc(this.y) + 24);

        if (this.leftXY > this.rightXY)
        {
            this.y = this.leftXY;
        }
        else
        {
            this.y = this.rightXY;
        }
    }

    ///////  [ ANIMATION FUNCTIONS ]  ///////
    // Functions used for their own respective animation and just drawing
    // in general.

    this.runningAnimation = function()
    {
        // Draw idle sprites
        if (this.gsp == 0 && this.leftGrounded && this.rightGrounded)
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
            this.frameDuration = 2;
        }
        else if (this.gsp < 0 && this.gsp > -4.5)
        {
            this.drawnFrame = assets["lSonicWalking.tex"];
            this.frameSheetLength = 576;
            this.facingDir = false;
            this.frameDuration = 2;
        }
        // Draw jogging sprite
        else if (this.gsp >= 4.5 && this.gsp < 6)
        {
            this.drawnFrame = assets["rSonicJogging.tex"];
            this.frameSheetLength = 480;
            this.frameDuration = 1;
        }
        else if (this.gsp <= -4.5 && this.gsp > -6)
        {
            this.drawnFrame = assets["lSonicJogging.tex"];
            this.frameSheetLength = 480;
            this.frameDuration = 1;
        }
        // Draw running sprite
        else if (this.gsp >= 6)
        {
            this.drawnFrame = assets["rSonicRunning.tex"];
            this.frameSheetLength = 384;
            this.frameDuration = .5;
        }
        else if (this.gsp <= -6)
        {
            this.drawnFrame = assets["lSonicRunning.tex"];
            this.frameSheetLength = 384;
            this.frameDuration = .5;
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
        if (this.rightDown && this.gsp <= -4.5 && !this.braking)
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
            
            // Add dust puffs every 4 frames
            if (this.currentFrame % 4 == 0)
            {
                particles.push(new particle(this.drawX, this.drawY + 18, 16, 20));
            }
            
            if (this.currentFrame == 9 && this.facingDir && !this.leftDown)
            {
                this.braking = false;
            }
            if (this.currentFrame == 9 && !this.facingDir && !this.rightDown)
            {
                this.braking = false;
            }
            if (this.currentFrame == 11)
            {
                this.braking = false;
            }
        }
    }


    this.crouchingAnimation = function()
    {
        if (this.downDown && Math.abs(this.xsp) < 1.03125 && !this.crouching)
        {
            this.crouching = true;
            this.currentFrame = 0;
        }

        if (this.crouching)
        {
            if (!this.downDown)
            {
                this.crouching = false;
            }

            this.frameDuration = 1;

            if (this.facingDir)
            {
                this.drawnFrame = assets["rSonicCrouch.tex"];
            }
            else
            {
                this.drawnFrame = assets["lSonicCrouch.tex"];
            }

            this.frameSheetLength = 192;
        }
    }


    this.rollingAnimation = function()
    {
        if (this.rolling)
        {
            if (this.facingDir)
            {
                this.drawnFrame = assets["rSonicRoll.tex"];
            }
            else
            {
                this.drawnFrame = assets["lSonicRoll.tex"];
            }

            this.frameSheetLength = 768;
            this.frameDuration = 1;
        }
    }


    this.balanceAnimation = function()
    {
        if (this.leftGrounded && !this.rightGrounded)
        {
            this.drawnFrame = assets["rSonicBalance2.tex"];
            this.frameSheetLength = 384;
            this.frameDuration = 3;
        }
    }


    this.drawSensors = function()
    {
        _r.layer++;
        _r.layer++;

        _r.sprite(this.drawX, this.drawY + 4, 3, 3, 0, assets["crosshair.tex"]);
        _r.sprite(this.drawX - 7, this.drawY + 24, 3, 3, 0, assets["crosshair.tex"]);
        _r.sprite(this.drawX + 7, this.drawY + 24, 3, 3, 0, assets["crosshair.tex"]);

        _r.layer--;
        _r.layer--;
    }


    this.scrollStage = function()
    {
        if (player.drawX == player.camXBoundL || player.drawX == player.camXBoundR)
        {
            background1.think();
            background2.think();
            stage.think();

            if (particles.length > 0)
            {
                for (let i = 0; i < particles.length; i++)
                {
                    particles[i].think();
                }
            }
        }
    }


    ///////  [ FUNCTION STORAGE ] ///////
    // A special function used to house all previous attempts at stuff that
    // might be used again some day. It should probably be in another file.

    this.uselessMethods = function()
    {
    // this.collision = function()
    // {
    //     if (this.intersects(this.x - 7, this.y, this.x - 7, this.y + 20, 0, 180, 290, 180))
    //     {
    //         this.leftGrounded = true;   
    //     }
    //     else
    //     {
    //         this.leftGrounded = false;
    //     }

    //     if (this.intersects(this.x + 7, this.y, this.x + 7, this.y + 20, 0, 180, 290, 180))
    //     {
    //         this.rightGrounded = true;
    //     }
    //     else
    //     {
    //         this.rightGrounded = false;
    //     }
    // }

    // this.intersects = function(x1, y1, x2, y2, x3, y3, x4, y4)
    // {
    //     // This right here is witchcraft, I don't understand
    //     // how any of it works, it just does.
    //     var s1_x, s1_y, s2_x, s2_y;
    //     s1_x = x2 - x1;
    //     s1_y = y2 - y1;
    //     s2_x = x4 - x3;
    //     s2_y = y4 - y3;

    //     var s, t;
    //     s = (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
    //     t = (s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);

    //     return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
    // }


    // this.intersects = function(x1, y1, x2, y2, x3, y3, x4, y4)
    // {
    //     var det, gamma, lambda;
    //     det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
    //     if (det === 0)
    //     {
    //         print("no");
    //         return false;
    //     }
    //     else
    //     {
    //         lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
    //         gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
    //         print("yes");
    //         return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    //     }
    // }

    // function intersects(x1,y1,x2,y2,x3,y3,x4,y4) {
    //     var det, gamma, lambda;
    //     det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
    //     if (det === 0) {
    //       return false;
    //     } else {
    //       lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
    //       gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
    //       return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    //     }
    //   };
    }
}


function stage()
{
    this.drawX = 0;
    this.drawY = 0;
    this.scrollSpeed = 1;


    this.draw = function()
    {
        _r.layer++;

        for(let j = 0; j < stageArray.length; j++)
        {
            for (let i = (player.x - (player.x % 16)) / 16 - 13; i < (player.x - (player.x % 16)) / 16 + 14; i++)
            {
                if (stageArray[j][i] != 0)
                {
                    this.drawTile(tileArray[stageArray[j][i]], i, j);
                }
            }
        }

        _r.layer--;
    }


    this.drawTile = function(tileSprite, i, j)
    {
        _r.sprite(this.drawX + i * 16 + 8, this.drawY + j * 16 + 8, 16, 16, 0, tileSprite);
    }


    this.think = function()
    {
        this.drawX -= player.xsp * this.scrollSpeed;
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
        this.x -= player.xsp * this.scrollSpeed;

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


function particle(x, y, w, h, asset, frameSpriteLength, frameSheetLength)
{
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 32;
    this.h = h || 32;
    this.asset = asset || assets["dustPuff.tex"];
    this.scrollSpeed = 1;

    this.frameCounter = 0;
    this.currentFrame = 0;
    this.frameDuration = 1;
    this.frameSpriteLength = frameSpriteLength || 16;
    this.frameSheetLength = frameSheetLength || 160;

    this.draw = function()
    {
        _r.sprite(this.x, this.y, this.w, this.h, 0, this.asset,
            this.currentFrame * this.frameSpriteLength / this.frameSheetLength,
            0, (this.currentFrame + 1) * this.frameSpriteLength
            / this.frameSheetLength, 1);

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

    this.think = function()
    {
        this.x -= player.xsp * this.scrollSpeed;
    }
}

function drawParticles()
{
    if (particles.length > 0)
    {
        for (let i = 0; i < particles.length; i++)
        {
            particles[i].draw();

            if (particles[i].currentFrame >= particles[i].frameSheetLength / particles[i].frameSpriteLength)
            {
                particles.splice(i, 1);
            }
        }
    }
}
