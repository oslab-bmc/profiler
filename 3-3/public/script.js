//boot mode scrpt file
var device_driver_info;
func_name_flag = 1;
count_flag = 1;
time_flag = 1;
flag = 0;
var playAlert;	//반복 수행하는 객체(?)	
var node_server_ip = '192.168.0.33'
var node_server_port = ':4000'


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

var version_number = 10;
var is_checked_version = new Array(version_number);
initArray(is_checked_version);

var ul = document.getElementById("kernel_version_list");

function make_kernel_version_management() {
	return fetchData('get_kernel_version_list');
}

var kernel_version_list;

kernel_version_list = make_kernel_version_management().then(function(version_list) {
	for (var step = 0; step < version_list.length; step++) {
		var li = document.createElement("button");

		li.setAttribute("id", "outside_li");
		li.appendChild(document.createTextNode("Version " + String(step + 1))); // Fake // to be modified
		li.style.fontWeight = "light";

		li.style.width = "100%";
		li.style.background = "white";
		li.appendChild(document.createElement("br"));

		ul.append(li);
	}

	return version_list;
});


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


var version_check_count = 0;
var boot_button_elem = document.getElementById("boot_mode_button");

async function fetchData(path, params) {
	var url = 'http://192.168.0.33:4000/';

	if (path) {
		url += path;
	}

	if (params) {
		url += '?';
		var query = Object.keys(params)
					.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
					.join('&');

		url += query;
	}
	console.log('fetch :: '+ url)
	return fetch(url)
		.then((response) => response.json())
		.then((json) => {return json});
}

var old_info;
ul.onclick = async function(event) {
	console.log('[line 136] ul.onclick')
	var target = getEventTarget(event);

	if (target.id != 'outside_li' && target.id != 'inside_li') 
		return ;

	if (target.id == 'inside_li')
		target = target.parentNode;

	var li_index = getLiIndex(ul, target);

	var uncheck = 0;
	if (is_checked_version[li_index] == 1) {
		version_check_count--;
		uncheck = 1;
	}
	else {
		if (version_check_count == 2)
			return ;

		version_check_count++;
	}

	flip_color(target);
	is_checked_version[li_index] = 1 - is_checked_version[li_index];

	if (uncheck)
		return ;

	(async() => {
		var params = new Object();
		var count = 0;

		for (var i = 0; i < is_checked_version.length; i++) {
			if (is_checked_version[i] == 1) {
				count++;

				if (count == 1)
					params["selected_1"] = i+1;
				else if (count == 2) {
					params["selected_2"] = i+1;
					break ;
				}
			}
		}
		console.log('[line 181] fetchData call :: getDirectoryJSON')
		fetchData('getDirectoryJSON', params)
			.then(json => {
					//console.log(json);
					document.getElementById('code_view_left').innerHTML = json[0].htmlcode.toString();
			});
	})();

	console.log('[line 189] drawChart - performance')
	kernel_version_list.then(function(data) {
		var params = {
			"kernel_version": data[li_index]
		};

		device_driver_info = fetchData('get_device_driver_info', params).then(function(info) {
			if (version_check_count == 1)
				drawChart(info);
			else if (version_check_count == 2)
				drawChart(info, old_info);
			// console.log(info, 'click')
			return info;
		});
		
		//2023 06 09 GYKim
		//Calculate version power consumption
		fetchData('calc_dmesg_based_watt', params).then(function(watt){
			console.log('watt: ', watt)
			document.getElementById('v'+version_check_count+'_Power_usage').innerText=watt
		});
		
		return data;
	});

	old_info = device_driver_info;
}

function boot_mode_handler(event) {
	window.location.reload()
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);
	
}

function app_mode_handler(event) {
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);

	nextPage()
}

function exit_handler(event) {
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);
}

function nextPage(){
	var link = 'http://192.168.0.33:4000/secondPage';
	console.log('page 1->page 2')
	location.href=link;
}

function request_count_handler(event) {
	
	fetch('http://'+node_server_ip+node_server_port+'/getStats')
        .then(
            response => response.json()
        )
        .then(json => {
            //console.log('get JSON :: ' + json);
            //document.getElementById('code_view_left').innerHTML = json[0].htmlcode.toString();
			data = JSON.stringify(json, null, 4)
			document.getElementById('code_view_right_div').innerText= "\n"+data;
			console.log(JSON.parse(data));
        });
}

function get_CPU_Memory_INFO_handler(event) {
	console.log('call handler')
	fetch('http://'+node_server_ip+node_server_port+'/cpuinfo/on')
	.then(
		response => response.json()
	)
	.then(json => {
		data = JSON.stringify(json, null, 4)
		document.getElementById('code_view_right_div').innerText= "\n"+data
		console.log(JSON.parse(data))
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
		console.log('flag = ' + flag)
		// axios.post('http://192.168.0.4:8000/fan/do').then(response =>{

		// }).catch(function (error) {
		// 	console.log(error);
		// });
		let fetchdata = {
            method: 'POST',
            // body: JSON.stringify({ loginId, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
		fetch('http://'+node_server_ip+node_server_port+'/fan/do', fetchdata)
			.then(
				response => response.json()
			);
		playAlert = setInterval(get_fan_info, 1000);
	}else if(flag == 0){
		console.log('flag = ' + flag)
		clearInterval(playAlert);
		let fetchdata = {
            method: 'POST',
            // body: JSON.stringify({ loginId, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
		fetch('http://'+node_server_ip+node_server_port+'/fan/end', fetchdata)
			.then(
				response => response.json()
			);
		// fetch("http://'+node_server_ip+node_server_port+':4000/fan/end", {
		// 	method: "DELETE",
		// 	})
		// 	.then((response) => response.json())
		// 	.then((data) => console.log(data));
		
	}
}

function get_fan_info(){
	var pie_str="Fan Status : ";
	
	// axios.get('http://192.168.0.4:8000/fan').then(response =>{
	// 	pie_str += response.data
	// 	console.log(pie_str)
	// 	document.getElementById('code_view_right_div').innerText = pie_str+"\n";
	// }).catch(function (error) {
	// 	console.log(error);
	// });

	fetch('http://'+node_server_ip+node_server_port+'/fan')
	.then(
		response => response.json()
	)
	.then(json => {
		data = JSON.stringify(json, null, 4)
		pie_str += data
		document.getElementById('code_view_right_div').innerText = pie_str+"\n";
	});
}

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

	var device_driver_name = event.path[4].innerText.split(/\r?\n|\r|\n/g)[3].split(" ")[3];

	(async() => {
		var info = await device_driver_info;

		for (var info_index = 0; info_index < info.length; info_index++) {
			if (info[info_index].device_driver_name == device_driver_name) {
				info[info_index].ftrace_log = Object.fromEntries(
					Object.entries(info[info_index].ftrace_log).sort(([,a],[,b]) => (a[0]-b[0]) * func_name_flag)
				);
				break ;
			}
		}

		func_name_flag = func_name_flag == 1 ? -1 : 1;
		drawChart(info); // to be modified // current state: can not manage two infos
	})();
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

function drawChart(device_driver_info, device_driver_info_2) {
	google.load('visualization', '1', {
	packages: ['corechart', 'line', 'Timeline']
	});
	// console.log(device_driver_info,'<<<<<<<<<<<<<')
	google.setOnLoadCallback(async function () {
		// PIE CHART
		/*
		var data_1 = google.visualization.arrayToDataTable([
			['Area', 'Times (s)'],
			['Bootloader', 0, 2],
			['Kernel Space', 2, 3.5],
			['User Space', 3.5, 15],
	]);
	*/
	var container = document.getElementsByClassName('pie_chart')[0];
	var chart_1 = new google.visualization.Timeline(container);
	var timeline_1 = new google.visualization.DataTable();

	timeline_1.addColumn({ type: 'string', id: 'Area' });
	timeline_1.addColumn({ type: 'number', id: 'Start' });
	timeline_1.addColumn({ type: 'number', id: 'End' });

	var options_1 = {
		colors: ['black', 'black', 'black'],
		timeline: { rowLabelStyle: {fontSize: 25 }},
		width: document.getElementsByClassName('pie_chart')[0].clientWidth,
		height: document.getElementsByClassName('pie_chart')[0].clientHeight,

		legend: {
			alignment: 'center',
			position: 'left',
			textStyle: {
				fontSize: 20,
			},
		},
		fontSize: 30,
		chartArea: { left: 0, top: 500, width: '100%', height: '95%'}
	};

	if (!device_driver_info_2) {
		timeline_1.addRows([
			['Bootloader', 0, 1700],
			['Kernel Space', 1700, 4900],
			['User Space', 4900, 13000],
		]);
	}
	else {
		timeline_1.addRows([
			['Bootloader_1', 0, 2000],
			['Bootloader_2', 0, 1950],
			['Kernel Space_1', 2000, 7600],
			['Kernel Space_2', 1950, 5500],
			['User Space_1', 7600, 19000],
			['User Space_2', 5500, 16800],
		]);
	}

	chart_1.draw(timeline_1, options_1);

	var cpu_1 = new google.visualization.DataTable();
	var mem_1 = new google.visualization.DataTable();

	var cpu_2 = new google.visualization.DataTable();
	var mem_2 = new google.visualization.DataTable();

	cpu_1.addColumn('number', 'Times');
	mem_1.addColumn('number', 'Times');

	if (!device_driver_info_2) {
		cpu_1.addColumn('number', 'CPU');
		mem_1.addColumn('number', 'MEM');
	}
	else {
		cpu_1.addColumn('number', 'CPU_1');
		mem_1.addColumn('number', 'MEM_1');
	}

	cpu_1.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});
	mem_1.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});

	cpu_2.addColumn('number', 'Times');
	cpu_2.addColumn('number', 'CPU_2');
	cpu_2.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});

	mem_2.addColumn('number', 'Times');
	mem_2.addColumn('number', 'MEM_2');
	mem_2.addColumn({type: 'string', role: 'tooltip', 'p': {'html': true}});

	(async() => {
		info_1 = await device_driver_info;
		//console.log(info_1);
		for (var info_index = 0; info_index < info_1.length; info_index++) {
			if (info_index > 0 && info_1[info_index].cpu_util == 0)
				info_1[info_index].cpu_util = info_1[info_index-1].cpu_util;

			var cpu_tooltip_html, mem_tooltip_html;
			// console.log('차트 관련 각 요소 값: ', info_1[info_index]);

			cpu_tooltip_html = await createCustomChartToolTip(
				'CPU Utilization : ',
				info_1[info_index].init_time,
				info_1[info_index].cpu_util.toFixed(4) * 100,
				info_1[info_index].device_driver_name,
				info_1[info_index].return_value,
				info_1[info_index].ftrace_log);

			mem_tooltip_html = await createCustomChartToolTip(
				'Memory Utilization : ',
				info_1[info_index].init_time,
				info_1[info_index].mem_util.toFixed(4) * 100,
				info_1[info_index].device_driver_name,
				info_1[info_index].return_value,
				info_1[info_index].ftrace_log);

			if (device_driver_info_2) {
				var cpu_tooltip_html_2, mem_tooltip_html_2;
				var info_2 = await device_driver_info_2;

				cpu_tooltip_html_2 = await createCustomChartToolTip(
					'CPU Utilization : ',
					info_2[info_index].init_time,
					info_2[info_index].cpu_util.toFixed(4) * 100,
					info_2[info_index].device_driver_name,
					info_2[info_index].return_value,
					info_2[info_index].ftrace_log);

				mem_tooltip_html_2 = await createCustomChartToolTip(
					'Memory Utilization : ',
					info_2[info_index].init_time,
					info_2[info_index].mem_util.toFixed(4) * 100,
					info_2[info_index].device_driver_name,
					info_2[info_index].return_value,
					info_2[info_index].ftrace_log);

				cpu_2.addRows([[
					info_2[info_index].start_time + info_2[info_index].init_time, 
					info_2[info_index].cpu_util * 100,
					cpu_tooltip_html_2,
				]]);

				mem_2.addRows([[
					info_2[info_index].start_time + info_2[info_index].init_time, 
					info_2[info_index].mem_util * 100,
					mem_tooltip_html_2,
				]]);
			}

			cpu_1.addRows([[
				info_1[info_index].start_time + info_1[info_index].init_time, 
				info_1[info_index].cpu_util * 100,
				cpu_tooltip_html
			]]);

			mem_1.addRows([[
				info_1[info_index].start_time + info_1[info_index].init_time, 
				info_1[info_index].mem_util * 100,
				mem_tooltip_html,
			]]);
		}	

	var joined_data_1 = google.visualization.data.join(cpu_1, mem_1, 'full', [[0, 0]], [1, 2], [1, 2]);

	if (device_driver_info_2) {
		var joined_data_2 = google.visualization.data.join(cpu_2, mem_2, 'full', [[0, 0]], [1, 2], [1, 2]);
		joined_data_1 = google.visualization.data.join(joined_data_1, joined_data_2, 'full', [[0, 0]], [1, 2, 3, 4], [1, 2, 3, 4]);
	}

	var options_2 = {
		interpolateNulls: true,

		width: document.getElementsByClassName('line_chart')[0].clientWidth,
		height: document.getElementsByClassName('line_chart')[0].clientHeight,

		title: 'Initialize Process of Device Driver and File System',
		hAxis: {
			title: 'Times (s)',
			titleTextStyle: {
				fontSize: 30
			},
			textStyle: {
				fontSize: 20
			}
		},

		vAxis: {
			title: 'Percentage (%)',
			titleTextStyle: {
				fontSize: 30
			},
			textStyle: {
				fontSize: 20
			}
		},

		tooltip: { 
			isHtml: true,
			trigger: 'selection'
		},

		pointSize: 3
	};

	var chart_2 = new google.visualization.AreaChart(document.getElementsByClassName('line_chart')[0]);
	chart_2.draw(joined_data_1, options_2);
	})();
	});
}

async function createCustomChartToolTip(category, init_time, util, driver_name, return_value, ftrace_log) {
	var html_start =  '<div style="padding:5px 5px 5px 5px; id="tooltip_div">' +
		'<table id="tooltip">' + '<tr>' +
		'<td><b>' + category + util + '%' + '</b></td>' + '</tr>' + '<tr>' +
		'<td><b>' + 'Initial Time : ' + init_time + 's' + '</b></td>' + '</tr>' + '<tr>' +
		'<td><b>' + 'Initcall Return Value : ' + return_value + '</b></td>' + '</tr>' + '<tr>' +
		'<td><b>' + 'Initcall Name : ' + driver_name + '</b></td>' + '</tr>' + '</table>' + '</div>' +
		'<table class="tooltip_table" id="tooltip_table">'+ '<thead>' + '<tr>' + 
		'<th style="width: 300px" onclick="func_name_handler(event)">' + "Functions" + '</th>' + '<th style="width: 100px" onclick="count_handler(event)">' + "Count" + '</th>' + '<th style="width: 200px" onclick="time_handler(event)">' + "Time (μs)" + '</th>' +
		'</tr>' + '</thead>' + '<tbody">';

	if (ftrace_log == undefined) {
		var datas =
			'<td style="width: 300px">' + "dummy_function()" + '</td>' + 
			'<td style="width: 100px">' + "285.0" + '</td>' + 
			'<td style="width: 180px">' + "22" + '</td>';
	}
	else {
		var datas = '';

		for (var key in ftrace_log) {
			datas += 
				'<tr>' +
				'<td id="func_name_td">' + key + '</td>' + 
				'<td id="func_count_td">' + ftrace_log[key][0] + '</td>' + 
				'<td id="func_time_td">' + ftrace_log[key][1].toFixed(2) + '</td>' +
				'</tr>';
		}
	}

	return html_start + datas + '</tr>' + '</tbody>' + '</table>';
}
