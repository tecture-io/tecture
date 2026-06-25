// Library CSS entry. Importing the Tailwind stylesheet here makes the lib build
// compile it to a plain, dependency-free CSS asset that consumers load via
// `@tecture/web/styles.css` — no Tailwind tooling required on their side.
//
// Note: `@xyflow/react/dist/style.css` is intentionally NOT imported here so it
// stays out of our bundle; consumers import it alongside our stylesheet.
import "./styles.css";
