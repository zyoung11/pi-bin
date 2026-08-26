/* The outbound declared-integer crossings, read as REAL int64_t/uint64_t
 * through the profile's C ABI: each printed value must equal the Node
 * oracle's number converted exactly (the compile-time proof is what makes
 * the fp-to-int conversion exact by construction). */
#include <inttypes.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

extern void kr_init(void);
extern void kr_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern int64_t kr_ret_max(void);
extern int64_t kr_ret_neg_zero(void);
extern int64_t kr_ret_rem(void);
extern uint64_t kr_ret_u32_max(void);

static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx;
  (void)addr;
  printf("sink: %.*s\n", (int)len, (const char *)msg);
}

int main(void) {
  kr_set_panic_sink(sink, NULL);
  kr_init();
  printf("max=%" PRId64 "\n", kr_ret_max());
  printf("negzero=%" PRId64 "\n", kr_ret_neg_zero());
  printf("rem=%" PRId64 "\n", kr_ret_rem());
  printf("u32max=%" PRIu64 "\n", kr_ret_u32_max());
  return 0;
}
