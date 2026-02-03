export function gatherFormData(form) {
  const formData = new FormData(form[0]);
  const data = {};
  const files = {};

  for (const [key, value] of formData.entries()) {
    // File input
    if (value instanceof File) {
      if (!files[key]) files[key] = [];
      files[key].push(value);
      continue;
    }

    // Multiple values → array
    if (data[key]) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }

    if (value == "on") {
      data[key] = true;
    } else if (value == "off") {
      data[key] = false;
    }
  }

  return { data, files };
}
/**
@param {Object} params
 * @param {number} params.formData - formData object from gatherFormData()
 * @returns {Boolean}
**/
export function validateFormData(formData) {
  return true;
}
