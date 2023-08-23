var express = require('express');
var fs = require('fs');
var app = express();

// for Hashing
var crypto = require('crypto');

// for Kernel Source Download
//var wget = require('node-wget');

//var url = require('url');

var readline = require('readline');
var rq = require('request');	//sudo npm install request
var router = new express.Router();

var bmc_server_ip = '192.168.0.4'
var bmc_server_port = ':8000'

app.use(express.static(__dirname + '/../public'));
path = require('path');
var http = require('http');
var cnt = 0;
var list = '<ul>';
const bodyParser = require("body-parser");
const { Router, request, response } = require('express');
const serverUrl = "http://"+bmc_server_ip+bmc_server_port;
let s_time = 0;
let e_time = 0;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	fs.readFile('../public/3-2.html', function (error, data) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(data);
	});
});
app.get('/secondPage', function (req, res) {
	fs.readFile('../public/second.html', function (error, data) {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(data);
	});
});
app.use(bodyParser.urlencoded({
	extended: true
}));
//=============================
//Get HTTP Request & Response time > ./report.json
const getRoute = (req) => {
	const route = req.route ? req.route.path : '' // check if the handler exist
	const baseUrl = req.baseUrl ? req.baseUrl : '' // adding the base url if the handler is child of other handler
	return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : 'unknown route'
}

// const fs = require('fs')
const FILE_PATH = './report.json'
const FILE_PATH2 = './httpcodereport.json'

// read json object from file
const readStats = () => {
	let result = {}
	try {
		result = JSON.parse(fs.readFileSync(FILE_PATH))
	} catch (err) {
		console.error(err)
	}
	return result
}
const readHttpCode = () => {
	let result2 = {}
	try {
		result2 = JSON.parse(fs.readFileSync(FILE_PATH2))
	} catch (err) {
		console.error(err)
	}
	return result2
}

// dump json object to file
const dumpStats = (stats) => {
	try {
		fs.writeFileSync(FILE_PATH, JSON.stringify(stats), { flag: 'w+' })
	} catch (err) {
		console.error(err)
	}
}
const dumpHttpinfo = (info) => {
	try {
		fs.writeFileSync(FILE_PATH2, JSON.stringify(info), { flag: 'w+' })
	} catch (err) {
		console.error(err)
	}
}

app.use((req, res, next) => {
	s_time = new Date().getTime();
	res.on('finish', () => {

		const stats = readStats()
		const httpCode = readHttpCode()
		const event = `${req.method}_${getRoute(req)}_${res.statusCode}`
		if (!httpCode.hasOwnProperty('request_info')) {
			httpCode['request_info'] = { list:[] }
		}
		if (!stats.hasOwnProperty(event)) {
			stats[event] = { "Count": 0, Time: [] }
		}

		try {
			stats[event]["Count"] = stats[event]["Count"] ? stats[event]["Count"] + 1 : 1
			let tmp = "Response_time_" + stats[event]["Count"].toString()
			e_time = new Date().getTime();
			let time = e_time - s_time
			stats[event]["Time"].push({ [`${tmp}`]: time })
		} catch (err) {
			stats[event] = stats[event] ? stats[event] + 1 : 1
		}
		
		if(!httpCode.request_info.list.includes(event)){
			httpCode['request_info']["list"].push(event)
			dumpHttpinfo(httpCode)
		}
		dumpStats(stats)
	})
	next()
})

//=============================

app.use(bodyParser.json());

// json {version_name, build_date}
var kernel_version_list = [];

// var kernel_dir_path = '/home/jaeseop/html_test/kernel_management';
//var kernel_dir_path = '/home/ssrlab-sub/gwangyong/BMC/kernel_management';

//client 위치 변경시 변경해야될 부분
var kernel_dir_path = path.join("/", "home", "ssrlab", "profiler", "kernel_management");

var kernel_dir_list = fs.readdirSync(kernel_dir_path);
var count_version = 0;
var unregistered_file = [];

// get kernel version using Makefile contents // example "5.4.62" // not use
/**
async function get_kernel_version(Makefile_path) {
	var fileStream = fs.createReadStream(Makefile_path);

		var rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	var version, patchlevel, sublevel;
	for await (const line of rl) {
		if (line.indexOf('VERSION') != -1) {
			version = line.split(" ")[2];
			continue ;
		}

		if (line.indexOf('PATCHLEVEL') != -1) {
			patchlevel = line.split(" ")[2];
			continue ;
		}

		if (line.indexOf('SUBLEVEL') != -1) {
			sublevel = line.split(" ")[2];
			break ;
		}
	}

	return [version, patchlevel, sublevel];
}

 */
var device_driver_info = new Array();
var log_list = [];	//현재 관리하고 있는 커널 버전에 대한 파악(부팅 로그(dmesg 로그), Ftrace 로그 등 파싱) [start.js, line 75]
(async () => {
	try {
		for (var list_index = 0; list_index < kernel_dir_list.length; list_index++) {
			if (kernel_dir_list[list_index][0] == 'V') {
				var version = kernel_dir_list[list_index];

				log_list[list_index] = await parse_trace(version);
				console.log('[parse_trace_' + count_version + '] finish');

				device_driver_info[list_index] = await parse_dmesg(version, log_list[list_index]);
				console.log('[parse_dmesg_' + count_version + '] finish');

				count_version++;

				continue;
			}	//<-- 새로운 버전이 추가됨 [start.js, line 89]

			unregistered_file.push(list_index);
		}
		//<-- 새로운 커널 버전의 전체 소스코드에 대한 해시 파일 저장 [start.js, 92]
		/*
			- 저장된 순서대로 ‘V’ + 순서의 디렉토리 이름으로 관리됨
			- 해당 디렉토리 내부에는 부팅 로그, Ftrace로그, 해시 파일 등이 포함됨
			- 현재 구현된 단계는 새로운 커널 버전 디렉토리를 “kernel_management”에 추가할 시, 자동으로 V + 순서 디렉토리 명을 생성하여 커널 디렉토리를 하위로 옮기고, 해시를 만들어서 해시파일 저장까지 가능함
			- V + 순서 디렉토리가 만들어지면 부팅 로그, Ftrace 로그까지 수집하여 저장할 수 있도록 구현해야 함
		*/
		for (var unregistered_index = 0; unregistered_index < unregistered_file.length; unregistered_index++) {
			var unregistered_elem = kernel_dir_path + '/' + kernel_dir_list[unregistered_file[unregistered_index]];
			//var kernel_version;

			if (fs.lstatSync(unregistered_elem).isDirectory()) {
				count_version++;

				var new_dir_path = kernel_dir_path + '/V' + count_version;
				fs.mkdirSync(new_dir_path);
				makeHashFile(kernel_dir_path, kernel_dir_list[unregistered_file[unregistered_index]], new_dir_path + '/hash.txt');

				fs.rename(unregistered_elem, new_dir_path + '/' + kernel_dir_list[unregistered_file[unregistered_index]], function (err) {
					if (err) throw err;
					console.log('Successfully renamed');
				});

				kernel_dir_list[unregistered_file[unregistered_index]] = ('V' + count_version);

				log_list[unregistered_file[unregistered_index]] = parse_trace('V' + count_version).then(function (log) {
					device_driver_info[unregistered_file[unregistered_index]] = parse_dmesg('V' + count_version, log).then(function (info) {
						return info;
					});

					return log;
				});

				continue;
			}
		}
	} catch (err) {
		console.error(err);
	}
})();

app.get('/get_kernel_version_list', function (req, res) {
	res.json(kernel_dir_list);
});

// traverse dir_path -> make hash file
function makeHashFile(pre_path, dir_path, hash_path) {
	var queue = [];
	var hash_list = [];
	queue.push(dir_path);

	var write_stream = fs.createWriteStream(hash_path);

	while (queue.length) {
		var first_elem = queue[0];
		queue.shift(); // dequeue

		var dir_file_list = fs.readdirSync(pre_path + '/' + first_elem);

		for (var elem_index = 0; elem_index < dir_file_list.length; elem_index++) {
			var elem = dir_file_list[elem_index];
			var abs_path = pre_path + '/' + first_elem + '/' + elem;
			var stats = fs.lstatSync(abs_path);

			if (stats.isDirectory())
				queue.push(first_elem + '/' + elem);
			else {
				var hash = crypto.createHash('md5');
				var data;

				try {
					data = fs.readFileSync(abs_path);
					hash.update(data);
					write_stream.write(first_elem + '/' + elem + ' ' + hash.digest('hex') + '\n');
				} catch (error) {	//[Additional] 2023.2.06 gwangyongkim
					continue;
				}
			}
		}
	}

	write_stream.end();
	console.log('end of makeHashFile');
}

function isdigit(c) {
	if (c >= '0' && c <= '9')
		return true;

	return false;
}

function isnumber(n) {
	for (var number_index = 0; number_index < n.length; number_index++)
		if ((n[number_index] <= '0' || n[number_index] >= '9') && n[number_index] != '.')
			return false;

	return true;
}

function get_pre_function_name(function_name) {
	// platform, driver, init, probe
	var index = 0;
	//if ((index = function_name.search("_platform")) != -1 || (index = function_name.search("_driver")) != -1 || (index = function_name.search("_init")) != -1 || (index = function_name.search("_probe")) != -1)

	if ((index = function_name.search("_platform")) != -1)
		return function_name.slice(0, index);

	if ((index = function_name.search("_driver")) != -1)
		return function_name.slice(0, index);

	return null;
}

async function parse_trace(kernel_version) {
	console.log('[parse_trace] kernel_version: ', kernel_version);
	var log_list = new Array();
	var path = kernel_dir_path + '/' + kernel_version + '/trace.txt';

	var logs = fs.readFileSync(path).toString().split("\n");

	for (var log_index = 0; log_index < logs.length; log_index++) {
		var trace_str_list = logs[log_index].split(/[ |!+@#*;]/).filter(Boolean);

		if (!(trace_str_list.length))
			continue;

		if (!isdigit(trace_str_list[0][0]))
			continue;

		trace_str_list.shift();

		// to do work
		if (trace_str_list[0] == "==========>" || trace_str_list[0] == "<==========")
			continue;

		log_list.push(trace_str_list);
	}
	return log_list;
}


async function parse_dmesg(kernel_version, log_list) {
	console.log('[parse_dmesg] kernel_version: ', kernel_version);
	var path = kernel_dir_path + '/' + kernel_version + '/dmesg.txt';

	var data = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
	var datas = data.split("\n");

	var cpu_infos = new Array();
	var obj = new Object();
	var log_dict = {};
	var info_array = new Array();

	for (var data_index = 0; data_index < datas.length; data_index++) {
		var str = datas[data_index];
		if (str.search("] initcall") == -1 &&
			str.search("OSLAB") == -1 &&
			str.search("] calling") == -1)
			continue;

		var str_list = str.split(/[\[\]+,: ]/).filter(Boolean);
		var comp_str;

		// parse start point
		if (str.search("] calling") != -1) {
			obj.start_time = Number(str_list[0]);
			obj.device_driver_name = str_list[2];
			var pre_parent_function_name;
			var parent_func_line = 0;

			pre_parent_function_name = get_pre_function_name(obj.device_driver_name);

			if (!pre_parent_function_name || pre_parent_function_name.length == 1)
				continue;

			//console.log("[pre_parent_function_name] ", pre_parent_function_name, ", [device_driver_name] ", obj.device_driver_name);

			// find parent function (obj.device_driver_name)
			var i = 0;
			for (var parent_function_index = 0; parent_function_index < log_list.length - 1; parent_function_index++) {
				var log_str_list = log_list[parent_function_index];
				if (log_str_list[log_str_list.length - 1].search("{") == -1)
					continue;

				if (isnumber(log_str_list[0])) {
					//pre_parent_function_name[0] = get_pre_function_name(log_str_list[2]);
					comp_str = log_str_list[2];
				}
				else {
					//pre_parent_function_name[0] = get_pre_function_name(log_str_list[0]);
					comp_str = log_str_list[0];
				}

				//console.log("[comp_str] ", comp_str, ", [log_str_list[0]] ", log_str_list[0], );

				//if (!pre_parent_function_name[0] || !pre_parent_function_name[1] || pre_parent_function_name[0].length == 1 || pre_parent_function_name[1].length == 1)
				//	continue ;

				// find parent function
				//if (comp_str.substring(0, pre_parent_function_name.length) == pre_parent_function_name && (comp_str.search("probe") != -1 || comp_str.search("init") != -1)) {
				if (comp_str.substring(0, pre_parent_function_name.length) == pre_parent_function_name && (comp_str.search("probe") != -1)) {
					//console.log('comp_str: ', comp_str, ', pre_parent_funtion_name: ', pre_parent_function_name);
					parent_func_line = parent_function_index;
					break;
				}

				/*
				   if (pre_parent_function_name[0] == pre_parent_function_name[1]) {
				   console.log(obj.device_driver_name, temp);
				   console.log(pre_parent_function_name[0]);
				   }
				 */
			}

			if (!parent_func_line)
				continue;

			var count_bracket = 1;
			var count_line = 1;
			var child_funcs = new Array();

			var func_list = new Array();
			//func_list.push(log_list[parent_func_line]);
			func_list.push(comp_str);

			//console.log("==================================");
			//console.log(log_list[parent_func_line]);

			for (var child_function_index = parent_func_line + 1; child_function_index < log_list.length; child_function_index++) {
				var log_str_list = log_list[child_function_index];

				//console.log(count_line++, log_str_list);

				if (log_str_list[1] == "=>")
					continue;

				if (log_str_list[log_str_list.length - 1].search('{') != -1) {
					func_list.push(log_str_list[0]);
					count_bracket += 1;
					continue;
				}

				if (log_str_list[2].search('}') != -1) {
					count_bracket -= 1;
					var func_name = func_list.pop();

					if (!log_dict[func_name]) {
						log_dict[func_name] = new Array();
						log_dict[func_name].push(1);
						log_dict[func_name].push(Number(log_str_list[0]));
					}
					else {
						log_dict[func_name][0] += 1;
						log_dict[func_name][1] += Number(log_str_list[0]);
					}

					if (!count_bracket)
						break;

					continue;
				}

				if (isdigit(log_str_list[0][0])) {
					if (!log_dict[log_str_list[2]]) {
						log_dict[log_str_list[2]] = new Array();
						log_dict[log_str_list[2]].push(1);
						log_dict[log_str_list[2]].push(Number(log_str_list[0]));
					}
					else {
						log_dict[log_str_list[2]][0] += 1;
						log_dict[log_str_list[2]][1] += Number(log_str_list[0]);
					}
					continue;
				}
			}
			obj.ftrace_log = log_dict;
		}

		// parse memory info
		if (str.search("MemTotal") != -1) {
			var mem_total = Number(str_list[3]);
			var mem_free = Number(str_list[5]);

			obj.mem_util = (mem_total - mem_free) / mem_total;
			continue;
		}

		// parse cpu info
		if (str.search("nice") != -1) {
			var new_cpu_infos = new Array();

			var idx = 0;
			for (var cpu_info_idx = 3; cpu_info_idx < 17; cpu_info_idx += 2) {
				new_cpu_infos[idx++] = Number(str_list[cpu_info_idx]);
			}

			var user = (new_cpu_infos[0] + new_cpu_infos[1]) - (cpu_infos[0] + cpu_infos[1]);
			var system = (new_cpu_infos[2] + new_cpu_infos[5] + new_cpu_infos[6]) -
				(cpu_infos[2] + cpu_infos[5] + cpu_infos[6]);
			var idle = (new_cpu_infos[3] - cpu_infos[3]);
			var iowait = (new_cpu_infos[4] - cpu_infos[4]);

			var aSum = Math.max(user + system + idle + iowait, 1);
			cpu_infos = new_cpu_infos;

			obj.cpu_util = (user / aSum) + (system / aSum);

			if (isNaN(obj.cpu_util))
				obj.cpu_util = 0;

			if (obj.cpu_util > 1)
				obj.cpu_util = 1;

			continue;
		}

		// parse end point
		if (str.search("] initcall") != -1) {
			obj.init_time = Number(str_list[7]) / 1000000;
			obj.return_value = Number(str_list[5]);

			info_array.push(obj);

			obj = new Object();
			log_dict = {};
			continue;
		}
	}
	return info_array;
}

// get ftrace log
app.get('/get_device_driver_info', function (req, res) {
	//console.log(device_driver_info[Number(req.query.kernel_version[1])-1]);
	res.json(device_driver_info[Number(req.query.kernel_version[1]) - 1]);
});

app.get('/get_ftrace_log', function (req, res) {
	//res.json(JSON.stringify(ftrace_info));
	//console.log('req.query.device_driver_name : ', req.query.device_driver_info);
});

var selected_1, selected_2;
app.get('/getDirectoryJSON', function (req, res) {
	console.log('[line 544] app.get(getDirectoryJSON)')
	selected_1 = req.query.selected_1;
	selected_2 = req.query.selected_2;
	list = '<ul>';
	//var directoryPath = "/home/jaeseop/linux";
	var path = kernel_dir_path + '/V' + req.query.selected_1 + '/';

	(async () => {
		if (req.query.selected_2 == null) {
			// var json_list = getDirectoryArchitectureToJSONformat(kernel_dir_path + '/V' + req.query.selected_1 + '/linux');
			console.log('[line 554] if - getDirectoryArchitectureToJSONformat call _ parameter: ',kernel_dir_path + '/V' + req.query.selected_1 + '/linux')
			var json_list = getDirectoryArchitectureToJSONformat(kernel_dir_path + '/V' + req.query.selected_1 + '/linux');

			list = json_list + '</ul>';

			res.json([{
				htmlcode: list,
			}]);
		}
		else {
			console.log('[line 564] else - getHashDiffToArray call ')
			
			var code_view_html = '';

			getHashDiffToArray(req.query.selected_1, req.query.selected_2).then(function (arr) {
				var diff_arr = [];
				for (var i = 0; i < (arr.length) / 2; i++)
					diff_arr[i] = (arr[i].split(" ")[0]).split("/");

				console.log("diff_arr: \n", diff_arr, "\n")
				console.log('[line 574] path_arrary_to_html _ parameter: ')
				code_view_html = path_array_to_html(diff_arr, 0, [], '');	//path, index, str, html

				//console.log('code_view_html: ', code_view_html);
				list += code_view_html + '</ul>';

				res.json([{
					htmlcode: list,
				}]);

				/*
				for (var i = 0; i < (diff_arr.length + 1) / 2; i++) {
					var diff_paths = (diff_arr[i].split(" "))[0].split("/");
					var name = '';

					for (var j = 0; j < diff_paths.length; j++) {
						name += diff_paths[j];

						var stats = fs.lstatSync(path + name);
						if (stats.isDirectory()) 
							name += '/';

						if (diff_paths[j] in path_dict) 
							continue ;
						else {
							path_dict[diff_paths[j]] = 1; // check
							console.log('abs_path: ', path + name);

							if (stats.isDirectory()) {
								code_view_html += '<details close> <summary class="folder">' + name + '</summary>';
								code_view_html += '<ul>';

								if (j != diff_paths.length - 1) {
									code_view_html += '</ul></details>';
									code_view_html += '</li>';
								}
							}
						}
					}
					code_view_html += '</ul></details>';
					code_view_html += '</li>';
				}
				list += code_view_html + '</ul>';
				console.log('list: ', list);
				*/
			});
		}

	})();
});
// 경로 수정: /home/jaeseop/html_test -> /home/ssrlab-sub/gwangyong/BMC
var path_dict = new Object();
function path_array_to_html(path, index, str, html) {
	//return "<ul><details close> <summary class=\"folder\">V1</summary><ul><li id=\"/home/jaeseop/html_test/kernel_management/V1/dmesg.txt\" onclick=\"selectFile(this.id)\">dmesg.txt</li></ul></details></li></ul>";
	//0618

	

	return '<ul><details close> <summary class=\"folder\">' + 'linux' + '</summary>' + '<ul>' +
		'<li id=\"/home/ssrlab-sub/gwangyong/BMC/kernel_management/V1/linux/.config\" onclick=\"selectFile(this.id)\">' + '.config' + '</li>' +

		'<details close> <summary class=\"folder\">' + 'drivers' + '</summary>' + '<ul>' +

		'<details close> <summary class=\"folder\">' + 'tty' + '</summary>' + '<ul>' +

		'<details close> <summary class=\"folder\">' + 'serial' + '</summary>' + '<ul>' +

		'<details close> <summary class=\"folder\">' + '8250' + '</summary>' + '<ul>' +

		'<li id=\"/home/ssrlab-sub/gwangyong/BMC/kernel_management/V1/linux/drivers/tty/serial/8250/8250_core.c\" onclick=\"selectFile(this.id)\">' + '8250_core.c' + '</li>' +

		'</ul></details>' + '</li>' +

		'</ul></details>' + '</li>' +

		'</ul></details>' + '</li>' +

		'</ul></details>' + '</li>' +

		'</ul></details>' + '</li>' +
		'</ul>';

	// to be modified // recursive, stack, ... not easy
	/*
	for (var path_index = 0; path_index < path.length; path_index++) {
		if (!str[path_index])
			str[path_index] = kernel_dir_path;

		str[path_index] += ('/' + path[path_index][index]);

		if (path_dict[path[index]])
			path_array_to_html (path, index + 1, str, html);
		else {
			console.log('str[path_index]: ', str[path_index]);
			var stats = fs.lstatSync(str[path_index]);

			if (stats.isDirectory()) {
				console.log(str, ' is directory');
				html += '<details close> <summary class=\"folder\">' + path[index] +'</summary>';
				html += '<ul>'

				path_array_to_html (path, index+1, str, html);

				html += '</ul></details>';
				html += '</li>';

				path_dict[path[index]] = 1;
			}
			else {
				html += '<li id=\"' + str + '\" onclick=\"selectFile(this.id)\">' + path[index];
				html += '</li>';
			}
		}

		return html;
	}
	*/
}

app.post('/viewFile', function (req, res) {
	console.log('[POST] /viewFile')
	var file_path = req.body.data.path;

	if (!selected_2) {
		fs.readFile(file_path, function (err, data) {
			res.json([{
				str: data.toString()
			}]);
		});
	}
	else {
		//var first_file = fs.readFileSync(file_path).toString().split('\n');
		var tmp_path = file_path.split(selected_1);

		var second_path = tmp_path[0] + selected_2 + tmp_path[1];
		//var second_file = fs.readFileSync(second_path).toString().split('\n');

		/*
		var file_diff = first_file
				.filter(x => !second_file.includes(x))
				.concat(second_file.filter(x => !first_file.includes(x)));
		*/
		var spawn = require('child_process').spawn;
		var diff_res = spawn('diff', [file_path, second_path]);

		diff_res.stdout.on('data', function (data) {
			console.log('stdout: ', data);

			res.json([{
				//str:file_diff.toString()
				str: data.toString()
			}]);
		});
	}
});

async function getHashDiffToArray(version_1, version_2) {
	var first_file = fs.readFileSync(kernel_dir_path + '/V' + version_1 + '/hash.txt').toString().split('\n');
	var second_file = fs.readFileSync(kernel_dir_path + '/V' + version_2 + '/hash.txt').toString().split('\n');

	var hash_diff = first_file
		.filter(x => !second_file.includes(x))
		.concat(second_file.filter(x => !first_file.includes(x)));

	return hash_diff;
}

//BMC log 가져오기로 활용 예정 
app.get('/request/report', function (req, res) {
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/request/report"
	}, function (err, response, body) {
		res.json(JSON.parse(body))
	})
});

app.get('/getStats', function (req, res) {
	console.log('getStats')
	var data = fs.readFileSync("./report.json", 'utf8');
	var words = JSON.parse(data);
	res.json([words]);
});

//[GET] BMC /proc/cpuinfo && /proc/meminfo 
app.get('/cpuinfo/on', function (req, res) {
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/cpuinfo/on"
	}, function (err, response, body) {
		console.log("/cpuinfo/on body: \n", body,"\n")
		res.json(JSON.parse(body))
	})
});
//testcode 20230614
app.get('/stat_mem/result', function (req, res) {
	console.log('test:: stat')
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/stat_mem/result"
	}, function (err, response, body) {
		res.json(JSON.parse(body))
	})
});
app.get('/cpu/usage', function (req, res) {
	console.log('[GET]:: /cpu/usage')
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/cpu/usage"
	}, function (err, response, body) {
		res.json(JSON.parse(body))
		console.log('get usage of CPU',JSON.parse(body)["usage"])
	})
});

app.post('/cpu/usagestop', function (req, res) {
	console.log('[GET]:: /cpu/usagestop')
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/cpu/usagestop"
	}, function (err, response, body) {
		console.log('Stop get usage of CPU')
	})
});

app.post('/fan/do', function (req, res) {
	rq.post({
		url: "http://"+bmc_server_ip+bmc_server_port+"/fan/do"
	}, function (err, response, body) {
		//call back
		console.log("start.js :: fan/do")
	})
})

app.post('/fan/end', function (req, res) {
	rq.post({
		url: "http://"+bmc_server_ip+bmc_server_port+"/fan/end"
	}, function (err, response, body) {
		//call back
		console.log("start.js :: fan/end")
	})
})

app.get('/fan', function (req, res) {
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/fan"
	}, function (err, response, body) {
		//call back
		console.log("start.js :: fan")
		// res.json(JSON.parse(body))
	})
})


app.get('/write', function (req, res) {
	// var data=fs.readFileSync("./stats.json", 'utf8');
	// var words=JSON.parse(data);
	// console.log(words);
	// res.json([words]);
	var method = "GET";
	var url = "/cpuinfo/on";
	var status_code = "200";
	var start_time = 0;
	var end_time = 10;
	var data = fs.readFileSync("../public/report.json", 'utf8');
	var jsondata = JSON.parse(data);
	console.log("before" + jsondata[`${method} ${url} ${status_code}`]["Count"])
	var end_time = new Date().getTime();
	var responseTime = end_time - start_time;
	var key = method + " " + url + " " + status_code;
	var current_cnt = jsondata[key]["Count"] + 1;
	var str = "response_time_" + current_cnt;
	jsondata[`${method} ${url} ${status_code}`]["Count"] = current_cnt;
	timelist = JSON.stringify(jsondata[`${method} ${url} ${status_code}`]["Time"]);
	jsondata[`${method} ${url} ${status_code}`]["Time"] = {
		[str]: responseTime
	};
	timelist = timelist.replace("]", ",") + JSON.stringify(jsondata[`${method} ${url} ${status_code}`]["Time"]) + "]";
	console.log(">>>>" + responseTime);
	console.log(">>" + JSON.stringify(jsondata[`${method} ${url} ${status_code}`]["Count"], null, 4))
	console.log("timelist" + JSON.parse(timelist))
	jsondata[`${method} ${url} ${status_code}`]["Time"] = JSON.parse(timelist);
	console.log("Finally>" + JSON.stringify(jsondata, null, 4))
	fd = JSON.stringify(jsondata, null, 4);
	console.log("Finally>" + JSON.parse(fd));

	fs.writeFileSync("../public/report.json", fd);
	res.json(fd);
});

function getDirectoryArchitectureToJSONformat(filename) {
	if (filename.search("Vundefined"))
		return "No kernel version has been selected yet!!<br>Please select a kernel version to compare";
	var stats = fs.lstatSync(filename),
		info = {
			path: filename,
			name: path.basename(filename)
		};

	if (stats.isDirectory()) {
		list = list + '<details close> <summary class="folder">' + info.name + '</summary>';
		list = list + '<ul>';
		info.type = "folder";
		info.children = fs.readdirSync(filename).map(function (child) {
			return getDirectoryArchitectureToJSONformat(filename + '/' + child);
		});
		list = list + '</ul></details>';
		list = list + '</li>';
	} else {
		list = list + '<li id="' + info.path + '" onclick="selectFile(this.id)">' + info.name;
		info.type = "file";
		list = list + '</li>';
	}
	cnt = cnt + 1;
	return list;
}
//-------------------------
//2023 03 09 Add

app.get('/get_Application_List', function (req, res) {

	q.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/application_list"
	}, function (err, response, body) {
		//call back
		console.log("get_application_list")
		res.json(JSON.parse(body))

		// res.json(JSON.parse(body))
	})
});
//----------------
//2023 06 08 GY
//Power usage in booting process
app.get('/calc_dmesg_based_watt', function (req, res) {
	let AST2600_watt = 7.54
	var path = kernel_dir_path + '/V' + (Number(req.query.kernel_version[1]) ) + '/dmesg.txt';
	//time * watt
	var data = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
	var datas = data.split("\n");
	
	//[   12.607893] IPv6: ADDRCONF(NETDEV_CHANGE): eth0: link becomes ready
	var str = datas[datas.length-2].split("[")
	var str2 = str[1].split("]")

	console.log('dmesg last line based usage watt: ', Number(str2[0])* AST2600_watt)
	// var str2 = str[1].split("]")
	
	usage_watt = Number(str2[0])* AST2600_watt
	res.json(usage_watt.toFixed(3));
});
app.get('/getHttpCodeList', function (req, res) {
	var data = fs.readFileSync("./httpcodereport.json", 'utf8');
	var words = JSON.parse(data);
	console.log('/getHttpCodeList');
	res.json([words]);
});

app.get('/getHttpResonseTime', function (req, res) {
	var data = fs.readFileSync("./report.json", 'utf8');
	var words = JSON.parse(data);
	console.log('/getHttpResonseTime');
	res.json([words]);
});

app.get('/getHttpResonseTime_info', function (req, res) {
	var data = fs.readFileSync("./report.json", 'utf8');
	var words = JSON.parse(data);
	console.log('/getHttpResonseTime');
	res.json([words]);
});

app.listen(4000);

