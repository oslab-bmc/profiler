var node_server_ip = '192.168.0.33'
var node_server_port = ':4000'
var bmc_server_ip = '192.168.0.4'
var bmc_server_port = ':8000'

google.charts.load('current', {'packages':['line']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
	console.log("Function drawChart() __ Line 17")
	var list = ["a","b","c","b","d"]
	let report_json
	var container = document.getElementsByClassName('line_chart')[0];
	// var chart_1 = new google.visualization.Timeline(container);
	fetch('http://'+node_server_ip+node_server_port+'/getHttpCodeList')
	.then(
		response => response.json()
	).then(json => {
		report_json = json
	});

	var data = new google.visualization.DataTable();
	// data.addColumn('number', 'HTTP Request URL');
	fetch('http://'+node_server_ip+node_server_port+'/getHttpCodeList')
	.then(
		response => response.json()
	)
	.then(json => {
		console.log(json);

		data.addColumn('number', 'Day');
		data.addColumn('number', 'Guardians of the Galaxy');
		data.addColumn('number', 'The Avengers');
      	data.addColumn('number', 'Transformers: Age of Extinction');

		for(let list_index = 0; list_index < json[0].request_info.list.length; list_index++){
			
			console.log('drawchart :: '+ json[0].request_info.list[list_index])
		}

		data.addRows([
			[1,  37.8, 80.8, 41.8],
			[2,  30.9, 69.5, 32.4],
			[3,  25.4,   57, 25.7],
			[4,  11.7, 18.8, 10.5],
			[5,  11.9, 17.6, 10.4],
			[6,   8.8, 13.6,  7.7],
			[7,   7.6, 12.3,  9.6],
			[8,  12.3, 29.2, 10.6],
			[9,  16.9, 42.9, 14.8],
			[10, 12.8, 30.9, 11.6],
			[11,  5.3,  7.9,  4.7],
			[12,  6.6,  8.4,  5.2],
			[13,  4.8,  6.3,  3.6],
			[14,  4.2,  6.2,  3.4]
		]);
		var options = {
			width: document.getElementsByClassName('line_chart')[0].clientWidth,
			height: document.getElementsByClassName('line_chart')[0].clientHeight,
			chart: {
				title: 'HTTP Request & Resonse Time Chart',
				subtitle: 'Full Stack Profiler'
			}
		};
		var chart = new google.charts.Line(document.getElementById('line_chart'));
	
		chart.draw(data, google.charts.Line.convertOptions(options));
		
		
	});	
	
}
