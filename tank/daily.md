### 学习内容：

#### h5开发思想
	最大化实际使用面积

##### h5坦克大战 :
   
1. 本周通过对H5游戏开发之坦克大战的教程学习，了解了相关Canvas游戏开发的相关知识。  
2. 游戏开发主要分为两个部分：游戏数据 & 游戏引擎，将其独立开来，也便于分块测试和构建。 
3. 游戏数据包含：
	对游戏中精灵对象(eg:玩家、敌人、炮弹、爆炸等)的抽取，
	常量的定义，游戏状态的控制(eg:开始，结束，等级，分数等)
4. 游戏引擎包含：
	游戏对象的初始化
	Gameboard对象-游戏棋盘：对精灵的增删，对象数据的统一调用方法的定义，对象间的碰撞检测等
	触摸控制
	得分控制
5. 可重用构建。



对于移动端-界面大小设置
Check if browser has support for touch events
	exit early if screen is larger than a max size or no touch support
Check if the user is in landscape mode
	if so, ask them to rotate the browser
Resize container to be larger than the page to allow removal of address bar
Scroll window slightly to force removal of address bar
Set the container size to match the window size
Check if you're on a larger device (like a tablet)
	if so, set the view size to be twice the picel size for performance
	If not, set canvas to match the size of the window
Finally, set the canvas to absolute position in the top of the window

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

H5常用标准
- SVG
- CSS3
- WebGL
- Web Workers
- Web Storage
- Web SQL Database
- Web Sockets
- Gellocation
- Microdata
- Device API
- File API
















