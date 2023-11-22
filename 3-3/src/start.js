var express = require('express');
var fs = require('fs'); //hdw (file i/o)
const { exec } = require('child_process'); //hdw (bootgraph)
const { execSync } = require('child_process'); //pmh (kernel_management)

var app = express();

// for Hashing
var crypto = require('crypto');

// for Kernel Source Download
//var wget = require('node-wget');

//var url = require('url');

var readline = require('readline');
var rq = require('request');	//sudo npm install request
var router = new express.Router();

var bmc_server_ip = '203.253.25.207'
var bmc_server_port = ':9000'

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

var kernel_version_list = [];


//client 위치 변경시 변경해야될 부분
var kernel_dir_path = path.join("/", "home", "keti","oslab_profiler", "kernel_management");
var kernel_dir_list = fs.readdirSync(kernel_dir_path).filter(item => item !== 'ORG');
var kernel_dir_org = kernel_dir_path+'/ORG';
var count_version = 0;
var unregistered_file = [];
var device_driver_info = new Array();
var log_list = [];	//현재 관리하고 있는 커널 버전에 대한 파악(부팅 로그(dmesg 로그), Ftrace 로그 등 파싱) [start.js, line 75]

(async () => {
	try {
		for (var list_index = 0; list_index < kernel_dir_list.length; list_index++) {
			if (kernel_dir_list[list_index][0] == 'V') {
				var version = kernel_dir_list[list_index];

				// log_list[list_index] = await parse_trace(version);
				// console.log('[parse_trace_' + count_version + '] finish');

				device_driver_info[list_index] = await parse_dmesg(version, log_list[list_index]);
				console.log('[parse_dmesg_' + count_version + '] finish');

				count_version++;

				continue;
			}	//<-- 새로운 버전이 추가됨 [start.js, line 89]
			// pmh
			if (kernel_dir_list[list_index] == "ORG") {
				continue;
			}
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
// 	for (var number_index = 0; number_index < n.length; number_index++)
// 		if ((n[number_index] <= '0' || n[number_index] >= '9') && n[number_index] != '.')
// 			return false;

// 	return true;
// 
	return typeof n === 'number';
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
	// console.log('[parse_trace] kernel_version: ', kernel_version);
	var log_list = new Array();
	// var path = kernel_dir_path + '/' + kernel_version + '/trace.txt';

	// var logs = fs.readFileSync(path).toString().split("\n");

	// for (var log_index = 0; log_index < logs.length; log_index++) {
	// 	var trace_str_list = logs[log_index].split(/[ |!+@#*;]/).filter(Boolean);

	// 	if (!(trace_str_list.length))
	// 		continue;

	// 	if (!isdigit(trace_str_list[0][0]))
	// 		continue;

	// 	trace_str_list.shift();

	// 	// to do work
	// 	if (trace_str_list[0] == "==========>" || trace_str_list[0] == "<==========")
	// 		continue;

	// 	log_list.push(trace_str_list);
	// }
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
var diff_log = [];
app.get('/getDirectoryJSON', function (req, res) {
	console.log('[line 544] app.get(getDirectoryJSON)')
	selected_1 = req.query.selected_1;
	selected_2 = req.query.selected_2;
	console.log('selected 1 ', selected_1);
	console.log('selected 2' , selected_2);
	list = '<ul>';

	// if (selected_2 !== 1 && selected_2 !== 2) {
	if (isNaN(selected_2)){
		// var json_list = getDirectoryArchitectureToJSONformat(kernel_dir_path + '/V' + req.query.selected_1 + '/linux');
		console.log('[line 554] if - getDirectoryArchitectureToJSONformat call _ parameter: ',kernel_dir_path + '/V' + req.query.selected_1 + '/linux')
		var json_list = getDirectoryArchitectureToJSONformat(kernel_dir_path + '/V' + req.query.selected_1 + '/linux');
		
		list = json_list + '</ul>';

		res.json([{
			htmlcode: list,
		}]);
	}
	else {
		// pmh
		var code_view_html = '';
		var current_log = null;
		diff_log = [];

		console.log('[line 462]........ exec diff dir')
		
		var kernel_1 = kernel_dir_path + '/V' + req.query.selected_1 + '/kernel-source__molt';
		var kernel_2 = kernel_dir_path + '/V' + req.query.selected_2 + '/kernel-source__molt';
		var kernel_org = kernel_dir_org + '/kernel-source';
		var command = './comp_kernel/ssu_diff '+kernel_org + ' ' + kernel_1 + ' ' + kernel_2;
		console.log(command);
		const stdout = execSync(command).toString();
		const diff_lines = stdout.split('\n');

		for (var line of diff_lines) {
			if (line.startsWith('diff ')) {
				if (current_log) {
					diff_log.push(current_log);
				}
				const path = line.slice(5);
				current_log = { path, diffdata : [] };
			}
			else if (current_log) {
				current_log.diffdata.push(line);
			}
		}
		if (current_log)
			diff_log.push(current_log);
			
		if (diff_log.length !== 0) {
			const pathTree = createPathTree(diff_log);
			const visualizationHTML = generateHtmlTree(pathTree);
			res.json([{
				htmlcode: visualizationHTML,
			}]);
		}
		
	}
});

function createPathTree(paths) {
	const pathTree = {};
	paths.forEach(data => {
		const pathParts = data.path.split('/');
		let currentNode = pathTree;
		let diffData = data.diffdata; // diff 데이터 가져오기
		let path = data.path;
	  	let skipV2 = false;
	  	pathParts.forEach((part, index) => {
			if (skipV2) {
	      			if (index === pathParts.length - 1) {
					currentNode[part] = { isFile: true, path: path, diffData: diffData };
	      			} else if (!currentNode[part]) {
					currentNode[part] = {};
	      			}
	      			currentNode = currentNode[part];
	    		}
	    		if (part === 'kernel_management') {
	      			skipV2 = true;
	    		}
	  	});
	});
	return pathTree;
}

function generateHtmlTree(node) {
	let html = '';
      
	for (const key in node) {
	  	if (node[key].isFile) {
	    		// 파일일 경우, 파일로 표시하고 onclick 이벤트 추가
	   		html += `<li id="${node[key].path}" onclick=\"selectFile(this.id)\">${key}</li>`;
			html += `<script type="text/javascript">`
			html += `"${node[key].path}".click(function() {
				selectFile(node[key].diffData);
			});`
			html += `</script>`;
	  	} else {
	    		html += `<details close><summary class="folder">${key}</summary>`;
	    		html += '<ul>';
	    		html += generateHtmlTree(node[key]);
	    		html += '</ul>';
	    		html += '</details>';
		}
	}
	
	return html;
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
		if (diff_log.length < 1) {
			res.json([{
				str: log.path.toString()
			}])
		}
		
		for (const log of diff_log) {
			if (log.path === file_path) {
				res.json([{
					str: log.diffdata.join('\n')
				}])
			}
		}
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

app.get('/process_info', function (req, res) {
	console.log('[GET]:: /process_info')
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/process_info"
	}, function (err, response, body) {
		res.json(JSON.parse(body));
		console.log(JSON.parse(body));
	})
});

app.get('/bootgraph', function (req, res) {//hdw
	console.log('[GET]:: /bootgraph')
	rq.get({
		 url: "http://"+bmc_server_ip+bmc_server_port+"/bootgraph"
	}, function (err, response, body) {
		 res.json(JSON.parse(body))//JSON.parse(body)["dmesg"]
		 // 파일에 데이터 쓰기
		 fs.writeFile('../bootgraph/cur_bootgraph.txt', JSON.parse(body)["dmesg"], (err) => {
		 if (err) {
				console.error('파일에 쓰기 오류 발생:', err);
		 } else {
				console.log('파일에 데이터 쓰기 성공');
				exec('cat ../bootgraph/cur_bootgraph.txt | perl ../bootgraph/bootgraph.pl > ../bootgraph/cur_bootgraph.svg', (error, stdout, stderr) => {
					if (error) {
					  console.error(`오류 발생: ${error}`);
					  return;
					}
					console.log('cat 명령 결과:');
					console.log(stdout);
				  });
		 	}
		 });
	})
});

app.get('/bootgraph/current', function (req, res) {//pmh
	console.log('[GET]:: /boograph/current');
	fs.readFile('../bootgraph/cur_bootgraph.svg', 'utf8', function(error, data) {
		res.set('Content-type', 'image/svg+xml');
		res.json ([{
			svg : data
		}])
	});
});

app.get('/bootgraph/kernel_1', function (req, res) {
	console.log('[GET]:: /bootgraph/kernel_1');
	var selected_1 = req.query.selected_1;
	path = kernel_dir_path + '/V' + selected_1 + '/bootgraph.svg';
	fs.readFile(path, 'utf8', function(error, data) {
		res.set('Content-type', 'image/svg+xml');
		res.json([{
			svg: data
		}])
	});
});

app.get('/bootgraph/kernel_2', function (req, res) {
	console.log('[GET]:: /bootgraph/kernel_2');
	var selected_1 = req.query.selected_1;
	var selected_2 = req.query.selected_2;
	var path1 = kernel_dir_path + '/V' + selected_1 + '/bootgraph.svg';
	var path2 = kernel_dir_path + '/V' + selected_2 + '/bootgraph.svg';
	fs.readFile(path1, 'utf8', function(error, data1) {
		fs.readFile(path2, 'utf8', function (error2, data2) {
			res.set('Content-type', 'image/svg+xml');
			res.json([{
				svg1: data1,
				svg2: data2
			}])
		});
	});
});

app.get('/bootgraph/cur_dmesg', function (req, res) {
	console.log('[GET]:: /bootgraph/cur_dmesg');
	var path = '../bootgraph/cur_bootgraph.txt';

	var data = fs.readFileSync(path, {encoding: 'utf8', flag: 'r'});
	var datas = data.split('\n');

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

		// parse start point
		if (str.search("] calling") != -1) {
			obj.start_time = Number(str_list[0]);
			obj.device_driver_name = str_list[2];
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
	res.json([{
		info : info_array
	}]);
})

app.get('/signal', function (req, res) {//hdw
	console.log('[GET]:: /signal')
	rq.get({
		url: "http://"+bmc_server_ip+bmc_server_port+"/signal"
	}, function (err, response, body) {
		res.json(JSON.parse(body));
		// console.log(JSON.parse(body));
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
	res.send(usage_watt.toFixed(3));
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

app.listen(9000);