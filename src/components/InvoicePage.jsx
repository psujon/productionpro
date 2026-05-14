import axios from "axios";
import "./invoice.css";

const InvoicePage = ({server_url}) => {
  const invoiceData = {
    id: 101,
    date: new Date().toLocaleDateString(),
    companyLogo:
      "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png",

    companyName: "Your Company Ltd.",
    companyAddress: "23/A Banani, Dhaka, Bangladesh",
    companyPhone: "+880 1234 567 890",
    companyEmail: "info@company.com",

    customer: {
      name: "John Doe",
      address: "Gulshan 2, Dhaka, Bangladesh",
      phone: "01700000000",
    },

    items: [
      { name: "Laptop", qty: 1, price: 45000 },
      { name: "Mouse", qty: 2, price: 500 },
      { name: "Keyboard", qty: 1, price: 1500 },
    ],
  };

  const downloadPDF = async () => {
    // console.log("Downloading PDF...");
    const response = await axios.post(
      `${server_url}/production_sheet`,
      invoiceData,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice.pdf";
    link.click();
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="invoice-container">
      <div className="invoice-preview" id="print-area">
        <h1>Invoice Preview</h1>
        <p>This is your invoice preview before download.</p>
      </div>

      <button className="btn" onClick={downloadPDF}>
        Download Invoice PDF
      </button>

      <button className="btn print-btn" onClick={printInvoice}>
        Print Invoice
      </button>
    </div>
  );
};

export default InvoicePage;
