/* The SAME program as indexed-loose, under a tsconfig that turns
 * noUncheckedIndexedAccess ON: xs[i] is number | undefined here, so the
 * unguarded arithmetic must FAIL preflight — the project's strictness is
 * honored even where scriptc's own defaults would have let it through. */
const xs = [10, 20, 30];
const i = 1;
const picked = xs[i];
console.log(picked + 1);
