import { describe, expect, it } from "vitest";
import { contactInput, emptyContactForm, isNigerianPhone, OTHER_WORKER, validateContactForm } from "./contact-form";
import { displayPhone } from "./labels";
import { isEvangelismUnit, isGrowthOutreachDepartment } from "@/lib/growth-outreach";

const filled = emptyContactForm({
  name: " Chinedu Okeke ",
  phone: "0803 123 4567",
  address: "12 Adeola St",
  savedStatus: "YES",
  isStudent: "no",
  workerId: "m2",
});

describe("the evangelism contact form", () => {
  it("accepts Nigerian mobile numbers however they are typed", () => {
    for (const n of ["0803 123 4567", "+234 803 123 4567", "2348031234567", "09012345678", "0706-123-4567"]) {
      expect(isNigerianPhone(n)).toBe(true);
    }
    for (const n of ["12345", "0603 123 4567", "+44 7700 900123"]) expect(isNigerianPhone(n)).toBe(false);
  });

  it("asks for everything required, and the school for a student", () => {
    const errors = validateContactForm(emptyContactForm());
    expect(Object.keys(errors).sort()).toEqual(["address", "isStudent", "name", "phone", "savedStatus", "workerId"]);
    expect(validateContactForm({ ...filled, isStudent: "yes" }).school).toBeDefined();
    expect(validateContactForm({ ...filled, workerId: OTHER_WORKER }).workerOther).toBeDefined();
    expect(validateContactForm(filled)).toEqual({});
  });

  it("sends a typed-in worker under Other, and drops student details for non-students", () => {
    const input = contactInput({ ...filled, workerId: OTHER_WORKER, workerOther: "Pastor Tope", school: "UI" });
    expect(input).toMatchObject({ name: "Chinedu Okeke", workerName: "Pastor Tope", isStudent: false });
    expect(input).not.toHaveProperty("workerMemberId");
    expect(input).not.toHaveProperty("school");
  });

  it("shows +234 numbers the way people read them", () => {
    expect(displayPhone("+2348031234567")).toBe("0803 123 4567");
  });
});

describe("Growth & Outreach routing", () => {
  it("recognises the department and the Evangelism unit by name", () => {
    expect(isGrowthOutreachDepartment("Growth & Outreach")).toBe(true);
    expect(isGrowthOutreachDepartment("Growth and Outreach")).toBe(true);
    expect(isGrowthOutreachDepartment("Membership and Assimilation")).toBe(false);
    expect(isEvangelismUnit("Evangelism Team")).toBe(true);
    expect(isEvangelismUnit("Outreach Team")).toBe(false);
  });
});
