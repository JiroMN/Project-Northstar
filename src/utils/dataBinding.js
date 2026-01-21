export function applyTextBindings(scope, bindings = {}) {
  const $scope = scope instanceof $ ? scope : $(scope);

  Object.entries(bindings).forEach(([key, value]) => {
    const text = (value ?? "").toString().replace(/\n/g, "<br>");
    $scope.find(`[data-bind="${key}"]`).html(text);
  });
}
