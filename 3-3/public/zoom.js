document.onmousewheel = function() {
  var e = window.event;
  var pressedkey = String.fromCharCode(event.keyCode).toLowerCase();
if(event.ctrlKey) {
var key_type= event.returnValue=false;
}
// 마우스휠 이벤트와 ctrl키가 눌렸을때
    if (e.srcElement && key_type==false){
return false;
}
}