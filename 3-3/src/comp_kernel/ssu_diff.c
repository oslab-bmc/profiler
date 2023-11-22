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

#define BUFMAX 4096
#define HASHLEN 33

char skin_path1[BUFMAX], skin_path2[BUFMAX];
char skin_path_org[BUFMAX];
char molt_path1[BUFMAX], molt_path2[BUFMAX];
char org_path[BUFMAX];

void comp_dir(char*, char *, char *, char *, char *);
void diff_dir(char *, char *, int);
void diff_file(char *, char *, char *, char *);
void diff_file_org(char *, char *);
int scandir_filter(const struct dirent *);
int main(int argc, char **argv) 
{
        struct stat statbuf1, statbuf2, statbuf3;
        char *ptr;

        if (argc != 4) {
                fprintf(stderr, "usage : %s <molt path org> <molt path 1> <molt path 2>\n", argv[0]);
                exit(1);
        }

        if ((access(argv[1], F_OK) < 0) || (access(argv[2], F_OK) < 0) || (access(argv[3], F_OK) < 0)) {
                fprintf(stderr, "argv[1] or argv[2] don't exist..\n");
                exit(1);
        }

        stat(argv[1], &statbuf1);
        stat(argv[2], &statbuf2);
        stat(argv[3], &statbuf3);
        
        if (!S_ISDIR(statbuf1.st_mode) || !S_ISDIR(statbuf2.st_mode) || !S_ISDIR(statbuf3.st_mode)) {
                fprintf(stderr, "argv[1] or argv[2] or argv[3] are not dir\n");
                exit(1);
        }

        if (argv[1][0] != '/')
                realpath(argv[1], org_path);
        else
                strcpy(org_path, argv[1]);

        if (argv[2][0] != '/')
                realpath(argv[2], molt_path1);
        else
                strcpy(molt_path1, argv[2]);
        
        if (argv[3][0] != '/')
                realpath(argv[3], molt_path2);
        else
                strcpy(molt_path2, argv[3]);

        strcpy(skin_path1, molt_path1);
        ptr = strrchr(skin_path1, '_');
        *(ptr - 1) = 0;
        sprintf(skin_path1, "%s__skin", skin_path1);

        strcpy(skin_path2, molt_path2);
        ptr = strrchr(skin_path2, '_');
        *(ptr - 1) = 0;
        sprintf(skin_path2, "%s__skin", skin_path2);
        
        printf("skin_path : %s | %s\n", skin_path1, skin_path2);
        printf("molt_path : %s | %s\n", molt_path1, molt_path2);

        if ((access(skin_path1, F_OK) < 0) || access(skin_path2, F_OK) < 0) {
                fprintf(stderr, "skin paths are not exist..\n");
                exit(1);
        }  

        stat(skin_path1, &statbuf1);
        stat(skin_path2, &statbuf2);

        if (!S_ISDIR(statbuf1.st_mode) || !S_ISDIR(statbuf2.st_mode)) {
                fprintf(stderr, "skin path are not dir\n");
                exit(1);
        }

        printf("%s %s %s\n", skin_path_org, skin_path1, skin_path2);
        comp_dir(org_path, molt_path1, molt_path2, skin_path1, skin_path2);
}

/*      FILE
        SKIN 1 O : SKIN 2 O -> DIFF MOLT 1 : MOLT 2
        SKIN 1 X : SKIN 2 X -> X
        SKIN 1 O : SKIN 2 X -> DIFF MOLT 1 : ORG 2
        SKIN 1 X : SKIN 2 O -> DIFF ORG 1  : MOLT 2
*/

/*      DIR
        SKIN 1 O : SKIN 2 O -> DIR  SKIN 1 : SKIN 2
        SKIN 1 O : SKIN 2 X -> DIFF MOLT 1 : ORG
        SKIN 1 X : SKIN 2 O -> DIFF ORG    : MOLT 2
        SKIN 1 X : SKIN 2 X -> X

*/

void comp_dir(char* o_path, char *m_path1, char *m_path2, char *s_path1, char *s_path2) {
        struct dirent **m_filelist1;
        struct dirent **m_filelist2;
        struct stat m_stat1, m_stat2, m_stat_org;
        char tmp_m_path1[BUFMAX];
        char tmp_m_path2[BUFMAX];
        char tmp_s_path1[BUFMAX];
        char tmp_s_path2[BUFMAX];
        char tmp_o_path[BUFMAX];
        int m_count1, m_count2;
        int i, j;

        if ((m_count1 = scandir(m_path1, &m_filelist1, scandir_filter, alphasort)) < 0) {
                fprintf(stderr, "in function diff_dir: scandir error..\n");
                return;
        }

        if ((m_count2 = scandir(m_path2, &m_filelist2, scandir_filter, alphasort)) < 0) {
                fprintf(stderr, "in function diff_dir: scandir error..\n");
                return;
        }

        i = 0, j = 0;

        while (i < m_count1 && j < m_count2) {
                bzero(tmp_m_path1, BUFMAX), bzero(tmp_m_path2, BUFMAX), bzero(tmp_o_path, BUFMAX);
                sprintf(tmp_m_path1, "%s/%s", m_path1, m_filelist1[i]->d_name);
                sprintf(tmp_m_path2, "%s/%s", m_path2, m_filelist2[j]->d_name);
                sprintf(tmp_s_path1, "%s/%s", s_path1, m_filelist1[i]->d_name);
                sprintf(tmp_s_path2, "%s/%s", s_path2, m_filelist2[j]->d_name);
                stat(tmp_m_path1, &m_stat1);
                stat(tmp_m_path2, &m_stat2);

                int n = strcmp(m_filelist1[i]->d_name, m_filelist2[j]->d_name);

                if (n == 0) {
                        if (S_ISDIR(m_stat1.st_mode) && S_ISDIR(m_stat2.st_mode)) {
                                sprintf(tmp_o_path, "%s/%s", o_path, m_filelist1[i]->d_name);
                                comp_dir(tmp_o_path, tmp_m_path1, tmp_m_path2, tmp_s_path1, tmp_s_path2);
                        }
                        else if (!S_ISDIR(m_stat1.st_mode) && !S_ISDIR(m_stat2.st_mode)) {
                                diff_file(tmp_m_path1, tmp_m_path2, tmp_s_path1, tmp_s_path2);
                        }
                        i++, j++;
                }
                else if (n < 0) {
                        sprintf(tmp_o_path, "%s/%s", o_path, m_filelist1[i]->d_name);
                        
                        struct stat o_stat;
                        stat(tmp_o_path, &o_stat);

                        if (S_ISDIR(m_stat1.st_mode) && S_ISDIR(o_stat.st_mode)) {
                                // v1과 org를 비교
                                diff_dir(tmp_m_path1, tmp_o_path, 0);
                        }
                        else if (!S_ISDIR(m_stat1.st_mode) && !S_ISDIR(o_stat.st_mode)) {
                                diff_file_org(tmp_m_path1, tmp_o_path);
                        }
                        i++;
                }
                else {
                        sprintf(tmp_o_path, "%s/%s", o_path, m_filelist2[j]->d_name);

                        struct stat o_stat;
                        stat(tmp_o_path, &o_stat);

                        if (S_ISDIR(o_stat.st_mode) && S_ISDIR(m_stat2.st_mode)) {
                                // org와 v2를 비교
                                diff_dir(tmp_o_path, tmp_m_path2, 1);
                        }
                        else if (!S_ISDIR(o_stat.st_mode) && !S_ISDIR(m_stat2.st_mode)) {
                                diff_file_org(tmp_o_path, tmp_m_path2);
                        }
                        j++;
                }
        }
}

void diff_file(char *m_path1, char *m_path2, char *s_path1, char *s_path2) {
        FILE *fp;
        char buf[BUFMAX];
        char hash1[HASHLEN];
        char hash2[HASHLEN];
        char cmdline[BUFMAX];
        int fd1, fd2;

        fd1 = open(s_path1, O_RDONLY);
        fd2 = open(s_path2, O_RDONLY);

        read(fd1, hash1, HASHLEN);
        read(fd2, hash2, HASHLEN);
        hash1[HASHLEN-1] = 0;
        hash2[HASHLEN-1] = 0;

        if (strcmp(hash1, hash2)) {
                sprintf(cmdline, "diff %s %s", m_path1, m_path2);
                printf("diff %s\n", m_path2);
                //system(cmdline);
                fp = popen(cmdline, "r");
                while (fgets(buf, BUFMAX, fp))
                        printf("%s", buf);
                pclose(fp);
        }
}

void diff_file_org(char *path1, char *path2) {
        char cmdline[BUFMAX];
        char buf[BUFMAX];
        FILE *fp;

        sprintf(cmdline, "diff %s %s", path1, path2);
        printf("diff %s\n", path2);
        //system(cmdline);

        fp = popen(cmdline, "r");
        while (fgets(buf, BUFMAX, fp))
                printf("%s", buf);
        pclose(fp);
}

void diff_dir(char *path1, char *path2, int flag) {
        struct dirent **filelist;
        struct stat statbuf;
        char o_path[BUFMAX];
        char m_path[BUFMAX];
        char tmp_m_path[BUFMAX];
        char tmp_o_path[BUFMAX];
        int count;
        
        if (!flag) {
                strcpy(o_path, path2);
                strcpy(m_path, path1);
        }
        else {
                strcpy(o_path, path1);
                strcpy(m_path, path2);
        }

        if ((count = scandir(m_path, &filelist, scandir_filter, alphasort) < 0)) {
                fprintf(stderr, "in diff_dir, scandir error...\n");
                return;
        }

        for (int i = 0; i < count; i++) {
                sprintf(tmp_m_path, "%s/%s", m_path, filelist[i]->d_name);
                sprintf(tmp_o_path, "%s/%s", o_path, filelist[i]->d_name);
                stat(tmp_m_path, &statbuf);
                if (S_ISDIR(statbuf.st_mode)) {
                        if (!flag)
                                diff_dir(tmp_m_path, tmp_o_path, flag);
                        else
                                diff_dir(tmp_o_path, tmp_m_path, flag);
                }
                else {
                        if (!flag)
                                diff_file_org(tmp_m_path, tmp_o_path);
                        else
                                diff_file_org(tmp_o_path, tmp_m_path);
                }
        }
}


int scandir_filter(const struct dirent *file) {	   //scandir 사용 시 .와 ..를 제외하고 저장하게 해주는 함수
	if (!strcmp(file->d_name, ".") || !strcmp(file->d_name, "..") || !strcmp(file->d_name, ".git"))
		return 0;
	else return 1;
}
