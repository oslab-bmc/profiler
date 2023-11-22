var node_server_ip = '203.253.25.202'
var node_server_port = ':9000'
var bmc_server_ip = '203.253.25.207'
var bmc_server_port = ':9000'

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
