/**
 * Exit code for a signal-killed process using the shell convention (128 + signal number),
 * Linux/x86-64 signal numbers. Returns undefined when no signal was recorded.
 */
export function signalExitCode(signal: NodeJS.Signals | null | undefined): number | undefined {
	if (signal === null || signal === undefined) return undefined;
	switch (signal) {
		case "SIGHUP":
			return 129;
		case "SIGINT":
			return 130;
		case "SIGQUIT":
			return 131;
		case "SIGILL":
			return 132;
		case "SIGTRAP":
			return 133;
		case "SIGABRT":
		case "SIGIOT":
			return 134;
		case "SIGBUS":
			return 135;
		case "SIGFPE":
			return 136;
		case "SIGKILL":
			return 137;
		case "SIGUSR1":
			return 138;
		case "SIGSEGV":
			return 139;
		case "SIGUSR2":
			return 140;
		case "SIGPIPE":
			return 141;
		case "SIGALRM":
			return 142;
		case "SIGTERM":
			return 143;
		case "SIGSTKFLT":
			return 144;
		case "SIGCHLD":
			return 145;
		case "SIGCONT":
			return 146;
		case "SIGSTOP":
			return 147;
		case "SIGTSTP":
			return 148;
		case "SIGTTIN":
			return 149;
		case "SIGTTOU":
			return 150;
		case "SIGURG":
			return 151;
		case "SIGXCPU":
			return 152;
		case "SIGXFSZ":
			return 153;
		case "SIGVTALRM":
			return 154;
		case "SIGPROF":
			return 155;
		case "SIGWINCH":
			return 156;
		case "SIGIO":
		case "SIGPOLL":
			return 157;
		case "SIGPWR":
			return 158;
		case "SIGSYS":
			return 159;
		default:
			return 128;
	}
}
