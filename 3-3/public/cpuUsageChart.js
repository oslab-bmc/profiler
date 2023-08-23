//CPU 사용량 차트 - second page에 적용되어있음

google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(function(){ drawChart(new_option)});

var chartOption = function(target, maxValue, color, name){
  this.name = name;
  this.target = target;
  this.data = null;
  this.chart = null;
  this.options = {
    legend: { position: 'none' },
    vAxis: {minValue:0, maxValue:maxValue},
    hAxis: {
      textStyle: {
        fontSize: 11
      }
    },
    colors: [color],
    animation: {
      duration: 500,
      easing: 'in',
      startup: true
    }
  }
  
}

var new_option = new chartOption('prosessor_usage', 100, '#FF5E00', 'CPU Usage(%)');

function drawChart(option) {
  var o = option;
  if(o != null){
    //초기값일때만 처리
    if(o.chart == null && o.data == null){
      o.data = new google.visualization.DataTable();
      o.data.addColumn('string', 'time');
      o.data.addColumn('number', o.name);
      o.data.addRow(['', 0]);
      o.chart = new google.visualization.LineChart(document.getElementById(o.target));
    }

    o.chart.draw(o.data, o.options);
  }
}

function animateRenewal(option){
  var o = option;
  if (o.data.getNumberOfRows() >= 10) {
    o.data.removeRow(0);
  }

  //값 변경되는 부분
  fetch('http://'+node_server_ip+node_server_port+'/cpu/usage')
  .then(
      response => response.json()
  )
  .then(json => {
      data = JSON.stringify(json, null, 4)
      console.log(JSON.parse(data))
      var value = 0;
      var maxValue = o.options.vAxis.maxValue;
      if(maxValue <= 1){
        value = Number((Math.random() * maxValue).toFixed(1));
        // value = 0;
      }else {
        value = Math.floor(JSON.parse(data)["usage"]);
      }
      o.data.insertRows(o.data.getNumberOfRows(), [[getNowTime(), value]]);
      drawChart(o);
  });

}

setInterval(function(){
  animateRenewal(new_option);
}, 2500);

function getNowTime(){
  var d = new Date();
  var sep = ":";
  var hh = d.getHours();
  var mm = d.getMinutes();
  var ss = d.getSeconds();
  return hh + sep + mm + sep + ss;
}


