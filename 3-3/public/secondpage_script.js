//app mode scrpt file
var device_driver_info;
func_name_flag = 1;
count_flag = 1;
time_flag = 1;
flag = 0;
var playAlert_getStatus;	//반복 수행하는 객체(?)	
var node_server_ip = '203.253.25.202'
var node_server_port = ':9000'
var bmc_server_ip = '203.253.25.207'
var bmc_server_port = ':9000'


google.charts.load('current', {'packages':['line']});
google.charts.setOnLoadCallback(drawChart);
function rotateMatrix(matrix) {
	const n = matrix.length;
	const result = new Array(n).fill(0).map(() => new Array(n).fill(0));
	
	for (let i = 0; i < n; i++) {
	  for (let j = 0; j < n; j++) {
		result[j][n-1-i] = matrix[i][j];
	  }
	}
	
	return result;
}
function drawChart() {
	console.log("Function drawChart() __ Line 17")
	let report_json
	var container = document.getElementsByClassName('response_time')[0];
	// var chart_1 = new google.visualization.Timeline(container);
	fetch('http://'+node_server_ip+node_server_port+'/getHttpResonseTime')
	.then(
		response => response.json()
	).then(json => {
		report_json = json
		console.log('fetch::/getHttpResonseTime\n'+JSON.stringify(report_json[0]))
	});

	var data = new google.visualization.DataTable();
	// data.addColumn('number', 'HTTP Request URL');
	fetch('http://'+node_server_ip+node_server_port+'/getHttpCodeList')
	.then(
		response => response.json()
	)
	.then(json => {
		console.log('fetch::/getHttpCodeList\n'+json);
		finally_rowArr = []
		data.addColumn('number', 'ResponseTime');
		data.addColumn('number', 'Guardians of the Galaxy');
		data.addColumn('number', 'The Avengers');
    data.addColumn('number', 'Transformers: Age of Extinction');
		data.addRows([
			[1,  37.8, 80.8, 41.8],
			[2,  30.9, 69.5, 32.4],
			[3,  25.4,   57, 25.7],
			[4,  11.7, 18.8, 10.5],
			[5,  11.9, 17.6, 10.4],
			// [6,   8.8, 13.6,  7.7],
			// [7,   7.6, 12.3,  9.6],
			// [8,  12.3, 29.2, 10.6],
			// [9,  16.9, 42.9, 14.8],
			// [10, 12.8, 30.9, 11.6],
			// [11,  5.3,  7.9,  4.7],
			// [12,  6.6,  8.4,  5.2],
			// [13,  4.8,  6.3,  3.6],
			// [14,  4.2,  6.2,  3.4]
		]);
		
		console.log('json[0].request_info.list.length:' , json[0].request_info.list.length)
		
		//list 0~n개의 url 정보만 -ex) [0] : "GET_/url_304"
		let kindOfRequest = json[0].request_info.list.length
		for(let list_index = 0; list_index < kindOfRequest; list_index++){
			// rowsArr = [list_index+1] 		
			rowsArr = []

			console.log('drawchart :: '+ json[0].request_info.list[list_index])
			data.addColumn('number', json[0].request_info.list[list_index])
			for(let rt_index = 0; rt_index < report_json[0][json[0].request_info.list[list_index]]['Time'].length; rt_index++){
				rowsArr.push(report_json[0][json[0].request_info.list[list_index]]['Time'][rt_index]['Response_time_'+(rt_index+1)])
			}
			console.log('rowsArr :: '+ rowsArr)
			finally_rowArr[list_index] = rowsArr
		}

		console.log('json[0].request_info.list.length:: \n'+json[0].request_info.list.length)
		console.log('finally_row:: \n'+finally_rowArr[0])
		console.log('finally_row:: \n'+finally_rowArr[1])
		console.log('finally_row:: \n'+finally_rowArr[2])
		// data.addRows(finally_rowArr)
		var MAX_count = 0
		for(let row_index = 0; row_index < finally_rowArr.length; row_index++){
			console.log('AddRows :: ' + finally_rowArr[row_index])
			if(MAX_count < finally_rowArr[row_index].length){
				MAX_count = finally_rowArr[row_index].length
			}
		}
		console.log("finally_rowArr.length::"+ finally_rowArr.length)
		console.log("MAX_count:: ",MAX_count)
		let roofCount = 0;
		for(let row_index2 = 0; row_index2 < finally_rowArr.length; row_index2++){
			console.log("finally_rowArr[row_index2].length: ", finally_rowArr[row_index2].length, "_ MAX_count: ", MAX_count)
			console.log('(MAX_count-finally_rowArr[row_index2].length): ', (MAX_count-finally_rowArr[row_index2].length))
			console.log('[Before] finally_rowArr['+row_index2+'] length: '+ finally_rowArr[row_index2].length)
			roofCount = (MAX_count-finally_rowArr[row_index2].length);
			for(let ri = 0; ri < roofCount; ri++){
				finally_rowArr[row_index2].push(0)
			}
			
			console.log('[After] finally_rowArr['+row_index2+'] length: '+ finally_rowArr[row_index2].length)
			// console.log('[view] finally_rowArr['+row_index2+']: ',finally_rowArr[row_index2])
		}

		//배열 회전
		finally_rowArr = rotateMatrix(finally_rowArr)
		//배열 맨앞에 1~ 순서대로 추가
		for(let n=0; n < kindOfRequest; n++){
			finally_rowArr[n].unshift(n+1)
		}
		console.log('RESULT\n',finally_rowArr)
		data.addRows(finally_rowArr)
		var options = {
			width: document.getElementsByClassName('response_time')[0].clientWidth,
			height: document.getElementsByClassName('response_time')[0].clientHeight,
			chart: {
				title: 'HTTP Request & Resonse Time Chart',
				subtitle: 'Full Stack Profiler'
			}
		};
		var chart = new google.charts.Line(document.getElementsByClassName('response_time')[0]);
	
		chart.draw(data, google.charts.Line.convertOptions(options));

	});	
	
}


//request & response time chart

// google.load('visualization', '1', {
// 	packages: ['corechart', 'line', 'Timeline']
// 	});

function initArray(arr) {
	for (var step = 0; step < arr.length; step++)
		arr[step] = 0;
}

function getEventTarget(e) {
	e = e || window.event;
	console.log(e)
	return e.target || e.srcElement;
}

function getLiIndex(ul, li_target) {
	var ul_element = ul.getElementsByTagName("button");

	for (var step = 0; step < ul_element.length; step++) 
		if (ul_element[step] == li_target)
			return step;

	return -1;
}

function flip_color(target) {
	if (target.style.background == "white") {
		target.style.background = "#2753FF";
		target.style.color = "white";
	}
	else {
		target.style.background = "white";
		target.style.color = "#2753FF";
	}
}

var start_time = 0;
var end_time = 0;
function setStart_time(){
	start_time = new Date().getTime();
}

async function response_report(method, url, status_code){	
	fetch('http://'+node_server_ip+node_server_port+'/getStats')
        .then(
            response => response.json()
        )
        .then(json => {
			data = JSON.stringify(json, null, 4)
			document.getElementById('code_view_right_div').innerText= "\n"+data;
			console.log(JSON.parse(data));
        });
}

// 10초마다 request report 출력문
// playAlert_getStatus = setInterval(request_count_handler, 10000);

var version_number = 10;


// <---------------------- create left bottom start point ------------------------------
// var is_checked_version = new Array(version_number);
// initArray(is_checked_version);
// var ul = document.getElementById("application_pid_list");

// let get_application_list;

// //cpp 서버로 application list 요청
// get_application_list = fetchData('get_Application_List')
// .then(function(application_list) {
// 	for (var step = 0; step < application_list.length; step++) {
// 		var li = document.createElement("button");

// 		li.setAttribute("id", "outside_li");
// 		li.appendChild(document.createTextNode("App" + String(step + 1))); // Fake // to be modified
// 		li.style.fontWeight = "light";

// 		li.style.width = "100%";
// 		li.style.background = "white";
// 		li.appendChild(document.createElement("br"));

// 		ul.append(li);
// 	}

// 	return application_list;
// })


// for (var step = 0; step < version_number; step++) {
// 	var li = document.createElement("button");
// 	var inside_li = document.createElement("li");

// 	li.setAttribute("id", "outside_li");
// 	inside_li.setAttribute("id", "inside_li");

// 	li.appendChild(document.createTextNode("Ver 0." + String(step + 1)));
// 	li.style.fontWeight = "light";

// 	if (step == 0)
// 		inside_li.appendChild(document.createTextNode("2022. 08. 25"));
// 	else if (step == 1)
// 		inside_li.appendChild(document.createTextNode("2022. 08. 28"));
// 	else if (step == 2)
// 		inside_li.appendChild(document.createTextNode("2022. 08. 29"));
// 	else if (step == 3)
// 		inside_li.appendChild(document.createTextNode("2022. 09. 01"));
// 	else if (step == 4)
// 		inside_li.appendChild(document.createTextNode("2022. 09. 04"));
// 	else
// 		inside_li.appendChild(document.createTextNode("2022. 09. 04"));

// 	li.style.width = "100%";
// 	li.style.background = "white";

// 	inside_li.style.fontSize = "20px";

// 	li.appendChild(document.createElement("br"));
// 	li.appendChild(inside_li);

// 	ul.append(li);
// }

// var version_check_count = 0;
// var boot_button_elem = document.getElementById("boot_mode_button");

// // async function fetchData(path, params) {
// // 	var url = 'http://'+node_server_ip+node_server_port+':9000/';

// // 	if (path) {
// // 		url = url.concat('', path);
// // 	}

// // 	if (params)
// // 		url.concat('?', Object.keys(params)
// // 				.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
// // 				.join('&'))

// // 			return fetch(url)
// // 			.then((response) => response.json())
// // 			.then((json) => {return json});
// // }

// ul.onclick = async function(event) {
// 	var target = getEventTarget(event);

// 	if (target.id != 'outside_li' && target.id != 'inside_li') 
// 		return ;

// 	if (target.id == 'inside_li')
// 		target = target.parentNode;

// 	var li_index = getLiIndex(ul, target);

// 	if (is_checked_version[li_index] == 1) {
// 		version_check_count--;
// 	}
// 	else {
// 		if (version_check_count == 2)
// 			return ;

// 		version_check_count++;
// 	}

// 	flip_color(target);
// 	is_checked_version[li_index] = 1 - is_checked_version[li_index];

// 	device_driver_info = await fetchData('get_device_driver_info');
// 	drawChart(device_driver_info);
// }
// <---------------------- end ------------------------------


function boot_mode_handler(event) {
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);
	
	Before_Page()
}

function app_mode_handler(event) {
	window.location.reload()
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);
}

function exit_handler(event) {
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);
}

function request_count_handler(event) {

	fetch('http://'+node_server_ip+node_server_port+'/getStats')
	.then(
		response => response.json()
	)
	.then(json => {
		data = JSON.stringify(json, null, 4)
		document.getElementById('code_view_right_div').innerText= "\n"+data;
		JSON.parse(data)["0"].id = "Request Count";
		console.log(JSON.parse(data));
	});
}


function get_CPU_Memory_INFO_handler(event) {
	let map = new Map();
	var ul = document.getElementById("prosessor_list");
	ul.innerHTML=""
	var ui = document.getElementById("prosessor_info")
	ui.innerHTML=""
	fetch('http://'+node_server_ip+node_server_port+'/cpuinfo/on')
	.then(
		response => response.json()
	)
	.then(json => {
		//CPU의 Processor 정보 출력

		data = JSON.stringify(json["CPU"], null, 4)
		for(let index = 0; index < data.split('{').length; index++){
			list = data.split('{')[index].split('}')[0].split(',')
			console.log("list : ",list)
			for(let index2 = 0; index2 < list.length; index2++){
				if(list[index2].includes('processor')){
					processor_number = list[index2].split(':')[1];					
					map.set(processor_number, list)
				}
			}
		}
		console.log(data);
		
		for(let index = 1; index < map.size; index++){
			var li = document.createElement("button");
			var inside_li = document.createElement("li");

			li.setAttribute("id", "Processor"+(index-1));
			li.setAttribute("class", "outside_li2");
			var component = document.createTextNode("Processor_"+(index-1));
			li.appendChild(component);
			li.style.fontWeight = "light";
			li.style.width = "auto";
			li.style.background = "white";
			li.style.margin="0.5%";
			
			li.appendChild(document.createElement("br"));

			ul.append(li);

			console.log('key++++', map.get(1))
			li.onclick = function(event) {
				var target = getEventTarget(event);
				document.getElementById('prosessor_info').innerText= "\n"+map.get("\""+index+"\"");
				if (target.style.background == "white") {
					target.style.background = "#2753FF";
					target.style.color = "white";
				}
				else {
					ui.innerHTML=""
					target.style.background = "white";
					target.style.color = "#2753FF";
				}
			}
		}
	});	
}

function get_Http_Code_List() {
	let map = new Map();
	var ul = document.getElementById("left_bottom");
	ul.innerHTML=""
	var ui = document.getElementById("view_CPU")
	ui.innerHTML=""
	fetch('http://'+node_server_ip+node_server_port+'/getHttpCodeList')
	.then(
		response => response.json()
	)
	.then(json => {
		console.log()

		for(let list_index = 0; list_index < json[0].request_info.list.length; list_index++){
			var li = document.createElement("button");
			var inside_li = document.createElement("li");

			li.setAttribute("url_info", json[0].request_info.list[list_index]);
			li.setAttribute("class", "outside_li2");
			li.setAttribute("id", json[0].request_info.list[list_index])
			var component = document.createTextNode(json[0].request_info.list[list_index]);
			
			li.appendChild(component);
			li.style.fontWeight = "light";
			li.style.width = "95%";
			li.style.background = "white";
			li.style.margin="0.5%";
			li.style.marginTop="10%"

			li.appendChild(document.createElement("br"));

			ul.append(li);
			li.onclick = function(event) {
				var target = getEventTarget(event);
				// document.getElementById('view_CPU').innerText= "\n"+map.get(" \""+index+"\"");
				fetch('http://'+node_server_ip+node_server_port+'/getHttpResonseTime')
				.then(
					response => response.json()
				).then(json => {
					console.log('fetch::/getHttpResonseTime\n'+JSON.stringify(json[0][document.getElementById(target.getAttribute('id')).getAttribute('id')]["Time"]))
					document.getElementById('view_CPU').innerText = JSON.stringify(json[0][document.getElementById(target.getAttribute('id')).getAttribute('id')]["Time"])
				});
				if (target.style.background == "white") {
					target.style.background = "#2753FF";
					target.style.color = "white";
				}
				else {
					ui.innerHTML=""
					target.style.background = "white";
					target.style.color = "#2753FF";
				}
			}
		}
		// data = JSON.stringify(json, null, 4)
		// // console.log("length = "+ data.split('{').length)
		// for(let index = 1; index < data.split('{').length; index++){
		// 	// console.log(index+""+ data.split('{')[index].split('}')[0])
		// 	list = data.split('{')[index].split('}')[0].split(',')
			
		// 	for(let index2 = 0; index2 < list.length; index2++){
		// 		if(list[index2].includes('processor')){
		// 			processor_number = list[index2].split(':')[1];					
		// 			// console.log("pro num :: "+processor_number)	;
		// 			map.set(processor_number, list)
		// 		}
		// 	}
		// }

		
		// console.log(map.keys());
		
		// for(let index = 1; index < map.size; index++){
		
		// }
	});	
}

function fan_mode_handler(event) {
	console.log('fan_mode_handler')
	var target = getEventTarget(event);	

	if (target.style.background == ''){
		target.style.background = 'white';
	}
	flip_color(target);

	console.log('fan_mode_handler2')
	//flag(true: request trun on the Cooling fan, false: request trun off the Cooling fan)
	flag = flag==0?1:0;
	if(flag==1){
		console.log('flag = ' + flag);
		axios.post('http://'+bmc_server_ip+bmc_server_port+'/fan/do').then(response =>{
			pie_chart_test = document.getElementById('pie_chart');
		}).catch(function (error) {
			console.log(error);
		});
		playAlert = setInterval(get_fan_info, 1000);
	}else if(flag == 0){
		console.log('flag = ' + flag);
		clearInterval(playAlert);
		axios.post('http://'+bmc_server_ip+bmc_server_port+'/fan/end').then(response =>{
			console.log('delete ')
		}).catch(function (error) {
			console.log(error);
		});
	}
}

function cpu_usage(){
	fetch('http://'+node_server_ip+node_server_port+'/cpuinfo/on')
	.then(
		response => response.json()
	)
	.then(json => {
		data = JSON.stringify(json, null, 4)
		console.log(JSON.parse(data))
	});
}

function TEST_STOP_BUTTON1(){
	clearInterval(playAlert_getStatus);
}
function TEST_STOP_BUTTON2(){
	// clearInterval(playAlert_getStatus);
	get_CPU_Memory_INFO_handler();
}

function TEST_BUTTON_GET_JSON(){
	// clearInterval(playAlert_getStatus);
	// cpu_usage();

	fetch('http://'+node_server_ip+node_server_port+'/stat_mem/result')
	.then(
		response => response.json()
	)
	.then(json => {
		data = JSON.stringify(json, null, 4)
		console.log(JSON.parse(data))
	});
}

function TEST_Request_report(){
	response_report("GET", "/cpuinfo/on", "200");
}

function Before_Page(){
	let fetchdata = {
		method: 'POST',
		// body: JSON.stringify({ loginId, password }),
		headers: {
			'Content-Type': 'application/json'
		}
	};
	fetch('http://'+node_server_ip+node_server_port+'/cpu/usagestop', fetchdata).then(
		response => response.json()
	);;

	var link = 'http://'+node_server_ip+node_server_port+'/';
 
	location.href=link;
}
//--------------------------------------------------------------------------------------------------------
function func_name_handler(event) {
	var target = getEventTarget(event);

	var device_driver_name = event.path[4].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText.split(" ")[3];
	for (var info_index = 0; info_index < device_driver_info.length; info_index++) {
		if (device_driver_info[info_index].device_driver_name == device_driver_name) {
			if (func_name_flag == 1) {
				device_driver_info[info_index].ftrace_log = Object.keys(device_driver_info[info_index].ftrace_log).sort().reduce(
						(newObj, key) => {
							newObj[key] = device_driver_info[info_index].ftrace_log[key];
							return newObj;
						},
						{}
				);
			}
			else { // to be modified
				device_driver_info[info_index].ftrace_log = Object.keys(device_driver_info[info_index].ftrace_log).sort().reverse().reduce(
						(newObj, key) => {
							newObj[key] = device_driver_info[info_index].ftrace_log[key];
							return newObj;
						},
						{}
				);
			}
			break ;

		}
	}

	func_name_flag = func_name_flag == 1 ? -1 : 1;
	drawChart(device_driver_info);
}

function count_handler(event) {
	var target = getEventTarget(event);

	var device_driver_name = event.path[4].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText.split(" ")[3];
	for (var info_index = 0; info_index < device_driver_info.length; info_index++) {
		if (device_driver_info[info_index].device_driver_name == device_driver_name) {
			device_driver_info[info_index].ftrace_log = Object.fromEntries(
					Object.entries(device_driver_info[info_index].ftrace_log).sort(([,a],[,b]) => (a[0]-b[0]) * func_name_flag)
			);
			break ;
		}
	}

	func_name_flag = func_name_flag == 1 ? -1 : 1;
	drawChart(device_driver_info);
}

function time_handler(event) {
	var target = getEventTarget(event);

	var device_driver_name = event.path[4].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText.split(" ")[3];
	console.log(event.path[4].childNodes[0].childNodes[0].childNodes[0].childNodes[2].innerText.split(" "));
	for (var info_index = 0; info_index < device_driver_info.length; info_index++) {
		if (device_driver_info[info_index].device_driver_name == device_driver_name) {
			device_driver_info[info_index].ftrace_log = Object.fromEntries(
					Object.entries(device_driver_info[info_index].ftrace_log).sort(([,a],[,b]) => (a[1]-b[1]) * time_flag)
			);
			break ;
		}
	}

	time_flag = time_flag == 1 ? -1 : 1;
	drawChart(device_driver_info);
}

//seconde page create view

function loadItems(){
	return fetch('./report.json').then((response) => response.json())
	.then((json) => json.items);
}

function displayItems(items){
	const container = document.querySelector("code_view_right");
	container.innerHTML=items.map((item) => createHTMLString(item)).join("");
}

function createHTMLString(item){
	return '<li class="item"></li>';
}

// loadItems().then((items) =>{
// 	console.log(items)
// 	displayItems(items);
// })
