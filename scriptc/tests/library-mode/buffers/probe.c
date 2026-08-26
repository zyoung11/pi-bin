/* K3 buffer-roundtrip-lifetime probe. Two builds over the same library:
 * without DECLARED_RESET, results are valid until the next call through
 * any profile entry (the auto posture — the probe copies each result out
 * before the next call); with DECLARED_RESET, results ACCUMULATE until
 * the host calls the declared reset entry, so two outstanding results are
 * read side by side. String results are NUL-terminated after out_len. */
#include <stdint.h>
#include <stdio.h>
#include <string.h>

extern void kb_init(void);
extern void kb_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void kb_collect(void);
extern void kb_shout(const uint8_t *p, size_t len, const uint8_t **out, size_t *out_len);
extern double kb_strlen(const uint8_t *p, size_t len);
extern void kb_wrap(const uint8_t *p, size_t len, const uint8_t **out, size_t *out_len);
extern void kb_dashes(const uint8_t *p, size_t len, const uint8_t **out, size_t *out_len);
#ifdef DECLARED_RESET
extern void kb_reset(void);
#endif

static void sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
  (void)ctx; (void)msg; (void)len; (void)addr;
  printf("UNEXPECTED SINK\n");
}

int main(void) {
  kb_set_panic_sink(sink, NULL);
  kb_init();

  const uint8_t *s; size_t n;
  kb_shout((const uint8_t *)"abc", 3, &s, &n);
  printf("shout: %.*s (len %zu, nul %d)\n", (int)n, s, n, s[n] == 0);

#ifdef DECLARED_RESET
  /* Accumulate-then-reset: the first result must survive the second call. */
  const uint8_t *s2; size_t n2;
  kb_dashes((const uint8_t *)"axxxbxc", 7, &s2, &n2);
  printf("both live: %.*s / %.*s\n", (int)n, s, (int)n2, s2);
  kb_reset();
#else
  char copy[64];
  memcpy(copy, s, n);
  copy[n] = 0;
  const uint8_t *s2; size_t n2;
  kb_dashes((const uint8_t *)"axxxbxc", 7, &s2, &n2);
  printf("both live: %s / %.*s\n", copy, (int)n2, s2);
#endif

  printf("strlen empty (NULL, 0): %.0f\n", kb_strlen(NULL, 0));
  printf("strlen utf8: %.0f\n", kb_strlen((const uint8_t *)"caf\xC3\xA9", 5)); /* JS length: 4 */

  const uint8_t *b; size_t bn;
  kb_wrap((const uint8_t *)"\x01\x02", 2, &b, &bn);
  printf("wrap: len %zu bytes %d %d %d %d\n", bn, b[0], b[1], b[2], b[3]);
  const uint8_t *b0; size_t bn0;
  kb_wrap(NULL, 0, &b0, &bn0); /* NULL with len 0 is in contract */
  printf("wrap empty: len %zu bytes %d %d\n", bn0, b0[0], b0[1]);

  kb_collect();
  return 0;
}
