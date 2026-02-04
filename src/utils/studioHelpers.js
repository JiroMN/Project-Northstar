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

export function setFormData($form, data) {
  Object.entries(data).forEach(([name, value]) => {
    const $field = $form.find(`[name='${name}']`);

    if (!$field.length) return;

    const type = $field.attr("type");

    if (type === "checkbox") {
      $field.prop("checked", Boolean(value));
      return;
    }

    if (type === "radio") {
      $field.filter(`[value="${value}"]`).prop("checked", true);
      return;
    }

    if ($field.is("select")) {
      $field.val(value).trigger("change");
      return;
    }

    $field.val(value);
  });
}

export function onClientSelect(fn) {
  const id = $("body").attr("data-selected-client-id");
  if (id) fn(id);

  $(document)
    .off("client:selected.onClientSelect")
    .on("client:selected.onClientSelect", (__, clientId) => {
      if (!clientId) return;
      fn(clientId);
    });
}
