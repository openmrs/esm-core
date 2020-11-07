import { validator } from "./validator";

/**
 * Verifies that a string contains only the default URL template
 * parameters, plus any specified in `allowedTemplateParameters`.
 *
 * @param allowedTemplateParameters To be added to `openmrsBase` and `openmrsSpaBase`
 * @category Navigation
 */
export const isUrlWithTemplateParameters = (
  allowedTemplateParameters: string[]
) => {
  const allowedParams = allowedTemplateParameters.concat([
    "openmrsBase",
    "openmrsSpaBase",
  ]);
  return validator((val) => {
    if (!val || typeof val != "string") {
      return false;
    }

    const matches = val.matchAll(/\${(.*?)}/g);
    for (let match of Array.from(matches)) {
      if (!allowedParams.includes(match[1])) {
        return false;
      }
    }
    return true;
  }, "should be a URL or path. The allowed template parameters are " + allowedParams.map((p) => "${" + p + "}").join(", "));
};

/**
 * Verifies that a string contains only the default URL template parameters.
 *
 * @category Navigation
 */
export const isUrl = isUrlWithTemplateParameters([]);

export const validators = {
  isUrl,
  isUrlWithTemplateParameters,
};
