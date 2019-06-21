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
    if (key == 4) { player.leftDown = -1; }
    if (key == 7) { player.rightDown = 1; }
}


function onKeyReleased(key)
{
    if (key == 4) { player.leftDown = 0; }
    if (key == 7) { player.rightDown = 0; }
}


function player(x, y)
{
    this.x = x || 0;
    this.y = y || 0;
    this.w = 12;
    this.h = 24;
    this.speed = 5;

    this.leftDown = 0;
    this.rightDown = 0;


    this.draw = function()
    {
        _r.rect(this.x, this.y, this.w, this.h);
    }


    this.think = function()
    {
        this.x += this.speed * (this.leftDown + this.rightDown);
    }
}
