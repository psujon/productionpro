import "./ProductionSheetReport.css";


const ProductionSheetReport = ({ productionSheetData }) => {
    let data = null;
    if (productionSheetData && typeof productionSheetData === "object" && Object.keys(productionSheetData).length > 0) {
        const values = Object.values(productionSheetData);
        // If the first value is an array, use it directly; otherwise, wrap it in an array
        data = Array.isArray(values[0]) ? values[0] : values;
    }

    if (!data || !Array.isArray(data)) {
        return <div>No production sheet data available.</div>;
    }

    return data.map((employeeData, index) => (
        <div key={index} className="production-sheet">
                <header>
                    <p className="company-info">
                        {employeeData.unit}<br></br>
                        Jarun, Konabari, Gazipur
                    </p>
                    <h1>PRODUCTION SHEET</h1>
                    <div className="meta-data">
                        <div>NAME: {employeeData?.emp_name}</div>
                        <div>SECTION: {employeeData?.section}</div>
                        <div>CARDNO: {employeeData?.cardno}</div>
                        <div>BLOCK: {employeeData?.block}</div>
                        <div><strong>MONTH:</strong> October-November 2025</div>
                        <div><strong>REF:</strong> BWSL/PRD(SEW)/03/006</div>
                    </div>
                    <div className="supervisor-data">
                        <div><strong>SUPERVISOR:</strong> </div>
                        <div><strong>MACHINE NO.:</strong> </div>
                        <div>DATE: {new Date().toLocaleDateString()}</div>
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
                        {employeeData?.prod_items?.map((item, itemIndex) => (
                            <tr key={itemIndex}>
                                <td>{item?.prod_date}</td>
                                <td>{item?.style}</td>
                                <td>{item?.process}</td>
                                <td>{item?.quantity}</td>
                                <td>{item?.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="total-label">Total:</td>
                            <td className="total-qty">
                                {employeeData?.prod_items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} Pcs
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <footer>
                    <div className="signature-line">
                        <div>Worker Signature</div>
                        <div>Supervisor</div>
                        <div>In-Charge</div>
                    </div>
                    <p className="page-number">Page 1 of 1</p>
                </footer>
            </div>
        ));
    }


    // Assume data is a single object with items array
    // return (    
    //     <div className="production-sheet">
    //         <header>
    //             <p className="company-info">
    //                 {data.unit}<br></br>
    //                 Jarun, Konabari, Gazipur
    //             </p>
    //             <h1>PRODUCTION SHEET</h1>
    //             <div className="meta-data">
    //                 <div>NAME: {data?.emp_name}</div>
    //                 <div>SECTION: {data?.section}</div>
    //                 <div>CARDNO: {data?.cardno}</div>
    //                 <div>BLOCK: {data?.block}</div>
    //                 <div><strong>MONTH:</strong> October-November 2025</div>
    //                 <div><strong>REF:</strong> BWSL/PRD(SEW)/03/006</div>
    //             </div>
    //             <div className="supervisor-data">
    //                 <div><strong>SUPERVISOR:</strong> </div>
    //                 <div><strong>MACHINE NO.:</strong> </div>
    //                 <div>DATE: {new Date().toLocaleDateString()}</div>
    //             </div>
    //         </header>

    //         <table>
    //             <thead>
    //                 <tr>
    //                     <th>DATE OF ISSUE</th>
    //                     <th>STYLE NO</th>
    //                     <th>TYPE</th>
    //                     <th>QTY</th>
    //                     <th>REMARKS</th>
    //                 </tr>
    //             </thead>
    //             <tbody>
    //                 {data?.prod_items?.map((item, index) => (
    //                     <tr key={index}>
    //                         <td>{item?.prod_date}</td>
    //                         <td>{item?.style}</td>
    //                         <td>{item?.process}</td>
    //                         <td>{item?.quantity}</td>
    //                         <td>{item?.remarks}</td>
    //                     </tr>
    //                 ))}
    //             </tbody>
    //             <tfoot>
    //                 <tr>
    //                     <td colSpan="3" className="total-label">Total:</td>
    //                     <td className="total-qty">
    //                         {data?.prod_items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} Pcs
    //                     </td>
    //                     <td></td>
    //                 </tr>
    //             </tfoot>
    //         </table>

    //         <footer>
    //             <div className="signature-line">
    //                 <div>Worker Signature</div>
    //                 <div>Supervisor</div>
    //                 <div>In-Charge</div>
    //             </div>
    //             <p className="page-number">Page 1 of 1</p>
    //         </footer>
    //     </div>
    // );

export default ProductionSheetReport;