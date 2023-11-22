#include <stdio.h>
#include <string.h>

int main() {
    char filePath[1024];  // 파일 경로를 저장할 버퍼
    char *directoryPath;  // 디렉토리 경로를 가리킬 포인터

    // 파일 경로 입력 받기
    printf("파일의 절대 경로를 입력하세요: ");
    if (scanf("%1023s", filePath) != 1) {
        fprintf(stderr, "입력 오류\n");
        return 1;
    }

    // 디렉토리 경로 추출
    directoryPath = dirname(filePath);

    printf("해당 파일의 디렉토리 경로: %s\n", directoryPath);
	printf("파일의 경로 : %s\n", filePath);
    return 0;
}
