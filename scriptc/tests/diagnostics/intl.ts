// The Intl surface. What lowers: the COMPOSED en-US NumberFormat forms
// with default options — new Intl.NumberFormat("en-US").format(x) and
// x.toLocaleString("en-US"). Everything else fences by NAME: the
// environment-default locale a compiled binary cannot carry, other
// locales (ICU data the binary does not embed), options bags, formatter
// VALUES, and the rest of the Intl namespace (DurationFormat,
// DateTimeFormat, PluralRules, getCanonicalLocales).

// The unlowered NumberFormat variants, each with its own reason.
const noLocale = new Intl.NumberFormat().format(1234.5);
const otherLocale = new Intl.NumberFormat("de-DE").format(1234.5);
const withOptions = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(1234.5);
const hoisted = new Intl.NumberFormat("en-US");
const viaValue = hoisted.format(1234.5);

// toLocaleString's unlowered variants.
const envDefault = (1234.5).toLocaleString();
const german = (1234.5).toLocaleString("de-DE");
const grouped = (1234.5).toLocaleString("en-US", { useGrouping: false });

// The rest of Intl keeps the ICU story.
const when = new Intl.DateTimeFormat("en-US").format();
const dur = new Intl.DurationFormat("en-US").format({ hours: 1, minutes: 23 });
const rule = new Intl.PluralRules("en-US").select(1);
const canon = Intl.getCanonicalLocales("en-us");
