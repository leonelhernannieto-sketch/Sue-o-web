document.addEventListener('DOMContentLoaded', () => {
    // --- CALCULADORA DE SUEÑO ---
    const calcHour = document.getElementById('calc-hour');
    const calcMin = document.getElementById('calc-min');
    // Populate selects
    for (let i = 0; i < 24; i++) {
        let val = i.toString().padStart(2, '0');
        calcHour.innerHTML += `<option value="${i}">${val}</option>`;
    }
    for (let i = 0; i < 60; i+=5) { // steps of 5 mins for simplicity
        let val = i.toString().padStart(2, '0');
        calcMin.innerHTML += `<option value="${i}">${val}</option>`;
    }
    // Set default to 09:00 as in image
    calcHour.value = "9";
    calcMin.value = "0";
    function updateCalculator() {
        const h = parseInt(calcHour.value);
        const m = parseInt(calcMin.value);
        let wakeDate = new Date();
        wakeDate.setHours(h, m, 0, 0);
        // 6 cycles = 9 hours
        let c6 = new Date(wakeDate.getTime() - 9 * 60 * 60 * 1000);
        // 5 cycles = 7.5 hours
        let c5 = new Date(wakeDate.getTime() - 7.5 * 60 * 60 * 1000);
        // 4 cycles = 6 hours
        let c4 = new Date(wakeDate.getTime() - 6 * 60 * 60 * 1000);
        function formatTime(d) {
            return d.getHours().toString().padStart(2, '0') + ':' + 
                   d.getMinutes().toString().padStart(2, '0');
        }
        document.getElementById('res-time-6').innerText = formatTime(c6);
        document.getElementById('res-time-5').innerText = formatTime(c5);
        document.getElementById('res-time-4').innerText = formatTime(c4);
    }
    calcHour.addEventListener('change', updateCalculator);
    calcMin.addEventListener('change', updateCalculator);
    updateCalculator();
    // --- HORARIO DE SUEÑO ---
    const days = [
        { id: 'lun', label: 'L', start: '22:30', end: '06:30', status: 'orange' },
        { id: 'mar', label: 'M', start: '23:00', end: '07:00', status: 'teal' },
        { id: 'mie', label: 'M', start: '00:30', end: '08:30', status: 'orange' },
        { id: 'jue', label: 'J', start: '23:00', end: '07:00', status: 'teal' },
        { id: 'vie', label: 'V', start: '22:00', end: '06:00', status: 'teal' },
        { id: 'sab', label: 'S', start: '01:00', end: '09:00', status: 'orange' },
        { id: 'dom', label: 'D', start: '23:30', end: '06:30', status: 'orange' }
    ];
    // Chart timeline: 18:00 (6 PM) to 12:00 (Noon) = 18 hours
    const CHART_START_MIN = 18 * 60; // 1080
    const TOTAL_MINS = 18 * 60; // 1080
    // Build Editor UI and Chart Rows
    const editorContainer = document.getElementById('schedule-inputs-container');
    const chartRows = document.getElementById('chart-rows');
    const chartGrid = document.getElementById('chart-grid');
    // Render vertical grid lines (every 3 hours = 6 segments)
    for(let i=0; i<=6; i++) {
        let gridElem = document.createElement('div');
        gridElem.className = 'grid-line-v' + (i===2 || i===5 ? ' grid-line-thick' : ''); 
        chartGrid.appendChild(gridElem);
    }
    function renderTracker() {
        editorContainer.innerHTML = '';
        chartRows.innerHTML = '';
        days.forEach((day, index) => {
            // 1. Render Editor Row
            const rowElem = document.createElement('div');
            rowElem.className = 'day-input-row';
            rowElem.innerHTML = `
                <span>${day.label}</span>
                <input type="time" value="${day.start}" id="start-${index}" title="Hora de acostarse">
                <input type="time" value="${day.end}" id="end-${index}" title="Hora de levantarse">
                <select id="status-${index}">
                    <option value="teal" ${day.status === 'teal' ? 'selected' : ''}>Cumplido</option>
                    <option value="orange" ${day.status === 'orange' ? 'selected' : ''}>No Cumplido</option>
                </select>
            `;
            editorContainer.appendChild(rowElem);
            // Add listeners
            document.getElementById(`start-${index}`).addEventListener('change', (e) => { day.start = e.target.value; updateChart(); });
            document.getElementById(`end-${index}`).addEventListener('change', (e) => { day.end = e.target.value; updateChart(); });
            document.getElementById(`status-${index}`).addEventListener('change', (e) => { day.status = e.target.value; updateChart(); });
            // 2. Render Chart Row structure
            const cRow = document.createElement('div');
            cRow.className = 'chart-row';
            cRow.innerHTML = `
                <div class="day-label">${day.label}</div>
                <div class="bar-area">
                    <div class="sleep-bar ${day.status}" id="bar-${index}"></div>
                </div>
            `;
            chartRows.appendChild(cRow);
        });
        updateChart();
    }
    function timeToMinsFromChartStart(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        let mins = h * 60 + m;
        // If time is before 18:00 (e.g., 01:00 or 12:00 up to 17:59), add 24 hours to put it in next day conceptually
        if (h < 18) {
            mins += 24 * 60;
        }
        return mins - CHART_START_MIN;
    }
    function updateChart() {
        days.forEach((day, index) => {
            let startMins = timeToMinsFromChartStart(day.start);
            let endMins = timeToMinsFromChartStart(day.end);
            if (endMins < startMins) {
                // Handling wrap-around case safely, adding 24 hours to end
                endMins += 24 * 60; 
            }
            let leftSec = (startMins / TOTAL_MINS) * 100;
            let widthSec = ((endMins - startMins) / TOTAL_MINS) * 100;
            // Clamp to visually stay within 0-100% just in case
            if(leftSec < 0) { widthSec += leftSec; leftSec = 0; }
            if(leftSec + widthSec > 100) widthSec = 100 - leftSec;
            const bar = document.getElementById(`bar-${index}`);
            bar.style.left = leftSec + '%';
            bar.style.width = widthSec + '%';
            // Update class color
            bar.className = `sleep-bar ${day.status}`;
        });
    }
    renderTracker();
});
