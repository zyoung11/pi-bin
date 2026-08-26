/* Contract-fixture probe: the identity getters' poisoned-guard exemption
 * (readable BEFORE init and AFTER a trap — pure data returns, no runtime
 * touch), plus a scripted call sequence over the mapped surface. The
 * harness compares the printed build_id against the sidecar's — the V12
 * boot-time pairing fence, end to end. */
#include <setjmp.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

extern uint64_t kc_build_id(void);
extern uint32_t kc_abi_version(void);
extern void kc_init(void);
extern void kc_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void kc_boot(void);
extern void kc_send(double tag, double level);
extern void kc_command_msg(const uint8_t *p, size_t len);
extern void kc_title(const uint8_t **out, size_t *out_len);
extern void kc_helper_probe(double i, const uint8_t **out, size_t *out_len);
extern double kc_boom(double i);

static jmp_buf trap_jmp;
static int sink_calls = 0;
static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx;
  (void)addr;
  sink_calls++;
  /* Runtime traps arrive as structured trap-teaching messages; this
   * fixture pins identity behavior, not the encoding (the K-suite owns
   * that), so print field 0 — the human text — the spec's plain-text
   * display rule. */
  const uint8_t *text = msg;
  size_t text_len = len;
  if (len > 0 && msg[0] == 0x01) {
    text = msg + 1;
    const uint8_t *sep = memchr(text, 0x1f, len - 1);
    text_len = sep != NULL ? (size_t)(sep - text) : len - 1;
  }
  printf("sink[%d]: %.*s", sink_calls, (int)text_len, (const char *)text);
  longjmp(trap_jmp, 1);
}

int main(void) {
  /* Before init: the getters answer (no entry prologue, no poisoned
   * guard, no runtime). */
  uint64_t pre = kc_build_id();
  printf("pre build_id: %016llx abi %u\n", (unsigned long long)pre, kc_abi_version());

  kc_set_panic_sink(sink, NULL);
  kc_init();
  kc_boot();

  const uint8_t *s;
  size_t n;
  kc_title(&s, &n);
  printf("title: %.*s\n", (int)n, (const char *)s);
  kc_send(0, 4.5);
  kc_command_msg((const uint8_t *)"atlas2", 6);
  kc_title(&s, &n);
  printf("title2: %.*s\n", (int)n, (const char *)s);
  kc_helper_probe(0, &s, &n);
  printf("headline: %.*s\n", (int)n, (const char *)s);
  kc_helper_probe(1, &s, &n);
  printf("counts: %.*s\n", (int)n, (const char *)s);

  if (setjmp(trap_jmp) == 0) {
    kc_boom(9);
    printf("UNREACHABLE\n");
  } else {
    printf("survived, sink_calls=%d\n", sink_calls);
  }

  /* After the trap: the poisoned library refuses entries, but the
   * identity getters still answer with the same values. */
  uint64_t post = kc_build_id();
  printf("post build_id: %016llx abi %u\n", (unsigned long long)post, kc_abi_version());
  printf("identity stable: %d\n", pre == post ? 1 : 0);
  return 0;
}
