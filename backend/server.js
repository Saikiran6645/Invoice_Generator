const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public")); // Serve static files like stylesheets or images

// Route to render the form
app.get("/", (req, res) => {
  res.render("form");
});

// Route to handle form submission and generate invoice
app.post("/generate-invoice", (req, res) => {
  const data = req.body;

  // Extract and structure data into an object
  const invoiceData = {
    seller: {
      name: data.sellerName,
      address: data.sellerAddress,
      city: data.sellerCity,
      state: data.sellerState,
      pincode: data.sellerPincode,
      pan: data.sellerPan,
      gst: data.sellerGst,
    },
    billing: {
      name: data.billingName,
      address: data.billingAddress,
      city: data.billingCity,
      state: data.billingState,
      pincode: data.billingPincode,
      stateCode: data.billingStateCode,
    },
    shipping: {
      name: data.shippingName,
      address: data.shippingAddress,
      city: data.shippingCity,
      state: data.shippingState,
      pincode: data.shippingPincode,
      stateCode: data.shippingStateCode,
    },
    order: {
      number: data.orderNo,
      date: data.orderDate,
    },
    invoice: {
      number: data.invoiceNo,
      details: data.invoiceDetails,
      date: data.invoiceDate,
    },
    supply: {
      placeOfSupply: data.placeOfSupply,
      placeOfDelivery: data.placeOfDelivery,
    },
    reverseCharge: data.reverseCharge,
    shippingCharges: parseFloat(data.shippingCharges) || 0,
    items: [],
    totals: {
      netAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      amountInWords: "",
    },
  };

  // Calculate item details and totals
  let totalNetAmount = 0;
  let totalTaxAmount = 0;
  let totalAmount = 0;

  // Calculate each item's values
  for (let i = 0; i < data.itemDescription.length; i++) {
    const netAmount =
      parseFloat(data.itemUnitPrice[i]) * parseInt(data.itemQuantity[i]) -
      parseFloat(data.itemDiscount[i]);
    const taxRate =
      invoiceData.supply.placeOfSupply === invoiceData.supply.placeOfDelivery
        ? 18
        : 18; // Adjust based on tax rules
    const taxAmount = (netAmount * taxRate) / 100;
    const total = netAmount + taxAmount;

    totalNetAmount += netAmount;
    totalTaxAmount += taxAmount;
    totalAmount += total;

    invoiceData.items.push({
      description: data.itemDescription[i],
      unitPrice: parseFloat(data.itemUnitPrice[i]),
      quantity: parseInt(data.itemQuantity[i]),
      discount: parseFloat(data.itemDiscount[i]),
      netAmount,
      taxRate,
      taxAmount,
      total,
    });
  }

  // Add Shipping Charges
  totalAmount += invoiceData.shippingCharges;

  // Update totals
  invoiceData.totals.netAmount = totalNetAmount;
  invoiceData.totals.taxAmount = totalTaxAmount;
  invoiceData.totals.totalAmount = totalAmount;
  invoiceData.totals.amountInWords = inWords(totalAmount); // Convert total amount to words

  // Render the invoice template with the structured data object
  res.render("invoice", { invoiceData });
});

// Function to convert number to words (simplified version)
var a = [
  "",
  "One ",
  "Two ",
  "Three ",
  "Four ",
  "Five ",
  "six ",
  "Seven ",
  "Eight ",
  "Nine ",
  "Ten ",
  "Eleven ",
  "Twelve ",
  "Thirteen ",
  "Fourteen ",
  "Fifteen ",
  "Sixteen ",
  "Seventeen ",
  "Eighteen ",
  "Nineteen ",
];
var b = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function inWords(num) {
  if ((num = num.toString()).length > 9) return "overflow";
  n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
        "only "
      : "";
  return str + "(including shipping charges)";
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
