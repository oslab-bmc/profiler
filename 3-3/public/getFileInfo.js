var before_element;
var node_server_ip = '192.168.0.33'
var node_server_port = ':4000'

function selectFile(id){
    console.log('click :: '+id);

    fetch('http://'+node_server_ip+node_server_port+'/viewFile', {
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            data:{
                path:id
            }
        })
    }).then(response => response.json()
    .then(json =>{
        if (before_element == id){
            document.getElementById(before_element).style.fontSize='17px';
            document.getElementById(before_element).style.color='#888';
            document.getElementById('code_view_right_div').innerText = "";
            before_element = null;
            return;
        }
        if (before_element != null){            
            document.getElementById(before_element).style.fontSize='17px';
            document.getElementById(before_element).style.color='#888';
        }
        document.getElementById(id).style.fontSize ='18px';
        document.getElementById(id).style.color = 'red';
        document.getElementById('code_view_right_div').innerText = "\n\r"+json[0].str.toString();
        before_element = id;
        //json
    }));

}