/* A trap during init routes to the sink exactly once; the host survives
 * through its own longjmp frame below the entry. Init counts as an entry:
 * the structured message's symbol field names the init symbol itself. */
#include <setjmp.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

extern void ki_init(void);
extern void ki_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);

static jmp_buf trap_jmp;
static int sink_calls = 0;

/* The spec's parse rule (see traps/probe.c). */
static void show(const uint8_t *msg, size_t len) {
  if (len == 0 || msg[0] != 0x01) {
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
  (void)ctx; (void)addr;
  sink_calls++;
  printf("sink[%d]:\n", sink_calls);
  show(msg, len);
  longjmp(trap_jmp, 1);
}

int main(void) {
  ki_set_panic_sink(sink, NULL);
  if (setjmp(trap_jmp) == 0) {
    ki_init();
    printf("UNREACHABLE\n");
  } else {
    printf("survived init trap, sink_calls=%d\n", sink_calls);
  }
  return 0;
}
