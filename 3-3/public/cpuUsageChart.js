//CPU 사용량 차트 - second page에 적용되어있음

google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(function(){ drawChart(new_option)});

var chartOption = function(target, maxValue, color1, color2, name1 ,name2){
  this.name1 = name1;
  this.name2 = name2;
  this.target = target;
  this.data = null;
  this.chart = null;
  this.options = {
    legend: { position: 'bottom' },
    vAxis: {
      minValue:0,
      maxValue:maxValue,
      ticks: [0, 25, 50, 75, 100]
    },
    hAxis: {
      textStyle: {
        fontSize: 11
      }
    },
    colors: [color1, color2],
    animation: {
      duration: 500,
      easing: 'in',
      startup: true
    },
    series: {
      0: { lineWidth: 5 },
      1: { lineWidth: 5 }//라인 하나더 추가 (Memory)
    }
  }
  
}

var new_option = new chartOption('prosessor_usage', 100, '#009BCB','#FF5733', 'CPU Usage(%)', 'Memory Usage(%)');

function drawChart(option) {
  var o = option;
  if(o != null){
    //초기값일때만 처리
    if(o.chart == null && o.data == null){
      o.data = new google.visualization.DataTable();
      o.data.addColumn('string', 'time');
      o.data.addColumn('number', o.name1);
      o.data.addColumn('number', o.name2)
      o.data.addRow(['',0, 0]);
      o.data.addRow(['',1, 1]);
      o.chart = new google.visualization.LineChart(document.getElementById(o.target));
    }

    o.chart.draw(o.data, o.options);
  }
}
// "Profiler Log" 요소를 가져옵니다.
const logContainer = document.querySelector('.processor_log');

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
      var value_mem = 0;
      var maxValue = o.options.vAxis.maxValue;
      if(maxValue <= 1){
        value = Number((Math.random() * maxValue).toFixed(1));
        value_mem = Number((Math.random()*maxValue).toFixed(1));
        // value = 0;
      }else {
        value = Math.floor(JSON.parse(data)["usage"]);
        value_mem = Math.floor(JSON.parse(data)["Memory_usage"]);
      }
      o.data.insertRows(o.data.getNumberOfRows(), [[getNowTime(), value, value_mem]]);
      drawChart(o);
  });

  const processList = [];
  
  fetch('http://' + node_server_ip + node_server_port + '/signal')//hdw
  .then(response => response.json())
  .then(json => {
    data = JSON.stringify(json, null, 4)
    Jsondata = JSON.parse(data)
    signalKeys = Object.keys(Jsondata).filter(key => key.startsWith("signal"));
    signalCount = signalKeys.length;

    // ul 요소에 대한 참조를 생성합니다.
    const ulElement = document.createElement('ul');
    ulElement.classList.add('processlog_list');
    ulElement.innerHTML = '';
    // processList.splice(0,processList.length);
    processList.length=0;

    for(let i=0;i<signalCount;i++){

      json_str = "signal"+i;
      // console.log(Jsondata[json_str]["signo"])
      processList.push("time = "+Jsondata[json_str]["time"]+" | "+"signal = "+Jsondata[json_str]["signo"]);

    }
    // 각 프로세스 목록에 대해 li 요소를 생성하고 추가합니다.
    processList.forEach((process) => {
      // 새로운 li 요소를 생성합니다.
      const liElement = document.createElement('li');

      // 새로운 button 요소를 생성합니다.
      const button = document.createElement('div');

      // 버튼에 클래스를 추가합니다.
      button.classList.add('processlog_list');

      // 버튼의 텍스트로 주어진 프로세스 목록을 설정합니다.
      button.textContent = process;

      // 버튼을 li 요소에 추가합니다.
      liElement.appendChild(button);

      // li 요소를 ul 요소에 추가합니다.
      ulElement.appendChild(liElement);

      // hr 요소를 생성하여 li 요소 뒤에 추가합니다.
      const hrElement = document.createElement('hr');
      ulElement.appendChild(hrElement);
    });

    // 마지막 hr 요소를 삭제합니다.
    ulElement.removeChild(ulElement.lastChild);
    logContainer.innerHTML = ''; //hdw
    // ul 요소를 "Profiler Log" 컨테이너에 추가합니다.
    logContainer.appendChild(ulElement);
  });
}

setInterval(function(){
  animateRenewal(new_option);
}, 2500);

function getNowTime() {
  var d = new Date();
  var hh = ('0' + d.getHours()).slice(-2);
  var mm = ('0' + d.getMinutes()).slice(-2);
  var ss = ('0' + d.getSeconds()).slice(-2);
  return hh + ':' + mm + ':' + ss;
}
