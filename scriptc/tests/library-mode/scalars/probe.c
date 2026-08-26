/* K2 scalar-roundtrip probe: f64 crosses bit-transparently (-0's sign,
 * NaN, MAX_SAFE_INTEGER exact), bool crosses 0/1, and the u8/u32/i32
 * plumbing classes convert exactly. */
#include <math.h>
#include <stdint.h>
#include <stdio.h>

extern void kt_init(void);
extern void kt_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void kt_collect(void);
extern double kt_add(double a, double b);
extern double kt_passthrough(double x);
extern double kt_neg_zero(void);
extern uint8_t kt_is_nan(double x);
extern uint8_t kt_invert(uint8_t f);
extern double kt_plumb(uint8_t tag, uint32_t idx, int32_t delta);

static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx; (void)msg; (void)len; (void)addr;
  printf("UNEXPECTED SINK\n");
}

int main(void) {
  kt_set_panic_sink(sink, NULL);
  kt_init();
  printf("add: %.17g\n", kt_add(0.1, 0.2));
  double max_safe = 9007199254740991.0; /* 2^53 - 1 */
  printf("max-safe exact: %d\n", kt_passthrough(max_safe) == max_safe);
  printf("nan passthrough: %d\n", isnan(kt_passthrough(NAN)) ? 1 : 0);
  printf("neg zero sign: %d\n", signbit(kt_neg_zero()) ? 1 : 0);
  printf("is_nan(NaN): %u\n", (unsigned)kt_is_nan(NAN));
  printf("is_nan(1): %u\n", (unsigned)kt_is_nan(1.0));
  printf("invert(0): %u\n", (unsigned)kt_invert(0));
  printf("invert(7): %u\n", (unsigned)kt_invert(7)); /* nonzero = true */
  printf("plumb: %.0f\n", kt_plumb(255, 4000000000u, -5));
  kt_collect();
  return 0;
}
