#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/dir.h>
#include <string.h>
#include <wait.h>
#include <dirent.h>
#include <openssl/md5.h>

// oslab test
#define BUFMAX 4096
#define HASHLEN 33

char buf[BUFMAX];
char fpath[BUFMAX];
char spath[BUFMAX];

void skinning_dir(char *, char *);
void skinning_file(char *, char *);
int scandir_filter(const struct dirent *);
int md5(char *, char *);

int main(int argc, char *argv[]){
    struct stat statbuf1, statbuf2;
    DIR * dir;
    struct dirent target;
    char *filename;

    if(argc < 3){
        fprintf(stderr, "usage : %s <directory path> <skin directory path>\n", argv[0]);
        exit(1);
    }

    if (access(argv[1], F_OK) || access(argv[2], F_OK)) {
        fprintf(stderr, "usage : %s <directory path> <skin directory path\n", argv[0]);
        exit(1);
    }

    stat(argv[1], &statbuf1);
    stat(argv[2], &statbuf2);

    if(!S_ISDIR(statbuf1.st_mode) || !S_ISDIR(statbuf2.st_mode)){
        fprintf(stderr, "%s or %s is not directory\n", argv[1], argv[2]);
        exit(1);
    }

    if(argv[1][0] != '/')
	    realpath(argv[1], fpath);
    else 
        strcpy(fpath, argv[1]);

    if (argv[2][0] != '/')
        realpath(argv[2], spath);
    else
        strcpy(spath, argv[2]);

    printf("%s | %s\n", fpath, spath);
    
    if (strstr(spath, fpath) != NULL) {
        fprintf(stderr, "<skin directory path> cannot be sub directroy of <directory path>\n");
        exit(1);
    }

    filename = strrchr(fpath, '/');
    filename++;
    sprintf(spath, "%s/%s__skin", spath, filename);
    printf("%s\n", spath);

    if (access(spath, F_OK) == 0)
        rmdir(spath);
    mkdir(spath, 0755);
    skinning_dir(fpath, spath);
    exit(0);
}

void skinning_dir(char *fpath, char *spath) {
    struct dirent **filelist;
    struct stat statbuf;
    char tmp_fpath[BUFMAX];
    char tmp_spath[BUFMAX];
    int count;


    if ((count = scandir(fpath, &filelist, scandir_filter, alphasort))< 0) {
    	fprintf(stderr, "in function skinning_dir: scandir error\n");
    	return;
    }

    for (int i = 0; i < count; i++) {
        memset(tmp_fpath, 0, BUFMAX);
        memset(tmp_spath, 0, BUFMAX);
        sprintf(tmp_fpath, "%s/%s", fpath, filelist[i]->d_name);
        sprintf(tmp_spath, "%s/%s", spath, filelist[i]->d_name);
        stat(tmp_fpath, &statbuf);

        if (S_ISDIR(statbuf.st_mode)) {
            mkdir(tmp_spath, 0755);
            skinning_dir(tmp_fpath, tmp_spath);
        }
        else {
            skinning_file(tmp_fpath, tmp_spath);
        }
    }

    for (int i = 0; i < count; i++) free(filelist[i]);
    free(filelist);
}

void skinning_file(char *fpath, char *spath) {
    unsigned char hash[HASHLEN];
    char buf[BUFMAX];
    int fd;

    md5(fpath, hash);
    
    if ((fd = open(spath, O_WRONLY | O_CREAT | O_TRUNC, 0644)) < 0) {
        fprintf(stderr, "open error for %s\n", spath);
        exit(1);
    }

    memset(buf, 0, BUFMAX);
    sprintf(buf, "%s|%s", hash, fpath);
    write(fd, buf, strlen(buf) + 1);
    close(fd);
}

int md5(char *target_path, char *hash_result) {
    FILE *fp;
	unsigned char hash[MD5_DIGEST_LENGTH];
	unsigned char buffer[1024];
	int bytes = 0;
	MD5_CTX md5;

	if ((fp = fopen(target_path, "rb")) == NULL){
		printf("ERROR: fopen error for %s\n", target_path);
		return 1;
	}

	MD5_Init(&md5);

	while ((bytes = fread(buffer, 1, 1024, fp)) != 0)
		MD5_Update(&md5, buffer, bytes);
	
	MD5_Final(hash, &md5);

	for (int i = 0; i < MD5_DIGEST_LENGTH; i++)
		sprintf(hash_result + (i * 2), "%02x", hash[i]);
	hash_result[HASHLEN - 1] = 0;

	fclose(fp);

	return 0;

}


int scandir_filter(const struct dirent *file) {	   //scandir 사용 시 .와 ..를 제외하고 저장하게 해주는 함수
	if (!strcmp(file->d_name, ".") || !strcmp(file->d_name, "..") || !strcmp(file->d_name, ".git"))
		return 0;
	else return 1;
}
