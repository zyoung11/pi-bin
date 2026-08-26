/* Library-mode npm posture probe: the eligible package's code (mathkit,
 * and its own dep mathdep) compiled statically into the archive — the
 * values below are computed by the packages' shipped JS — plus the
 * builtin (node:path) surface riding the same graph. */
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

extern void kn_init(void);
extern void kn_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void kn_collect(void);
extern double kn_scaled(double x);
extern void kn_tail(const uint8_t *p, size_t len, const uint8_t **out, size_t *out_len);

static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx; (void)msg; (void)len; (void)addr;
  printf("UNEXPECTED SINK\n");
}

int main(void) {
  kn_set_panic_sink(sink, NULL);
  kn_init();
  /* scale(5, 3) = twice(5) * 3 = 30, + OFFSET 7 */
  printf("scaled: %.0f\n", kn_scaled(5));
  const uint8_t *s;
  size_t n;
  kn_tail((const uint8_t *)"/a/b/c.txt", 10, &s, &n);
  printf("tail: %.*s (len %zu)\n", (int)n, s, n);
  kn_collect();
  return 0;
}
