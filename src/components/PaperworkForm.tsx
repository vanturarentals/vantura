"use client";

import { useMemo, useState, type FormEvent } from "react";
import SignaturePad from "@/components/SignaturePad";
import { hirePolicy } from "@/lib/company";
import {
  ageFromDob,
  emptyDriver,
  type FuelLevel,
  type MileageChoice,
  type PaperworkDriver,
  type PaperworkPayload,
  type PaymentMethod,
  type YesNo,
} from "@/lib/paperwork";

export interface PaperworkPrefill {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: string;
  vanName: string;
  collectionDate: string;
  collectionTime: string;
  returnDate: string;
  returnTime: string;
  durationLabel: string;
  depositLabel: string;
  totalLabel: string;
  dailyRateLabel: string;
  mileageOption: string;
}

interface Props {
  prefill: PaperworkPrefill;
}

const FUEL: FuelLevel[] = ["Empty", "1/4", "1/2", "3/4", "Full"];

function DriverFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PaperworkDriver;
  onChange: (next: PaperworkDriver) => void;
}) {
  function set<K extends keyof PaperworkDriver>(key: K, v: PaperworkDriver[K]) {
    const next = { ...value, [key]: v };
    if (key === "dateOfBirth" && typeof v === "string") {
      next.age = ageFromDob(v);
    }
    onChange(next);
  }

  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-bold text-brand">{title}</legend>
      <label className="block space-y-1.5">
        <span className="field-label">Full name</span>
        <input
          className="field"
          required
          value={value.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="field-label">Date of birth</span>
          <input
            type="date"
            className="field"
            required
            value={value.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="field-label">Age</span>
          <input className="field bg-surface" readOnly value={value.age} />
        </label>
        <label className="block space-y-1.5">
          <span className="field-label">Mobile number</span>
          <input
            className="field"
            required
            value={value.mobile}
            onChange={(e) => set("mobile", e.target.value)}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="field-label">Home address</span>
        <input
          className="field"
          required
          value={value.homeAddress}
          onChange={(e) => set("homeAddress", e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="field-label">Postcode</span>
        <input
          className="field"
          required
          value={value.postcode}
          onChange={(e) => set("postcode", e.target.value)}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="field-label">Driving licence number</span>
          <input
            className="field"
            required
            value={value.licenceNumber}
            onChange={(e) => set("licenceNumber", e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="field-label">Licence expiry date</span>
          <input
            type="date"
            className="field"
            required
            value={value.licenceExpiry}
            onChange={(e) => set("licenceExpiry", e.target.value)}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="field-label">Licence validated</span>
          <select
            className="field"
            value={value.licenceValidated}
            onChange={(e) => set("licenceValidated", e.target.value as YesNo)}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="field-label">Proof of address checked</span>
          <select
            className="field"
            value={value.proofOfAddressChecked}
            onChange={(e) =>
              set("proofOfAddressChecked", e.target.value as YesNo)
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
    </fieldset>
  );
}

export default function PaperworkForm({ prefill }: Props) {
  const [primary, setPrimary] = useState<PaperworkDriver>(() => ({
    ...emptyDriver(),
    fullName: prefill.customerName,
    dateOfBirth: prefill.dateOfBirth,
    age: prefill.age || ageFromDob(prefill.dateOfBirth),
    mobile: prefill.phone,
  }));
  const [hasSecondDriver, setHasSecondDriver] = useState<YesNo>("no");
  const [secondDriver, setSecondDriver] = useState<PaperworkDriver>(emptyDriver);
  const [identity, setIdentity] = useState({
    physicalLicenceChecked: false,
    dvlaCheckVerified: false,
    secondPhotoIdChecked: false,
    proofOfAddressChecked: false,
    photoMatchesId: false,
  });
  const [vanMakeModel, setVanMakeModel] = useState(prefill.vanName);
  const [registration, setRegistration] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>("Full");
  const [mileageChoice, setMileageChoice] = useState<MileageChoice>(
    prefill.mileageOption === "unlimited" ? "unlimited" : "included_200",
  );
  const [phoneCharger, setPhoneCharger] = useState(false);
  const [additionalDriver, setAdditionalDriver] = useState(false);
  const [pumpTruck, setPumpTruck] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [photosTaken, setPhotosTaken] = useState<YesNo>("no");
  const [walkAround, setWalkAround] = useState<YesNo>("no");
  const [damage, setDamage] = useState("");
  const [declarations, setDeclarations] = useState({
    infoAccurate: false,
    validLicence: false,
    authorisedDriversOnly: false,
    acceptPenalties: false,
    returnOnTime: false,
    acceptTerms: false,
  });
  const [customerSig, setCustomerSig] = useState("");
  const [companySig, setCompanySig] = useState("");
  const [staffName, setStaffName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    emails: { customer: boolean; office: boolean };
    emailConfigured: boolean;
  } | null>(null);

  const excessLabel = useMemo(
    () => `${(hirePolicy.excessMileagePencePerMile / 100).toFixed(2)} per mile`,
    [],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerSig || !companySig) {
      setError("Both signatures are required.");
      return;
    }
    setBusy(true);
    try {
      const payload: PaperworkPayload = {
        bookingId: prefill.id,
        bookingReference: prefill.reference,
        primary,
        hasSecondDriver,
        secondDriver: hasSecondDriver === "yes" ? secondDriver : null,
        identity,
        van: {
          makeModel: vanMakeModel,
          registration,
          mileage,
          fuelLevel,
        },
        extras: {
          mileageChoice,
          phoneCharger,
          additionalDriver,
          pumpTruck,
        },
        rental: {
          collectionDate: prefill.collectionDate,
          collectionTime: prefill.collectionTime,
          returnDate: prefill.returnDate,
          returnTime: prefill.returnTime,
          durationLabel: prefill.durationLabel,
          dailyRate: prefill.dailyRateLabel,
          depositTaken: prefill.depositLabel,
          totalRentalCost: prefill.totalLabel,
          paymentMethod,
        },
        condition: {
          photosTaken,
          walkAroundCompleted: walkAround,
          existingDamage: damage,
        },
        declarations,
        customerSignatureDataUrl: customerSig,
        companySignatureDataUrl: companySig,
        staffName,
        signedAtIso: new Date().toISOString(),
      };

      const res = await fetch("/api/ops/paperwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        emails?: { customer: boolean; office: boolean };
        emailConfigured?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not save paperwork.");
        return;
      }
      setDone({
        emails: data.emails ?? { customer: false, office: false },
        emailConfigured: Boolean(data.emailConfigured),
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="panel-aside space-y-3 p-6 shadow-md">
        <h2 className="text-xl font-bold text-brand">Paperwork complete</h2>
        <p className="text-sm text-muted">
          Saved to the hire agreement for{" "}
          <span className="font-mono font-semibold text-foreground">
            {prefill.reference}
          </span>
          .
        </p>
        {done.emailConfigured ? (
          <ul className="text-sm text-muted">
            <li>
              Customer email:{" "}
              {done.emails.customer ? "sent" : "failed — check Resend logs"}
            </li>
            <li>
              Office email:{" "}
              {done.emails.office ? "sent" : "failed — check Resend logs"}
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Email is not configured on this environment, so no PDF was emailed.
            The record is still saved in Airtable.
          </p>
        )}
        <a href="/ops/handover" className="btn-primary inline-flex">
          Next booking
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="panel-aside p-5 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Booking
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-brand">
          {prefill.reference}
        </p>
        <p className="mt-1 text-sm text-muted">
          {prefill.customerName} · {prefill.email}
        </p>
      </div>

      <DriverFields
        title="Primary driver details"
        value={primary}
        onChange={setPrimary}
      />

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">
          Is there a second driver?
        </legend>
        <select
          className="field max-w-xs"
          value={hasSecondDriver}
          onChange={(e) => {
            const v = e.target.value as YesNo;
            setHasSecondDriver(v);
            if (v === "yes") setAdditionalDriver(true);
          }}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </fieldset>

      {hasSecondDriver === "yes" && (
        <DriverFields
          title="Second driver details"
          value={secondDriver}
          onChange={setSecondDriver}
        />
      )}

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">
          Identity verification
        </legend>
        {(
          [
            ["physicalLicenceChecked", "Physical driving licence checked"],
            ["dvlaCheckVerified", "DVLA check code verified"],
            ["secondPhotoIdChecked", "Second photo ID checked (if requested)"],
            ["proofOfAddressChecked", "Proof of address checked"],
            ["photoMatchesId", "Customer photo matches ID"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={identity[key]}
              onChange={(e) =>
                setIdentity((s) => ({ ...s, [key]: e.target.checked }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">Van details</legend>
        <label className="block space-y-1.5">
          <span className="field-label">Van make and model</span>
          <input
            className="field"
            required
            value={vanMakeModel}
            onChange={(e) => setVanMakeModel(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="field-label">Registration number</span>
            <input
              className="field"
              required
              value={registration}
              onChange={(e) => setRegistration(e.target.value.toUpperCase())}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="field-label">Current mileage</span>
            <input
              className="field"
              required
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="field-label">Fuel at collection</span>
            <select
              className="field"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value as FuelLevel)}
            >
              {FUEL.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">Any extras?</legend>
        <label className="block space-y-1.5">
          <span className="field-label">Mileage</span>
          <select
            className="field"
            value={mileageChoice}
            onChange={(e) => setMileageChoice(e.target.value as MileageChoice)}
          >
            <option value="included_200">
              {hirePolicy.includedMilesPerDay} miles/day then £{excessLabel}
            </option>
            <option value="unlimited">Unlimited miles</option>
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={phoneCharger}
            onChange={(e) => setPhoneCharger(e.target.checked)}
          />
          Phone charger — £10 flat
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={additionalDriver}
            onChange={(e) => setAdditionalDriver(e.target.checked)}
          />
          Additional driver — £12 daily
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={pumpTruck}
            onChange={(e) => setPumpTruck(e.target.checked)}
          />
          Pump truck for pallets — £20 flat
        </label>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">
          Rental details
        </legend>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="field-label">Collection date</p>
            <p className="font-medium">{prefill.collectionDate || "—"}</p>
          </div>
          <div>
            <p className="field-label">Collection time</p>
            <p className="font-medium">{prefill.collectionTime || "—"}</p>
          </div>
          <div>
            <p className="field-label">Return date</p>
            <p className="font-medium">{prefill.returnDate || "—"}</p>
          </div>
          <div>
            <p className="field-label">Duration</p>
            <p className="font-medium">{prefill.durationLabel}</p>
          </div>
          <div>
            <p className="field-label">Daily rate</p>
            <p className="font-medium">{prefill.dailyRateLabel}</p>
          </div>
          <div>
            <p className="field-label">Deposit taken</p>
            <p className="font-medium">{prefill.depositLabel}</p>
          </div>
          <div>
            <p className="field-label">Total rental cost</p>
            <p className="font-medium">{prefill.totalLabel}</p>
          </div>
          <label className="block space-y-1.5">
            <span className="field-label">Payment method</span>
            <select
              className="field"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">
          Vehicle condition before collection
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="field-label">Photos taken</span>
            <select
              className="field"
              value={photosTaken}
              onChange={(e) => setPhotosTaken(e.target.value as YesNo)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="field-label">Walk-around with customer</span>
            <select
              className="field"
              value={walkAround}
              onChange={(e) => setWalkAround(e.target.value as YesNo)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="field-label">Existing damage (notes)</span>
          <textarea
            className="field min-h-[6rem] resize-y py-3"
            value={damage}
            onChange={(e) => setDamage(e.target.value)}
            placeholder="Describe any existing marks, dents, or scratches…"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-bold text-brand">
          Customer declaration
        </legend>
        <p className="text-sm text-muted">I confirm that:</p>
        {(
          [
            ["infoAccurate", "All information I have provided is true and accurate."],
            [
              "validLicence",
              "I hold a valid driving licence for the vehicle hired.",
            ],
            [
              "authorisedDriversOnly",
              "Only authorised driver(s) listed on this agreement will drive the vehicle.",
            ],
            [
              "acceptPenalties",
              "I accept responsibility for any speeding offences, parking charges, congestion charges, toll charges or other penalties incurred during my rental.",
            ],
            [
              "returnOnTime",
              "I agree to return the vehicle on the agreed date and time.",
            ],
            [
              "acceptTerms",
              "I agree to comply with the Terms and Conditions of Vantura Rentals.",
            ],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              required
              checked={declarations[key]}
              onChange={(e) =>
                setDeclarations((s) => ({ ...s, [key]: e.target.checked }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-4 rounded-xl border border-brand p-4">
        <SignaturePad
          label="Customer signature"
          value={customerSig}
          onChange={setCustomerSig}
        />
        <label className="block space-y-1.5">
          <span className="field-label">Staff name (company)</span>
          <input
            className="field"
            required
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
          />
        </label>
        <SignaturePad
          label="Company signature"
          value={companySig}
          onChange={setCompanySig}
        />
        <p className="text-xs text-muted">
          Date and time are recorded automatically when you submit.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? "Saving & emailing…" : "Complete paperwork & email copies"}
      </button>
    </form>
  );
}
