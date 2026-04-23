const fs = require("fs");

let content = `<p dir="ltr" style="line-height:1.38;text-align: center;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">BelowTheYield.com&nbsp; is provided under the management of Sparks Affiliates, LLC.</span></p><br /><p dir="ltr" style="line-height:1.38;text-align: center;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Have questions? Contact us at </span></p>`;

// Function to conditionally merge identical specific tags
function mergeSpecificP(content) {
  // Regex to match contiguous <p> tags that all have text-align: center
  const centerPRegex = /(?:<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>[\s\S]*?<\/p>\s*(?:<br\s*\/?>\s*)*)+/gi;

  return content.replace(centerPRegex, (match) => {
    // We have a block of 1 or more <p> tags. We want to extract their inner contents
    // and join them with [[BR_SEP]]
    let innerContent = [];
    const innerRegex = /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = innerRegex.exec(match)) !== null) {
      innerContent.push(m[1]);
    }

    // But wait, what if the wrapper needs the outer formatting?
    // We just return a single <p style="text-align: center"> combined!
    // What if their opening tags are slightly different? (e.g. dir="ltr")
    // We can just use the first opening tag.
    const firstOpeningTagMatch = match.match(/<p[^>]*>/i);
    const firstTag = firstOpeningTagMatch ? firstOpeningTagMatch[0] : '<p style="text-align: center;">';
    return `${firstTag}${innerContent.join("[[BR_SEP]]")}</p>`;
  });
}

console.log(mergeSpecificP(content));
