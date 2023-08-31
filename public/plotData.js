// plotData.js
// Helper function to determine if a transaction is income or expenditure
function isIncome(tx, address) {
  return tx.recipient === address;
}

// Helper function to format date as MM-DD-YYYY
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}-${day}-${year}`;
}

function calculateCumulativeIncome(totalReward) {
  let cumulativeIncome = 0;
  return totalReward.map(totalReward => {
    cumulativeIncome += totalReward;
    return cumulativeIncome;
  });
}

function createCumulativeIncomePlot(data) {

// Sort the data by timestamp
data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const dates = data.map(tx => new Date(tx.timestamp));
  const harvesterRewards = [];
  const beneficiaryRewards = [];
  const fees = [];
  let harvesterSum = 0;
  let beneficiarySum = 0;
  let feesSum = 0;

  data.forEach(tx => {
  harvesterSum += tx.harvester;
  beneficiarySum += tx.beneficiary;
  feesSum += tx.fees;
    harvesterRewards.push(harvesterSum);
    beneficiaryRewards.push(beneficiarySum);
    fees.push(feesSum);
  });

  const harvesterTrace = {
    x: dates,
    y: harvesterRewards,
    type: 'scatter',
    stackgroup: 'one',
    name: 'Harvester'
  };

  const beneficiaryTrace = {
    x: dates,
    y: beneficiaryRewards,
    type: 'scatter',
    stackgroup: 'one',
    name: 'Beneficiary'
  };

  const feesTrace = {
    x: dates,
    y: fees,
    type: 'scatter',
    stackgroup: 'one',
    name: 'Fees'
  };

  // Define layout for the plot
  const layout = {
    title: 'Cumulative Income Over Time',
    xaxis: {
      title: 'Date',
      tickformat: '%Y-%m-%d' // Format x-axis tick labels as 'YYYY-MM-DD'
    },
    yaxis: {
      title: 'Cumulative Income'
    },
    barmode: 'stack'
  };

  // Create the plot using Plotly
  Plotly.newPlot('plot', [harvesterTrace, beneficiaryTrace, feesTrace], layout);
}


async function plotData() {
  console.log("plotData function called");
  const address = document.getElementById('address').value;
  console.log("Address:", address);
  const calendarContainer = d3.select("#calendar svg");

  let url = `http://localhost:5000/transactions?address=${address}`;

  const response = await fetch(url);
  console.log("Response:", response);

  if (!response.ok) {
    console.error('Failed to fetch data');
    return;
  }

  const data = await response.json();

  const yearRange = [2021, 2023]; // Adjust the year range here

  // Clear the existing calendar SVG elements
  const existingCalendar = d3.select(".calendar-svg");
  existingCalendar.selectAll("*").remove();

  const width = 960,
    height = 240,
    cellSize = 17;

  // Create a dictionary to store the transaction amounts by date
  const incomeAmounts = {};
  
  
function formatDateForComparison(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}-${day}-${year}`;
}



  // Create a dictionary to store transactions by date
  const transactionsByDate = {};

  data.forEach(tx => {
    const date = new Date(tx.timestamp);
    const formattedDate = formatDateForComparison(date);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateString = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    const amount = tx.totalReward || 0;
    const harvest = tx.harvester || 0;
    const beneficiary = tx.beneficiary || 0;
    const fees = tx.fees || 0;
    console.log("Timestamp: ", tx.timestamp);
    console.log("DateString", dateString);
    console.log("Date: ", dateString);
    console.log("Amount: ", amount);
    console.log("Harvest: ", harvest);
    console.log("Beneficiary: ", beneficiary);
    console.log("Fees: ", fees);
   
     
    if (!incomeAmounts[dateString]) {
      incomeAmounts[dateString] = 0;
    }
    incomeAmounts[dateString] += amount;

  if (!transactionsByDate[formattedDate]) {
    transactionsByDate[formattedDate] = [];
  }
  transactionsByDate[formattedDate].push(tx);
});

  // Calculate maxIncome by using the values in the incomeAmounts dictionary
  const maxIncome = Math.max(...Object.values(incomeAmounts));

  // Calculate start date of income
  const startDate = Object.keys(incomeAmounts).sort()[0];

  // Calculate total income and average income per day since start
  const totalIncome = Object.values(incomeAmounts).reduce((total, income) => total + income, 0);
  const daysSinceStart = (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24);
  const averageIncomePerDay = totalIncome / daysSinceStart;

  // Update the summary elements in the HTML
  document.getElementById("start-date").textContent = startDate;
  document.getElementById("total-income").textContent = totalIncome.toFixed(2);
  document.getElementById("average-income").textContent = averageIncomePerDay.toFixed(2);
  document.getElementById("max-income").textContent = maxIncome.toFixed(2);

  // Show the summary container
  document.getElementById("summary-container").style.display = "block";


  const logScale = d3.scaleLog()
    .domain([1, maxIncome])
    .range([0, 1]);

  const linearScale = d3.scaleLinear()
    .domain([0, maxIncome])
    .range([0, 1]);

  const colorScale = d3.scaleSequential(d3.interpolatePlasma)
    .domain([0, 1]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const container = d3.select("#calendar");

  const yearsContainer = container.selectAll(".year")
    .data(d3.range(yearRange[0], yearRange[1] + 1))
    .enter()
    .append("div")
    .attr("class", "year");

  yearsContainer.append("h2")
    .text(d => d);

  const incomeContainer = yearsContainer.append("div")
    .attr("class", "income-container");

  incomeContainer.append("h3")
    .text("Income");

  const incomeSvg = incomeContainer.append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(40, 40)"); // Adjust the margin to move the plot

  incomeSvg.selectAll(".monthLabel")
    .data(monthLabels)
    .enter()
    .append("text")
    .attr("class", "monthLabel")
    .attr("transform", function (d, i) {
      const x = i * (cellSize * 4.25) + (cellSize * 3); // Adjust the x position
      const y = 130; // Adjust the y position
      return `translate(${x}, ${y})`;
    })
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(function (d) {
      return d;
    });

  incomeSvg.selectAll(".dayLabel")
    .data(dayLabels)
    .enter()
    .append("text")
    .attr("class", "dayLabel")
    .attr("x", -25)
    .attr("y", function (d, i) {
      return (i * cellSize) + cellSize - 5;
    })
    .attr("font-size", "10px")
    .text(function (d) {
      return d;
    });

  const incomeRect = incomeSvg.selectAll(".day")
    .data(function (d) {
      return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1));
    })
    .enter()
    .append("rect")
    .attr("class", "day")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("x", function (d) {
      return d3.timeWeek.count(d3.timeYear(d), d) * cellSize;
    })
    .attr("y", function (d) {
      return d.getDay() * cellSize;
    })
    .datum(d => d3.timeFormat("%Y-%m-%d")(d))
    .style("stroke", "#ccc")
    .style("fill", function (date) {
      const income = incomeAmounts[date] || 0;
      const colorValue = income > 0 ? linearScale(income) : 0;
      const color = income > 0 ? colorScale(colorValue) : "white";
      return color;
    });

  console.log("Max Income:", maxIncome);

  // Create the cumulative income plot using Plotly
  Plotly.purge('plot');
  createCumulativeIncomePlot(data);

  incomeRect.append("title")
    .text(function (d) {
      if (d in incomeAmounts) {
        return `${formatDate(new Date(d))}: ${incomeAmounts[d].toFixed(2)}`; // Added .toFixed(2) here
      } else {
        return formatDate(new Date(d));
      }
    });

  incomeSvg.selectAll(".month")
    .data(function (d) {
      return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1));
    })
    .enter()
    .append("path")
    .attr("class", "month")
    .attr("d", monthPath)
    .attr("fill", "none")
    .style("stroke", "#000") // Adding stroke color
    .style("stroke-width", "2"); // Adding stroke width

  const tooltip = d3.select("#calendar") // Changed the selector to the container element
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

incomeRect.on("mouseover", function (event, d) {
  const formattedDate = d3.timeFormat("%m-%d-%Y")(d); // Format the date as "MM-DD-YYYY"
  const transactions = transactionsByDate[formattedDate] || [];
  showTooltip(event.pageX, event.pageY, transactions);
  console.log("Formatted Date:", formattedDate);
});



  incomeRect.on("click", function (event, d) {
    const formattedDate = formatDate(new Date(d)); // Format the date as "MM-DD-YYYY"
    const transactions = transactionsByDate[formattedDate] || [];
    showDetails(event.pageX, event.pageY, transactions);
  });

function showTooltip(x, y, transactions) {
  if (transactions.length === 0) {
    return;
  }

  tooltip.transition()
    .duration(200)
    .style("opacity", 0.9);

  const formattedDate = formatDateForComparison(new Date(transactions[0].timestamp));
  const dateFormatted = formatDate(new Date(transactions[0].timestamp)); // Format the date as "MM-DD-YYYY"
  const sumOfAmounts = transactions.reduce((sum, tx) => sum + tx.totalReward, 0).toFixed(2);

  const tooltipContent = `
    <div>
      <strong>Date:</strong> ${dateFormatted}<br>
      <strong>Amount:</strong> ${sumOfAmounts}<br>
    </div>
  `;

  tooltip.html(tooltipContent)
    .style("left", `${x}px`)
    .style("top", `${y}px`);
}


function showTransactions(x, y, transactions) {
  if (transactions.length === 0) {
    return;
  }

  let transactionsContent = `
    <div>
      <strong>Date:</strong> ${formatDateForComparison(new Date(transactions[0].timestamp))}<br>
    </div>
  `;

  transactions.forEach(tx => {
    const blockNumber = tx.blockNumber;
    const amount = tx.reward.toFixed(2);
    transactionsContent += `
      <div>
        <a href="https://symbol.fyi/blocks/${blockNumber}" target="_blank">Block Number: ${blockNumber}</a><br>
        Amount: ${amount}
      </div>
    `;
  });

  tooltip.html(transactionsContent)
    .style("left", `${x}px`)
    .style("top", `${y}px`);
}


  function monthPath(t0) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = t0.getDay(),
      w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
      d1 = t1.getDay(),
      w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
    return (
      "M" +
      (w0 + 1) * cellSize +
      "," +
      d0 * cellSize +
      "H" +
      w0 * cellSize +
      "V" +
      7 * cellSize +
      "H" +
      w1 * cellSize +
      "V" +
      (d1 + 1) * cellSize +
      "H" +
      (w1 + 1) * cellSize +
      "V" +
      0 +
      "H" +
      (w0 + 1) * cellSize +
      "Z"
    );
  }
}

document.getElementById('input-form').addEventListener('submit', function(event) {
  event.preventDefault();
  plotData();
});
