export function applyTextBindings(scope, bindings = {}) {
  const $scope = scope instanceof $ ? scope : $(scope);

  Object.entries(bindings).forEach(([key, value]) => {
    $scope.find(`[data-bind="${key}"]`).text(value ?? "");
  });
}
