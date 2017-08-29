// 游戏数据 & 游戏引擎 的独立，便于分块测试和构建


/**
Game 对象 捆绑所有东西
SpriteSheet 对象 加载和绘制精灵
GameBoard 对象 显示、更新精灵元素和处理精灵元素碰撞

**/

// var canvas = document.getElementById('game');

// var ctx = canvas.getContext && canvas.getContext('2d');

// if(!ctx) {
// 	alert('Please upgrate ur browser');
// }else{
// 	startGame();
// }

// function startGame(){
// 	SpriteSheet.load({
// 		ship: {sx: 0, sy: 0, w: 18, h: 35, frames: 3}
// 	},function(){
// 		SpriteSheet.draw(ctx,"ship",0,0);
// 		SpriteSheet.draw(ctx,"ship",100,50);
// 		SpriteSheet.draw(ctx,"ship",150,100,1);
// 	});
// }

//添加对象类型
var OBJECT_PLAYER = 1,
	OBJECT_PLAYER_PROJECTILE = 2,
	OBJECT_ENEMY = 4,
	OBJECT_ENEMY_PROJECTILE = 8,
	OBJECT_POWERUP = 16;

var sprites = {
	ship: { sx: 0, sy:0, w:37, h:42, frames:1 },
	missile: { sx: 0, sy:30, w:2, h:10, frames:1},
	enemy_purple:{ sx: 37, sy:0, w:42, h:43, frames:1},
	enemy_bee:{ sx: 79, sy:0, w:37, h:43, frames:1},
	enemy_ship:{ sx: 116, sy:0, w:42, h:43, frames:1},
	enemy_circle:{ sx: 158, sy:0, w:32, h:33, frames:1},
	explosion:{ sx: 0, sy:64, w:64, h:64, frames:12},
	enemy_missile:{ sx: 9, sy: 42, w: 3, h: 20, frame: 1}
};


var enemies = {
  straight: { x: 0,   y: -50, sprite: 'enemy_ship', health: 10, 
              E: 100 , firePercentage: 0.01},
  ltr:      { x: 0,   y: -100, sprite: 'enemy_purple', health: 10, 
              B: 75, C: 1, E: 100, missiles: 2  },
  circle:   { x: 250,   y: -50, sprite: 'enemy_circle', health: 10, 
              A: 0,  B: -100, C: 1, E: 20, F: 100, G: 1, H: Math.PI/2 },
  wiggle:   { x: 100, y: -50, sprite: 'enemy_bee', health: 20, 
              B: 50, C: 4, E: 100, firePercentage: 0.001, missiles: 2 },
  step:     { x: 0,   y: -50, sprite: 'enemy_circle', health: 10,
              B: 150, C: 1.2, E: 75 }
};

var startGame = function(){
	// SpriteSheet.draw(Game.ctx,"ship",100,100,1);
	Game.setBoard(0,new Starfield(20,0.4,100,true));
	Game.setBoard(1,new Starfield(50,0.6,100));
	Game.setBoard(2,new Starfield(100,1.0,50));
	Game.setBoard(3,new TitleScreen("Alien Invasion", "Press space to start playing",playGame));
}

// 关卡数据
var level1 = [
 // Start,   End, Gap,  Type,   Override
  [ 0,      4000,  500, 'step' ],
  [ 6000,   13000, 800, 'ltr' ],
  [ 10000,  16000, 400, 'circle' ],
  [ 17800,  20000, 500, 'straight', { x: 50 } ],
  [ 18200,  20000, 500, 'straight', { x: 90 } ],
  [ 18200,  20000, 500, 'straight', { x: 10 } ],
  [ 22000,  25000, 400, 'wiggle', { x: 150 }],
  [ 22000,  25000, 400, 'wiggle', { x: 100 }]
];

var playGame = function () {
	// Game.setBoard(3,TitleScreen("Alien Invasion", "Game started..."));
	// Game.setBoard(3,new PlayerShip());
	var board = new GameBoard();
	// board.add(new Enermy(enemies.basic));
	// board.add(new Enermy(enemies.basic, {x: 200}));
	board.add(new PlayerShip());
	Game.setBoard(3,board);
	Game.setBoard(5,new GamePoints(0));
}

var winGame = function() {
  Game.setBoard(3,new TitleScreen("You win!", 
                                  "Press fire to play again",
                                  playGame));
};

var loseGame = function() {
  Game.setBoard(3,new TitleScreen("You lose!", 
                                  "Press fire to play again",
                                  playGame));
};


window.addEventListener("load", function(){
	Game.initialize("game",sprites,startGame);
})

var Game = new function(){
	/* 初始化例程
	* @canvasEleId 画布id
	* @sprite_data 精灵数据
	* @callback 回调
	*/
	this.initialize = function(canvasEleId,sprite_data,callback){
		this.canvas = document.getElementById(canvasEleId);

		this.playerOffset = 10;
		this.canvasMultiplier = 1;
		this.setupMobile();

		this.width = this.canvas.width;
		this.height = this.canvas.height;

		this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
		if(!this.ctx){
			return alert("Please upgrate ur browser");
		}

		this.setupInput();
		if(this.mobile){
			this.setBoard(4,new TouchControls());
		}

		this.loop();

		SpriteSheet.load(sprite_data,callback);
	}

	/* 按键行为控制 
	*/
	var KEY_CODES = { 37:'left', 39:'right', 32:'fire'};
	this.keys ={};
	this.setupInput = function(){
		window.addEventListener('keydown',function(e){
			if(KEY_CODES[event.keyCode]){
				Game.keys[KEY_CODES[event.keyCode]] = true;
				e.preventDefault(); // 阻止按键的默认行为，如滚动视图；
			}
		},false);
		window.addEventListener('keyup',function(e){
			if(KEY_CODES[event.keyCode]){
				Game.keys[KEY_CODES[event.keyCode]] = false;
				e.preventDefault();
			}
		},false);
	}

	/* 循环控制
	*/
	var boards = []; //已更新并已绘制岛画布上的游戏的各块内容
	this.loop = function(){
		var dt = 30/1000;
		for(var i = 0, len = boards.length; i<len; i++){ //遍历所有面板，检查每个下标位置是否有面板
			if(boards[i]){
				boards[i].step(dt);
				boards[i] && boards[i].draw(Game.ctx);
			}
		}
		setTimeout(Game.loop, 30); //注：不能用this.loop
	}

	/* 设置loop方法用到的一个游戏面板，切换活动的GameBoard
	*/
	this.setBoard = function(num,board) {
		boards[num] = board;
	}
	this.setupMobile = function(){
		var container = document.getElementById("container"),
			hasTouch = !!('outouchstart' in window),
			w = window.innerWidth, h = window.innerHeight;

		if(hasTouch) {mobile = true;}

		if(screen.width >= 1280 || !hasTouch) {return false;}

		if(w > h){
			alert("Pls rotate the device and then click ok");
			w = window.innerWidth;
			h = window.innerHeight;
		}

		container.style.height = h*2 + "px";
		window.scrollTo(0,1);
		h = window.innerHeight + 2;

		container.style.height = h + "px";
		container.style.width = w + "px";
		container.style.padding = 0;

		if(h >= this.canvas.height * 1.75 || swx >= this.canvas.height * 1.75){
			this.canvasMultiplier = 2;
			this.canvas.width = w/2;
			this.canvas.height = h/2;
			this.canvas.style.width = w + "px";
			this.canvas.style.height = h + "px";
		}else{
			this.canvas.width = w;
			this.canvas.height = h;
		}
		this.canvas.style.position = "absolute";
		this.canvas.style.left = "0";
		this.canvas.style.top = "0";

	}
}





var Starfield = function(speed,opacity,numStars,clear){

	var stars = document.createElement("canvas");
	stars.width = Game.width;
	stars.height = Game.height;
	var starCtx = stars.getContext("2d");
	var offset = 0;

	if(clear){
		starCtx.fillStyle = "#000";
		starCtx.fillRect(0,0,stars.width,stars.height);
	}

	starCtx.fillStyle = "#fff";
	starCtx.globalAlpha = opacity; // 设置cavas元素的不透明度。
	for(var i=0;i<numStars;i++){
		starCtx.fillRect(Math.floor(Math.random()*stars.width),
						Math.floor(Math.random()*stars.height),
						2,2);
	}

	this.draw = function(ctx){
		var intOffset = Math.floor(offset);
		var remaining = stars.height - intOffset;
		if(intOffset > 0){
			ctx.drawImage(stars,0,remaining,stars.width,intOffset,0,0,stars.width,intOffset);
		}
		if(remaining > 0){
			ctx.drawImage(stars,0,0,stars.width,remaining,0,intOffset,stars.width,remaining);
		}
	}

	this.step = function (dt) {
		offset += dt * speed;
		offset = offset % stars.height; // 取模 来确保offset值位于0和Starfield高度之间
	}

}


var PlayerShip = function(){
	this.setup('ship',{vx:0, frame:1, reloadTime:0.25, maxVel:200})

	// this.w = SpriteSheet.map['ship'].w;
	// this.h = SpriteSheet.map['ship'].h;
	this.x = Game.width/2 - this.w/2;
	this.y = Game.height - this.h;
	// this.vx = 0;
	// this.reloadTime = 0.25;
	this.reload = this.reloadTime; // 避免玩家在按下发射键开始游戏时 立刻发射导弹

	this.step = function(dt){
		this.maxVel = 200;
		this.step = function(dt){
			if(Game.keys['left']){ // 检查用户输入
				this.vx = -this.maxVel; // 更新坐标
			}else if(Game.keys['right']){
				this.vx = this.maxVel;
			}else{
				this.vx = 0;
			}
			this.x += this.vx * dt;

			// 检查更新后的x 是否在 边界内；
			if(this.x<0){
				this.x =0;
			}else if (this.x > Game.width - this.w) {
				this.x = Game.width - this.w;
			};
		}

		this.reload -= dt;
		if(Game.keys['fire'] && this.reload < 0){
			Game.keys['fire'] = false;
			this.reload = this.reloadTime;
			this.board.add(new PlayerMissile(this.x,this.y + this.h/2));
			this.board.add(new PlayerMissile(this.x + this.w,this.y + this.h/2));
		}
	}
	// this.draw = function(ctx){
	// 	SpriteSheet.draw(ctx,'ship',this.x,this.y,1);
	// }
}
PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;

PlayerShip.prototype.hit = function(damage) {
  if(this.board.remove(this)) {
    loseGame();
  }
};

// 炮弹精灵
var PlayerMissile = function(x,y){
	// this.w = SpriteSheet.map['missile'].w;
	// this.h = SpriteSheet.map['missile'].h;
	this.setup('missile',{vy: -700, damage: 10 });
	// x居中
	this.x = x - this.w/2;
	// 
	this.y = y - this.h;
	this.vy = -700;
};

PlayerMissile.prototype.step = function(dt){
	this.y += this.vy * dt;
	var collison = this.board.collide(this.OBJECT_ENEMY);
	if(conllision){
		collison.hit(this.damage);
		this.board.remove(this);
	}else if(this.y < -this.h) {
		this.board.remove(this);
	}
}

// PlayerMissile.prototype.draw = function(ctx){
// 	SpriteSheet.draw(ctx,'missile',this.x,this.y);
// }

PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

/**
* @blueprint 复制蓝本
* @override 重写参数
*/
var Enermy = function(blueprint,override){
	// var baseParameters = {
	// 	A:0, B:0, C:0, D:0,
	// 	E:0, F:0, G:0, H:0
	// }

	// // 设置所有基本参数为0
	// for(var prop in baseParameters){
	// 	this[prop] = baseParameters[prop];
	// }

	// // 从blueprint复制所有的属性
	// for(prop in blueprint){
	// 	this[prop] = blueprint[prop];
	// }

	// // 从override复制多有属性，如果存在；
	// if(override){
	// 	for(prop in override){
	// 		this[prop] = override[prop];
	// 	}
	// }

	// //基于对象的sprite属性设置w,h - 地方飞船可能使用不同的精灵；
	// this.w = SpriteSheet.map[this.sprite].w;
	// this.h = SpriteSheet.map[this.sprite].h;
	// this.t = 0; //纪录该精灵已经存活的时间；

    this.merge(this.baseParameters);
    this.setup(blueprint.sprite,blueprint);
    this.merge(override);
}
Enermy.prototype = new Sprite();
Enermy.prototype.baseParameters = {
	A:0, B:0, C:0, D:0,
	E:0, F:0, G:0, H:0,
	t:0,firePercentage:0.01,
	reloadTime:0.75, reload:0
}
Enermy.prototype.step = function(dt){
	this.t += dt;
	this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
	this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);
	this.x += this.vx * dt;
	this.y += this.vy * dt;

	var conllision = this.board.collide(this,OBJECT_PLAYER);
	if(collision){
		collision.hit(this.damage);
		this.board.remove(this);
	}
	if(this.reload <= 0 && Math.random() < this.firePercentage){
		this.reload = this.reloadTime;
		if(this.missiles == 2){
			this.board.add(new EnemyMissile(this.x+this.w-2,this.y+this.h/2))
			this.board.add(new EnemyMissile(this.x+2,this.y+this.h/2))
		}else{
			this.board.add(new EnemyMissile(this.x+this.w/2,this.y+this.h))
		}
	}
	this.reload -= dt;

	if(this.y > Game.height || this.x < -this.w ||
		this.x > Game.width){
		this.board.remove(this);
	}
}
Enermy.prototype.draw = function(ctx){
	SpriteSheet.draw(ctx,this.sprite,this.x,this.y);
}
Enermy.prototype.type = OBJECT_ENEMY;
Enermy.prototype.hit = function(damage){
	this.health -= damage;
	if(this.health <= 0){
		if(this.board.remove(this)){
			Game.points += this.points || 100;
			this.board.add(new Explosion(this.x +this.w/2,
				this.y + this.h/2));
		}
	}
}

// 爆炸
var Explosion = function(centerX,centerY){
	this.setup('explosion',{frame: 0});
	this.x = centerX - this.w/2; // 居中
	this.y = centerY - this.h/2;
	this.subFrame = 0;
}
Explosion.prototype = new Sprite();
// 播放帧 后 删除
Explosion.prototype.step = function(dt){
	this.frame = Math.floor(this.subFrame++ / 3);
	if(this.subFrame >= 36){
		this.board.remove(this);
	}
}

var EnemyMissile = function(x,y){
	this.setup('enemy_missile',{vy: 200, damage: 10});
	this.x = x - this.w/2;
	this.y = y;
};
EnemyMissile.prototype = new Sprite();
EnemyMissile.prototype.type = OBJECT_ENEMY_PROJECTILE;
EnemyMissile.prototype.step = function(dt){
	this.y += this.vy * dt;
	var collision = this.board.collide(this,OBJECT_PLAYER);
	if(collision){
		conllision.hit(this.damage);
		this.board.remove(this);
	}else if(this.y > Game.height){
		this.board.remove(this);
	}
}





















