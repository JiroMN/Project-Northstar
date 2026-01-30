export function pickContextTeam(teams) {
  if (!teams?.length) return null;

  // primary: admin team
  const adminTeam = teams.find((t) => t?.prefs?.isAdminTeam === "true");
  if (adminTeam) return adminTeam;

  // fallback: only one team or first team
  return teams[0];
}
