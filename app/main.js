define(function(require){
  // 当jQuery没有用define定义的时候
  // 以下语句就是把jquery引入页面而已
  // var jq = require("jq");
  var mask = $("<div id='mask'><div class='ldtxt'>loading...</div></div>");
  mask.on("touchstart",function(e){
    var e = e || window.event;
    e.preventDefault();
  });
  mask.css({
    width : $(window).width(),
    height : $(window).height(),
    position : "fixed",
    top : 0,
    left : 0,
    "background-color" : "rgba(0,0,0,0.5)"
  });
  mask.find(".ldtxt").css({
    width : 100,
    height : 30,
    "border-radius" : "5px",
    "text-align" : "center",
    top : ($(window).height()-30)/2,
    left : ($(window).width()-100)/2,
    position : "absolute",
    "background-color" : "rgba(0,0,0,0.5)",
    "line-height" : "30px",
    color : "#FFF"
  });
  $("#controls").after(mask);
  require.async("app/game",function(game){
    var game = new game(),
      uact = "ontouchend" in window ? "tap" : "click";
    game.init();
    $("#play")[uact](game.play);
    $("#pause")[uact](game.pause);
    $("#reset")[uact](game.reset);
    mask.hide();
  });
});
