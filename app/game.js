define(function(require,exports,module){
  require("RAF"); // 引入requestAnimationFrame
  var th = require("th"); // 引入TouchHelper模块
  /*通用函数部分*/
  function randInt(min,max){
    var min = min || 0,
      max = max || 1;
    return Math.round(Math.random()*(max-min)+min);
  }
  function loadImg(src){
    var i = document.createElement("img");
    i.src = src;
    return i;
  }
  /*游戏类*/
  function game(){
    // ---游戏参数与设置--- //
    var o = this, // 全局化this
      isDown = false, // 用户是否按下鼠标或者接触屏幕
      paused = true, // 是否暂停
      bulletTimer = 0,
      hardTimer = false,
      canvas = null,
      ctx = null,
      limit = {
        enemy : 5,
        bullet : 4
      },
      img = {
        self : loadImg("style/images/self.png"),
        enemy : loadImg("style/images/boss.png"),
        bullet : loadImg("style/images/bullet.png")
      },
      wsize = { // 屏幕尺寸
        x : $(window).width(),
        y : $(window).height()
      },
      M = Math, // 快捷方式
      qM = {
        sqr : (function(){
          var t = {};
          for(var i=0;i<1920;i++){
            (function(){
              t[i] = M.pow(i,2);
            })();
          }
          return t;
        })()
      },
      // 本机参数
      self = {
        x : 0,
        y : 0,
        size : 60
      },
      // 敌机参数
      enemy = {
        size : 40,
        initMax : 3,
        initMin : 1,
        maxspeed : 3,
        minspeed : 1
      },
      // 子弹参数
      bullet = {
        size : 30,
        speed : 15
      }
      planes = [], // 敌机容器
      bullets = [], // 子弹容器
      stageModel = (function(){ // 触屏模型
        return new th(document.getElementById("stage"));
      })(),
      stage = document.getElementById("stage"), // 场景
      score = 0;

      // 更新本机参数
      // self.obj = (function(){
      //  var t = document.createElement("div"),
      //    size = self.size;
      //  t.id = "selfPlane";
      //  self.x = (wsize.x - size)/2;
      //  self.y = wsize.y - size;
      //  $(t).css({
      //    width : size,
      //    height : size,
      //    top : self.y,
      //    left : self.x
      //  });
      //  $("#game").append(t);
      //  return t;
      // })();

    // ---实体类--- //
    // 敌机类
    function _enemy(){
      var en = this;
      en.dead = false;
      // 设置敌机的速度范围
      en.speed = randInt(enemy.minspeed,enemy.maxspeed);
      en.ctrPos = {
        x : randInt(enemy.size/2,wsize.x-enemy.size/2),
        y : -enemy.size/2
      };
      en.cssPos = {
        x : en.ctrPos.x-enemy.size/2,
        y : -enemy.size
      };
      function _move(){
        en.ctrPos.y += en.speed;
        en.cssPos.y = en.ctrPos.y-enemy.size/2;
        ctx.save();
        ctx.drawImage(img.enemy,en.cssPos.x,en.cssPos.y,enemy.size,enemy.size);
        ctx.restore();
        if(en.ctrPos.y>wsize.y){
          _kill();
        }
      }
      function _kill(){
        en.dead = true;
      }
      en.kill = _kill;
      en.move = _move;
    }
    // 子弹类
    function _bullet(){
      var bu = this;
      bu.dead = false;
      bu.ctrPos = {
        x : self.x+self.size/2,
        y : self.y+bullet.size/2
      };
      bu.cssPos = {
        x : bu.ctrPos.x-bullet.size/2,
        y : bu.ctrPos.y-bullet.size/2
      };
      function _kill(){
        bu.dead = true;
      }
      function _move(){
        bu.ctrPos.y -= bullet.speed;
        bu.cssPos.y = bu.ctrPos.y-bullet.size/2;
        ctx.save();
        ctx.drawImage(img.bullet,bu.cssPos.x+10,bu.cssPos.y,10,30);
        ctx.restore();
        if(bu.ctrPos.y<0){
          _kill();
        }
      };
      bu.kill = _kill;
      bu.move = _move;
    }


    // ---用户事件处理函数--- //
    function _tdown(){
      isDown = true;
      self._x = self.x;
      self._y = self.y;
    };
    function _tup(){
      isDown = false;
      self._x = self.x;
      self._y = self.y;
    };
    function _tmove(e){
      e.preventDefault();
      _movePlane(self._x+stageModel.diff.x,self._y+stageModel.diff.y);
    };

    // ---辅助函数--- //
    // 移动本机
    function _movePlane(x,y){
      self.x = (x>(wsize.x-self.size))||(x<0) ? self.x : x;
      self.y = (y>(wsize.y-self.size))||(y<0) ? self.y : y;
      // 更新本机位置
      /*
      $(self.obj).css({
        left : self.x,
        top : self.y
      });
      */

      // self.obj.style.left = self.x + "px";
      // self.obj.style.top = self.y + "px";
    }
    // 检测敌机是否击中本机或被子弹击中
    function _checkEnemyHit(){
      var cp = {
        x : self.x+self.size/2,
        y : self.y+self.size/2
      };
      for(var i=0,pl=planes.length;i<pl;i++){
        // 检测是否击中主机
        var p = planes[i],
          dist = qM.sqr[M.abs(p.ctrPos.x-cp.x)]+qM.sqr[M.abs(p.ctrPos.y-cp.y)];
        if(dist < qM.sqr[((self.size+enemy.size)/3)>>0]){
          gameover();
          return;
        }
        // 检测是否打中敌机
        for(var j=0,bl=bullets.length;j<bl;j++){
          var b = bullets[j],
            dist = qM.sqr[M.abs(p.ctrPos.x-(b.ctrPos.x+bullet.size/2))]+qM.sqr[M.abs(p.ctrPos.y-(b.ctrPos.y+bullet.size/2))];
          if(dist < qM.sqr[((bullet.size+enemy.size)/2)>>0]){
            b.kill();
            p.kill();
            score += 100;
          }
        }
      }
      // // 优化碰撞检测
      // for(var i=0,pl=planes.length;i<pl;i++){
      //  // 检测是否击中主机
      //  var p = planes[i];
      //  if(M.abs(p.ctrPos.y-cp.y)<((self.size+enemy.size)/3)){
      //    if(M.abs(p.ctrPos.x-cp.x)<((self.size+enemy.size)/3)){
      //      gameover();
      //      return;
      //    }
      //  }
      //  // 检测是否打中敌机
      //  for(var j=0,bl=bullets.length;j<bl;j++){
      //    var b = bullets[j];
      //    if(M.abs(p.ctrPos.y-(b.ctrPos.y+bullet.size/2))<((bullet.size+enemy.size)/3)){
      //      if(M.abs(p.ctrPos.x-(b.ctrPos.x+bullet.size/2))<((bullet.size+enemy.size)/3)){
      //        b.kill();
      //        p.kill();
      //        score += 100;
      //      }
      //    }
      //  }
      // }
    }
    // 更新敌机
    function _updateEnemy(){
      // 移除多余敌机
      for(var i=0,bl=planes.length;i<bl;i++){
        if(planes[i].dead===true){
          planes.splice(i,1);
          i--;
          bl--;
        }
      }
      // 维持敌机数量
      if(planes.length<limit.enemy){
        planes.push(new _enemy());
      }
      // 移动敌机
      for(var i=0,bl=planes.length;i<bl;i++){
        planes[i].move();
      }
    }
    // 更新子弹
    function _updateBullet(){
      // 移除多余子弹
      for(var i=0,bl=bullets.length;i<bl;i++){
        if(bullets[i].dead===true){
          bullets.splice(i,1);
          i--;
          bl--;
        }
      }
      // 如果子弹太少
      if(bullets.length<limit.bullet){
        if(!bulletTimer){
          bulletTimer = setTimeout(function(){
            bullets.push(new _bullet());
            bulletTimer = 0;
          },120)
        }
      }
      // 移动子弹
      for(var i=0,bl=bullets.length;i<bl;i++){
        bullets[i].move();
      }
    }
    // 阻止游戏操作
    function _stopReact(){
      stageModel.ontouchstart = function(){};
      stageModel.ontouchmove = function(e){e.preventDefault()};
      stageModel.ontouchend = function(){};
    }
    // 响应用户操作
    function _react(){
      stageModel.ontouchstart = _tdown;
      stageModel.ontouchmove = _tmove;
      stageModel.ontouchend = _tup;
    }

    // ---场景函数--- //
    // 渲染场景
    function _render(){
      if(paused===false){
        // 清屏
        _clearCanvas();
        // 碰撞检测
        _checkEnemyHit();
        // 更新场景
        _updateEnemy();
        _updateBullet();

        ctx.save();
        ctx.drawImage(img.self,self.x,self.y,self.size,self.size);
        ctx.restore();

        $("#score>span").html(score);
        requestNextAnimationFrame(arguments.callee);
      }
    }
    // 难度、分数、参数的动态设置
    function _hard(){
      if(!paused){
        var r = (score/20000)>>0;
        enemy.maxspeed = (enemy.initMax>>0) + r;
        // enemy.minspeed = enemy.initMin + r;
      }
      hardTimer = setTimeout(arguments.callee,1000);
    }
    // canvas清屏
    function _clearCanvas(){
      ctx.save();
      ctx.fillStyle = "#c3c9c9";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.restore();
    }
    // 重设场景
    function _resetStage(){
      wsize.x = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      wsize.y = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      if(canvas===null){
        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
      }
      canvas.style.cssText = "width:"+wsize.x+"px;height:"+wsize.y+"px;";
      canvas.width = wsize.x;
      canvas.height = wsize.y;
      _clearCanvas();
      stage.appendChild(canvas);
      //stage.style.backgroundColor = "#c3c9c9";
      self.x = (wsize.x - self.size)/2;
      self.y = wsize.y - self.size;
      $(".btn").css({
        left : "",
        top : "",
        right : 10,
        top : 10
      });
      $("#play,#reset").css({
        top : self.y/2,
        left : self.x
      });
      $("#stage>div").css({
        width : wsize.x,
        height : wsize.y,
        position : "absolute",
        top : 0,
        left : 0
      }).each(function(){
        $(this).css("z-index",10-$(this).index());
      });
    }

    // ---控制函数--- //
    function init(){
      // 重绘屏幕
      _resetStage();
      window.addEventListener("resize",_resetStage,false);

      // 阻止用户操作
      _stopReact();

      $(".btn,.ldtxt").hide();
      $("#play").show();
      // document.addEventListener("keydown",kdown,false);
      // document.addEventListener("keyup",kup,false);

      // 开始动态难度
      _hard();

      // debug
      // setInterval(function(){
      //  console.log(bullets);
      //  console.log(planes);
      // },3000);
    }
    function play(){
      // 响应用户操作
      _react();
      paused = false;
      $("#play,#mask,#reset").hide();
      $("#pause").show();
      _render();
    }
    function pause(){
      // 阻止用户操作
      _stopReact();
      paused = true;
      $("#play,#mask").show();
      $("#pause").hide();
    }
    function reset(){
      _resetStage();
      score = 0;
      bullets = [];
      planes = [];
      $(".bullet,.enemy").remove();
      // $("#selfPlane").css({
      //  left : (wsize.x - self.size)/2,
      //  top : wsize.y - self.size
      // });
      play();
    }
    function gameover(){
      // 阻止用户操作
      _stopReact();
      paused = true;
      $(".btn").hide();
      $("#reset,#mask").show();
      alert("完了！你的分数是："+score);
    }

    // 外部接口
    this.init = init;
    this.play = play;
    this.reset = reset;
    this.pause = pause;
    this.gameover = gameover;
    // Publlic
    //if(game.prototype._initialed!==true){
    //  game.prototype._initialed = true;
    //}
  }
  module.exports = game;
});
