google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(function(){ drawChart2(new_option2)});

let data;
let selectedProcessor = null;

var chartOption2 = function(target, maxValue, color1, color2, name1 ,name2){
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
      1: { lineWidth: 5 }
    }
  }
  
}

var new_option2 = new chartOption2('response_time', 100, '#009BCB','#FF5733', 'CPU Usage(%)', 'Memory Usage(%)');

function initializeChartAndButtons(data) {
    const initialProcessor = Object.values(data)[0];
    const initialCpuUsage = initialProcessor.cpu_usage;
    const initialMemUsage = initialProcessor.mem_usage;

    createButtons(data);

    new_option2.data.addRow([getNowTime(), initialCpuUsage, initialMemUsage]);
    drawChart2(new_option2);

    if (!initialized) {
        initializeChartAndButtons(json);
        initialized = true;
    }
}

function drawChart2(option) {
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

function animateRenewal2(option) {
    var o = option;
    if (o.data.getNumberOfRows() >= 10) {
        o.data.removeRow(0);
    }

    // 값 변경되는 부분
    fetch('http://' + node_server_ip + node_server_port + '/process_info')
        .then(response => response.json())
        .then(json => {
            data = JSON.stringify(json, null, 4);
            console.log(JSON.parse(data));
            
            if (!selectedProcessor) {
                // 초기에 선택된 프로세서 키 설정
                selectedProcessor = Object.keys(json)[0];
            }

            const processorData = json[selectedProcessor];
            const value = Math.floor(processorData["cpu_usage"]);
            const value_mem = Math.floor(processorData["mem_usage"]);

            // 데이터 추가 후 그래프 그리기
            o.data.insertRows(o.data.getNumberOfRows(), [[getNowTime(), value, value_mem]]);
            drawChart2(o);

            // 버튼 초기화는 최초 한 번만 호출
            if (!initialized) {
                initializeChartAndButtons(json);  // 이 부분 수정
                initialized = true;
            }
            
        });
}
setInterval(function(){
  animateRenewal2(new_option2);
}, 2500);

function getNowTime() {
  var d = new Date();
  var hh = ('0' + d.getHours()).slice(-2);
  var mm = ('0' + d.getMinutes()).slice(-2);
  var ss = ('0' + d.getSeconds()).slice(-2);
  return hh + ':' + mm + ':' + ss;
}

function createButtons(data) {
    const processListContainer = document.querySelector('.list_btn_box');
    processListContainer.innerHTML = '';

    for (const processorKey in data) {
        if (data.hasOwnProperty(processorKey)) {
            const processor = data[processorKey];
            const button = document.createElement('button');
            button.classList.add('processor_list_btn');
            button.textContent = processor.Name;

            const listItem = document.createElement('li');
            listItem.classList.add('processor_list');
            listItem.appendChild(button);

            processListContainer.appendChild(listItem);

            button.addEventListener('click', () => {
                selectedProcessor = processorKey;
                updateChart(selectedProcessor, data);
            }, { passive: false });

            // 초기에 선택된 프로세서 키 설정
            if (selectedProcessor === null) {
                selectedProcessor = processorKey;
                updateChart(selectedProcessor, data);
            }
        }
    }
}


function updateChart(selectedProcessor, data) {
    const processorData = data[selectedProcessor];
    const value = Math.floor(processorData["cpu_usage"]);
    const value_mem = Math.floor(processorData["mem_usage"]);

    new_option2.data.insertRows(new_option2.data.getNumberOfRows(), [[getNowTime(), value, value_mem]]);
    drawChart2(new_option2);
}

let initialized = false;