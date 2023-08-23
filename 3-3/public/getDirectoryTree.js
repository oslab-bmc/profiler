
window.onload = function () {
    var node_server_ip = '192.168.0.33'
    var node_server_port = ':4000'
    
    fetch('http://'+node_server_ip+node_server_port+'/getDirectoryJSON')
        .then(
            response => response.json()
        )
        .then(json => {
            //console.log('get JSON :: ' + json);
            document.getElementById('code_view_left').innerHTML = json[0].htmlcode.toString();
        });
}