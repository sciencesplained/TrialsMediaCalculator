
function calculateMain() {
  const target = parseFloat(document.getElementById('targetParticipants').value);
  const months = parseFloat(document.getElementById('recruitmentMonths').value);
  const staffCost = parseFloat(document.getElementById('staffCostPerMonth').value);
  const fte = parseFloat(document.getElementById('fte').value);
  const screenFail = parseFloat(document.getElementById('screenFailure').value) / 100;
  const dropout = parseFloat(document.getElementById('dropoutRate').value) / 100;
  const incentive = parseFloat(document.getElementById('incentivePerParticipant').value);
  const sites = parseFloat(document.getElementById('siteCount').value);
  const setupPerSite = parseFloat(document.getElementById('siteSetupCost').value);
  const includeOverhead = document.getElementById('includeOverhead').checked;

  const adjustedTarget = Math.round(target / (1 - dropout));
  const screenedNeeded = Math.round(adjustedTarget / (1 - screenFail));

  let totalStaffCost = staffCost * months * fte;
  if (includeOverhead) totalStaffCost *= 1.25;

  const totalIncentives = adjustedTarget * incentive;
  const totalSiteCost = sites * setupPerSite;
  const totalCost = totalStaffCost + totalIncentives + totalSiteCost;

  const costPerRecruited = totalCost / adjustedTarget;
  const costPerRetained = totalCost / target;

  document.getElementById("mainResult").innerHTML = `
    ✅ Total participants to recruit (adjusted for dropouts): <strong>${adjustedTarget}</strong><br>
    🔎 Total participants to screen (adjusted for screen failure): <strong>${screenedNeeded}</strong><br>
    💰 Total estimated recruitment cost: <strong>£${totalCost.toFixed(2)}</strong><br>
    📊 Cost per recruited participant: <strong>£${costPerRecruited.toFixed(2)}</strong><br>
    🧍‍♂️ Cost per retained participant: <strong>£${costPerRetained.toFixed(2)}</strong><br>
  `;
}

function downloadPDF() {
  const element = document.createElement('div');
  element.innerHTML = document.getElementById("mainResult").innerHTML || "<p>No calculation done yet.</p>";

  html2pdf().from(element).set({
    filename: 'Recruitment_Summary.pdf',
    margin: 10,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save();
}
