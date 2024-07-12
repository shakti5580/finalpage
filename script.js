var w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    ctx = c.getContext('2d'),

    hw = w / 2, // half-width
    hh = h / 2,

    opts = {
        strings: ['HAPPY', 'BIRTHDAY!'],
        charSize: 30,
        charSpacing: 35,
        lineHeight: 40,

        cx: w / 2,
        cy: h / 2,

        fireworkPrevPoints: 10,
        fireworkBaseLineWidth: 5,
        fireworkAddedLineWidth: 8,
        fireworkSpawnTime: 200,
        fireworkBaseReachTime: 30,
        fireworkAddedReachTime: 30,
        fireworkCircleBaseSize: 20,
        fireworkCircleAddedSize: 10,
        fireworkCircleBaseTime: 30,
        fireworkCircleAddedTime: 30,
        fireworkCircleFadeBaseTime: 10,
        fireworkCircleFadeAddedTime: 5,
        fireworkBaseShards: 5,
        fireworkAddedShards: 5,
        fireworkShardPrevPoints: 3,
        fireworkShardBaseVel: 4,
        fireworkShardAddedVel: 2,
        fireworkShardBaseSize: 3,
        fireworkShardAddedSize: 3,
        gravity: .1,
        upFlow: -.1,
        letterContemplatingWaitTime: 360,
        balloonSpawnTime: 20,
        balloonBaseInflateTime: 10,
        balloonAddedInflateTime: 10,
        balloonBaseSize: 20,
        balloonAddedSize: 20,
        balloonBaseVel: .4,
        balloonAddedVel: .4,
        balloonBaseRadian: -(Math.PI / 2 - .5),
        balloonAddedRadian: -1,
    },
    calc = {
        totalWidth: opts.charSpacing * Math.max(opts.strings[0].length, opts.strings[1].length)
    },

    Tau = Math.PI * 2,
    TauQuarter = Tau / 4,

    letters = [];

ctx.font = opts.charSize + 'px Verdana';

function Letter(char, x, y) {
    this.char = char;
    this.x = x;
    this.y = y;

    this.dx = -ctx.measureText(char).width / 2;
    this.dy = +opts.charSize / 2;

    this.fireworkDy = this.y - hh;

    var hue = x / calc.totalWidth * 360;

    this.color = 'hsl(hue,80%,50%)'.replace('hue', hue);
    this.lightAlphaColor = 'hsla(hue,80%,light%,alp)'.replace('hue', hue);
    this.lightColor = 'hsl(hue,80%,light%)'.replace('hue', hue);
    this.alphaColor = 'hsla(hue,80%,50%,alp)'.replace('hue', hue);

    this.reset();
}

Letter.prototype.reset = function () {

    this.phase = 'firework';
    this.tick = 0;
    this.spawned = false;
    this.spawningTime = opts.fireworkSpawnTime * Math.random() | 0;
    this.reachTime = opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random() | 0;
    this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
    this.prevPoints = [[0, hh, 0]];
};

Letter.prototype.step = function () {

    if (this.phase === 'firework') {

        if (!this.spawned) {

            ++this.tick;
            if (this.tick >= this.spawningTime) {

                this.tick = 0;
                this.spawned = true;
            }

        } else {

            ++this.tick;

            var linearProportion = this.tick / this.reachTime,
                armonicProportion = Math.sin(linearProportion * TauQuarter),

                x = linearProportion * this.x,
                y = hh + armonicProportion * this.fireworkDy;

            if (this.prevPoints.length > opts.fireworkPrevPoints)
                this.prevPoints.shift();

            this.prevPoints.push([x, y, linearProportion * this.lineWidth]);

            var lineWidthProportion = 1 / (this.prevPoints.length - 1);

            for (var i = 1; i < this.prevPoints.length; ++i) {

                var point = this.prevPoints[i],
                    point2 = this.prevPoints[i - 1];

                ctx.strokeStyle = this.alphaColor.replace('alp', i / this.prevPoints.length);
                ctx.lineWidth = point[2] * lineWidthProportion * i;
                ctx.beginPath();
                ctx.moveTo(point[0], point[1]);
                ctx.lineTo(point2[0], point2[1]);
                ctx.stroke();

            }

            if (this.tick >= this.reachTime) {

                this.phase = 'contemplate';

                this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
                this.circleCompleteTime = opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random() | 0;
                this.circleCreating = true;
                this.circleFading = false;

                this.circleFadeTime = opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random() | 0;
                this.tick = 0;
                this.tick2 = 0;

                this.shards = [];

                var shardCount = opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random() | 0,
                    angle = Tau / shardCount,
                    cos = Math.cos(angle),
                    sin = Math.sin(angle),

                    x = 1,
                    y = 0;

                for (var i = 0; i < shardCount; ++i) {
                    var x1 = x;
                    x = x * cos - y * sin;
                    y = y * cos + x1 * sin;

                    this.shards.push(new Shard(this.x, this.y, x, y, this.alphaColor));
                }
            }

        }
    } else if (this.phase === 'contemplate') {

        ++this.tick;

        if (this.circleCreating) {

            ++this.tick2;
            var proportion = this.tick2 / this.circleCompleteTime,
                armonic = -Math.cos(proportion * Math.PI) / 2 + .5;

            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace('light', 50 + 50 * proportion).replace('alp', proportion);
            ctx.beginPath();
            ctx.arc(this.x, this.y, armonic * this.circleFinalSize, 0, Tau);
            ctx.fill();

            if (this.tick2 > this.circleCompleteTime) {
                this.tick2 = 0;
                this.circleCreating = false;
                this.circleFading = true;
            }
        } else if (this.circleFading) {

            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);

            ++this.tick2;
            var proportion = this.tick2 / this.circleFadeTime,
                armonic = -Math.cos(proportion * Math.PI) / 2 + .5;

            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace('light', 100).replace('alp', 1 - armonic);
            ctx.arc(this.x, this.y, this.circleFinalSize, 0, Tau);
            ctx.fill();

            if (this.tick2 >= this.circleFadeTime)
                this.circleFading = false;

        } else {

            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        }

        for (var i = 0; i < this.shards.length; ++i) {

            this.shards[i].step();

            if (!this.shards[i].alive) {
                this.shards.splice(i, 1);
                --i;
            }
        }

        if (this.tick > opts.letterContemplatingWaitTime) {

            this.phase = 'balloon';

            this.spawned = false;
            this.spawningTime = opts.balloonSpawnTime * Math.random() | 0;
            this.inflatingTime = opts.balloonBaseInflateTime + opts.balloonAddedInflateTime * Math.random() | 0;
            this.size = 0;
            this.inflate = 0;
            this.velY = opts.balloonBaseVel + opts.balloonAddedVel * Math.random();
            this.complete = false;

            this.radian = opts.balloonBaseRadian + opts.balloonAddedRadian * Math.random();
        }
    } else if (this.phase === 'balloon') {

        if (!this.spawned) {

            ++this.tick;
            if (this.tick >= this.spawningTime) {

                this.tick = 0;
                this.spawned = true;
            }

        } else {

            ++this.tick;

            if (!this.complete) {

                ++this.inflate;

                var proportion = this.inflate / this.inflatingTime,
                    x = proportion * this.sizeX,
                    y = proportion * this.sizeY;

                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x + x * Math.cos(this.radian), this.y + y * Math.sin(this.radian), this.size * proportion, 0, Tau);
                ctx.fill();

                if (this.inflate > this.inflatingTime) {

                    this.inflate = 0;
                    this.complete = true;
                }
            } else {

                this.x += Math.cos(this.radian) * this.velX;
                this.y += Math.sin(this.radian) * this.velY -= opts.upFlow;

                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Tau);
                ctx.fill();

                if (this.y < -this.size) this.phase = 'done';
            }
        }
    } else if (this.phase === 'done') {

        this.reset();
    }
};

function Shard(x, y, velX, velY, color) {

    this.x = x;
    this.y = y;
    this.velX = velX * (opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random());
    this.velY = velY * (opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random());
    this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
    this.alpha = 1;
    this.alphaReduction = .01;
    this.color = color;
    this.tick = 0;
    this.tickMax = 100;
    this.prevPoints = [];
}

Shard.prototype.step = function () {

    this.velY += opts.gravity;
    this.x += this.velX;
    this.y += this.velY;

    this.alpha -= this.alphaReduction;
    ++this.tick;

    if (this.tick >= this.tickMax)
        this.alpha = 0;

    this.prevPoints.push([this.x, this.y]);
    if (this.prevPoints.length > opts.fireworkShardPrevPoints)
        this.prevPoints.shift();
};

var text = opts.strings.join(''),

    textSize = ctx.measureText(text).width,

    middle = hw - textSize / 2,

    height = opts.charSize + opts.lineHeight,

    // for (var i = 0; i < text.length; ++i)
    //     letters.push(new Letter(text[i], middle + opts.charSpacing * i, height));

    for (var i = 0; i < text.length; ++i)
        letters.push(new Letter(text[i], middle + opts.charSpacing * i, height));
