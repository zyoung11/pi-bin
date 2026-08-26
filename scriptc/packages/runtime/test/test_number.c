/* Oracle test for scr_f64_to_str.
 * Reads case lines ("<16-hex-digit bit pattern>\t<expected>\n") from the file
 * given as argv[1] (or stdin), formats each double, and asserts byte equality.
 * Exit 0 = all pass; prints each mismatch and exits 1 otherwise.
 */
#include "../src/scr_runtime.h"

#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
  FILE *in = stdin;
  if (argc > 1) {
    in = fopen(argv[1], "r");
    if (!in) {
      perror(argv[1]);
      return 2;
    }
  }

  char linebuf[128];
  char got[32];
  long total = 0, failed = 0;
  while (fgets(linebuf, sizeof linebuf, in)) {
    char *tab = strchr(linebuf, '\t');
    if (!tab) continue;
    *tab = '\0';
    char *expected = tab + 1;
    expected[strcspn(expected, "\n")] = '\0';

    union {
      uint64_t u;
      double d;
    } bits;
    bits.u = strtoull(linebuf, NULL, 16);

    scr_f64_to_str(bits.d, got);
    total++;
    if (strcmp(got, expected) != 0) {
      failed++;
      if (failed <= 20) {
        fprintf(stderr, "MISMATCH bits=%s expected=\"%s\" got=\"%s\"\n",
                linebuf, expected, got);
      }
    }
  }
  if (in != stdin) fclose(in);

  fprintf(stderr, "%ld/%ld cases passed\n", total - failed, total);
  return failed ? 1 : 0;
}
