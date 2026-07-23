/** Vantura Rentals — collection paperwork types + PDF. */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { hirePolicy } from "./company";

export type YesNo = "yes" | "no";
export type FuelLevel = "Empty" | "1/4" | "1/2" | "3/4" | "Full";
export type PaymentMethod = "cash" | "card" | "bank_transfer";
export type MileageChoice = "included_200" | "unlimited";

export interface PaperworkDriver {
  fullName: string;
  dateOfBirth: string;
  age: string;
  homeAddress: string;
  postcode: string;
  mobile: string;
  licenceNumber: string;
  licenceExpiry: string;
  licenceValidated: YesNo;
  proofOfAddressChecked: YesNo;
}

export interface PaperworkPayload {
  bookingId: string;
  bookingReference: string;
  primary: PaperworkDriver;
  hasSecondDriver: YesNo;
  secondDriver: PaperworkDriver | null;
  identity: {
    physicalLicenceChecked: boolean;
    dvlaCheckVerified: boolean;
    secondPhotoIdChecked: boolean;
    proofOfAddressChecked: boolean;
    photoMatchesId: boolean;
  };
  van: {
    makeModel: string;
    registration: string;
    mileage: string;
    fuelLevel: FuelLevel;
  };
  extras: {
    mileageChoice: MileageChoice;
    phoneCharger: boolean;
    additionalDriver: boolean;
    pumpTruck: boolean;
  };
  rental: {
    collectionDate: string;
    collectionTime: string;
    returnDate: string;
    returnTime: string;
    durationLabel: string;
    dailyRate: string;
    depositTaken: string;
    totalRentalCost: string;
    paymentMethod: PaymentMethod;
  };
  condition: {
    photosTaken: YesNo;
    walkAroundCompleted: YesNo;
    existingDamage: string;
  };
  declarations: {
    infoAccurate: boolean;
    validLicence: boolean;
    authorisedDriversOnly: boolean;
    acceptPenalties: boolean;
    returnOnTime: boolean;
    acceptTerms: boolean;
  };
  customerSignatureDataUrl: string;
  companySignatureDataUrl: string;
  staffName: string;
  signedAtIso: string;
}

export function ageFromDob(dob: string, on = new Date()): string {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  let age = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) age -= 1;
  return age > 0 ? String(age) : "";
}

export function emptyDriver(): PaperworkDriver {
  return {
    fullName: "",
    dateOfBirth: "",
    age: "",
    homeAddress: "",
    postcode: "",
    mobile: "",
    licenceNumber: "",
    licenceExpiry: "",
    licenceValidated: "no",
    proofOfAddressChecked: "no",
  };
}

function yn(v: boolean | YesNo | undefined): string {
  if (v === true || v === "yes") return "Yes";
  if (v === false || v === "no") return "No";
  return "—";
}

function paymentLabel(m: PaymentMethod): string {
  if (m === "cash") return "Cash";
  if (m === "card") return "Card";
  return "Bank transfer";
}

function mileageLabel(id: MileageChoice): string {
  if (id === "unlimited") return "Unlimited miles";
  return `${hirePolicy.includedMilesPerDay} miles/day then excess per mile`;
}

async function dataUrlToPngBytes(dataUrl: string): Promise<Uint8Array | null> {
  const m = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  return Uint8Array.from(Buffer.from(m[2], "base64"));
}

/** Build a multi-page PDF of the completed collection paperwork. */
export async function buildPaperworkPdf(
  data: PaperworkPayload,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (need: number) => {
    if (y - need < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const draw = (
    text: string,
    opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> },
  ) => {
    const size = opts?.size ?? 10;
    ensureSpace(size + 6);
    page.drawText(text.slice(0, 110), {
      x: margin,
      y: y - size,
      size,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? rgb(0.1, 0.1, 0.1),
    });
    y -= size + 5;
  };

  const section = (title: string) => {
    ensureSpace(28);
    y -= 8;
    draw(title, { bold: true, size: 12, color: rgb(0.1, 0.22, 0.2) });
    y -= 2;
  };

  const row = (label: string, value: string) => {
    draw(`${label}: ${value || "—"}`, { size: 9 });
  };

  draw("VANTURA RENTALS — COLLECTION PAPERWORK", {
    bold: true,
    size: 14,
    color: rgb(0.1, 0.22, 0.2),
  });
  row("Booking reference", data.bookingReference);
  row("Signed", new Date(data.signedAtIso).toLocaleString("en-GB"));
  row("Staff", data.staffName);

  section("PRIMARY DRIVER");
  const p = data.primary;
  row("Full name", p.fullName);
  row("Date of birth", p.dateOfBirth);
  row("Age", p.age);
  row("Home address", p.homeAddress);
  row("Postcode", p.postcode);
  row("Mobile", p.mobile);
  row("Driving licence number", p.licenceNumber);
  row("Licence expiry", p.licenceExpiry);
  row("Licence validated", yn(p.licenceValidated));
  row("Proof of address checked", yn(p.proofOfAddressChecked));

  section("SECOND DRIVER");
  if (data.hasSecondDriver === "yes" && data.secondDriver) {
    const s = data.secondDriver;
    row("Full name", s.fullName);
    row("Date of birth", s.dateOfBirth);
    row("Age", s.age);
    row("Home address", s.homeAddress);
    row("Postcode", s.postcode);
    row("Mobile", s.mobile);
    row("Driving licence number", s.licenceNumber);
    row("Licence expiry", s.licenceExpiry);
    row("Licence validated", yn(s.licenceValidated));
    row("Proof of address checked", yn(s.proofOfAddressChecked));
  } else {
    draw("No second driver", { size: 9 });
  }

  section("IDENTITY VERIFICATION");
  row("Physical driving licence checked", yn(data.identity.physicalLicenceChecked));
  row("DVLA check code verified", yn(data.identity.dvlaCheckVerified));
  row("Second photo ID checked", yn(data.identity.secondPhotoIdChecked));
  row("Proof of address checked", yn(data.identity.proofOfAddressChecked));
  row("Customer photo matches ID", yn(data.identity.photoMatchesId));

  section("VAN DETAILS");
  row("Make and model", data.van.makeModel);
  row("Registration", data.van.registration);
  row("Current mileage", data.van.mileage);
  row("Fuel at collection", data.van.fuelLevel);

  section("EXTRAS");
  row("Mileage package", mileageLabel(data.extras.mileageChoice));
  row("Phone charger (£10)", yn(data.extras.phoneCharger));
  row("Additional driver (£12/day)", yn(data.extras.additionalDriver));
  row("Pump truck (£20)", yn(data.extras.pumpTruck));

  section("RENTAL DETAILS");
  row("Collection", `${data.rental.collectionDate} ${data.rental.collectionTime}`);
  row("Return", `${data.rental.returnDate} ${data.rental.returnTime}`);
  row("Duration", data.rental.durationLabel);
  row("Daily rate", data.rental.dailyRate);
  row("Deposit taken", data.rental.depositTaken);
  row("Total rental cost", data.rental.totalRentalCost);
  row("Payment method", paymentLabel(data.rental.paymentMethod));

  section("VEHICLE CONDITION");
  row("Photos taken", yn(data.condition.photosTaken));
  row("Walk-around completed", yn(data.condition.walkAroundCompleted));
  const damage = (data.condition.existingDamage || "None noted").replace(
    /\s+/g,
    " ",
  );
  for (let i = 0; i < damage.length; i += 95) {
    draw(i === 0 ? `Existing damage: ${damage.slice(i, i + 95)}` : damage.slice(i, i + 95), {
      size: 9,
    });
  }

  section("CUSTOMER DECLARATION");
  row("Information true and accurate", yn(data.declarations.infoAccurate));
  row("Holds valid licence", yn(data.declarations.validLicence));
  row("Only authorised drivers", yn(data.declarations.authorisedDriversOnly));
  row("Accepts penalties responsibility", yn(data.declarations.acceptPenalties));
  row("Agreed return date/time", yn(data.declarations.returnOnTime));
  row("Accepts terms and conditions", yn(data.declarations.acceptTerms));

  section("SIGNATURES");
  const custBytes = await dataUrlToPngBytes(data.customerSignatureDataUrl);
  const coBytes = await dataUrlToPngBytes(data.companySignatureDataUrl);
  ensureSpace(160);
  if (custBytes) {
    try {
      const img = await doc.embedPng(custBytes);
      const w = 200;
      const h = (img.height / img.width) * w;
      page.drawText("Customer signature", {
        x: margin,
        y: y - 10,
        size: 9,
        font: fontBold,
      });
      y -= 14;
      page.drawImage(img, { x: margin, y: y - h, width: w, height: h });
      y -= h + 12;
    } catch {
      draw("Customer signature: (could not embed image)", { size: 9 });
    }
  }
  ensureSpace(140);
  if (coBytes) {
    try {
      const img = await doc.embedPng(coBytes);
      const w = 200;
      const h = (img.height / img.width) * w;
      page.drawText(`Company signature (${data.staffName || "staff"})`, {
        x: margin,
        y: y - 10,
        size: 9,
        font: fontBold,
      });
      y -= 14;
      page.drawImage(img, { x: margin, y: y - h, width: w, height: h });
      y -= h + 12;
    } catch {
      draw("Company signature: (could not embed image)", { size: 9 });
    }
  }

  row("Date", new Date(data.signedAtIso).toLocaleDateString("en-GB"));
  row("Time", new Date(data.signedAtIso).toLocaleTimeString("en-GB"));

  return doc.save();
}

/** Map UI fuel labels to Airtable Hire Agreement select values. */
export function fuelForAirtable(level: FuelLevel): string {
  if (level === "1/4") return "1/4";
  if (level === "1/2") return "1/2";
  if (level === "3/4") return "3/4";
  return level;
}
