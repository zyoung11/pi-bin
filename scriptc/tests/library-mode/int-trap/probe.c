/* The inbound declared-integer host-contract trap, mode-selected by
 * argv[1]:
 *   ok        — in-range int64_t/uint64_t values convert exactly (the
 *               edges: ±(2^53 − 1) for i64, 2^53 − 1 for u64)
 *   trap-i64  — 2^53 + 1 through the i64 parameter: the wrapper's
 *               range-check delivers the structured SC4012 message (the
 *               profile's teaching text and remediation riding it) and
 *               the library poisons — silent rounding never happens
 *   trap-u64  — 2^60 through the u64 parameter, same story
 * The parse in show() is the spec's rule: split the bytes after the 0x01
 * marker on 0x1F into text/code/symbol/remediation. */
#include <inttypes.h>
#include <setjmp.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

extern void kt_init(void);
extern void kt_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void kt_take(int64_t x);
extern void kt_take_u(uint64_t x);
extern double kt_last(void);

static jmp_buf trap_jmp;
static int sink_calls = 0;

static void show(const uint8_t *msg, size_t len) {
  if (len == 0 || msg[0] != 0x01) {
    printf("baseline text=%.*s", (int)len, (const char *)msg);
    return;
  }
  static const char *names[4] = {"text", "code", "symbol", "remediation"};
  const uint8_t *p = msg + 1, *end = msg + len;
  int fields = 0;
  for (;;) {
    const uint8_t *sep = memchr(p, 0x1f, (size_t)(end - p));
    const uint8_t *stop = sep != NULL ? sep : end;
    if (fields < 4) printf("%s=[%.*s]\n", names[fields], (int)(stop - p), (const char *)p);
    fields++;
    if (sep == NULL) break;
    p = sep + 1;
  }
  printf("fields=%d\n", fields);
}

static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx;
  (void)addr;
  sink_calls++;
  printf("sink[%d]:\n", sink_calls);
  show(msg, len);
  longjmp(trap_jmp, 1);
}

int main(int argc, char **argv) {
  const char *mode = argc > 1 ? argv[1] : "ok";
  kt_set_panic_sink(sink, NULL);
  kt_init();

  if (setjmp(trap_jmp) == 0) {
    if (strcmp(mode, "ok") == 0) {
      kt_take(INT64_C(9007199254740991));
      printf("i64 max: %.17g\n", kt_last());
      kt_take(INT64_C(-9007199254740991));
      printf("i64 min: %.17g\n", kt_last());
      kt_take_u(UINT64_C(9007199254740991));
      printf("u64 max: %.17g\n", kt_last());
      printf("ok, sink_calls=%d\n", sink_calls);
      return 0;
    } else if (strcmp(mode, "trap-i64") == 0) {
      kt_take(INT64_C(9007199254740993)); /* 2^53 + 1: cannot ride f64 */
    } else if (strcmp(mode, "trap-u64") == 0) {
      kt_take_u(UINT64_C(1) << 60);
    } else {
      fprintf(stderr, "unknown mode %s\n", mode);
      return 2;
    }
    printf("UNREACHABLE\n");
    return 1;
  }
  /* Poisoned now: no further entries (kt_last would abort by design) —
   * the message arrived exactly once and the host survived. */
  printf("survived, sink_calls=%d\n", sink_calls);
  return 0;
}
