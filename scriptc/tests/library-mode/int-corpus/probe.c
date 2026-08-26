/* Generic driver for the ask-4 conformance corpus (library-int.test.ts):
 * every corpus fixture records what crossed its declared integer slot in
 * a module array; the probe replays the host side — optionally feeding
 * the case's parameter function (compiled with -DHAS_F) the argv values —
 * and prints each crossed value on its own line with %.17g (exact for
 * every integer within ±(2^53 − 1)). The suite compares the lines against
 * the Node oracle's numbers computed from the same case source. */
#include <setjmp.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

extern void kc_init(void);
extern void kc_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern double kc_count(void);
extern double kc_at(double i);
#ifdef HAS_F
extern void kc_f(double a);
#endif

static jmp_buf trap_jmp;

static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx;
  (void)addr;
  printf("sink: %.*s\n", (int)len, (const char *)msg);
  longjmp(trap_jmp, 1);
}

int main(int argc, char **argv) {
  (void)argc;
  (void)argv;
  kc_set_panic_sink(sink, NULL);
  if (setjmp(trap_jmp) != 0) {
    printf("trapped\n");
    return 1;
  }
  kc_init();
#ifdef HAS_F
  for (int i = 1; i < argc; i++) kc_f(strtod(argv[i], NULL));
#endif
  double n = kc_count();
  for (double i = 0; i < n; i++) printf("%.17g\n", kc_at(i));
  return 0;
}
