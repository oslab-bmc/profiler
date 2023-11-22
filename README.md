# profiler
README [oslab_profiler]

### 프로파일러 구조
3-3 : 웹 기반 프로파일러 소스코드
kernel_management : BMC 커널 버전 관리

### 프로파일러 통신 구조
#### BMC 서버 : server_CP

#### 프로파일러(개발환경 - 서버, 프론트) : oslab_profiler

#### 개발환경
        - 커널 버전 관리
        - 웹 서버 <-> BMC 서버와 통신
/------------------------------------------------/

### [사용 메뉴얼]
BMC에서 server_CP 업로드 및 실행
개발환경의 프로파일러 경로에서 3-3/src/start.js 실행
$ node start.js


/------------------------------------------------/

[웹 서버 이식을 위해 수정해야될 ip:port 목록]
1. 3-3/public/getDirectoryTree.js
        - node_server_ip : 웹 서버 ip;
        - node_server_port : 웹 서버 port;

2. 3-3/public/getFileInfo.js
        - node_server_ip : 웹 서버 ip;
        - node_server_port : 웹 서버 port;

3. 3-3/public/requestChart.js
        - node_server_ip : 웹 서버 ip;
        - node_server_port : 웹 서버 port;
        - bmc_server_ip : bmc 서버 ip;
        - bmc_server_port : bmc 서버 port;

4. 3-3/public/script.js
        - node_server_ip : 웹 서버 ip;
        - node_server_port : 웹 서버 port;
        - var url = 'http://203.253.25.202:9004/'; // 웹 서버
        - var link = 'http://203.253.25.202:9004/secondPage'; // 웹 2페이지(사용자영역 프로파일링) 주소

5. 3-3/public/secondpage_script.js
        - node_server_ip : 웹 서버 ip;
        - node_server_port : 웹 서버 port;
        - bmc_server_ip : bmc 서버 ip;
        - bmc_server_port : bmc 서버 port;

6. 3-3/src/setupProxy.js
        - target: 'http://203.253.25.207:9000'; //BMC 서버

7. 3-3/src/start.js
        - app.listen(9004); // 웹 서버 port
/------------------------------------------------/

[웹 서버 이식을 위해 수정해야될 하드코딩된 경로 목록]
1. 3-3/src/start.js
        - var kernel_dir_path = path.join("/", "home", "keti","oslab_profiler", "kernel_management"); //kernel management 경로 수정

/------------------------------------------------/


