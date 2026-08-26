/* K11/K12 probe — the structured trap-teaching encoding, mode-selected by
 * argv[1]:
 *   structured    — the inbound-bytes host-contract trap arrives as ONE
 *                   structured message; the spec's parse rule (split the
 *                   bytes after the 0x01 marker on 0x1F) recovers text,
 *                   code, symbol, and remediation exactly, and no fifth
 *                   field exists
 *   verbatim      — an Error thrown with an 0x01-led message rides the
 *                   escaped-exception channel byte-for-byte: no
 *                   "Uncaught " prefix, no added newline
 *   verbatim-str  — the same rule over a bare thrown string
 *   runtime-trap  — a RUNTIME-detected trap (the range trap) arrives
 *                   structured; this profile declares SC4014 teaching and
 *                   remediation, so both overlay the message
 *   runtime-throw — an ordinary escaped throw arrives structured with the
 *                   baseline "Uncaught ..." line as its text, the escaped-
 *                   exception code, the trapping entry's symbol, and NO
 *                   remediation field (nothing declared for SC4013)
 * Every mode also pins that the human text leads the buffer with a
 * printable byte — the plain-text degradation the marker rests on.
 */
#include <setjmp.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

extern void kv_init(void);
extern void kv_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern double kv_wrap(const uint8_t *p, size_t len);
extern double kv_teach(void);
extern double kv_teach_str(void);
extern double kv_boom_runtime(double i);
extern double kv_fail_runtime(void);

static jmp_buf trap_jmp;
static int sink_calls = 0;

/* The spec's parse rule, the ten-line C implementation: step 1 answers
 * baseline vs structured off msg[0]; structured messages split after the
 * marker on 0x1F into text/code/symbol/remediation; fields are
 * (pointer, length), and anything past index 3 is ignored (counted here
 * only to pin that the emitter never appends one). */
static void show(const uint8_t *msg, size_t len) {
  if (len == 0 || msg[0] != 0x01) { /* baseline: the whole buffer is the text */
    printf("baseline printable=%d text=%.*s", len > 0 && msg[0] >= 0x20, (int)len, (const char *)msg);
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
  printf("fields=%d text_printable=%d\n", fields, len > 1 && msg[1] >= 0x20);
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
  const char *mode = argc > 1 ? argv[1] : "structured";
  kv_set_panic_sink(sink, NULL);
  kv_init();

  if (setjmp(trap_jmp) == 0) {
    if (strcmp(mode, "structured") == 0) {
      /* 2^53 does not fit the bytes class: no real buffer is this long,
       * so the wrapper's host-contract trap fires before any copy. */
      kv_wrap(NULL, (size_t)1 << 53);
    } else if (strcmp(mode, "verbatim") == 0) {
      kv_teach();
    } else if (strcmp(mode, "verbatim-str") == 0) {
      kv_teach_str();
    } else if (strcmp(mode, "runtime-trap") == 0) {
      kv_boom_runtime(9);
    } else if (strcmp(mode, "runtime-throw") == 0) {
      kv_fail_runtime();
    } else {
      fprintf(stderr, "unknown mode %s\n", mode);
      return 2;
    }
    printf("UNREACHABLE\n");
    return 1;
  }
  printf("survived, sink_calls=%d\n", sink_calls);
  return 0;
}
