#include<stdio.h>
#include<stdlib.h>
#include<unistd.h>
#include<fcntl.h>
#include<sys/types.h>
#include<sys/stat.h>
#include<string.h>
#include<wait.h>

#define BUFFERSIZE 4048

const char *inst_list[] = {"skin", "molt", "ls", "vi", NULL};

char buf[4048];

int prompting();
int countArgNum(const char *);
int inst_checking(char *);

int main(int argc, char *argv[]){
    while(prompting());
}

int prompting(void){
    char *inst, *arg;
    int argCnt, flag = 0;
    pid_t pid;
    printf("> ");
    fgets(buf, BUFFERSIZE, stdin);
    buf[strlen(buf)-1] = '\0';
    if(strcmp(buf, "exit") == 0) return 0;
    if(buf[0] == '\0') return 1;

    argCnt = countArgNum(buf);
    inst = strtok(buf, " ");

    if(!inst_checking(inst)){
        printf("unknown instruction for %s\n", inst);
        return 1;
    }

    char **args;
    args = (char **)malloc((argCnt+2) * sizeof(char *));

    args[0] = (char*) malloc(strlen(inst+1) * sizeof(char *));
    strcpy(args[0], inst);
    for(int i = 1; i < argCnt+1; i++){
        arg = strtok(NULL, " ");
        args[i] = malloc(sizeof(char) * (strlen(arg) + 1));
        strcpy(args[i], arg);
    }
    args[argCnt+1] = NULL;

    if((pid = fork()) < 0){
        fprintf(stderr, "fork error\n");
        exit(1);
    }
    else if(pid == 0){
        execv(inst, args);
        exit(3);
    }
    else{
        int status;
        wait(&status);
        // printf("%d\n", WEXITSTATUS(status));
    }

    for(int i = 0; i < argCnt + 2; i++){
        // printf("%s ", args[i]);
        free(args[i]);
    }
    // printf("\n");
    free(args);
    return 1;
}

int countArgNum(const char *ptr){
    int cnt = 0;
    while(*ptr != '\0') {
        if(*ptr == ' ') cnt++;
        ptr++;
    }
    
    return cnt;
}

int inst_checking(char * inst){
    for(int i = 0; inst_list[i] != NULL; i++){
        if(strcmp(inst_list[i], inst) == 0) return 1;
    }    
    return 0;
}