export function prepareSVG(svg) {
  svg = svg.cloneNode(true);
  svg.setAttribute("version", "1.1");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const styles = parseCssStyles(svg);
  svg.insertBefore(styles, svg.firstChild);
  return svg.outerHTML;

  function parseCssStyles(dom) {
    let used = "";
    const sheets = document.styleSheets;

    for (const sheet of sheets) {
      // TODO: walk through this block of code

      try {
        if (sheet.cssRules == null) continue;
        const rules = sheet.cssRules;

        for (const rule of rules) {
          if (typeof rule.style != "undefined") {
            let elems;
            // removing any selector text including svg element ID -- dom already selects for that
            const selector =
              rule.selectorText === undefined
                ? rule.selectorText
                : rule.selectorText.replace(`#${dom.id} `, "");
            //Some selectors won't work, and most of these don't matter.
            try {
              elems = dom.querySelectorAll(selector);
            } catch {
              elems = [];
            }

            if (elems.length > 0) {
              used += rule.selectorText + " { " + rule.style.cssText + " }\n";
            }
          }
        }
      } catch (e) {
        // In Firefox, if stylesheet originates from a diff domain,
        // trying to access the cssRules will throw a SecurityError.
        // Hence, we must use a try/catch to handle this in Firefox
        if (e.name !== "SecurityError") throw e;
        continue;
      }
    }

    let s = document.createElement("style");
    s.setAttribute("type", "text/css");
    s.innerHTML = "<![CDATA[\n" + used + "\n]]>";

    return s;
  }
}
