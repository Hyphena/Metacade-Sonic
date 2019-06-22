var player;


function init()
{
    player = new player(100, 100);
    _r.color(1, 1, 1);
}


function draw()
{
    player.draw();
}


function think(time, dt)
{
    player.think();
}


function onKeyPressed(key)
{
    if (key == 4) { player.leftDown = true; player.lastDown = false; }
    if (key == 7) { player.rightDown = true; player.lastDown = true; }
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
    this.w = 12;
    this.h = 24;

    this.xsp = 0;
    this.ysp = 0;
    this.gsp = 0;

    this.acc = 0.046875;
    this.dec = 0.5;
    this.frc = 0.046875;
    this.top = 6;

    this.leftDown = false;
    this.rightDown = false;
    this.lastDown = true; // false = left; true = right


    this.draw = function()
    {
        _r.rect(this.x, this.y, this.w, this.h);
    }


    this.think = function()
    {
        this.running();
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
        else { this.gsp -= Math.min(Math.abs(this.gsp), this.frc) * Math.sign(this.gsp); }

        this.xsp = this.gsp * Math.cos(0);
        this.x += this.xsp;
    }
}
