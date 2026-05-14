module.exports = (data) => data.map((employeeData, index) => `

<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }

        .production-sheet {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            padding: 10px;
            border: 1px solid #333; /* Heavy border for a sheet look */
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        /* Header Styles */
        header {
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }

        header h1 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 5px;
        }

        .company-info {
            text-align: center;
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.4;
        }

        .meta-data, .supervisor-data {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 5px;
        }

        .meta-data > div, .supervisor-data > div {
            flex: 1 1 30%; /* Distribute items, allowing wrap */
            margin-bottom: 5px;
            border-bottom: 1px dotted #ccc; /* Underline for blank spaces */
            padding-bottom: 2px;
        }

        .supervisor-data > div {
            flex: 1 1 30%;
        }

        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse; /* Cells share a single border */
            margin-bottom: 20px;
            font-size: 12px;
        }

        th, td {
            border: 1px solid #333;
            padding: 8px 5px;
            text-align: left;
        }

        thead th {
            background-color: #e9e9e9;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
        }

        tbody tr:nth-child(even) {
            background-color: #f9f9f9; /* Zebra striping for readability */
        }

        /* Footer Table Row (Total) */
        tfoot td {
            border: 1px solid #333;
            padding: 8px 5px;
            font-weight: bold;
            background-color: #e9e9e9;
        }

        .total-label {
            text-align: right;
            border-right: none;
        }

        .total-qty {
            text-align: center;
            width: 100px; /* Adjust width as necessary */
        }

        /* Bottom Footer Styles */
        footer {
            text-align: center;
        }

        .signature-line {
            display: flex;
            justify-content: space-around;
            padding: 20px 0;
            border-top: 1px solid #333;
            font-size: 12px;
        }

        .signature-line div {
            width: 150px;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
        }

        .page-number {
            font-size: 10px;
            text-align: right;
        }
    </style>
</head>
<body>

    <div class="production-sheet">
        <header>
            <p class="company-info">
                ${employeeData.unit}<br></br>
                Jarun, Konabari, Gazipur
            </p>
            <h1>PRODUCTION SHEET</h1>
            <div class="meta-data">
                <div>NAME: ${employeeData.emp_name} </div>
                <div>SECTION: ${employeeData.section} </div>
                <div>CARD NO: ${employeeData.cardno} </div>
                <div>BLOCK: ${employeeData?.block} </div>
                <div>MONTH: October-November 2025</div>
                <div>REF: BWSL/PRD(SEW)/03/006</div>
            </div>
            <div class="supervisor-data">
                <div>**SUPERVISOR:** </div>
                <div>**MACHINE NO.:** </div>
                <div>**DATE:** </div>
            </div>
        </header>

        <table>
            <thead>
                <tr>
                    <th>DATE OF ISSUE</th>
                    <th>STYLE NO</th>
                    <th>TYPE</th>
                    <th>QTY</th>
                    <th>REMARKS</th>
                </tr>
            </thead>
            <tbody>
                ${employeeData?.prod_items?.map(item => `
                <tr>
                    <td>${item?.prod_date}</td>
                    <td>${item?.style}</td>
                    <td>${item?.process}</td>
                    <td>${item?.quantity}</td>
                    <td></td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" class="total-label">Total:</td>
                    <td class="total-qty">${employeeData?.prod_items?.reduce((sum, item) => sum + (item?.quantity || 0), 0)} Pcs</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>

        <footer>
            <div class="signature-line">
                <div>Worker Signature</div>
                <div>Supervisor</div>
                <div>In-Charge</div>
            </div>
            <p class="page-number">Page 1 of 1</p>
        </footer>
    </div>

</body>
</html>
`);
