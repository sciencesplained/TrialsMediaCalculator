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

  document.getElementById("costBreakdown").innerHTML = `
    <h4>💡 Cost Breakdown Summary</h4>
    <ul>
      <li><strong>Staff Cost (incl. overhead):</strong> £${Math.round(totalStaffCost).toLocaleString()}</li>
      <li><strong>Participant Incentives:</strong> £${Math.round(totalIncentives).toLocaleString()}</li>
      <li><strong>Site Setup Costs:</strong> £${Math.round(totalSiteCost).toLocaleString()}</li>
    </ul>
  `;

  document.getElementById("roiSection").style.display = "block";
}

function calculateROI() {
  const months = parseFloat(document.getElementById('recruitmentMonths').value);
  const staffCost = parseFloat(document.getElementById('staffCostPerMonth').value);
  const fte = parseFloat(document.getElementById('fte').value);
  const investment = parseFloat(document.getElementById('investment').value);
  const boost = parseFloat(document.getElementById('impact').value);

  const baseDuration = months;
  const extensionCosts = [0, 6000, 18000];
  const extendedDurations = [baseDuration, baseDuration + 1, baseDuration + 3];
  const noMediaCosts = extendedDurations.map((d, i) => d * staffCost * fte + extensionCosts[i]);
  const withMediaDurations = extendedDurations.map(d => d / (1 + boost));
  const withMediaCosts = withMediaDurations.map(d => d * staffCost * fte + investment);
  const savings = noMediaCosts.map((cost, i) => cost - withMediaCosts[i]);

  document.getElementById("roiResult").innerHTML = `
    💡 Media investment of <strong>£${investment}</strong> at <strong>${Math.round(boost * 100)}%</strong> efficiency gain.<br>
    🎯 Target recruitment duration: <strong>${months} months</strong><br>
  `;

  renderScenarioTable(extendedDurations, noMediaCosts, withMediaDurations, withMediaCosts, savings);
  console.log("Chart drawing initiating");
  drawChart(extendedDurations, noMediaCosts, withMediaDurations, withMediaCosts, savings);
}

function renderScenarioTable(baseDurations, baseCosts, mediaDurations, mediaCosts, savings) {
  const labels = ["On-Time Scenario", "1 Month Late Scenario", "3 Months Late Scenario"];
  const rows = labels.map((label, i) => {
    return `<tr>
      <td>${label}</td>
      <td>${baseDurations[i].toFixed(1)} mo</td>
      <td>£${Math.round(baseCosts[i]).toLocaleString()}</td>
      <td>${mediaDurations[i].toFixed(1)} mo</td>
      <td>£${Math.round(mediaCosts[i]).toLocaleString()}</td>
      <td>£${Math.round(savings[i]).toLocaleString()}</td>
    </tr>`;
  }).join("");

  document.getElementById("scenarioTable").innerHTML = `
    <h4>📊 Scenario Comparison Table</h4>
    <table style="width:100%;border-collapse:collapse;text-align:left;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th>Scenario</th>
          <th>Duration (No Media)</th>
          <th>Cost (No Media)</th>
          <th>Duration (With Media)</th>
          <th>Cost (With Media)</th>
          <th>Savings</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
function drawChart(baseDurations, baseCosts, mediaDurations, mediaCosts, savings) {
  const ctx = document.getElementById('timelineChart').getContext('2d');

  if (window.recruitChart) window.recruitChart.destroy();

  const labels = ["On-Time Scenario", "1 Month Late Scenario", "3 Months Late Scenario"];

  window._chartBaseDurations = baseDurations;
  window._chartMediaDurations = mediaDurations;
  window._chartBaseCosts = baseCosts;
  window._chartMediaCosts = mediaCosts;
  window._chartSavings = savings;
  window._chartLabels = labels;
  window._chartTargetDuration = baseDurations[0]; // Used for line + formatting

  const targetDuration = window._chartTargetDuration;

  window.recruitChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Without Media',
          data: baseDurations,
          backgroundColor: '#ff6600'
        },
        {
          label: 'With Media',
          data: mediaDurations,
          backgroundColor: '#000080'
        }
      ]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const idx = context.dataIndex;
              const isMedia = context.dataset.label === "With Media";
              const scenarioLabel = window._chartLabels[idx];
              const duration = isMedia ? window._chartMediaDurations[idx] : window._chartBaseDurations[idx];
              const cost = isMedia ? window._chartMediaCosts[idx] : window._chartBaseCosts[idx];
              const saved = isMedia ? ` (Saves £${Math.round(window._chartSavings[idx]).toLocaleString()})` : '';

              if (!isMedia) {
                return `${scenarioLabel}: ${duration.toFixed(1)} months, £${Math.round(cost).toLocaleString()}`;
              } else {
                const target = window._chartTargetDuration;
                const timeDiff = target - duration;
                const timingPhrase = timeDiff > 0
                  ? `${Math.abs(timeDiff.toFixed(1))} months early`
                  : `only ${Math.abs(timeDiff.toFixed(1))} months late`;

                return `${scenarioLabel} with Media: ${duration.toFixed(1)} months (${timingPhrase}), £${Math.round(cost).toLocaleString()}${saved}`;
              }
            }
          }
        },
        title: {
          display: true,
          text: 'Recruitment Timeline Comparison'
        },
        legend: {
          position: 'top'
        },
        annotation: {
          annotations: {
            targetLine: {
              type: 'line',
              xMin: targetDuration,
              xMax: targetDuration,
              borderColor: '#000',
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: 'Target',
                enabled: true,
                position: 'start'
              }
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Recruitment Duration (months)'
          },
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              // Bold the target tick
              return value === targetDuration ? `\u200B**${value}**` : value;
            }
          }
        }
      }
    },
    plugins: [Chart.registry.getPlugin('annotation')] // Activate annotation plugin
  });
}


function downloadPDF() {
  // Get result sections
  const mainResult = document.getElementById("mainResult");
  const costBreakdown = document.getElementById("costBreakdown");
  const roiResult = document.getElementById("roiResult");
  const scenarioTable = document.getElementById("scenarioTable");

  // Create temporary wrapper to hold content for PDF
  const printContainer = document.createElement('div');
  printContainer.style.padding = '20px';
  printContainer.style.fontFamily = 'Arial, sans-serif';
  printContainer.innerHTML = `
    <h2>Recruitment Summary</h2>
    <div>${mainResult?.innerHTML || ''}</div>
    <div>${costBreakdown?.innerHTML || ''}</div>
    <div>${roiResult?.innerHTML || ''}</div>
    <div>${scenarioTable?.innerHTML || ''}</div>
  `;

  // Append it to the DOM invisibly so html2pdf can render it
  document.body.appendChild(printContainer);
  printContainer.style.display = 'block';
  printContainer.style.position = 'absolute';
  printContainer.style.left = '-9999px';

  // Generate PDF
  html2pdf().from(printContainer).set({
    filename: 'Recruitment_Summary.pdf',
    margin: 10,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => {
    // Clean up after saving
    printContainer.remove();
  });
}
