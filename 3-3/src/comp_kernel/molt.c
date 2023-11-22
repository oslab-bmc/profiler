#include<stdio.h>
#include<stdlib.h>
#include<unistd.h>
#include<fcntl.h>
#include<sys/types.h>
#include<sys/stat.h>
#include<string.h>
#include<wait.h>
#include<dirent.h>
#include<errno.h>
#include<time.h>
#include<getopt.h>

#define BUFMAX 4096
#define NAMEMAX 256
#define HASHLEN 33

void molting_dir(char *, char *, char *);
void molting_file(char *, char *, char *);
int scandir_filter(const struct dirent *);


int main(int argc, char *argv[]){
    char o_path[BUFMAX];
    char c_path[BUFMAX];
    char m_path[BUFMAX];
    struct stat statbuf1, statbuf2;
    if (argc != 3) {
        fprintf(stderr, "usage : <org_path__skin> <cmp_path__skin>\n");
        exit(1);
    }
    
    if ((access(argv[1], F_OK) < 0) || access(argv[2], F_OK) < 0) {
        fprintf(stderr, "argv[1] or argv[2] don't exist..\n");
        exit(1);
    }

    stat(argv[1], &statbuf1);
    stat(argv[2], &statbuf2);

    if (!S_ISDIR(statbuf1.st_mode) || !S_ISDIR(statbuf2.st_mode)) {
        fprintf(stderr, "argv[1] or argv[2] are not dir\n");
        exit(1);
    }

    if (argv[1][0] != '/')
        realpath(argv[1], o_path);
    else
        strcpy(o_path, argv[1]);
    
    if (argv[2][0] != '/')
        realpath(argv[2], c_path);
    else
        strcpy(c_path, argv[2]);
    
    strcpy(m_path, c_path);
    
    char *ptr = strrchr(m_path, '_');
    *(ptr - 1) = 0;
    
    sprintf(m_path, "%s__molt", m_path);

    if (access(m_path, F_OK) == 0)
        rmdir(m_path);
    mkdir(m_path, 0755);

    molting_dir(o_path, c_path, m_path);
}

void molting_dir(char *o_path, char *c_path, char *m_path) {
    struct dirent **o_filelist;
    struct dirent **c_filelist;
    struct stat o_stat, c_stat;
    char tmp_o_path[BUFMAX];
    char tmp_c_path[BUFMAX];
    char tmp_m_path[BUFMAX];
     
    int o_count, c_count;
    int i, j;

    if ((o_count = scandir(o_path, &o_filelist, scandir_filter, alphasort)) < 0) {
        fprintf(stderr, "in function molting_dir: scandir error\n");
        return;
    }

    if ((c_count = scandir(c_path, &c_filelist, scandir_filter, alphasort)) < 0) {
        fprintf(stderr, "in function molting_dir: scandir error\n");
        return;
    }

    i = 0, j = 0;

    while (i < o_count && j < c_count) {
        bzero(tmp_o_path, BUFMAX);
        bzero(tmp_c_path, BUFMAX);
        bzero(tmp_m_path, BUFMAX);
        sprintf(tmp_o_path, "%s/%s", o_path, o_filelist[i]->d_name);
        sprintf(tmp_c_path, "%s/%s", c_path, c_filelist[j]->d_name);
        stat(tmp_o_path, &o_stat);
        stat(tmp_c_path, &c_stat);

        int n = strcmp(o_filelist[i]->d_name, c_filelist[j]->d_name);
        
        if (n == 0) {
            sprintf(tmp_m_path, "%s/%s", m_path, o_filelist[i]->d_name);

            if (S_ISDIR(o_stat.st_mode) && S_ISDIR(c_stat.st_mode)) {
                molting_dir(tmp_o_path, tmp_c_path, tmp_m_path);
            }
            else if (!S_ISDIR(o_stat.st_mode) && !S_ISDIR(c_stat.st_mode)) {
                molting_file(tmp_o_path, tmp_c_path, tmp_m_path);
            }
            i++, j++;
        }
        else if (n < 0) {
            i++;
            continue;
        }
        else {
            j++;
            continue;
        }
    }

    for (i = 0; i < o_count; i++) free(o_filelist[i]);
    for (j = 0; j < c_count; j++) free(c_filelist[j]);
    free(o_filelist), free(c_filelist);
}

void molting_file(char *o_path, char *c_path, char *m_path) {
    char o_buf[BUFMAX];
    char c_buf[BUFMAX];
    char o_hash[HASHLEN];
    char c_hash[HASHLEN];
    char cmdline[BUFMAX];
    int o_fd, c_fd, m_fd;

    o_fd = open(o_path, O_RDONLY);
    c_fd = open(c_path, O_RDONLY);

    read(o_fd, o_hash, HASHLEN);
    read(o_fd, o_buf, BUFMAX);
    read(c_fd, c_hash, HASHLEN);
    read(c_fd, c_buf, BUFMAX);

    o_hash[HASHLEN-1]=0;
    c_hash[HASHLEN-1]=0;
    o_buf[strlen(o_buf)]=0;
    c_buf[strlen(c_buf)]=0;

    if (strcmp(o_hash, c_hash) == 0) {
    //    printf("%s | %s\n", c_buf, m_path);
    }
    else {
        if (access(m_path, F_OK) < 0) {
            sprintf(cmdline, "mkdir -p $(dirname %s)", m_path);
            system(cmdline);
        }
        sprintf(cmdline, "cp %s %s", c_buf, m_path);
        system(cmdline);
    }

    close(o_fd), close(c_fd);
}

int scandir_filter(const struct dirent *file) {	   //scandir 사용 시 .와 ..를 제외하고 저장하게 해주는 함수
	if (!strcmp(file->d_name, ".") || !strcmp(file->d_name, "..") || !strcmp(file->d_name, ".git"))
		return 0;
	else return 1;
}
