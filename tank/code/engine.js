
/**
GameBoard 职责：
	保存一个对象列表，把精灵添加到列表中及删除；
	遍历该对象列表；
	以之前的面板的方式响应：step、draw函数，调用对象列表中的每个对象的相应方法；
	需要检测对象之间的碰撞


**/
var SpriteSheet = new function(){ //new function创建保证了SpriteSheet对象的 唯一性；
	this.map = {};
	/*
	* @spriteData 精灵数据
	* @callback 图像onload方法的回调函数
	*/
	this.load = function(spriteData,callback){
		this.map = spriteData;
		this.image = new Image();
		this.image.onload = callback;
		this.image.src = 'img/tank.png';
	};

	/* 绘制精灵DE上下文
	* @spriteData 映射表中精灵名称
	* @x,y 绘制精灵的x,y位置
	*/
	this.draw = function(ctx,sprite,x,y,frame){
		var s = this.map[sprite];
		if(!frame) frame = 0;
		ctx.drawImage(this.image,s.sx+frame*s.w,s.sy,s.w,s.h,x,y,s.w,s.h);
	};
}


var TitleScreen = function TitleScreen(title,subtitle,callback){
	this.step = function(dt){
		if(Game.keys['fire'] && callback) callback();
	};
	this.draw = function(ctx){
		ctx.fillStyle = "#fff";
		ctx.textAlign = "center";

		ctx.font = "bold 40px bangers";
		ctx.fillText(title,Game.width/2,Game.height/2);

		ctx.font = "bold 20px bangers";
		ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
	}
}

var GameBoard = function (){
	var board = this;
	this.objects = [];
	this.cnt = []; // 存储对象的数组

	// 添加对象到列表
	this.add = function(obj){
		obj.board = this; // 自身所属的面板
		this.objects.push(obj);
		this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1; // 计数，某一时间 不同类型的活动对象的数目
		return obj;
	}

	// 标记要删除的对象 并将其删除 - 不在遍历途中直接进行删除而影响便利过程；
	this.remove = function (obj) {
		var wasStillAlive = this.removed.indexOf(obj) != -1; //首先检查是否已被删除；
		if(wasStillAlive) {
			this.removed.push(obj);
		}
		return wasStillAlive;
	}
	// 重置removed对象数组
	this.resetRemoved = function(){
		this.removed = [];
	}
	// 删除已标记的对象
	this.finalizeRemoved = function (){
		for(var i = 0,len = this.removed.length;i<len;i++){
			var idx = this.objects.indexOf(this.removed[i]);
			if(idx != -1){
				this.cnt[this.removed[i].type]--;
				this.objects.splice(idx, 1); //删除
			}
		}
	}

	// 遍历 每个对象
	this.iterate = function(funcName){
		var args = Array.prototype.slice.call(arguments,1); // 接受不同数量的参数,取出除了第一个参数之外的所有参数；
		for(var i = 0,len = this.objects.length;i<len;i++){
			var obj = this.objects[i]; // 第i个属性
			obj[funcName].apply(obj,args); 
		}
	}

	this.detect = function(func){
		for(var i = 0,val = null,len = this.objects.length;i<len;i++){
			// 判断 调用的func 使用的参数是被当成this上下文传入的对象。
			if(func.call(this.objects[i])) return this.objects[i]; // true，返回对象
		}
		return false;
	}

	this.step = function(dt){
		this.resetRemoved();
		this.iterate('step',dt); 
		this.finalizeRemoved();
	};

	this.draw = function(ctx){
		this.iterate('draw',ctx);
	}

	// 碰撞判断 对象1和对象2上下边框
	this.overlap = function(o1,o2){
		return !((o1.y + o1.h-1 < o2.y) || (o1.y > o2.y + o2.h-1)||
				 (o1.x + o1.w-1 < o2.x) || (o1.x > o2.x + o2.w-1));
	}

	// 碰撞处理 不同类型的对象只能和某些对象碰撞
	// eg: 地方飞船不应和自己一方的飞船碰撞，应和玩家与玩家发射的导弹碰撞
	this.collide = function (obj,type) {
		return this.detect(function(){
			if(obj != this){
				var col = (!type || this.type & type) && board.overlap(obj,this);
				return col ? this : false;
			}
		})
	}

}


var Sprite = function(){}
Sprite.prototype.setup = function(sprite,props){
	this.sprite = sprite;
	this.merge(props);
	this.frame = this.frame || 0;
	this.w = SpriteSheet.map[sprite].w;
	this.h = SpriteSheet.map[sprite].h;
}

Sprite.prototype.merge = function(props) {
	if(props){
		for(var prop in props){
			this[prop] = props[prop];
		}
	}
}
Sprite.prototype.draw = function(ctx){
	SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
}
Sprite.prototype.hit = function(damage){
	this.board.remove(this);
}

var Level = function(levelData,callback) {
  this.levelData = [];
  for(var i =0; i<levelData.length; i++) {
    this.levelData.push(Object.create(levelData[i]));
  }
  this.t = 0;
  this.callback = callback;
};
Level.prototype.step = function(dt) {
  var idx = 0, remove = [], curShip = null;

  // Update the current time offset
  this.t += dt * 1000;

  //   Start, End,  Gap, Type,   Override
  // [ 0,     4000, 500, 'step', { x: 100 } ]
  while((curShip = this.levelData[idx]) && 
        (curShip[0] < this.t + 2000)) {
    // Check if we've passed the end time 
    if(this.t > curShip[1]) {
      remove.push(curShip);
    } else if(curShip[0] < this.t) {
      // Get the enemy definition blueprint
      var enemy = enemies[curShip[3]],
          override = curShip[4];

      // Add a new enemy with the blueprint and override
      this.board.add(new Enemy(enemy,override));

      // Increment the start time by the gap
      curShip[0] += curShip[2];
    }
    idx++;
  }

  // Remove any objects from the levelData that have passed
  for(var i=0,len=remove.length;i<len;i++) {
    var remIdx = this.levelData.indexOf(remove[i]);
    if(remIdx != -1) this.levelData.splice(remIdx,1);
  }

  // If there are no more enemies on the board or in 
  // levelData, this level is done
  if(this.levelData.length === 0 && this.board.cnt[OBJECT_ENEMY] === 0) {
    if(this.callback) this.callback();
  }

};

Level.prototype.draw = function(ctx) { };

// 得分绘制；
var GamePoints = function(){
	Game.points = 0; //得分
	var pointsLength = 8;
	this.draw = function(ctx){
		ctx.save();

		ctx.font = "bold 18px arial";
		ctx.fillStyle = "#fff";

		var txt = "" + Game.points;
		var i = pointsLength - txt.length, zeros = "";
		while(i-- > 0){ zeros += "0";}

		ctx.fillText(zeros + txt,10,20);

		ctx.restore();
	}
	this.step = function(dt){ }
}






















