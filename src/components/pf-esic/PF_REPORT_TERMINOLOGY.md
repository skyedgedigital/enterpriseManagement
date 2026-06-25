# PF Report Terminology (EPF / EPS / EDLI)

This document explains the columns commonly used in PF (Provident Fund) challan/report PDFs and how they map to our data and calculations.

---

## Column meanings


| Column            | Meaning                                                                                                                                                                                         | How we derive it                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UAN**           | Universal Account Number – unique 12-digit PF account for the employee                                                                                                                          | `Employee.uan`                                                                                                                                                |
| **Employee Name** | Full name of the employee                                                                                                                                                                       | `Employee.name` (or `Employee.code`)                                                                                                                          |
| **EPF Wages**     | Wages on which **Employees’ Provident Fund** contribution is calculated. Often shown twice in some formats (e.g. current month and arrears); when both are same, we use the same value in both. | Monthly (Basic + DA) used for PF, i.e. the “pfBase” from our payment logic: either full amount or capped at ₹15,000 depending on `WorkOrder.newPfApplicable`. |
| **EPS Wages**     | Wages on which **Employees’ Pension Scheme** contribution is calculated. Legally capped at ₹15,000.                                                                                             | `min(EPF Wages, 15000)`                                                                                                                                       |
| **EDLI Wages**    | Wages on which **Employee Deposit Linked Insurance** contribution is calculated. Capped at ₹15,000.                                                                                             | `min(EPF Wages, 15000)` (same as EPS cap)                                                                                                                     |
| **PF**            | In the format you shared, this is the **employee’s total PF contribution** (12% of EPF Wages).                                                                                                  | `breakdown.pf` from `computePayment` = 12% of pfBase.                                                                                                         |
| **EPF Amount**    | In the format you shared, this is the **employer’s share to the Pension Scheme (EPS)** = 8.33% of EPS Wages.                                                                                    | `EPS_Wages * 0.0833`                                                                                                                                          |
| **PPF Amount**    | Here it means the **employer’s share to the Provident Fund (EPF)** = 3.67% of EPF Wages (not the public “PPF” scheme). Sometimes labelled as “Pension” or “Employer EPF”.                       | `EPF_Wages * 0.0367`                                                                                                                                          |
| **NCP Days**      | **Non-Contributory Period** days – days for which no PF is paid (e.g. unpaid leave, absence).                                                                                                   | `totalWorkingDays - attendance` (days in the month that were not worked/paid).                                                                                |


---

## Why “EPF” appears twice

Many PF reports show **two “EPF Wages”** columns. Typically:

- One is for **current month** wages.
- The other can be for **arrears / other period** or the same value repeated for portal layout.

In our case we use the same **EPF Wages** value for both when there are no arrears, so both columns will show the same number.

---

## NPS vs NCP

- **NPS** = National Pension System. It is a **different** scheme (government pension). Our report uses **EPF/EPS** (employer PF scheme), not NPS. So there is **no NPS column** in this PF report.
- **NCP** = Non-Contributory Period **days**. This is the “days” column in the report: number of days with no PF contribution (we map this to **NCP Days**).

---

## Summary of our data used

- **Employee**: `uan`, `name`, `department`, `pfApplicable`, `designation`, `basic`, `da`.
- **Wages** (per employee, per month): `basic`, `da`, `total`, `attendance`, `totalWorkingDays`, `netAmountPaid`.
- **WorkOrder** (optional): `newPfApplicable` – if true, PF is calculated on wages capped at ₹15,000.
- **Payment logic**: `computePayment()` in `paymentCalculation.ts` gives us the PF base and employee PF (12%). We then derive EPS/EDLI wages (capped at 15,000) and employer EPS (8.33%) and employer EPF (3.67%) for the PDF table.

Once this mapping is clear, the “Generate PF” action can build the same table (year, month, department) and output the PDF as in your screenshot.