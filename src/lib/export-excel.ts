/**
 * SPD Logistics — Universal Excel & CSV Export Utility
 * Generates structured, UTF-8 BOM encoded CSV files that open natively in Microsoft Excel
 * with full support for Urdu, Arabic, and English text, proper numeric columns, and dates.
 */

export interface ExportColumn<T = any> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export function exportToExcel<T = any>(baseFilename: string, columns: ExportColumn<T>[], data: T[]): boolean;
export function exportToExcel<T = any>(data: T[], baseFilename: string, columns?: ExportColumn<T>[]): boolean;
export function exportToExcel<T = any>(
  arg1: string | T[],
  arg2?: ExportColumn<T>[] | string,
  arg3?: T[]
): boolean {
  let baseFilename: string;
  let columns: ExportColumn<T>[];
  let data: T[];

  if (typeof arg1 === "string") {
    // Signature: exportToExcel(filename, columns, data)
    baseFilename = arg1;
    columns = (arg2 as ExportColumn<T>[]) || [];
    data = arg3 || [];
  } else {
    // Signature: exportToExcel(data, filename, optionalColumns)
    data = arg1 || [];
    baseFilename = typeof arg2 === "string" ? arg2 : "Export";
    if (arg3 && Array.isArray(arg3)) {
      columns = arg3 as unknown as ExportColumn<T>[];
    } else if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      columns = Object.keys(data[0]).map((key) => ({
        header: key,
        accessor: (item: any) => item[key],
      }));
    } else {
      columns = [];
    }
  }

  if (!data) data = [];

  // If no columns are provided and data is empty, set a default header so a valid CSV is exported
  if (columns.length === 0) {
    if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      columns = Object.keys(data[0]).map((key) => ({
        header: key,
        accessor: (item: any) => item[key],
      }));
    } else {
      columns = [
        { header: "Record ID", accessor: () => "" },
        { header: "Status", accessor: () => "No records to export" },
      ];
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const sanitizedBase = (baseFilename || "Export").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fullFilename = `${sanitizedBase}_${todayStr}.csv`;

  const escapeField = (val: any): string => {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    // Wrap in quotes if it contains commas, quotes, or newlines
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    // If it's a numeric string that might lose leading zeroes or needs standard quoting
    if (/^[0-9+-\s]+$/.test(str) && str.length > 10) {
      return `="${str}"`; // Excel text formula to preserve phone numbers / CNICs
    }
    return `"${str}"`;
  };

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");
  const dataRows = data.map((item) =>
    columns.map((col) => escapeField(col.accessor(item))).join(",")
  );

  // UTF-8 BOM (\uFEFF) instructs Excel to open file with UTF-8 encoding
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Native WebKit / Safari file share support when available on mobile devices
  if (
    typeof navigator !== "undefined" &&
    typeof File !== "undefined" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const shareFile = new File([blob], fullFilename, { type: "text/csv;charset=utf-8" });
      if (navigator.canShare({ files: [shareFile] })) {
        navigator.share({
          files: [shareFile],
          title: fullFilename,
        }).catch(() => {
          // User dismissed native share sheet; anchor click handles fallback
        });
      }
    } catch {
      // Fallback seamlessly to anchor download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fullFilename);
  link.setAttribute("target", "_self");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Defer cleanup for iOS Safari / WebKit asynchronous download processing
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Safe cleanup fallback
    }
  }, 1500);

  return true;
}

/**
 * Generate a complete 4-sheet Excel Workbook (.xls / .xlsx SpreadsheetML)
 * Containing:
 * 1. Booking Sheet
 * 2. Consignment Note (Bilty Format)
 * 3. Freight Bill / Invoice
 * 4. Sales Tax Invoice (15%)
 */
export function export4SheetBiltyExcel(bilty: any): boolean {
  if (!bilty) return false;

  const xmlEscape = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const biltyNo = bilty.biltyNumber || "Bilty";
  const dateStr = bilty.date ? new Date(bilty.date).toLocaleDateString("en-PK") : new Date().toLocaleDateString("en-PK");
  const origin = bilty.origin || "Lahore";
  const destination = bilty.destination || "Karachi";
  const senderName = bilty.senderName || bilty.customer?.name || "Sender";
  const senderPhone = bilty.senderPhone || "";
  const senderAddress = bilty.senderAddress || `${origin}, Pakistan`;
  const receiverName = bilty.receiverName || "Receiver";
  const receiverPhone = bilty.receiverPhone || "";
  const receiverAddress = bilty.receiverAddress || bilty.deliveryAddress || `${destination}, Pakistan`;
  const deliveryAddress = bilty.deliveryAddress || receiverAddress;
  const billTo = bilty.billTo || "Sender";
  const amountType = bilty.amountType || bilty.paymentStatus || "To Pay";
  const dispatchMode = bilty.dispatchMode || "Normal";
  const poNumber = bilty.poNumber || "-";
  const blNumber = bilty.blNumber || "-";
  const lcNumber = bilty.lcNumber || "-";
  const containerNumber = bilty.containerNumber || "-";
  const gdNumber = bilty.gdNumber || "-";
  const vehicleNumber = bilty.vehicleNumber || (bilty.vehicle?.vehicleNumber || bilty.vehicle?.registrationNumber) || "Fleet Vehicle";
  const driverName = bilty.driverName || bilty.driver?.name || "Assigned Driver";

  // Items
  const items: any[] = Array.isArray(bilty.items) && bilty.items.length > 0
    ? bilty.items
    : [
        {
          detail: bilty.packageDetails || "General Merchandise Commercial Cargo",
          quantity: bilty.quantity || 1,
          weight: bilty.weight || 0,
          volume: bilty.cpm || 0,
          rate: bilty.freight || 0,
          freightMode: bilty.freightAsPer || "Fixed",
          amount: bilty.freight || 0,
        },
      ];

  const initialFreight = parseFloat(bilty.freight) || items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);
  const addl = bilty.additionalChargesBreakdown || {};
  const labour = parseFloat(addl.labour) || 0;
  const lifter = parseFloat(addl.lifterCrane || addl.lifter) || 0;
  const pickup = parseFloat(addl.pickupLocal || addl.pickup) || 0;
  const delivery = parseFloat(addl.deliveryLocal || addl.delivery) || 0;
  const godown = parseFloat(addl.godownStorage || addl.godown) || 0;
  const otherCharges = parseFloat(addl.other) || (parseFloat(bilty.additionalCharges) || 0);
  const otherRemark = addl.otherRemark || "Other Operational Charges";
  const totalAdditional = labour + lifter + pickup + delivery + godown + otherCharges;
  const discount = parseFloat(bilty.discount) || 0;
  const subTotal = Math.max(0, initialFreight + totalAdditional - discount);
  const paidAmount = parseFloat(bilty.paidAmount) || 0;

  // Taxes
  const incomeTax = bilty.incomeTax !== undefined ? parseFloat(bilty.incomeTax) || 0 : Math.round(subTotal * 0.06);
  const salesTax = bilty.salesTax !== undefined ? parseFloat(bilty.salesTax) || 0 : Math.round(subTotal * 0.15);
  const grandTotal = bilty.totalAmount ? parseFloat(bilty.totalAmount) : subTotal + incomeTax + salesTax;
  const balance = Math.max(0, grandTotal - paidAmount);

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function inWords(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }
  const wordsAmount = `Rupees ${inWords(Math.round(grandTotal)).trim()} Only`;

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="TitleHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#990000" ss:Bold="1"/>
      <Interior ss:Color="#F4F4F4" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="SubHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#333333" ss:Bold="1"/>
    </Style>
    <Style ss:ID="SectionHeader">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="TableHead">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#374151" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="TableCell">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
      </Borders>
    </Style>
    <Style ss:ID="TableCellNum">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.00"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
      </Borders>
    </Style>
    <Style ss:ID="BoldTotal">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <NumberFormat ss:Format="#,##0.00"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>

  <!-- ================= SHEET 1: BOOKING ================= -->
  <Worksheet ss:Name="Booking">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="160"/>
      <Column ss:Width="160"/>
      <Column ss:Width="160"/>
      <Column ss:Width="160"/>
      <Row ss:Height="26">
        <Cell ss:MergeAcross="3" ss:StyleID="TitleHeader"><Data ss:Type="String">SUPER PAK DATA WALE GOODS TRANSPORT CO. - BOOKING SHEET</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">Head Office: Hawksbay Road Karachi | Lahore Branch: Saggian Bypass Lahore</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row ss:Height="20">
        <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">1. BOOKING CONTROL HEADERS</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Bilty Number:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(biltyNo)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Booking Date:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(dateStr)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Bill To:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(billTo)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Amount Type / Mode:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(amountType)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Dispatch Mode:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(dispatchMode)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Loading From -> To:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(origin)} to ${xmlEscape(destination)}</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

      <Row ss:Height="20">
        <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">2. CONSIGNMENT PARTIES</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Sender (Consignor):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(senderName)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Receiver (Consignee):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(receiverName)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Sender Phone:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(senderPhone)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Receiver Phone:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(receiverPhone)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Sender Address:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(senderAddress)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Delivery Address:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(deliveryAddress)}</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

      <Row ss:Height="20">
        <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">3. COMMERCIAL IDENTIFIERS</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">PO / Order #:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(poNumber)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">B/L No #:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(blNumber)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">LC #:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(lcNumber)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Container # / GD #:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(containerNumber)} / ${xmlEscape(gdNumber)}</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>

      <Row ss:Height="20">
        <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">4. ITEM DETAILS &amp; FREIGHT</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Item Description</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Quantity</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Weight / Volume</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Freight Amount (PKR)</Data></Cell>
      </Row>
      ${items.map((it) => `
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(it.detail || "Cargo")}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(it.quantity || 1)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(it.weight || 0)} KG / ${xmlEscape(it.volume || 0)} CBM</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${parseFloat(it.amount) || 0}</Data></Cell>
      </Row>`).join("")}
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Initial Base Freight:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${initialFreight}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Labour Charges:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${labour}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Lifter / Crane / Shifting:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${lifter}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Pickup &amp; Delivery Local:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${pickup + delivery}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Godown / Storage / Other:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${godown + otherCharges}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="BoldTotal"><Data ss:Type="String">Total Freight Amount (PKR):</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${subTotal}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>

  <!-- ================= SHEET 2: CONSIGNMENT NOTE ================= -->
  <Worksheet ss:Name="Consignment Note">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Column ss:Width="150"/>
      <Row ss:Height="28">
        <Cell ss:MergeAcross="3" ss:StyleID="TitleHeader"><Data ss:Type="String">SUPER PAK DATA WALE GOODS TRANSPORT CO.®</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">CONSIGNMENT NOTE / BILTY (OFFICE / CUSTOMER COPY)</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">Karachi: 0300-2024433, 021-32351333 | Lahore: 0346-2024433 | Web: superpakdata.com</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Bilty No:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(biltyNo)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Date:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(dateStr)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">From (Loading):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(origin)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">To (Destination):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(destination)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Consignor (Sender):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(senderName)} (${xmlEscape(senderPhone)})</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Consignee (Receiver):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(receiverName)} (${xmlEscape(receiverPhone)})</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Vehicle Number:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(vehicleNumber)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Delivery Type:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(dispatchMode)} (${xmlEscape(amountType)})</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Item Description</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Packages</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Weight (KG)</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Total Value (PKR)</Data></Cell>
      </Row>
      ${items.map((it) => `
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(it.detail || "General Cargo")}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(it.quantity || 1)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(it.weight || 0)}</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${parseFloat(it.amount) || 0}</Data></Cell>
      </Row>`).join("")}
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Sub Total Freight:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${subTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Income Tax (6%):</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${incomeTax}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Sales Tax (15%):</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${salesTax}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="BoldTotal"><Data ss:Type="String">Grand Total Amount:</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${grandTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Amount in Words: ${xmlEscape(wordsAmount)}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>

  <!-- ================= SHEET 3: FREIGHT BILL ================= -->
  <Worksheet ss:Name="Freight Bill">
    <Table ss:DefaultColumnWidth="120">
      <Column ss:Width="160"/>
      <Column ss:Width="160"/>
      <Column ss:Width="160"/>
      <Column ss:Width="160"/>
      <Row ss:Height="28">
        <Cell ss:MergeAcross="3" ss:StyleID="TitleHeader"><Data ss:Type="String">SUPER PAK DATA WALE GOODS TRANSPORT CO.® - FREIGHT INVOICE</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">Commercial Billing Division | NTN: 1692873-3</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Invoice No:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">INV-${xmlEscape(biltyNo)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Invoice Date:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(dateStr)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Bilty Ref No:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(biltyNo)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Vehicle / Truck No:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(vehicleNumber)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Billed To Party:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(billTo === "Receiver" ? receiverName : senderName)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Party Phone / Address:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(billTo === "Receiver" ? receiverAddress : senderAddress)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Route (From -> To):</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(origin)} to ${xmlEscape(destination)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Container / B/L #:</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(containerNumber)} / ${xmlEscape(blNumber)}</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Particulars</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Quantity</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Rate Details</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Amount (PKR)</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Freight Carriage: ${xmlEscape(bilty.packageDetails || "Merchandise Goods")}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(bilty.quantity || 1)} Packages</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(origin)} to ${xmlEscape(destination)}</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${initialFreight}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Local Surcharges (Pickup / Delivery / Local):</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${pickup + delivery}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Handling, Labour &amp; Shifting Surcharges:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${labour + lifter}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Subtotal Freight &amp; Surcharges:</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${subTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Withholding Tax (6%):</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${incomeTax}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="TableCell"><Data ss:Type="String">Provincial Services Sales Tax (15%):</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${salesTax}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="BoldTotal"><Data ss:Type="String">Net Invoice Amount (PKR):</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${grandTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Amount in Words: ${xmlEscape(wordsAmount)}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>

  <!-- ================= SHEET 4: SALES TAX INVOICE ================= -->
  <Worksheet ss:Name="Sales Tax Invoice">
    <Table ss:DefaultColumnWidth="110">
      <Column ss:Width="50"/>
      <Column ss:Width="200"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="130"/>
      <Column ss:Width="90"/>
      <Column ss:Width="120"/>
      <Column ss:Width="130"/>
      <Row ss:Height="28">
        <Cell ss:MergeAcross="7" ss:StyleID="TitleHeader"><Data ss:Type="String">SALES TAX INVOICE (Sales Tax Rate: 15%)</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="7" ss:StyleID="SubHeader"><Data ss:Type="String">Under Provincial Sales Tax on Services Acts (PRA / SRB)</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">SUPPLIER (SERVICE PROVIDER)</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="SectionHeader"><Data ss:Type="String">BUYER (SERVICE RECIPIENT)</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Name: Super Pak Data Wale Goods Transport Co.®</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Name: ${xmlEscape(billTo === "Receiver" ? receiverName : senderName)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Address: Plot 9, Hawksbay Road Truck Stand, Karachi</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Address: ${xmlEscape(billTo === "Receiver" ? receiverAddress : senderAddress)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">NTN: 1692873-3 | STRN: 17-00-1692-873-3</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Tel: ${xmlEscape(billTo === "Receiver" ? receiverPhone : senderPhone)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Invoice No: STI-${xmlEscape(biltyNo)} | Date: ${xmlEscape(dateStr)}</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="TableCell"><Data ss:Type="String">Bilty Ref #: ${xmlEscape(biltyNo)}</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">S.No</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Description of Service</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Qty</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Unit Price</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Taxable Value (PKR)</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Tax Rate</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Sales Tax (PKR)</Data></Cell>
        <Cell ss:StyleID="TableHead"><Data ss:Type="String">Total Value (PKR)</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">1</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">Freight Carriage Service (${xmlEscape(origin)} to ${xmlEscape(destination)}) as per Bilty #${xmlEscape(biltyNo)}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">${xmlEscape(bilty.quantity || 1)}</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${subTotal}</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${subTotal}</Data></Cell>
        <Cell ss:StyleID="TableCell"><Data ss:Type="String">15%</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${salesTax}</Data></Cell>
        <Cell ss:StyleID="TableCellNum"><Data ss:Type="Number">${grandTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="3" ss:StyleID="BoldTotal"><Data ss:Type="String">TOTALS:</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${subTotal}</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="String">-</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${salesTax}</Data></Cell>
        <Cell ss:StyleID="BoldTotal"><Data ss:Type="Number">${grandTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="7" ss:StyleID="TableCell"><Data ss:Type="String">Total Amount in Words: ${xmlEscape(wordsAmount)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="7" ss:StyleID="SubHeader"><Data ss:Type="String">Declaration: Certified that the particulars given above are true and correct under Sales Tax law.</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const exportFilename = `SPD_4Sheet_Bilty_${(biltyNo || "Record").replace(/[^a-zA-Z0-9_-]/g, "_")}.xls`;

  // Native WebKit / Safari file share support when available on mobile devices
  if (
    typeof navigator !== "undefined" &&
    typeof File !== "undefined" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const shareFile = new File([blob], exportFilename, { type: "application/vnd.ms-excel;charset=utf-8" });
      if (navigator.canShare({ files: [shareFile] })) {
        navigator.share({
          files: [shareFile],
          title: exportFilename,
        }).catch(() => {});
      }
    } catch {}
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", exportFilename);
  link.setAttribute("target", "_self");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Defer cleanup for iOS Safari / WebKit asynchronous download processing
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Safe cleanup fallback
    }
  }, 1500);

  return true;
}

