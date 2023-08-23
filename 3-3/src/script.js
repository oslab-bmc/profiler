function initArray(arr) {
	for (var step = 0; step < arr.length; step++)
		arr[step] = 0;
}

function getEventTarget(e) {
	e = e || window.event;

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

for (var step = 0; step < version_number; step++) {
	var li = document.createElement("button");
	var inside_li = document.createElement("li");

	li.setAttribute("id", "outside_li");
	inside_li.setAttribute("id", "inside_li");

	li.appendChild(document.createTextNode("Ver 0." + String(step)));
	li.style.fontWeight = "light";

	inside_li.appendChild(document.createTextNode("2022. 08. 25"));

	li.style.width = "100%";
	li.style.background = "white";

	inside_li.style.fontSize = "20px";

	li.appendChild(document.createElement("br"));
	li.appendChild(inside_li);

	ul.append(li);
}

var version_check_count = 0;
var boot_button_elem = document.getElementById("boot_mode_button");

ul.onclick = function(event) {
	var target = getEventTarget(event);
	console.log(event.currentTarget);

	if (target.id != 'outside_li' && target.id != 'inside_li') 
		return ;

	if (target.id == 'inside_li')
		target = target.parentNode;

	var li_index = getLiIndex(ul, target);

	console.log(li_index);
	console.log('ul_click!!');

	if (is_checked_version[li_index] == 1) {
		version_check_count--;
	}
	else {
		if (version_check_count == 2)
			return ;

		version_check_count++;
	}

	flip_color(target);
	is_checked_version[li_index] = 1 - is_checked_version[li_index];
}

function boot_mode_handler(event) {
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);

	$.getJSON('./version_test/ver_1/metadata.json', function(json) {
			console.log(json);
	});

	window.location.reload()

}

function app_mode_handler(event) {
	var target = getEventTarget(event);

	if (target.style.background == '')
		target.style.background = 'white';

	flip_color(target);
}

function exit_handler(event) {
	// var target = getEventTarget(event);

	// if (target.style.background == '')
	// 	target.style.background = 'white';

	// flip_color(target);

	window.open('','_self').close();
}

google.load('visualization', '1', {
    packages: ['corechart', 'line']
});

google.setOnLoadCallback(function () {
	// PIE CHART
	var data_1 = google.visualization.arrayToDataTable([
			['Task', 'Hours per Day'],
			['Bootloader', 2],
			['Kernel Space', 6],
			['User Space', 17],
	]);

	var options_1 = {
		width: document.getElementsByClassName('pie_chart')[0].clientWidth,
		height: document.getElementsByClassName('pie_chart')[0].clientHeight,

		legend: {
			alignment: 'center',
			position: 'top',
			textStyle: {
				fontSize: 22,
			}
		},
	};

	var chart_1 = new google.visualization.PieChart(document.getElementsByClassName('pie_chart')[0]);
	chart_1.draw(data_1, options_1);

    // LINE CHART
    var data_2 = new google.visualization.DataTable();
    data_2.addColumn('number', 'Day');
    data_2.addColumn('number', 'CPU');
    data_2.addColumn('number', 'Memory');

    data_2.addRows([
        [1, 37.8, 80.8],
        [2.3, 30.9, 69.5],
        [3, 25.4, 57],
        [4, 11.7, 18.8],
        [5, 11.9, 17.6],
        [6, 8.8, 13.6],
        [7, 7.6, 12.3],
        [8, 12.3, 29.2],
        [9, 16.9, 42.9],
        [10, 12.8, 30.9],
        [11, 5.3, 7.9],
        [12, 6.6, 8.4],
        [13, 4.8, 6.3],
        [14, 4.2, 6.2]
    ]);

    var options_2 = {
        chart: {
            title: 'Hello Office Earnings in First Two Weeks of Opening',
            subtitle: 'in millions of dollars (USD)'
        },

		pointSize: 10,
		legend: {
			textStyle: {
				fontSize: 25,
			}
		},

		colors: ['#6e4ff5', '#f6aa33'],
    };

    var chart_2 = new google.visualization.LineChart(document.getElementsByClassName('line_chart')[0]);
    chart_2.draw(data_2, options_2);
});